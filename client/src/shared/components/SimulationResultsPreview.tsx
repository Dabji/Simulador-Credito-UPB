/* ─────────────────────────────────────────────────────────────
   COMPONENTE: SimulationResultsPreview
   Sección de resultados con datos estáticos de placeholder.
   Muestra el diseño completo (cards, gráfico, tabla, observaciones,
   botones) sin ningún cálculo real — pendiente integración backend.
───────────────────────────────────────────────────────────────── */

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { SummaryCard } from './SummaryCard';
import { DonutChartPlaceholder } from './DonutChartPlaceholder';

/* Filas de ejemplo para la tabla de amortización */
const PLACEHOLDER_ROWS = [
  { period: 1, date: '01/03/2026', initialBalance: '$ 5.360.000', principal: '$ 1.292.000', interest: '$ 48.240', payment: '$ 1.340.240', finalBalance: '$ 4.068.000' },
  { period: 2, date: '01/04/2026', initialBalance: '$ 4.068.000', principal: '$ 1.303.000', interest: '$ 36.612', payment: '$ 1.339.612', finalBalance: '$ 2.765.000' },
  { period: 3, date: '01/05/2026', initialBalance: '$ 2.765.000', principal: '$ 1.315.000', interest: '$ 24.885', payment: '$ 1.339.885', finalBalance: '$ 1.450.000' },
  { period: 4, date: '01/06/2026', initialBalance: '$ 1.450.000', principal: '$ 1.437.000', interest: '$ 13.050', payment: '$ 1.450.050', finalBalance: '$ 0' },
];

interface SimulationResultsPreviewProps {
  onNewSimulation: () => void;
}

export function SimulationResultsPreview({ onNewSimulation }: SimulationResultsPreviewProps) {
  const [starred, setStarred]           = useState(false);
  const [observations, setObservations] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  /* Muestra toast "pendiente backend" al intentar guardar */
  const handleSave = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  return (
    <div className="mb-10">

      {/* Encabezado con gradiente morado → verde */}
      <div
        className="rounded-t-2xl px-6 py-5"
        style={{ background: 'linear-gradient(90deg, #A85BFF 0%, #C0D901 100%)' }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Resumen de la Simulación
        </h2>
        <p className="text-white/70 text-xs mt-1">
          Vista previa — valores de ejemplo (pendiente integración backend)
        </p>
      </div>

      <div
        className="bg-white rounded-b-2xl border border-gray-200 p-5 sm:p-7"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        {/* Fila 1 de cards de resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <SummaryCard label="Valor matrícula"  value="$ 6.700.000" />
          <SummaryCard label="Cuota inicial"    value="$ 1.340.000" />
          <SummaryCard label="Total financiado" value="$ 5.360.000" color="purple" />
          <SummaryCard label="Modalidad"        value="Con intereses (0.9% mensual)" />
        </div>

        {/* Fila 2 de cards de resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <SummaryCard label="Número de cuotas"    value="4" />
          <SummaryCard label="Valor cuota estimada" value="$ 1.342.447" />
          <SummaryCard label="Total a pagar"        value="$ 5.369.787" />
          <SummaryCard label="Total intereses"      value="$ 122.475" color="red" />
        </div>

        {/* Gráfico de distribución Capital vs Intereses */}
        <div className="mb-8 bg-gray-50 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 text-center">
            Distribución Capital vs Intereses
          </h3>
          <div className="flex items-center justify-center">
            <DonutChartPlaceholder />
          </div>
        </div>

        {/* Tabla de amortización */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-800 mb-3">
            Tabla de Amortización
          </h3>
          <div
            className="overflow-x-auto rounded-xl border border-gray-200"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ backgroundColor: '#262626' }}>
                  <th className="text-left px-4 py-3 font-semibold text-white">N° Cuota</th>
                  <th className="text-left px-4 py-3 font-semibold text-white">Fecha</th>
                  <th className="text-right px-4 py-3 font-semibold text-white">Saldo inicial</th>
                  <th className="text-right px-4 py-3 font-semibold text-white" style={{ color: '#A85BFF' }}>Capital</th>
                  <th className="text-right px-4 py-3 font-semibold text-white" style={{ color: '#E7000B' }}>Interés</th>
                  <th className="text-right px-4 py-3 font-semibold text-white">Valor Cuota</th>
                  <th className="text-right px-4 py-3 font-semibold text-white">Saldo Final</th>
                </tr>
              </thead>
              <tbody>
                {PLACEHOLDER_ROWS.map((row, idx) => (
                  <tr
                    key={row.period}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    style={{ borderBottom: '1px solid #f0f0f0' }}
                  >
                    <td className="px-4 py-2.5 text-gray-700">{row.period}</td>
                    <td className="px-4 py-2.5 text-gray-700">{row.date}</td>
                    <td className="text-right px-4 py-2.5 text-gray-700">{row.initialBalance}</td>
                    <td className="text-right px-4 py-2.5 font-medium" style={{ color: '#A85BFF' }}>{row.principal}</td>
                    <td className="text-right px-4 py-2.5 font-medium" style={{ color: '#E7000B' }}>{row.interest}</td>
                    <td className="text-right px-4 py-2.5 text-gray-700">{row.payment}</td>
                    <td className="text-right px-4 py-2.5 text-gray-700">{row.finalBalance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observaciones para el administrador */}
        <div className="mb-8">
          <label
            htmlFor="observations"
            className="block text-sm font-semibold text-gray-700 mb-1.5"
          >
            Observaciones (Mensaje para el Administrador) <span className="text-red-500">*</span>
          </label>
          <textarea
            id="observations"
            rows={4}
            placeholder="Observaciones de la Simulación..."
            value={observations}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setObservations(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-y focus:ring-2 focus:ring-blue-300"
            style={{ border: '1.5px solid #8CADDA', backgroundColor: '#FAFCFF' }}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">

          {/* Guardar simulación — muestra toast al hacer clic */}
          <div className="relative">
            <button
              type="button"
              onClick={handleSave}
              className="px-7 py-2.5 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95"
              style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.25)' }}
            >
              Guardar simulación
            </button>

            {/* Toast de pendiente backend */}
            {toastVisible && (
              <div
                className="absolute left-1/2 mt-2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white"
                style={{ transform: 'translateX(-50%)', top: '100%', zIndex: 10 }}
                role="status"
                aria-live="polite"
              >
                Pendiente integración con backend
              </div>
            )}
          </div>

          {/* Estrella — toggle destacar simulación */}
          <button
            type="button"
            onClick={() => setStarred((s) => !s)}
            aria-label={starred ? 'Quitar destacado' : 'Destacar simulación'}
            className="px-5 py-2.5 rounded-full font-bold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: '#262626',
              color: starred ? '#FBBF24' : '#9CA3AF',
            }}
          >
            ★
          </button>

          {/* Nueva simulación */}
          <button
            type="button"
            onClick={onNewSimulation}
            className="px-7 py-2.5 rounded-full font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 hover:brightness-105"
            style={{ backgroundColor: '#C0D901', color: '#1a1a1a' }}
          >
            Nueva simulación
          </button>
        </div>

        {/* Banner referencial */}
        <div
          className="rounded-xl px-4 py-3 text-xs leading-relaxed"
          style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}
          role="note"
        >
          <strong>Nota:</strong> Esta es una simulación referencial con datos de ejemplo. Los valores finales pueden variar según políticas institucionales vigentes. El botón de la estrella permite destacar esta simulación antes de guardarla.
        </div>
      </div>
    </div>
  );
}
