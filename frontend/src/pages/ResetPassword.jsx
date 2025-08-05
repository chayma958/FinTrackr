import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "@context/UserContext";
import FormInput from "@components/AuthPage/FormInput";
import SubmitButton from "@components/AuthPage/SubmitButton";
import "@css/ResetPassword.css";

const ResetPassword = () => {
  const { resetPassword } = useContext(UserContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: decodeURIComponent(searchParams.get("email") || ""),
    token: searchParams.get("token") || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
    server: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = decodeURIComponent(searchParams.get("email") || "");
    const token = searchParams.get("token") || "";
    if (!email || !token) {
      setErrors((prev) => ({ ...prev, server: "Invalid or missing reset parameters" }));
    } else {
      setErrors((prev) => ({ ...prev, server: "" }));
      setFormData((prev) => ({ ...prev, email, token }));
    }
  }, [searchParams]);

  const getFormErrors = () => {
    const newErrors = { ...errors, server: "" };
    if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    } else {
      newErrors.newPassword = "";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    } else {
      newErrors.confirmPassword = "";
    }
    return newErrors;
  };

  const validateForm = () => {
    const newErrors = getFormErrors();
    return !newErrors.newPassword && !newErrors.confirmPassword && formData.email && formData.token;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]: name === "newPassword" && value.length < 6
        ? "Password must be at least 6 characters"
        : name === "confirmPassword" && value !== formData.newPassword
        ? "Passwords do not match"
        : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = getFormErrors();
    setErrors(newErrors);
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      const result = await resetPassword(formData.email, formData.token, formData.newPassword);
      setMessage(result.message || result.error);
      if (result.message) {
        setTimeout(() => navigate("/"), 3000);
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, server: err.message || "Failed to reset password" }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="reset-heading">Reset Password</h2>
        {errors.server && (
          <div className="message-container">
            <p className="error-message">{errors.server}</p>
          </div>
        )}
        {message && (
          <div className="message-container">
            <p className={message.includes("successfully") ? "success-message" : "error-message"}>
              {message}
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="form-container">
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={true}
          />
          <FormInput
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            touched={true}
            placeholder="Enter new password"
          />
          <FormInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            touched={true}
            placeholder="Confirm new password"
          />
          <SubmitButton
            label="Reset Password"
            isLoading={isLoading}
            isDisabled={isLoading || !validateForm()}
            onClick={handleSubmit}
          />
        </form>
        <div className="back-container">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="back-btn"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;