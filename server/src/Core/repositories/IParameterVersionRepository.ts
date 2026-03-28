// ============================================================
// Core Repository Contract: IParameterVersionRepository
// Permite consultar la versión activa de parámetros y sus reglas.
// ============================================================

/** Versión de parámetros con sus reglas asociadas (leída de BD) */
export interface ActiveParameterVersion {
  readonly id: string;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly installmentsWindowFrom: string;
  readonly installmentsWindowTo: string;
  readonly paymentPeriodDays: number;
  readonly initialPaymentRules: ActiveInitialPaymentRule[];
  readonly levelConfigs: ActiveLevelConfig[];
}

export interface ActiveInterestRate {
  readonly levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly rateMonthly: number;
}

export interface ActiveModalityRule {
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly level: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly maxTotalPayments: number;
  readonly minInitialPct: number;
}

export interface ActiveInitialPaymentRule {
  readonly level: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly extraInstallments: number;
  readonly initialPctRequired: number;
}

/** Entrada plana usada por SimulationEngine/strategies. Una fila = un (levelScope × paymentCount). */
export interface ActiveLevelConfig {
  readonly id: string;
  readonly levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly isActive: boolean;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly maxPaymentsSinInteres: number;
  readonly maxPaymentsConInteres: number;
  readonly paymentCount: number;   // 1-6: viene de level_rate_rules
  readonly rateMonthly: number;    // de level_rate_rules
}

/** Cabecera completa con su array de tasas hijas — usada en respuestas CRUD de admin. */
export interface ActiveLevelConfigHeader {
  readonly id: string;
  readonly levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly isActive: boolean;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly maxPaymentsSinInteres: number;
  readonly maxPaymentsConInteres: number;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly rateRules: ReadonlyArray<{
    readonly id: string;
    readonly paymentCount: number;
    readonly rateMonthly: number;
  }>;
}

// ── Tipos de entrada para operaciones de escritura ─────────────────

export interface UpdateInterestRateInput {
  readonly levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly rateMonthly: number;
}

export interface UpdateModalityRuleInput {
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly level: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly maxTotalPayments: number;
  readonly minInitialPct: number;
}

export interface UpdateInitialPaymentRuleInput {
  readonly level: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly extraInstallments: number;
  readonly initialPctRequired: number;
}

/** Entrada plana para la ruta PUT /parameters/:id. Una fila = un (levelScope × paymentCount). */
export interface UpdateLevelConfigInput {
  readonly levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly isActive: boolean;
  readonly validFrom: string;
  readonly maxPaymentsSinInteres?: number;  // 1-3, opcional (usa valor existente en DB si se omite)
  readonly maxPaymentsConInteres?: number;  // 1-6, opcional
  readonly paymentCount: number;            // 1-6
  readonly rateMonthly: number;             // 0-1
}

export interface UpdateParameterVersionData {
  readonly validFrom?: string;
  readonly validTo?: string | null;
  readonly notes?: string | null;
  readonly installmentsWindowFrom?: string;
  readonly installmentsWindowTo?: string;
  readonly paymentPeriodDays?: number;
  readonly initialPaymentRules?: UpdateInitialPaymentRuleInput[];
  readonly levelConfigs?: UpdateLevelConfigInput[];
  readonly createdBy?: string;        // requerido cuando se incluye levelConfigs
  readonly actorUserId?: string | null;   // ID del admin que ejecuta el cambio (para audit_log)
  readonly actorIpAddress?: string | null; // IP del admin (para audit_log)
}

// ── CRUD temporal de level_configs ────────────────────────────────

export interface CreateLevelConfigData {
  readonly parameterVersionId: string;
  readonly levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech';
  readonly validFrom: string;
  readonly maxPaymentsSinInteres: number;
  readonly maxPaymentsConInteres: number;
  readonly createdBy: string;
  readonly rateRules: ReadonlyArray<{
    readonly paymentCount: number;
    readonly rateMonthly: number;
  }>;
}

export interface ReactivateLevelConfigData {
  readonly validFrom: string;
  readonly maxPaymentsSinInteres: number;
  readonly maxPaymentsConInteres: number;
  readonly createdBy: string;
  readonly rateRules: ReadonlyArray<{
    readonly paymentCount: number;
    readonly rateMonthly: number;
  }>;
}

// ── Resumen de versión para el listado ─────────────────────────────

export interface ParameterVersionSummary {
  readonly id: string;
  readonly validFrom: string;
  readonly validTo: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly isActive: boolean;
}

/** Datos para crear una nueva versión de parámetros */
export interface CreateParameterVersionData {
  readonly createdBy: string;
  readonly validFrom: string;
  readonly validTo?: string | null;
  readonly notes?: string | null;
  readonly initialPaymentRules: UpdateInitialPaymentRuleInput[];
  readonly levelConfigs?: UpdateLevelConfigInput[];
}

export interface IParameterVersionRepository {
  /** Retorna la versión activa (cuyo valid_from ≤ hoy y valid_to null o ≥ hoy) */
  findActive(): Promise<ActiveParameterVersion | null>;

  /** Retorna una versión por id con todas sus reglas */
  findById(id: string): Promise<ActiveParameterVersion | null>;

  /** Retorna todas las versiones de parámetros (resumen para listado) */
  findAll(): Promise<ParameterVersionSummary[]>;

  /** Crea una nueva versión de parámetros con todas sus reglas */
  createVersion(data: CreateParameterVersionData): Promise<ActiveParameterVersion>;

  /** Actualiza los datos y reglas de una versión existente */
  updateVersion(id: string, data: UpdateParameterVersionData): Promise<ActiveParameterVersion | null>;

  /** Activa una versión específica y desactiva las demás (ajusta valid_from/valid_to) */
  activateVersion(id: string): Promise<ActiveParameterVersion | null>;

  /**
   * Verifica si el rango [validFrom, validTo] se superpone con alguna versión existente.
   * @param excludeId ID de la versión a excluir de la verificación (útil al editar la misma).
   */
  hasOverlap(validFrom: string, validTo: string | null, excludeId?: string): Promise<boolean>;

  // ── CRUD temporal de level_configs ──────────────────────────────

  /** Retorna todas las cabeceras level_config de una versión (activas e históricas). */
  findLevelConfigsByVersion(parameterVersionId: string): Promise<ActiveLevelConfigHeader[]>;

  /**
   * Crea una nueva cabecera level_config con sus reglas de tasa.
   * Usa SELECT FOR UPDATE para garantizar unicidad del activo por (version, levelScope).
   */
  createLevelConfig(data: CreateLevelConfigData): Promise<ActiveLevelConfigHeader>;

  /**
   * Desactiva una cabecera: UPDATE is_active=0, valid_to=hoy.
   * Nunca borra. Retorna null si no existe o ya está desactivada.
   */
  deactivateLevelConfig(id: string): Promise<ActiveLevelConfigHeader | null>;

  /**
   * Crea un nuevo período activo para el mismo (version, levelScope) que una config histórica.
   * El previousId sirve para heredar parámetros de contexto y validar que la config anterior esté cerrada.
   * Reactivar = INSERT nueva fila — nunca UPDATE sobre histórico.
   */
  reactivateLevelConfig(previousId: string, data: ReactivateLevelConfigData): Promise<ActiveLevelConfigHeader>;

  /**
   * Actualiza la tasa de una regla hija existente.
   * Retorna null si la config o la regla no existen.
   */
  updateLevelRateRule(
    configId: string,
    paymentCount: number,
    newRate: number,
  ): Promise<{ id: string; paymentCount: number; rateMonthly: number } | null>;
}
