// ============================================================
// Core Repository Contract: ISimulationRepository
// Define las operaciones de persistencia de simulaciones.
// ============================================================

import type { SimulationSummary, AmortizationRowDTO } from '../../Application/dtos/SimulationSummary';

/** Datos necesarios para persistir una simulación */
export interface SaveSimulationData {
  readonly id: string;
  readonly userId: string;
  readonly parameterVersionId: string;
  readonly studentType: string;         // "NUEVO" | "CONTINUO"
  readonly level: string;               // "PREGRADO" | "POSGRADO" | "UPB_TEC"
  readonly modality: string;            // "SIN_INTERES" | "CON_INTERES"
  readonly tuitionGross: number;
  readonly scholarPct: number;          // 0.0000 – 1.0000
  readonly tuitionNet: number;
  readonly initialPaymentPct: number;   // 0.0000 – 1.0000
  readonly initialPaymentValue: number;
  readonly totalPayments: number;
  readonly firstPaymentDate: string;    // "YYYY-MM-DD"
  readonly financedValue: number;
  readonly periodicPaymentValue: number;
  readonly totalInterest: number;
  readonly totalPaid: number;
  readonly appliedRateMonthly: number;  // decimal
  readonly studentObservation: string | null;
  readonly schedule: AmortizationRowDTO[];
}

/** Simulación persistida tal como la retorna el repositorio */
export interface PersistedSimulation {
  readonly id: string;
  readonly userId: string;
  readonly savedAt: Date;
  readonly summary: SimulationSummary;
}

export interface ISimulationRepository {
  /** Persiste la simulación y sus filas de amortización (transacción) */
  save(data: SaveSimulationData): Promise<{ id: string; savedAt: Date }>;

  /** Busca las simulaciones de un usuario (no borradas) */
  findByUserId(userId: string): Promise<PersistedSimulation[]>;

  /** Busca una simulación por id */
  findById(id: string): Promise<PersistedSimulation | null>;
}
