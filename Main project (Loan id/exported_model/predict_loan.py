
"""
predict_loan.py
Standalone script to load the exported model and score a new applicant.
Run this AFTER training.py has produced exported_model/loan_model_bundle.joblib
"""
import joblib
import numpy as np
import pandas as pd

bundle = joblib.load("exported_model/loan_model_bundle.joblib")
model = bundle["model"]
scaler = bundle["scaler"]
label_encoders = bundle["label_encoders"]
target_encoder = bundle["target_encoder"]
feature_columns = bundle["feature_columns"]
threshold = bundle["threshold"]


def predict_new_applicant(input_dict):
    new_df = pd.DataFrame([input_dict])
    new_df["Dependents"] = new_df["Dependents"].replace("3+", 3).astype(float)

    for col in ["Gender", "Married", "Education", "Self_Employed"]:
        new_df[col] = label_encoders[col].transform(new_df[col].astype(str))

    new_df["ApplicantIncome"] = np.log1p(new_df["ApplicantIncome"])
    new_df["CoapplicantIncome"] = np.log1p(new_df["CoapplicantIncome"])
    new_df["LoanAmount"] = np.log1p(new_df["LoanAmount"])

    new_df["TotalIncome"] = np.expm1(new_df["ApplicantIncome"]) + np.expm1(new_df["CoapplicantIncome"])
    new_df["TotalIncome"] = np.log1p(new_df["TotalIncome"])
    new_df["Loan_Income_Ratio"] = np.expm1(new_df["LoanAmount"]) / (np.expm1(new_df["TotalIncome"]) + 1)

    new_df = pd.get_dummies(new_df, columns=["Property_Area"])
    for col in feature_columns:
        if col not in new_df.columns:
            new_df[col] = 0
    new_df = new_df[feature_columns]

    new_scaled = scaler.transform(new_df)
    proba_Y = model.predict_proba(new_scaled)[0][1]
    pred = 1 if proba_Y >= threshold else 0
    label = target_encoder.inverse_transform([pred])[0]
    return label, proba_Y


if __name__ == "__main__":
    applicant = {
        "Gender": "Male", "Married": "Yes", "Dependents": "0",
        "Education": "Graduate", "Self_Employed": "No",
        "ApplicantIncome": 5000, "CoapplicantIncome": 1500,
        "LoanAmount": 150, "Loan_Amount_Term": 360,
        "Credit_History": 1.0, "Property_Area": "Urban"
    }
    label, proba = predict_new_applicant(applicant)
    print(f"Predicted Loan Status: {label}  |  P(Y) = {proba:.3f}  |  threshold={threshold:.2f}")
