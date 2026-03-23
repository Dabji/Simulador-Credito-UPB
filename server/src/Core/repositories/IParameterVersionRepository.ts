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
  readonly interestRates: ActiveInterestRate[];
  readonly modalityRules: ActiveModalityRule[];
  readonly initialPaymentRules: ActiveInitialPaymentRule[];
}

export interface ActiveInterestRate {
  readonly levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  readonly rateMonthly: number;
}

export interface ActiveModalityRule {
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly level: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  readonly maxTotalPayments: number;
  readonly minInitialPct: number;
}

export interface ActiveInitialPaymentRule {
  readonly level: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly extraInstallments: number;
  readonly initialPctRequired: number;
}

// ── Tipos de entrada para operaciones de escritura ─────────────────

export interface UpdateInterestRateInput {
  readonly levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  readonly rateMonthly: number;
}

export interface UpdateModalityRuleInput {
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly level: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  readonly maxTotalPayments: number;
  readonly minInitialPct: number;
}

export interface UpdateInitialPaymentRuleInput {
  readonly level: 'PREGRADO' | 'POSGRADO' | 'UPB_TEC';
  readonly modality: 'SIN_INTERES' | 'CON_INTERES';
  readonly extraInstallments: number;
  readonly initialPctRequired: number;
}

export interface UpdateParameterVersionData {
  readonly validFrom?: string;
  readonly validTo?: string | null;
  readonly notes?: string | null;
  readonly installmentsWindowFrom?: string;
  readonly installmentsWindowTo?: string;
  readonly paymentPeriodDays?: number;
  readonly interestRates?: UpdateInterestRateInput[];
  readonly modalityRules?: UpdateModalityRuleInput[];
  readonly initialPaymentRules?: UpdateInitialPaymentRuleInput[];
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
  readonly interestRates: UpdateInterestRateInput[];
  readonly modalityRules: UpdateModalityRuleInput[];
  readonly initialPaymentRules: UpdateInitialPaymentRuleInput[];
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
}
