import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CommandCenter from './pages/CommandCenter';
import Forecasting from './pages/Forecasting';
import CRM from './pages/CRM';
import Compliance from './pages/Compliance';
import Copilot from './pages/Copilot';
import SkuDashboard from './pages/SkuDashboard';
import LogisticsKds from './pages/LogisticsKds';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="command-center" element={<CommandCenter />} />
          <Route path="forecasting" element={<Forecasting />} />
          <Route path="crm" element={<CRM />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="copilot" element={<Copilot />} />
          <Route path="sku-dashboard" element={<SkuDashboard />} />
          <Route path="logistics-kds" element={<LogisticsKds />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
