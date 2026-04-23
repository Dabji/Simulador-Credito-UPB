import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import { BackNavLink } from '@/shared/components/BackNavLink';
import { FilterPanel, CriterionChip } from '@/shared/components/FilterPanel';
import { criterionDisplayValue } from '@/shared/utils/filterPanel.types';
import type { ActiveCriterion, FilterFieldDef } from '@/shared/utils/filterPanel.types';
import {
  adminListSimulations,
  adminDeleteSimulation,
  type AdminSimulationItemDTO,
  type AdminSimFilterCriterion,
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

const SIM_FIELD_DEFS: ReadonlyArray<FilterFieldDef> = [
  { key: 'createdAt',      label: 'Fecha de Creación',    type: 'daterange' },
  { key: 'academicPeriod', label: 'Período Académico',    type: 'select',   options: buildPeriodOptions() },
  { key: 'interestMode',   label: 'Modalidad',            type: 'select',   options: [
    { value: 'SIN_INTERES', label: 'Sin intereses' },
    { value: 'CON_INTERES', label: 'Con intereses' },
  ]},
  { key: 'studentName',    label: 'Estudiante (Nombre)',  type: 'text',     supportsMultiple: false },
  { key: 'studentEmail',   label: 'Estudiante (Correo)',  type: 'text',     supportsMultiple: false },
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
  return new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' }).format(d);
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function formatModality(m: 'SIN_INTERES' | 'CON_INTERES'): string {
  return m === 'SIN_INTERES' ? 'Sin interés' : 'Con interés';
}

/** Convierte ActiveCriterion[] → AdminSimFilterCriterion[] para la API */
function toApiCriteria(criteria: ActiveCriterion[]): AdminSimFilterCriterion[] {
  return criteria.map(c => ({
    field:    c.field as AdminSimFilterCriterion['field'],
    value:    c.value,
    dateFrom: c.dateFrom,
    dateTo:   c.dateTo,
  }));
}

// ── Componente principal ─────────────────────────────────────

export function AdminSimulationsPage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  /* Filtros acumulables (HU-PV-03) */
  const [criteria,   setCriteria]   = useState<ActiveCriterion[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  /* Resultados */
  const [items,      setItems]      = useState<AdminSimulationItemDTO[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  /* Selección de fila */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* Modal eliminar */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);

  /* Toast de éxito */
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const run = async (pg: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminListSimulations({
          criteria: criteria.length > 0 ? toApiCriteria(criteria) : undefined,
          page:     pg,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setLoading(false);
        if (res.error) { setError(res.error); return; }
        const d = res.data?.data;
        if (d) {
          setItems(d.items);
          setTotal(d.total);
          setTotalPages(d.totalPages);
        }
      } catch {
        if (!cancelled) { setLoading(false); setError('Error al cargar simulaciones.'); }
      }
    };

    const timer = setTimeout(() => run(page), 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [criteria, page]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleCriteriaChange = useCallback((next: ActiveCriterion[]) => {
    setCriteria(next);
    setPage(1);
    setSelectedId(null);
  }, []);

  function handleRowClick(id: string) {
    setSelectedId(prev => (prev === id ? null : id));
  }

  async function handleConfirmDelete() {
    if (!selectedId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await adminDeleteSimulation(selectedId);
      if (res.error) {
        setDeleteError(res.error);
        setDeleting(false);
        return;
      }
      const deletedId = selectedId;
      setShowDeleteModal(false);
      setDeleting(false);
      setSelectedId(null);
      setSuccessMsg('Simulación eliminada correctamente.');
      setTimeout(() => setSuccessMsg(null), 4000);
      const newTotal = total - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      const targetPage = page > newTotalPages ? newTotalPages : page;
      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        setItems(i => i.filter(x => x.id !== deletedId));
        setTotal(newTotal);
        setTotalPages(newTotalPages);
      }
    } catch {
      setDeleteError('Error al eliminar la simulación.');
      setDeleting(false);
    }
  }

  const selectedItem = items.find(i => i.id === selectedId) ?? null;

  // ── Render ───────────────────────────────────────────────────
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

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 py-12">

        {/* Botón volver */}
        <BackNavLink to="/admin/main" label="Volver al menú" />

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 mt-3">
          Gestión de Simulaciones
        </h1>
        <p className="text-gray-500 text-sm mb-6">Listado de Simulaciones</p>

        {/* Toast éxito */}
        {successMsg && (
          <div
            className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-800 text-sm font-medium"
            role="status"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* ── Barra de filtros ── */}
        <div className="flex items-center gap-3 mb-3">

          {/* Resumen de filtros activos */}
          <div className="flex-1 flex items-center gap-2 flex-wrap min-h-[40px] px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/60">
            {criteria.length === 0 ? (
              <span className="text-sm text-gray-400">Sin filtros activos — mostrando todas las simulaciones</span>
            ) : (
              <>
                <span className="text-xs text-gray-500 font-medium shrink-0">Filtros:</span>
                {criteria.map(c => {
                  const def = SIM_FIELD_DEFS.find(f => f.key === c.field);
                  return (
                    <CriterionChip
                      key={c.field}
                      label={def?.label ?? c.field}
                      value={criterionDisplayValue(c, SIM_FIELD_DEFS)}
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
                fieldDefs={SIM_FIELD_DEFS}
                criteria={criteria}
                onChange={handleCriteriaChange}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]">
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
                      No hay simulaciones que coincidan con los filtros aplicados.
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
                        cursor-pointer border-b border-gray-100 last:border-b-0
                        transition-all duration-150
                        ${isSelected
                          ? 'bg-[#EDE9FE] border-l-4 border-l-[#6b21a8]'
                          : idx % 2 === 0
                            ? 'bg-white hover:bg-[#F5F3FF] hover:shadow-sm'
                            : 'bg-gray-50/60 hover:bg-[#F5F3FF] hover:shadow-sm'}
                      `}
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
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

          {/* Nota 90 días + paginación */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-gray-400 italic">
              &quot;El sistema elimina automáticamente simulaciones con antigüedad mayor a 90 días.&quot;
            </p>

            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 mr-2">
                {total > 0
                  ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total}`
                  : 'Sin resultados'}
              </p>
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
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            disabled={!selectedId}
            onClick={() => selectedId && navigate(`/admin/simulations/${selectedId}`)}
            className="
              px-8 py-3 rounded-full font-bold text-sm transition-all duration-200
              hover:scale-[1.03] active:scale-[0.97]
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#a3c900]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
            "
            style={{ backgroundColor: '#C0D901', color: '#1a1a1a', boxShadow: selectedId ? '0 4px 14px rgba(192,217,1,0.4)' : undefined }}
          >
            Ver Simulación
          </button>

          <button
            type="button"
            disabled={!selectedId}
            onClick={() => { setDeleteError(null); setShowDeleteModal(true); }}
            className="
              px-8 py-3 rounded-full font-bold text-sm text-white transition-all duration-200
              hover:scale-[1.03] active:scale-[0.97]
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
            "
            style={{ backgroundColor: '#EF4444', boxShadow: selectedId ? '0 4px 14px rgba(239,68,68,0.35)' : undefined }}
          >
            Eliminar Simulación
          </button>
        </div>
      </main>

      <UpbFooter />

      {/* ── Modal de confirmación de eliminación ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!deleting) setShowDeleteModal(false); }}
          />

          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-5"
            style={{ animation: 'fadeScaleIn 0.2s ease-out' }}
          >
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h2 id="delete-modal-title" className="text-xl font-black text-gray-900 mb-2">
                Eliminar Simulación
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Esta acción marcará la simulación como eliminada y dejará de aparecer en los listados.
                {selectedItem?.studentName && (
                  <><br /><span className="font-semibold text-gray-700">{selectedItem.studentName}</span><br /></>
                )}
                ¿Deseas continuar?
              </p>
            </div>

            {deleteError && (
              <p className="text-sm text-red-600 text-center font-medium bg-red-50 rounded-xl px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="
                  flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-sm text-gray-700
                  hover:bg-gray-50 transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-gray-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="
                  flex-1 py-3 rounded-xl font-bold text-sm text-white
                  bg-red-500 hover:bg-red-600 transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-red-400
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {deleting ? 'Eliminando…' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
