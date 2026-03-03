// Servicio: retorna la versión activa de parámetros del simulador.
// Primero intenta leer de BD vía IParameterVersionRepository;
// si no hay versión activa, usa valores hardcode como fallback.

import { ParameterVersion } from '../../Core/entities/ParameterVersion';
import type { IParameterVersionRepository, ActiveParameterVersion } from '../../Core/repositories/IParameterVersionRepository';

export class ParameterService {
  // Fallback hardcode (se usa si la BD no tiene parámetros cargados)
  private static readonly FALLBACK: ParameterVersion = new ParameterVersion(
    'v1-2026',
    0.009,  // tasa mensual máxima (con_interes)
    20,     // mínimo % cuota inicial
    6,      // máximo cuotas por semestre
    30,     // días entre cuotas
  );

  private readonly paramRepo: IParameterVersionRepository | null;

  constructor(paramRepo?: IParameterVersionRepository) {
    this.paramRepo = paramRepo ?? null;
  }

  /** Retorna la versión activa de la BD o el fallback hardcode */
  async getActiveVersionFromDB(): Promise<ActiveParameterVersion | null> {
    if (!this.paramRepo) return null;
    return this.paramRepo.findActive();
  }

  /** Versión sincrónica usada por SimulationService (siempre disponible) */
  getActiveVersion(): ParameterVersion {
    return ParameterService.FALLBACK;
  }

  // Regla: periodos académicos y meses válidos — delega a ParameterVersion
  getValidMonthsForPeriod(period: string): number[] {
    return ParameterVersion.getMonthsForPeriod(period);
  }

  // Regla: cuotas máximas desde el mes elegido hasta el fin del periodo
  getMaxInstallments(period: string, firstPaymentMonth: number): number {
    return ParameterVersion.maxInstallmentsFromMonth(period, firstPaymentMonth);
  }
}
