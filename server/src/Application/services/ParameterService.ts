// Servicio: retorna la versión activa de parámetros del simulador.
// Sin BD por ahora — valores hardcode según reglas de HU-13.

import { ParameterVersion } from '../../Core/entities/ParameterVersion';

export class ParameterService {
  // Versión activa única (hardcode temporal, sin DB)
  private static readonly ACTIVE: ParameterVersion = new ParameterVersion(
    'v1-2026',
    0.009,  // tasa mensual máxima (con_interes)
    20,     // mínimo % cuota inicial
    6,      // máximo cuotas por semestre
    30,     // días entre cuotas
  );

  getActiveVersion(): ParameterVersion {
    return ParameterService.ACTIVE;
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
