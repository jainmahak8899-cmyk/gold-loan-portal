import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  PORT: Number(process.env.PORT) || 3000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/goldloan",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
};

export const GOLD_RATE_24K = 7000; // Rs per gram (mocked)

export const LOAN_SCHEMES = [
  {
    id: "bullet",
    name: "Bullet Repayment",
    interestRatePA: 12,
    maxLtv: 0.70,
    tenureMonths: 12,
    description: "Pay full principal + interest at end of tenure. Simple and stress-free.",
    active: true,
  },
  {
    id: "emi",
    name: "Monthly EMI",
    interestRatePA: 10.5,
    maxLtv: 0.75,
    tenureMonths: 12,
    description: "Spread repayment across 12 equal monthly installments. Lower interest rate.",
    active: true,
  },
] as const;

export type SchemeId = (typeof LOAN_SCHEMES)[number]["id"];
