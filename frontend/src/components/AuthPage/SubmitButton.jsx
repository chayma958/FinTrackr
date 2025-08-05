const SubmitButton = ({ label, isLoading, isDisabled, onClick }) => {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className={`submit-button ${
        !isDisabled && !isLoading ? "enabled" : "disabled"
      }`}
      aria-disabled={isDisabled || isLoading}
    >
      {isLoading && <div className="spinner"></div>}
      <span>{label}</span>
    </button>
  );
};

export default SubmitButton;
