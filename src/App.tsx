import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './store';
import { ScrollToTop } from './components/ScrollToTop';
import { Toaster } from 'react-hot-toast';

// Pages
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { EarningsPage } from './pages/Earnings';
import { ExpensesPage } from './pages/Expenses';
import { KmPage } from './pages/Km';
import { MaintenancePage } from './pages/Maintenance';
import { AdminPage } from './pages/Admin';
import { ProfilePage } from './pages/Profile';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAppStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('malaca_token');
      const userStr = localStorage.getItem('malaca_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          login(user, token);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    checkAuth();
  }, [login]);

  if (!isAuthenticated && !localStorage.getItem('malaca_token')) {
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

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'bg-premium-black border border-premium-gold/30 text-white',
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
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
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
