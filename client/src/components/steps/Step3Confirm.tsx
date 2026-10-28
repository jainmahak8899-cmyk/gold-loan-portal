import { useState } from "react";
import { api } from "../../api/client";
import { Button } from "../ui/Button";
import type { LeadFormData, Quote, SubmitResult } from "../../types";
import { SuccessScreen } from "../SuccessScreen";
import axios from "axios";

interface Props {
  formData: LeadFormData;
  selectedQuote: Quote;
  onBack: () => void;
  onReset: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right max-w-[55%]">{value}</span>
    </div>
  );
}

export function Step3Confirm({ formData, selectedQuote, onBack, onReset }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setConflictId(null);
    try {
      const res = await api.post<SubmitResult>("/leads", {
        name: formData.name.trim(),
        mobile: formData.mobile,
        grossWeightGrams: parseFloat(formData.grossWeightGrams),
        netWeightGrams: parseFloat(formData.netWeightGrams),
        karat: parseInt(formData.karat as string, 10),
        schemeId: formData.schemeId,
      });
      setResult(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setConflictId(err.response.data?.applicationId ?? null);
          setError(
            err.response.data?.message ||
              "An application already exists for this mobile number within the last 7 days."
          );
        } else {
          const detail = err.response?.data?.details?.[0]?.message || err.response?.data?.error;
          setError(detail || "Something went wrong. Please try again.");
        }
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <SuccessScreen result={result} onReset={onReset} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Review & Submit</h2>
        <p className="text-sm text-gray-500 mt-1">Please verify the details before submitting.</p>
      </div>

      {/* Personal details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Applicant</h3>
        <Row label="Full Name" value={formData.name} />
        <Row label="Mobile" value={`${formData.mobile.slice(0, 4)}XXXX${formData.mobile.slice(-2)}`} />
      </div>

      {/* Gold details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Gold Details</h3>
        <Row label="Gross Weight" value={`${formData.grossWeightGrams}g`} />
        <Row label="Net Weight" value={`${formData.netWeightGrams}g`} />
        <Row label="Karat Purity" value={`${formData.karat}K`} />
        <Row label="Pure Gold" value={`${selectedQuote.pureGoldGrams}g`} />
        <Row label="Gold Value" value={`₹${fmt(selectedQuote.goldValue)}`} />
      </div>

      {/* Loan details */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
        <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Loan Offer</h3>
        <Row label="Scheme" value={selectedQuote.schemeName} />
        <Row label="Eligible Loan" value={`₹${fmt(selectedQuote.eligibleLoan)}`} />
        <Row label="Interest Rate" value={`${selectedQuote.interestRatePA}% p.a.`} />
        <Row label="Tenure" value={`${selectedQuote.tenureMonths} months`} />
        {selectedQuote.emi && (
          <Row label="Monthly EMI" value={`₹${fmt(selectedQuote.emi)}`} />
        )}
        <Row label="Total Interest" value={`₹${fmt(selectedQuote.totalInterest)}`} />
        <Row label="Total Repayment" value={`₹${fmt(selectedQuote.totalRepayment)}`} />
      </div>

      {/* Conflict error */}
      {error && (
        <div className={`rounded-xl p-4 text-sm border ${conflictId ? "bg-yellow-50 border-yellow-300 text-yellow-800" : "bg-red-50 border-red-200 text-red-700"}`}>
          <p className="font-semibold mb-1">{conflictId ? "⚠ Existing Application Found" : "❌ Submission Failed"}</p>
          <p>{error}</p>
          {conflictId && (
            <p className="mt-2 font-mono bg-yellow-100 inline-block px-2 py-1 rounded text-yellow-900">
              Application ID: {conflictId}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        By submitting, you agree to our Terms & Conditions. Our team will contact you within 24 hours.
      </p>

      <div className="flex gap-3 justify-between pt-1">
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          ← Back
        </Button>
        <Button onClick={handleSubmit} loading={loading} size="lg">
          Submit Application
        </Button>
      </div>
    </div>
  );
}
