import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { msalInstance } from './auth/msalInstance';
import { MsalProvider } from '@azure/msal-react';
import { ConfigProvider, App as AntApp } from 'antd';
import { RoleProvider } from './context/RoleContext';
import { DemoIdentityProvider } from './context/DemoIdentityContext';
import { UnreadCountsProvider } from './context/UnreadContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import InboxPage from './pages/InboxPage';
import NewTicketPage from './pages/NewTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import type { Role } from './types';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route path="/inbox" element={<RoleRoute roles={allRoles}><InboxPage /></RoleRoute>} />
        <Route path="/sent" element={<RoleRoute roles={allRoles}><InboxPage /></RoleRoute>} />
        <Route path="/need-action" element={<RoleRoute roles={['manager', 'it']}><InboxPage /></RoleRoute>} />
        <Route path="/all" element={<RoleRoute roles={['it']}><InboxPage /></RoleRoute>} />
        <Route path="/handled" element={<RoleRoute roles={['it']}><InboxPage /></RoleRoute>} />
        <Route path="/new" element={<RoleRoute roles={allRoles}><NewTicketPage /></RoleRoute>} />
        <Route path="/tickets/:id" element={<RoleRoute roles={allRoles}><TicketDetailPage /></RoleRoute>} />
        <Route path="/admin" element={<RoleRoute roles={['it']}><AdminPage /></RoleRoute>} />
        <Route path="/dashboard" element={<RoleRoute roles={['it', 'manager']}><DashboardPage /></RoleRoute>} />
      </Route>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/inbox" replace />} />
    </Routes>
  );
}

const allRoles: Role[] = ['employee', 'manager', 'it'];

export default function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <ConfigProvider
        theme={{ token: { colorPrimary: '#1677ff', borderRadius: 8 } }}
      >
        <AntApp>
          <DemoIdentityProvider>
            <UnreadCountsProvider>
              <RoleProvider>
                <BrowserRouter>
                  <ErrorBoundary>
                    <AppRoutes />
                  </ErrorBoundary>
                </BrowserRouter>
              </RoleProvider>
            </UnreadCountsProvider>
          </DemoIdentityProvider>
        </AntApp>
      </ConfigProvider>
    </MsalProvider>
  );
}