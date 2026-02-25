/* ─────────────────────────────────────────────────────────────
   COMPONENTE: DonutChartPlaceholder
   Gráfico de dona SVG (sin librerías externas) que muestra la
   distribución porcentual entre Capital e Intereses.
   Datos estáticos de placeholder — pendiente integración backend.
───────────────────────────────────────────────────────────────── */

const R             = 60;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface DonutChartPlaceholderProps {
  capitalPct?: number; // 0-100; si no se pasa usa 70 por defecto
}

export function DonutChartPlaceholder({ capitalPct = 70 }: DonutChartPlaceholderProps) {
  const safeCapital  = Math.min(100, Math.max(0, capitalPct));
  const interestPct  = 100 - safeCapital;
  const principalArc = CIRCUMFERENCE * (safeCapital  / 100);
  const interestArc  = CIRCUMFERENCE * (interestPct / 100);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Capital: ${safeCapital}%, Intereses: ${interestPct}%`}
      >
        {/* Arco Capital — morado institucional */}
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="#A85BFF"
          strokeWidth="36"
          strokeDasharray={`${principalArc} ${interestArc}`}
          strokeDashoffset={CIRCUMFERENCE / 4}
        />
        {/* Arco Intereses — verde institucional */}
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="#C0D901"
          strokeWidth="36"
          strokeDasharray={`${interestArc} ${principalArc}`}
          strokeDashoffset={CIRCUMFERENCE / 4 - principalArc}
        />
        {/* Agujero central */}
        <circle cx="100" cy="100" r="42" fill="white" />
        {/* Etiqueta central */}
        <text x="100" y="96" textAnchor="middle" fontSize="11" fill="#6B7280">Capital</text>
        <text x="100" y="112" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#A85BFF">
          {safeCapital}%
        </text>
      </svg>

      {/* Leyenda con porcentajes reales */}
      <div className="flex items-center gap-6 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#A85BFF' }} />
          Capital {safeCapital}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#C0D901' }} />
          Intereses {interestPct}%
        </span>
      </div>
    </div>
  );
}
