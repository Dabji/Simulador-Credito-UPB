import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorPage } from './modules/simulator/pages/SimulatorPage';
import { CreateSimulationPage } from './modules/simulator/pages/CreateSimulationPage';
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
          {/* Auth pages (públicas — redirigen a /simulator/create si ya hay sesión) */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/password-updated" element={<PasswordUpdatedPage />} />

          {/* Página principal: redirige a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas protegidas — requieren sesión activa */}
          <Route path="/simulator/create" element={<ProtectedRoute allowedRoles={['STUDENT']}><CreateSimulationPage /></ProtectedRoute>} />

          {/* Rutas con Layout (protegidas) */}
          <Route element={<Layout />}>
            <Route path="/simulator" element={<ProtectedRoute allowedRoles={['STUDENT']}><SimulatorPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
