// Servicio: orquesta la validación, cálculo y retorno de una simulación.
// Usa ParameterService para obtener parámetros vigentes y SimulationEngine
// para realizar los cálculos financieros.

import { InitialPaymentRule } from '../../Core/entities/InitialPaymentRule';
import { Money } from '../../Core/entities/Money';
import { ParameterService } from './ParameterService';
import { SimulationEngine } from './SimulationEngine';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { SimulationSummary } from '../dtos/SimulationSummary';
import type { ActiveParameterVersion, ActiveModalityRule } from '../../Core/repositories/IParameterVersionRepository';
import { LEVEL_MAP } from '../dtos/constants';

function findModalityRule(
  activeVersion: ActiveParameterVersion | null | undefined,
  dbLevel: string | null | undefined,
  effectiveMode: string,
): ActiveModalityRule | undefined {
  if (!activeVersion || !dbLevel) return undefined;
  const dbModality = effectiveMode === 'sin_interes' ? 'SIN_INTERES' : 'CON_INTERES';
  return activeVersion.modalityRules.find(
    r => r.level === dbLevel && r.modality === dbModality,
  );
}

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

    // #57 — UPB Tech: beca/descuento no aplica; se normaliza a 0 para todas las validaciones
    // Estudiante nuevo/continuo: SÍ puede tener beca/descuento
    const effectiveScholarshipPct = input.educationLevel === 'upbTech' ? 0 : input.scholarshipPct;

    // Regla: cuota inicial mínima — usar parámetros de BD si están disponibles
    const dbLevel = LEVEL_MAP[input.educationLevel];
    // #59 — Modalidad efectiva anticipada para leer la regla de cuota inicial correcta
    const modeForRule = input.interestMode === 'con_interes' && input.numberOfPayments <= 3
      ? 'sin_interes'
      : input.interestMode;
    const initialModalityRule = findModalityRule(activeVersion, dbLevel, modeForRule);
    if (initialModalityRule) {
      const minPct = initialModalityRule.minInitialPct * 100; // decimal → porcentaje
      if (input.initialPaymentPct < minPct) {
        throw new Error(
          `La cuota inicial debe ser al menos ${minPct}% del valor neto de matrícula para ${input.educationLevel}.`,
        );
      }
    } else {
      // Fallback: validación hardcodeada (15% upbTech, 20% pregrado/posgrado)
      InitialPaymentRule.validatePct(input.initialPaymentPct, input.educationLevel);
    }

    // Regla: tuición bruta debe ser positiva
    if (input.tuitionGross <= 0) {
      throw new Error('El valor de matrícula debe ser mayor a 0.');
    }

    // Regla: tuición neta debe ser positiva (usa scholarship efectivo para upbTech)
    const netTuition = Money.of(input.tuitionGross * (1 - effectiveScholarshipPct / 100));
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

    // #59 — Modalidad efectiva: forzar sin_interes si con_interes + cuotas <= 3
    const effectiveMode = input.interestMode === 'con_interes' && input.numberOfPayments <= 3
      ? 'sin_interes'
      : input.interestMode;

    // Regla: número de cuotas no puede superar el máximo del periodo
    const maxByPeriod = this.paramService.getMaxInstallments(
      input.academicPeriod,
      input.firstPaymentMonth,
    );

    // Tope por modalidad: leer desde BD si está disponible, sino usar fallback hardcodeado
    const capModalityRule = findModalityRule(activeVersion, dbLevel, effectiveMode);
    const capByMode = capModalityRule
      ? capModalityRule.maxTotalPayments
      : (effectiveMode === 'sin_interes' ? 3 : 6);

    const maxInstallments = Math.min(maxByPeriod, capByMode);
    if (input.numberOfPayments < 1 || input.numberOfPayments > maxInstallments) {
      throw new Error(
        `El número de cuotas debe estar entre 1 y ${maxInstallments} ` +
        `para el periodo ${input.academicPeriod} comenzando en mes ${input.firstPaymentMonth} ` +
        `con modalidad ${effectiveMode}.`,
      );
    }

    // Regla: valor financiado debe ser positivo
    const initialPayment = Money.of(input.initialPaymentValue);
    const financed       = netTuition.subtract(initialPayment);
    // numberOfPayments=1 significa cuota inicial = 100% (sin plan de cuotas), permitido
    if (financed.amount < 0) {
      throw new Error('El valor de cuota inicial supera la matrícula neta.');
    }
    if (financed.amount === 0 && input.numberOfPayments > 1) {
      throw new Error('El valor financiado es 0 pero se indicaron más de 1 cuota.');
    }

    return this.engine.computeSummary(input, params, activeVersion);
  }
}
