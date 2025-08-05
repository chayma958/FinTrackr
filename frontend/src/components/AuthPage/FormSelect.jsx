const FormSelect = ({ label, name, value, onChange, onBlur, error, touched, options, required = true }) => {
  const id = `form-${name}`;
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <select
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="form-input"
        aria-required={required}
        aria-invalid={!!error && touched}
        aria-describedby={error && touched ? `${id}-error` : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && touched && (
        <span id={`${id}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default FormSelect;