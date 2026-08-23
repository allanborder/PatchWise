const styles = {
  Urgent: "bg-red-600 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-400 text-slate-900",
  Low: "bg-slate-400 text-white",
};

export default function PriorityBadge({ priority }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[priority] || "bg-slate-300"}`}>
      {priority}
    </span>
  );
}