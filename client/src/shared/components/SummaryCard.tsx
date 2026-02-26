/* ─────────────────────────────────────────────────────────────
   COMPONENTE: SummaryCard
   Tarjeta de resumen con etiqueta y valor. Acepta color opcional
   para destacar valores importantes (morado = financiado, rojo = intereses).
───────────────────────────────────────────────────────────────── */

import type { CSSProperties } from 'react';

export type SummaryCardColor = 'default' | 'purple' | 'red';

interface SummaryCardProps {
  label: string;
  value: string;
  color?: SummaryCardColor;
}

/* Mapa de colores para el valor según la prop color */
const VALUE_COLORS: Record<SummaryCardColor, CSSProperties> = {
  default: { color: '#111827' },
  purple:  { color: '#A85BFF' },
  red:     { color: '#E7000B' },
};

export function SummaryCard({ label, value, color = 'default' }: SummaryCardProps) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ backgroundColor: '#F9F9FB', border: '1px solid #EBEBF0' }}
    >
      <p className="text-xs text-gray-500 mb-1 leading-tight">{label}</p>
      <p className="text-sm sm:text-base font-bold" style={VALUE_COLORS[color]}>
        {value}
      </p>
    </div>
  );
}
