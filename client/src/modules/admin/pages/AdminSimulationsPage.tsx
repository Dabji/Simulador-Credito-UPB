import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import { useState } from 'react';

export function AdminSimulationsPage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-white"
      onClick={() => { if (profileOpen) setProfileOpen(false); }}
    >
      <UpbHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((p) => !p)}
      />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 py-12">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
          Gestión de Simulaciones
        </h1>
        <p className="text-gray-500 mb-8">Módulo en construcción.</p>
        <button
          type="button"
          onClick={() => navigate('/admin/main')}
          className="px-6 py-3 rounded-xl font-semibold text-white bg-[#6E11B0] hover:bg-[#8b14e0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6E11B0]"
        >
          Volver al menú
        </button>
      </main>
      <UpbFooter />
    </div>
  );
}
