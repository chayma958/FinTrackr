import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "@context/UserContext";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children }) => {
  const { token, handleLogout, isLoading } = useContext(UserContext);

  if (isLoading) {
    return null;
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const { exp } = jwtDecode(token);
    if (Date.now() >= exp * 1000) {
      handleLogout();
      return <Navigate to="/" replace />;
    }
  } catch {
    handleLogout();
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
