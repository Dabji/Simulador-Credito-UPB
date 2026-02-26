/* ─────────────────────────────────────────────────────────────
   COMPONENTE: UpbHeader
   Encabezado institucional UPB con logo, menú de navegación
   centrado, hamburguesa mobile, dropdown de perfil y franja verde.
───────────────────────────────────────────────────────────────── */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoUpb from '@/assets/Images/LogoUpb.png';

/* Links del menú — abren en nueva pestaña */
const NAV_LINKS = [
  { label: 'Biblioteca Virtual', href: 'https://bibliotecavirtual.upb.edu.co/pages/index.php' },
  { label: 'Transparencia', href: 'https://www.upb.edu.co/es/transparencia-acceso-informacion' },
  { label: 'Quiero Donar', href: 'https://www.upb.edu.co/es/fundacion-universitaria' },
  {
    label: 'SIGAA',
    href: 'https://sso.upb.edu.co/authenticationendpoint/login.do?Name=PreLoginRequestProcessor&commonAuthCallerPath=%252Fcas%252Flogin&forceAuth=true&passiveAuth=false&service=https%3A%2F%2Fsigaa.upb.edu.co%3A443%2Fssomanager%2Fc%2FSSB&tenantDomain=carbon.super&sessionDataKey=bf28c761-4f0e-4e79-8b20-6962fc8e4578&relyingParty=ssb-banpdn&type=cas&sp=ssb-banpdn&isSaaSApp=false&authenticators=BasicAuthenticator%3ALOCAL',
  },
  {
    label: 'Soy UPB',
    href: 'https://sso.upb.edu.co/authenticationendpoint/login.do?commonAuthCallerPath=%2Fsamlsso&forceAuth=false&passiveAuth=false&tenantDomain=carbon.super&sessionDataKey=06c9aaf1-52eb-4670-bf54-9fd17bbb57ca&relyingParty=WebcenterSt&type=samlsso&sp=Webcenterstg&isSaaSApp=false&authenticators=BasicAuthenticator%3ALOCAL',
  },
];

interface UpbHeaderProps {
  profileOpen: boolean;
  onToggleProfile: () => void;
}

export function UpbHeader({ profileOpen, onToggleProfile }: UpbHeaderProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* Logo institucional */}
          <img
            src={LogoUpb}
            alt="Logo Universidad Pontificia Bolivariana"
            className="h-9 sm:h-11 w-auto flex-shrink-0"
          />

          {/* Menú desktop — centrado con separadores */}
          <nav className="hidden md:flex flex-1 items-center justify-center" aria-label="Menú principal">
            {NAV_LINKS.map((item, idx) => (
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

          {/* Lado derecho: hamburguesa (mobile) + perfil */}
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

            {/* Ícono de perfil con dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={onToggleProfile}
                aria-label="Menú de perfil"
                aria-expanded={profileOpen}
                className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown de perfil */}
              {profileOpen && (
                <div
                  className="z-20 mt-2 w-52 rounded-xl bg-white py-1"
                  style={{ position: 'absolute', right: 0, top: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #f0f0f0' }}
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    Datos personales
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                    onClick={() => navigate('/login')}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menú mobile desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3" role="navigation" aria-label="Menú móvil">
          {NAV_LINKS.map((item) => (
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
        </div>
      )}

      {/* Franja verde institucional */}
      <div className="w-full h-[10px]" style={{ backgroundColor: '#C0D901' }} />
    </header>
  );
}
