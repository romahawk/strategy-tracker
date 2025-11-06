import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { TrendingUp } from "lucide-react";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function EquityCurveChart({ trades = [] }) {
  // sort by date ascending
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
  );

  // labels: use date or index
  const labels = sorted.map((t, i) =>
    t.date ? new Date(t.date).toLocaleDateString() : `Trade ${i + 1}`
  );

  // equity values
  const values = sorted.map((t) => parseFloat(t.nextDeposit || 0));

  // make sure we start from initial deposit
  const initialDeposit = parseFloat(sorted[0]?.deposit || 0);
  if (!values.length || values[0] !== initialDeposit) {
    labels.unshift("Initial");
    values.unshift(initialDeposit);
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: "Equity Curve ($)",
        data: values,
        borderColor: "#00ffa3",
        pointBackgroundColor: "#00ffa3",
        pointBorderColor: "#020617",
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.35,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#020617",
        titleColor: "#ffffff",
        bodyColor: "#e2e8f0",
        borderColor: "#00ffa3",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#94a3b8",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        grid: {
          color: "rgba(148,163,184,0.08)",
        },
      },
      y: {
        ticks: {
          color: "#94a3b8",
        },
        grid: {
          color: "rgba(148,163,184,0.05)",
        },
      },
    },
  };

  return (
    <div className="bg-[#0b1120] border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-300" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Equity curve</h2>
          <p className="text-[10px] text-slate-400">
            Balance over time based on trade nextDeposit
          </p>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-xl h-72 p-3">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
