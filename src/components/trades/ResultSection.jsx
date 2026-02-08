// src/components/trades/trades/ResultSection.jsx
import { useEffect } from "react";
import { BarChart3, Percent, DollarSign } from "lucide-react";
import { Card } from "../ui/Card";

const inputBase =
  "w-full h-8 rounded-lg bg-th-raised border border-th-border px-3 text-sm text-th-text " +
  "placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

const labelBase = "text-[11px] text-th-text-dim mb-1 block";

const EXCHANGES = [
  { group: "CEX", items: ["OKX", "BingX", "Bybit", "Binance"] },
  { group: "DEX", items: ["dYdX", "Hyperliquid"] },
];

// Editable templates (defaults only)
const DEFAULT_FEE_TEMPLATES = {
  OKX: { maker: 0.02, taker: 0.05 },
  BingX: { maker: 0.02, taker: 0.05 },
  Bybit: { maker: 0.02, taker: 0.055 },
  Binance: { maker: 0.02, taker: 0.04 },
  dYdX: { maker: 0.02, taker: 0.05 },
  Hyperliquid: { maker: 0.02, taker: 0.05 },
};

export default function ResultSection({ form, onChange }) {
  const resultValue = form.result || "Open";

  const exchange = form.exchange || "OKX";
  const entryFeeType = (form.entryFeeType || "taker").toLowerCase();
  const exitFeeType = (form.exitFeeType || "taker").toLowerCase();

  const tpsHit = form.tpsHit || "OPEN"; // OPEN | SL | 1 | 2 | 3
  const isSL = tpsHit === "SL";
  const isTP = tpsHit === "1" || tpsHit === "2" || tpsHit === "3";

  // Seed maker/taker % from template if empty
  useEffect(() => {
    const tpl = DEFAULT_FEE_TEMPLATES[exchange];
    if (!tpl) return;

    if (form.makerFeePct === "" || form.makerFeePct == null) {
      onChange({ target: { name: "makerFeePct", value: String(tpl.maker) } });
    }
    if (form.takerFeePct === "" || form.takerFeePct == null) {
      onChange({ target: { name: "takerFeePct", value: String(tpl.taker) } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchange]);

  // ✅ Auto-switch exit fee type:
  // - SL or Loss => taker
  // - TP + Win   => maker
  useEffect(() => {
    // SL implies taker exit
    if (isSL && exitFeeType !== "taker") {
      onChange({ target: { name: "exitFeeType", value: "taker" } });
      return;
    }

    // TP implies maker exit when win is selected
    if (isTP && resultValue === "Win" && exitFeeType !== "maker") {
      onChange({ target: { name: "exitFeeType", value: "maker" } });
      return;
    }

    // If user explicitly picks Loss (even if not SL), default exit to taker
    if (resultValue === "Loss" && exitFeeType !== "taker") {
      onChange({ target: { name: "exitFeeType", value: "taker" } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSL, isTP, resultValue]);

  const makerFeePct =
    form.makerFeePct !== undefined && form.makerFeePct !== ""
      ? form.makerFeePct
      : DEFAULT_FEE_TEMPLATES?.[exchange]?.maker ?? "";

  const takerFeePct =
    form.takerFeePct !== undefined && form.takerFeePct !== ""
      ? form.takerFeePct
      : DEFAULT_FEE_TEMPLATES?.[exchange]?.taker ?? "";

  const commissionAuto = form.commission ?? "";
  const commissionManual = form.commissionManual ?? "";

  return (
    <Card variant="passive" className="p-2">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-th-text">Result</h3>
      </div>

      <div className="grid gap-2">
        {/* ROW 1: Result | Exchange | Entry fee type | Exit fee type */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className={labelBase}>Result</label>
            <select
              name="result"
              value={resultValue}
              onChange={onChange}
              className={inputBase}
            >
              <option value="Open">Open</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="Break Even">Break Even</option>
            </select>
          </div>

          <div>
            <label className={labelBase}>Exchange</label>
            <select
              name="exchange"
              value={exchange}
              onChange={onChange}
              className={inputBase}
            >
              {EXCHANGES.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={labelBase}>Entry fee</label>
            <select
              name="entryFeeType"
              value={entryFeeType}
              onChange={onChange}
              className={inputBase}
            >
              <option value="maker">Maker</option>
              <option value="taker">Taker</option>
            </select>
          </div>

          <div>
            <label className={labelBase}>Exit fee</label>
            <select
              name="exitFeeType"
              value={exitFeeType}
              onChange={onChange}
              className={inputBase}
            >
              <option value="maker">Maker</option>
              <option value="taker">Taker</option>
            </select>
          </div>
        </div>

        {/* ROW 2: Maker% | Taker% | Commission auto | Commission manual */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className={labelBase}>
              <span className="inline-flex items-center gap-1">
                <Percent className="w-3 h-3" /> Maker %
              </span>
            </label>
            <input
              name="makerFeePct"
              value={makerFeePct}
              onChange={onChange}
              className={inputBase}
              placeholder="0.02"
              inputMode="decimal"
            />
          </div>

          <div>
            <label className={labelBase}>
              <span className="inline-flex items-center gap-1">
                <Percent className="w-3 h-3" /> Taker %
              </span>
            </label>
            <input
              name="takerFeePct"
              value={takerFeePct}
              onChange={onChange}
              className={inputBase}
              placeholder="0.05"
              inputMode="decimal"
            />
          </div>

          <div>
            <label className={labelBase}>
              <span className="inline-flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Comm $ (auto)
              </span>
            </label>
            <input
              name="commission"
              value={commissionAuto}
              readOnly
              className={inputBase + " bg-th-inset text-th-text-sub focus:ring-0"}
              placeholder="$"
              tabIndex={-1}
            />
          </div>

          <div>
            <label className={labelBase}>Comm $ (override)</label>
            <input
              name="commissionManual"
              value={commissionManual}
              onChange={onChange}
              className={inputBase}
              placeholder="optional"
              inputMode="decimal"
            />
          </div>
        </div>

        {/* ROW 3: TP Tot | PnL | Next Dep (wide) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className={labelBase}>TP Tot</label>
            <input
              name="tpTotal"
              value={form.tpTotal ?? ""}
              readOnly
              className={inputBase + " bg-th-inset text-th-text-sub focus:ring-0"}
              tabIndex={-1}
            />
          </div>

          <div>
            <label className={labelBase}>PnL</label>
            <input
              name="pnl"
              value={form.pnl ?? ""}
              readOnly
              className={inputBase + " bg-th-inset text-th-text-sub focus:ring-0"}
              tabIndex={-1}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelBase}>Next Dep</label>
            <input
              name="nextDeposit"
              value={form.nextDeposit ?? ""}
              readOnly
              className={inputBase + " bg-th-inset text-th-text-sub focus:ring-0"}
              tabIndex={-1}
            />
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-th-text-muted">
        Exit fee auto-switch: SL/Loss → taker, TP+Win → maker. Templates are editable defaults.
      </p>
    </Card>
  );
}
