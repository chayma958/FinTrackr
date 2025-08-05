import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { TransactionContext } from "@context/TransactionContext";
import { jwtDecode } from "jwt-decode";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken") || null);
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [preferredCurrency, setPreferredCurrency] = useState(localStorage.getItem("preferredCurrency") || "USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchBalance } = useContext(TransactionContext) || {};

  const validCurrencies = ["USD", "EUR", "GBP", "TND", "JPY", "CAD", "AUD"];

  // Axios interceptor to handle token refreshing
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          refreshToken &&
          originalRequest.url !== "http://localhost:5000/api/auth/refresh-token"
        ) {
          originalRequest._retry = true;
          try {
            const response = await axios.post("http://localhost:5000/api/auth/refresh-token", {
              refreshToken,
            });
            const newToken = response.data.token;
            setToken(newToken);
            localStorage.setItem("token", newToken);
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            handleLogout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshToken]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Login failed");
        console.error("Login failed:", errorData.message || response.status);
        return null;
      }

      const data = await response.json();
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      setUsername(data.username || "");
      setEmail(data.email || email);
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("username", data.username || "");
      localStorage.setItem("email", data.email || email);
      await fetchUserProfile(data.token);
      return data.token;
    } catch (error) {
      setError(error.message || "An unexpected error occurred during login");
      console.error("Login error:", error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ username, email, password, preferredCurrency }) => {
    try {
      setError(null);
      setLoading(true);
      await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
        preferred_currency: preferredCurrency,
      });
      setError(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email, token) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://localhost:5000/api/auth/verify-email", {
        params: { email, token },
      });
      return { message: res.data.message, error: null };
    } catch (err) {
      setError(err.response?.data?.error || "Email verification failed");
      return { message: null, error: err.response?.data?.error || "Email verification failed" };
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post("http://localhost:5000/api/auth/resend-verification", { email });
      return { message: res.data.message, error: null };
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend verification email");
      return { message: null, error: err.response?.data?.error || "Failed to resend verification email" };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      return { message: res.data.message, error: null };
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send password reset email");
      return { message: null, error: err.response?.data?.error || "Failed to send password reset email" };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, token, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        token,
        newPassword,
      });
      return { message: res.data.message, error: null };
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password");
      return { message: null, error: err.response?.data?.error || "Failed to reset password" };
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsername(res.data.username);
      setEmail(res.data.email);
      setPreferredCurrency(res.data.preferredCurrency || "USD");
      localStorage.setItem("username", res.data.username || "");
      localStorage.setItem("email", res.data.email || "");
      localStorage.setItem("preferredCurrency", res.data.preferredCurrency || "USD");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch user profile");
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const updatePreferredCurrency = async (currency) => {
    try {
      if (!validCurrencies.includes(currency)) {
        throw new Error(`Invalid currency: ${currency}`);
      }
      const response = await axios.put(
        "http://localhost:5000/api/auth/preferred-currency",
        { preferred_currency: currency },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPreferredCurrency(currency);
      localStorage.setItem("preferredCurrency", currency);
      if (fetchBalance) {
        await fetchBalance();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update preferred currency");
      console.error("Error updating preferred currency:", err.message);
      throw err;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const res = await axios.put(
        "http://localhost:5000/api/auth/profile",
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (updates.username) {
        setUsername(updates.username);
        localStorage.setItem("username", updates.username);
      }
      if (updates.email) {
        setEmail(res.data.pendingEmail || email);
        localStorage.setItem("email", res.data.pendingEmail || email);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("preferredCurrency");
    setToken(null);
    setRefreshToken(null);
    setUsername("");
    setEmail("");
    setPreferredCurrency("USD");
    setError(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refreshToken");
        if (storedToken && storedRefreshToken) {
          const { exp } = jwtDecode(storedToken);
          if (Date.now() < exp * 1000) {
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            await fetchUserProfile(storedToken);
          } else {
            try {
              const response = await axios.post("http://localhost:5000/api/auth/refresh-token", {
                refreshToken: storedRefreshToken,
              });
              const newToken = response.data.token;
              setToken(newToken);
              setRefreshToken(storedRefreshToken);
              localStorage.setItem("token", newToken);
              await fetchUserProfile(newToken);
            } catch (refreshError) {
              console.error("Token refresh failed during initialization:", refreshError);
              handleLogout();
            }
          }
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("Token validation error:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <UserContext.Provider
      value={{
        token,
        setToken,
        refreshToken,
        setRefreshToken,
        username,
        email,
        preferredCurrency,
        updatePreferredCurrency,
        updateUserProfile,
        fetchUserProfile,
        handleLogout,
        error,
        login,
        register,
        verifyEmail,
        resendVerificationEmail,
        forgotPassword,
        resetPassword,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};