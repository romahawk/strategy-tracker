// src/components/navbar/RightNavCluster.jsx
import { BookOpen, Wrench, NotebookPen, UserRound } from "lucide-react";

const ITEMS = [
  { key: "guide", label: "Guide", Icon: BookOpen },
  { key: "tools", label: "Tools", Icon: Wrench },
  { key: "journal", label: "Journal", Icon: NotebookPen },
  { key: "profile", label: "Profile", Icon: UserRound },
];

export default function RightNavCluster({ active, onOpen }) {
  return (
    // single-line, vertically centered by the navbar container itself
    <div className="inline-flex items-center gap-0">
      {ITEMS.map(({ key, label, Icon }, idx) => {
        const isActive = active === key;

        return (
          <span key={key} className="inline-flex items-center">
            <button
              onClick={() => onOpen(key)}
              className={[
                "inline-flex items-center justify-center",
                "h-8 w-8", // smaller to match navbar rhythm
                "rounded-md", // less bubbly, more “control”
                "transition-all",
                "hover:bg-th-hl/8",
                isActive
                  ? "bg-th-cta/10 shadow-[0_0_16px_rgba(0,255,163,0.22)]"
                  : "bg-transparent",
              ].join(" ")}
              title={label}
              aria-label={label}
            >
              <Icon
                className={[
                  "w-4 h-4",
                  isActive ? "text-th-cta" : "text-th-text/75",
                ].join(" ")}
              />
            </button>

            {/* divider */}
            {idx < ITEMS.length - 1 && (
              <span
                aria-hidden="true"
                className="mx-2 h-4 w-px bg-th-hl/12"
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
