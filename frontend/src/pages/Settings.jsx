import { useContext, useState } from "react";
import {
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  Box,
} from "@mui/material";
import { UserContext } from "@context/UserContext";
import "@css/Settings.css";

const Settings = () => {
  const {
    preferredCurrency,
    updatePreferredCurrency,
    updateUserProfile,
    username,
    email,
  } = useContext(UserContext);
  const [selectedCurrency, setSelectedCurrency] = useState(preferredCurrency);
  const [userForm, setUserForm] = useState({
    username: username || "",
    email: email || "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });
  const [success, setSuccess] = useState(null);

  const currencyOptions = [
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "TND", label: "Tunisian Dinar (TND)" },
    { value: "GBP", label: "British Pound (GBP)" },
    { value: "JPY", label: "Japanese Yen (JPY)" },
    { value: "CAD", label: "Canadian Dollar (CAD)" },
  ];

  const handleCurrencyChange = async () => {
    setIsLoading(true);
    setErrors({ ...errors, general: "" });
    setSuccess(null);
    try {
      await updatePreferredCurrency(selectedCurrency);
      setSuccess("Currency updated successfully");
    } catch (err) {
      setErrors({ ...errors, general: "Failed to update currency" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm({ ...userForm, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleUserUpdate = async () => {
    setIsLoading(true);
    setErrors({ email: "", password: "", confirmPassword: "", general: "" });
    setSuccess(null);

    const newErrors = {
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    };
    let hasError = false;

    // Email validation
    if (userForm.email && userForm.email !== email) {
      if (!userForm.email) {
        newErrors.email = "Email is required";
        hasError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
        newErrors.email = "Invalid email format";
        hasError = true;
      }
    }

    // Password validation
    if (userForm.password || userForm.confirmPassword) {
      if (!userForm.password) {
        newErrors.password = "Password is required";
        hasError = true;
      } else if (userForm.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
        hasError = true;
      }
      if (userForm.password !== userForm.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const updates = {};
      if (userForm.username && userForm.username !== username)
        updates.username = userForm.username;
      if (userForm.email && userForm.email !== email)
        updates.email = userForm.email;
      if (userForm.password) updates.password = userForm.password;

      if (Object.keys(updates).length === 0) {
        setErrors({ ...errors, general: "No changes to update" });
        setIsLoading(false);
        return;
      }

      await updateUserProfile(updates);
      setSuccess(
        updates.email
          ? "Verification email sent to new email"
          : "Profile updated successfully"
      );
      setUserForm({
        username: updates.username || username || "",
        email: email || "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setErrors({
        ...errors,
        general: err.message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper className="settings-form" elevation={6}>
      <Typography variant="h5" className="settings-title">
        Settings
      </Typography>
      {errors.general && (
        <Box className="error-message">
          <Typography
            color="error"
            sx={{ fontWeight: "bold", textAlign: "center" }}
          >
            {errors.general}
          </Typography>
        </Box>
      )}
      {success && (
        <Box className="success-message">
          <Typography
            color="success"
            sx={{ fontWeight: "bold", textAlign: "center" }}
          >
            {success}
          </Typography>
        </Box>
      )}

      <Box className="form-box">
        <Typography variant="h6" className="section-title">
          Update Profile
        </Typography>
        <Box className="form-box">
          <TextField
            name="username"
            label="Username"
            value={userForm.username}
            onChange={handleUserFormChange}
            fullWidth
            className="pink-input"
            margin="normal"
          />
        </Box>
        <Box className="form-box">
          <TextField
            name="email"
            label="Email"
            type="email"
            value={userForm.email}
            onChange={handleUserFormChange}
            fullWidth
            className="pink-input"
            margin="normal"
          />
          {errors.email && (
            <Typography color="error" variant="caption" className="field-error">
              {errors.email}
            </Typography>
          )}
        </Box>
        <Box className="form-box">
          <TextField
            name="password"
            label="New Password"
            type="password"
            value={userForm.password}
            onChange={handleUserFormChange}
            fullWidth
            className="pink-input"
            margin="normal"
          />
          {errors.password && (
            <Typography color="error" variant="caption" className="field-error">
              {errors.password}
            </Typography>
          )}
        </Box>
        <Box className="form-box">
          <TextField
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={userForm.confirmPassword}
            onChange={handleUserFormChange}
            fullWidth
            className="pink-input"
            margin="normal"
          />
          {errors.confirmPassword && (
            <Typography color="error" variant="caption" className="field-error">
              {errors.confirmPassword}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Button
            onClick={handleUserUpdate}
            disabled={isLoading}
            variant="contained"
            className="submit-button"
          >
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </Box>
      </Box>

      <Box className="form-box">
        <Typography variant="h6" className="section-title">
          Preferred Currency
        </Typography>
        <FormControl className="pink-select">
          <InputLabel className="pink-label">Preferred Currency</InputLabel>
          <Select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            label="Preferred Currency"
            className="menu-item"
          >
            {currencyOptions.map((currency) => (
              <MenuItem
                key={currency.value}
                value={currency.value}
                className="menu-item"
              >
                {currency.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ textAlign: "right" }}>
          <Button
            onClick={handleCurrencyChange}
            disabled={isLoading || selectedCurrency === preferredCurrency}
            variant="contained"
            className="submit-button"
          >
            {isLoading ? "Updating..." : "Update Currency"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default Settings;
