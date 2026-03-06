import { useNavigate } from 'react-router-dom';
import LogoUpb from '@/assets/Images/LogoUpb.png';

export function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="absolute top-0 left-0 right-0 z-20 w-full">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        <div className="flex items-center justify-between h-[68px]">

          {/* Logo + nombre */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img
              src={LogoUpb}
              alt="Logo Universidad Pontificia Bolivariana"
              className="h-9 sm:h-11 w-auto"
            />
            <span className="hidden sm:block text-white font-semibold text-sm leading-tight">
              Simulador<br />Crédito UPB
            </span>
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="px-5 py-2 rounded-full text-sm font-semibold text-white border border-white/40 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              Registrarme
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-full text-sm font-semibold text-gray-900 bg-[#C0D901] hover:bg-[#d4ef01] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C0D901]/80"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Franja verde institucional */}
      <div className="w-full h-[6px]" style={{ backgroundColor: '#C0D901' }} />
    </header>
  );
}
