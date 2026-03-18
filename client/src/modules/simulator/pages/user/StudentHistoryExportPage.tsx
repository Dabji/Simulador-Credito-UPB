// ============================================================
// PÁGINA: StudentHistoryExportPage — placeholder (exportación futura)
// Exportar una simulación guardada.
// ============================================================

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';

export function StudentHistoryExportPage() {
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

        {/* Card */}
        <div
          className="w-full rounded-3xl border border-gray-200 shadow-lg p-10 flex flex-col items-center gap-5 text-center"
          style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)' }}
        >
          {/* Ícono */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#DCFCE7' }}
          >
            <svg className="w-8 h-8" fill="none" stroke="#166534" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>

          {/* Texto */}
          <div>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ backgroundColor: '#C0D901', color: '#1a1a1a' }}
            >
              Próximamente
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Exportar Simulación
            </h1>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
              Esta sección está en construcción. Pronto podrás exportar tu simulación
              en diferentes formatos (PDF, Excel) para consultarla fuera del sistema.
            </p>
            {id && (
              <p className="mt-3 text-xs text-gray-400 font-mono">
                ID: {id}
              </p>
            )}
          </div>

          {/* Botón */}
          <button
            type="button"
            onClick={() => navigate('/student/history')}
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
            Volver al Historial
          </button>
        </div>

      </main>

      <UpbFooter />
    </div>
  );
}
