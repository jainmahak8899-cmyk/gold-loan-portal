type BadgeVariant = "submitted" | "under_review" | "approved" | "rejected" | "default";

const variantMap: Record<BadgeVariant, string> = {
  submitted: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  under_review: "bg-blue-100 text-blue-800 border border-blue-200",
  approved: "bg-green-100 text-green-800 border border-green-200",
  rejected: "bg-red-100 text-red-800 border border-red-200",
  default: "bg-gray-100 text-gray-700 border border-gray-200",
};

interface BadgeProps {
  status: string;
  className?: string;
}

export function Badge({ status, className = "" }: BadgeProps) {
  const key = status.toLowerCase().replace(" ", "_") as BadgeVariant;
  const cls = variantMap[key] ?? variantMap.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls} ${className}`}>
      {status.replace("_", " ")}
    </span>
  );
}
