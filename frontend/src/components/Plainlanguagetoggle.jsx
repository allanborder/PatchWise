export default function PlainLanguageToggle({ plainMode, onToggle }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-[#e7d2bc]/80">
        {plainMode ? "Plain language" : "Technical"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={plainMode}
        onClick={() => onToggle(!plainMode)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          plainMode ? "bg-[#e7d2bc]" : "bg-[#5a3420]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full shadow transition-transform ${
            plainMode ? "translate-x-5 bg-[#452615]" : "translate-x-0.5 bg-[#f5ead9]"
          }`}
        />
      </button>
    </div>
  );
}