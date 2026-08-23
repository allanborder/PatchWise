export default function NegativeTestPanel({ negativeTest }) {
  if (!negativeTest) return null;
  return (
    <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 mt-6">
      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
        Excluded despite high severity
      </p>
      <p className="text-sm text-slate-700">
        <span className="font-mono">{negativeTest.cve_id}</span> — CVSS {negativeTest.cvss_score} —{" "}
        {negativeTest.reason_excluded}
      </p>
    </div>
  );
}