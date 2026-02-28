import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '@/shared/services/api';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';

// ── Zod Schema ──────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    documentType: z.enum(['CC', 'TI'], { message: 'Seleccione el tipo de documento' }),
    documentNumber: z.string().min(5, 'El número de documento debe tener al menos 5 caracteres'),
    email: z.string().email('El correo electrónico no es válido'),
    phone: z.string().min(7, 'El teléfono debe tener al menos 7 caracteres'),
    password: z
      .string()
      .min(7, 'La contraseña debe tener al menos 7 caracteres')
      .max(11, 'La contraseña debe tener máximo 11 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        'La contraseña debe contener al menos 1 mayúscula, 1 minúscula y 1 número',
      ),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, { message: 'Debe aceptar los términos y condiciones' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ── Clases CSS alineadas con SimulationForm ─────────────────────────────────

const INPUT_BASE =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400';
const LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-1.5';

// ── Component ───────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
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

  const onSubmit = async (data: RegisterFormData) => {
    setApiError('');
    const { confirmPassword: _, ...payload } = data;
    void _;
    const result = await registerUser(payload);
    if (result.error) { setApiError(result.error); return; }
    setSuccess(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: '#F4F1F1' }}
      onClick={() => { if (profileOpen) setProfileOpen(false); }}
    >
      {/* ── Header institucional (igual que el simulador) ── */}
      <UpbHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((p) => !p)}
      />

      {/* ── Main: formulario + imagen ── */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Columna izquierda — Formulario */}
        <div className="w-full lg:w-1/2 bg-white px-6 py-8 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto">
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
              <input id="firstName" type="text" {...register('firstName')} className={INPUT_BASE} placeholder="Ingrese su nombre" />
              {errors.firstName && <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.firstName.message}</p>}
            </div>

            {/* Apellido */}
            <div>
              <label htmlFor="lastName" className={LABEL_CLASS}>Apellido</label>
              <input id="lastName" type="text" {...register('lastName')} className={INPUT_BASE} placeholder="Ingrese su apellido" />
              {errors.lastName && <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.lastName.message}</p>}
            </div>

            {/* Tipo de Identificación */}
            <div>
              <label htmlFor="documentType" className={LABEL_CLASS}>Tipo de Identificación</label>
              <select id="documentType" {...register('documentType')} className={INPUT_BASE} defaultValue="">
                <option value="" disabled>Seleccione tipo de documento</option>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="TI">Tarjeta de Identidad</option>
              </select>
              {errors.documentType && <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.documentType.message}</p>}
            </div>

            {/* Número de Identificación */}
            <div>
              <label htmlFor="documentNumber" className={LABEL_CLASS}>Número de Identificación</label>
              <input id="documentNumber" type="text" {...register('documentNumber')} className={INPUT_BASE} placeholder="Ingrese su número de documento" />
              {errors.documentNumber && <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.documentNumber.message}</p>}
            </div>

            {/* Correo electrónico */}
            <div>
              <label htmlFor="email" className={LABEL_CLASS}>Correo electrónico</label>
              <input id="email" type="email" {...register('email')} className={INPUT_BASE} placeholder="correo@ejemplo.com" />
              {errors.email && <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.email.message}</p>}
            </div>

            {/* Número de celular */}
            <div>
              <label htmlFor="phone" className={LABEL_CLASS}>Número de celular</label>
              <input id="phone" type="tel" {...register('phone')} className={INPUT_BASE} placeholder="Ingrese su número de celular" />
              {errors.phone && <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.phone.message}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className={LABEL_CLASS}>Contraseña</label>
              <input id="password" type="password" {...register('password')} className={INPUT_BASE} placeholder="••••••••" autoComplete="new-password" />
              {errors.password && <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.password.message}</p>}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className={LABEL_CLASS}>Confirmar contraseña</label>
              <input id="confirmPassword" type="password" {...register('confirmPassword')} className={INPUT_BASE} placeholder="••••••••" autoComplete="new-password" />
              {errors.confirmPassword && <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.confirmPassword.message}</p>}
            </div>

            {/* Password rules — estilo nota informativa (igual que SimulationForm) */}
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D4FF', color: '#6E11B0' }}
            >
              <p className="font-semibold mb-1">Tenga en cuenta que:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>La contraseña debe ser mayor a 6 caracteres y menor a 12 caracteres.</li>
                <li>La contraseña debe contener 1 letra mayúscula.</li>
                <li>La contraseña debe tener 1 letra minúscula.</li>
                <li>La contraseña debe tener 1 número.</li>
              </ul>
            </div>

            {/* Términos y condiciones */}
            <div className="flex items-start gap-2">
              <input
                id="termsAccepted"
                type="checkbox"
                {...register('termsAccepted')}
                className="mt-1 h-4 w-4 rounded border-gray-300 accent-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                Aceptar términos y condiciones de uso del simulador
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-xs font-medium -mt-2" style={{ color: '#B91C1C' }}>{errors.termsAccepted.message}</p>
            )}

            {/* Link a términos */}
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
              <Link to="#" className="underline hover:text-purple-600">
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
          <p className="text-sm text-gray-600 mt-6 mb-4">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-semibold">
              Iniciar Sesión
            </Link>
          </p>
        </div>

        {/* Columna derecha — Imagen del campus (solo desktop) */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <img
            src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80"
            alt="Campus UPB"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </main>

      {/* ── Footer institucional (igual que el simulador) ── */}
      <UpbFooter />
    </div>
  );
}
