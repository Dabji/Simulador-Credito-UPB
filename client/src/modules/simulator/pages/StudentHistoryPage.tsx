/* -----------------------------------------------------------------
   PÁGINA: StudentHistoryPage  (HU-08 — Historial de Simulaciones)
   Página placeholder para el historial del estudiante.
   Se completará en una futura historia de usuario.
------------------------------------------------------------------ */

import { useState }  from 'react';
import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';

export function StudentHistoryPage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: '#F4F1F1' }}
      onClick={() => { if (profileOpen) setProfileOpen(false); }}
    >
      <UpbHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((p) => !p)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-black text-gray-900">
          Historial de Simulaciones
        </h1>
        <p className="text-gray-500 text-center max-w-md">
          Esta sección estará disponible próximamente. Aquí podrás consultar
          todas tus simulaciones guardadas.
        </p>
        <button
          type="button"
          onClick={() => navigate('/student/main')}
          className="px-6 py-3 rounded-full font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          style={{ backgroundColor: '#6E11B0' }}
        >
          Volver al inicio
        </button>
      </main>

      <UpbFooter />
    </div>
  );
}
