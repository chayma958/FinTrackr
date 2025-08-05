import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserContext } from "@context/UserContext";

export const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalTransactions: 0,
  });
  const [currentDayBalance, setCurrentDayBalance] = useState(0);
  const [lastTransactionAdded, setLastTransactionAdded] = useState(null);
  const { token, preferredCurrency } = useContext(UserContext) || {};

  useEffect(() => {
    if (
      token &&
      preferredCurrency &&
      (lastTransactionAdded || preferredCurrency)
    ) {
      fetchBalance();
    }
  }, [lastTransactionAdded, preferredCurrency, token]);

  const fetchBalance = async () => {
    if (!token || !preferredCurrency) {
      console.warn(
        "Cannot fetch balance: token or preferredCurrency is missing"
      );
      setCurrentDayBalance(0);
      return;
    }
    try {
      const response = await axios.get(
        "http://localhost:5000/api/transactions/balance",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentDayBalance(response.data.balance || 0);
    } catch (err) {
      console.error("Error fetching balance:", err.message);
      setCurrentDayBalance(0);
    }
  };

  const fetchTransactions = async (
    token,
    filter = {},
    page = 1,
    limit = 10,
    reset = false,
    refetchBalance = false
  ) => {
    if (!token) {
      console.warn(
        "TransactionContext: Cannot fetch transactions: token is missing"
      );
      setTransactions([]);
      setPagination({
        page: 1,
        limit: 10,
        totalPages: 0,
        totalTransactions: 0,
      });
      return;
    }
    try {
      const params = { ...filter };
      if (page && limit) {
        params.page = page;
        params.limit = limit;
      } // Omit page and limit if null to fetch all transactions
      const response = await axios.get(
        "http://localhost:5000/api/transactions",
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );
      setTransactions(response.data.transactions || []);
      setPagination({
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        totalPages: response.data.totalPages || 0,
        totalTransactions: response.data.totalTransactions || 0,
      });
      if (refetchBalance) {
        await fetchBalance();
      }
    } catch (err) {
      console.error("TransactionContext: Error fetching transactions:", err);
      setTransactions([]);
      setPagination({
        page: 1,
        limit: 10,
        totalPages: 0,
        totalTransactions: 0,
      });
    }
  };
  const addTransaction = async (transactionData, filter = {}) => {
    if (!token) {
      throw new Error("Cannot add transaction: user not authenticated");
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/transactions",
        transactionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLastTransactionAdded(Date.now());
      await fetchTransactions(token, filter, 1, 10, true, true);
      return response.data;
    } catch (err) {
      console.error("Error adding transaction:", err);
      throw err;
    }
  };

  const deleteTransaction = async (id, filter = {}) => {
    if (!token) {
      throw new Error("Cannot delete transaction: user not authenticated");
    }
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/transactions/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLastTransactionAdded(Date.now());
      await fetchTransactions(token, filter, 1, 10, true, true);
    } catch (err) {
      console.error("Error deleting transaction:", err);
      throw err;
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        pagination,
        currentDayBalance,
        lastTransactionAdded,
        fetchTransactions,
        addTransaction,
        deleteTransaction,
        fetchBalance,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
