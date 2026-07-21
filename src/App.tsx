import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Customers } from './screens/Customers';
import { Dashboard } from './screens/Dashboard';
import { Inventory } from './screens/Inventory';
import { More } from './screens/More';
import { Reports } from './screens/Reports';
import { Sales } from './screens/Sales';
import { Settings } from './screens/Settings';
import { StoreProvider } from './hooks/useStore';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sales" element={<Sales />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="more" element={<More />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
