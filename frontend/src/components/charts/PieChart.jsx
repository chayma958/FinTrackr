import { useContext, useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  PieController,
  ArcElement,
} from "chart.js";
import { UserContext } from "@context/UserContext";
import "@css/PieChart.css";

ChartJS.register(PieController, ArcElement, Tooltip, Legend, ChartDataLabels);

const PieChart = ({ transactions, title }) => {
  const { preferredCurrency } = useContext(UserContext);

  const pieData = useMemo(() => {
    const labels = [...new Set(transactions.map((t) => t.category))];
    const data = labels.map((category) =>
      transactions
        .filter((t) => t.category === category)
        .reduce((sum, t) => sum + parseFloat(t.amount_in_preferred_currency), 0)
    );
    const backgroundColor = labels.map(
      () => `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`
    );

    return {
      labels,
      datasets: [
        {
          label: `Amount (${preferredCurrency}): `,
          data,
          backgroundColor,
          borderColor: "transparent",
          borderWidth: 0,
        },
      ],
    };
  }, [transactions, preferredCurrency]);

  const pieOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const dataset = context.dataset.data;
            const total = dataset.reduce((sum, val) => sum + val, 0);
            const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
            return `Amount: ${value.toFixed(
              2
            )} ${preferredCurrency} (${percentage}%)`;
          },
        },
      },
      legend: {
        position: "bottom",
      },
      datalabels: {
        display: false,
      },
    },
  };

  return (
    <div className="pie-chart-container">
      <Typography variant="h6" className="chart-title">
        {title}
      </Typography>
      {transactions.length === 0 ? (
        <Typography className="no-data-message">No data available</Typography>
      ) : (
        <div className="pie-chart-wrapper">
          <Pie data={pieData} options={pieOptions} />
        </div>
      )}
    </div>
  );
};

export default PieChart;
