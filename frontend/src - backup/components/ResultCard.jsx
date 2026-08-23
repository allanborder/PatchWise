import PriorityBadge from "./PriorityBadge";

export default function ResultCard({ result }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 mb-4 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <PriorityBadge priority={result.priority} />
        <span className="text-xs text-slate-400">{result.cve_id}</span>
      </div>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">{result.title}</h3>

      <div className="text-sm text-slate-600 mb-3">
        <span className="font-medium">Affects:</span> {result.matched_context.product} ·{" "}
        {result.matched_context.service} · {result.matched_context.exposure} ·{" "}
        {result.matched_context.importance}
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Why it matters</p>
        <ul className="text-sm text-slate-700 list-disc list-inside space-y-0.5">
          {result.why_it_matters.map((f, i) => (
            <li key={i}>{f.detail}</li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-slate-700 mb-3">
        <span className="font-semibold">Potential impact:</span> {result.potential_impact}
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Next step:</span> {result.next_step}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Confidence: {result.confidence} ({result.confidence_reason})</span>
        <a href={result.source.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
          Source: {result.source.name}
        </a>
      </div>
    </div>
  );
}