import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import AiPage from '../../features/ai/AiPage'
import AnalyticsPage from '../../features/analytics/AnalyticsPage'
import CampaignsPage from '../../features/campaigns/CampaignsPage'
import ClientsPage from '../../features/clients/ClientsPage'
import DashboardPage from '../../features/dashboard/DashboardPage'
import InfluencersPage from '../../features/influencers/InfluencersPage'
import InfluencerProfilePage from '../../features/influencers/InfluencerProfilePage'
import SettingsPage from '../../features/settings/SettingsPage'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/influencers" element={<InfluencersPage />} />
          <Route path="/influencers/:id" element={<InfluencerProfilePage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
