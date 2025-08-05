import { useContext, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { TransactionContext } from "@context/TransactionContext";
import { UserContext } from "@context/UserContext";
import PieChart from "@components/charts/PieChart";
import BarChart from "@components/charts/BarChart";
import "@css/TransactionCharts.css";

const TransactionCharts = () => {
  const { transactions, fetchTransactions } =
    useContext(TransactionContext) || {};
  const { token, preferredCurrency } = useContext(UserContext) || {};
  const [chartType, setChartType] = useState("income");
  const [filterBy, setFilterBy] = useState("today");

  useEffect(() => {
    if (token) {
      fetchTransactions(token, { filterBy }, null, null, true);
    }
  }, [filterBy, token]);

  const incomeTransactions =
    transactions?.filter((t) => t.type === "income") || [];
  const expenseTransactions =
    transactions?.filter((t) => t.type === "expense") || [];

  const renderChart = () => {
    switch (chartType) {
      case "income":
        return (
          <PieChart
            transactions={incomeTransactions}
            title={`Income by Category (${preferredCurrency})`}
          />
        );
      case "expense":
        return (
          <PieChart
            transactions={expenseTransactions}
            title={`Expenses by Category (${preferredCurrency})`}
          />
        );
      case "net":
        return <BarChart transactions={transactions || []} />;
      default:
        return null;
    }
  };

  const chartTypes = [
    { value: "income", label: "Income" },
    { value: "expense", label: "Expenses" },
    { value: "net", label: "Net Amount" },
  ];

  const filterPeriods = [
    { value: "today", label: "Today" },
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "last3months", label: "Last 3 Months" },
    { value: "yeartodate", label: "Year to Date" },
  ];

  return (
    <Box className="charts-container">
      <Typography variant="h5" className="charts-title">
        Financial Overview
      </Typography>
      <Box className="filter-row">
        <Box className="filter-group">
          <Typography variant="subtitle1">Chart Type</Typography>
          <FormControl>
            <InputLabel id="chart-type-label">Select Chart Type</InputLabel>
            <Select
              labelId="chart-type-label"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              label="Select Chart Type"
            >
              {chartTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box className="filter-group">
          <Typography variant="subtitle1">Time Period</Typography>
          <FormControl>
            <InputLabel id="time-period-label">Select Time Period</InputLabel>
            <Select
              labelId="time-period-label"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              label="Select Time Period"
            >
              {filterPeriods.map((period) => (
                <MenuItem key={period.value} value={period.value}>
                  {period.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      {renderChart()}
    </Box>
  );
};

export default TransactionCharts;
