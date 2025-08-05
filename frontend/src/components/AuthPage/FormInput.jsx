const FormInput = ({ label, name, type = "text", value, onChange, onBlur, error, touched, placeholder, required = true }) => {
  const id = `form-${name}`;
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        name={name}
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="form-input"
        aria-required={required}
        aria-invalid={!!error && touched}
        aria-describedby={error && touched ? `${id}-error` : undefined}
      />
      {error && touched && (
        <span id={`${id}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default FormInput;