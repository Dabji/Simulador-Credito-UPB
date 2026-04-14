import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '@/shared/services/api';
import { UpbFooter } from '@/shared/components/UpbFooter';
import LogoUpb from '@/assets/images/logo-upb.png';
import LogoUpbColor from '@/assets/images/logo-upb-color.png';
import fondoRegister from '@/assets/images/register-bg.png';
import {
  DOCUMENT_TYPES,
  DOCUMENT_VALIDATION_RULES,
  type DocumentTypeCode,
  isValidDocumentType,
  getDocumentValidationRule,
} from '@/shared/utils/documentTypes';
import type { DocumentTypeCodeAPI } from '@/shared/services/api';

// ── Constantes de validación ────────────────────────────────────────────────

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
const DIGITS_ONLY = /^\d+$/;

/** Extrae los códigos de documento para el enum de Zod */
const DOCUMENT_CODES = DOCUMENT_TYPES.map((d) => d.code) as [string, ...string[]];

// ── Zod Schema (HU-02 — mirror del backend) ────────────────────────────────

const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .regex(NAME_REGEX, 'El nombre solo puede contener letras, espacios, guiones y apóstrofes'),
    lastName: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'El apellido no puede exceder 50 caracteres')
      .regex(NAME_REGEX, 'El apellido solo puede contener letras, espacios, guiones y apóstrofes'),
    documentType: z.enum(DOCUMENT_CODES, { message: 'Seleccione el tipo de documento' }),
    documentNumber: z
      .string()
      .trim()
      .min(5, 'El documento debe tener al menos 5 caracteres')
      .max(20, 'El documento no puede exceder 20 caracteres'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('El correo electrónico no es válido')
      .max(255, 'El correo electrónico no puede exceder 255 caracteres'),
    phone: z
      .string()
      .trim()
      .regex(DIGITS_ONLY, 'El teléfono solo puede contener dígitos')
      .min(7, 'El teléfono debe tener al menos 7 dígitos')
      .max(15, 'El teléfono no puede exceder 15 dígitos'),
    password: z
      .string()
      .min(7, 'La contraseña debe tener al menos 7 caracteres')
      .max(11, 'La contraseña debe tener máximo 11 caracteres')
      .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
      .regex(/\d/, 'La contraseña debe contener al menos un número'),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, { message: 'Debe aceptar los términos y condiciones' }),
})
  // Validación de contraseñas coincidentes
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  // Validación cruzada: documentNumber según documentType (issue #187)
  .refine(
    (data) => {
      if (!data.documentType || !isValidDocumentType(data.documentType)) return false;
      const rule = DOCUMENT_VALIDATION_RULES[data.documentType as DocumentTypeCode];
      if (!rule) return false;
      return rule.pattern.test(data.documentNumber);
    },
    {
      message: 'El formato del documento no es válido para el tipo seleccionado',
      path: ['documentNumber'],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

// ── Reglas de contraseña para el indicador en tiempo real ────────────────────

const PASSWORD_RULES = [
  { label: 'Entre 7 y 11 caracteres', test: (v: string) => v.length >= 7 && v.length <= 11 },
  { label: 'Al menos una letra mayúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Al menos una letra minúscula', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Al menos un número', test: (v: string) => /\d/.test(v) },
] as const;

// ── Clases CSS alineadas con SimulationForm ─────────────────────────────────

const INPUT_BASE =
  'w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400';
const INPUT_DEFAULT = `${INPUT_BASE} border-gray-200`;
const INPUT_ERROR = `${INPUT_BASE} border-red-400 focus:ring-red-400 focus:border-red-400`;
const LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-1.5';
const FIELD_ERROR_CLASS = 'mt-1 text-xs font-medium';

// ── Componente de indicador de fuerza de contraseña ─────────────────────────

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) {
    return (
      <div
        className="rounded-xl px-4 py-3 text-sm"
        style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D4FF', color: '#6E11B0' }}
      >
        <p className="font-semibold mb-1">Requisitos de la contraseña:</p>
        <ul className="list-inside space-y-0.5 text-xs">
          {PASSWORD_RULES.map((rule) => (
            <li key={rule.label} className="flex items-center gap-1.5 text-gray-500">
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 text-[10px]">○</span>
              {rule.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const results = PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) }));
  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === results.length;

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        backgroundColor: allPassed ? '#F0FDF4' : '#FAF5FF',
        border: `1px solid ${allPassed ? '#BBF7D0' : '#E9D4FF'}`,
        color: allPassed ? '#166534' : '#6E11B0',
      }}
    >
      <p className="font-semibold mb-1">
        {allPassed ? '✓ Contraseña válida' : 'Requisitos de la contraseña:'}
      </p>
      <ul className="list-inside space-y-0.5 text-xs">
        {results.map((rule) => (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 ${rule.passed ? 'text-green-600' : 'text-red-500'}`}
          >
            <span
              className={`w-4 h-4 flex items-center justify-center rounded-full text-white text-[10px] ${
                rule.passed ? 'bg-green-500' : 'bg-red-400'
              }`}
            >
              {rule.passed ? '✓' : '✗'}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
      {/* Barra de progreso visual */}
      <div className="mt-2 flex gap-1">
        {results.map((rule, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              rule.passed ? 'bg-green-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [backendFieldErrors, setBackendFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [logoHover, setLogoHover] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      documentType: undefined,
      documentNumber: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      termsAccepted: undefined as unknown as true,
    },
  });

  const passwordValue = watch('password', '');
  const documentTypeValue = watch('documentType');
  const docValidationRule = documentTypeValue ? getDocumentValidationRule(documentTypeValue) : null;

  // Limpia el error de backend de un campo cuando el usuario lo modifica (Copilot review #6)
  const clearBackendError = (field: keyof RegisterFormData) => {
    if (backendFieldErrors[field]) {
      setBackendFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Wrapper de register() que inyecta clearBackendError en onChange
  const reg = (field: keyof RegisterFormData) => {
    const { onChange, ...rest } = register(field);
    return {
      ...rest,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        clearBackendError(field);
        return onChange(e);
      },
    };
  };

  // Helper: obtener clase CSS del input según si tiene error
  const inputClass = (field: keyof RegisterFormData) =>
    errors[field] || backendFieldErrors[field] ? INPUT_ERROR : INPUT_DEFAULT;

  // Helper: obtener mensaje de error (frontend o backend)
  const fieldError = (field: keyof RegisterFormData): string | undefined =>
    errors[field]?.message || backendFieldErrors[field]?.[0];

  const onSubmit = async (data: RegisterFormData) => {
    setApiError('');
    setBackendFieldErrors({});
    const { confirmPassword: _, ...payload } = data;
    void _;
    // Cast del tipo de documento para cumplir con el tipo API (issue #187)
    const apiPayload = {
      ...payload,
      documentType: payload.documentType as DocumentTypeCodeAPI,
    };
    const result = await registerUser(apiPayload);
    if (result.error) {
      // Si el backend retorna errores por campo (HU-02), mostrarlos
      if (result.fieldErrors) {
        setBackendFieldErrors(result.fieldErrors);
      }
      setApiError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      {/* ── Main: formulario + imagen ── */}
      <main className="flex-grow flex flex-col lg:flex-row">
        {/* Columna izquierda — Formulario */}
        <div className="w-full lg:w-1/2 bg-white px-6 pt-8 pb-4 lg:pt-10 lg:pb-0 sm:px-12 lg:px-16 xl:px-24">
          {/* Logo UPB — interactivo con animación de crossfade, navega a Login */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
            className="relative h-12 w-[120px] flex-shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/40 focus:ring-offset-2 overflow-hidden mb-6"
            aria-label="Ir al inicio de sesión"
          >
            {/* Logo gris — posición normal, al hover baja y desaparece */}
            <img
              src={LogoUpb}
              alt="Logo Universidad Pontificia Bolivariana"
              className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-in-out"
              style={{ transform: logoHover ? 'translateY(100%)' : 'translateY(0)' }}
            />
            {/* Logo a color — arriba oculto, al hover baja a su posición */}
            <img
              src={LogoUpbColor}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-in-out"
              style={{ transform: logoHover ? 'translateY(0) scale(1.35)' : 'translateY(-100%) scale(1.35)' }}
            />
          </button>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">
            Registrarse
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Crea tu cuenta de forma rápida y sencilla
          </p>

          {apiError && (
            <div
              className="rounded-xl px-4 py-3 mb-4 text-sm font-medium"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
              role="alert"
            >
              {apiError}
            </div>
          )}

          {success && (
            <div
              className="rounded-xl px-4 py-3 mb-4 text-sm font-medium"
              style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}
              role="status"
            >
              Usuario registrado exitosamente. Redirigiendo al inicio de sesión…
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Nombre */}
            <div>
              <label htmlFor="firstName" className={LABEL_CLASS}>Nombre</label>
              <input id="firstName" type="text" {...reg('firstName')} className={inputClass('firstName')} placeholder="Ingrese su nombre" maxLength={50} />
              {fieldError('firstName') && <p className={FIELD_ERROR_CLASS} style={{ color: '#B91C1C' }}>{fieldError('firstName')}</p>}
            </div>

            {/* Apellido */}
            <div>
              <label htmlFor="lastName" className={LABEL_CLASS}>Apellido</label>
              <input id="lastName" type="text" {...reg('lastName')} className={inputClass('lastName')} placeholder="Ingrese su apellido" maxLength={50} />
              {fieldError('lastName') && <p className={FIELD_ERROR_CLASS} style={{ color: '#B91C1C' }}>{fieldError('lastName')}</p>}
            </div>

            {/* Tipo de Identificación — Catálogo completo de 9 tipos (issue #187) */}
            <div>
              <label htmlFor="documentType" className={LABEL_CLASS}>Tipo de Identificación</label>
              <select
                id="documentType"
                {...reg('documentType')}
                className={inputClass('documentType')}
                defaultValue=""
                onChange={(e) => {
                  clearBackendError('documentType');
                  clearBackendError('documentNumber');
                  // Limpiar documentNumber cuando cambia el tipo para evitar inconsistencias
                  setValue('documentNumber', '');
                  register('documentType').onChange(e);
                }}
              >
                <option value="" disabled>Seleccione tipo de documento</option>
                {DOCUMENT_TYPES.map((doc) => (
                  <option key={doc.code} value={doc.code}>
                    {doc.displayLabel}
                  </option>
                ))}
              </select>
              {fieldError('documentType') && <p className={FIELD_ERROR_CLASS} style={{ color: '#B91C1C' }}>{fieldError('documentType')}</p>}
            </div>

            {/* Número de Identificación — Validación dinámica según tipo (issue #187) */}
            <div>
              <label htmlFor="documentNumber" className={LABEL_CLASS}>Número de Identificación</label>
              <input
                id="documentNumber"
                type="text"
                {...reg('documentNumber')}
                className={inputClass('documentNumber')}
                placeholder={docValidationRule?.placeholder ?? 'Ingrese su número de documento'}
                maxLength={20}
                inputMode={docValidationRule?.digitsOnly ? 'numeric' : 'text'}
                disabled={!documentTypeValue}
                title={!documentTypeValue ? 'Primero seleccione el tipo de documento' : undefined}
                onInput={(e) => {
                  if (documentTypeValue) {
                    const rule = getDocumentValidationRule(documentTypeValue);
                    if (rule) {
                      let value = e.currentTarget.value;
                      if (rule.digitsOnly) {
                        value = value.replace(/\D/g, '');
                      } else if (rule.alphanumeric) {
                        value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                      }
                      e.currentTarget.value = value;
                    }
                  }
                }}
              />
              {fieldError('documentNumber') && <p className={FIELD_ERROR_CLASS} style={{ color: '#B91C1C' }}>{fieldError('documentNumber')}</p>}
              {!documentTypeValue && (
                <p className="mt-1 text-xs text-gray-500">Primero seleccione el tipo de documento</p>
              )}
            </div>

            {/* Correo electrónico */}
            <div>
              <label htmlFor="email" className={LABEL_CLASS}>Correo electrónico</label>
              <input id="email" type="email" {...reg('email')} className={inputClass('email')} placeholder="correo@ejemplo.com" maxLength={255} />
              {fieldError('email') && <p className={FIELD_ERROR_CLASS} style={{ color: '#B91C1C' }}>{fieldError('email')}</p>}
            </div>

            {/* Número de celular */}
            <div>
              <label htmlFor="phone" className={LABEL_CLASS}>Número de celular</label>
              <input id="phone" type="tel" {...reg('phone')} className={inputClass('phone')} placeholder="Ingrese su número de celular" maxLength={15} inputMode="numeric" />
              {fieldError('phone') && <p className={FIELD_ERROR_CLASS} style={{ color: '#B91C1C' }}>{fieldError('phone')}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className={LABEL_CLASS}>Contraseña</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} {...reg('password')} className={inputClass('password')} placeholder="••••••••" autoComplete="new-password" maxLength={11} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword}>
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {fieldError('password') && <p className={FIELD_ERROR_CLASS} style={{ color: '#B91C1C' }}>{fieldError('password')}</p>}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className={LABEL_CLASS}>Confirmar contraseña</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} {...reg('confirmPassword')} className={inputClass('confirmPassword')} placeholder="••••••••" autoComplete="new-password" maxLength={11} />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showConfirm}>
                  {showConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {fieldError('confirmPassword') && <p className={FIELD_ERROR_CLASS} style={{ color: '#B91C1C' }}>{fieldError('confirmPassword')}</p>}
            </div>

            {/* Indicador de fuerza de contraseña en tiempo real (HU-02) */}
            <PasswordStrengthIndicator password={passwordValue} />

            {/* Términos y condiciones */}
            <div className="flex items-start gap-2">
              <input
                id="termsAccepted"
                type="checkbox"
                {...reg('termsAccepted')}
                className="mt-1 h-4 w-4 rounded border-gray-300 accent-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                Aceptar términos y condiciones de uso del simulador
              </label>
            </div>
            {errors.termsAccepted && (
              <p className={`${FIELD_ERROR_CLASS} -mt-2`} style={{ color: '#B91C1C' }}>{errors.termsAccepted.message}</p>
            )}

            {/* Link a términos — Abre la vista de términos y condiciones (issue #187) */}
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
              <Link 
                to="/terms" 
                target="_blank" 
                rel="noopener noreferrer" 
                state={{ from: 'register' }}
                className="underline hover:text-purple-600"
              >
                Leer términos y condiciones
              </Link>
            </p>

            {/* Botón Registrarse — mismo estilo que SimulationForm */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
              >
                {isSubmitting ? 'Registrando…' : 'Registrarse'}
              </button>
            </div>
          </form>

          {/* Link a login */}
          <p className="text-sm text-gray-600 mt-6 mb-0">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-semibold">
              Iniciar Sesión
            </Link>
          </p>
        </div>

        {/* Columna derecha — Imagen del campus (solo desktop) */}
        <div className="hidden lg:block lg:w-1/2 relative min-h-[400px]">
          <img
            src={fondoRegister}
            alt="Campus UPB"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </main>

      {/* ── Footer institucional (pegado al fondo) ── */}
      <UpbFooter className="mt-0" />
    </div>
  );
}
