import { useState } from "react";

const GLOSSARY = {
  CVE: "A public case number for one specific software vulnerability. Think of it as a case ID.",
  CVSS: "Technical severity score from 0–10. It measures how bad the flaw is in general — it doesn't know anything about your organisation specifically.",
  KEV: "Short for CISA's Known Exploited Vulnerabilities list. If a CVE is on it, attackers are already using it in real attacks right now — not just theoretically possible.",
  EPSS: "An estimate of the probability this CVE will be exploited somewhere in the next 30 days, based on real-world attack data. Higher = more likely to be targeted soon.",
  exposure: "Whether this system can be reached from the public internet (internet-facing) or only from inside your network (internal). Internet-facing systems are easier for attackers to reach.",
  importance: "How critical this service is to your organisation's operations. A flaw in a critical system deserves more urgency than the same flaw in a low-value test system.",
};

export default function GlossaryTerm({ term, children }) {
  const [open, setOpen] = useState(false);
  const definition = GLOSSARY[term];

  if (!definition) return <>{children}</>;

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="border-b border-dotted border-slate-400 text-inherit outline-none"
      >
        {children}
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-5 text-white shadow-lg">
          {definition}
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
        </span>
      )}
    </span>
  );
}