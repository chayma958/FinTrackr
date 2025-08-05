import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import SubmitButton from "./SubmitButton";

const currencyOptions = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "TND", label: "Tunisian Dinar (TND)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
];

const RegisterForm = ({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
  onSubmit,
  isLoading,
  isFormValid,
}) => {
  return (
    <div className="form-container">
      <FormInput
        label="Username"
        name="username"
        value={formData.username}
        onChange={onChange}
        onBlur={onBlur}
        error={errors.username}
        touched={touched.username}
        placeholder="Enter username"
      />
      <FormInput
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={onChange}
        onBlur={onBlur}
        error={errors.email}
        touched={touched.email}
        placeholder="Enter email"
      />
      <FormInput
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={onChange}
        onBlur={onBlur}
        error={errors.password}
        touched={touched.password}
        placeholder="Enter password"
      />
      <FormInput
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={onChange}
        onBlur={onBlur}
        error={errors.confirmPassword}
        touched={touched.confirmPassword}
        placeholder="Confirm password"
      />
      <FormSelect
        label="Preferred Currency"
        name="preferredCurrency"
        value={formData.preferredCurrency}
        onChange={onChange}
        onBlur={onBlur}
        error={errors.preferredCurrency}
        touched={touched.preferredCurrency}
        options={currencyOptions}
      />
      <SubmitButton
        label="Register"
        isLoading={isLoading}
        isDisabled={!isFormValid || isLoading}
        onClick={onSubmit}
      />
    </div>
  );
};

export default RegisterForm;
