const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const authMiddleware = require("../middleware/authMiddleware");

// Protect all transaction routes with auth middleware
router.use(authMiddleware);

// Transaction routes
router.post("/", authMiddleware, transactionController.addTransaction);
router.get("/", authMiddleware, transactionController.getTransactions);
router.delete("/:id", authMiddleware, transactionController.deleteTransaction);
router.get("/balance", authMiddleware, transactionController.getBalance);

module.exports = router;
