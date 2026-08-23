import { useState } from "react";
import ResultCard from "./ResultCard";

export default function ResultsList({ results, orgId, plainMode }) {
  const [expanded, setExpanded] = useState(results?.[0]?.cve_id || null);

  return (
    <div className="flex flex-col gap-3">
      {results.map((r, i) => {
        const isExpanded = expanded === r.cve_id;

        if (i === 0 || isExpanded) {
          return (
            <div key={r.cve_id} className="relative">
              <ResultCard result={r} rank={i + 1} orgId={orgId} plainMode={plainMode} />
              {isExpanded && i !== 0 && (
                <button
                  onClick={() => setExpanded(null)}
                  className="absolute right-3 top-3 rounded-md bg-white/80 px-2 py-1 text-xs text-slate-700 shadow"
                >
                  Collapse
                </button>
              )}
            </div>
          );
        }

        return (
          <div
            key={r.cve_id}
            onClick={() => setExpanded(r.cve_id)}
            className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-white p-3 shadow-sm hover:shadow-md"
          >
            <div>
              <div className="text-sm font-semibold text-slate-800">{r.cve_id} — {r.title}</div>
              <div className="text-xs text-slate-500">{r.matched_context?.product} · {r.matched_context?.service}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900">{r.priority_score}</div>
              <div className="text-xs text-slate-400">{r.priority}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}