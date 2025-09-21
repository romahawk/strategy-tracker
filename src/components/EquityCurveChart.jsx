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
        borderColor: '#00ffa3', // Updated to neon green accent
        pointBackgroundColor: '#00ffa3', // Matching point color
        tension: 0.3,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#d1d5db', // Light text for legend
        },
      },
      tooltip: {
        backgroundColor: '#1e293b', // Dark tooltip background
        titleColor: '#ffffff', // White title text
        bodyColor: '#d1d5db', // Light body text
        borderColor: '#00ffa3', // Neon green border
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: '#d1d5db' }, // Light text for x-axis
        grid: { color: '#94a3b8' }, // Subtle grid lines
      },
      y: {
        ticks: { color: '#d1d5db' }, // Light text for y-axis
        grid: { color: '#94a3b8' }, // Subtle grid lines
      },
    },
  };

  return (
    <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg mb-6">
      <div className="bg-[#1e293b] rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 h-72">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}