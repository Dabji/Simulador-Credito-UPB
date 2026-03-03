import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '@/shared/services/api';
import { useAuth } from '../context/AuthContext';
import LogoUpb from '@/assets/Images/LogoUpb.png';
import fondoLogin from '@/assets/Images/fondoLogin.png';

// ── Zod Schema ──────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('El correo electrónico no es válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type LoginMode = 'student' | 'admin';

// ── Clases CSS alineadas con SimulationForm ─────────────────────────────────

const INPUT_BASE =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400';
const LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-1.5';

// ── Component ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('student');
  const { login } = useAuth();
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const isStudent = mode === 'student';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError('');

    const role = isStudent ? 'STUDENT' : 'ADMIN';
    const result = await loginUser({ email: data.email, password: data.password, role });

    if (result.error) {
      setApiError(result.error);
      return;
    }

    if (result.data) {
      const actualRole = result.data.user.role;

      // Validar que el rol real coincida con la pestaña seleccionada
      if (role === 'ADMIN' && actualRole !== 'ADMIN') {
        setApiError('Esta cuenta no tiene permisos de administrador.');
        return;
      }
      if (role === 'STUDENT' && actualRole !== 'STUDENT') {
        setApiError('Esta cuenta es de administrador. Usa la pestaña Administrador.');
        return;
      }

      login(result.data.token, result.data.user);

      // Redirigir según el rol real retornado por el servidor
      if (actualRole === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/simulator/create');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      {/* ── Columna izquierda — Formulario ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 pt-8 pb-4 lg:pt-12 lg:pb-6 sm:px-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Texto de bienvenida */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 leading-relaxed">
              Bienvenido al Simulador Crédito Educativo
              <br />
              Universidad Pontificia Bolivariana
              <br />
              Seccional Bucaramanga
            </p>
          </div>

          {/* Toggle Estudiante / Administrador */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-200 rounded-full p-1">
              <button
                type="button"
                onClick={() => setMode('student')}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isStudent
                    ? 'bg-white shadow text-purple-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Estudiante
              </button>
              <button
                type="button"
                onClick={() => setMode('admin')}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  !isStudent
                    ? 'bg-white shadow text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Administrador
              </button>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-4xl sm:text-5xl font-black italic text-gray-900 mb-10">
            Iniciar Sesión
          </h1>

          {/* Error de API */}
          {apiError && (
            <div
              className="rounded-xl px-4 py-3 mb-5 text-sm font-medium"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
              role="alert"
            >
              {apiError}
            </div>
          )}

          {/* Formulario con react-hook-form + Zod */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className={LABEL_CLASS}>
                {isStudent ? 'Correo electrónico' : 'Correo Institucional'}
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={INPUT_BASE}
                placeholder={isStudent ? 'correo@ejemplo.com' : 'usuario@upb.edu.co'}
                autoComplete="username"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className={LABEL_CLASS}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={INPUT_BASE}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-medium" style={{ color: '#B91C1C' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Botón — violeta para estudiante, azul para administrador */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isStudent ? '#A85BFF' : '#2563EB',
                  boxShadow: isStudent
                    ? '0 4px 14px rgba(168,91,255,0.35)'
                    : '0 4px 14px rgba(37,99,235,0.35)',
                }}
              >
                {isSubmitting ? 'Ingresando…' : 'Ingresar'}
              </button>
            </div>
          </form>

          {/* Links inferiores */}
          <div className="mt-12 text-center space-y-4">
            <p className="text-sm text-gray-600">
              ¿Aún no estás registrado?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-semibold">
                Regístrate Ahora
              </Link>
            </p>

            <p>
              <Link to="/forgot-password" className="text-blue-600 hover:underline font-semibold text-sm">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>

            <div className="pt-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                ¿No eres estudiante UPB todavía?
                <br />
                Ingresa en modo invitado y simula tu crédito educativo.
              </p>
              <Link to="/simulator/create" className="text-blue-600 hover:underline font-semibold text-sm">
                Dale click Ahora
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Columna derecha — Imagen campus + logo UPB ── */}
      <div className="hidden lg:block lg:w-1/2 relative">
        {/* Logo UPB en esquina superior derecha */}
        <img
          src={LogoUpb}
          alt="Logo UPB"
          className="absolute top-6 right-8 h-12 z-10"
        />
        <img
          src={fondoLogin}
          alt="Campus Universidad Pontificia Bolivariana"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
