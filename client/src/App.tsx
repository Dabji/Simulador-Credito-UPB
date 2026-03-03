import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorPage } from './modules/simulator/pages/SimulatorPage';
import { CreateSimulationPage } from './modules/simulator/pages/CreateSimulationPage';
import { MainStudentPage } from './modules/simulator/pages/MainStudentPage';
import { StudentHistoryPage } from './modules/simulator/pages/StudentHistoryPage';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { ForgotPasswordPage } from './modules/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './modules/auth/pages/ResetPasswordPage';
import { PasswordUpdatedPage } from './modules/auth/pages/PasswordUpdatedPage';
import { Layout } from './shared/components/Layout';
import { AuthProvider } from './modules/auth/context/AuthContext';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { PublicRoute } from './shared/components/PublicRoute';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages (públicas — redirigen si ya hay sesión) */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/password-updated" element={<PasswordUpdatedPage />} />

          {/* Página principal: redirige a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Rutas del estudiante (HU-08) ── */}
          <Route path="/student/main" element={<ProtectedRoute requiredRole="STUDENT"><MainStudentPage /></ProtectedRoute>} />
          <Route path="/student/history" element={<ProtectedRoute requiredRole="STUDENT"><StudentHistoryPage /></ProtectedRoute>} />

          {/* Rutas protegidas — requieren sesión activa */}
          <Route path="/simulator/create" element={<ProtectedRoute requiredRole="STUDENT"><CreateSimulationPage /></ProtectedRoute>} />

          {/* Rutas con Layout (protegidas) */}
          <Route element={<Layout />}>
            <Route path="/simulator" element={<ProtectedRoute requiredRole="STUDENT"><SimulatorPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
