/* ─────────────────────────────────────────────────────────────
   COMPONENTE: DonutChartPlaceholder
   Gráfico de dona SVG (sin librerías externas) que muestra la
   distribución porcentual entre Capital e Intereses.
   Datos estáticos de placeholder — pendiente integración backend.
───────────────────────────────────────────────────────────────── */

/* Proporciones fijas de placeholder: 70% capital, 30% intereses */
const PRINCIPAL_PCT = 0.7;
const INTEREST_PCT  = 0.3;

const R             = 60;
const CIRCUMFERENCE = 2 * Math.PI * R;
const PRINCIPAL_ARC = CIRCUMFERENCE * PRINCIPAL_PCT;
const INTEREST_ARC  = CIRCUMFERENCE * INTEREST_PCT;

export function DonutChartPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        role="img"
        aria-label="Capital: 70%, Intereses: 30% (valores de ejemplo)"
      >
        {/* Arco Capital — morado institucional */}
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="#A85BFF"
          strokeWidth="36"
          strokeDasharray={`${PRINCIPAL_ARC} ${INTEREST_ARC}`}
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
          strokeDasharray={`${INTEREST_ARC} ${PRINCIPAL_ARC}`}
          strokeDashoffset={CIRCUMFERENCE / 4 - PRINCIPAL_ARC}
        />
        {/* Agujero central */}
        <circle cx="100" cy="100" r="42" fill="white" />
        {/* Etiqueta central */}
        <text x="100" y="96" textAnchor="middle" fontSize="11" fill="#6B7280">Capital</text>
        <text x="100" y="112" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#A85BFF">
          70%
        </text>
      </svg>

      {/* Leyenda */}
      <div className="flex items-center gap-6 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#A85BFF' }} />
          Capital 70%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#C0D901' }} />
          Intereses 30%
        </span>
      </div>
    </div>
  );
}
