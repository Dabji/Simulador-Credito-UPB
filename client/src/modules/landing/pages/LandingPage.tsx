/* -----------------------------------------------------------------
   PÁGINA: LandingPage
   Pantalla inicial pública con slideshow crossfade de imágenes,
   hero de texto + CTAs, y links sociales.
   Sin scroll en desktop (h-[100svh] + overflow-hidden).
------------------------------------------------------------------ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingHeader } from '@/shared/components/LandingHeader';

import ImgBucaramanga from '@/assets/Images/imagenBucaramanga.png';
import ImgMedellin    from '@/assets/Images/ImagenMedellin.png';
import ImgMonteria    from '@/assets/Images/ImagenMonteria.png';
import ImgPalmira     from '@/assets/Images/ImagenPalmira.png';
import ImgHero        from '@/assets/Images/pregadroCardHome.png';
import ImgFondo       from '@/assets/Images/fondoLogin.png';

/* ── URLs de redes sociales — editar aquí ──────────────────────── */
const INSTAGRAM_URL = 'https://www.instagram.com/upbbga/';
const X_URL         = 'https://x.com/UPBBGA';
const YOUTUBE_URL   = 'https://www.youtube.com/channel/UCMaBLy4quJbHDcqvM9HFJ_w';

const SLIDES = [
  ImgFondo,
  ImgBucaramanga,
  ImgMedellin,
  ImgMonteria,
  ImgPalmira,
  ImgHero,
];

const SOCIAL_ITEMS = [
  {
    label: 'Ver Instagram',
    href: INSTAGRAM_URL,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.92 4.92 0 011.772 1.153 4.92 4.92 0 011.153 1.772c.163.46.35 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.92 4.92 0 01-1.153 1.772 4.92 4.92 0 01-1.772 1.153c-.46.163-1.26.35-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.92 4.92 0 01-1.772-1.153 4.92 4.92 0 01-1.153-1.772c-.163-.46-.35-1.26-.403-2.43C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43A4.92 4.92 0 013.79 2.948a4.92 4.92 0 011.772-1.153c.46-.163 1.26-.35 2.43-.403C9.258 2.175 9.638 2.163 12 2.163zm0-2.163C8.756 0 8.332.013 7.052.072 5.775.131 4.902.333 4.14.63a7.07 7.07 0 00-2.561 1.667A7.07 7.07 0 00.63 4.14C.333 4.902.131 5.775.072 7.052.013 8.332 0 8.756 0 12c0 3.244.013 3.668.072 4.948.059 1.277.261 2.15.558 2.913a7.07 7.07 0 001.667 2.561 7.07 7.07 0 002.561 1.667c.763.297 1.636.499 2.913.558C8.332 23.987 8.756 24 12 24s3.668-.013 4.948-.072c1.277-.059 2.15-.261 2.913-.558a7.07 7.07 0 002.561-1.667 7.07 7.07 0 001.667-2.561c.297-.763.499-1.636.558-2.913.059-1.28.072-1.704.072-4.948s-.013-3.668-.072-4.948c-.059-1.277-.261-2.15-.558-2.913a7.07 7.07 0 00-1.667-2.561A7.07 7.07 0 0019.861.63C19.098.333 18.225.131 16.948.072 15.668.013 15.244 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    label: 'Ver X',
    href: X_URL,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: 'Ver YouTube',
    href: YOUTUBE_URL,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
] as const;

export function LandingPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  /* Slideshow automático — crossfade cada 5s */
  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-[100svh] overflow-hidden font-sans">

      {/* ── Slideshow de fondo ──────────────────────────────────── */}
      {SLIDES.map((src, idx) => (
        <div
          key={src}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full transition-opacity duration-1000"
          style={{ opacity: idx === current ? 1 : 0 }}
        >
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover object-center"
            loading={idx === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Overlay oscuro para legibilidad */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.40) 100%)' }}
        aria-hidden="true"
      />

      {/* ── Header de landing ───────────────────────────────────── */}
      <LandingHeader />

      {/* ── Contenido hero ──────────────────────────────────────── */}
      <div className="relative z-20 h-full w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 flex items-center">
        <div className="w-full max-w-xl pt-[74px]">

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/25 backdrop-blur-sm mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#C0D901]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z" />
            </svg>
            UPB Bucaramanga
          </span>

          {/* Título principal */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
            Simulador de<br />
            <span style={{ color: '#C0D901' }}>Crédito Educativo</span>
          </h1>

          {/* Subtítulo */}
          <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-md">
            Simula tu financiación de matrícula de forma rápida y clara antes de solicitar el crédito.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-gray-900 text-base transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C0D901]"
              style={{ backgroundColor: '#C0D901' }}
            >
              Financiación directa UPB
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white text-base border border-white/40 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              Registrarme
            </button>
          </div>

          {/* Links sociales */}
          <div className="flex flex-wrap items-center gap-2">
            {SOCIAL_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.label} (abre en nueva pestaña)`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores de slide (dots) */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
        role="tablist"
        aria-label="Indicadores de diapositiva"
      >
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={idx === current}
            aria-label={`Diapositiva ${idx + 1}`}
            onClick={() => setCurrent(idx)}
            className="transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-white/60"
            style={{
              width:           idx === current ? '24px' : '8px',
              height:          '8px',
              backgroundColor: idx === current ? '#C0D901' : 'rgba(255,255,255,0.45)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
