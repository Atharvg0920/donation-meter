import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import CampaignForm from './pages/CampaignForm.jsx';
import CampaignDetail from './pages/CampaignDetail.jsx';
import QrPage from './pages/QrPage.jsx';
import DisplayPage from './pages/DisplayPage.jsx';
import DonatePage from './pages/DonatePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/campaigns/new" element={<CampaignForm />} />
      <Route path="/admin/campaigns/:id/edit" element={<CampaignForm />} />
      <Route path="/admin/campaigns/:id" element={<CampaignDetail />} />
      <Route path="/admin/campaigns/:id/qr" element={<QrPage />} />
      <Route path="/display/:id" element={<DisplayPage />} />
      <Route path="/donate/:id" element={<DonatePage />} />
      <Route path="*" element={<div className="p-10 text-center">Page not found</div>} />
    </Routes>
  );
}
