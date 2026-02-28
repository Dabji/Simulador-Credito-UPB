import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import LogoUpb from '@/assets/Images/LogoUpb.png';

// ── Zod Schema ──────────────────────────────────────────────────────────────

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(7, 'La contraseña debe tener al menos 7 caracteres')
      .max(11, 'La contraseña debe tener máximo 11 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        'La contraseña debe contener al menos 1 mayúscula, 1 minúscula y 1 número',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ── Clases CSS alineadas con SimulationForm ─────────────────────────────────

const INPUT_BASE =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400';
const LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-1.5';

// ── Component ───────────────────────────────────────────────────────────────

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (_data: ResetPasswordFormData) => {
    // Simula carga de 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));
    navigate('/password-updated');
  };

  /* Ícono de ojito (mostrar/ocultar contraseña) */
  const EyeIcon = ({ visible, onClick }: { visible: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
      tabIndex={-1}
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    >
      {visible ? (
        /* Eye-off icon */
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      ) : (
        /* Eye icon */
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

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
          Crear Nueva Contraseña
        </h1>

        {/* Formulario + Recuadro de reglas */}
        <div className="w-full max-w-3xl flex flex-col lg:flex-row gap-8 items-start">
          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 w-full space-y-5" noValidate>
            {/* Nueva Contraseña */}
            <div>
              <label htmlFor="password" className={LABEL_CLASS}>
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={INPUT_BASE}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <EyeIcon visible={showPassword} onClick={() => setShowPassword((v) => !v)} />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className={LABEL_CLASS}>
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={INPUT_BASE}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <EyeIcon visible={showConfirm} onClick={() => setShowConfirm((v) => !v)} />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Botón Crear Contraseña */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
              >
                {isSubmitting ? 'Creando…' : 'Crear Contraseña'}
              </button>
            </div>

            {/* Links inferiores */}
            <div className="text-center space-y-4 pt-2">
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
          </form>

          {/* Recuadro de reglas de contraseña */}
          <div
            className="w-full lg:w-72 rounded-xl px-5 py-4 text-sm flex-shrink-0"
            style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFE0B2', color: '#5D4037' }}
          >
            <p className="font-semibold mb-2">Tenga en cuenta que:</p>
            <ul className="list-disc list-inside space-y-1 text-xs leading-relaxed">
              <li>La contraseña debe ser mayor a 6 caracteres y menor a 12 caracteres.</li>
              <li>La contraseña debe contener 1 letra mayúscula.</li>
              <li>La contraseña debe tener 1 letra minúscula.</li>
              <li>La contraseña debe tener 1 número.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
