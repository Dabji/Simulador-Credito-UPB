/* ─────────────────────────────────────────────────────────────
   COMPONENTE: UpbFooter
   Pie de página institucional UPB con contacto Bucaramanga,
   oferta académica, logo alternativo, redes sociales y copyright.
───────────────────────────────────────────────────────────────── */

import LogoUpb2 from '@/assets/Images/LogoUpb (2).png';
import LogoFacebook from '@/assets/Images/LogoFacebook.png';
import LogoInstagram from '@/assets/Images/LogoIngtagram.png';
import LogoX from '@/assets/Images/png-transparent-twitter-x-logo.png';
import LogoYoutube from '@/assets/Images/youtube_style_play_icon_512.png';

/* Links de redes sociales */
const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com/UPBBGA/?locale=es_LA', icon: LogoFacebook, alt: 'Facebook UPB' },
  { href: 'https://www.instagram.com/upbbga/?hl=es', icon: LogoInstagram, alt: 'Instagram UPB' },
  { href: 'https://x.com/UPBBGA', icon: LogoX, alt: 'X UPB' },
  { href: 'https://www.youtube.com/channel/UCMaBLy4quJbHDcqvM9HFJ_w', icon: LogoYoutube, alt: 'YouTube UPB' },
];

/* Programas de la oferta académica */
const ACADEMIC_PROGRAMS = [
  'Programas profesionales',
  'Posgrados',
  'Programas virtuales',
  'Centro de lenguas',
  'Formación continua',
  'Programas de hogar',
];

interface UpbFooterProps {
  className?: string;
}

export function UpbFooter({ className }: UpbFooterProps) {
  return (
    <footer style={{ backgroundColor: 'rgba(20,20,20,0.97)' }} className={`text-gray-400 w-full ${className ?? 'mt-12'}`}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 pt-10 pb-8">

        {/* Grid de dos columnas: contacto + oferta académica */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

          {/* Columna izquierda — Información de contacto Bucaramanga */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Bucaramanga</p>
              <p className="text-sm text-gray-300 font-medium">Línea telefónica</p>
              <p className="text-sm">+57 607 6790202</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 font-medium">Correo electrónico</p>
              <p className="text-sm">info@upb.edu.co</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 font-medium">Dirección</p>
              <p className="text-sm">Campus Universitario Km 7 vía Piedecuesta</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 font-medium">Horarios de atención:</p>
              <p className="text-sm">Lunes a jueves 7:30 a.m. a 12:30 p.m. - 1:30 p.m. a 5:00 p.m.</p>
              <p className="text-sm">Viernes 7:30 a.m. a 10:30 p.m. - 1:30 p.m. a 4:30 p.m.</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Solo para temas judiciales</p>
              <p className="text-xs text-gray-600">notificacionesjudiciales.bga@upb.edu.co</p>
            </div>
          </div>

          {/* Columna derecha — Oferta académica + logo */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Oferta académica</p>
              <ul className="space-y-1 text-sm">
                {ACADEMIC_PROGRAMS.map((prog) => (
                  <li key={prog} className="text-gray-400 hover:text-gray-200 transition-colors cursor-default">
                    {prog}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-2">
              <img src={LogoUpb2} alt="Logo UPB" className="h-14 w-auto" />
            </div>
          </div>
        </div>

        {/* Divisor + redes sociales + copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.alt}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center hover:opacity-75 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full"
                aria-label={link.alt}
              >
                <img src={link.icon} alt={link.alt} className="w-8 h-8 object-contain block" loading="lazy" />
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-600 text-center">
            © {new Date().getFullYear()} Universidad Pontificia Bolivariana — Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
