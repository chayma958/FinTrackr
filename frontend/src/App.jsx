import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "@context/UserContext";
import { TransactionProvider } from "@context/TransactionContext";
import AuthPage from "@pages/AuthPage";
import Dashboard from "@pages/Dashboard";
import ProtectedRoute from "@components/ProtectedRoute";
import Navbar from "@components/Navbar";
import VerifyEmail from "@pages/VerifyEmail";
import ResetPassword from "@pages/ResetPassword";
import { useContext } from "react";
import { UserContext } from "@context/UserContext";

const AppContent = () => {
  const { token, loading } = useContext(UserContext) || {};

  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            loading ? null : token ? <Navigate to="/dashboard" replace /> : <AuthPage />
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <UserProvider>
        <TransactionProvider>
          <AppContent />
        </TransactionProvider>
      </UserProvider>
    </BrowserRouter>
  );
};

export default App;