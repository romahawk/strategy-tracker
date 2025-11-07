import { Image } from "lucide-react";

export default function ChartSection({ form, onChange }) {
  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-4">
        <Image className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-100">Chart</h3>
      </div>
      <input
        type="text"
        name="screenshot"
        value={form.screenshot || ""}
        onChange={onChange}
        placeholder="https://..."
        className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
      />
      <p className="text-[10px] text-slate-500 mt-2">
        Paste direct chart image URL or external link.
      </p>
    </div>
  );
}
