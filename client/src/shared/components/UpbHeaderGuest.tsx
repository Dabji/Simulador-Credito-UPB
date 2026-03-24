/* ─────────────────────────────────────────────────────────────
   COMPONENTE: UpbHeaderGuest
   Encabezado institucional UPB para modo invitado.
   Mismo estilo que UpbHeader pero SIN avatar/perfil de usuario.
   Incluye links institucionales y franja verde.
───────────────────────────────────────────────────────────────── */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoUpb from '@/assets/images/logo-upb.png';
import LogoUpbColor from '@/assets/images/logo-upb-color.png';
import { UPB_NAV_LINKS } from '@/shared/components/upbLinks';

export function UpbHeaderGuest() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoHover, setLogoHover] = useState(false);

  return (
    <header className="w-full bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
        <div className="flex items-center justify-between h-[68px]">

          {/* Logo institucional — interactivo con deslizamiento vertical */}
          <button
            type="button"
            onClick={() => navigate('/guest/main')}
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
            className="relative h-9 sm:h-11 w-[90px] sm:w-[110px] flex-shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/40 focus:ring-offset-2 overflow-hidden"
            aria-label="Ir al menú principal"
          >
            {/* Logo gris — posición normal, al hover baja y desaparece */}
            <img
              src={LogoUpb}
              alt="Logo Universidad Pontificia Bolivariana"
              className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-in-out"
              style={{ transform: logoHover ? 'translateY(100%)' : 'translateY(0)' }}
            />
            {/* Logo a color — arriba oculto, al hover baja a su posición (scale compensa padding extra de la imagen) */}
            <img
              src={LogoUpbColor}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-in-out"
              style={{ transform: logoHover ? 'translateY(0) scale(1.35)' : 'translateY(-100%) scale(1.35)' }}
            />
          </button>

          {/* Menú desktop — centrado con separadores */}
          <nav className="hidden md:flex flex-1 items-center justify-center" aria-label="Menú principal">
            {UPB_NAV_LINKS.map((item, idx) => (
              <span key={item.label} className="flex items-center">
                {idx > 0 && (
                  <span className="mx-4 text-gray-300 select-none" aria-hidden="true">|</span>
                )}
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15.5px] font-semibold text-gray-700 hover:text-[#6E11B0] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded px-5"
                >
                  {item.label}
                </a>
              </span>
            ))}
          </nav>

          {/* Lado derecho: hamburguesa (mobile) + botón iniciar sesión */}
          <div className="flex items-center gap-3">

            {/* Botón hamburguesa — solo visible en mobile */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Botón iniciar sesión — visible en lugar del avatar */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              style={{ backgroundColor: '#A85BFF' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Menú mobile desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3" role="navigation" aria-label="Menú móvil">
          {UPB_NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2.5 text-sm font-semibold text-gray-800 hover:text-[#6E11B0] transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          {/* Iniciar sesión — visible en mobile menu */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-2 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-150 active:scale-95"
            style={{ backgroundColor: '#A85BFF' }}
          >
            Iniciar sesión
          </button>
        </div>
      )}

      {/* Franja verde institucional */}
      <div className="w-full h-[10px]" style={{ backgroundColor: '#C0D901' }} />
    </header>
  );
}
