import { useState } from "react";
import { Input, Select } from "../ui/Input";
import { Button } from "../ui/Button";
import type { LeadFormData } from "../../types";

interface Props {
  formData: LeadFormData;
  onChange: (data: Partial<LeadFormData>) => void;
  onNext: () => void;
}

type Errors = Partial<Record<keyof LeadFormData, string>>;
type Touched = Partial<Record<keyof LeadFormData, boolean>>;

function validate(data: LeadFormData): Errors {
  const errors: Errors = {};
  if (!data.name.trim() || data.name.trim().length < 2)
    errors.name = "Name must be at least 2 characters";
  else if (data.name.trim().length > 60)
    errors.name = "Name cannot exceed 60 characters";
  else if (!/^[a-zA-Z\s.'\-]+$/.test(data.name))
    errors.name = "Only letters, spaces, . ' - allowed";

  if (!data.mobile) errors.mobile = "Mobile number is required";
  else if (!/^[6-9]\d{9}$/.test(data.mobile))
    errors.mobile = "Enter a valid 10-digit Indian mobile (starts with 6-9)";

  const gross = parseFloat(data.grossWeightGrams);
  if (!data.grossWeightGrams) errors.grossWeightGrams = "Gross weight is required";
  else if (isNaN(gross) || gross <= 0) errors.grossWeightGrams = "Must be a positive number";
  else if (gross > 1000) errors.grossWeightGrams = "Cannot exceed 1000g";

  const net = parseFloat(data.netWeightGrams);
  if (!data.netWeightGrams) errors.netWeightGrams = "Net weight is required";
  else if (isNaN(net) || net <= 0) errors.netWeightGrams = "Must be a positive number";
  else if (net > 1000) errors.netWeightGrams = "Cannot exceed 1000g";
  else if (!isNaN(gross) && net > gross)
    errors.netWeightGrams = "Net weight cannot exceed gross weight";

  if (!data.karat) errors.karat = "Please select karat purity";

  return errors;
}

export function Step1Details({ formData, onChange, onNext }: Props) {
  const [touched, setTouched] = useState<Touched>({});

  const errors = validate(formData);
  const hasErrors = Object.keys(errors).length > 0;

  const touch = (field: keyof LeadFormData) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const touchAll = () => {
    const all: Touched = {};
    (Object.keys(formData) as (keyof LeadFormData)[]).forEach((k) => (all[k] = true));
    setTouched(all);
  };

  const handleNext = () => {
    touchAll();
    if (!hasErrors) onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Your Details</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about yourself and your gold.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Priya Sharma"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            onBlur={() => touch("name")}
            error={touched.name ? errors.name : undefined}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Mobile Number"
            required
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            value={formData.mobile}
            onChange={(e) => onChange({ mobile: e.target.value.replace(/\D/g, "") })}
            onBlur={() => touch("mobile")}
            error={touched.mobile ? errors.mobile : undefined}
            hint="10-digit number starting with 6, 7, 8, or 9"
          />
        </div>

        <Input
          label="Gross Weight (grams)"
          required
          type="number"
          placeholder="e.g. 22.5"
          min="0"
          max="1000"
          step="0.01"
          value={formData.grossWeightGrams}
          onChange={(e) => onChange({ grossWeightGrams: e.target.value })}
          onBlur={() => touch("grossWeightGrams")}
          error={touched.grossWeightGrams ? errors.grossWeightGrams : undefined}
          hint="Total weight including any ornament metal"
        />

        <Input
          label="Net Gold Weight (grams)"
          required
          type="number"
          placeholder="e.g. 20.0"
          min="0"
          max="1000"
          step="0.01"
          value={formData.netWeightGrams}
          onChange={(e) => onChange({ netWeightGrams: e.target.value })}
          onBlur={() => touch("netWeightGrams")}
          error={touched.netWeightGrams ? errors.netWeightGrams : undefined}
          hint="Pure gold weight after removing stones etc."
        />

        <div className="sm:col-span-2">
          <Select
            label="Gold Purity (Karat)"
            required
            value={formData.karat}
            onChange={(e) => onChange({ karat: e.target.value as LeadFormData["karat"] })}
            onBlur={() => touch("karat")}
            error={touched.karat ? errors.karat : undefined}
            options={[
              { value: "", label: "— Select Karat —" },
              { value: "18", label: "18 Karat (75% purity)" },
              { value: "22", label: "22 Karat (91.6% purity) — Hallmark Jewellery" },
              { value: "24", label: "24 Karat (99.9% purity) — Pure Gold" },
            ]}
          />
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
        <span className="text-lg leading-none">💡</span>
        <p>
          Current 24K gold rate: <strong>₹7,000/g</strong> (mock rate). Net weight must be ≤ gross weight. Max 1000g per application.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleNext} size="lg">
          Next: View Quote →
        </Button>
      </div>
    </div>
  );
}
