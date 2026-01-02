import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  New: "bg-blue-100 text-blue-700 border-blue-200",
  Processing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Traveled: "bg-purple-100 text-purple-700 border-purple-200",
  Returned: "bg-orange-100 text-orange-700 border-orange-200",
  Paid: "bg-green-100 text-green-700 border-green-200",
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
