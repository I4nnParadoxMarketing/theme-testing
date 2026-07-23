import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { StoreProvider } from './hooks/useStore';
import { Customers } from './screens/Customers';
import { Dashboard } from './screens/Dashboard';
import { Inventory } from './screens/Inventory';
import { Login } from './screens/Login';
import { More } from './screens/More';
import { Reports } from './screens/Reports';
import { Sales } from './screens/Sales';
import { Settings } from './screens/Settings';
import { Staff } from './screens/Staff';

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-screen">
        <p className="empty-block">Loading Gaba Hardware…</p>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <StoreProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sales" element={<Sales />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="more" element={<More />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="staff" element={<Staff />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </StoreProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedApp />
      </BrowserRouter>
    </AuthProvider>
  );
}
