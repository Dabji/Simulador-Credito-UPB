/* -----------------------------------------------------------------
   PÁGINA: UserProfilePage  (HU-81 — Datos personales del estudiante)
   Pantalla protegida (STUDENT) con:
     - Carga y muestra del perfil autenticado
     - Toggle "Editar información" con animación tipo lápiz/switch
     - Guardar cambios con feedback loading → success
     - Lista de simulaciones (solo lectura)
   Reutiliza UpbHeader y UpbFooter existentes.
------------------------------------------------------------------ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import { FullPageSpinner } from '@/shared/components/FullPageSpinner';
import {
  getMyProfile,
  updateMyProfile,
  getMySimulations,
} from '@/shared/services/api';
import type { MyProfileDTO, MySimulationItemDTO, UpdateMyProfilePayload } from '@/shared/services/api';
import {
  DOCUMENT_TYPES,
  type DocumentTypeCode,
  getDocumentValidationRule,
  getDocumentTypeInfo,
} from '@/shared/utils/documentTypes';

// ── Helpers ───────────────────────────────────────────────────
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Tipos locales ─────────────────────────────────────────────
interface FormState {
  documentType: DocumentTypeCode | '';
  identificationNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
}

// Helper: obtener label de tipo de documento para modo lectura
function getDocumentTypeLabel(code: string): string {
  if (!code) return '—';
  const doc = DOCUMENT_TYPES.find((d) => d.code === code);
  return doc?.displayLabel ?? code;
}

type SaveStatus = 'idle' | 'loading' | 'success' | 'error';

// ── Constantes de estilo ──────────────────────────────────────
const INPUT_BASE =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors';
const INPUT_DISABLED =
  'w-full rounded-xl border border-gray-100 px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed';
const LABEL_CLASS = 'block text-xs font-semibold text-gray-600 mb-1.5';

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================
export function UserProfilePage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  // Datos cargados
  const [profile, setProfile] = useState<MyProfileDTO | null>(null);
  const [simulations, setSimulations] = useState<MySimulationItemDTO[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [simsError, setSimsError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Estado del formulario
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>({
    documentType: '',
    identificationNumber: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Estado de guardado
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Carga inicial ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsPageLoading(true);
      const [profileRes, simsRes] = await Promise.all([
        getMyProfile(),
        getMySimulations(),
      ]);

      if (cancelled) return;

      if (profileRes.error || !profileRes.data?.user) {
        setLoadError(profileRes.error ?? 'Error al cargar el perfil.');
        setIsPageLoading(false);
        return;
      }

      const p = profileRes.data.user;
      setProfile(p);
      setForm({
        documentType:         p.documentType,
        identificationNumber: p.identificationNumber,
        firstName:            p.firstName,
        lastName:             p.lastName,
        phone:                p.phone ?? '',
      });

      if (simsRes.error) {
        setSimsError('No se pudieron cargar tus simulaciones. Intenta de nuevo más tarde.');
      } else if (simsRes.data?.simulations) {
        setSimulations(simsRes.data.simulations);
      }

      setIsPageLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  const handleToggleEdit = () => {
    if (editing && profile) {
      // Cancelar: restaurar valores originales
      setForm({
        documentType:         profile.documentType,
        identificationNumber: profile.identificationNumber,
        firstName:            profile.firstName,
        lastName:             profile.lastName,
        phone:                profile.phone ?? '',
      });
      setSaveError(null);
      setSaveStatus('idle');
    }
    setEditing((prev) => !prev);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    
    // Si cambia el tipo de documento, limpiar el número para evitar inconsistencias
    if (name === 'documentType') {
      setForm((prev) => ({ 
        ...prev, 
        documentType: value as DocumentTypeCode | '', 
        identificationNumber: '' 
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handler para el número de documento con sanitización según el tipo
  const handleDocumentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const rule = form.documentType ? getDocumentValidationRule(form.documentType) : null;
    
    if (!rule) {
      setForm((prev) => ({ ...prev, identificationNumber: value }));
      return;
    }

    // Sanitizar según el tipo de documento
    let sanitized = value;
    if (rule.digitsOnly) {
      sanitized = value.replace(/\D/g, ''); // Solo números
    } else if (rule.alphanumeric) {
      sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); // Alfanumérico mayúsculas
    }
    
    setForm((prev) => ({ ...prev, identificationNumber: sanitized }));
  };

  // Validación local con mensajes claros
  const validate = (): string | null => {
    if (!form.documentType) {
      return 'Selecciona un tipo de documento.';
    }
    
    const docRules = getDocumentValidationRule(form.documentType);
    if (docRules) {
      const idValue = form.identificationNumber.trim();
      const docTypeName = getDocumentTypeInfo(form.documentType)?.name ?? 'documento';
      
      if (!idValue) {
        return `Ingresa el número de ${docTypeName.toLowerCase()}.`;
      }
      if (!docRules.pattern.test(idValue)) {
        return `${docRules.message}. Ejemplo: ${docRules.placeholder}`;
      }
      if (idValue.length < docRules.minLength || idValue.length > docRules.maxLength) {
        return `El ${docTypeName.toLowerCase()} debe tener entre ${docRules.minLength} y ${docRules.maxLength} caracteres.`;
      }
    }
    
    if (!form.firstName.trim()) {
      return 'El nombre es obligatorio.';
    }
    if (!form.lastName.trim()) {
      return 'El apellido es obligatorio.';
    }
    
    return null;
  };

  const handleSave = async () => {
    // Validar antes de enviar
    const validationError = validate();
    if (validationError) {
      setSaveStatus('error');
      setSaveError(validationError);
      return;
    }

    setSaveStatus('loading');
    setSaveError(null);

    const payload: UpdateMyProfilePayload = {
      ...(form.documentType ? { documentType: form.documentType as DocumentTypeCode } : {}),
      identificationNumber: form.identificationNumber || undefined,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      phone: form.phone || undefined,
    };

    const res = await updateMyProfile(payload);

    if (res.error || !res.data?.user) {
      setSaveStatus('error');
      setSaveError(res.error ?? 'Error al guardar los cambios.');
      return;
    }

    const updated = res.data.user;
    setProfile(updated);
    setForm({
      documentType:         updated.documentType,
      identificationNumber: updated.identificationNumber,
      firstName:            updated.firstName,
      lastName:             updated.lastName,
      phone:                updated.phone ?? '',
    });
    setSaveStatus('success');
    setEditing(false);

    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  // ── Renderizado ───────────────────────────────────────────
  if (isPageLoading) return <FullPageSpinner />;

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-gray-50"
      onClick={() => { if (profileOpen) setProfileOpen(false); }}
    >
      <UpbHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((p) => !p)}
      />

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Título principal */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6">
          Datos Personales
        </h1>

        {/* Error de carga */}
        {loadError && (
          <div
            className="rounded-xl px-4 py-3 mb-6 text-sm font-medium"
            style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
            role="alert"
          >
            {loadError}
          </div>
        )}

        {/* ── Card de información personal ── */}
        <section
          className="bg-white rounded-2xl border border-gray-200 mb-6"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          {/* Encabezado de sección con toggle editar */}
          <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">
              Información Personal
            </h2>

            {/* Toggle "Editar información" con animación de switch */}
            <button
              type="button"
              onClick={handleToggleEdit}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-lg px-2 py-1"
              aria-pressed={editing}
              aria-label={editing ? 'Cancelar edición' : 'Editar información'}
            >
              <span>{editing ? 'Cancelar' : 'Editar información'}</span>

              {/* Switch animado con icono lápiz */}
              <span
                className="relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-300 ease-out"
                style={{ backgroundColor: editing ? '#A85BFF' : '#D1D5DB' }}
                aria-hidden="true"
              >
                {/* Thumb con ícono lápiz */}
                <span
                  className={`
                    absolute top-0.5 flex items-center justify-center
                    w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ease-out
                    ${editing ? 'translate-x-6' : 'translate-x-0.5'}
                  `}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3"
                    style={{ color: editing ? '#A85BFF' : '#9CA3AF' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3.414.586.586-3.414A4 4 0 019 13z"
                    />
                  </svg>
                </span>
              </span>
            </button>
          </div>

          {/* Formulario */}
          <div className="px-6 sm:px-8 py-6">
            <h3 className="text-sm font-bold text-gray-800 mb-5">
              Información Personal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Tipo de documento */}
              <div>
                <label htmlFor="documentType" className={LABEL_CLASS}>
                  Tipo Documento <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <select
                    id="documentType"
                    name="documentType"
                    value={form.documentType}
                    onChange={handleChange}
                    className={INPUT_BASE}
                  >
                    <option value="">Selecciona...</option>
                    {DOCUMENT_TYPES.map((doc) => (
                      <option key={doc.code} value={doc.code}>
                        {doc.displayLabel}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={getDocumentTypeLabel(form.documentType)}
                    className={INPUT_DISABLED}
                  />
                )}
              </div>

              {/* Nº Documento */}
              <div>
                <label htmlFor="identificationNumber" className={LABEL_CLASS}>
                  Nº Documento <span className="text-red-500">*</span>
                </label>
                <input
                  id="identificationNumber"
                  name="identificationNumber"
                  type="text"
                  inputMode={form.documentType && getDocumentValidationRule(form.documentType)?.digitsOnly ? 'numeric' : 'text'}
                  placeholder={form.documentType ? getDocumentValidationRule(form.documentType)?.placeholder ?? 'Ej. 1094560321' : 'Primero seleccione tipo'}
                  value={form.identificationNumber}
                  onChange={handleDocumentNumberChange}
                  readOnly={!editing}
                  disabled={!form.documentType && editing}
                  className={editing ? INPUT_BASE : INPUT_DISABLED}
                  title={!form.documentType && editing ? 'Primero seleccione el tipo de documento' : undefined}
                />
                {editing && !form.documentType && (
                  <p className="mt-1 text-xs text-gray-500">Seleccione primero el tipo de documento</p>
                )}
              </div>

              {/* Nombre completo */}
              <div>
                <label htmlFor="firstName" className={LABEL_CLASS}>
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  readOnly={!editing}
                  className={editing ? INPUT_BASE : INPUT_DISABLED}
                />
              </div>

              {/* Apellidos */}
              <div>
                <label htmlFor="lastName" className={LABEL_CLASS}>
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  readOnly={!editing}
                  className={editing ? INPUT_BASE : INPUT_DISABLED}
                />
              </div>

              {/* Correo electrónico — solo lectura (campo institucional) */}
              <div>
                <label htmlFor="email" className={LABEL_CLASS}>
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  readOnly
                  value={profile?.email ?? ''}
                  className={INPUT_DISABLED}
                  aria-describedby="emailHelper"
                />
                <p
                  id="emailHelper"
                  className="mt-1 text-xs text-gray-400"
                >
                  Campo institucional no editable.
                </p>
              </div>

              {/* Número celular */}
              <div>
                <label htmlFor="phone" className={LABEL_CLASS}>
                  Número Celular
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={handleChange}
                  readOnly={!editing}
                  className={editing ? INPUT_BASE : INPUT_DISABLED}
                />
              </div>

              {/* Fecha de registro — solo lectura */}
              <div>
                <label className={LABEL_CLASS}>
                  Fecha de Registro
                </label>
                <input
                  type="text"
                  readOnly
                  value={profile?.createdAt ? formatDate(profile.createdAt) : '—'}
                  className={INPUT_DISABLED}
                />
              </div>

            </div>

            {/* Error de guardado */}
            {saveError && (
              <div
                className="mt-5 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
                role="alert"
              >
                {saveError}
              </div>
            )}

            {/* Botón guardar — solo visible en modo edición */}
            {editing && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saveStatus === 'loading'}
                  className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
                >
                  {saveStatus === 'loading' ? (
                    <>
                      {/* Spinner SVG */}
                      <svg
                        className="w-4 h-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Guardando…
                    </>
                  ) : (
                    'Guardar cambios'
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Toast de éxito */}
        {saveStatus === 'success' && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold shadow-lg"
            style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534' }}
            role="status"
            aria-live="polite"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Datos actualizados correctamente.
          </div>
        )}

        {/* ── Sección Simulaciones ── */}
        <section
          className="bg-white rounded-2xl border border-gray-200"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">
              Simulaciones (Fecha de Creación)
            </h2>
          </div>

          <div className="px-6 sm:px-8 py-5">
            {simsError ? (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
                role="alert"
              >
                {simsError}
              </div>
            ) : simulations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No tienes simulaciones guardadas aún.
              </p>
            ) : (
              <ul className="space-y-3">
                {simulations.map((sim, idx) => (
                  <li
                    key={sim.id}
                    className="flex items-center gap-4 rounded-xl px-4 py-3.5 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 ease-out group"
                    style={{
                      backgroundColor: '#FAFAFA',
                      animation: `simFadeSlide 0.4s ease-out ${idx * 0.08}s both`,
                    }}
                  >
                    {/* Ícono cuadernillo con acento violeta */}
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: '#F3E8FF' }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        style={{ color: '#A85BFF' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>

                    {/* Fecha */}
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                      {formatDate(sim.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Animación CSS en línea — fade + slide desde abajo */}
            <style>{`
              @keyframes simFadeSlide {
                from {
                  opacity: 0;
                  transform: translateY(12px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        </section>

        {/* Botón cerrar sesión (para mobile — referencia al mockup) */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => { window.scrollTo({ top: 0 }); navigate('/student/main'); }}
            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full font-semibold text-sm text-gray-700 border border-gray-300 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </button>
        </div>

      </main>

      <UpbFooter />
    </div>
  );
}
