import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/shared/services/api';
import LogoUpb from '@/assets/Images/LogoUpb.png';
import { UpbFooter } from '@/shared/components/UpbFooter';

// ── Zod Schema ──────────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ── Clases CSS alineadas con SimulationForm ─────────────────────────────────

const INPUT_BASE =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400';
const LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-1.5';

// ── Component ───────────────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError('');
    setSuccessMsg('');
    const result = await forgotPassword(data.email);
    if (result.error) { setApiError(result.error); return; }
    setSuccessMsg('Si el correo está registrado, revisa la consola del backend para copiar el enlace de recuperación.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      {/* Logo UPB */}
      <div className="px-8 pt-6">
        <img src={LogoUpb} alt="Logo UPB" className="h-12" />
      </div>

      {/* Contenido centrado */}
      <div className="flex-1 flex flex-col items-center px-6 pt-8">
        {/* Título */}
        <h1 className="text-4xl sm:text-5xl font-black italic text-gray-900 mb-10 text-center">
          Restablecer Contraseña
        </h1>

        {/* Subtítulo */}
        <p className="text-sm text-gray-500 mb-10 text-center max-w-lg">
          Digite el correo electrónico al cual quiere recibir el código para restablecer contraseña
        </p>

        {/* Mensajes de error / éxito */}
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

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-8" noValidate>
          <div>
            <label htmlFor="email" className={LABEL_CLASS}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={INPUT_BASE}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Botón Enviar */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
            >
              {isSubmitting ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </form>

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
