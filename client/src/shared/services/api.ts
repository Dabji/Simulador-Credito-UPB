const API_BASE = '/api';

export const NETWORK_ERROR_MESSAGE = 'Error de conexión con el servidor';

// ── Tipos genéricos ───────────────────────────────────────────────────────

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    const body = (await response.json()) as T | { error: string | { message: string } };

    if (!response.ok) {
      const errorBody = body as { error: string | { message: string }; message?: string };
      // El backend puede retornar { error: "msg" } o { error: { message: "msg" } }
      const msg =
        typeof errorBody.error === 'string'
          ? errorBody.error
          : errorBody.error?.message ?? errorBody.message ?? 'Error desconocido';

      // Si es 401 y no es la ruta de login, limpiar sesión (token expirado/inválido)
      if (response.status === 401 && !endpoint.endsWith('/auth/login')) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      return { error: msg };
    }

    return { data: body as T };
  } catch {
    return { error: NETWORK_ERROR_MESSAGE };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── DTO / función de sesión actual (HU-03) ───────────────────────────────

export interface UserData {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly documentType?: 'CC' | 'TI';
  readonly identificationNumber: string;
  readonly phone?: string;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export async function getCurrentUser(): Promise<ApiResponse<{ user: UserData }>> {
  return request<{ user: UserData }>('/auth/me');
}

// ── DTOs espejo del backend (HU-13) ──────────────────────────────────────

export type InterestModeDTO    = 'sin_interes' | 'con_interes';
export type StudentTypeDTO     = 'nuevo' | 'continuo';
export type EducationLevelDTO  = 'pregrado' | 'posgrado' | 'upbTech';

// DTO de entrada — coincide con SimulationInput del backend
export interface SimulationInputDTO {
  readonly studentType: StudentTypeDTO;
  readonly educationLevel: EducationLevelDTO;
  readonly tuitionGross: number;
  readonly scholarshipPct: number;
  readonly initialPaymentPct: number;
  readonly initialPaymentValue: number;
  readonly interestMode: InterestModeDTO;
  readonly academicPeriod: string;
  readonly firstPaymentMonth: number;
  readonly numberOfPayments: number;
  readonly observations: string;
  readonly starred: boolean;
}

// Fila de tabla de amortización — coincide con AmortizationRowDTO del backend
export interface AmortizationRowDTO {
  readonly period: number;
  readonly date: string;
  readonly initialBalance: number;
  readonly principal: number;
  readonly interest: number;
  readonly payment: number;
  readonly finalBalance: number;
}

// DTO de resultado — coincide con SimulationSummary del backend
export interface SimulationSummaryDTO {
  readonly id: string;
  readonly tuitionGross: number;
  readonly scholarshipPct: number;
  readonly tuitionNet: number;
  readonly initialPayment: number;
  readonly initialPaymentPct: number;
  readonly financedValue: number;
  readonly interestMode: InterestModeDTO;
  readonly academicPeriod: string;
  readonly firstPaymentMonth: number;
  readonly numberOfPayments: number;
  readonly periodicPayment: number;
  readonly totalPaid: number;
  readonly totalInterest: number;
  readonly schedule: AmortizationRowDTO[];
}

// ── DTO / función de registro (HU-01) ────────────────────────────────────

export interface RegisterUserPayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly documentType: 'CC' | 'TI';
  readonly documentNumber: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly termsAccepted: true;
}

export async function registerUser(
  data: RegisterUserPayload,
): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── DTO / función de login (HU-02) ──────────────────────────────────────

export interface LoginUserPayload {
  readonly email: string;
  readonly password: string;
  readonly role: 'STUDENT' | 'ADMIN';
}

export interface LoginUserResponse {
  readonly user: UserData;
  readonly token: string;
}

export async function loginUser(
  data: LoginUserPayload,
): Promise<ApiResponse<LoginUserResponse>> {
  return request<LoginUserResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Funciones de recuperación de contraseña ──────────────────────────────

export async function forgotPassword(
  email: string,
): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export interface ResetPasswordPayload {
  readonly token: string;
  readonly password: string;
  readonly confirmPassword: string;
}

export async function resetPassword(
  data: ResetPasswordPayload,
): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Funciones de simulación (HU-13) ──────────────────────────────────────

// Envía los datos del formulario al backend y retorna el resumen calculado
export async function simulateCredit(
  input: SimulationInputDTO,
): Promise<ApiResponse<SimulationSummaryDTO>> {
  return request<SimulationSummaryDTO>('/simulator/preview', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// Guarda una simulación destacada en memoria (in-memory backend)
export async function saveSimulation(
  input: SimulationInputDTO,
): Promise<ApiResponse<{ id: string; message: string }>> {
  return request<{ id: string; message: string }>('/simulator/save', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
