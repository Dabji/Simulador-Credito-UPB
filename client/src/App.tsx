import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimulatorPage } from './modules/simulator/pages/SimulatorPage';
import { CreateSimulationPage } from './modules/simulator/pages/CreateSimulationPage';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';
import { Layout } from './shared/components/Layout';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página principal: formulario de simulación */}
        <Route path="/" element={<Navigate to="/simulator/create" replace />} />
        <Route path="/simulator/create" element={<CreateSimulationPage />} />

        {/* Rutas con Layout */}
        <Route element={<Layout />}>
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/simulator/create" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
