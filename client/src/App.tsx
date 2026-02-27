import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorPage }       from './modules/simulator/pages/SimulatorPage';
import { CreateSimulationPage } from './modules/simulator/pages/CreateSimulationPage';
import { MainStudentPage }      from './modules/simulator/pages/MainStudentPage';
import { StudentHistoryPage }   from './modules/simulator/pages/StudentHistoryPage';
import { AdminDashboard }       from './modules/admin/pages/AdminDashboard';
import { Layout }               from './shared/components/Layout';

/* ── Helper: extrae el role del JWT almacenado en localStorage ──────────
   Decodifica el payload base64url sin librerías externas.
   Roles esperados: "student" | "admin"
   Si no hay token o está malformado → retorna "guest". */
type UserRole = 'student' | 'admin' | 'guest';

function getRoleFromToken(): UserRole {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'guest';
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return 'guest';
    // base64url → base64 estándar
    const padded  = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(padded)) as Record<string, unknown>;
    const role    = decoded['role'];
    if (role === 'admin' || role === 'student') return role;
    return 'guest';
  } catch {
    return 'guest';
  }
}

/* ── Guard de ruta admin ────────────────────────────────────────────────
   Si el role no es "admin", redirige a /student/main (student) o
   a /simulator/create (guest). */
function AdminGuard({ children }: { children: React.ReactNode }): React.ReactElement {
  const role = getRoleFromToken();
  if (role === 'admin') return <>{children}</>;
  if (role === 'student') return <Navigate to="/student/main" replace />;
  return <Navigate to="/simulator/create" replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección raíz */}
        <Route path="/" element={<Navigate to="/student/main" replace />} />

        {/* ── Rutas del estudiante (HU-08) ── */}
        <Route path="/student/main"    element={<MainStudentPage />} />
        <Route path="/student/history" element={<StudentHistoryPage />} />

        {/* ── Simulación pública HU-13 ── */}
        <Route path="/simulator/create" element={<CreateSimulationPage />} />

        {/* ── Rutas con Layout legacy ── */}
        <Route element={<Layout />}>
          <Route path="/simulator" element={<SimulatorPage />} />
          {/* Admin: bloqueado para roles no-admin */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/student/main" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
