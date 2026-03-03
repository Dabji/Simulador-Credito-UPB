import { Link } from 'react-router-dom';
import LogoUpb from '@/assets/Images/LogoUpb.png';
import { UpbFooter } from '@/shared/components/UpbFooter';

// ── Component ───────────────────────────────────────────────────────────────

export function PasswordUpdatedPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      {/* Logo UPB */}
      <div className="px-8 pt-6">
        <img src={LogoUpb} alt="Logo UPB" className="h-12" />
      </div>

      {/* Contenido centrado */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Ícono de check verde */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ border: '3px solid #2E7D32' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#2E7D32"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 text-center">
          Contraseña actualizada
        </h1>

        {/* Texto descriptivo */}
        <p className="text-sm text-gray-500 text-center max-w-md mb-8 leading-relaxed">
          Su contraseña se ha actualizado de manera exitosa.
          <br />
          Usa tu nueva contraseña para iniciar sesión.
        </p>

        {/* Botón Regresar a inicio */}
        <Link
          to="/login"
          className="px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95 inline-block"
          style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
        >
          Regresar a inicio
        </Link>
      </div>

      {/* ── Footer institucional ── */}
      <UpbFooter className="mt-0" />
    </div>
  );
}
