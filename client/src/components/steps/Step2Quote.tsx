import { useEffect, useState, useRef } from "react";
import { api } from "../../api/client";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import type { LeadFormData, Quote, LoanScheme } from "../../types";

interface Props {
  formData: LeadFormData;
  onChange: (data: Partial<LeadFormData>) => void;
  selectedQuote: Quote | null;
  onSelectQuote: (quote: Quote) => void;
  onNext: () => void;
  onBack: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

function QuoteSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="bg-gray-100 rounded-2xl h-44" />
      ))}
    </div>
  );
}

function QuoteCard({
  quote,
  selected,
  onSelect,
}: {
  quote: Quote;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card selected={selected} onClick={onSelect} className="p-5 relative overflow-hidden">
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="mb-3">
        <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
          {quote.schemeName}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-0.5">Eligible Loan Amount</p>
        <p className="text-3xl font-extrabold text-amber-700">₹{fmt(quote.eligibleLoan)}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-gray-500">Interest Rate</span>
          <p className="font-semibold text-gray-800">{quote.interestRatePA}% p.a.</p>
        </div>
        <div>
          <span className="text-gray-500">LTV Used</span>
          <p className="font-semibold text-gray-800">{(quote.effectiveLtv * 100).toFixed(0)}%</p>
        </div>
        <div>
          <span className="text-gray-500">Tenure</span>
          <p className="font-semibold text-gray-800">{quote.tenureMonths} months</p>
        </div>
        {quote.emi ? (
          <div>
            <span className="text-gray-500">Monthly EMI</span>
            <p className="font-semibold text-green-700">₹{fmt(quote.emi)}</p>
          </div>
        ) : (
          <div>
            <span className="text-gray-500">Total at Maturity</span>
            <p className="font-semibold text-gray-800">₹{fmt(quote.totalRepayment)}</p>
          </div>
        )}
        <div>
          <span className="text-gray-500">Total Interest</span>
          <p className="font-semibold text-gray-800">₹{fmt(quote.totalInterest)}</p>
        </div>
        <div>
          <span className="text-gray-500">Gold Value</span>
          <p className="font-semibold text-gray-800">₹{fmt(quote.goldValue)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        Pure gold: <strong>{quote.pureGoldGrams}g</strong> @ ₹{fmt(quote.goldRate24k)}/g (24K)
      </div>
    </Card>
  );
}

export function Step2Quote({ formData, onChange, selectedQuote, onSelectQuote, onNext, onBack }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [schemes, setSchemes] = useState<LoanScheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch schemes once
  useEffect(() => {
    api.get<{ data: LoanScheme[] }>("/loan-schemes").then((r) => setSchemes(r.data.data));
  }, []);

  // Debounced quote fetch whenever inputs change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const net = parseFloat(formData.netWeightGrams);
      const karat = parseInt(formData.karat || "0", 10);
      if (!net || !karat || isNaN(net)) return;

      setLoading(true);
      setError(null);
      try {
        const activeSchemes = schemes.length ? schemes : (await api.get<{ data: LoanScheme[] }>("/loan-schemes")).data.data;
        const results = await Promise.all(
          activeSchemes.map((s) =>
            api
              .post<{ data: Quote }>("/quotes", {
                netWeightGrams: net,
                karat,
                schemeId: s.id,
              })
              .then((r) => r.data.data)
          )
        );
        setQuotes(results);
        // Auto-select first if nothing selected
        if (!selectedQuote && results.length > 0) {
          onSelectQuote(results[0]);
          onChange({ schemeId: results[0].schemeId });
        }
      } catch {
        setError("Failed to load quotes. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.netWeightGrams, formData.karat, schemes.length]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Your Loan Quote</h2>
        <p className="text-sm text-gray-500 mt-1">Select a plan that suits you best.</p>
      </div>

      {/* Summary chip */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { label: "Net weight", value: `${formData.netWeightGrams}g` },
          { label: "Gross weight", value: `${formData.grossWeightGrams}g` },
          { label: "Karat", value: `${formData.karat}K` },
        ].map((item) => (
          <span key={item.label} className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium">
            {item.label}: {item.value}
          </span>
        ))}
      </div>

      {loading && <QuoteSkeleton />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && quotes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quotes.map((q) => (
            <QuoteCard
              key={q.schemeId}
              quote={q}
              selected={selectedQuote?.schemeId === q.schemeId}
              onSelect={() => {
                onSelectQuote(q);
                onChange({ schemeId: q.schemeId });
              }}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedQuote}
          size="lg"
        >
          Continue to Review →
        </Button>
      </div>
    </div>
  );
}
