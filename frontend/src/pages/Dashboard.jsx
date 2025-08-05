import { useContext, useEffect } from "react";
import { Container } from "@mui/material";
import { Routes, Route, useNavigate } from "react-router-dom";
import { UserContext } from "@context/UserContext";
import TransactionForm from "@pages/TransactionForm";
import TransactionList from "@pages/TransactionList";
import TransactionCharts from "@pages/TransactionCharts";
import Settings from "@pages/Settings";

const Dashboard = () => {
  const { token } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <Container maxWidth="md" sx={{ mt: 15, mb: 4 }}>
      <Routes>
        <Route path="" element={<TransactionForm />} />
        <Route path="list" element={<TransactionList />} />
        <Route path="charts" element={<TransactionCharts />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </Container>
  );
};

export default Dashboard;
