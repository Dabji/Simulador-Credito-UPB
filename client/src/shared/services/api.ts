const API_BASE = '/api';

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

    const body = (await response.json()) as T | { error: string };

    if (!response.ok) {
      const errorBody = body as { error: string };
      return { error: errorBody.error || 'Error desconocido' };
    }

    return { data: body as T };
  } catch {
    return { error: 'Error de conexión con el servidor' };
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
