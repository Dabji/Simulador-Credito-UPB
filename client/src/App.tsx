import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorPage } from './modules/simulator/pages/SimulatorPage';
import { CreateSimulationPage } from './modules/simulator/pages/CreateSimulationPage';
import { MainStudentPage } from './modules/simulator/pages/MainStudentPage';
import { StudentHistoryPage } from './modules/simulator/pages/StudentHistoryPage';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';
import { AdminMainPage } from './modules/admin/pages/AdminMainPage';
import { AdminStudentsPage } from './modules/admin/pages/AdminStudentsPage';
import { AdminParametersPage } from './modules/admin/pages/AdminParametersPage';
import { AdminSimulationsPage } from './modules/admin/pages/AdminSimulationsPage';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { ForgotPasswordPage } from './modules/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './modules/auth/pages/ResetPasswordPage';
import { PasswordUpdatedPage } from './modules/auth/pages/PasswordUpdatedPage';
import { Layout } from './shared/components/Layout';
import { AuthProvider } from './modules/auth/context/AuthContext';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { PublicRoute } from './shared/components/PublicRoute';
import { LandingPage } from './modules/landing/pages/LandingPage';

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

          {/* Página principal: Landing pública */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

          {/* ── Rutas del estudiante (HU-08) ── */}
          <Route path="/student/main" element={<ProtectedRoute requiredRole="STUDENT"><MainStudentPage /></ProtectedRoute>} />
          <Route path="/student/history" element={<ProtectedRoute requiredRole="STUDENT"><StudentHistoryPage /></ProtectedRoute>} />

          {/* Rutas protegidas — requieren sesión activa */}
          <Route path="/simulator/create" element={<ProtectedRoute requiredRole="STUDENT"><CreateSimulationPage /></ProtectedRoute>} />

          {/* ── Rutas del administrador (HU-09) ── */}
          <Route path="/admin" element={<Navigate to="/admin/main" replace />} />
          <Route path="/admin/main" element={<ProtectedRoute requiredRole="ADMIN"><AdminMainPage /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute requiredRole="ADMIN"><AdminStudentsPage /></ProtectedRoute>} />
          <Route path="/admin/parameters" element={<ProtectedRoute requiredRole="ADMIN"><AdminParametersPage /></ProtectedRoute>} />
          <Route path="/admin/simulations" element={<ProtectedRoute requiredRole="ADMIN"><AdminSimulationsPage /></ProtectedRoute>} />

          {/* Rutas con Layout (protegidas) */}
          <Route element={<Layout />}>
            <Route path="/simulator" element={<ProtectedRoute requiredRole="STUDENT"><SimulatorPage /></ProtectedRoute>} />
            <Route path="/admin/legacy" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
