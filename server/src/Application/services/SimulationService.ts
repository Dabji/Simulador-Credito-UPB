// Servicio: orquesta la validación, cálculo y retorno de una simulación.
// Usa ParameterService para obtener parámetros vigentes y SimulationEngine
// para realizar los cálculos financieros.

import { InitialPaymentRule } from '../../Core/entities/InitialPaymentRule';
import { Money } from '../../Core/entities/Money';
import { ParameterService } from './ParameterService';
import { SimulationEngine } from './SimulationEngine';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { SimulationSummary } from '../dtos/SimulationSummary';
import type { ActiveParameterVersion } from '../../Core/repositories/IParameterVersionRepository';
import { LEVEL_MAP } from '../dtos/constants';

/** Obtiene el sinMax activo para un nivel desde levelConfigs */
function getSinMax(
  activeVersion: ActiveParameterVersion | null | undefined,
  dbLevel: string | null | undefined,
): number | null {
  if (!activeVersion || !dbLevel) return null;
  const cfgs = activeVersion.levelConfigs.filter(c => c.levelScope === dbLevel && c.isActive);
  if (cfgs.length === 0) return null;
  return cfgs[0].maxPaymentsSinInteres ?? null;
}

/** Obtiene el conMax activo para un nivel desde levelConfigs */
function getConMax(
  activeVersion: ActiveParameterVersion | null | undefined,
  dbLevel: string | null | undefined,
): number | null {
  if (!activeVersion || !dbLevel) return null;
  const cfgs = activeVersion.levelConfigs.filter(c => c.levelScope === dbLevel && c.isActive);
  if (cfgs.length === 0) return null;
  return cfgs[0].maxPaymentsConInteres ?? null;
}

/** Obtiene el porcentaje mínimo de cuota inicial desde initialPaymentRules */
function getMinInitialPct(
  activeVersion: ActiveParameterVersion | null | undefined,
  dbLevel: string | null | undefined,
  effectiveMode: string,
): number | null {
  if (!activeVersion || !dbLevel) return null;
  const dbModality = effectiveMode === 'sin_interes' ? 'SIN_INTERES' : 'CON_INTERES';
  const rule = activeVersion.initialPaymentRules.find(
    r => r.level === dbLevel && r.modality === dbModality,
  );
  return rule ? rule.initialPctRequired * 100 : null;
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
    // HU-PV-02: Derivar modalidad efectiva desde levelConfigs si existen, sino fallback #59
    const modeForRule = this.deriveEffectiveMode(input, activeVersion, dbLevel);
    const minPct = getMinInitialPct(activeVersion, dbLevel, modeForRule);
    if (minPct !== null) {
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

    // HU-PV-02: Modalidad efectiva derivada desde parametrización real
    const effectiveMode = this.deriveEffectiveMode(input, activeVersion, dbLevel);

    // Regla: número de cuotas no puede superar el máximo del periodo
    const maxByPeriod = this.paramService.getMaxInstallments(
      input.academicPeriod,
      input.firstPaymentMonth,
    );

    // Tope por modalidad: leer desde levelConfigs si está disponible, sino usar fallback hardcodeado
    const capByMode = effectiveMode === 'sin_interes'
      ? (getSinMax(activeVersion, dbLevel) ?? 3)
      : (getConMax(activeVersion, dbLevel) ?? 6);

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
    if (initialPayment.amount > netTuition.amount) {
      throw new Error('El valor de cuota inicial supera la matrícula neta.');
    }
    const financed = netTuition.subtract(initialPayment);
    // numberOfPayments=1 significa cuota inicial = 100% (sin plan de cuotas), permitido
    if (financed.amount === 0 && input.numberOfPayments > 1) {
      throw new Error('El valor financiado es 0 pero se indicaron más de 1 cuota.');
    }

    return this.engine.computeSummary(input, params, activeVersion);
  }

  // HU-PV-02: Deriva la modalidad efectiva desde levelConfigs si existen, sino fallback #59
  private deriveEffectiveMode(
    input: SimulationInput,
    activeVersion: ActiveParameterVersion | undefined,
    dbLevel: string | null | undefined,
  ): string {
    const sinMax = getSinMax(activeVersion, dbLevel);
    if (sinMax !== null) {
      // La modalidad se determina por el límite sin interés, no por la tasa
      return input.numberOfPayments <= sinMax ? 'sin_interes' : 'con_interes';
    }
    // Fallback #59: regla legacy si no hay levelConfigs
    if (input.interestMode === 'con_interes' && input.numberOfPayments <= 3) {
      return 'sin_interes';
    }
    return input.interestMode;
  }
}
