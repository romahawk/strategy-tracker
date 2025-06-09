import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function EquityCurveChart({ trades }) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = sorted.map(t => t.date);
  const values = sorted.map(t => parseFloat(t.nextDeposit));

  const initialDeposit = parseFloat(sorted[0]?.deposit || 0);
  if (!values.length || values[0] !== initialDeposit) {
    labels.unshift("Initial");
    values.unshift(initialDeposit);
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Equity Curve ($)',
        data: values,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-xl font-semibold mb-2">📈 Equity Curve</h2>
      <div className="h-64">
        <Line data={chartData} options={{ maintainAspectRatio: false }} />
      </div>
    </div>
  );
}
