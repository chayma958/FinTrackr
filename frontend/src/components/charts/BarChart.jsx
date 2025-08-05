import { useContext, useMemo } from "react";
import { Typography, Box } from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { TransactionContext } from "@context/TransactionContext";
import { UserContext } from "@context/UserContext";

import "@css/BarChart.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const BarChart = ({ transactions }) => {
  const { filterBy, setFilterBy } = useContext(TransactionContext);
  const { preferredCurrency } = useContext(UserContext);

  const getDateRange = () => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);

    switch (filterBy) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "last7days":
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "last30days":
        startDate.setDate(endDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "last3months":
        startDate.setDate(endDate.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "yeartodate":
        startDate.setFullYear(2025, 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return { startDate, endDate };
  };

  const generateLabels = (startDate, endDate) => {
    const labels = [];
    let current = new Date(startDate);

    if (filterBy === "today") {
      for (let hour = 0; hour < 24; hour++) {
        labels.push(`${hour}:00`);
      }
    } else if (filterBy === "yeartodate") {
      while (current <= endDate) {
        labels.push(
          current.toLocaleString("default", { month: "short", year: "numeric" })
        );
        current.setMonth(current.getMonth() + 1);
      }
    } else if (filterBy === "last3months") {
      while (current <= endDate) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());
        labels.push(`Week of ${weekStart.toLocaleDateString()}`);
        current.setDate(current.getDate() + 7);
      }
    } else {
      while (current <= endDate) {
        labels.push(current.toLocaleDateString());
        current.setDate(current.getDate() + 1);
      }
    }
    return labels;
  };

  const barData = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    const labels = generateLabels(startDate, endDate);

    const incomeByPeriod = {};
    const expenseByPeriod = {};
    transactions.forEach((t) => {
      const transactionDate = new Date(t.date);
      let key;
      if (filterBy === "today") {
        key = `${transactionDate.getHours()}:00`;
      } else if (filterBy === "yeartodate") {
        key = transactionDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
      } else if (filterBy === "last3months") {
        const weekStart = new Date(transactionDate);
        weekStart.setDate(
          weekStart.getDate() -
            weekStart.getDay() +
            (weekStart.getDay() === 0 ? -6 : 1)
        );
        key = `Week of ${weekStart.toLocaleDateString()}`;
      } else {
        key = transactionDate.toLocaleDateString();
      }
      if (!incomeByPeriod[key]) incomeByPeriod[key] = 0;
      if (!expenseByPeriod[key]) expenseByPeriod[key] = 0;
      const amount = parseFloat(t.amount_in_preferred_currency);
      if (t.type === "income") {
        incomeByPeriod[key] += amount;
      } else {
        expenseByPeriod[key] += amount;
      }
    });

    const incomeData = labels.map((label) => incomeByPeriod[label] || 0);
    const expenseData = labels.map((label) => expenseByPeriod[label] || 0);
    const netData = labels.map(
      (label) => (incomeByPeriod[label] || 0) - (expenseByPeriod[label] || 0)
    );

    const netBackgroundColors = netData.map((amount) =>
      amount === 0
        ? "rgba(200, 200, 200, 0.3)"
        : amount > 0
        ? "rgba(75, 192, 192, 0.5)"
        : "rgba(255, 99, 132, 0.5)"
    );

    return {
      labels,
      datasets: [
        {
          label: `Income (${preferredCurrency})`,
          data: incomeData,
          backgroundColor: "rgba(75, 192, 192, 0.7)",
          stack: "net",
        },
        {
          label: `Expenses (${preferredCurrency})`,
          data: expenseData.map((x) => -x),
          backgroundColor: "rgba(255, 99, 132, 0.7)",
          stack: "net",
        },
        {
          label: `Net Amount (${preferredCurrency})`,
          data: netData,
          backgroundColor: netBackgroundColors,
          borderColor: netBackgroundColors.map((color) =>
            color.replace("0.5", "1").replace("0.3", "0.8")
          ),
          borderWidth: 1,
          stack: "net",
          hidden: true,
        },
      ],
    };
  }, [transactions, filterBy, preferredCurrency]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        onClick: (e, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          ci.data.datasets.forEach((dataset, i) => {
            if (dataset.stack === "net") {
              dataset.hidden = i !== index;
            }
          });
          ci.update();
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dataset = context.dataset.label;
            const value = Math.abs(context.raw);
            return `${dataset}: ${value.toFixed(2)} ${preferredCurrency}`;
          },
          title: (tooltipItems) => tooltipItems[0].label,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          enabled: true,
          mode: "x",
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text:
            filterBy === "today"
              ? "Hour"
              : filterBy === "yeartodate"
              ? "Month"
              : filterBy === "last3months"
              ? "Week"
              : "Date",
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: `Amount (${preferredCurrency})`,
        },
        beginAtZero: true,
        ticks: {
          callback: (value) =>
            `${Math.abs(value).toFixed(2)} ${preferredCurrency}`,
        },
        stacked: true,
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const label = barData.labels[index];
        if (filterBy === "last3months" && label.startsWith("Week of ")) {
          setFilterBy("last7days");
        } else if (filterBy === "yeartodate") {
          setFilterBy("last30days");
        }
      }
    },
  };

  return (
    <div className="bar-chart-container">
      <Typography variant="h6" className="chart-title">
        Net Amount (
        {filterBy === "today"
          ? "Hourly"
          : filterBy === "yeartodate"
          ? "Monthly"
          : filterBy === "last3months"
          ? "Weekly"
          : "Daily"}
        ) in {preferredCurrency}
      </Typography>
      {transactions.length === 0 && filterBy !== "today" ? (
        <Typography className="no-data-message">No data available</Typography>
      ) : (
        <div className="bar-chart-wrapper">
          <Bar data={barData} options={options} />
        </div>
      )}
    </div>
  );
};

export default BarChart;
