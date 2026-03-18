// ============================================================
// PÁGINA: AdminSimulationDetailPage — placeholder (HU futura)
// Ver detalle de una simulación desde panel admin.
// ============================================================

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';

export function AdminSimulationDetailPage() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-white"
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (profileOpen && !t.closest('[data-profile-menu]')) setProfileOpen(false);
      }}
    >
      <UpbHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen(p => !p)}
      />

      <main className="flex-1 w-full max-w-screen-md mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center gap-6">

        <div
          className="w-full rounded-3xl border border-gray-200 shadow-lg p-10 flex flex-col items-center gap-5 text-center"
          style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 100%)' }}
        >
          {/* Ícono */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#EDE9FE' }}
          >
            <svg className="w-8 h-8" fill="none" stroke="#6E11B0" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ backgroundColor: '#C0D901', color: '#1a1a1a' }}
            >
              Próximamente
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Ver Simulación (Admin)
            </h1>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
              Esta sección está en construcción. Pronto podrás ver el detalle completo
              de la simulación seleccionada, incluyendo el resumen financiero y la
              tabla de amortización del estudiante.
            </p>
            {id && (
              <p className="mt-3 text-xs text-gray-400 font-mono">
                ID: {id}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/simulations')}
            className="
              inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white
              transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40
            "
            style={{ backgroundColor: '#6E11B0', boxShadow: '0 4px 14px rgba(110,17,176,0.25)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Gestión de Simulaciones
          </button>
        </div>

      </main>

      <UpbFooter />
    </div>
  );
}
