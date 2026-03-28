import { useState } from 'react';
import { Link } from 'react-router-dom';
import LogoUpb from '@/assets/images/logo-upb-alt.png';
import { UPB_NAV_LINKS } from '@/shared/utils/upbLinks';

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full">
      {/* Barra principal */}
      <div
        className="w-full"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
          <div className="flex items-center justify-between h-[64px] gap-4">

            {/* Logo institucional */}
            <div className="flex-shrink-0">
              <img
                src={LogoUpb}
                alt="Logo Universidad Pontificia Bolivariana"
                className="h-9 sm:h-11 w-auto"
              />
            </div>

            {/* Nav links — desktop */}
            <nav className="hidden lg:flex flex-1 items-center justify-center" aria-label="Menú principal">
              {UPB_NAV_LINKS.map((item, idx) => (
                <span key={item.label} className="flex items-center">
                  {idx > 0 && (
                    <span className="mx-3 text-white/30 select-none" aria-hidden="true">|</span>
                  )}
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] font-semibold text-white/90 hover:text-[#C0D901] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/40 rounded px-3 py-1"
                  >
                    {item.label}
                  </a>
                </span>
              ))}
            </nav>

            {/* Botones derecha + hamburguesa */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Hamburguesa mobile */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              <Link
                to="/register"
                className="hidden sm:inline-flex px-4 py-2 rounded-full text-sm font-semibold text-white border border-white/40 bg-white/10 hover:bg-white/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                Registrarme
              </Link>
              <Link
                to="/login"
                className="inline-flex px-4 py-2 rounded-full text-sm font-semibold text-gray-900 bg-[#C0D901] hover:bg-[#d4ef01] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C0D901]"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Menú mobile desplegable */}
      {mobileOpen && (
        <div
          className="lg:hidden px-4 py-3 border-t border-white/10"
          style={{ backgroundColor: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)' }}
          role="navigation"
          aria-label="Menú móvil"
        >
          {UPB_NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2.5 text-sm font-semibold text-white/90 hover:text-[#C0D901] transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 rounded"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="border-t border-white/10 mt-2 pt-2">
            <Link
              to="/register"
              className="block w-full py-2.5 text-sm font-semibold text-white/90 hover:text-[#C0D901] transition-colors focus:outline-none"
              onClick={() => setMobileOpen(false)}
            >
              Registrarme
            </Link>
          </div>
        </div>
      )}

      {/* Franja verde institucional */}
      <div className="w-full h-[7px]" style={{ backgroundColor: '#C0D901' }} />
    </header>
  );
}
