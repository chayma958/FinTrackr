import { useState, useContext } from "react";
import {
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  Button,
  Paper,
  FormControl,
  InputLabel,
} from "@mui/material";
import { TransactionContext } from "@context/TransactionContext";
import { UserContext } from "@context/UserContext";
import "@css/TransactionForm.css";

const TransactionForm = () => {
  const { addTransaction, fetchBalance } = useContext(TransactionContext) || {};
  const { preferredCurrency } = useContext(UserContext) || {};

  const [form, setForm] = useState({
    type: "expense",
    category: "",
    amount: "",
    note: "",
    currency: preferredCurrency || "USD",
    date: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState({
    category: "",
    amount: "",
    date: "",
    currency: "",
    general: "",
  });

const handleChange = (e) => {
  const { name, value } = e.target;
  setForm((prev) => ({
    ...prev,
    [name]: value, 
  }));
  setErrors({ ...errors, [name]: "", general: "" });
};

  const handleAdd = async (e) => {
    e.preventDefault();
    const newErrors = {
      category: "",
      amount: "",
      date: "",
      currency: "",
      general: "",
    };
    let hasError = false;

    if (!form.category) {
      newErrors.category = "Category is required";
      hasError = true;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
      hasError = true;
    }
    if (!form.date || !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      newErrors.date = "Date must be in YYYY-MM-DD format";
      hasError = true;
    }
    if (!form.currency) {
      newErrors.currency = "Currency is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      const formattedAmount = parseFloat(form.amount).toFixed(2);
      await addTransaction({
        note: form.note,
        type: form.type,
        category: form.category,
        amount: formattedAmount,
        currency: form.currency,
        date: form.date,
      });
      setForm({
        type: "expense",
        category: "",
        amount: "",
        note: "",
        currency: preferredCurrency || "USD",
        date: new Date().toISOString().split("T")[0],
      });
      setErrors({
        category: "",
        amount: "",
        date: "",
        currency: "",
        general: "",
      });
      if (fetchBalance) {
        await fetchBalance();
      }
    } catch (err) {
      setErrors({
        ...errors,
        general:
          err.message ||
          "Failed to add transaction. Currency conversion may not have occurred.",
      });
    }
  };

  const currencyOptions = [
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "TND", label: "Tunisian Dinar (TND)" },
    { value: "GBP", label: "British Pound (GBP)" },
    { value: "JPY", label: "Japanese Yen (JPY)" },
    { value: "CAD", label: "Canadian Dollar (CAD)" },
    { value: "AUD", label: "Australian Dollar (AUD)" },
  ];

  return (
    <Paper className="transaction-form" elevation={6}>
      <Typography variant="h5" className="form-title">
        Add Transaction
      </Typography>

      {errors.general && (
        <Typography color="error" className="error-message">
          {errors.general}
        </Typography>
      )}

      <Box component="form" noValidate autoComplete="off" className="form-box">
        <FormControl fullWidth className="pink-input">
          <InputLabel id="type-label" className="pink-label">
            Type
          </InputLabel>
          <Select
            labelId="type-label"
            name="type"
            value={form.type}
            label="Type"
            onChange={handleChange}
            className="pink-select"
          >
            <MenuItem value="expense" className="menu-item">
              Expense
            </MenuItem>
            <MenuItem value="income" className="menu-item">
              Income
            </MenuItem>
          </Select>
        </FormControl>

        <Box>
          <TextField
            name="category"
            label="Category"
            value={form.category}
            onChange={handleChange}
            fullWidth
            required
            className="pink-input"
            error={!!errors.category}
            helperText={errors.category}
          />
        </Box>

        <Box>
          <TextField
            name="amount"
            label="Amount"
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            value={form.amount}
            onChange={handleChange}
            fullWidth
            required
            className="pink-input"
            error={!!errors.amount}
            helperText={errors.amount}
          />
        </Box>

        <Box>
          <TextField
            name="date"
            label="Date"
            type="date"
            value={form.date}
            onChange={handleChange}
            fullWidth
            required
            className="pink-input"
            InputLabelProps={{ shrink: true }}
            error={!!errors.date}
            helperText={errors.date}
          />
        </Box>

        <FormControl fullWidth className="pink-input">
          <InputLabel id="currency-label" className="pink-label">
            Currency
          </InputLabel>
          <Select
            labelId="currency-label"
            name="currency"
            value={form.currency}
            label="Currency"
            onChange={handleChange}
            className="pink-select"
            error={!!errors.currency}
          >
            {currencyOptions.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                className="menu-item"
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {errors.currency && (
            <Typography color="error" variant="caption" className="field-error">
              {errors.currency}
            </Typography>
          )}
        </FormControl>

        <TextField
          name="note"
          label="Note (optional)"
          value={form.note}
          onChange={handleChange}
          fullWidth
          multiline
          rows={2}
          className="pink-input"
        />

        <Typography variant="subtitle2" className="currency-note">
          Amounts will be converted to your preferred currency:{" "}
          {preferredCurrency}
        </Typography>

        <Button
          variant="contained"
          onClick={handleAdd}
          className="submit-button"
          disabled={
            !form.category || !form.amount || !form.date || !form.currency
          }
        >
          Add Transaction
        </Button>
      </Box>
    </Paper>
  );
};

export default TransactionForm;
