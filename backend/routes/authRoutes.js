const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerificationEmail);
router.put("/preferred-currency", authMiddleware, authController.updatePreferredCurrency);
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/refresh-token", authController.refreshToken);

module.exports = router;