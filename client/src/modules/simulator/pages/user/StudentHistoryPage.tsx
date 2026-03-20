// ============================================================
// PÁGINA: StudentHistoryPage  (HU-35 — Historial de Simulaciones)
// Lista paginada + filtrada de simulaciones del estudiante autenticado.
// Diseño idéntico al patrón AdminStudentsPage del sistema.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import {
  getMySimulationHistory,
  type StudentHistoryItemDTO,
  type StudentHistoryFilter,
} from '@/shared/services/api';

// ── Constantes ───────────────────────────────────────────────

const PAGE_SIZE = 10;

type FilterOption = StudentHistoryFilter;

const FILTER_LABELS: Record<FilterOption, string> = {
  modality:       'Modalidad',
  academicPeriod: 'Período Académico',
  createdAt:      'Fecha de Creación',
};

const ALL_FILTERS: FilterOption[] = ['modality', 'academicPeriod', 'createdAt'];

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

// ── Componente principal ─────────────────────────────────────

export function StudentHistoryPage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  /* Búsqueda / filtro */
  const [query,        setQuery]        = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('modality');
  const [filterOpen,   setFilterOpen]   = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  /* Resultados */
  const [items,       setItems]       = useState<StudentHistoryItemDTO[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  /* Selección */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ── Fetch con debounce ──────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    const run = async (pg: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMySimulationHistory({
          q:        query || undefined,
          filter:   activeFilter,
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
  }, [query, activeFilter, page]);

  /* Cerrar dropdown al click fuera */
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  /* ── Handlers ────────────────────────────────────────────── */

  function handleSelectFilter(f: FilterOption) {
    setActiveFilter(f);
    setQuery('');
    setPage(1);
    setFilterOpen(false);
    setSelectedId(null);
  }

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
        <div className="mb-2">
          <button
            type="button"
            onClick={() => navigate('/student/main')}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b21a8] hover:text-[#581c87] transition-all duration-200 focus:outline-none"
          >
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 mt-3">
          Historial de Simulaciones
        </h1>
        <p className="text-gray-500 text-sm mb-2">Mis Simulaciones</p>
        <p className="text-gray-400 text-xs mb-6">
          Filtra tus simulaciones por: <span className="font-semibold text-[#6b21a8]">Modalidad</span>,{' '}
          <span className="font-semibold text-[#6b21a8]">Período Académico</span> o{' '}
          <span className="font-semibold text-[#6b21a8]">Fecha de Creación</span>.
        </p>

        {/* ── Barra búsqueda + filtro ── */}
        <div className="flex items-center gap-3 mb-4">

          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); setSelectedId(null); }}
              placeholder={`Buscar por ${FILTER_LABELS[activeFilter].toLowerCase()}…`}
              className="
                w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
                placeholder-gray-400 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40 focus:border-[#A85BFF]
                shadow-sm hover:shadow-md
              "
            />
          </div>

          {/* Botón tres barras + dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen(p => !p)}
              aria-label="Abrir filtros"
              className="
                flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40
                shadow-sm hover:shadow-md
              "
              style={{
                borderColor:     filterOpen ? '#A85BFF' : '#DDD6FE',
                backgroundColor: filterOpen ? '#F3E8FF' : '#FAFAFA',
                color: '#6b21a8',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Filtrar</span>
            </button>

            {/* Dropdown animado */}
            <div
              className={`
                absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-30
                transition-all duration-200 origin-top-right
                ${filterOpen
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
              `}
            >
              <p className="px-4 pt-3 pb-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Filtrar por
              </p>
              {ALL_FILTERS.map((f) => (
                <div key={f}>
                  <button
                    type="button"
                    onClick={() => handleSelectFilter(f)}
                    className={`
                      w-full text-left px-4 py-2 text-sm transition-colors duration-150
                      ${activeFilter === f
                        ? 'bg-[#F3E8FF] text-[#6b21a8] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    {FILTER_LABELS[f]}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Badge filtro activo */}
        {query && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">Filtrar por:</span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#F3E8FF', color: '#6b21a8' }}
            >
              {FILTER_LABELS[activeFilter]}
              <button
                type="button"
                onClick={() => setQuery('')}
                className="hover:text-[#581c87] focus:outline-none"
                aria-label="Limpiar búsqueda"
              >×</button>
            </span>
          </div>
        )}

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
                      No tienes simulaciones guardadas aún.
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
                        {item.academicPeriod || '—'}
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
              "El sistema elimina automáticamente simulaciones con antigüedad mayor a 90 días."
            </p>
            {/* Ícono decorativo (código) */}
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
