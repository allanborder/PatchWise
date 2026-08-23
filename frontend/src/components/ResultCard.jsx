import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PriorityBadge from "./PriorityBadge";
import SignalBreakdown from "./SignalBreakdown";
import AskAboutVulnerability from "./AskAboutVulnerability";
import AnimatedNumber from "./AnimatedNumber";

const CHIP_LABELS = {
  cvss: "CVSS",
  cisa_kev: "KEV",
  in_kev: "KEV",
  first_epss: "EPSS",
  epss: "EPSS",
  exposure: "Exposure",
  importance: "Importance",
  critical_product: "Critical",
};

// Pull the real signal value out of `detail` (e.g. "CVSS 7.5" -> "7.5",
// "82.5% estimated..." -> "82.5%") instead of showing the internal weight.
function chipValue(f) {
  if (f.signal === "in_kev" || f.signal === "cisa_kev") return "Confirmed";
  const percentMatch = f.detail.match(/[\d.]+%/);
  if (percentMatch) return percentMatch[0];
  const cvssMatch = f.detail.match(/CVSS\s+([\d.]+)/i);
  if (cvssMatch) return cvssMatch[1];
  return f.detail;
}

function Chip({ label, value, tone = "neutral" }) {
  const toneClasses = {
    neutral: "bg-slate-100 text-slate-800",
    positive: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone] || toneClasses.neutral}`}>
      <strong className="text-[11px]">{label}</strong>
      <span className="opacity-90">{value}</span>
    </span>
  );
}

export default function ResultCard({ result, rank, orgId, plainMode, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const topFactors = (result.why_it_matters || [])
    .filter((f) => f.weight > 0)
    .slice(0, 3);
  const exposure = result.matched_context?.exposure || "n/a";
  const importance = result.matched_context?.importance || "normal";
  const title = plainMode ? result.plain_language_title : result.title;

  return (
    <motion.article
      className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Header row - always visible, click to toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-400">{String(rank).padStart(2, "0")}</span>
          <PriorityBadge priority={result.priority} size="md" />
          <div className="ml-1">
            <div className="text-lg font-bold text-slate-900">
              <AnimatedNumber value={result.priority_score} />
            </div>
            <div className="text-[11px] text-slate-400">Priority</div>
          </div>
        </div>

        <div className="flex items-start gap-3 text-right">
          <div>
            <p className="font-mono text-xs text-slate-400">{result.cve_id}</p>
            <p className="text-sm font-semibold text-slate-700">{title}</p>
          </div>
          <motion.svg
            className="mt-1 h-4 w-4 shrink-0 text-slate-400"
            viewBox="0 0 20 20"
            fill="none"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Affected</p>
                  <p className="text-sm font-semibold text-slate-800">{result.matched_context?.product}</p>
                  <p className="text-xs text-slate-500">{result.matched_context?.service} · {exposure} · {importance}</p>
                </div>

                <div className="flex gap-2">
                  {topFactors.map((f) => (
                    <Chip
                      key={f.signal}
                      label={CHIP_LABELS[f.signal] || f.signal.toUpperCase()}
                      value={chipValue(f)}
                      tone={f.weight > 20 ? "danger" : f.weight > 5 ? "warning" : "neutral"}
                    />
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
                    {(result.why_it_matters || []).slice(0, 3).map((s, i) => (
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

              {/* Full signal breakdown */}
              <details className="mt-3 rounded-md border border-slate-100">
                <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                  View full calculation
                </summary>
                <div className="border-t border-slate-100 px-3 py-3">
                  <SignalBreakdown
                    signals={result.why_it_matters}
                    totalScore={result.priority_score}
                    cveId={result.cve_id}
                  />
                </div>
              </details>

              <div className="mt-3">
                <AskAboutVulnerability cveId={result.cve_id} orgId={orgId} productName={result.matched_context?.product} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
