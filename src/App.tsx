import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import AddTransaction from "./pages/AddTransaction";
import TransactionsPage from "./pages/Transactions";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import BottomNav from "./components/BottomNav";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProfilePage from "./pages/Profile";
import AccountsPage from "./pages/Accounts";
import DataPage from "./pages/Data";
import LogoutPage from "./pages/Logout";
import { FullScreenLoader } from "./components/FullScreenLoader";
import StatementPage from "./pages/Statement";

function Protected() {
  const { session, loading } = useAuth();
  if (loading) {
    return <FullScreenLoader />;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function Shell() {
  return (
    <div className="app-shell mx-auto max-w-lg min-h-screen min-h-[100dvh] bg-transparent">
      <div className="pb-[calc(var(--safe-area-bottom)+6rem)] pt-2">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route element={<Shell />}>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/profile" element={<ProfilePage />} />
            <Route path="/settings/accounts" element={<AccountsPage />} />
            <Route path="/settings/data" element={<DataPage />} />
            <Route path="/settings/data/statement" element={<StatementPage />} />
            <Route path="/settings/logout" element={<LogoutPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
