// ============================================================
// PÁGINA: StudentHistoryPage  (HU-35 + HU-PV-03)
// Lista paginada + filtros avanzados acumulables (Outlook-style).
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import { BackNavLink } from '@/shared/components/BackNavLink';
import { FilterPanel, CriterionChip } from '@/shared/components/FilterPanel';
import { criterionDisplayValue } from '@/shared/utils/filterPanel.types';
import type { ActiveCriterion, FilterFieldDef } from '@/shared/utils/filterPanel.types';
import {
  getMySimulationHistory,
  type StudentHistoryItemDTO,
  type StudentHistoryFilterCriterion,
} from '@/shared/services/api';

// ── Constantes ───────────────────────────────────────────────

const PAGE_SIZE = 10;

/** Genera períodos académicos dinámicos con el mismo formato y rango que el simulador.
 *  Solo muestra año actual + año siguiente (igual que PERIOD_OPTIONS en SimulationForm).
 *  YYYY-01 → "YYYY-01 (Dic YYYY-1 – May YYYY)"
 *  YYYY-02 → "YYYY-02 (Jun – Nov YYYY)" */
function buildPeriodOptions(): ReadonlyArray<{ value: string; label: string }> {
  const currentYear = new Date().getFullYear();
  const opts: { value: string; label: string }[] = [];
  [currentYear, currentYear + 1].forEach(y => {
    opts.push({ value: `${y}-01`, label: `${y}-01 (Dic ${y - 1} – May ${y})` });
    opts.push({ value: `${y}-02`, label: `${y}-02 (Jun – Nov ${y})` });
  });
  return opts;
}

const HISTORY_FIELD_DEFS: ReadonlyArray<FilterFieldDef> = [
  { key: 'modality',       label: 'Modalidad',          type: 'select', options: [
    { value: 'SIN_INTERES', label: 'Sin intereses' },
    { value: 'CON_INTERES', label: 'Con intereses' },
  ]},
  { key: 'academicPeriod', label: 'Período Académico',  type: 'select', options: buildPeriodOptions() },
  { key: 'createdAt',      label: 'Fecha de Creación',  type: 'daterange' },
];

// ── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string | Date): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'decimal', maximumFractionDigits: 0,
  }).format(value) + ' COP';
}

function formatModality(m: 'SIN_INTERES' | 'CON_INTERES'): string {
  return m === 'SIN_INTERES' ? 'Sin interés' : 'Con interés';
}

/** Convierte ActiveCriterion[] → StudentHistoryFilterCriterion[] para la API */
function toApiCriteria(criteria: ActiveCriterion[]): StudentHistoryFilterCriterion[] {
  return criteria.map(c => ({
    field:    c.field as StudentHistoryFilterCriterion['field'],
    value:    c.value,
    dateFrom: c.dateFrom,
    dateTo:   c.dateTo,
  }));
}

// ── Componente principal ─────────────────────────────────────

export function StudentHistoryPage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  /* Filtros acumulables (HU-PV-03) */
  const [criteria,   setCriteria]   = useState<ActiveCriterion[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  /* Resultados */
  const [items,      setItems]      = useState<StudentHistoryItemDTO[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  /* Selección */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ── Fetch ──────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    const run = async (pg: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMySimulationHistory({
          criteria: criteria.length > 0 ? toApiCriteria(criteria) : undefined,
          page:     pg,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setLoading(false);
        if (res.error) { setError(res.error); return; }
        if (res.data) {
          setItems(res.data.items);
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);
        }
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Error al cargar historial.');
      }
    };

    const t = setTimeout(() => { void run(page); }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [criteria, page]);

  /* ── Handlers ────────────────────────────────────────────── */

  const handleCriteriaChange = useCallback((next: ActiveCriterion[]) => {
    setCriteria(next);
    setPage(1);
    setSelectedId(null);
  }, []);

  function handleRowClick(id: string) {
    setSelectedId(prev => prev === id ? null : id);
  }

  function handleVerSimulacion() {
    if (selectedId) navigate(`/student/history/${selectedId}`);
  }

  /* ── Render ──────────────────────────────────────────────── */

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

      <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-10">

        {/* Breadcrumb */}
        <BackNavLink to="/student/main" label="Volver al inicio" />

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 mt-3">
          Historial de Simulaciones
        </h1>
        <p className="text-gray-500 text-sm mb-6">Mis Simulaciones</p>

        {/* ── Barra de filtros ── */}
        <div className="flex items-center gap-3 mb-3">

          {/* Resumen de filtros activos */}
          <div className="flex-1 flex items-center gap-2 flex-wrap min-h-[40px] px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/60">
            {criteria.length === 0 ? (
              <span className="text-sm text-gray-400">Sin filtros activos — mostrando todas mis simulaciones</span>
            ) : (
              <>
                <span className="text-xs text-gray-500 font-medium shrink-0">Filtros:</span>
                {criteria.map(c => {
                  const def = HISTORY_FIELD_DEFS.find(f => f.key === c.field);
                  return (
                    <CriterionChip
                      key={c.field}
                      label={def?.label ?? c.field}
                      value={criterionDisplayValue(c, HISTORY_FIELD_DEFS)}
                      onRemove={() => handleCriteriaChange(criteria.filter(x => x.field !== c.field))}
                    />
                  );
                })}
                <button
                  type="button"
                  onClick={() => handleCriteriaChange([])}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1 font-medium focus:outline-none"
                >
                  Limpiar todo
                </button>
              </>
            )}
          </div>

          {/* Botón abrir FilterPanel */}
          <div className="relative shrink-0" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen(p => !p)}
              aria-label="Abrir panel de filtros"
              className="
                flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40
                shadow-sm hover:shadow-md
              "
              style={{
                borderColor:     filterOpen || criteria.length > 0 ? '#A85BFF' : '#DDD6FE',
                backgroundColor: filterOpen || criteria.length > 0 ? '#F3E8FF' : '#FAFAFA',
                color: '#6b21a8',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 6h16M4 12h10M4 18h7" />
              </svg>
              <span className="hidden sm:inline">Filtrar</span>
              {criteria.length > 0 && (
                <span
                  className="w-5 h-5 rounded-full text-xs font-black flex items-center justify-center"
                  style={{ backgroundColor: '#6E11B0', color: '#fff' }}
                >
                  {criteria.length}
                </span>
              )}
            </button>

            {filterOpen && (
              <FilterPanel
                fieldDefs={HISTORY_FIELD_DEFS}
                criteria={criteria}
                onChange={handleCriteriaChange}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </div>
        </div>

        {/* ── Tabla ── */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr style={{ backgroundColor: '#F5F3FF' }}>
                  {[
                    'Fecha Creación',
                    'Estudiante (Nombre)',
                    'Estudiante (Correo)',
                    'Modalidad',
                    'Período Académico',
                    'Valor Financiado',
                    'Primera Cuota (Fecha)',
                    'Cuota Inicial (Valor)',
                    '# Cuotas',
                  ].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold text-[#6b21a8] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">
                      <span className="inline-block animate-pulse">Cargando simulaciones…</span>
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <span className="text-red-600 text-sm font-medium">{error}</span>
                    </td>
                  </tr>
                )}
                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                      {criteria.length > 0
                        ? 'No hay simulaciones que coincidan con los filtros aplicados.'
                        : 'No tienes simulaciones guardadas aún.'}
                    </td>
                  </tr>
                )}
                {!loading && !error && items.map((item, idx) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      className={`
                        cursor-pointer border-t border-gray-100
                        transition-all duration-150
                        ${isSelected
                          ? 'shadow-md scale-[1.005] z-10 relative'
                          : 'hover:-translate-y-0.5 hover:shadow-sm'}
                      `}
                      style={{
                        backgroundColor: isSelected
                          ? '#EDE9FE'
                          : idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                        outline: isSelected ? '2px solid #A85BFF' : undefined,
                      }}
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {item.studentName || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {item.studentEmail || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: item.modality === 'SIN_INTERES' ? '#F0FDF4' : '#FFF7ED',
                            color:           item.modality === 'SIN_INTERES' ? '#166534' : '#9A3412',
                          }}
                        >
                          {formatModality(item.modality)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {item.academicPeriod}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-mono text-xs">
                        {formatCOP(item.financedValue)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatMonthYear(item.firstPaymentDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-mono text-xs">
                        {formatCOP(item.initialPaymentValue)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-center whitespace-nowrap">
                        {item.numberOfPayments}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mensaje 90 días */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400 italic">
              &quot;El sistema elimina automáticamente simulaciones con antigüedad mayor a 90 días.&quot;
            </p>
            <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3M14 5l-4 14" />
            </svg>
          </div>
        </div>

        {/* ── Pie: paginación + botones ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5">

          {/* Info total */}
          <p className="text-xs text-gray-400">
            {total > 0
              ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total} simulación${total !== 1 ? 'es' : ''}`
              : 'Sin resultados'}
          </p>

          {/* Paginación */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => { setPage(p => Math.max(1, p - 1)); setSelectedId(null); }}
              aria-label="Página anterior"
              className="
                w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200
                text-gray-500 transition-all duration-150
                hover:border-[#A85BFF] hover:text-[#6b21a8] hover:bg-[#F3E8FF]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200
                focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="text-sm font-semibold text-gray-700 min-w-[80px] text-center">
              Pág. {page} / {totalPages || 1}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => { setPage(p => p + 1); setSelectedId(null); }}
              aria-label="Página siguiente"
              className="
                w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200
                text-gray-500 transition-all duration-150
                hover:border-[#A85BFF] hover:text-[#6b21a8] hover:bg-[#F3E8FF]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200
                focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Botones acción */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!selectedId}
              onClick={handleVerSimulacion}
              className="
                px-6 py-2.5 rounded-full text-sm font-bold text-gray-900
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-[#C0D901]/60
                disabled:opacity-40 disabled:cursor-not-allowed
              "
              style={{
                backgroundColor: selectedId ? '#C0D901' : '#D1D5DB',
                boxShadow: selectedId ? '0 4px 14px rgba(192,217,1,0.35)' : undefined,
              }}
            >
              Ver Simulación
            </button>
          </div>
        </div>

      </main>

      <UpbFooter />
    </div>
  );
}
