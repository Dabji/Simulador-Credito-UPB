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

export interface IParameterVersionRepository {
  /** Retorna la versión activa (cuyo valid_from ≤ hoy y valid_to null o ≥ hoy) */
  findActive(): Promise<ActiveParameterVersion | null>;

  /** Retorna una versión por id con todas sus reglas */
  findById(id: string): Promise<ActiveParameterVersion | null>;
}
