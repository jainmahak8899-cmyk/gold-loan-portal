import { CheckCircle } from "lucide-react";
import { Button } from "./ui/Button";
import type { SubmitResult } from "../types";

interface Props {
  result: SubmitResult;
  onReset: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function SuccessScreen({ result, onReset }: Props) {
  return (
    <div className="flex flex-col items-center text-center py-6 space-y-6 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-ping opacity-20" />
        <CheckCircle className="relative w-20 h-20 text-green-500" strokeWidth={1.5} />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-gray-800">Application Submitted!</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Congratulations, <strong>{result.name.split(" ")[0]}</strong>! Your gold loan application has been received.
        </p>
      </div>

      {/* Application ID box */}
      <div className="w-full max-w-xs bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 space-y-1">
        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Application ID</p>
        <p className="text-2xl font-black tracking-widest text-amber-800 font-mono">
          {result.applicationId}
        </p>
        <p className="text-xs text-gray-500">Save this for future reference</p>
      </div>

      {/* Loan summary */}
      <div className="w-full max-w-xs bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Loan Amount</span>
          <span className="font-bold text-amber-700">₹{fmt(result.quote.eligibleLoan)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Scheme</span>
          <span className="font-semibold">{result.quote.schemeName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {result.status}
          </span>
        </div>
      </div>

      {/* Next steps */}
      <div className="w-full max-w-xs bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 text-left space-y-1.5">
        <p className="font-bold text-blue-800 mb-2">What happens next?</p>
        <p>📞 Our team will call you within <strong>24 hours</strong></p>
        <p>📍 Visit our nearest branch with your gold and ID proof</p>
        <p>✅ Loan disbursed same day after verification</p>
      </div>

      <Button onClick={onReset} variant="secondary" size="lg">
        Apply for Another Loan
      </Button>
    </div>
  );
}
