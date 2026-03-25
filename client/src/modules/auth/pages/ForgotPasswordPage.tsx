import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, CreditCard, ArrowLeft, Send, Search } from 'lucide-react';
import { forgotPassword, forgotPasswordById, getRecoveryHint } from '@/shared/services/api';
import LogoUpb from '@/assets/images/logo-upb.png';
import { UpbFooter } from '@/shared/components/UpbFooter';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
});

const idSchema = z.object({
  identificationNumber: z
    .string()
    .min(5, 'Debe tener al menos 5 dígitos')
    .max(20, 'No puede exceder 20 dígitos')
    .regex(/^\d+$/, 'Solo se permiten dígitos'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type IdFormData    = z.infer<typeof idSchema>;

// ── Tipos de paso ─────────────────────────────────────────────────────────────

type Step = 'selector' | 'email' | 'id-lookup' | 'id-confirm';

// ── Clases CSS ───────────────────────────────────────────────────────────────

const INPUT_BASE =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400';
const LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-1.5';
const BTN_PRIMARY =
  'px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed';
const BTN_SECONDARY =
  'flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors';

// ── Component ───────────────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [step, setStep]             = useState<Step>('selector');
  const [apiError, setApiError]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resolvedId, setResolvedId]   = useState('');
  const [isSending, setIsSending]     = useState(false);

  // ── Formulario correo ────────────────────────────────────────────────────
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  // ── Formulario cédula ────────────────────────────────────────────────────
  const idForm = useForm<IdFormData>({
    resolver: zodResolver(idSchema),
    defaultValues: { identificationNumber: '' },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectMethod = (method: 'email' | 'id-lookup') => {
    setApiError('');
    setSuccessMsg('');
    setStep(method);
  };

  const handleBack = () => {
    setApiError('');
    setSuccessMsg('');
    setMaskedEmail('');
    setResolvedId('');
    emailForm.reset();
    idForm.reset();
    setStep('selector');
  };

  const onSubmitEmail = async (data: EmailFormData) => {
    setApiError('');
    setSuccessMsg('');
    const result = await forgotPassword(data.email);
    if (result.error) { setApiError(result.error); return; }
    setSuccessMsg('Si el correo está registrado, recibirás un enlace de recuperación en tu bandeja de entrada.');
  };

  const onLookupId = async (data: IdFormData) => {
    setApiError('');
    const result = await getRecoveryHint(data.identificationNumber);
    if (result.error) {
      setApiError(
        result.error.includes('404') || result.error.toLowerCase().includes('no encontrado')
          ? 'No encontramos una cuenta asociada a ese número de identificación.'
          : result.error,
      );
      return;
    }
    if (result.data) {
      setMaskedEmail(result.data.maskedEmail);
      setResolvedId(data.identificationNumber);
      setStep('id-confirm');
    }
  };

  const onConfirmAndSend = async () => {
    setApiError('');
    setSuccessMsg('');
    setIsSending(true);
    try {
      const result = await forgotPasswordById(resolvedId);
      if (result.error) {
        setApiError(result.error);
        return;
      }
      setSuccessMsg('El enlace de recuperación ha sido enviado al correo asociado a tu identificación.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderFeedback = () => (
    <>
      {apiError && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-sm font-medium w-full max-w-md"
          style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
          role="alert"
        >
          {apiError}
        </div>
      )}
      {successMsg && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-sm font-medium w-full max-w-md"
          style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}
          role="status"
        >
          {successMsg}
        </div>
      )}
    </>
  );

  const renderBackButton = (label = 'Elegir otro método') => (
    <button type="button" onClick={handleBack} className={BTN_SECONDARY}>
      <ArrowLeft size={16} />
      {label}
    </button>
  );

  // ── Paso 0: Selector ──────────────────────────────────────────────────────

  const renderSelector = () => (
    <div className="w-full max-w-md transition-all duration-300">
      <p className="text-sm text-gray-500 mb-8 text-center">
        Selecciona cómo quieres recuperar el acceso a tu cuenta.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Opción: Correo */}
        <button
          type="button"
          onClick={() => handleSelectMethod('email')}
          className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-md transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200"
            style={{ backgroundColor: '#F3E8FF' }}
          >
            <Mail size={24} style={{ color: '#A85BFF' }} />
          </span>
          <span className="font-bold text-gray-800 text-sm leading-tight">
            Recuperar con Correo
          </span>
          <span className="text-xs text-gray-400 leading-snug">
            Recibe el enlace directamente en tu bandeja de entrada
          </span>
        </button>

        {/* Opción: Cédula */}
        <button
          type="button"
          onClick={() => handleSelectMethod('id-lookup')}
          className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-md transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200"
            style={{ backgroundColor: '#F3E8FF' }}
          >
            <CreditCard size={24} style={{ color: '#A85BFF' }} />
          </span>
          <span className="font-bold text-gray-800 text-sm leading-tight">
            Recuperar con Cédula
          </span>
          <span className="text-xs text-gray-400 leading-snug">
            Usa tu número de identificación para encontrar tu cuenta
          </span>
        </button>
      </div>
    </div>
  );

  // ── Paso 1a: Flujo correo ─────────────────────────────────────────────────

  const renderEmailFlow = () => (
    <div className="w-full max-w-md transition-all duration-300">
      <p className="text-sm text-gray-500 mb-8 text-center">
        Ingresa el correo electrónico al cual quieres recibir el enlace de recuperación.
      </p>
      {renderFeedback()}
      {!successMsg && (
        <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-6" noValidate>
          <div>
            <label htmlFor="email" className={LABEL_CLASS}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              {...emailForm.register('email')}
              className={INPUT_BASE}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
            {emailForm.formState.errors.email && (
              <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={emailForm.formState.isSubmitting}
              className={BTN_PRIMARY}
              style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
            >
              <span className="flex items-center gap-2">
                <Send size={15} />
                {emailForm.formState.isSubmitting ? 'Enviando…' : 'Enviar enlace'}
              </span>
            </button>
            {renderBackButton()}
          </div>
        </form>
      )}
      {successMsg && (
        <div className="flex flex-col items-center gap-4 mt-4">
          {renderBackButton('Volver al inicio')}
        </div>
      )}
    </div>
  );

  // ── Paso 1b: Flujo cédula — búsqueda ─────────────────────────────────────

  const renderIdLookup = () => (
    <div className="w-full max-w-md transition-all duration-300">
      <p className="text-sm text-gray-500 mb-8 text-center">
        Ingresa tu número de cédula o documento de identidad para encontrar tu cuenta.
      </p>
      {renderFeedback()}
      <form onSubmit={idForm.handleSubmit(onLookupId)} className="space-y-6" noValidate>
        <div>
          <label htmlFor="identificationNumber" className={LABEL_CLASS}>
            Número de identificación
          </label>
          <input
            id="identificationNumber"
            type="text"
            inputMode="numeric"
            {...idForm.register('identificationNumber')}
            className={INPUT_BASE}
            placeholder="Ej: 1234567890"
            autoComplete="off"
          />
          {idForm.formState.errors.identificationNumber && (
            <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>
              {idForm.formState.errors.identificationNumber.message}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-4">
          <button
            type="submit"
            disabled={idForm.formState.isSubmitting}
            className={BTN_PRIMARY}
            style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
          >
            <span className="flex items-center gap-2">
              <Search size={15} />
              {idForm.formState.isSubmitting ? 'Buscando…' : 'Buscar cuenta'}
            </span>
          </button>
          {renderBackButton()}
        </div>
      </form>
    </div>
  );

  // ── Paso 1b: Flujo cédula — confirmación ─────────────────────────────────

  const renderIdConfirm = () => (
    <div className="w-full max-w-md transition-all duration-300">
      {renderFeedback()}
      {!successMsg && (
        <>
          <div
            className="rounded-2xl p-5 mb-6 text-center"
            style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF' }}
          >
            <p className="text-sm text-gray-600 mb-3">
              Encontramos una cuenta asociada a tu número de identificación.
            </p>
            <p className="text-sm text-gray-500 mb-1">¿Es este tu correo?</p>
            <p
              className="text-lg font-bold tracking-wide"
              style={{ color: '#7C3AED' }}
            >
              {maskedEmail}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              El enlace de recuperación se enviará a este correo.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={onConfirmAndSend}
              disabled={isSending}
              className={BTN_PRIMARY}
              style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
            >
              <span className="flex items-center gap-2">
                <Send size={15} />
                {isSending ? 'Enviando…' : 'Confirmar y enviar enlace'}
              </span>
            </button>
            {renderBackButton()}
          </div>
        </>
      )}
      {successMsg && (
        <div className="flex flex-col items-center gap-4 mt-4">
          {renderBackButton('Volver al inicio')}
        </div>
      )}
    </div>
  );

  // ── Títulos por paso ──────────────────────────────────────────────────────

  const stepTitles: Record<Step, string> = {
    'selector':   'Restablecer Contraseña',
    'email':      'Recuperar con Correo',
    'id-lookup':  'Recuperar con Cédula',
    'id-confirm': 'Confirmar Correo',
  };

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      {/* Logo UPB */}
      <div className="px-8 pt-6">
        <img src={LogoUpb} alt="Logo UPB" className="h-12" />
      </div>

      {/* Contenido centrado */}
      <div className="flex-1 flex flex-col items-center px-6 pt-8">
        {/* Título */}
        <h1 className="text-4xl sm:text-5xl font-black italic text-gray-900 mb-10 text-center transition-all duration-300">
          {stepTitles[step]}
        </h1>

        {/* Contenido del paso actual */}
        {step === 'selector'   && renderSelector()}
        {step === 'email'      && renderEmailFlow()}
        {step === 'id-lookup'  && renderIdLookup()}
        {step === 'id-confirm' && renderIdConfirm()}

        {/* Links inferiores */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-sm text-gray-700">
            Ir a{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-semibold">
              Iniciar Sesión
            </Link>
          </p>

          <p className="text-sm text-gray-600">
            ¿Aún no estás registrado?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-semibold">
              Regístrate Ahora
            </Link>
          </p>
        </div>
      </div>

      {/* ── Footer institucional ── */}
      <UpbFooter className="mt-0" />
    </div>
  );
}
