import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, NETWORK_ERROR_MESSAGE } from '@/shared/services/api';
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

// ── Tipos de error de login (HU-04) ────────────────────────────────────────

type LoginErrorType = 'credentials' | 'disabled' | 'server' | 'network' | 'role';

interface LoginError {
  type: LoginErrorType;
  message: string;
}

/** Mapea el errorCode del backend (o condiciones locales) a un tipo visual */
function classifyLoginError(
  errorMsg: string,
  errorCode?: string,
): LoginError {
  // Error de red (fetch falló)
  if (errorMsg === NETWORK_ERROR_MESSAGE || errorCode === 'NETWORK_ERROR') {
    return {
      type: 'network',
      message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.',
    };
  }

  // Error del servidor (500 o catch inesperado)
  if (errorCode === 'SERVER_ERROR') {
    return {
      type: 'server',
      message: 'Ocurrió un error inesperado en el servidor. Intenta de nuevo más tarde.',
    };
  }

  // Cuenta desactivada
  if (errorCode === 'ACCOUNT_DISABLED') {
    return {
      type: 'disabled',
      message: errorMsg,
    };
  }

  // Rol incorrecto (estudiante en pestaña admin o viceversa)
  if (errorCode === 'ROLE_MISMATCH') {
    return {
      type: 'role',
      message: errorMsg,
    };
  }

  // Credenciales inválidas (default para 401)
  if (errorCode === 'INVALID_CREDENTIALS') {
    return {
      type: 'credentials',
      message: errorMsg,
    };
  }

  // Fallback — usar el mensaje del servidor
  return {
    type: 'credentials',
    message: errorMsg,
  };
}

// ── Estilos del banner de error según tipo (HU-04) ─────────────────────────

const ERROR_STYLES: Record<LoginErrorType, { bg: string; border: string; color: string; iconColor: string }> = {
  credentials: { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', iconColor: '#DC2626' },
  disabled:    { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', iconColor: '#D97706' },
  server:      { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', iconColor: '#DC2626' },
  network:     { bg: '#FFF7ED', border: '#FED7AA', color: '#9A3412', iconColor: '#EA580C' },
  role:        { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', iconColor: '#2563EB' },
};

/** Iconos SVG para cada tipo de error */
function ErrorIcon({ type }: { type: LoginErrorType }) {
  const cls = 'h-5 w-5 flex-shrink-0';
  switch (type) {
    case 'credentials':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" focusable="false">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case 'disabled':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" focusable="false">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'server':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" focusable="false">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    case 'network':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" focusable="false">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
        </svg>
      );
    case 'role':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" focusable="false">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      );
  }
}

// ── Clases CSS alineadas con SimulationForm ─────────────────────────────────

const INPUT_BASE =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400';
const LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-1.5';

// ── Component ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('student');
  const { login } = useAuth();
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const isStudent = mode === 'student';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  /** Limpia el banner de error del servidor cuando el usuario escribe */
  const clearError = useCallback(() => {
    setLoginError(null);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);

    const role = isStudent ? 'STUDENT' : 'ADMIN';
    const result = await loginUser({ email: data.email, password: data.password, role });

    if (result.error) {
      setLoginError(classifyLoginError(result.error, result.errorCode));
      return;
    }

    if (result.data) {
      const actualRole = result.data.user.role;

      // Validar que el rol real coincida con la pestaña seleccionada
      if (role === 'ADMIN' && actualRole !== 'ADMIN') {
        setLoginError({ type: 'role', message: 'Esta cuenta no tiene permisos de administrador.' });
        return;
      }
      if (role === 'STUDENT' && actualRole !== 'STUDENT') {
        setLoginError({ type: 'role', message: 'Esta cuenta es de administrador. Usa la pestaña Administrador.' });
        return;
      }

      login(result.data.token, result.data.user);

      // Redirigir según el rol real retornado por el servidor
      if (actualRole === 'ADMIN') {
        navigate('/admin/main');
      } else {
        navigate('/student/main');
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
                onClick={() => { setMode('student'); setLoginError(null); }}
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
                onClick={() => { setMode('admin'); setLoginError(null); }}
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

          {/* Banner de error contextual (HU-04) */}
          {loginError && (
            <div
              className="rounded-xl px-4 py-3 mb-5 text-sm font-medium flex items-start gap-3 animate-[shake_0.4s_ease-in-out]"
              style={{
                backgroundColor: ERROR_STYLES[loginError.type].bg,
                border: `1px solid ${ERROR_STYLES[loginError.type].border}`,
                color: ERROR_STYLES[loginError.type].color,
              }}
              role="alert"
            >
              <span style={{ color: ERROR_STYLES[loginError.type].iconColor }}>
                <ErrorIcon type={loginError.type} />
              </span>
              <span>{loginError.message}</span>
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
                onInput={clearError}
                className={`${INPUT_BASE} ${errors.email ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
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
                  onInput={clearError}
                  className={`${INPUT_BASE} ${errors.password ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
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
          <div className="mt-10">
            {/* Fila: Registrarme | Entrar como invitado — centrado */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-gray-900 transition-all duration-150 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0D901]/60"
                style={{ backgroundColor: '#C0D901' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Registrarme
              </Link>

              {/* Separador vertical — solo desktop */}
              <span className="hidden sm:block w-px h-5 bg-gray-300" aria-hidden="true" />

              <Link
                to="/guest"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0D901]/60 hover:brightness-105"
                style={{ backgroundColor: '#F7FBE1', border: '2px solid #C0D901', color: '#4a5500' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Entrar como invitado
              </Link>
            </div>

            {/* Separador horizontal */}
            <div className="w-full border-t border-gray-200 my-5" aria-hidden="true" />

            {/* Olvidé contraseña */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              >
                ¿Olvidaste tu contraseña?
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
