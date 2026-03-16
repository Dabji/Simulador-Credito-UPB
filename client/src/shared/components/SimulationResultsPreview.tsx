/* ─────────────────────────────────────────────────────────────
   COMPONENTE: SimulationResultsPreview
   Muestra resultados REALES de la simulación (HU-13).
   Recibe summary + schedule del backend vía props.
   Mantiene diseño visual idéntico al prototipo original.
───────────────────────────────────────────────────────────────── */

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { SummaryCard } from './SummaryCard';
import { SimulationCharts } from './SimulationCharts';
import { saveSimulation, getSimulatorConfig } from '../services/api';
import type { SimulationSummaryDTO, SimulationInputDTO, AdminParameterVersion } from '../services/api';

/* ── Tipo compartido para el diálogo de confirmación modal ──────────────
   Mismo patrón que en SimulationForm para consistencia visual.
   Se usa para: Guardar simulación y Nueva simulación.
──────────────────────────────────────────────────────────────── */
interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
}

const DIALOG_CLOSED: ConfirmDialogState = {
  open: false, title: '', message: '',
  confirmLabel: 'Confirmar', confirmColor: '#A85BFF',
  onConfirm: () => undefined,
};

/* Formatea un número como COP sin signo $ ambiguo.
   Ejemplo: 1400000 → "1.400.000 COP" */
function cop(value: number): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} COP`;
}

/** Tasa para mostrar en la UI (ej. 0.009 → "0.9") */
function rateDisplay(params: AdminParameterVersion | null): string {
  if (!params) return '0.9';
  const entry = params.interestRates.find(r => r.levelScope === 'PREGRADO');
  const rate = entry?.rateMonthly ?? 0.009;
  return (rate * 100).toFixed(1).replace(/\.0$/, '');
}

/* Formatea fecha ISO "YYYY-MM-DD" a "Agosto 2026" (mes + año, sin día) */
function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const raw = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(d);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

interface SimulationResultsPreviewProps {
  summary: SimulationSummaryDTO;
  input: SimulationInputDTO;
  onNewSimulation: () => void;
  mode?: 'student' | 'guest';
}

export function SimulationResultsPreview({ summary, input, onNewSimulation, mode = 'student' }: SimulationResultsPreviewProps) {
  const [observations, setObservations] = useState(input.observations ?? '');
  const [toastMsg, setToastMsg]         = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  /* Diálogo de confirmación — reutilizable para Guardar y Nueva simulación */
  const [dialog, setDialog]             = useState<ConfirmDialogState>(DIALOG_CLOSED);

  /* Parámetros activos para mostrar tasa dinámica en resumen */
  const [activeParams, setActiveParams] = useState<AdminParameterVersion | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await getSimulatorConfig();
      if (!cancelled && res.data?.data) setActiveParams(res.data.data);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  /* Capital total = totalPaid - initialPayment - totalInterest */
  const totalCapital = summary.totalPaid - summary.initialPayment - summary.totalInterest;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  /* Abre el diálogo modal con opciones personalizadas */
  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = 'Confirmar',
    confirmColor = '#A85BFF',
  ) => setDialog({ open: true, title, message, onConfirm, confirmLabel, confirmColor });

  const closeDialog = () => setDialog(DIALOG_CLOSED);

  /* #61 — Guardar simulación directamente, sin requerir estrella, mensaje sin IDs */
  const handleSave = () => {
    confirm(
      'Guardar simulación',
      '¿Deseas guardar esta simulación? Se registrará con las observaciones y el estado actual.',
      async () => {
        setSaving(true);
        const res = await saveSimulation({ ...input, starred: false, observations });
        setSaving(false);
        if (res.error) { showToast('Error al guardar la simulación. Inténtalo de nuevo.'); return; }
        showToast('Simulación guardada exitosamente en tu historial. ✅');
      },
      'Guardar',
      '#A85BFF',
    );
  };

  /* Nueva simulación — pide confirmación antes de descartar resultados */
  const handleNewSimulation = () => {
    confirm(
      'Nueva simulación',
      '¿Deseas comenzar una nueva simulación? Los resultados actuales no se guardarán a menos que los hayas guardado primero.',
      onNewSimulation,
      'Sí, nueva simulación',
      '#C0D901',
    );
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
          Periodo {summary.academicPeriod} · {summary.numberOfPayments} cuota(s)
        </p>
      </div>

      <div
        className="bg-white rounded-b-2xl border border-gray-200 p-5 sm:p-7"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        {/* Fila 1 de cards de resumen — datos reales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <SummaryCard label="Valor matrícula"  value={cop(summary.tuitionGross)} />
          <SummaryCard label="Cuota inicial"    value={`${cop(summary.initialPayment)} (${summary.initialPaymentPct}%)`} />
          <SummaryCard label="Total financiado" value={cop(summary.financedValue)} color="purple" />
          <SummaryCard label="Modalidad"        value={summary.interestMode === 'con_interes' ? `Con intereses (${rateDisplay(activeParams)}% M.V.)` : 'Sin intereses (0%)'} />
        </div>

        {/* Fila 2 de cards de resumen — datos reales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <SummaryCard label="Número de cuotas"     value={String(summary.numberOfPayments)} />
          <SummaryCard label="Valor cuota estimada" value={cop(summary.periodicPayment)} />
          <SummaryCard label="Total a pagar"        value={cop(summary.totalPaid)} />
          <SummaryCard label="Total intereses"      value={cop(summary.totalInterest)} color="red" />
        </div>

        {/* HU-33 — Gráficas interactivas con selector (3 opciones) */}
        <SimulationCharts
          schedule={summary.schedule}
          totalCapital={totalCapital > 0 ? totalCapital : summary.financedValue}
          totalInterest={summary.totalInterest}
        />

        {/* #58 — Cuota inicial como pago separado, fuera de la tabla */}
        <div
          className="rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-3"
          style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE', color: '#5B21B6' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-bold">Pago inicial (Cuota 1):</span>{' '}
            <span className="font-semibold">{cop(summary.initialPayment)}</span>
            <span className="text-xs ml-2 opacity-75">({summary.initialPaymentPct}% — no genera intereses)</span>
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
                {summary.schedule.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                      No hay cuotas posteriores. Pago único.
                    </td>
                  </tr>
                ) : summary.schedule.map((row, idx) => (
                  <tr
                    key={row.period}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    style={{ borderBottom: '1px solid #f0f0f0' }}
                  >
                    <td className="px-4 py-2.5 text-gray-700">{row.period}</td>
                    <td className="px-4 py-2.5 text-gray-700">{fmtDate(row.date)}</td>
                    <td className="text-right px-4 py-2.5 text-gray-700">{cop(row.initialBalance)}</td>
                    <td className="text-right px-4 py-2.5 font-medium" style={{ color: '#A85BFF' }}>{cop(row.principal)}</td>
                    <td className="text-right px-4 py-2.5 font-medium" style={{ color: '#E7000B' }}>{cop(row.interest)}</td>
                    <td className="text-right px-4 py-2.5 text-gray-700">{cop(row.payment)}</td>
                    <td className="text-right px-4 py-2.5 text-gray-700">{cop(row.finalBalance)}</td>
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

        {/* Nota informativa de matrícula neta */}
        {summary.scholarshipPct > 0 && (
          <div
            className="rounded-xl px-4 py-2 mb-4 text-xs"
            style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0', color: '#166534' }}
          >
            Matrícula neta aplicada: {cop(summary.tuitionNet)} (beca/descuento {summary.scholarshipPct}% aplicada)
          </div>
        )}

        {/* Modo invitado: banner informativo en lugar del botón guardar */}
        {mode === 'guest' && (
          <div
            className="rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-3"
            style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}
            role="note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>Modo invitado:</strong> para guardar o exportar tus simulaciones debes <Link to="/login" className="underline font-semibold hover:text-blue-700">iniciar sesión</Link>.</span>
          </div>
        )}

        {/* #61 — Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">

          {/* Guardar simulación — solo en modo student */}
          {mode === 'student' && (
            <div className="relative">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-7 py-2.5 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95 disabled:opacity-60"
                style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.25)' }}
              >
                {saving ? 'Guardando...' : 'Guardar simulación'}
              </button>

              {/* Toast de feedback flotante */}
              {toastMsg && (
                <div
                  className="absolute left-1/2 mt-2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white"
                  style={{ transform: 'translateX(-50%)', top: '100%', zIndex: 10 }}
                  role="status"
                  aria-live="polite"
                >
                  {toastMsg}
                </div>
              )}
            </div>
          )}

          {/* Nueva simulación — siempre visible */}
          <button
            type="button"
            onClick={handleNewSimulation}
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
          <strong>Nota:</strong> Los valores calculados son referenciales y pueden variar según políticas institucionales vigentes.
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
           Diálogo de confirmación modal — para Guardar y Nueva simulación.
           Renderizado fuera del contenido desplazable para no afectar layout.
           El backdrop oscuro cierra el diálogo al hacer clic fuera.
      ───────────────────────────────────────────────────────────────── */}
      {dialog.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="results-confirm-dialog-title"
          onClick={closeDialog}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-7 mx-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="results-confirm-dialog-title"
              className="text-base font-bold text-gray-900 mb-2"
            >
              {dialog.title}
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDialog}
                className="px-5 py-2 rounded-full text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { dialog.onConfirm(); closeDialog(); }}
                className="px-5 py-2 rounded-full text-sm font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: dialog.confirmColor,
                  color: dialog.confirmColor === '#C0D901' ? '#1a1a1a' : 'white',
                }}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
