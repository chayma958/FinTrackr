const db = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Bypass self-signed certificate issues for development
  tls: {
    rejectUnauthorized: false, // Use with caution, only for development
  },
});

const validCurrencies = ["USD", "EUR", "GBP", "TND", "JPY", "CAD", "AUD"];

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

const register = async (req, res) => {
  const { username, email, password, preferred_currency = "USD" } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }
    if (!validCurrencies.includes(preferred_currency)) {
      return res.status(400).json({ error: `Invalid preferred currency. Must be one of: ${validCurrencies.join(", ")}` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.random().toString(36).slice(2);

    const result = await db.query(
      "INSERT INTO users (username, email, password, verification_token, preferred_currency) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email",
      [username, email, hashedPassword, verificationToken, preferred_currency]
    );

    const user = result.rows[0];

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    await transporter.sendMail({
      from: `"FinTrackr" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to FinTrackr - Verify Your Email",
      html: `
        <h2>Welcome to FinTrackr, ${username}!</h2>
        <p>Thank you for joining FinTrackr. To activate your account, please verify your email address by clicking the button below:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #f472b6; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>Best regards,<br>The FinTrackr Team</p>
      `,
    });

    res.status(201).json({ message: "User registered. Please verify your email.", user });
  } catch (err) {
    console.error("Error registering user:", err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to register user" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = generateRefreshToken(user.id);
    await db.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

    res.json({
      token: accessToken,
      refreshToken,
      preferredCurrency: user.preferred_currency,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Failed to login" });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const result = await db.query("SELECT * FROM users WHERE refresh_token = $1", [refreshToken]);
    const user = result.rows[0];

    if (!user) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      if (decoded.userId !== user.id) {
        return res.status(403).json({ error: "Invalid refresh token" });
      }

      const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
      res.json({ token: accessToken });
    } catch (err) {
      console.error("Refresh token verification error:", err);
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }
  } catch (err) {
    console.error("Error refreshing token:", err);
    res.status(500).json({ error: "Failed to refresh token" });
  }
};

const verifyEmail = async (req, res) => {
  const { email, token } = req.query;

  try {
    if (!email || !token) {
      return res.status(400).json({ error: "Email and token are required" });
    }

    const decodedEmail = decodeURIComponent(email);

    const userCheck = await db.query(
      "SELECT is_verified, pending_email FROM users WHERE email = $1 OR pending_email = $1",
      [decodedEmail]
    );
    if (userCheck.rows.length > 0 && userCheck.rows[0].is_verified && !userCheck.rows[0].pending_email) {
      return res.status(400).json({ error: "Email already verified. Please log in." });
    }

    const result = await db.query(
      "UPDATE users SET is_verified = true, verification_token = NULL, email = COALESCE(pending_email, email), pending_email = NULL " +
      "WHERE (email = $1 OR pending_email = $1) AND verification_token = $2 AND (verification_token_expiry > NOW() OR verification_token_expiry IS NULL) RETURNING *",
      [decodedEmail, token]
    );

    if (result.rows.length === 0) {
      console.error("Invalid or expired token for email:", decodedEmail);
      return res.status(400).json({ error: "Invalid or expired token. Please request a new verification email." });
    }

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Error verifying email:", err.message, err.stack); 
    res.status(500).json({ error: `Failed to verify email: ${err.message}` }); 
  }
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await db.query("SELECT * FROM users WHERE email = $1 OR pending_email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.is_verified && !user.pending_email) {
      return res.status(400).json({ error: "Email already verified" });
    }

    const verificationToken = Math.random().toString(36).slice(2);
    await db.query("UPDATE users SET verification_token = $1 WHERE email = $2 OR pending_email = $2", [verificationToken, email]);

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    await transporter.sendMail({
      from: `"FinTrackr" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "FinTrackr - Resend Email Verification",
      html: `
        <h2>Verify Your Email for FinTrackr</h2>
        <p>We received a request to verify your email for FinTrackr. Please click the button below to confirm your email address:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #f472b6; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>Best regards,<br>The FinTrackr Team</p>
      `,
    });

    res.json({ message: "Verification email resent successfully" });
  } catch (err) {
    console.error("Error resending verification email:", err);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = Math.random().toString(36).slice(2);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
    await db.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [resetToken, resetTokenExpiry, email]
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await transporter.sendMail({
      from: `"FinTrackr" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "FinTrackr - Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.username},</p>
        <p>We received a request to reset your password for FinTrackr. Please click the button below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #f472b6; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <p>Best regards,<br>The FinTrackr Team</p>
      `,
    });

    res.json({ message: "Password reset email sent successfully" });
  } catch (err) {
    console.error("Error sending password reset email:", err);
    res.status(500).json({ error: "Failed to send password reset email" });
  }
};

const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;

  try {
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: "Email, token, and new password are required" });
    }

    const decodedEmail = decodeURIComponent(email);
    const result = await db.query(
      "SELECT * FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()",
      [decodedEmail, token]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email = $2",
      [hashedPassword, decodedEmail]
    );

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

const logout = async (req, res) => {
  const userId = req.user.userId;

  try {
    await db.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [userId]);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Error logging out:", err);
    res.status(500).json({ error: "Failed to log out" });
  }
};

const updatePreferredCurrency = async (req, res) => {
  const { preferred_currency } = req.body;
  const userId = req.user.userId;

  try {
    if (!preferred_currency) {
      return res.status(400).json({ error: "Preferred currency is required" });
    }
    if (!validCurrencies.includes(preferred_currency)) {
      return res.status(400).json({ error: `Invalid currency. Must be one of: ${validCurrencies.join(", ")}` });
    }

    const userResult = await db.query(
      "UPDATE users SET preferred_currency = $1 WHERE id = $2 RETURNING preferred_currency",
      [preferred_currency, userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const transactionsResult = await db.query("SELECT * FROM transactions WHERE user_id = $1", [userId]);
    const transactions = transactionsResult.rows;

    if (transactions.length > 0) {
      const rates = await require("../utils/exchangeRates").getExchangeRates("USD");

      await Promise.all(
        transactions.map(async (t) => {
          if (!rates[t.currency] || !rates[preferred_currency]) {
            console.error(`Missing rates for ${t.currency} or ${preferred_currency}, skipping transaction ${t.id}`);
            return;
          }
          const conversionRate = rates[preferred_currency] / rates[t.currency];
          const amountInPreferredCurrency = parseFloat(t.amount) * conversionRate;
          await db.query(
            "UPDATE transactions SET amount_in_preferred_currency = $1 WHERE id = $2",
            [Number(amountInPreferredCurrency).toFixed(2), t.id]
          );
        })
      );
    } else {
      console.log("No transactions to update");
    }

    res.json({ message: "Preferred currency updated successfully", preferredCurrency: preferred_currency });
  } catch (err) {
    console.error("Error updating preferred currency:", err);
    res.status(500).json({ error: `Failed to update preferred currency: ${err.message}` });
  }
};

const getProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query("SELECT username, email, preferred_currency FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = result.rows[0];
    res.json({ username: user.username, email: user.email, preferredCurrency: user.preferred_currency });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const updateProfile = async (req, res) => {
  const { username, email, password } = req.body;
  const userId = req.user.userId;

  try {
    const currentUserResult = await db.query("SELECT email, is_verified, username FROM users WHERE id = $1", [userId]);
    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const currentUser = currentUserResult.rows[0];

    const updates = {};
    const queryParams = [];
    let paramIndex = 1;

    if (username && username !== currentUser.username) {
      updates.username = username;
      queryParams.push(username);
    }
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
      queryParams.push(updates.password);
    }
    if (email && email !== currentUser.email) {
      const emailCheck = await db.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email already in use" });
      }
      updates.pending_email = email;
      updates.verification_token = Math.random().toString(36).slice(2);
      queryParams.push(email, updates.verification_token);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid updates provided" });
    }

    let query = "UPDATE users SET ";
    const setClauses = [];
    if (updates.username) {
      setClauses.push(`username = $${paramIndex++}`);
    }
    if (updates.password) {
      setClauses.push(`password = $${paramIndex++}`);
    }
    if (updates.pending_email) {
      setClauses.push(`pending_email = $${paramIndex++}, verification_token = $${paramIndex++}, is_verified = false`);
    }
    query += setClauses.join(", ");
    query += ` WHERE id = $${paramIndex}`;
    queryParams.push(userId);

    await db.query(query, queryParams);

    if (updates.pending_email) {
      const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${updates.verification_token}&email=${encodeURIComponent(updates.pending_email)}`;
      await transporter.sendMail({
        from: `"FinTrackr" <${process.env.EMAIL_USER}>`,
        to: updates.pending_email,
        subject: "FinTrackr - Verify Your New Email Address",
        html: `
          <h2>Update Your Email for FinTrackr</h2>
          <p>Hello ${currentUser.username},</p>
          <p>You've requested to update your email address for FinTrackr. Please verify your new email by clicking the button below:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #f472b6; color: #fff; text-decoration: none; border-radius: 5px;">Verify New Email</a>
          
          <p>Best regards,<br>The FinTrackr Team</p>
        `,
      });
    }

    res.json({ message: updates.pending_email ? "Verification email sent to new email" : "Profile updated successfully", pendingEmail: updates.pending_email });
  } catch (err) {
    console.error("Error updating profile:", err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Username or email already in use" });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
};

module.exports = { 
  register, 
  login, 
  verifyEmail, 
  resendVerificationEmail, 
  updatePreferredCurrency, 
  getProfile, 
  updateProfile, 
  refreshToken,
  forgotPassword,
  resetPassword,
  logout 
};