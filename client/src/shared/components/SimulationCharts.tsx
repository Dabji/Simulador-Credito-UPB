/* ─────────────────────────────────────────────────────────────
   COMPONENTE: SimulationCharts (HU-33)
   Selector de 3 gráficas interactivas derivadas de la simulación:
     1) Distribución Capital vs Intereses (Donut/Pie)
     2) Evolución del Saldo vs Tiempo (Línea)
     3) Capital vs Interés por Cuota (Barras)
   Sin librerías externas — SVG + CSS puro.
   Tooltips nativos con onMouseMove.
───────────────────────────────────────────────────────────────── */

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { AmortizationRowDTO } from '../services/api';

/* ── Tipos ──────────────────────────────────────────────────── */

type ChartType = 'donut' | 'line' | 'bar';

interface SimulationChartsProps {
  schedule: AmortizationRowDTO[];
  totalCapital: number;
  totalInterest: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  lines: string[];
}

/* ── Constantes de estilo ──────────────────────────────────── */

const PURPLE = '#A85BFF';
const GREEN  = '#C0D901';
const GRAY50 = '#F9FAFB';

/* Iconos SVG inline que heredan color del botón (púrpura → blanco al activar) */
const IconDonut = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2.8" />
  </svg>
);
const IconLine = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,12 6,7 10,9 14,4" />
    <circle cx="6"  cy="7" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="10" cy="9" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
const IconBar = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2"  y="8"  width="3" height="6" rx="1" />
    <rect x="6.5" y="4" width="3" height="10" rx="1" />
    <rect x="11" y="6" width="3" height="8" rx="1" />
  </svg>
);

/* Opciones del selector */
const CHART_OPTIONS: { key: ChartType; label: string; Icon: () => ReactNode }[] = [
  { key: 'donut', label: 'Capital vs Intereses', Icon: IconDonut },
  { key: 'line',  label: 'Evolución del Saldo',  Icon: IconLine  },
  { key: 'bar',   label: 'Capital vs Interés',   Icon: IconBar   },
];

/* ── Tooltip reutilizable ──────────────────────────────────── */

function Tooltip({ state }: { state: TooltipState }) {
  if (!state.visible) return null;
  return (
    <div
      className="fixed z-50 pointer-events-none rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{
        left: state.x + 12,
        top: state.y - 10,
        backgroundColor: '#1F2937',
        color: '#F9FAFB',
        maxWidth: 220,
      }}
    >
      {state.lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

/* ── Donut Chart ───────────────────────────────────────────── */

function DonutChart({ totalCapital, totalInterest }: { totalCapital: number; totalInterest: number }) {
  const total = totalCapital + totalInterest;
  const capPct = total > 0 ? Math.round((totalCapital / total) * 100) : 100;
  const intPct = 100 - capPct;

  const R = 88;
  const C = 2 * Math.PI * R;
  const capArc = C * (capPct / 100);
  const intArc = C * (intPct / 100);

  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, lines: [] });

  const fmtCOP = (v: number) => new Intl.NumberFormat('es-CO').format(v) + ' COP';

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        role="img"
        aria-label={`Capital: ${capPct}%, Intereses: ${intPct}%`}
        className="transition-transform duration-300 hover:scale-105"
      >
        {/* Arco Capital */}
        <circle
          cx="150" cy="150" r={R} fill="none"
          stroke={PURPLE} strokeWidth="48"
          strokeDasharray={`${capArc} ${intArc}`}
          strokeDashoffset={C / 4}
          className="transition-all duration-500 cursor-pointer"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(168,91,255,0.3))' }}
          onMouseMove={(e) => setTooltip({
            visible: true, x: e.clientX, y: e.clientY,
            lines: [`Capital: ${capPct}%`, fmtCOP(totalCapital)],
          })}
          onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
        />
        {/* Arco Intereses */}
        {intPct > 0 && (
          <circle
            cx="150" cy="150" r={R} fill="none"
            stroke={GREEN} strokeWidth="48"
            strokeDasharray={`${intArc} ${capArc}`}
            strokeDashoffset={C / 4 - capArc}
            className="transition-all duration-500 cursor-pointer"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(192,217,1,0.3))' }}
            onMouseMove={(e) => setTooltip({
              visible: true, x: e.clientX, y: e.clientY,
              lines: [`Intereses: ${intPct}%`, fmtCOP(totalInterest)],
            })}
            onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
          />
        )}
        {/* Centro */}
        <circle cx="150" cy="150" r="62" fill="white" />
        <text x="150" y="145" textAnchor="middle" fontSize="13" fill="#6B7280">Capital</text>
        <text x="150" y="163" textAnchor="middle" fontSize="16" fontWeight="bold" fill={PURPLE}>
          {capPct}%
        </text>
      </svg>

      {/* Leyenda */}
      <div className="flex items-center gap-6 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: PURPLE }} />
          Capital {capPct}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: GREEN }} />
          Intereses {intPct}%
        </span>
      </div>

      <Tooltip state={tooltip} />
    </div>
  );
}

/* ── Line Chart (Evolución del Saldo) ──────────────────────── */

function LineChart({ schedule }: { schedule: AmortizationRowDTO[] }) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, lines: [] });

  if (schedule.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Pago único — sin evolución de saldo.</p>;
  }

  const fmtCOP = (v: number) => new Intl.NumberFormat('es-CO').format(v) + ' COP';

  const W = 700;
  const H = 320;
  const PAD = { top: 20, right: 45, bottom: 50, left: 65 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxBalance = Math.max(...schedule.map(r => r.initialBalance));
  const xStep = schedule.length > 1 ? plotW / (schedule.length - 1) : plotW;

  const points = schedule.map((r, i) => ({
    x: PAD.left + (schedule.length > 1 ? i * xStep : plotW / 2),
    y: PAD.top + plotH - (maxBalance > 0 ? (r.finalBalance / maxBalance) * plotH : 0),
    row: r,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // Eje Y: 5 marcas
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = maxBalance * (1 - i / 4);
    return {
      y: PAD.top + (i / 4) * plotH,
      label: val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}M` : `${Math.round(val / 1000)}K`,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid horizontal */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#E5E7EB" strokeWidth="0.7" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize="11" fill="#9CA3AF">{t.label}</text>
          </g>
        ))}

        {/* Línea de datos */}
        <path d={linePath} fill="none" stroke={PURPLE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Área debajo */}
        <path
          d={`${linePath} L${points[points.length - 1].x},${PAD.top + plotH} L${points[0].x},${PAD.top + plotH} Z`}
          fill={PURPLE}
          fillOpacity="0.08"
        />

        {/* Puntos interactivos */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r="5"
            fill="white" stroke={PURPLE} strokeWidth="2"
            className="cursor-pointer transition-all duration-200"
            style={{ filter: 'drop-shadow(0 1px 3px rgba(168,91,255,0.3))' }}
            onMouseMove={(e) => setTooltip({
              visible: true, x: e.clientX, y: e.clientY,
              lines: [
                `Cuota ${p.row.period}`,
                `Saldo: ${fmtCOP(p.row.finalBalance)}`,
                `Pago: ${fmtCOP(p.row.payment)}`,
              ],
            })}
            onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
          />
        ))}

        {/* Eje X: mes correspondiente a cada cuota */}
        {points.map((p, i) => {
          const dt = new Date(p.row.date + 'T00:00:00');
          const monthLabel = dt.toLocaleString('es-CO', { month: 'short' }).replace('.', '');
          const yr = dt.getFullYear();
          return (
            <text key={i} x={p.x} y={H - 12} textAnchor="middle" fontSize="11" fontWeight="500" fill="#6B7280">
              {monthLabel} {yr}
            </text>
          );
        })}
      </svg>

      <Tooltip state={tooltip} />
    </div>
  );
}

/* ── Bar Chart (Capital vs Interés por Cuota) ──────────────── */

function BarChart({ schedule }: { schedule: AmortizationRowDTO[] }) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, lines: [] });

  if (schedule.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Pago único — sin desglose por cuota.</p>;
  }

  const fmtCOP = (v: number) => new Intl.NumberFormat('es-CO').format(v) + ' COP';

  const W = 700;
  const H = 320;
  const PAD = { top: 20, right: 45, bottom: 50, left: 65 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxPayment = Math.max(...schedule.map(r => r.payment));
  const groupW = plotW / schedule.length;
  const barW = Math.min(groupW * 0.36, 30);
  const gap = 4;

  // Eje Y
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = maxPayment * (1 - i / 4);
    return {
      y: PAD.top + (i / 4) * plotH,
      label: val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}M` : `${Math.round(val / 1000)}K`,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#E5E7EB" strokeWidth="0.7" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize="11" fill="#9CA3AF">{t.label}</text>
          </g>
        ))}

        {/* Barras */}
        {schedule.map((row, i) => {
          const cx = PAD.left + groupW * i + groupW / 2;
          const capH = maxPayment > 0 ? (row.principal / maxPayment) * plotH : 0;
          const intH = maxPayment > 0 ? (row.interest / maxPayment) * plotH : 0;

          return (
            <g key={i}>
              {/* Barra Capital */}
              <rect
                x={cx - barW - gap / 2}
                y={PAD.top + plotH - capH}
                width={barW}
                height={capH}
                rx="5"
                fill={PURPLE}
                fillOpacity="0.85"
                className="cursor-pointer transition-all duration-200 hover:fill-opacity-100"
                onMouseMove={(e) => setTooltip({
                  visible: true, x: e.clientX, y: e.clientY,
                  lines: [`Cuota ${row.period}`, `Capital: ${fmtCOP(row.principal)}`],
                })}
                onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
              />
              {/* Barra Interés */}
              <rect
                x={cx + gap / 2}
                y={PAD.top + plotH - intH}
                width={barW}
                height={Math.max(intH, 0)}
                rx="5"
                fill={GREEN}
                fillOpacity="0.85"
                className="cursor-pointer transition-all duration-200 hover:fill-opacity-100"
                onMouseMove={(e) => setTooltip({
                  visible: true, x: e.clientX, y: e.clientY,
                  lines: [`Cuota ${row.period}`, `Interés: ${fmtCOP(row.interest)}`],
                })}
                onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
              />
              {/* Etiqueta mes */}
              {(() => {
                const dt = new Date(row.date + 'T00:00:00');
                const monthLabel = dt.toLocaleString('es-CO', { month: 'short' }).replace('.', '');
                const yr = dt.getFullYear();
                return (
                  <text x={cx} y={H - 12} textAnchor="middle" fontSize="11" fontWeight="500" fill="#6B7280">
                    {monthLabel} {yr}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>

      {/* Leyenda */}
      <div className="flex items-center gap-8 text-sm text-gray-600 mt-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: PURPLE }} />
          Capital
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: GREEN }} />
          Intereses
        </span>
      </div>

      <Tooltip state={tooltip} />
    </div>
  );
}

/* ── Componente Principal ──────────────────────────────────── */

export function SimulationCharts({ schedule, totalCapital, totalInterest }: SimulationChartsProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('donut');

  return (
    <div className="mb-8">
      {/* Selector de gráficas — horizontal, morado suave */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
        {CHART_OPTIONS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveChart(key)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400
              ${activeChart === key
                ? 'text-white shadow-md scale-[1.03]'
                : 'text-purple-700 hover:bg-purple-100 hover:shadow-sm hover:scale-[1.02]'
              }
            `}
            style={activeChart === key
              ? { backgroundColor: '#B580FF', boxShadow: '0 4px 14px rgba(168,91,255,0.3)' }
              : { backgroundColor: '#F3E8FF', border: '1px solid #DDD6FE' }
            }
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      {/* Contenedor de la gráfica activa */}
      <div
        className="rounded-2xl px-6 py-8 transition-all duration-300"
        style={{ backgroundColor: GRAY50, border: '1px solid #EBEBF0' }}
      >
        <h3 className="text-base font-bold text-gray-800 mb-6 text-center tracking-tight">
          {CHART_OPTIONS.find(o => o.key === activeChart)?.label}
        </h3>
        <div className="w-full">
          {activeChart === 'donut' && (
            <DonutChart totalCapital={totalCapital} totalInterest={totalInterest} />
          )}
          {activeChart === 'line' && (
            <LineChart schedule={schedule} />
          )}
          {activeChart === 'bar' && (
            <BarChart schedule={schedule} />
          )}
        </div>
      </div>
    </div>
  );
}
