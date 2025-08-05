const ResendEmailMessage = ({
  email,
  resendMessage,
  resendLoading,
  onResend,
}) => (
  <div className="alert alert-success" role="alert">
    <p>
      Registration successful! Please check your email to verify your account.
    </p>
    <p>
      Didn't receive the email?{" "}
      <button
        onClick={onResend}
        disabled={resendLoading}
        className="resend-link"
        style={{
          background: "none",
          border: "none",
          color: "#e412a5ff",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {resendLoading ? "Sending..." : "Click to resend"}
      </button>
    </p>
    {resendMessage && (
      <p
        className={`alert ${
          resendMessage.includes("successfully")
            ? "alert-success"
            : "alert-danger"
        }`}
      >
        {resendMessage}
      </p>
    )}
  </div>
);

export default ResendEmailMessage;
