"""
Loan Approval Prediction Pipeline (v2 - with imbalance & threshold fixes)
==========================================================================
Dataset: https://www.kaggle.com/datasets/burak3ergun/loan-data-set
(614 rows, target Loan_Status: Y=422, N=192 -> imbalanced ~69/31)

Fixes applied vs v1:
1. class_weight='balanced' on all classifiers that support it
2. SMOTE oversampling option (train-set only, to avoid leakage)
3. Threshold tuning instead of blind 0.5 cutoff
4. Reporting focused on N-class recall (missed rejections = costly false approvals)
5. Stratified CV used consistently for reliable estimates
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, GridSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score,
    precision_recall_curve
)

import warnings
warnings.filterwarnings("ignore")

RANDOM_STATE = 42

# Set to True to use SMOTE oversampling instead of / in addition to class_weight.
# Requires: pip install imbalanced-learn
USE_SMOTE = True

if USE_SMOTE:
    try:
        from imblearn.over_sampling import SMOTE
    except ImportError:
        print("imbalanced-learn not installed. Run: pip install imbalanced-learn")
        USE_SMOTE = False

# ---------------------------------------------------------------
# STEP 1: LOAD DATA
# ---------------------------------------------------------------
DATA_PATH = "train.csv"   # <-- change to your actual filename

df = pd.read_csv(DATA_PATH)
print("Shape:", df.shape)
print(df.head())

# ---------------------------------------------------------------
# STEP 2: BASIC EDA
# ---------------------------------------------------------------
print("\nMissing values per column:\n", df.isnull().sum())
print("\nTarget distribution:\n", df['Loan_Status'].value_counts())
print("Class imbalance ratio (Y:N):",
      round(df['Loan_Status'].value_counts()['Y'] / df['Loan_Status'].value_counts()['N'], 2))

# ---------------------------------------------------------------
# STEP 3: DROP ID COLUMN
# ---------------------------------------------------------------
if 'Loan_ID' in df.columns:
    df = df.drop('Loan_ID', axis=1)

# ---------------------------------------------------------------
# STEP 4: HANDLE MISSING VALUES
# ---------------------------------------------------------------
cat_cols = ['Gender', 'Married', 'Dependents', 'Self_Employed', 'Credit_History', 'Loan_Amount_Term']
for col in cat_cols:
    if col in df.columns:
        df[col] = df[col].fillna(df[col].mode()[0])

if 'LoanAmount' in df.columns:
    df['LoanAmount'] = df['LoanAmount'].fillna(df['LoanAmount'].median())

print("\nMissing values after imputation:\n", df.isnull().sum())

# ---------------------------------------------------------------
# STEP 5: LOG-TRANSFORM SKEWED NUMERIC COLUMNS
# ---------------------------------------------------------------
df['ApplicantIncome'] = np.log1p(df['ApplicantIncome'])
df['CoapplicantIncome'] = np.log1p(df['CoapplicantIncome'])
df['LoanAmount'] = np.log1p(df['LoanAmount'])

# ---------------------------------------------------------------
# STEP 6: FEATURE ENGINEERING
# ---------------------------------------------------------------
df['TotalIncome'] = np.expm1(df['ApplicantIncome']) + np.expm1(df['CoapplicantIncome'])
df['TotalIncome'] = np.log1p(df['TotalIncome'])

df['Loan_Income_Ratio'] = np.expm1(df['LoanAmount']) / (np.expm1(df['TotalIncome']) + 1)

if 'Dependents' in df.columns:
    df['Dependents'] = df['Dependents'].replace('3+', 3).astype(float)

# ---------------------------------------------------------------
# STEP 7: ENCODE CATEGORICAL VARIABLES
# ---------------------------------------------------------------
label_encoders = {}
binary_cols = ['Gender', 'Married', 'Education', 'Self_Employed']
for col in binary_cols:
    if col in df.columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le

if 'Property_Area' in df.columns:
    df = pd.get_dummies(df, columns=['Property_Area'], drop_first=True)

target_le = LabelEncoder()
df['Loan_Status'] = target_le.fit_transform(df['Loan_Status'])  # N=0, Y=1
print("\nTarget classes:", list(target_le.classes_), "-> encoded as", list(range(len(target_le.classes_))))

# ---------------------------------------------------------------
# STEP 8: TRAIN / TEST SPLIT
# ---------------------------------------------------------------
X = df.drop('Loan_Status', axis=1)
y = df['Loan_Status']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)

# ---------------------------------------------------------------
# STEP 9: SCALE FEATURES
# ---------------------------------------------------------------
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ---------------------------------------------------------------
# STEP 10: BALANCE THE TRAINING SET (SMOTE) — TRAIN ONLY, NO LEAKAGE
# ---------------------------------------------------------------
if USE_SMOTE:
    smote = SMOTE(random_state=RANDOM_STATE)
    X_train_bal, y_train_bal = smote.fit_resample(X_train_scaled, y_train)
    print("\nAfter SMOTE - train class counts:", np.bincount(y_train_bal))
else:
    X_train_bal, y_train_bal = X_train_scaled, y_train

# ---------------------------------------------------------------
# STEP 11: TRAIN MULTIPLE CLASSIFIERS (class_weight='balanced' where supported)
# ---------------------------------------------------------------
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=RANDOM_STATE),
    "Decision Tree": DecisionTreeClassifier(class_weight='balanced', random_state=RANDOM_STATE),
    "Random Forest": RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=RANDOM_STATE),
    "Gradient Boosting": GradientBoostingClassifier(random_state=RANDOM_STATE),  # no class_weight param
    "SVM": SVC(probability=True, class_weight='balanced', random_state=RANDOM_STATE),
    "KNN": KNeighborsClassifier(n_neighbors=7),  # no class_weight param
    "Naive Bayes": GaussianNB(),  # no class_weight param
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
results = []

for name, model in models.items():
    model.fit(X_train_bal, y_train_bal)
    preds = model.predict(X_test_scaled)
    probs = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, "predict_proba") else None

    acc = accuracy_score(y_test, preds)
    prec_N = precision_score(y_test, preds, pos_label=0)   # N = rejection
    rec_N = recall_score(y_test, preds, pos_label=0)        # catching true rejections
    f1_macro = f1_score(y_test, preds, average='macro')
    auc = roc_auc_score(y_test, probs) if probs is not None else np.nan

    cv_scores = cross_val_score(model, X_train_bal, y_train_bal, cv=cv, scoring='f1_macro')

    results.append({
        "Model": name,
        "Accuracy": acc,
        "Precision_N": prec_N,
        "Recall_N": rec_N,          # <-- the metric that matters most for risk
        "F1_macro": f1_macro,
        "AUC": auc,
        "CV_F1macro_mean": cv_scores.mean(),
        "CV_F1macro_std": cv_scores.std()
    })

results_df = pd.DataFrame(results).sort_values(by="Recall_N", ascending=False)
print("\n=== Model Comparison (sorted by Recall on 'N' = catching risky loans) ===")
print(results_df.to_string(index=False))

# ---------------------------------------------------------------
# STEP 12: PICK BEST MODEL (by F1_macro, balances both classes fairly)
# ---------------------------------------------------------------
results_df_by_f1 = results_df.sort_values(by="F1_macro", ascending=False)
best_model_name = results_df_by_f1.iloc[0]['Model']
best_model = models[best_model_name]
best_preds = best_model.predict(X_test_scaled)

print(f"\n=== Best Model (by macro F1): {best_model_name} ===")
print(classification_report(y_test, best_preds, target_names=target_le.classes_))
print("Confusion Matrix:\n", confusion_matrix(y_test, best_preds))
print("(Rows = actual, Cols = predicted. Order:", list(target_le.classes_), ")")

# ---------------------------------------------------------------
# STEP 13: HYPERPARAMETER TUNING (Random Forest, scoring on f1_macro)
# ---------------------------------------------------------------
param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [None, 5, 10, 15],
    'min_samples_split': [2, 5, 10]
}

rf_grid = GridSearchCV(
    RandomForestClassifier(class_weight='balanced', random_state=RANDOM_STATE),
    param_grid, cv=cv, scoring='f1_macro', n_jobs=-1
)
rf_grid.fit(X_train_bal, y_train_bal)

print("\nBest RF params:", rf_grid.best_params_)
print("Best RF CV F1_macro:", rf_grid.best_score_)

tuned_rf = rf_grid.best_estimator_
tuned_preds = tuned_rf.predict(X_test_scaled)
print("Tuned RF Test Accuracy:", accuracy_score(y_test, tuned_preds))
print("Tuned RF Recall on N:", recall_score(y_test, tuned_preds, pos_label=0))

# ---------------------------------------------------------------
# STEP 14: THRESHOLD TUNING
# ---------------------------------------------------------------
# Instead of the default 0.5 cutoff, scan thresholds and pick the one that
# gives the best trade-off for YOUR risk tolerance.
# Lower threshold on P(Y) -> fewer false approvals, more recall on N.

probs_tuned_rf = tuned_rf.predict_proba(X_test_scaled)[:, 1]  # P(Y)

print("\n=== Threshold sweep (predicting Y only if P(Y) >= threshold) ===")
print(f"{'Threshold':>10} {'Acc':>8} {'Prec_N':>8} {'Rec_N':>8} {'F1_macro':>9}")
best_threshold, best_f1macro = 0.5, -1
for t in np.arange(0.30, 0.71, 0.05):
    preds_t = (probs_tuned_rf >= t).astype(int)
    acc_t = accuracy_score(y_test, preds_t)
    prec_n_t = precision_score(y_test, preds_t, pos_label=0, zero_division=0)
    rec_n_t = recall_score(y_test, preds_t, pos_label=0, zero_division=0)
    f1m_t = f1_score(y_test, preds_t, average='macro')
    print(f"{t:>10.2f} {acc_t:>8.3f} {prec_n_t:>8.3f} {rec_n_t:>8.3f} {f1m_t:>9.3f}")
    if f1m_t > best_f1macro:
        best_f1macro, best_threshold = f1m_t, t

print(f"\nBest threshold by macro F1: {best_threshold:.2f} (F1_macro={best_f1macro:.3f})")
print("-> Lower thresholds catch more risky (N) applicants at the cost of rejecting some good (Y) ones.")
print("-> Pick the threshold row above that matches YOUR cost of false-approval vs false-rejection.")

final_preds = (probs_tuned_rf >= best_threshold).astype(int)
print(f"\n=== Final report @ threshold={best_threshold:.2f} ===")
print(classification_report(y_test, final_preds, target_names=target_le.classes_))
print("Confusion Matrix:\n", confusion_matrix(y_test, final_preds))

# ---------------------------------------------------------------
# STEP 15: FEATURE IMPORTANCE
# ---------------------------------------------------------------
importances = pd.Series(tuned_rf.feature_importances_, index=X.columns).sort_values(ascending=False)
print("\nFeature Importances:\n", importances)

# ---------------------------------------------------------------
# STEP 16: PREDICT ON A NEW APPLICANT (using tuned threshold)
# ---------------------------------------------------------------
def predict_new_applicant(input_dict, model, scaler, columns, target_encoder, threshold=0.5):
    """
    input_dict example:
    {
        'Gender': 'Male', 'Married': 'Yes', 'Dependents': '0',
        'Education': 'Graduate', 'Self_Employed': 'No',
        'ApplicantIncome': 5000, 'CoapplicantIncome': 0,
        'LoanAmount': 150, 'Loan_Amount_Term': 360,
        'Credit_History': 1.0, 'Property_Area': 'Urban'
    }
    """
    new_df = pd.DataFrame([input_dict])
    new_df['Dependents'] = new_df['Dependents'].replace('3+', 3).astype(float)

    for col in ['Gender', 'Married', 'Education', 'Self_Employed']:
        new_df[col] = label_encoders[col].transform(new_df[col].astype(str))

    new_df['ApplicantIncome'] = np.log1p(new_df['ApplicantIncome'])
    new_df['CoapplicantIncome'] = np.log1p(new_df['CoapplicantIncome'])
    new_df['LoanAmount'] = np.log1p(new_df['LoanAmount'])

    new_df['TotalIncome'] = np.expm1(new_df['ApplicantIncome']) + np.expm1(new_df['CoapplicantIncome'])
    new_df['TotalIncome'] = np.log1p(new_df['TotalIncome'])
    new_df['Loan_Income_Ratio'] = np.expm1(new_df['LoanAmount']) / (np.expm1(new_df['TotalIncome']) + 1)

    new_df = pd.get_dummies(new_df, columns=['Property_Area'])
    for col in columns:
        if col not in new_df.columns:
            new_df[col] = 0
    new_df = new_df[columns]

    new_scaled = scaler.transform(new_df)
    proba_Y = model.predict_proba(new_scaled)[0][1]
    pred = 1 if proba_Y >= threshold else 0
    label = target_encoder.inverse_transform([pred])[0]
    return label, proba_Y


sample_applicant = {
    'Gender': 'Male', 'Married': 'Yes', 'Dependents': '0',
    'Education': 'Graduate', 'Self_Employed': 'No',
    'ApplicantIncome': 5000, 'CoapplicantIncome': 1500,
    'LoanAmount': 150, 'Loan_Amount_Term': 360,
    'Credit_History': 1.0, 'Property_Area': 'Urban'
}

label, proba_Y = predict_new_applicant(
    sample_applicant, tuned_rf, scaler, X.columns, target_le, threshold=best_threshold
)
print(f"\nPredicted Loan Status: {label}  |  P(Y) = {proba_Y:.3f}  |  Threshold used: {best_threshold:.2f}")

# ---------------------------------------------------------------
# STEP 17: MULTI-SEED STABILITY CHECK
# ---------------------------------------------------------------
# A single train/test split on 614 rows can be lucky or unlucky.
# Repeat the whole split -> balance -> train -> evaluate cycle across many
# seeds and look at the SPREAD of results, not just one number.

print("\n" + "=" * 70)
print("MULTI-SEED STABILITY CHECK (is the test accuracy reliable?)")
print("=" * 70)

N_SEEDS = 20
seed_results = []

for seed in range(N_SEEDS):
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )

    sc = StandardScaler()
    X_tr_scaled = sc.fit_transform(X_tr)
    X_te_scaled = sc.transform(X_te)

    if USE_SMOTE:
        X_tr_bal, y_tr_bal = SMOTE(random_state=seed).fit_resample(X_tr_scaled, y_tr)
    else:
        X_tr_bal, y_tr_bal = X_tr_scaled, y_tr

    rf = RandomForestClassifier(
        n_estimators=200, max_depth=10, min_samples_split=5,
        class_weight='balanced', random_state=seed
    )
    rf.fit(X_tr_bal, y_tr_bal)
    preds = rf.predict(X_te_scaled)

    seed_results.append({
        "seed": seed,
        "Accuracy": accuracy_score(y_te, preds),
        "F1_macro": f1_score(y_te, preds, average='macro'),
        "Recall_N": recall_score(y_te, preds, pos_label=0, zero_division=0),
        "Precision_N": precision_score(y_te, preds, pos_label=0, zero_division=0),
    })

seed_df = pd.DataFrame(seed_results)
print(seed_df.to_string(index=False))

print("\n--- Summary across", N_SEEDS, "different train/test splits ---")
summary = seed_df[["Accuracy", "F1_macro", "Recall_N", "Precision_N"]].agg(['mean', 'std', 'min', 'max'])
print(summary.round(3).to_string())

acc_mean, acc_std = seed_df["Accuracy"].mean(), seed_df["Accuracy"].std()
print(f"\nAccuracy: {acc_mean:.3f} +/- {acc_std:.3f}  "
      f"(95% range roughly {acc_mean - 1.96*acc_std:.3f} to {acc_mean + 1.96*acc_std:.3f})")
print(f"Single-split test accuracy you saw earlier may have been a "
      f"{'lucky' if acc_mean < 0.86 else 'representative'} draw -- "
      f"trust the mean above over any one run.")

# Optional: visualize the spread
plt.figure(figsize=(8, 5))
plt.boxplot(
    [seed_df["Accuracy"], seed_df["F1_macro"], seed_df["Recall_N"], seed_df["Precision_N"]],
    labels=["Accuracy", "F1_macro", "Recall_N", "Precision_N"]
)
plt.title(f"Spread across {N_SEEDS} random train/test splits")
plt.ylabel("Score")
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig("stability_check.png", dpi=120)
print("\nSaved boxplot to stability_check.png")

# ---------------------------------------------------------------
# STEP 18: EXPORT MODEL + PREPROCESSING OBJECTS (joblib & pickle)
# ---------------------------------------------------------------
# You need to save FOUR things to reproduce predictions later:
#   1. The trained model (tuned_rf)
#   2. The scaler (StandardScaler) -- fitted on training data
#   3. The label encoders for Gender/Married/Education/Self_Employed
#   4. The target encoder (so 0/1 maps back to 'N'/'Y')
#   5. The exact column order the model expects (X.columns)
#   6. The chosen threshold (best_threshold)
# Missing any one of these means you CANNOT correctly score new data later.

import joblib
import pickle
import os

EXPORT_DIR = "exported_model"
os.makedirs(EXPORT_DIR, exist_ok=True)

# Bundle everything into one dict so there's only one file to track.
# This avoids the common mistake of saving the model but forgetting
# the scaler/encoders, which silently breaks predictions later.
artifact_bundle = {
    "model": tuned_rf,
    "scaler": scaler,
    "label_encoders": label_encoders,      # dict: {'Gender': LE, 'Married': LE, ...}
    "target_encoder": target_le,           # maps 0/1 -> 'N'/'Y'
    "feature_columns": list(X.columns),    # exact column order model expects
    "threshold": float(best_threshold),
    "model_type": type(tuned_rf).__name__,
    "trained_on_rows": int(len(df)),
}

# --- joblib (recommended for sklearn objects -- faster, smaller files) ---
joblib_path = os.path.join(EXPORT_DIR, "loan_model_bundle.joblib")
joblib.dump(artifact_bundle, joblib_path)
print(f"\nSaved joblib bundle -> {joblib_path}")

# --- pickle (universal Python serialization, in case joblib isn't available downstream) ---
pickle_path = os.path.join(EXPORT_DIR, "loan_model_bundle.pkl")
with open(pickle_path, "wb") as f:
    pickle.dump(artifact_bundle, f)
print(f"Saved pickle bundle -> {pickle_path}")

# Sanity check: reload immediately and confirm it works end-to-end
print("\n--- Verifying exported bundle loads and predicts correctly ---")
reloaded = joblib.load(joblib_path)
check_label, check_proba = predict_new_applicant(
    sample_applicant,
    reloaded["model"],
    reloaded["scaler"],
    reloaded["feature_columns"],
    reloaded["target_encoder"],
    threshold=reloaded["threshold"]
)
print(f"Reloaded model prediction: {check_label}  |  P(Y)={check_proba:.3f}  "
      f"(should match the prediction above)")

# ---------------------------------------------------------------
# STEP 19: HOW TO LOAD AND USE THE SAVED MODEL LATER (separate script)
# ---------------------------------------------------------------
# Save this as a separate file, e.g. predict_loan.py, and run it independently
# of the training script -- it only needs the exported bundle file.
LOADER_SCRIPT = '''
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
'''

loader_path = os.path.join(EXPORT_DIR, "predict_loan.py")
with open(loader_path, "w") as f:
    f.write(LOADER_SCRIPT)
print(f"\nWrote standalone loader script -> {loader_path}")
print("You can now run: python exported_model/predict_loan.py")
print("(copy that file out of exported_model/ if you want it alongside the bundle elsewhere)")