import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "@context/UserContext";
import {
  Container,
  Card,
  Box,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import "@css/VerifyEmail.css";

const VerifyEmail = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const hasVerified = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useContext(UserContext);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setError("Invalid or missing verification token or email");
      setLoading(false);
      return;
    }

    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;

    const verify = async () => {
      try {
        const result = await verifyEmail(email, token);
        if (result.message) {
          setMessage(result.message);
          setError("");
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } else {
          setError(result.error);
          setMessage("");
        }
      } catch (err) {
        setError(err.message || "Email verification failed");
        setMessage("");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams, navigate, verifyEmail]);

  return (
    <Container className="verify-email-container">
      <Card className="verify-email-card">
        {loading && (
          <Box className="verify-email-text">
            <Typography className="verify-email-text-primary">
              Verifying email...
            </Typography>
            <CircularProgress className="verify-email-spinner" />
          </Box>
        )}
        {!loading && error && (
          <Box className="verify-email-text">
            <Typography className="verify-email-text-error">{error}</Typography>
            <Typography className="verify-email-text-secondary">
              If your verification link has expired, please{" "}
              <Button
                className="verify-email-button"
                onClick={() =>
                  navigate(
                    `/?resend=true&email=${encodeURIComponent(
                      searchParams.get("email") || ""
                    )}`
                  )
                }
              >
                request a new verification email
              </Button>
              .
            </Typography>
          </Box>
        )}
        {!loading && message && (
          <Box className="verify-email-text">
            <Typography className="verify-email-text-primary">
              {message}
              <br />
              Redirecting to login...
            </Typography>
            <CircularProgress className="verify-email-spinner" />
          </Box>
        )}
      </Card>
    </Container>
  );
};

export default VerifyEmail;
