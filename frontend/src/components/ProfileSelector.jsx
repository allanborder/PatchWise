import { useEffect, useState, useRef } from "react";
import { fetchProfiles } from "../api/fetchToprank";

function dominantSignal(weights) {
  if (!weights) return null;
  const labels = {
    cvss_weight: "raw CVSS severity",
    cisa_kev_weight: "confirmed exploitation (KEV)",
    first_epss_weight: "near-term exploitation probability (EPSS)",
    exposure_weight: "internet exposure",
    importance_critical_weight: "service importance",
    importance_high_weight: "service importance",
  };
  const [topKey] = Object.entries(weights).sort((a, b) => b[1] - a[1])[0] || [];
  return labels[topKey] || null;
}

function describeChange(prev, next) {
  if (!prev || !next || prev.org_id === next.org_id) return null;

  const changes = [];

  if (prev.exposure !== next.exposure) {
    changes.push(`treats exposure as ${next.exposure.replace("-", " ")} (was ${prev.exposure.replace("-", " ")})`);
  }
  if (prev.importance !== next.importance) {
    changes.push(`marks this service '${next.importance}' importance (was '${prev.importance}')`);
  }

  const prevSignal = dominantSignal(prev.weight_modifiers);
  const nextSignal = dominantSignal(next.weight_modifiers);
  if (prevSignal && nextSignal && prevSignal !== nextSignal) {
    changes.push(`weighs ${nextSignal} most heavily (was ${prevSignal})`);
  }

  if (changes.length === 0) return null;
  return `${next.name} ${changes.join("; ")}.`;
}

export default function ProfileSelector({ selectedId, onChange }) {
  const [profiles, setProfiles] = useState([]);
  const [changeNote, setChangeNote] = useState(null);
  const prevProfileRef = useRef(null);

  useEffect(() => {
    fetchProfiles().then(setProfiles).catch(console.error);
  }, []);

  const selected = profiles.find((p) => p.org_id === selectedId);

  useEffect(() => {
    if (!selected) return;
    const note = describeChange(prevProfileRef.current, selected);
    setChangeNote(note);
    prevProfileRef.current = selected;
  }, [selectedId, profiles]);

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-500">
        Protecting
      </p>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {selected ? (
            <>
              <h2 className="truncate text-3xl font-bold text-slate-900">
                {selected.name}
              </h2>
              <p className="mt-1.5 text-base text-slate-500">
                {selected.sector}
                {selected.exposure && selected.importance && (
                  <span className="text-slate-400">
                    {" "}· {selected.exposure} · {selected.importance} importance
                  </span>
                )}
              </p>
            </>
          ) : (
            <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
          )}
        </div>

        <div className="relative w-full sm:w-[26rem]">
          <select
            value={selectedId}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[#e7d2bc]/60 bg-[#f6ecdf] px-4 py-3 pr-10 text-base font-semibold text-[#452615] outline-none transition focus:border-[#452615] focus:bg-[#faf3ea] focus:ring-4 focus:ring-[#452615]/10"
          >
            {profiles.map((p) => (
              <option key={p.org_id} value={p.org_id}>
                {p.name} — {p.sector}
                {p.exposure && p.importance ? ` (${p.exposure}, ${p.importance})` : ""}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#452615]/50"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {changeNote && (
        <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">
          Different weighting: {changeNote}
        </p>
      )}
    </div>
  );
}