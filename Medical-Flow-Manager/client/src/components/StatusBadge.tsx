import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  New: "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Traveled: "bg-purple-100 text-purple-700 border-purple-200",
  "Paid Deposit": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Finish Treatment": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Come Back": "bg-orange-100 text-orange-700 border-orange-200",
  "Bill Collect": "bg-red-100 text-red-700 border-red-200",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "status-badge inline-flex items-center",
        statusStyles[status] || "bg-gray-100 text-gray-700 border-gray-200",
        className
      )}
    >
      {status}
    </span>
  );
}
