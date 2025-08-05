const { getExchangeRates } = require("../utils/exchangeRates");
const db = require("../models/db");

const validCurrencies = ["USD", "EUR", "GBP", "TND", "JPY", "CAD", "AUD"];

const getDateRangeForFilter = (filterBy) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); 
  const endDate = today.toISOString().split("T")[0]; 
  let startDate;

  switch (filterBy) {
    case "today":
      startDate = endDate; 
      break;
    case "last7days":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6); 
      startDate = startDate.toISOString().split("T")[0];
      break;
    case "last30days":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
      startDate = startDate.toISOString().split("T")[0];
      break;
    case "last3months":
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 3); 
      startDate = startDate.toISOString().split("T")[0];
      break;
    case "yeartodate":
      startDate = new Date(today.getFullYear(), 0, 1); 
      startDate = startDate.toISOString().split("T")[0];
      break;
    default:
      console.warn(`Invalid filterBy value: ${filterBy}, returning no date filter`);
      startDate = null;
      endDate = null;
      break;
  }

  return { startDate, endDate };
};
const getBalance = async (req, res) => {
  const userId = req.user.userId;
  const { date } = req.query;

  try {
    let query =
      "SELECT SUM(CASE WHEN type = 'income' THEN amount_in_preferred_currency ELSE -amount_in_preferred_currency END) as balance FROM transactions WHERE user_id = $1";
    const params = [userId];

    if (date) {
      query += " AND date = $2";
      params.push(date);
    }

    const result = await db.query(query, params);
    const balance = parseFloat(result.rows[0].balance) || 0;
    res.json({ balance });
  } catch (err) {
    console.error("Error calculating balance:", err);
    res.status(500).json({ error: `Failed to calculate balance: ${err.message}` });
  }
};

const addTransaction = async (req, res) => {
  const { note, amount, type, category, date, currency } = req.body;
  const userId = req.user.userId;

  try {
    if (!amount || !type || !category || !date || !currency) {
      return res.status(400).json({ error: "Amount, type, category, date, and currency are required" });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ error: "Type must be 'income' or 'expense'" });
    }
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ error: `Invalid currency. Must be one of: ${validCurrencies.join(", ")}` });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
    }

    const userResult = await db.query("SELECT preferred_currency FROM users WHERE id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const preferredCurrency = userResult.rows[0]?.preferred_currency || "USD";

    if (!validCurrencies.includes(preferredCurrency)) {
      return res.status(400).json({ error: `Invalid preferred currency: ${preferredCurrency}` });
    }

    let amountInPreferredCurrency = parsedAmount;
    if (currency !== preferredCurrency) {
      const rates = await getExchangeRates(currency);
      if (!rates[currency] || !rates[preferredCurrency]) {
        console.error(`Missing rates for ${currency} or ${preferredCurrency}, cannot convert`);
        return res.status(500).json({ error: `Cannot convert: missing exchange rates for ${currency} or ${preferredCurrency}` });
      }
      const conversionRate = rates[preferredCurrency] / rates[currency];
      amountInPreferredCurrency = parsedAmount * conversionRate;
    } else {
    }

    const storedAmount = Number(parsedAmount).toFixed(2);
    const storedAmountInPreferredCurrency = Number(amountInPreferredCurrency).toFixed(2);

    const result = await db.query(
      "INSERT INTO transactions (user_id, note, amount, type, category, date, currency, amount_in_preferred_currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [userId, note || null, storedAmount, type, category, date, currency, storedAmountInPreferredCurrency]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding transaction:", err);
    res.status(500).json({ error: `Failed to add transaction: ${err.message}` });
  }
};

const getTransactions = async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10, category, type, filterBy } = req.query;

  try {
    let query = "SELECT * FROM transactions WHERE user_id = $1";
    const params = [userId];
    let paramIndex = 2;

    let startDate, endDate;
    if (filterBy) {
      const dateRange = getDateRangeForFilter(filterBy);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    if (category && category.length >= 3) {
      query += ` AND category ILIKE $${paramIndex++}`;
      params.push(`%${category}%`);
    }
    if (startDate) {
      query += ` AND date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date <= $${paramIndex++}`;
      params.push(endDate);
    }
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    let totalTransactions = 0;
    if (page && limit) {
      query += ` ORDER BY date DESC, id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, (page - 1) * limit);
    } else {
      query += ` ORDER BY date DESC, id DESC`;
    }

    const result = await db.query(query, params);

    let countQuery = "SELECT COUNT(*) FROM transactions WHERE user_id = $1";
    const countParams = [userId];
    let countParamIndex = 2;

    if (category && category.length >= 3) {
      countQuery += ` AND category ILIKE $${countParamIndex++}`;
      countParams.push(`%${category}%`);
    }
    if (startDate) {
      countQuery += ` AND date >= $${countParamIndex++}`;
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ` AND date <= $${countParamIndex++}`;
      countParams.push(endDate);
    }
    if (type) {
      countQuery += ` AND type = $${countParamIndex++}`;
      countParams.push(type);
    }

    const countResult = await db.query(countQuery, countParams);
    totalTransactions = parseInt(countResult.rows[0].count, 10);

    res.json({
      transactions: result.rows,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : totalTransactions,
      totalPages: page && limit ? Math.ceil(totalTransactions / limit) : 1,
      totalTransactions,
    });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: `Failed to fetch transactions: ${err.message}` });
  }
};
const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found or not authorized" });
    }
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ error: `Failed to delete transaction: ${err.message}` });
  }
};

module.exports = { getTransactions, addTransaction, deleteTransaction, getBalance };