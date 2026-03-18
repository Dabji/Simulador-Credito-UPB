import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import {
  adminListUsers,
  type AdminUserListItemDTO,
  type AdminUserFilterField,
} from '@/shared/services/api';

type FilterOption = AdminUserFilterField | 'all';

/* ── Tipos ─────────────────────────────────────────────────── */

const FILTER_LABELS: Record<FilterOption, string> = {
  all:                 'Todos',
  identificationNumber: 'Número de Documento',
  documentType:        'Tipo de Documento',
  fullName:            'Nombre Completo',
  email:               'Correo Electrónico',
  phone:               'Número Celular',
  createdAt:           'Fecha de Registro',
};

const ALL_FILTERS: FilterOption[] = [
  'identificationNumber', 'documentType', 'fullName', 'email', 'phone', 'createdAt',
];

const PAGE_SIZE = 10;

/* ── Helpers ───────────────────────────────────────────────── */

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/* ── Componente principal ───────────────────────────────────── */

export function AdminStudentsPage() {
  const navigate    = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  /* Estado de búsqueda / filtro */
  const [query,         setQuery]         = useState('');
  const [activeFilter,  setActiveFilter]  = useState<FilterOption>('identificationNumber');
  const [filterOpen,    setFilterOpen]    = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  /* Estado de resultados */
  const [users,       setUsers]       = useState<AdminUserListItemDTO[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  /* Selección de fila */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ── Fetch + debounce unificado ─────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    const run = async (pg: number) => {
      setLoading(true);
      setError(null);
      try {
        const apiFilter: AdminUserFilterField | undefined = activeFilter === 'all' ? undefined : activeFilter;
        const res = await adminListUsers({ q: query || undefined, filter: apiFilter, page: pg, pageSize: PAGE_SIZE });
        if (cancelled) return;
        setLoading(false);
        if (res.error) {
          setError(res.error);
          return;
        }
        const d = res.data?.data;
        if (d) {
          setUsers(d.items);
          setTotal(d.total);
          setTotalPages(d.totalPages);
        }
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Error al cargar estudiantes.');
      }
    };

    const t = setTimeout(() => { void run(page); }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
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

  /* ── Handlers ───────────────────────────────────────────── */

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

  function handleVerPerfil() {
    if (selectedId) navigate(`/admin/students/${selectedId}`);
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

        {/* Breadcrumb / título */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => navigate('/admin/main')}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b21a8] hover:text-[#581c87] transition-all duration-200 focus:outline-none"
          >
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al menú
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 mt-3">
          Gestión de Estudiantes
        </h1>
        <p className="text-gray-500 text-sm mb-7">Listado de Estudiantes</p>

        {/* ── Barra de búsqueda + filtro ── */}
        <div className="flex items-center gap-3 mb-4">

          {/* Input búsqueda */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {/* Lupa SVG con animación cuando hay foco */}
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
                placeholder-gray-400
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40 focus:border-[#A85BFF]
                shadow-sm hover:shadow-md
              "
            />
          </div>

          {/* Botón filtro (tres barras) + dropdown */}
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
                borderColor: filterOpen ? '#A85BFF' : '#DDD6FE',
                backgroundColor: filterOpen ? '#F3E8FF' : '#FAFAFA',
                color: '#6b21a8',
              }}
            >
              {/* Tres barras */}
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

        {/* Filtro activo badge */}
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
              >
                ×
              </button>
            </span>
          </div>
        )}

        {/* ── Tabla ── */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr style={{ backgroundColor: '#F5F3FF' }}>
                  {['N° Documento', 'Tipo Doc.', 'Nombre Completo', 'Correo Electrónico', 'Número Celular', 'Fecha Registro'].map(h => (
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
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                      <span className="inline-block animate-pulse">Cargando estudiantes…</span>
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <span className="text-red-600 text-sm font-medium">{error}</span>
                    </td>
                  </tr>
                )}
                {!loading && !error && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No se encontraron estudiantes con los filtros actuales.
                    </td>
                  </tr>
                )}
                {!loading && !error && users.map((u, idx) => {
                  const isSelected = selectedId === u.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleRowClick(u.id)}
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
                      <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">{u.identificationNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ backgroundColor: '#F3E8FF', color: '#6b21a8' }}
                        >
                          {u.documentType ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.fullName}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.email}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pie: paginación + Ver Perfil ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5">

          {/* Info total */}
          <p className="text-xs text-gray-400">
            {total > 0
              ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total} estudiante${total !== 1 ? 's' : ''}`
              : 'Sin resultados'}
          </p>

          {/* Controles paginación */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
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
              onClick={() => setPage(p => p + 1)}
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

          {/* Botón Ver Perfil */}
          <button
            type="button"
            disabled={!selectedId}
            onClick={handleVerPerfil}
            className="
              px-6 py-2.5 rounded-xl text-sm font-bold text-white
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40
              disabled:opacity-40 disabled:cursor-not-allowed
            "
            style={{
              backgroundColor: selectedId ? '#6E11B0' : '#9CA3AF',
              boxShadow: selectedId ? '0 4px 14px rgba(110,17,176,0.3)' : undefined,
            }}
          >
            Ver Perfil
          </button>
        </div>

      </main>
      <UpbFooter />
    </div>
  );
}
