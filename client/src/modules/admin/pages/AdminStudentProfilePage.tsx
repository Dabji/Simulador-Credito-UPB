// ============================================================
// Page: AdminStudentProfilePage (HU-82 — Pantalla 2.6)
// Perfil completo del estudiante visto desde el admin.
// Permite ver datos + historial simulaciones + editar campos.
// SOLO accesible por ADMIN (protegido en App.tsx).
// ============================================================

import { useState, useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import { BackNavLink } from '@/shared/components/BackNavLink';
import {
  adminGetUser,
  adminUpdateUser,
  adminGetUserSimulations,
  type AdminUserProfileDTO,
  type AdminUpdateUserPayload,
  type AdminUserSimulationItemDTO,
  type DocumentTypeCodeAPI,
} from '@/shared/services/api';
import { DOCUMENT_TYPES, getDocumentTypeInfo, getDocumentValidationRule } from '@/shared/utils/documentTypes';

/* ── Helpers ─────────────────────────────────────────────── */

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

/* ── Tipos internos ─────────────────────────────────────── */

interface FormState {
  firstName:            string;
  lastName:             string;
  documentType:         DocumentTypeCodeAPI | '';
  identificationNumber: string;
  email:                string;
  phone:                string;
}

// Helper para obtener label de tipo de documento
function getDocumentTypeLabel(code: string | undefined): string {
  if (!code) return '—';
  const info = getDocumentTypeInfo(code);
  return info?.displayLabel ?? code;
}

interface FieldErrors {
  firstName?:            string;
  lastName?:             string;
  documentType?:         string;
  identificationNumber?: string;
  email?:                string;
  phone?:                string;
}

/* ── Validación local ────────────────────────────────────── */

function validate(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (form.firstName.trim().length < 2)   errs.firstName = 'Mínimo 2 caracteres.';
  if (form.firstName.trim().length > 60)  errs.firstName = 'Máximo 60 caracteres.';
  if (form.lastName.trim().length < 2)    errs.lastName  = 'Mínimo 2 caracteres.';
  if (form.lastName.trim().length > 60)   errs.lastName  = 'Máximo 60 caracteres.';
  if (!form.documentType)                 errs.documentType = 'Selecciona un tipo de documento.';
  
  // Validación específica por tipo de documento
  const docRules = form.documentType ? getDocumentValidationRule(form.documentType) : null;
  if (docRules) {
    const idValue = form.identificationNumber.trim();
    const docTypeName = getDocumentTypeInfo(form.documentType)?.name ?? 'documento';
    if (!idValue) {
      errs.identificationNumber = `Ingresa el número de ${docTypeName.toLowerCase()}.`;
    } else if (!docRules.pattern.test(idValue)) {
      errs.identificationNumber = `${docRules.message}. Ejemplo: ${docRules.placeholder}`;
    } else if (idValue.length < docRules.minLength || idValue.length > docRules.maxLength) {
      errs.identificationNumber = `El ${docTypeName.toLowerCase()} debe tener entre ${docRules.minLength} y ${docRules.maxLength} caracteres.`;
    }
  } else if (form.identificationNumber.trim().length < 5) {
    errs.identificationNumber = 'Mínimo 5 caracteres.';
  } else if (form.identificationNumber.trim().length > 20) {
    errs.identificationNumber = 'Máximo 20 caracteres.';
  }
  
  if (!form.email.trim())                 errs.email = 'El correo es obligatorio.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Correo electrónico inválido.';
  if (form.phone && !/^\+?[0-9]{7,15}$/.test(form.phone.trim())) {
    errs.phone = 'Formato inválido (7-15 dígitos, puede iniciar con +).';
  }
  return errs;
}

/* ── Componente Field (módulo-nivel, no dentro de render) ── */

interface FieldProps {
  label: string;
  value: string;
  editable?: boolean;
  editing?: boolean;
  fieldKey?: keyof FormState;
  type?: string;
  formValue?: string;
  error?: string;
  onChange?: (field: keyof FormState, val: string) => void;
  children?: ReactNode;
}

function ProfileField({
  label, value, editable = false, editing = false,
  fieldKey, type = 'text', formValue = '', error, onChange, children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        {label}
        {editable && editing && <span className="text-[#A85BFF] ml-1">*</span>}
      </label>
      {editable && editing && fieldKey && onChange ? (
        <>
          <input
            type={type}
            value={formValue}
            onChange={e => onChange(fieldKey, e.target.value)}
            className={`
              px-3 py-2 rounded-xl border text-sm bg-white text-gray-800
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40 focus:border-[#A85BFF]
              ${error ? 'border-red-400' : 'border-gray-200'}
            `}
          />
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </>
      ) : children ? (
        children
      ) : (
        <p className={`text-sm px-3 py-2 rounded-xl ${editing ? 'bg-gray-50 text-gray-400 border border-dashed border-gray-200' : 'text-gray-800'}`}>
          {value || '—'}
        </p>
      )}
    </div>
  );
}

/* ── Componente principal ───────────────────────────────── */

export function AdminStudentProfilePage() {
  const { id }    = useParams<{ id: string }>();
  const [profileOpen, setProfileOpen] = useState(false);

  /* Datos del perfil */
  const [profile,      setProfile]      = useState<AdminUserProfileDTO | null>(null);
  const [simulations,  setSimulations]  = useState<AdminUserSimulationItemDTO[]>([]);
  const [loadingPage,  setLoadingPage]  = useState(true);
  const [pageError,    setPageError]    = useState<string | null>(null);

  /* Modo edición */
  const [editing,      setEditing]      = useState(false);
  const [form,         setForm]         = useState<FormState>({
    firstName: '', lastName: '', documentType: '', identificationNumber: '', email: '', phone: '',
  });
  const [fieldErrors,  setFieldErrors]  = useState<FieldErrors>({});
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  /* ── Carga inicial ─────────────────────────────────────── */
  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoadingPage(true);
      setPageError(null);

      const [profileRes, simsRes] = await Promise.all([
        adminGetUser(id),
        adminGetUserSimulations(id),
      ]);

      setLoadingPage(false);

      if (profileRes.error) {
        setPageError(profileRes.error);
        return;
      }

      const p = profileRes.data?.data;
      if (p) {
        setProfile(p);
        setForm({
          firstName:            p.firstName,
          lastName:             p.lastName,
          documentType:         p.documentType ?? '',
          identificationNumber: p.identificationNumber,
          email:                p.email,
          phone:                p.phone ?? '',
        });
      }

      if (!simsRes.error && simsRes.data?.data) {
        setSimulations(simsRes.data.data);
      }
    })();
  }, [id]);

  /* ── Handlers ──────────────────────────────────────────── */

  function handleEdit() {
    setEditing(true);
    setSaveMsg(null);
    setFieldErrors({});
  }

  function handleCancel() {
    if (!profile) return;
    setForm({
      firstName:            profile.firstName,
      lastName:             profile.lastName,
      documentType:         profile.documentType ?? '',
      identificationNumber: profile.identificationNumber,
      email:                profile.email,
      phone:                profile.phone ?? '',
    });
    setFieldErrors({});
    setSaveMsg(null);
    setEditing(false);
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  }

  // Handler especial para número de documento con sanitización
  function handleIdentificationChange(value: string) {
    const docRules = form.documentType ? getDocumentValidationRule(form.documentType) : null;
    let sanitized = value;
    
    if (docRules) {
      if (docRules.pattern.source === '^[0-9]+$') {
        // Solo números (CC, CE, TI, RC)
        sanitized = value.replace(/[^0-9]/g, '');
      } else {
        // Alfanumérico (PA, DE, PT, PE, VI) - convertir a mayúsculas
        sanitized = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      }
    }
    
    setForm(prev => ({ ...prev, identificationNumber: sanitized }));
    setFieldErrors(prev => ({ ...prev, identificationNumber: undefined }));
  }

  async function handleSave() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    if (!id) return;
    setSaving(true);
    setSaveMsg(null);

    const payload: AdminUpdateUserPayload = {
      firstName:            form.firstName.trim()            || undefined,
      lastName:             form.lastName.trim()             || undefined,
      documentType:         form.documentType || undefined,
      identificationNumber: form.identificationNumber.trim() || undefined,
      email:                form.email.trim()                || undefined,
      phone:                form.phone.trim()                || undefined,
    };

    const res = await adminUpdateUser(id, payload);
    setSaving(false);

    if (res.error) {
      setSaveMsg({ type: 'err', text: res.error });
      return;
    }

    const updated = res.data?.data;
    if (updated) {
      setProfile(updated);
      setForm({
        firstName:            updated.firstName,
        lastName:             updated.lastName,
        documentType:         updated.documentType ?? '',
        identificationNumber: updated.identificationNumber,
        email:                updated.email,
        phone:                updated.phone ?? '',
      });
    }

    setSaveMsg({ type: 'ok', text: '¡Cambios guardados correctamente!' });
    setEditing(false);

    // Auto-ocultar mensaje de éxito
    setTimeout(() => setSaveMsg(null), 4000);
  }

  /* ── Render ─────────────────────────────────────────────── */

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

      <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-10 py-10">

        {/* Breadcrumb */}
        <BackNavLink to="/admin/students" label="Gestión de Estudiantes" breadcrumb="Perfil del Estudiante" />

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-8">
          Perfil del Estudiante
        </h1>

        {/* ── Estado de carga / error ── */}
        {loadingPage && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#A85BFF]/30 border-t-[#A85BFF] rounded-full animate-spin" />
          </div>
        )}

        {!loadingPage && pageError && (
          <div className="rounded-2xl px-5 py-4 mb-6 border border-red-200 bg-red-50">
            <p className="text-sm text-red-700 font-medium">{pageError}</p>
          </div>
        )}

        {/* ── Toast feedback ── */}
        {saveMsg && (
          <div
            className={`
              rounded-2xl px-5 py-3 mb-6 text-sm font-semibold border
              transition-all duration-300
              ${saveMsg.type === 'ok'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'}
            `}
          >
            {saveMsg.text}
          </div>
        )}

        {!loadingPage && !pageError && profile && (
          <div className="space-y-6">

            {/* ── Card: Información del Estudiante ── */}
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header card */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
                style={{ backgroundColor: '#F5F3FF' }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar inicial */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: '#6E11B0' }}
                  >
                    {profile.firstName.charAt(0).toUpperCase()}{profile.lastName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800 text-sm">Información del Estudiante</h2>
                    <p className="text-xs text-gray-500">{profile.email}</p>
                  </div>
                </div>

                {/* Badge estado */}
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: profile.isActive ? '#DCFCE7' : '#FEE2E2',
                    color: profile.isActive ? '#166534' : '#991B1B',
                  }}
                >
                  {profile.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Campos */}
              <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Tipo de Documento — select especial */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Tipo de Documento
                    {editing && <span className="text-[#A85BFF] ml-1">*</span>}
                  </label>
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <select
                        value={form.documentType}
                        onChange={e => handleChange('documentType', e.target.value)}
                        className={`
                          px-3 py-2 rounded-xl border text-sm bg-white text-gray-800
                          transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40 focus:border-[#A85BFF]
                          ${fieldErrors.documentType ? 'border-red-400' : 'border-gray-200'}
                        `}
                      >
                        <option value="">Seleccionar…</option>
                        {DOCUMENT_TYPES.map(dt => (
                          <option key={dt.code} value={dt.code}>{dt.displayLabel}</option>
                        ))}
                      </select>
                      {fieldErrors.documentType && (
                        <p className="text-xs text-red-500 mt-0.5">{fieldErrors.documentType}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm px-3 py-2 rounded-xl text-gray-800">
                      {getDocumentTypeLabel(profile.documentType)}
                    </p>
                  )}
                </div>

                <ProfileField
                  label="N° Documento"
                  value={profile.identificationNumber}
                  editable editing={editing}
                  fieldKey="identificationNumber"
                  formValue={form.identificationNumber}
                  error={fieldErrors.identificationNumber}
                  onChange={(field, value) => handleIdentificationChange(value)}
                />

                <ProfileField
                  label="Nombre"
                  value={profile.firstName}
                  editable editing={editing}
                  fieldKey="firstName"
                  formValue={form.firstName}
                  error={fieldErrors.firstName}
                  onChange={handleChange}
                />

                <ProfileField
                  label="Apellido"
                  value={profile.lastName}
                  editable editing={editing}
                  fieldKey="lastName"
                  formValue={form.lastName}
                  error={fieldErrors.lastName}
                  onChange={handleChange}
                />

                <ProfileField
                  label="Correo Electrónico"
                  value={profile.email}
                  editable editing={editing}
                  fieldKey="email"
                  type="email"
                  formValue={form.email}
                  error={fieldErrors.email}
                  onChange={handleChange}
                />

                <ProfileField
                  label="Número Celular"
                  value={profile.phone ?? ''}
                  editable editing={editing}
                  fieldKey="phone"
                  type="tel"
                  formValue={form.phone}
                  error={fieldErrors.phone}
                  onChange={handleChange}
                />

                {/* Fecha registro — solo lectura */}
                <ProfileField label="Fecha de Registro" value={formatDate(profile.createdAt)} />

              </div>

              {/* Botones de acción */}
              <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
                {!editing ? (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="
                      inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white
                      transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                      focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40
                    "
                    style={{ backgroundColor: '#6E11B0', boxShadow: '0 4px 14px rgba(110,17,176,0.25)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Editar Información del Estudiante
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="
                        inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white
                        transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                        focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40
                        disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
                      "
                      style={{ backgroundColor: '#16a34a', boxShadow: '0 4px 14px rgba(22,163,74,0.25)' }}
                    >
                      {saving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Guardando…
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar Cambios
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="
                        px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100
                        hover:bg-gray-200 transition-colors duration-150
                        focus:outline-none focus:ring-2 focus:ring-gray-300
                        disabled:opacity-60 disabled:cursor-not-allowed
                      "
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── Card: Simulaciones ── */}
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-100 flex items-center gap-2"
                style={{ backgroundColor: '#F5F3FF' }}
              >
                <svg className="w-4 h-4 text-[#6b21a8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="font-bold text-gray-800 text-sm">
                  Simulaciones ({simulations.length})
                </h2>
              </div>

              <div className="px-6 py-5">
                {simulations.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    Este estudiante no tiene simulaciones guardadas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {simulations.map((sim, i) => (
                      <div
                        key={sim.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm border border-gray-100 bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: '#A85BFF' }}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-700">Período: {sim.academicPeriod || '—'}</p>
                            <p className="text-xs text-gray-400">{formatDate(sim.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="text-xs text-gray-400">Cuotas</p>
                            <p className="font-semibold text-gray-700">{sim.numberOfPayments}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Total a pagar</p>
                            <p className="font-semibold" style={{ color: '#6b21a8' }}>
                              {formatCOP(sim.totalPaid)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
      <UpbFooter />
    </div>
  );
}
