import FormInput from "./FormInput";
import SubmitButton from "./SubmitButton";

const LoginForm = ({ formData, onChange, onSubmit, isLoading, errors, onForgotPasswordClick }) => {
  return (
    <div className="form-container">
      <FormInput
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={onChange}
        placeholder="Enter email"
        error={errors.email}
        touched={true}
      />
      <FormInput
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={onChange}
        placeholder="Enter password"
        error={errors.password}
        touched={true}
      />
      <div>
        <button
          type="button"
          onClick={onForgotPasswordClick}
          className="forgot-password-btn"
        >
          Forgot Password?
        </button>
      </div>
      <SubmitButton
        label="Login"
        isLoading={isLoading}
        isDisabled={isLoading}
        onClick={onSubmit}
      />
    </div>
  );
};

export default LoginForm;