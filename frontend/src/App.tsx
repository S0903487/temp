import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './features/auth';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import PublicOnlyRoute from './features/auth/components/PublicOnlyRoute';
import AppLayout from './components/layout/AppLayout';
import './App.css';

// Route-level code splitting. Auth pages stay eager (they're the first
// thing an unauthenticated visitor needs), everything behind the login
// wall is lazy — a first-time visitor no longer downloads the analytics,
// AI, and settings pages before they've even logged in. This is what was
// behind the "chunks larger than 500kB" build warning: it was one bundle
// containing every page in the app.
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const InfluencersPage = lazy(() => import('./features/influencers/InfluencersPage'));
const InfluencerProfilePage = lazy(() => import('./features/influencers/InfluencerProfilePage'));
const CampaignsPage = lazy(() => import('./features/campaigns/CampaignsPage'));
const ClientsPage = lazy(() => import('./features/clients/ClientsPage'));
const AnalyticsPage = lazy(() => import('./features/analytics/AnalyticsPage'));
const AiPage = lazy(() => import('./features/ai/AiPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));
const AccountsPage = lazy(() => import('./features/accounts/AccountsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal, dependency-free fallback so a route chunk loading in doesn't
// flash a blank screen. Kept intentionally plain — this shows for a few
// hundred ms on a cold chunk load, not worth animating.
function RouteFallback() {
  return <div style={{ padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>Loading…</div>;
}

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
              <Route
                path="/dashboard"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="/influencers"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <InfluencersPage />
                  </Suspense>
                }
              />
              <Route
                path="/influencers/:id"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <InfluencerProfilePage />
                  </Suspense>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <CampaignsPage />
                  </Suspense>
                }
              />
              <Route
                path="/clients"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <ClientsPage />
                  </Suspense>
                }
              />
              <Route
                path="/analytics"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AnalyticsPage />
                  </Suspense>
                }
              />
              <Route
                path="/accounts"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AccountsPage />
                  </Suspense>
                }
              />
              <Route
                path="/ai"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AiPage />
                  </Suspense>
                }
              />
              <Route
                path="/settings"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <SettingsPage />
                  </Suspense>
                }
              />
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
