const styles = {
  Urgent: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  High: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Low: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

export default function PriorityBadge({ priority, size = "md" }) {
  const sizeStyles =
    size === "lg"
      ? "px-3 py-1.5 text-xs gap-2"
      : "px-2.5 py-1 text-[11px] gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide ${sizeStyles} ${
        styles[priority] || "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}