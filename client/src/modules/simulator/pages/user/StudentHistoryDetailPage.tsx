// ============================================================
// PÁGINA: StudentHistoryDetailPage (HU-36)
// Ver detalle completo de una simulación desde panel estudiante.
// Incluye datos del estudiante, información financiera,
// resumen de cuotas, gráficos y tabla de amortización.
// Exportación solo en PDF (sin CSV).
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import { BackNavLink } from '@/shared/components/BackNavLink';
import { SummaryCard } from '@/shared/components/SummaryCard';
import { SimulationCharts } from '@/shared/components/SimulationCharts';
import {
  getMySimulationById,
  exportMySimulationPdf,
  type StudentSimulationDetailDTO,
} from '@/shared/services/api';

/* ── Helpers ─────────────────────────────────────────────── */

function cop(value: number): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} COP`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const raw = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(d);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    PREGRADO: 'Pregrado',
    POSGRADO: 'Posgrado',
    UPB_Tech: 'UPB Tec',
  };
  return map[level] ?? level;
}

function modalityLabel(modality: string): string {
  return modality === 'con_interes' ? 'Con Intereses' : 'Sin Intereses';
}

/* ── Read-only field ─────────────────────────────────────── */

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div
        className="px-3 py-2.5 rounded-xl text-sm text-gray-700 border border-gray-200"
        style={{ backgroundColor: '#F9FAFB' }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

/* ── Componente principal ───────────────────────────────── */

export function StudentHistoryDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const [profileOpen, setProfileOpen] = useState(false);

  const [simulation, setSimulation] = useState<StudentSimulationDetailDTO | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  /* Estado exportación PDF */
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading-pdf'>('idle');
  const [exportToast,  setExportToast]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  function showToast(type: 'success' | 'error', msg: string): void {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setExportToast({ type, msg });
    toastTimerRef.current = setTimeout(() => setExportToast(null), 5000);
  }

  async function handleExportPdf(): Promise<void> {
    if (!id || exportStatus !== 'idle') return;
    setExportStatus('loading-pdf');
    try {
      const { blob, filename } = await exportMySimulationPdf(id);
      triggerBlobDownload(blob, filename);
      showToast('success', 'PDF descargado correctamente.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el PDF.';
      showToast('error', msg);
    } finally {
      setExportStatus('idle');
    }
  }

  /* ── Carga inicial ─────────────────────────────────────── */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      const res = await getMySimulationById(id);
      if (cancelled) return;
      setLoading(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.data) setSimulation(res.data);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const s = simulation?.summary;

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-white"
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (profileOpen && !t.closest('[data-profile-menu]')) setProfileOpen(false);
      }}
    >
      <UpbHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen(p => !p)}
      />

      {/* ── Spinner / descargando (top-right) ── */}
      {exportStatus !== 'idle' && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#EF4444' }}
          role="status"
          aria-live="polite"
        >
          <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          Generando PDF…
        </div>
      )}

      {/* ── Toast éxito / error ── */}
      {exportToast && (
        <div
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold"
          style={{
            backgroundColor: exportToast.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color:           exportToast.type === 'success' ? '#166534'  : '#991b1b',
            border:          `1px solid ${exportToast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
          role="alert"
        >
          {exportToast.type === 'success' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {exportToast.msg}
        </div>
      )}

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-10 py-10">

        {/* Breadcrumb */}
        <BackNavLink to="/student/history" label="Historial de Simulaciones" breadcrumb="Detalle de Simulación" />

        {/* Título */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-8">
          Información de la Simulación
        </h1>

        {/* ── Estado de carga ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#A85BFF]/30 border-t-[#A85BFF] rounded-full animate-spin" />
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="rounded-2xl px-5 py-4 mb-6 border border-red-200 bg-red-50 animate-[fadeIn_0.3s_ease-out]">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* ── Contenido ── */}
        {!loading && !error && simulation && s && (
          <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">

            {/* ════════════════════════════════════════════════════
                SECCIÓN 1: Información del Estudiante + Datos base
            ════════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-3 px-6 py-4 border-b border-gray-100"
                style={{ backgroundColor: '#F5F3FF' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: '#6E11B0' }}
                >
                  {simulation.student.firstName.charAt(0).toUpperCase()}
                  {simulation.student.lastName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Información del Estudiante</h2>
                  <p className="text-xs text-gray-500">
                    {simulation.student.firstName} {simulation.student.lastName}
                  </p>
                </div>
              </div>

              <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ReadOnlyField
                  label="Nombre Completo"
                  value={`${simulation.student.firstName} ${simulation.student.lastName}`}
                />
                <ReadOnlyField
                  label="Correo Electrónico"
                  value={simulation.student.email}
                />
                <ReadOnlyField
                  label="Tipo de Documento"
                  value={simulation.student.documentType || '—'}
                />
                <ReadOnlyField
                  label="Número de Identificación"
                  value={simulation.student.identificationNumber}
                />
                <ReadOnlyField
                  label="Número de Celular"
                  value={simulation.student.phone || 'No registrado'}
                />
                <ReadOnlyField
                  label="Nivel Educativo"
                  value={levelLabel(simulation.level)}
                />
                <ReadOnlyField
                  label="Tipo de Estudiante"
                  value={simulation.studentType === 'NUEVO' ? 'Nuevo' : 'Continuo'}
                />
                <ReadOnlyField
                  label="Modalidad"
                  value={modalityLabel(s.interestMode)}
                />
                <ReadOnlyField
                  label="Fecha de Creación"
                  value={formatDate(simulation.savedAt)}
                />
                <ReadOnlyField
                  label="Período Académico"
                  value={s.academicPeriod || '—'}
                />
              </div>
            </div>

            {/* ════════════════════════════════════════════════════
                SECCIÓN 2: Información de la Financiación
            ════════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-100 flex items-center gap-2"
                style={{ backgroundColor: '#F5F3FF' }}
              >
                <svg className="w-4 h-4 text-[#6b21a8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="font-bold text-gray-800 text-sm">Información de la Financiación</h2>
              </div>

              <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ReadOnlyField
                  label="Valor Matrícula (Bruto)"
                  value={cop(s.tuitionGross)}
                />
                <ReadOnlyField
                  label="% Beca / Descuento"
                  value={`${s.scholarshipPct}%`}
                />
                <ReadOnlyField
                  label="Matrícula Neta"
                  value={cop(s.tuitionNet)}
                />
                <ReadOnlyField
                  label="Cuota Inicial"
                  value={`${cop(s.initialPayment)} (${s.initialPaymentPct}%)`}
                />
                <ReadOnlyField
                  label="Valor a Financiar"
                  value={cop(s.financedValue)}
                />
                <ReadOnlyField
                  label="Tasa de Interés Mensual"
                  value={s.interestMode === 'con_interes'
                    ? `${(simulation.appliedRateMonthly * 100).toFixed(2)}% M.V.`
                    : '0% (Sin intereses)'
                  }
                />
                <ReadOnlyField
                  label="Número de Cuotas"
                  value={String(s.numberOfPayments)}
                />
                <ReadOnlyField
                  label="Cuota Fija Mensual Estimada"
                  value={cop(s.periodicPayment)}
                />
              </div>

              {/* Observaciones — campo de solo lectura ancho completo */}
              <div className="px-6 pb-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                  Observaciones del Estudiante
                </label>
                <div
                  className="w-full px-4 py-3 rounded-xl text-sm text-gray-700 border border-gray-200 min-h-[60px]"
                  style={{ backgroundColor: '#F9FAFB' }}
                >
                  {simulation.studentObservation || 'Sin observaciones registradas.'}
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════
                SECCIÓN 3: Resumen de Cuotas (SummaryCards)
            ════════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-100 flex items-center gap-2"
                style={{ backgroundColor: '#F5F3FF' }}
              >
                <svg className="w-4 h-4 text-[#6b21a8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="font-bold text-gray-800 text-sm">Resumen de Cuotas</h2>
              </div>

              <div className="px-6 py-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <SummaryCard label="Valor matrícula"  value={cop(s.tuitionGross)} />
                  <SummaryCard label="Cuota inicial"    value={`${cop(s.initialPayment)} (${s.initialPaymentPct}%)`} />
                  <SummaryCard label="Total financiado" value={cop(s.financedValue)} color="purple" />
                  <SummaryCard label="Modalidad"        value={modalityLabel(s.interestMode)} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <SummaryCard label="Número de cuotas"     value={String(s.numberOfPayments)} />
                  <SummaryCard label="Valor cuota estimada" value={cop(s.periodicPayment)} />
                  <SummaryCard label="Total a pagar"        value={cop(s.totalPaid)} />
                  <SummaryCard label="Total intereses"      value={cop(s.totalInterest)} color="red" />
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════
                SECCIÓN 4: Gráficas Interactivas
            ════════════════════════════════════════════════════ */}
            <SimulationCharts
              schedule={s.schedule}
              totalCapital={(() => {
                const capital = s.totalPaid - s.initialPayment - s.totalInterest;
                return (capital + s.totalInterest > 0) ? capital : s.financedValue;
              })()}
              totalInterest={s.totalInterest}
            />

            {/* ════════════════════════════════════════════════════
                SECCIÓN 5: Tabla de Amortización
            ════════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-100 flex items-center gap-2"
                style={{ backgroundColor: '#F5F3FF' }}
              >
                <svg className="w-4 h-4 text-[#6b21a8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h2 className="font-bold text-gray-800 text-sm">
                  Cronograma de Amortización ({s.schedule.length} cuota{s.schedule.length !== 1 ? 's' : ''})
                </h2>
              </div>

              <div className="px-6 py-5">
                {/* Pago inicial banner */}
                <div
                  className="rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-3"
                  style={{ backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE', color: '#5B21B6' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-bold">Pago inicial (Cuota 1):</span>{' '}
                    <span className="font-semibold">{cop(s.initialPayment)}</span>
                    <span className="text-xs ml-2 opacity-75">({s.initialPaymentPct}% — no genera intereses)</span>
                  </div>
                </div>

                {/* Tabla */}
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
                      {s.schedule.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                            No hay cuotas posteriores. Pago único.
                          </td>
                        </tr>
                      ) : s.schedule.map((row, idx) => (
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

                {/* Nota beca */}
                {s.scholarshipPct > 0 && (
                  <div
                    className="rounded-xl px-4 py-2 mt-4 text-xs"
                    style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0', color: '#166534' }}
                  >
                    Matrícula neta aplicada: {cop(s.tuitionNet)} (beca/descuento {s.scholarshipPct}% aplicada)
                  </div>
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════════════════
                FOOTER: Botón Exportar PDF (solo PDF para estudiante)
            ════════════════════════════════════════════════════ */}
            <div className="flex justify-center pt-2 pb-4">
              <button
                type="button"
                disabled={exportStatus !== 'idle'}
                onClick={() => { void handleExportPdf(); }}
                className="
                  w-full sm:w-auto px-10 py-3.5 rounded-xl text-sm font-bold text-white
                  transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                  hover:brightness-110
                  focus:outline-none focus:ring-2 focus:ring-[#EF4444]/40
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{ backgroundColor: '#EF4444', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}
              >
                {exportStatus === 'loading-pdf' ? 'Generando PDF…' : 'Exportar como PDF'}
              </button>
            </div>

            {/* Nota referencial */}
            <div
              className="rounded-xl px-4 py-3 text-xs leading-relaxed"
              style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}
              role="note"
            >
              <strong>Nota:</strong> Los valores calculados son referenciales y pueden variar según políticas institucionales vigentes.
            </div>

          </div>
        )}
      </main>

      <UpbFooter />
    </div>
  );
}
