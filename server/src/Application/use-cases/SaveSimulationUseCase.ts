// ============================================================
// Use Case: SaveSimulationUseCase
// Persiste una simulación calculada en la BD (tabla simulations
// + amortization_rows) asociada al usuario autenticado.
// ============================================================

import type { ISimulationRepository, SaveSimulationData } from '../../Core/repositories/ISimulationRepository';
import type { IParameterVersionRepository } from '../../Core/repositories/IParameterVersionRepository';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { SimulationSummary } from '../dtos/SimulationSummary';
import { SimulationService } from '../services/SimulationService';
import { BadRequestError, NotFoundError } from '../../Core/errors';
import { LEVEL_MAP } from '../dtos/constants';

const STUDENT_TYPE_MAP: Record<string, 'NUEVO' | 'CONTINUO'> = {
  nuevo:    'NUEVO',
  continuo: 'CONTINUO',
};

const MODALITY_MAP: Record<string, 'SIN_INTERES' | 'CON_INTERES'> = {
  sin_interes: 'SIN_INTERES',
  con_interes: 'CON_INTERES',
};

export class SaveSimulationUseCase {
  constructor(
    private readonly simulationRepo: ISimulationRepository,
    private readonly paramRepo: IParameterVersionRepository,
  ) {}

  async execute(
    input: SimulationInput,
    userId: string,
  ): Promise<{ id: string; savedAt: Date; summary: SimulationSummary }> {
    // 1. Obtener versión activa de parámetros
    const activeVersion = await this.paramRepo.findActive();
    if (!activeVersion) {
      throw new NotFoundError(
        'No hay una versión de parámetros activa. Contacte al administrador.',
      );
    }

    // 2. Validar tasa aplicada según nivel (antes del cálculo)
    const dbLevel = LEVEL_MAP[input.educationLevel];
    if (!dbLevel) throw new BadRequestError(`Nivel educativo inválido: ${input.educationLevel}`);

    const rateEntry = activeVersion.interestRates.find(r => r.levelScope === dbLevel);
    if (input.interestMode === 'con_interes' && (!rateEntry || rateEntry.rateMonthly == null)) {
      throw new NotFoundError(
        'La versión de parámetros activa no define una tasa de interés para este nivel',
      );
    }
    const appliedRate = input.interestMode === 'con_interes'
      ? rateEntry!.rateMonthly
      : 0;

    // 3. Calcular la simulación (valida reglas de negocio)
    const simulationService = new SimulationService();
    const summary = simulationService.calculate(input, activeVersion);

    // 4. Construir fecha de primer pago
    const firstPaymentDate = summary.schedule.length > 0
      ? summary.schedule[0].date
      : new Date().toISOString().slice(0, 10);

    // 5. Preparar datos para el repositorio
    const data: SaveSimulationData = {
      id: summary.id,
      userId,
      parameterVersionId: activeVersion.id,
      studentType: STUDENT_TYPE_MAP[input.studentType] ?? 'NUEVO',
      level: dbLevel,
      modality: MODALITY_MAP[input.interestMode] ?? 'SIN_INTERES',
      tuitionGross: summary.tuitionGross,
      scholarPct: input.scholarshipPct / 100,        // porcentaje → decimal
      tuitionNet: summary.tuitionNet,
      initialPaymentPct: input.initialPaymentPct / 100, // porcentaje → decimal
      initialPaymentValue: summary.initialPayment,
      totalPayments: summary.numberOfPayments,
      firstPaymentDate,
      financedValue: summary.financedValue,
      periodicPaymentValue: summary.periodicPayment,
      totalInterest: summary.totalInterest,
      totalPaid: summary.totalPaid,
      appliedRateMonthly: appliedRate,
      studentObservation: input.observations || null,
      schedule: summary.schedule,
    };

    // 6. Persistir en BD (transacción)
    const result = await this.simulationRepo.save(data);

    return { id: result.id, savedAt: result.savedAt, summary };
  }
}
