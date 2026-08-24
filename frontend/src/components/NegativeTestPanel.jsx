import { motion } from "framer-motion";

export default function NegativeTestPanel({ negativeTest }) {
  return (
    <motion.section
      className="relative mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
            Explainability check
          </p>
        </div>

        <h2 className="mt-3 text-lg font-bold text-white sm:text-xl">
          Why severity alone isn't enough
        </h2>

        {negativeTest ? (
          <>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              This vulnerability scored higher on raw severity than anything in your
              top 5 — and was still excluded, because it doesn't affect a system this
              organisation runs.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm text-white">{negativeTest.cve_id}</span>
                <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
                  CVSS {negativeTest.cvss_base_score}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {negativeTest.exclusion_reason}
              </p>
              {negativeTest.priority && (
                <p className="mt-2 text-xs text-slate-500">
                  Would have scored {negativeTest.priority_score} ({negativeTest.priority}) if it applied to this organisation
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm leading-6 text-slate-300">
              No vulnerability with CVSS 9.0 or higher was found outside this
              organisation's matched systems in the current dataset — so there's
              nothing to exclude on severity grounds for this profile.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              This is an honest result, not a missing feature — the check runs on
              every profile load and reports what it actually finds.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}