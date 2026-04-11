import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './store';
import { ScrollToTop } from './components/ScrollToTop';
import { NotificationPermissionPrompt } from './components/notifications/NotificationPermissionPrompt';
import { Toaster } from 'react-hot-toast';
import { canAccessRoute } from './config/planRoutes';
import type { PlanType } from './types';

// Pages
import { LoginPage } from './pages/Login';
import { RegisterStep1Page } from './pages/RegisterStep1';
import { RegisterStep2Page } from './pages/RegisterStep2';
import { ResetPasswordPage } from './pages/ResetPassword';
import { DashboardPage } from './pages/Dashboard';
import { EarningsPage } from './pages/Earnings';
import { ExpensesPage } from './pages/Expenses';
import { KmPage } from './pages/Km';
import { MaintenancePage } from './pages/Maintenance';
import { ProfilePage } from './pages/Profile';
import { NotificationsHistoryPage } from './pages/NotificationsHistory';
import { ChatPage } from './pages/Chat';
import { PlansPage } from './pages/Plans';
import { UserProfilePage } from './pages/UserProfile';
import { FollowListPage } from './pages/FollowList';
import { VehiclesPage } from './pages/Vehicles';

// Admin Pages
import { AdminOverviewPage } from './pages/AdminOverview';
import { AdminUsersPage } from './pages/AdminUsers';
import { AdminAnalyticsPage } from './pages/AdminAnalytics';
import { AdminLogsPage } from './pages/AdminLogs';
import { AdminAlertsPage } from './pages/AdminAlerts';
import { AdminNotificationsPanel } from './pages/AdminNotifications';
import { AdminPlansPage } from './pages/AdminPlans';
import { usePlanStore } from './store/planStore';
import { useNotificationStore } from './store/notificationStore';

const AdminPage = AdminOverviewPage;

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login, user } = useAppStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) return;

      const legacyToken = localStorage.getItem('malaca_token');
      const legacyUserStr = localStorage.getItem('malaca_user');
      
      if (legacyToken && legacyUserStr) {
        try {
          const legacyUser = JSON.parse(legacyUserStr);
          login(legacyUser, legacyToken);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('malaca_token');
          localStorage.removeItem('malaca_user');
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, login]);

  const token = localStorage.getItem('malaca_token');
  const storage = localStorage.getItem('malaca-finance-storage');
  
  let persistentIsAuthenticated = false;
  if (storage) {
    try {
      const parsed = JSON.parse(storage);
      persistentIsAuthenticated = parsed.state?.isAuthenticated;
    } catch (e) {}
  }

  const hasAuth = isAuthenticated || !!token || persistentIsAuthenticated;

  if (!hasAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAppStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

// Plan-gated Route Component — redirects to /planos if plan is insufficient
function PlanRoute({ children, path }: { children: React.ReactNode; path: string }) {
  const { isAuthenticated } = useAppStore();
  const userPlan = usePlanStore((s) => s.userPlan);
  const planName: PlanType = (userPlan?.plano_nome ?? 'free') as PlanType;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccessRoute(planName, path)) return <Navigate to="/planos" replace />;

  return <>{children}</>;
}

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');
  const { user } = useAppStore();
  const { fetchPlans, fetchUserPlan, fetchFeatures } = usePlanStore();
  const { init: initNotifications, cleanup: cleanupNotifications } = useNotificationStore();

  useEffect(() => {
    fetchPlans();
    fetchFeatures();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchUserPlan();
      initNotifications(user.id);
      return () => cleanupNotifications();
    }
  }, [user?.id]);
  
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'bg-premium-black border border-primary/30 text-white',
          style: {
            background: '#121212',
            color: '#fff',
            border: '1px solid rgba(197, 160, 89, 0.3)',
            padding: '16px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '12px',
          },
        }}
      />
      
      {/* Mostrar prompt de notificações se usuário estiver autenticado */}
      {user?.id && <NotificationPermissionPrompt userId={user.id} />}
      
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterStep1Page />} />
        <Route path="/register-step2" element={<RegisterStep2Page />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ganhos"
          element={
            <ProtectedRoute>
              <EarningsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/despesas"
          element={
            <ProtectedRoute>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/km"
          element={
            <ProtectedRoute>
              <KmPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/manutencao"
          element={
            <ProtectedRoute>
              <MaintenancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/veiculos"
          element={
            <ProtectedRoute>
              <VehiclesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/planos"
          element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/:userId"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil/:username"
          element={
            <UserProfilePage />
          }
        />

        <Route
          path="/user/:userId/follows"
          element={
            <ProtectedRoute>
              <FollowListPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminOverviewPage />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminAnalyticsPage />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/logs"
          element={
            <AdminRoute>
              <AdminLogsPage />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/alerts"
          element={
            <AdminRoute>
              <AdminAlertsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/notifications"
          element={
            <AdminRoute>
              <AdminNotificationsPanel />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/plans"
          element={
            <AdminRoute>
              <AdminPlansPage />
            </AdminRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
