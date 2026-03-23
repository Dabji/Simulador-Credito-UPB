/* ─────────────────────────────────────────────────────────────────────
   COMPONENTE: BackNavLink
   Link de navegación "Volver al menú / Volver al inicio" reutilizable
   con la misma animación underline + arrow que AdminParametersPage.
   Soporta dos modos:
     • Simple:     <BackNavLink to="/admin/main" label="Volver al menú" />
     • Breadcrumb: <BackNavLink to="/admin/students" label="Gestión de Estudiantes" breadcrumb="Perfil del Estudiante" />
───────────────────────────────────────────────────────────────────── */

import { useNavigate } from 'react-router-dom';

interface BackNavLinkProps {
  /** Ruta destino al hacer clic */
  to: string;
  /** Texto principal del link (ej. "Volver al menú", "Gestión de Estudiantes") */
  label: string;
  /** Si se proporciona, muestra formato breadcrumb: label / breadcrumb */
  breadcrumb?: string;
  /** Clase CSS adicional para el contenedor (sobreescribe mb-2 por defecto) */
  className?: string;
}

export function BackNavLink({ to, label, breadcrumb, className }: BackNavLinkProps) {
  const navigate = useNavigate();

  if (breadcrumb) {
    return (
      <div className={className ?? 'mb-4 flex items-center gap-2 text-sm text-gray-400'}>
        <button
          type="button"
          onClick={() => navigate(to)}
          className="group inline-flex items-center gap-1.5 font-semibold text-[#6b21a8] hover:text-[#581c87] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/30 rounded"
          aria-label={label}
        >
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="relative">
            {label}
            <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#6b21a8] rounded-full transition-all duration-200 group-hover:w-full" />
          </span>
        </button>
        <span>/</span>
        <span className="text-gray-600 font-medium">{breadcrumb}</span>
      </div>
    );
  }

  return (
    <div className={className ?? 'mb-2'}>
      <button
        type="button"
        onClick={() => navigate(to)}
        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b21a8] hover:text-[#581c87] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/30 rounded relative"
        aria-label={label}
      >
        <svg
          className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="relative">
          {label}
          <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#6b21a8] rounded-full transition-all duration-200 group-hover:w-full" />
        </span>
      </button>
    </div>
  );
}
