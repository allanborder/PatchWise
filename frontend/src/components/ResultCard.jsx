import PriorityBadge from "./PriorityBadge";
import SignalBreakdown from "./SignalBreakdown";
import AskAboutVulnerability from "./AskAboutVulnerability";

function Chip({label, value, tone='neutral'}){
  const toneClasses = {
    neutral: 'bg-slate-100 text-slate-800',
    positive: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700'
  };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone] || toneClasses.neutral}`}>
      <strong className="text-[11px]">{label}</strong>
      <span className="opacity-90">{value}</span>
    </span>
  )
}

export default function ResultCard({ result, rank, orgId, plainMode }) {
  // compact card
  const topFactors = (result.why_it_matters || []).slice(0,3);
  const exposure = result.matched_context?.exposure || 'n/a';
  const importance = result.matched_context?.importance || 'normal';

  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-400">{String(rank).padStart(2,'0')}</span>
          <PriorityBadge priority={result.priority} size="md" />
          <div className="ml-1">
            <div className="text-lg font-bold text-slate-900">{result.priority_score}</div>
            <div className="text-[11px] text-slate-400">Priority</div>
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-xs text-slate-400">{result.cve_id}</p>
          <p className="text-sm font-semibold text-slate-700">{plainMode ? result.plain_language_title : result.title}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Affected</p>
          <p className="text-sm font-semibold text-slate-800">{result.matched_context?.product}</p>
          <p className="text-xs text-slate-500">{result.matched_context?.service} · {exposure} · {importance}</p>
        </div>

        <div className="flex gap-2">
          {topFactors.map((f) => (
            <Chip key={f.signal} label={f.signal.toUpperCase()} value={`${f.weight}`} tone={f.weight > 20 ? 'danger' : f.weight > 5 ? 'warning' : 'neutral'} />
          ))}
        </div>
      </div>

      {/* Business Context - compact three columns */}
      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-md bg-slate-50 p-2">
          <div className="font-semibold text-[11px] text-slate-700">WHY US?</div>
          <ul className="mt-1 space-y-1 text-slate-600">
            <li>• {result.matched_context?.service}</li>
            <li>• {result.matched_context?.product}</li>
            <li>• Importance: {importance}</li>
          </ul>
        </div>
        <div className="rounded-md bg-slate-50 p-2">
          <div className="font-semibold text-[11px] text-slate-700">WHY NOW?</div>
          <ul className="mt-1 space-y-1 text-slate-600">
            { (result.why_it_matters || []).slice(0,3).map((s, i) => (
              <li key={i}>• {s.detail}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md bg-slate-50 p-2">
          <div className="font-semibold text-[11px] text-slate-700">WHAT NEXT?</div>
          <ul className="mt-1 space-y-1 text-slate-600">
            <li>• {result.next_step}</li>
            <li>• Confidence: {result.confidence}</li>
          </ul>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-600">{plainMode ? result.plain_language_impact : result.potential_impact}</div>
        <div className="flex items-center gap-3">
          <a href={result.source.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline">{result.source.name}</a>
        </div>
      </div>

      <div className="mt-3">
        <AskAboutVulnerability cveId={result.cve_id} orgId={orgId} productName={result.matched_context?.product} />
      </div>
    </article>
  );
}