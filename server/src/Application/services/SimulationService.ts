// Servicio: orquesta la validación, cálculo y retorno de una simulación.
// Usa ParameterService para obtener parámetros vigentes y SimulationEngine
// para realizar los cálculos financieros.

import { ModalityRule } from '../../Core/entities/ModalityRule';
import { InitialPaymentRule } from '../../Core/entities/InitialPaymentRule';
import { Money } from '../../Core/entities/Money';
import { ParameterService } from './ParameterService';
import { SimulationEngine } from './SimulationEngine';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { SimulationSummary } from '../dtos/SimulationSummary';
import type { ActiveParameterVersion } from '../../Core/repositories/IParameterVersionRepository';

export class SimulationService {
  private readonly paramService: ParameterService;
  private readonly engine: SimulationEngine;

  constructor() {
    this.paramService = new ParameterService();
    this.engine       = new SimulationEngine();
  }

  // Valida reglas de negocio y delega el cálculo al engine
  calculate(input: SimulationInput, activeVersion?: ActiveParameterVersion): SimulationSummary {
    const params = this.paramService.getActiveVersion();

    // Regla: estudiante nuevo no puede tener beca
    const rule = new ModalityRule(input.studentType, input.educationLevel);
    if (!rule.scholarshipAllowed() && input.scholarshipPct > 0) {
      throw new Error('Los estudiantes nuevos no pueden tener beca o descuento.');
    }

    // Regla: cuota inicial mínima dinámica (15% upbTech, 20% pregrado/posgrado)
    InitialPaymentRule.validatePct(input.initialPaymentPct, input.educationLevel);

    // Regla: tuición bruta debe ser positiva
    if (input.tuitionGross <= 0) {
      throw new Error('El valor de matrícula debe ser mayor a 0.');
    }

    // Regla: tuición neta debe ser positiva
    const netTuition = Money.of(input.tuitionGross * (1 - input.scholarshipPct / 100));
    if (netTuition.amount <= 0) {
      throw new Error('El valor neto de matrícula no puede ser 0.');
    }

    // Regla: mes de primera cuota debe pertenecer al periodo
    const validMonths = this.paramService.getValidMonthsForPeriod(input.academicPeriod);
    if (!validMonths.includes(input.firstPaymentMonth)) {
      throw new Error(
        `El mes ${input.firstPaymentMonth} no pertenece al periodo ${input.academicPeriod}. ` +
        `Meses válidos: ${validMonths.join(', ')}.`,
      );
    }

    // Regla: número de cuotas no puede superar el máximo del periodo
    const maxByPeriod = this.paramService.getMaxInstallments(
      input.academicPeriod,
      input.firstPaymentMonth,
    );
    // Tope adicional por modalidad: sin_interes → máx 3, con_interes → máx 6
    const capByMode     = input.interestMode === 'sin_interes' ? 3 : 6;
    const maxInstallments = Math.min(maxByPeriod, capByMode);
    if (input.numberOfPayments < 1 || input.numberOfPayments > maxInstallments) {
      throw new Error(
        `El número de cuotas debe estar entre 1 y ${maxInstallments} ` +
        `para el periodo ${input.academicPeriod} comenzando en mes ${input.firstPaymentMonth} ` +
        `con modalidad ${input.interestMode}.`,
      );
    }

    // Regla: valor financiado debe ser positivo
    const initialPayment = Money.of(input.initialPaymentValue);
    const financed       = netTuition.subtract(initialPayment);
    if (financed.amount <= 0) {
      throw new Error('El valor financiado debe ser mayor a 0.');
    }

    return this.engine.computeSummary(input, params, activeVersion);
  }
}
