import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, Button } from "@mui/material";
import { TransactionContext } from "@context/TransactionContext";
import { UserContext } from "@context/UserContext";
import Sidebar from "@components/Sidebar";
import { Delete as DeleteIcon, Menu as MenuIcon } from "@mui/icons-material";
import "@css/TransactionList.css";

const TransactionList = () => {
  const [filter, setFilter] = useState({
    category: "",
    startDate: "",
    endDate: "",
    type: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
  const {
    transactions = [],
    deleteTransaction,
    fetchTransactions,
    pagination = { page: 1, limit: 10, totalPages: 0, totalTransactions: 0 },
  } = useContext(TransactionContext) || {};
  const { token, preferredCurrency } = useContext(UserContext) || {};

  useEffect(() => {
    if (token) {
      fetchTransactions(
        token,
        filter,
        pagination.page,
        pagination.limit,
        false,
        true
      );
    }
  }, [token, filter, pagination.page, pagination.limit]);

  useEffect(() => {}, [transactions]);

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleNote = (id) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const truncateNote = (note, id) => {
    const maxLength = 120;
    if (!note || note.length <= maxLength) return note || "No note";
    const isExpanded = expandedNotes[id] || false;
    return isExpanded ? note : `${note.substring(0, maxLength)}...`;
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages && token) {
      fetchTransactions(token, filter, newPage, pagination.limit, false);
    }
  };

  return (
    <Box className="transaction-list-container">
      <Typography variant="h5" className="title">
        Transactions
      </Typography>
      <Box className="content-wrapper">
        <Sidebar
          open={sidebarOpen}
          filter={filter}
          handleFilterChange={handleFilterChange}
          clearFilters={() => {
            setFilter({ category: "", startDate: "", endDate: "", type: "" });
            if (token) fetchTransactions(token, {}, 1, pagination.limit, false);
          }}
          onClose={closeSidebar}
        />
        <Box className="transaction-content">
          <Button
            onClick={toggleSidebar}
            startIcon={<MenuIcon />}
            className="filter-btn"
            aria-label="Open filter sidebar"
          >
            Filter
          </Button>
          <ul className="transaction-list">
            {!transactions ? (
              <Typography className="no-transactions">
                Loading transactions...
              </Typography>
            ) : transactions.length === 0 ? (
              <Typography className="no-transactions">
                No transactions found.
              </Typography>
            ) : (
              transactions.map((t) => (
                <li
                  key={t.id}
                  className={`transaction-item ${
                    t.type === "income" ? "income" : "expense"
                  }`}
                >
                  <Box className="transaction-details">
                    <Typography className="transaction-main">
                      {t.type} - {t.category}:{" "}
                      <strong>
                        {parseFloat(t.amount_in_preferred_currency).toFixed(2)}{" "}
                        {preferredCurrency}
                      </strong>
                      {t.currency !== preferredCurrency && (
                        <span>
                          {" "}
                          (Original: {parseFloat(t.amount).toFixed(2)}{" "}
                          {t.currency})
                        </span>
                      )}
                    </Typography>
                    <Typography className="transaction-secondary">
                      {t.note ? (
                        <span className="note">
                          {truncateNote(t.note, t.id)}
                          {t.note.length > 120 && (
                            <Button
                              onClick={() => toggleNote(t.id)}
                              className="read-more-button"
                            >
                              {expandedNotes[t.id]
                                ? "(read less)"
                                : "(read more)"}
                            </Button>
                          )}
                        </span>
                      ) : (
                        <span className="note">No note</span>
                      )}
                    </Typography>
                    <Typography className="transaction-secondary">
                      {new Date(t.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Button
                    onClick={() => deleteTransaction(t.id)}
                    className="delete-btn"
                    aria-label={`Delete transaction ${t.id}`}
                  >
                    <DeleteIcon />
                  </Button>
                </li>
              ))
            )}
          </ul>
          <Box className="pagination-container">
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              variant="contained"
              className="pagination-btn"
            >
              Prev
            </Button>
            <Typography className="page-info">
              Page {pagination.page} of {pagination.totalPages || 1}
            </Typography>
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              variant="contained"
              className="pagination-btn"
            >
              Next
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TransactionList;
