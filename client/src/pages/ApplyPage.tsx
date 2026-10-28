import { useState } from "react";
import { Step1Details } from "../components/steps/Step1Details";
import { Step2Quote } from "../components/steps/Step2Quote";
import { Step3Confirm } from "../components/steps/Step3Confirm";
import type { LeadFormData, Quote } from "../types";

const EMPTY_FORM: LeadFormData = {
  name: "",
  mobile: "",
  grossWeightGrams: "",
  netWeightGrams: "",
  karat: "",
  schemeId: "",
};

const STEP_LABELS = ["Details", "Quote", "Confirm"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                  ${done ? "bg-amber-600 border-amber-600 text-white"
                    : active ? "bg-white border-amber-600 text-amber-700 shadow-md shadow-amber-100"
                    : "bg-white border-gray-300 text-gray-400"}`}
              >
                {done ? "✓" : step}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-semibold whitespace-nowrap
                  ${active ? "text-amber-700" : done ? "text-amber-600" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`h-0.5 w-16 sm:w-24 mx-1 mb-5 rounded transition-all duration-300
                  ${done ? "bg-amber-500" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ApplyPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<LeadFormData>(EMPTY_FORM);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const updateForm = (data: Partial<LeadFormData>) =>
    setFormData((prev) => ({ ...prev, ...data }));

  const handleReset = () => {
    setStep(1);
    setFormData(EMPTY_FORM);
    setSelectedQuote(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-500 text-white py-10 px-4 text-center shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Get a Gold Loan in Minutes</h1>
        <p className="mt-2 text-amber-100 text-sm sm:text-base max-w-md mx-auto">
          Instant eligibility • Competitive rates from 10.5% p.a. • Same-day disbursal
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {["🔒 Secure", "⚡ Fast Approval", "💰 Up to 75% LTV", "📱 100% Online"].map((f) => (
            <span key={f} className="bg-white/20 backdrop-blur text-xs px-3 py-1.5 rounded-full font-medium">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-lg mx-auto px-4 mt-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-amber-100">
          <StepIndicator current={step} />

          {step === 1 && (
            <Step1Details
              formData={formData}
              onChange={updateForm}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2Quote
              formData={formData}
              onChange={updateForm}
              selectedQuote={selectedQuote}
              onSelectQuote={setSelectedQuote}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && selectedQuote && (
            <Step3Confirm
              formData={formData}
              selectedQuote={selectedQuote}
              onBack={() => setStep(2)}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
