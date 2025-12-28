import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import HomePage from '@/pages/index';
import LoginPage from '@/pages/login';
import DirectorLoginPage from '@/pages/login-director';
import ProfilePage from '@/pages/profile';
import { useAuthStore } from '@/store/auth.store';
import { useSocketStore } from '@/services/socket';
import { useThemeStore } from '@/store/theme.store';

// Protected Route Component (Redirects to Login if not authenticated)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (Redirects to Profile if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { token, isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const { theme } = useThemeStore();

  // Apply theme on initial render
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated && token) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      connect(`${protocol}//${host}/ws`, token);
    } else {
      disconnect();
    }
  }, [isAuthenticated, token, connect, disconnect]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/login/director"
            element={
              <PublicRoute>
                <DirectorLoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </>
  );
}

export default App;
