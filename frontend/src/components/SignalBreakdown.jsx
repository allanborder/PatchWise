import GlossaryTerm from "./GlossaryTerm";

const LABELS = {
  cvss: "CVSS",
  cisa_kev: "KEV",
  in_kev: "KEV",
  first_epss: "EPSS",
  epss: "EPSS",
  exposure: "Exposure",
  importance: "Importance",
  critical_product: "Critical system",
};

const SHORT_DETAIL = {
  in_kev: "Confirmed",
  epss: (s) => s.detail.match(/[\d.]+%/)?.[0] || s.detail,
  cvss: (s) => s.detail.replace("CVSS ", ""),
};

function shortDetail(s) {
  const short = SHORT_DETAIL[s.signal];
  if (typeof short === "function") return short(s);
  if (typeof short === "string") return short;
  return s.detail;
}

export default function SignalBreakdown({ signals, totalScore, cveId }) {
  const weighted = signals.filter((s) => s.weight > 0);
  const unweighted = signals.filter((s) => s.weight <= 0);
  const computedTotal =
    totalScore ?? weighted.reduce((sum, s) => sum + s.weight, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {weighted.map((s, i) => {
          const label = LABELS[s.signal] || s.signal;
          return (
            <div
              key={i}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-1">
                <GlossaryTerm term={label}>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </span>
                </GlossaryTerm>
                <span className="text-[10px] font-bold text-emerald-600">
                  +{s.weight}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-800">
                {shortDetail(s)}
              </p>
            </div>
          );
        })}
      </div>

      {unweighted.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-2">
          {unweighted.map((s, i) => {
            const label = LABELS[s.signal] || s.signal;
            return (
              <p key={i} className="text-xs text-slate-400">
                <GlossaryTerm term={label}>
                  <span className="font-semibold text-slate-500">{label}:</span>
                </GlossaryTerm>{" "}
                {s.detail}
              </p>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span className="text-xs font-semibold text-slate-500">
          Total priority score
        </span>
        <span className="text-xs font-bold text-slate-900">
          {computedTotal.toFixed(1)}
        </span>
      </div>

      {cveId && (
        <p className="text-[11px] text-slate-300">
          Traceable in audit log — {cveId}
        </p>
      )}
    </div>
  );
}