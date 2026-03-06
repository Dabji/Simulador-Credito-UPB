import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoUpb from '@/assets/Images/LogoUpb (2).png';

const NAV_LINKS = [
  { label: 'Biblioteca Virtual', href: 'https://bibliotecavirtual.upb.edu.co/pages/index.php' },
  { label: 'Transparencia',      href: 'https://www.upb.edu.co/es/transparencia-acceso-informacion' },
  { label: 'Quiero Donar',       href: 'https://www.upb.edu.co/es/fundacion-universitaria' },
  { label: 'SIGAA',              href: 'https://sso.upb.edu.co/authenticationendpoint/login.do?Name=PreLoginRequestProcessor&commonAuthCallerPath=%252Fcas%252Flogin&forceAuth=true&passiveAuth=false&service=https%3A%2F%2Fsigaa.upb.edu.co%3A443%2Fssomanager%2Fc%2FSSB&tenantDomain=carbon.super&sessionDataKey=bf28c761-4f0e-4e79-8b20-6962fc8e4578&relyingParty=ssb-banpdn&type=cas&sp=ssb-banpdn&isSaaSApp=false&authenticators=BasicAuthenticator%3ALOCAL' },
  { label: 'Soy UPB',            href: 'https://sso.upb.edu.co/authenticationendpoint/login.do?commonAuthCallerPath=%2Fsamlsso&forceAuth=false&passiveAuth=false&tenantDomain=carbon.super&sessionDataKey=06c9aaf1-52eb-4670-bf54-9fd17bbb57ca&relyingParty=WebcenterSt&type=samlsso&sp=Webcenterstg&isSaaSApp=false&authenticators=BasicAuthenticator%3ALOCAL' },
];

export function LandingHeader() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-20 w-full">
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
              {NAV_LINKS.map((item, idx) => (
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

              <button
                type="button"
                onClick={() => navigate('/register')}
                className="hidden sm:inline-flex px-4 py-2 rounded-full text-sm font-semibold text-white border border-white/40 bg-white/10 hover:bg-white/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                Registrarme
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex px-4 py-2 rounded-full text-sm font-semibold text-gray-900 bg-[#C0D901] hover:bg-[#d4ef01] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C0D901]"
              >
                Iniciar sesión
              </button>
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
          {NAV_LINKS.map((item) => (
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
            <button
              type="button"
              onClick={() => { setMobileOpen(false); navigate('/register'); }}
              className="block w-full text-left py-2.5 text-sm font-semibold text-white/90 hover:text-[#C0D901] transition-colors focus:outline-none"
            >
              Registrarme
            </button>
          </div>
        </div>
      )}

      {/* Franja verde institucional */}
      <div className="w-full h-[7px]" style={{ backgroundColor: '#C0D901' }} />
    </header>
  );
}
