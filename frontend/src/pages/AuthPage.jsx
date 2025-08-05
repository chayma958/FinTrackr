import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TransactionContext } from "@context/TransactionContext";
import { UserContext } from "@context/UserContext";
import TabNavigation from "@components/AuthPage/TabNavigation";
import LoginForm from "@components/AuthPage/LoginForm";
import RegisterForm from "@components/AuthPage/RegisterForm";
import ResendEmailMessage from "@components/AuthPage/ResendEmailMessage";
import ErrorMessage from "@components/AuthPage/ErrorMessage";
import FormInput from "@components/AuthPage/FormInput";
import SubmitButton from "@components/AuthPage/SubmitButton";
import "@css/AuthPage.css";

const AuthPage = () => {
  const { fetchTransactions } = useContext(TransactionContext);
  const {
    login,
    register,
    token,
    resendVerificationEmail,
    forgotPassword,
    error,
  } = useContext(UserContext);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredCurrency: "USD",
  });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: "" });
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredCurrency: "",
    server: "",
  });
  const [registerTouched, setRegisterTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
    preferredCurrency: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  useEffect(() => {
    setIsFormValid(validateForm());
  }, [
    loginForm,
    registerForm,
    forgotPasswordForm,
    registerTouched,
    isRegister,
    isForgotPassword,
  ]);

  useEffect(() => {
    if (error) {
      setErrors((prev) => ({ ...prev, server: error }));
    }
  }, [error]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === "username") newErrors.username = "";
    if (name === "email" && (registerTouched.email || isForgotPassword)) {
      newErrors.email =
        value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? "Invalid email format"
          : "";
    }
    if (name === "password" && registerTouched.password) {
      newErrors.password =
        value && value.length < 6
          ? "Password must be at least 6 characters"
          : "";
    }
    if (name === "confirmPassword" && registerTouched.confirmPassword) {
      newErrors.confirmPassword =
        value && value !== registerForm.password
          ? "Passwords do not match"
          : "";
    }
    if (name === "preferredCurrency") newErrors.preferredCurrency = "";
    return newErrors;
  };

  const validateForm = () => {
    if (isRegister) {
      const newErrors = { ...errors, server: "" };
      if (
        registerTouched.email &&
        registerForm.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)
      ) {
        newErrors.email = "Invalid email format";
      } else {
        newErrors.email = "";
      }
      if (
        registerTouched.password &&
        registerForm.password &&
        registerForm.password.length < 6
      ) {
        newErrors.password = "Password must be at least 6 characters";
      } else {
        newErrors.password = "";
      }
      if (
        registerTouched.confirmPassword &&
        registerForm.confirmPassword &&
        registerForm.password !== registerForm.confirmPassword
      ) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        newErrors.confirmPassword = "";
      }
      newErrors.username = "";
      newErrors.preferredCurrency = "";
      setErrors(newErrors);
      return (
        !newErrors.email &&
        !newErrors.password &&
        !newErrors.confirmPassword &&
        registerForm.username.trim() &&
        registerForm.email.trim() &&
        registerForm.password.trim() &&
        registerForm.confirmPassword.trim() &&
        registerForm.preferredCurrency
      );
    } else if (isForgotPassword) {
      const newErrors = { ...errors, server: "" };
      if (
        forgotPasswordForm.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordForm.email)
      ) {
        newErrors.email = "Invalid email format";
      } else {
        newErrors.email = "";
      }
      setErrors(newErrors);
      return !newErrors.email && forgotPasswordForm.email.trim();
    } else {
      setErrors({ ...errors, email: "", password: "", server: "" });
      return true;
    }
  };

  const handleLoginClick = () => {
    setIsLogin(true);
    setIsRegister(false);
    setIsForgotPassword(false);
    setErrors({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      preferredCurrency: "",
      server: "",
    });
    setRegisterTouched({
      username: false,
      email: false,
      password: false,
      confirmPassword: false,
      preferredCurrency: false,
    });
    setResendMessage("");
    setForgotPasswordMessage("");
    setIsFormValid(true);
  };

  const handleRegisterClick = () => {
    setIsLogin(false);
    setIsRegister(true);
    setIsForgotPassword(false);
    setErrors({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      preferredCurrency: "",
      server: "",
    });
    setRegisterTouched({
      username: false,
      email: false,
      password: false,
      confirmPassword: false,
      preferredCurrency: false,
    });
    setIsSubmitted(false);
    setResendMessage("");
    setForgotPasswordMessage("");
  };

  const handleForgotPasswordClick = () => {
    setIsLogin(true);
    setIsRegister(false);
    setIsForgotPassword(true);
    setErrors({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      preferredCurrency: "",
      server: "",
    });
    setRegisterTouched({
      username: false,
      email: false,
      password: false,
      confirmPassword: false,
      preferredCurrency: false,
    });
    setResendMessage("");
    setForgotPasswordMessage("");
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
    setRegisterTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateField(name, value));
  };

  const handleForgotPasswordChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordForm((prev) => ({ ...prev, [name]: value }));
    setErrors(validateField(name, value));
  };

  const handleRegisterBlur = (e) => {
    const { name, value } = e.target;
    setRegisterTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateField(name, value));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(loginForm.email, loginForm.password);
    if (success) {
      navigate("/dashboard");
      await fetchTransactions(token);
    }
    setIsLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    const success = await register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
      preferredCurrency: registerForm.preferredCurrency,
    });
    if (success) {
      setRegisteredEmail(registerForm.email);
      setIsSubmitted(true);
      handleLoginClick();
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsLoading(true);
      const result = await forgotPassword(forgotPasswordForm.email);
      setForgotPasswordMessage(result.message || result.error);
    } catch (err) {
      setForgotPasswordMessage(
        err.message || "Failed to send password reset email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const email = loginForm.email || registeredEmail;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResendMessage(
        "Please enter a valid email in the login form or register again."
      );
      return;
    }
    try {
      setResendLoading(true);
      const result = await resendVerificationEmail(email);
      setResendMessage(result.message || result.error);
    } catch (err) {
      setResendMessage(err.message || "Failed to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <TabNavigation
          isLogin={isLogin}
          onLoginClick={handleLoginClick}
          onRegisterClick={handleRegisterClick}
        />
        {errors.server && <ErrorMessage message={errors.server} />}
        {isSubmitted && isLogin && (
          <ResendEmailMessage
            email={registeredEmail}
            resendMessage={resendMessage}
            resendLoading={resendLoading}
            onResend={handleResendEmail}
          />
        )}
        {isForgotPassword && forgotPasswordMessage && (
          <div className="message-container">
            <p
              className={
                forgotPasswordMessage.includes("successfully")
                  ? "success-message"
                  : "error-message"
              }
            >
              {forgotPasswordMessage}
            </p>
          </div>
        )}
        {isRegister && (
          <RegisterForm
            formData={registerForm}
            errors={errors}
            touched={registerTouched}
            onChange={handleRegisterChange}
            onBlur={handleRegisterBlur}
            onSubmit={handleRegister}
            isLoading={isLoading}
            isFormValid={isFormValid}
          />
        )}
        {isLogin && !isForgotPassword && (
          <LoginForm
            formData={loginForm}
            onChange={handleLoginChange}
            onSubmit={handleLogin}
            isLoading={isLoading}
            errors={errors}
            onForgotPasswordClick={handleForgotPasswordClick}
          />
        )}
        {isForgotPassword && (
          <form onSubmit={handleForgotPassword} className="form-container">
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={forgotPasswordForm.email}
              onChange={handleForgotPasswordChange}
              placeholder="Enter your email"
              error={errors.email}
              touched={true}
            />
            <SubmitButton
              label="Send Reset Link"
              isLoading={isLoading}
              isDisabled={isLoading || !isFormValid}
              onClick={handleForgotPassword}
            />
            <div>
              <button
                type="button"
                onClick={handleLoginClick}
                className="back-btn"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
