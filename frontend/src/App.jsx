import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';

const Gym = lazy(() => import('./pages/Gym'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Progression = lazy(() => import('./pages/Progression'));
const Categories = lazy(() => import('./pages/Categories'));
const Settings = lazy(() => import('./pages/Settings'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="gym" element={<Suspense fallback={<PageFallback />}><Gym /></Suspense>} />
        <Route path="calendar" element={<Suspense fallback={<PageFallback />}><CalendarPage /></Suspense>} />
        <Route path="statistics" element={<Suspense fallback={<PageFallback />}><Statistics /></Suspense>} />
        <Route path="progression" element={<Suspense fallback={<PageFallback />}><Progression /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={<PageFallback />}><Categories /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
