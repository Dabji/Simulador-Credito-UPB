/* -----------------------------------------------------------------
   PÁGINA: AdminMainPage  (HU-09 — Acceso del rol de Administrador)
   Menú principal del administrador con:
     - Hero oscuro: imagen + 3 módulos de administración
     - Sección Nuestras Sedes: igual que el menú estudiante
     - Sección Alternativas Financieras
     - Sección Video institucional
   Reutiliza UpbHeader y UpbFooter ya existentes.
------------------------------------------------------------------ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';

import HeroImg        from '@/assets/images/hero-card.png';
import AltFinImg      from '@/assets/images/student-alt-finance.png';
import ImgBucaramanga from '@/assets/images/bucaramanga.png';
import ImgMedellin    from '@/assets/images/medellin.png';
import ImgMonteria    from '@/assets/images/monteria.png';
import ImgPalmira     from '@/assets/images/palmira.png';

interface Sede {
  nombre: string;
  img: string;
  url: string;
}

const SEDES: Sede[] = [
  { nombre: 'Bucaramanga', img: ImgBucaramanga, url: 'https://www.upb.edu.co/es/universidad/nuestro-campus/campus-bucaramanga' },
  { nombre: 'Medellín',   img: ImgMedellin,    url: 'https://www.upb.edu.co/es/universidad/nuestro-campus/campus-medellin'    },
  { nombre: 'Montería',   img: ImgMonteria,    url: 'https://www.upb.edu.co/es/universidad/nuestro-campus/campus-monteria'    },
  { nombre: 'Palmira',    img: ImgPalmira,     url: 'https://www.upb.edu.co/es/universidad/nuestro-campus/campus-palmira'     },
];

const ALT_FINANCIERAS_URL =
  'https://www.upb.edu.co/es/apoyo-financiero-upb-contigo/alternativas-financieras';

const VIDEO_URL =
  'https://donaciones.bucaramanga.upb.edu.co/videos/video_padre.mp4';

const ADMIN_MODULES = [
  { label: 'Gestión de Estudiantes',    to: '/admin/students',   aria: 'Ir a gestión de estudiantes'    },
  { label: 'Parámetros del Simulador',  to: '/admin/parameters', aria: 'Ir a parámetros del simulador'  },
  { label: 'Gestión de Simulaciones',   to: '/admin/simulations',aria: 'Ir a gestión de simulaciones'   },
] as const;

export function AdminMainPage() {
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

      <main className="flex-1">

        {/* ── A) HERO ─────────────────────────────────────────── */}
        <section
          aria-label="Panel de Administración"
          style={{ backgroundColor: '#161616' }}
          className="w-full"
        >
          <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 pt-8 pb-10">
            <h1 className="text-2xl sm:text-4xl font-black text-white mb-6 leading-tight">
              Panel de Administración
            </h1>

            <div className="flex flex-col sm:flex-row items-stretch gap-5 sm:gap-8">
              {/* Imagen hero */}
              <div className="w-full sm:w-[55%] flex-shrink-0">
                <img
                  src={HeroImg}
                  alt="Administración UPB"
                  className="w-full h-56 sm:h-72 lg:h-80 object-cover rounded-2xl"
                  loading="eager"
                />
              </div>

              {/* Botones módulos admin */}
              <div className="w-full sm:w-[45%] flex flex-col justify-center gap-4">
                {ADMIN_MODULES.map(({ label, to, aria }) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => navigate(to)}
                    aria-label={aria}
                    className="w-full px-6 py-5 rounded-2xl text-center font-bold text-white text-base sm:text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C0D901] bg-[#262626] border border-[#383838] hover:bg-[rgba(110,17,176,0.30)] hover:border-[#7c1fc8]"
                    style={{ borderWidth: '1.5px' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── B) NUESTRAS SEDES ───────────────────────────────── */}
        <section aria-label="Nuestras Sedes" className="w-full bg-white py-7 sm:py-10">
          <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-4">
              Nuestras Sedes
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SEDES.map((sede) => (
                <article
                  key={sede.nombre}
                  className="relative rounded-xl overflow-hidden group focus-within:ring-2 focus-within:ring-[#C0D901]"
                  style={{ height: '210px' }}
                >
                  <img
                    src={sede.img}
                    alt={`Campus ${sede.nombre}`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.80) 40%, rgba(0,0,0,0.10) 100%)' }}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: 'rgba(110,17,176,0.35)' }}
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex flex-col justify-end h-full p-3 sm:p-4">
                    <p className="text-white font-bold text-sm sm:text-base mb-2 drop-shadow">
                      {sede.nombre}
                    </p>
                    <a
                      href={sede.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ver sede ${sede.nombre} (abre en nueva pestaña)`}
                      className="self-start px-3 py-1 rounded-full text-xs font-semibold text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C0D901] bg-[#6E11B0] hover:bg-[#8b14e0]"
                    >
                      Ver Sede
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── C) ALTERNATIVAS FINANCIERAS ─────────────────────── */}
        <section
          aria-label="Alternativas Financieras"
          className="w-full bg-white pt-6 pb-8 sm:pt-8 sm:pb-10"
        >
          <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#C0D901', height: 'clamp(160px, 22vw, 220px)' }}
            >
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  backgroundColor: '#a8bf00',
                  width: 'clamp(120px, 16vw, 200px)',
                  height: 'clamp(120px, 16vw, 200px)',
                  right: '-3%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-y-0 left-0 z-10"
                style={{ width: 'clamp(180px, 38%, 420px)' }}
              >
                <img
                  src={AltFinImg}
                  alt="Estudiante UPB — Alternativas Financieras"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'left center',
                    clipPath: 'ellipse(78% 100% at 60% 50%)',
                    display: 'block',
                  }}
                  loading="lazy"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-8 mt-5">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug shrink-0 sm:w-44">
                Alternativas<br />Financieras
              </h2>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                En la UPB creemos que nada debe detener tus sueños. Conoce
                nuestras alternativas de financiación y haz realidad tu
                proyecto de vida.{' '}
                <a
                  href={ALT_FINANCIERAS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#6E11B0] underline hover:text-[#8b14e0] focus:outline-none focus:ring-2 focus:ring-[#6E11B0] rounded transition-colors"
                  aria-label="Ver opciones de alternativas financieras (abre en nueva pestaña)"
                >
                  Ver Opciones Aquí
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* ── D) CREER, IMAGINAR Y CREAR — VIDEO ──────────────── */}
        <section
          aria-label="Creer, imaginar y crear"
          className="w-full py-7 sm:py-10 bg-white"
          style={{ borderTop: '1px solid #ebebeb' }}
        >
          <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-4">
              Creer, imaginar y crear
            </h2>
            <div className="w-full rounded-2xl overflow-hidden bg-gray-900" style={{ aspectRatio: '16/9' }}>
              <video
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                aria-label="Video institucional UPB — Creer, imaginar y crear"
              >
                <source src={VIDEO_URL} type="video/mp4" />
                Tu navegador no soporta la reproducción de video HTML5.
              </video>
            </div>
          </div>
        </section>

      </main>

      <UpbFooter />
    </div>
  );
}
