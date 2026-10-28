import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = "", ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-gray-800 text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400
          placeholder:text-gray-400
          ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-amber-400"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">⚠ {error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, hint, id, options, className = "", ...props }: SelectProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        id={inputId}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-gray-800 text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400
          ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-amber-400"}
          ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">⚠ {error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
