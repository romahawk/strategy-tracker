import { Image } from "lucide-react";
import { Card } from "../ui/Card";

const inputBase =
  "w-full h-8 rounded-lg bg-th-raised border border-th-border-dim px-3 text-sm text-th-text placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

export default function ChartSection({ form, onChange }) {
  return (
    <Card variant="passive" className="p-2">
      <div className="flex items-center gap-2 mb-2">
        <Image className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-th-text">Chart</h3>
      </div>

      <input
        type="text"
        name="screenshot"
        value={form.screenshot || ""}
        onChange={onChange}
        placeholder="https://..."
        className={inputBase}
      />

      <p className="text-[10px] text-th-text-muted mt-1">
        Paste direct image URL or external link.
      </p>
    </Card>
  );
}
