import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import { BackNavLink } from '@/shared/components/BackNavLink';
import { FilterPanel, CriterionChip } from '@/shared/components/FilterPanel';
import { criterionDisplayValue } from '@/shared/utils/filterPanel.types';
import type { ActiveCriterion, FilterFieldDef } from '@/shared/utils/filterPanel.types';
import {
  adminListUsers,
  adminExportStudentsCsv,
  type AdminUserListItemDTO,
  type AdminUserFilterCriterion,
} from '@/shared/services/api';
import { DOCUMENT_TYPES } from '@/shared/utils/documentTypes';

/* ── Constantes ─────────────────────────────────────────────── */

const PAGE_SIZE = 10;

/** Opciones de tipo de documento para el filtro (9 tipos, issue #187) */
const DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPES.map((d) => ({
  value: d.code,
  label: d.displayLabel,
}));

const STUDENT_FIELD_DEFS: ReadonlyArray<FilterFieldDef> = [
  { key: 'documentType',         label: 'Tipo de Documento',   type: 'select', options: DOCUMENT_TYPE_OPTIONS },
  { key: 'identificationNumber', label: 'N° Documento',        type: 'text',  supportsMultiple: true },
  { key: 'fullName',             label: 'Nombre Completo',     type: 'text',  supportsMultiple: true },
  { key: 'email',                label: 'Correo Electrónico',  type: 'text',  supportsMultiple: true },
  { key: 'phone',                label: 'Número Celular',      type: 'text',  supportsMultiple: true },
  { key: 'createdAt',            label: 'Fecha de Registro',   type: 'daterange' },
];

/* ── Helpers ───────────────────────────────────────────────── */

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** Convierte ActiveCriterion[] → AdminUserFilterCriterion[] para la API */
function toApiCriteria(criteria: ActiveCriterion[]): AdminUserFilterCriterion[] {
  return criteria.map(c => ({
    field:    c.field as AdminUserFilterCriterion['field'],
    value:    c.value,
    dateFrom: c.dateFrom,
    dateTo:   c.dateTo,
  }));
}

/* ── Componente principal ───────────────────────────────────── */

export function AdminStudentsPage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  /* Filtros acumulables (HU-PV-03) */
  const [criteria,   setCriteria]   = useState<ActiveCriterion[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  /* Estado de resultados */
  const [users,      setUsers]      = useState<AdminUserListItemDTO[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  /* Selección de fila */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* CSV export */
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError,   setCsvError]   = useState<string | null>(null);

  /* ── Fetch ─────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    const run = async (pg: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminListUsers({
          criteria: criteria.length > 0 ? toApiCriteria(criteria) : undefined,
          page: pg,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setLoading(false);
        if (res.error) { setError(res.error); return; }
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
    return () => { cancelled = true; clearTimeout(t); };
  }, [criteria, page]);

  /* ── Handlers ───────────────────────────────────────────────── */

  const handleCriteriaChange = useCallback((next: ActiveCriterion[]) => {
    setCriteria(next);
    setPage(1);
    setSelectedId(null);
    setCsvError(null);
  }, []);

  function handleRowClick(id: string) {
    setSelectedId(prev => prev === id ? null : id);
  }

  function handleVerPerfil() {
    if (selectedId) navigate(`/admin/students/${selectedId}`);
  }

  async function handleExportCsv() {
    setCsvLoading(true);
    setCsvError(null);
    try {
      const { blob, filename } = await adminExportStudentsCsv({
        criteria: criteria.length > 0 ? toApiCriteria(criteria) : undefined,
      });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'Error al exportar CSV.');
    } finally {
      setCsvLoading(false);
    }
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
        <BackNavLink to="/admin/main" label="Volver al menú" />

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 mt-3">
          Gestión de Estudiantes
        </h1>
        <p className="text-gray-500 text-sm mb-6">Listado de Estudiantes</p>

        {/* ── Barra de filtros ── */}
        <div className="flex items-center gap-3 mb-3">

          {/* Resumen de filtros activos */}
          <div className="flex-1 flex items-center gap-2 flex-wrap min-h-[40px] px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/60">
            {criteria.length === 0 ? (
              <span className="text-sm text-gray-400">Sin filtros activos — mostrando todos los estudiantes</span>
            ) : (
              <>
                <span className="text-xs text-gray-500 font-medium shrink-0">Filtros:</span>
                {criteria.map(c => {
                  const def = STUDENT_FIELD_DEFS.find(f => f.key === c.field);
                  return (
                    <CriterionChip
                      key={c.field}
                      label={def?.label ?? c.field}
                      value={criterionDisplayValue(c, STUDENT_FIELD_DEFS)}
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
                fieldDefs={STUDENT_FIELD_DEFS}
                criteria={criteria}
                onChange={handleCriteriaChange}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </div>

          {/* Botón Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={csvLoading}
            aria-label="Exportar estudiantes a CSV"
            title={criteria.length > 0 ? 'Exportar resultado filtrado a CSV' : 'Exportar todos los estudiantes a CSV'}
            className="
              shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/40
              shadow-sm hover:shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{
              borderColor:     '#BBF7D0',
              backgroundColor: '#F0FDF4',
              color:           '#166534',
            }}
          >
            {csvLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            <span className="hidden sm:inline">{csvLoading ? 'Exportando…' : 'CSV'}</span>
          </button>
        </div>

        {/* Error CSV */}
        {csvError && (
          <p className="mb-3 text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-xl border border-red-100">
            {csvError}
          </p>
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
                      No se encontraron estudiantes con los filtros aplicados.
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
                          {u.documentType}
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

          {/* Botón: Ver Perfil */}
          <div className="flex items-center gap-3">
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
        </div>

      </main>
      <UpbFooter />
    </div>
  );
}
