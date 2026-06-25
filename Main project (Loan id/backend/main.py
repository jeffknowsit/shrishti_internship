"""
Loan Approval Predictor — FastAPI Backend
=========================================
Loads the pre-trained model bundle (exported_model/loan_model_bundle.joblib)
and exposes a single POST /predict endpoint plus GET /health.

Bias fixes applied (v2):
  1. STRICT_THRESHOLD = 0.65 — only approve if model is >=65% confident.
     The bundle's tuned threshold (~0.5) was optimised for F1_macro on a
     SMOTE-balanced dataset, so it approves too many borderline cases.
     Raising to 0.65 means the model must be clearly confident to approve.
  2. Demographic features (Gender, Married, Dependents, Education) are fixed
     to their training-set majority class before prediction, so those fields
     no longer influence the score — decisions are based solely on:
       Income · Loan amount · Credit history · Property area · Loan term

Run with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging
import pickle
import time
from pathlib import Path
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# 1. BUNDLE LOADING — done once at module level, not per-request
# ---------------------------------------------------------------------------
BUNDLE_DIR = Path(__file__).resolve().parent.parent / "exported_model"

# Stricter threshold: require >=65% approval confidence to approve.
# The model was trained with SMOTE + class_weight='balanced' which inflates
# approval probability for borderline applicants. A higher cutoff corrects this.
STRICT_THRESHOLD: float = 0.65

# Majority-class values used to neutralise demographic features.
# These match the most frequent values in the Kaggle loan dataset so the
# label-encoders produce a valid (non-exception-raising) input, but because
# all applicants get the same neutral value, demographics contribute 0 net
# difference to the relative prediction between applicants.
NEUTRAL_GENDER     = "Male"       # majority in training set (489/614)
NEUTRAL_MARRIED    = "Yes"        # majority in training set
NEUTRAL_DEPENDENTS = "0"          # majority in training set
NEUTRAL_EDUCATION  = "Graduate"   # majority in training set


def load_bundle() -> dict:
    joblib_path = BUNDLE_DIR / "loan_model_bundle.joblib"
    pkl_path = BUNDLE_DIR / "loan_model_bundle.pkl"
    try:
        return joblib.load(joblib_path)
    except Exception as joblib_err:
        try:
            with open(pkl_path, "rb") as f:
                return pickle.load(f)
        except Exception as pkl_err:
            raise RuntimeError(
                f"Failed to load model bundle.\n"
                f"  joblib error: {joblib_err}\n"
                f"  pickle error: {pkl_err}"
            )


try:
    bundle: dict = load_bundle()
    _model = bundle["model"]
    _scaler = bundle["scaler"]
    _label_encoders: dict = bundle["label_encoders"]
    _target_encoder = bundle["target_encoder"]
    _feature_columns: list[str] = bundle["feature_columns"]
    # We deliberately ignore bundle["threshold"] and use STRICT_THRESHOLD instead.
    _bundle_threshold: float = float(bundle["threshold"])
    MODEL_LOADED = True
except Exception as _load_exc:
    MODEL_LOADED = False
    _load_exc_msg = str(_load_exc)

# ---------------------------------------------------------------------------
# 2. FASTAPI APP + CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Loan Approval Predictor API",
    description=(
        "Serves predictions from a pre-trained Random Forest model. "
        "Demographic features are neutralised to ensure unbiased, "
        "finance-only evaluation."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logger setup
logger = logging.getLogger("uvicorn.error")

# Middleware for logging requests/connections
@app.middleware("http")
async def log_connections(request: Request, call_next):
    client_host = request.client.host if request.client else "unknown"
    client_port = request.client.port if request.client else "unknown"
    log_msg = f"--> Incoming connection from {client_host}:{client_port} - {request.method} {request.url.path}"
    print(log_msg, flush=True)
    logger.info(log_msg)
    start_time = time.time()
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        completion_msg = f"<-- Completed connection: {request.method} {request.url.path} - Status: {response.status_code} - Time: {duration:.4f}s"
        print(completion_msg, flush=True)
        logger.info(completion_msg)
        return response
    except Exception as exc:
        duration = time.time() - start_time
        err_msg = f"X-- Connection failed: {request.method} {request.url.path} - Error: {exc} - Time: {duration:.4f}s"
        print(err_msg, flush=True)
        logger.error(err_msg)
        raise exc

# ---------------------------------------------------------------------------
# 3. PYDANTIC MODELS
# ---------------------------------------------------------------------------


class ApplicantInput(BaseModel):
    gender: Literal["Male", "Female"]
    married: Literal["Yes", "No"]
    dependents: Literal["0", "1", "2", "3+"]
    education: Literal["Graduate", "Not Graduate"]
    self_employed: Literal["Yes", "No"]
    applicant_income: float = Field(gt=0, description="Monthly income of applicant")
    coapplicant_income: float = Field(ge=0, description="Monthly income of co-applicant (0 if none)")
    loan_amount: float = Field(gt=0, description="Requested loan amount in thousands")
    loan_amount_term: float = Field(gt=0, description="Loan repayment term in months")
    credit_history: Literal[0, 1]
    property_area: Literal["Urban", "Semiurban", "Rural"]

    model_config = {"json_schema_extra": {
        "example": {
            "gender": "Male",
            "married": "Yes",
            "dependents": "0",
            "education": "Graduate",
            "self_employed": "No",
            "applicant_income": 5000,
            "coapplicant_income": 1500,
            "loan_amount": 150,
            "loan_amount_term": 360,
            "credit_history": 1,
            "property_area": "Urban",
        }
    }}


class PredictionResponse(BaseModel):
    approved: bool
    label: str                              # "Y" or "N"
    probability_approved: float             # P(Y), 0–1
    probability_rejected: float             # P(N), 0–1
    threshold_used: float                   # STRICT_THRESHOLD (0.65)
    feature_contributions: dict[str, float] # financial features only
    bias_note: str                          # explains what was neutralised


# ---------------------------------------------------------------------------
# 4. PREPROCESSING — financial-only, demographic features neutralised
# ---------------------------------------------------------------------------

# Financial features shown in the result — excludes demographic-only features
FINANCIAL_FEATURES = {
    "ApplicantIncome",
    "CoapplicantIncome",
    "LoanAmount",
    "Loan_Amount_Term",
    "Credit_History",
    "TotalIncome",
    "Loan_Income_Ratio",
    "Property_Area_Semiurban",
    "Property_Area_Urban",
}


def preprocess(data: ApplicantInput) -> np.ndarray:
    """
    Replicates the EXACT preprocessing from training.py Steps 5-9,
    but substitutes neutral majority-class values for demographic columns
    (Gender, Married, Dependents, Education) so they contribute equally for
    all applicants and cannot introduce demographic bias into the score.

    Only financial signals drive the prediction:
      - ApplicantIncome, CoapplicantIncome, LoanAmount, Loan_Amount_Term
      - Credit_History, TotalIncome, Loan_Income_Ratio, Property_Area
    """
    raw = {
        # Demographic fields → fixed to majority class (bias neutralisation)
        "Gender":     NEUTRAL_GENDER,
        "Married":    NEUTRAL_MARRIED,
        "Dependents": NEUTRAL_DEPENDENTS,
        "Education":  NEUTRAL_EDUCATION,

        # Financial fields → from actual applicant input
        "Self_Employed":      data.self_employed,
        "ApplicantIncome":    float(data.applicant_income),
        "CoapplicantIncome":  float(data.coapplicant_income),
        "LoanAmount":         float(data.loan_amount),
        "Loan_Amount_Term":   float(data.loan_amount_term),
        "Credit_History":     float(data.credit_history),
        "Property_Area":      data.property_area,
    }

    df = pd.DataFrame([raw])

    # Step 1: Dependents "3+" → 3, cast to float (always 0 here due to neutral value)
    df["Dependents"] = df["Dependents"].replace("3+", 3).astype(float)

    # Step 2: Label-encode categorical binary columns
    for col in ["Gender", "Married", "Education", "Self_Employed"]:
        df[col] = _label_encoders[col].transform(df[col].astype(str))

    # Step 3: log1p transform on income/amount columns
    df["ApplicantIncome"] = np.log1p(df["ApplicantIncome"])
    df["CoapplicantIncome"] = np.log1p(df["CoapplicantIncome"])
    df["LoanAmount"] = np.log1p(df["LoanAmount"])

    # Step 4: TotalIncome = log1p(expm1(app) + expm1(coapp))
    df["TotalIncome"] = (
        np.expm1(df["ApplicantIncome"]) + np.expm1(df["CoapplicantIncome"])
    )
    df["TotalIncome"] = np.log1p(df["TotalIncome"])

    # Step 5: Loan_Income_Ratio
    df["Loan_Income_Ratio"] = np.expm1(df["LoanAmount"]) / (
        np.expm1(df["TotalIncome"]) + 1
    )

    # Step 6: One-hot encode Property_Area
    df = pd.get_dummies(df, columns=["Property_Area"])

    # Step 7: Reindex to exact feature_columns order, fill missing one-hot cols with 0
    for col in _feature_columns:
        if col not in df.columns:
            df[col] = 0
    df = df[_feature_columns]

    # Step 8: Scale
    scaled = _scaler.transform(df)
    return scaled


# ---------------------------------------------------------------------------
# 5. ENDPOINTS
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Utility"])
def health():
    """Returns service health and whether the model bundle loaded successfully."""
    if not MODEL_LOADED:
        return {"status": "degraded", "model_loaded": False, "error": _load_exc_msg}
    return {
        "status": "ok",
        "model_loaded": True,
        "strict_threshold": STRICT_THRESHOLD,
        "bundle_threshold": _bundle_threshold if MODEL_LOADED else None,
        "bias_mode": "demographic_neutralised",
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(payload: ApplicantInput):
    """
    Accepts applicant details and returns a strict, unbiased loan approval prediction.

    Bias controls applied:
    - Demographic features (Gender, Married, Dependents, Education) are neutralised
      to majority-class values so they have zero net effect on the prediction.
    - Decision threshold raised to 0.65 (vs ~0.5 from bundle) to reject borderline
      cases that a SMOTE-trained model tends to over-approve.
    """
    if not MODEL_LOADED:
        raise HTTPException(
            status_code=500,
            detail={"error": "Model bundle failed to load", "message": _load_exc_msg},
        )

    try:
        X_scaled = preprocess(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Preprocessing failed", "message": str(exc)},
        )

    try:
        probas = _model.predict_proba(X_scaled)[0]   # [P(N), P(Y)]
        classes = list(_target_encoder.classes_)
        y_idx = classes.index("Y")
        n_idx = classes.index("N")

        prob_approved = float(probas[y_idx])
        prob_rejected = float(probas[n_idx])

        # Apply strict threshold (not the bundle's lenient threshold)
        pred_int = 1 if prob_approved >= STRICT_THRESHOLD else 0
        label = _target_encoder.inverse_transform([pred_int])[0]
        approved = label == "Y"

        # Feature contributions — only financial features shown to the user
        importances = _model.feature_importances_
        feature_contributions = {
            feat: float(imp)
            for feat, imp in zip(_feature_columns, importances)
            if feat in FINANCIAL_FEATURES
        }

        bias_note = (
            "Evaluated on financial merit only. "
            "Gender, marital status, dependents, and education were neutralised "
            "to eliminate demographic influence. "
            f"Strict threshold: {STRICT_THRESHOLD:.0%} confidence required for approval."
        )

        return PredictionResponse(
            approved=approved,
            label=label,
            probability_approved=prob_approved,
            probability_rejected=prob_rejected,
            threshold_used=STRICT_THRESHOLD,
            feature_contributions=feature_contributions,
            bias_note=bias_note,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Prediction failed", "message": str(exc)},
        )


# ---------------------------------------------------------------------------
# Run with:
#   uvicorn main:app --reload --port 8000
# ---------------------------------------------------------------------------
