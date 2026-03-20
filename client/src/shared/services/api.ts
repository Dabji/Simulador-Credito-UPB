const API_BASE = '/api';

export const NETWORK_ERROR_MESSAGE = 'Error de conexión con el servidor';

// ── Tipos genéricos ───────────────────────────────────────────────────────

interface ApiResponse<T> {
  data?: T;
  error?: string;
  /** Código semántico del error retornado por el backend (HU-04) */
  errorCode?: string;
  fieldErrors?: Record<string, string[]>;
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
      const errorBody = body as {
        error: string | { message: string; errorCode?: string; fieldErrors?: Record<string, string[]> };
        message?: string;
      };
      // El backend puede retornar { error: "msg" } o { error: { message: "msg", ... } }
      const msg =
        typeof errorBody.error === 'string'
          ? errorBody.error
          : errorBody.error?.message ?? errorBody.message ?? 'Error desconocido';

      // Extraer errorCode si existe (HU-04)
      const errorCode =
        typeof errorBody.error === 'object' && errorBody.error?.errorCode
          ? errorBody.error.errorCode
          : undefined;

      // Extraer fieldErrors si existen (HU-02)
      const fieldErrors =
        typeof errorBody.error === 'object' && errorBody.error?.fieldErrors
          ? errorBody.error.fieldErrors
          : undefined;

      // Si es 401 y no es ruta de auth propia, limpiar sesión (token expirado/inválido).
      // Se excluye /auth/logout para evitar un bucle: logout → 401 → auth:unauthorized → logout…
      if (
        response.status === 401 &&
        !endpoint.endsWith('/auth/login') &&
        !endpoint.endsWith('/auth/logout')
      ) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      return { error: msg, errorCode, fieldErrors };
    }

    return { data: body as T };
  } catch {
    return { error: NETWORK_ERROR_MESSAGE, errorCode: 'NETWORK_ERROR' };
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

/**
 * POST /api/auth/logout
 * Notifica al servidor que el usuario cierra sesión (HU-05).
 * Fire-and-forget: el frontend no espera la respuesta para continuar.
 */
export async function logoutUser(): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/auth/logout', {
    method: 'POST',
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

// ── DTOs de Parámetros Administrativos (RF-10, RF-23, RF-24) ────────────

export type EducationLevelScope = 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
export type ModalityType = 'SIN_INTERES' | 'CON_INTERES';

export interface AdminInterestRate {
  readonly levelScope: EducationLevelScope;
  readonly rateMonthly: number;
}

export interface AdminModalityRule {
  readonly modality: ModalityType;
  readonly level: EducationLevelScope;
  readonly maxTotalPayments: number;
  readonly minInitialPct: number;
}

export interface AdminInitialPaymentRule {
  readonly level: EducationLevelScope;
  readonly modality: ModalityType;
  readonly extraInstallments: number;
  readonly initialPctRequired: number;
}

export interface AdminParameterVersion {
  readonly id: string;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly installmentsWindowFrom: string;
  readonly installmentsWindowTo: string;
  readonly paymentPeriodDays: number;
  readonly notes?: string | null;
  readonly interestRates: AdminInterestRate[];
  readonly modalityRules: AdminModalityRule[];
  readonly initialPaymentRules: AdminInitialPaymentRule[];
}

export interface AdminParameterVersionSummary {
  readonly id: string;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly isActive: boolean;
}

export interface UpdateParameterVersionPayload {
  validFrom?: string;
  validTo?: string | null;
  notes?: string | null;
  interestRates?: { levelScope: EducationLevelScope; rateMonthly: number }[];
  modalityRules?: {
    modality: ModalityType;
    level: EducationLevelScope;
    maxTotalPayments: number;
    minInitialPct: number;
  }[];
  initialPaymentRules?: {
    level: EducationLevelScope;
    modality: ModalityType;
    extraInstallments: number;
    initialPctRequired: number;
  }[];
}

/** GET /api/admin/parameters/active — versión vigente con todas sus reglas (requiere ADMIN) */
export async function getActiveParameters(): Promise<ApiResponse<{ data: AdminParameterVersion }>> {
  return request<{ data: AdminParameterVersion }>('/admin/parameters/active');
}

/** GET /api/parameters/active — parámetros activos PÚBLICO (student + guest).
 *  Usado por SimulationForm para reflejar tasa, cuota mínima, límites dinámicamente. */
export async function getSimulatorConfig(): Promise<ApiResponse<{ data: AdminParameterVersion }>> {
  return request<{ data: AdminParameterVersion }>('/parameters/active');
}

/** GET /api/admin/parameters — listado de todas las versiones (resumen) */
export async function listParameterVersions(): Promise<ApiResponse<{ data: AdminParameterVersionSummary[] }>> {
  return request<{ data: AdminParameterVersionSummary[] }>('/admin/parameters');
}

/** GET /api/admin/parameters/:id — versión específica con todas sus reglas */
export async function getParameterVersion(
  id: string,
): Promise<ApiResponse<{ data: AdminParameterVersion }>> {
  return request<{ data: AdminParameterVersion }>(`/admin/parameters/${id}`);
}

/** PUT /api/admin/parameters/:id — actualiza una versión de parámetros */
export async function updateParameterVersion(
  id: string,
  payload: UpdateParameterVersionPayload,
): Promise<ApiResponse<{ data: AdminParameterVersion; message: string }>> {
  return request<{ data: AdminParameterVersion; message: string }>(
    `/admin/parameters/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );
}

// ── HU-81: Perfil del usuario ─────────────────────────────────────────────

/** Datos del perfil devueltos por GET /api/users/me */
export interface MyProfileDTO {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly documentType?: 'CC' | 'TI';
  readonly identificationNumber: string;
  readonly phone?: string;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly createdAt: string;
}

/** Payload para PATCH /api/users/me */
export interface UpdateMyProfilePayload {
  documentType?: 'CC' | 'TI';
  identificationNumber?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/** Ítem de simulación devuelto por GET /api/users/me/simulations */
export interface MySimulationItemDTO {
  readonly id: string;
  readonly academicPeriod: string;
  readonly numberOfPayments: number;
  readonly totalPaid: number;
  readonly createdAt: string;
}

/** GET /api/users/me — Retorna el perfil del estudiante autenticado */
export async function getMyProfile(): Promise<ApiResponse<{ user: MyProfileDTO }>> {
  return request<{ user: MyProfileDTO }>('/users/me');
}

/** PATCH /api/users/me — Actualiza campos permitidos del perfil */
export async function updateMyProfile(
  data: UpdateMyProfilePayload,
): Promise<ApiResponse<{ user: MyProfileDTO; message: string }>> {
  return request<{ user: MyProfileDTO; message: string }>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** GET /api/users/me/simulations — Lista simulaciones del estudiante (máx. 20) */
export async function getMySimulations(): Promise<ApiResponse<{ simulations: MySimulationItemDTO[] }>> {
  return request<{ simulations: MySimulationItemDTO[] }>('/users/me/simulations');
}

// ── HU-82: Gestión de usuarios (Admin) ───────────────────────────────────

export type AdminUserFilterField =
  | 'identificationNumber'
  | 'documentType'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'createdAt';

export interface AdminUserListItemDTO {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly documentType?: 'CC' | 'TI';
  readonly identificationNumber: string;
  readonly email: string;
  readonly phone?: string;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly createdAt: string;
}

export interface AdminUsersResponseDTO {
  readonly items: AdminUserListItemDTO[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface AdminUserProfileDTO {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly documentType?: 'CC' | 'TI';
  readonly identificationNumber: string;
  readonly email: string;
  readonly phone?: string;
  readonly role: 'STUDENT' | 'ADMIN';
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface AdminUpdateUserPayload {
  email?: string;
  documentType?: 'CC' | 'TI';
  identificationNumber?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface AdminUserSimulationItemDTO {
  readonly id: string;
  readonly academicPeriod: string;
  readonly numberOfPayments: number;
  readonly totalPaid: number;
  readonly createdAt: string;
}

export interface AdminListUsersParams {
  q?: string;
  filter?: AdminUserFilterField;
  page?: number;
  pageSize?: number;
}

/** GET /api/admin/users — Listar estudiantes con búsqueda y paginación */
export async function adminListUsers(
  params: AdminListUsersParams = {},
): Promise<ApiResponse<{ data: AdminUsersResponseDTO }>> {
  const qs = new URLSearchParams();
  if (params.q)        qs.set('q',        params.q);
  if (params.filter)   qs.set('filter',   params.filter);
  if (params.page)     qs.set('page',     String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return request<{ data: AdminUsersResponseDTO }>(`/admin/users${query}`);
}

/** GET /api/admin/users/:id — Perfil completo de un usuario */
export async function adminGetUser(
  id: string,
): Promise<ApiResponse<{ data: AdminUserProfileDTO }>> {
  return request<{ data: AdminUserProfileDTO }>(`/admin/users/${id}`);
}

/** PATCH /api/admin/users/:id — Actualizar datos personales de un usuario */
export async function adminUpdateUser(
  id: string,
  payload: AdminUpdateUserPayload,
): Promise<ApiResponse<{ data: AdminUserProfileDTO; message: string }>> {
  return request<{ data: AdminUserProfileDTO; message: string }>(
    `/admin/users/${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
}

/** GET /api/admin/users/:id/simulations — Simulaciones de un usuario */
export async function adminGetUserSimulations(
  id: string,
): Promise<ApiResponse<{ data: AdminUserSimulationItemDTO[] }>> {
  return request<{ data: AdminUserSimulationItemDTO[] }>(`/admin/users/${id}/simulations`);
}

// ── HU-42: Gestión de simulaciones (ADMIN) ────────────────────────────────

export type AdminSimFilterField =
  | 'createdAt'
  | 'academicPeriod'
  | 'interestMode'
  | 'educationLevel'
  | 'studentType'
  | 'studentName'
  | 'studentEmail';

export interface AdminSimulationItemDTO {
  readonly id: string;
  readonly createdAt: string;
  readonly studentName: string;
  readonly studentEmail: string;
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly educationLevel: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  readonly studentType: 'NUEVO' | 'CONTINUO';
  readonly financedValue: number;
  readonly initialPaymentValue: number;
  readonly firstPaymentDate: string;
  readonly numberOfPayments: number;
  readonly academicPeriod: string;
}

export interface AdminSimulationsResponseDTO {
  readonly items: AdminSimulationItemDTO[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface AdminListSimulationsParams {
  q?: string;
  filter?: AdminSimFilterField;
  page?: number;
  pageSize?: number;
}

/** GET /api/admin/simulations — Lista paginada de todas las simulaciones */
export async function adminListSimulations(
  params: AdminListSimulationsParams = {},
): Promise<ApiResponse<{ data: AdminSimulationsResponseDTO }>> {
  const qs = new URLSearchParams();
  if (params.q)        qs.set('q',        params.q);
  if (params.filter)   qs.set('filter',   params.filter);
  if (params.page)     qs.set('page',     String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return request<{ data: AdminSimulationsResponseDTO }>(`/admin/simulations${query}`);
}

/** DELETE /api/admin/simulations/:id — Eliminar simulación (admin) */
export async function adminDeleteSimulation(
  id: string,
  reason?: string,
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return request<{ success: boolean; message: string }>(
    `/admin/simulations/${id}`,
    { method: 'DELETE', body: JSON.stringify({ reason: reason ?? 'Eliminado por administrador' }) },
  );
}

// ── HU-40 / HU-41: Exportar simulación (ADMIN) ───────────────────────────

/**
 * Descarga el PDF de una simulación como Blob.
 * Lanza un Error con mensaje legible si la respuesta no es OK.
 */
export async function adminExportSimulationPdf(id: string): Promise<{ blob: Blob; filename: string }> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE}/admin/simulations/${id}/export/pdf`, { headers });

  if (!response.ok) {
    let msg = 'Error al generar el PDF.';
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) msg = body.error;
    } catch { /* ignorar */ }
    throw new Error(msg);
  }

  const blob = await response.blob();
  const cd   = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"]+)"?/.exec(cd);
  const filename = match?.[1] ?? `simulacion-upb-${id.slice(0, 8)}.pdf`;
  return { blob, filename };
}

/**
 * Descarga el CSV de una simulación como Blob.
 * Lanza un Error con mensaje legible si la respuesta no es OK.
 */
export async function adminExportSimulationCsv(id: string): Promise<{ blob: Blob; filename: string }> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE}/admin/simulations/${id}/export/csv`, { headers });

  if (!response.ok) {
    let msg = 'Error al generar el CSV.';
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) msg = body.error;
    } catch { /* ignorar */ }
    throw new Error(msg);
  }

  const blob = await response.blob();
  const cd   = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"]+)"?/.exec(cd);
  const filename = match?.[1] ?? `simulacion-upb-${id.slice(0, 8)}.csv`;
  return { blob, filename };
}

/** DTO del detalle completo de una simulación para admin (HU-43) */
export interface AdminSimulationDetailDTO {
  readonly id: string;
  readonly userId: string;
  readonly savedAt: string;
  readonly level: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  readonly studentType: 'NUEVO' | 'CONTINUO';
  readonly studentObservation: string | null;
  readonly appliedRateMonthly: number;
  readonly student: {
    readonly firstName: string;
    readonly lastName: string;
    readonly identificationNumber: string;
    readonly email: string;
    readonly documentType: string;
    readonly phone: string | null;
  };
  readonly summary: SimulationSummaryDTO;
}

/** GET /api/admin/simulations/:id — Detalle completo de una simulación (admin) */
export async function adminGetSimulationById(
  id: string,
): Promise<ApiResponse<{ data: AdminSimulationDetailDTO }>> {
  return request<{ data: AdminSimulationDetailDTO }>(`/admin/simulations/${id}`);
}

// ── HU-35: Historial de simulaciones del estudiante ───────────────────────

export type StudentHistoryFilter =
  | 'modality'
  | 'academicPeriod'
  | 'createdAt';

export interface StudentHistoryItemDTO {
  readonly id: string;
  readonly createdAt: string;
  readonly studentName: string;
  readonly studentEmail: string;
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly financedValue: number;
  readonly initialPaymentValue: number;
  readonly firstPaymentDate: string;
  readonly numberOfPayments: number;
  readonly academicPeriod: string;
}

export interface StudentHistoryResponseDTO {
  readonly items: StudentHistoryItemDTO[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface GetMyHistoryParams {
  q?: string;
  filter?: StudentHistoryFilter;
  page?: number;
  pageSize?: number;
}

/** GET /api/simulator/history — Historial paginado del estudiante autenticado */
export async function getMySimulationHistory(
  params: GetMyHistoryParams = {},
): Promise<ApiResponse<StudentHistoryResponseDTO>> {
  const qs = new URLSearchParams();
  if (params.q)        qs.set('q',        params.q);
  if (params.filter) qs.set('filter', params.filter);
  if (params.page)     qs.set('page',     String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return request<StudentHistoryResponseDTO>(`/simulator/history${query}`);
}

// ── HU-36: Detalle de simulación del estudiante ───────────────────────────

/** GET /api/simulator/history/:id — Detalle completo de una simulación (estudiante) */
export async function getMySimulationById(
  id: string,
): Promise<ApiResponse<{ data: AdminSimulationDetailDTO }>> {
  return request<{ data: AdminSimulationDetailDTO }>(`/simulator/history/${id}`);
}

/**
 * Descarga el PDF de una simulación del estudiante autenticado.
 * Lanza un Error con mensaje legible si la respuesta no es OK.
 */
export async function exportMySimulationPdf(id: string): Promise<{ blob: Blob; filename: string }> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE}/simulator/history/${id}/export/pdf`, { headers });

  if (!response.ok) {
    let msg = 'Error al generar el PDF.';
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) msg = body.error;
    } catch { /* ignorar */ }
    throw new Error(msg);
  }

  const blob = await response.blob();
  const cd   = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"]+)"?/.exec(cd);
  const filename = match?.[1] ?? `simulacion-upb-${id.slice(0, 8)}.pdf`;
  return { blob, filename };
}
