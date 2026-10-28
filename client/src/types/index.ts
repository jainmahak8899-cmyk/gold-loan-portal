export interface LoanScheme {
  id: string;
  name: string;
  interestRatePA: number;
  maxLtv: number;
  tenureMonths: number;
  description: string;
  active: boolean;
}

export interface Quote {
  schemeId: string;
  schemeName: string;
  pureGoldGrams: number;
  goldValue: number;
  eligibleLoan: number;
  interestRatePA: number;
  tenureMonths: number;
  emi: number | null;
  totalInterest: number;
  totalRepayment: number;
  effectiveLtv: number;
  goldRate24k: number;
}

export interface LeadFormData {
  name: string;
  mobile: string;
  grossWeightGrams: string;
  netWeightGrams: string;
  karat: "18" | "22" | "24" | "";
  schemeId: string;
}

export interface Lead {
  _id: string;
  applicationId: string;
  name: string;
  mobile: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  schemeId: string;
  quote: Quote;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SubmitResult {
  applicationId: string;
  name: string;
  mobile: string;
  schemeId: string;
  quote: Quote;
  status: string;
  createdAt: string;
}
