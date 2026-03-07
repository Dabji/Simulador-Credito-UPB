import { Link } from 'react-router-dom';
import LogoUpb from '@/assets/Images/LogoUpb.png';

export function GuestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 px-4 font-sans">
      <img src={LogoUpb} alt="Logo UPB" className="h-14 w-auto" />

      <div className="w-full max-w-sm text-center space-y-3">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#C0D901]/20 text-gray-700 border border-[#C0D901]/40">
          Próximamente
        </span>
        <h1 className="text-2xl font-black text-gray-900">Modo Invitado</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Pronto podrás simular tu crédito educativo sin necesidad de registrarte.
          Esta funcionalidad está en desarrollo.
        </p>
      </div>

      <Link
        to="/login"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-900 transition-all duration-150 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0D901]/60"
        style={{ backgroundColor: '#C0D901' }}
      >
        Volver al inicio de sesión
      </Link>
    </div>
  );
}
