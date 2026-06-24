// Shared Types for the Loan Approval Wizard

export interface FormState {
  // Step 1 - Personal
  gender: 'Male' | 'Female' | '';
  married: 'Yes' | 'No' | '';
  dependents: '0' | '1' | '2' | '3+' | '';
  education: 'Graduate' | 'Not Graduate' | '';

  // Step 2 - Employment
  selfEmployed: 'Yes' | 'No' | '';
  applicantIncome: string;
  coapplicantIncome: string;

  // Step 3 - Loan Details
  loanAmount: string;
  loanAmountTerm: string;
  creditHistory: '1' | '0' | '';
  propertyArea: 'Urban' | 'Semiurban' | 'Rural' | '';
}

export interface PredictionResult {
  approved: boolean;
  label: string;
  probability_approved: number;
  probability_rejected: number;
  threshold_used: number;
  feature_contributions: Record<string, number>;
  bias_note: string;
}

export type WizardStep = 1 | 2 | 3 | 4;

export type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: string }
  | { type: 'RESET' };

export const INITIAL_FORM_STATE: FormState = {
  gender: '',
  married: '',
  dependents: '',
  education: '',
  selfEmployed: '',
  applicantIncome: '',
  coapplicantIncome: '',
  loanAmount: '',
  loanAmountTerm: '',
  creditHistory: '',
  propertyArea: '',
};

// Human-readable labels for feature contributions
export const FEATURE_LABELS: Record<string, string> = {
  Credit_History: 'Credit history',
  ApplicantIncome: 'Applicant income',
  TotalIncome: 'Total household income',
  LoanAmount: 'Loan amount',
  Loan_Income_Ratio: 'Loan-to-income ratio',
  CoapplicantIncome: 'Co-applicant income',
  Loan_Amount_Term: 'Loan term length',
  Dependents: 'Number of dependents',
  Education: 'Education level',
  Married: 'Marital status',
  Self_Employed: 'Self-employment status',
  Gender: 'Gender',
  Property_Area_Semiurban: 'Semi-urban property area',
  Property_Area_Urban: 'Urban property area',
};
