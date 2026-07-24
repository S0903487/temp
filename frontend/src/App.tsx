import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './features/auth';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import PublicOnlyRoute from './features/auth/components/PublicOnlyRoute';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import InfluencersPage from './features/influencers/InfluencersPage';
import InfluencerProfilePage from './features/influencers/InfluencerProfilePage';
import CampaignsPage from './features/campaigns/CampaignsPage';
import ClientsPage from './features/clients/ClientsPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import AiPage from './features/ai/AiPage';
import SettingsPage from './features/settings/SettingsPage';
import AccountsPage from './features/accounts/AccountsPage';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute cache freshness
      gcTime: 10 * 60 * 1000, // 10 minutes memory retention
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes — redirect to the dashboard if already signed in */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected app routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/influencers" element={<InfluencersPage />} />
              <Route path="/influencers/:id" element={<InfluencerProfilePage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/ai" element={<AiPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
