import { useEffect } from "react";
import { X } from "lucide-react";

const TITLES = {
  guide: "Guide",
  tools: "Tools",
  journal: "Journal",
  profile: "Profile",
};

export default function RightSidePanel({ open, activeTab, onClose }) {
  // ESC to close + scroll lock
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={[
        "fixed inset-0 z-[80]",
        "transition-opacity duration-200",
        open ? "opacity-100" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      {/* backdrop */}
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
      />

      {/* panel */}
      <aside
        className={[
          "absolute right-0 top-0 h-full",
          "w-[460px] max-w-[94vw]",
          "bg-th-base/95 backdrop-blur-xl",
          "border-l border-th-border",
          "shadow-[-32px_0_80px_rgba(0,0,0,0.65)]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-th-border">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-th-text/45">
              {TITLES[activeTab] || "Panel"}
            </div>
            <div className="text-base font-semibold text-th-text/90 leading-tight">
              {TITLES[activeTab]}
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-th-hl/5 hover:bg-th-hl/10 border border-th-border grid place-items-center transition"
            title="Close (Esc)"
          >
            <X className="w-4 h-4 text-th-text/80" />
          </button>
        </div>

        {/* content */}
        <div className="p-5 space-y-4 text-th-text/80">
          <div className="rounded-2xl border border-th-border bg-th-hl/[0.03] p-4">
            <div className="text-sm font-semibold mb-1">
              Placeholder
            </div>
            <div className="text-sm text-th-text/60 leading-relaxed">
              Content for{" "}
              <span className="text-th-text/85 font-medium">
                {TITLES[activeTab]}
              </span>{" "}
              will be added later.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
