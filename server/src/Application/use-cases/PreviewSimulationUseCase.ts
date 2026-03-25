// Caso de uso: Calcular vista previa de simulación (HU-13, Criterio 2 y 3).
// Sin persistencia en DB — calcula y retorna el resultado en memoria.
// Sin autenticación requerida (endpoint público temporal para HU-13).

import { SimulationService } from '../services/SimulationService';
import type { IParameterVersionRepository } from '../../Core/repositories/IParameterVersionRepository';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { SimulationSummary } from '../dtos/SimulationSummary';
import { LEVEL_MAP } from '../dtos/constants';

export class PreviewSimulationUseCase {
  private readonly simulationService: SimulationService;

  constructor(private readonly paramRepo: IParameterVersionRepository) {
    this.simulationService = new SimulationService();
  }

  // Ejecuta la validación y cálculo; retorna el summary con tabla de amortización
  async execute(input: SimulationInput): Promise<SimulationSummary> {
    const activeVersion = await this.paramRepo.findActive();

    // HU-PV-01: Validar que el nivel académico no esté desactivado
    if (activeVersion) {
      const dbLevel = LEVEL_MAP[input.educationLevel];
      if (dbLevel) {
        const cfgs = activeVersion.levelConfigs.filter(c => c.levelScope === dbLevel);
        if (cfgs.length > 0 && cfgs.every(c => !c.isActive)) {
          throw new Error(
            `El nivel de formación "${input.educationLevel}" se encuentra temporalmente ` +
            'deshabilitado por lineamientos institucionales. Estará disponible nuevamente más adelante.',
          );
        }
      }
    }

    return this.simulationService.calculate(input, activeVersion ?? undefined);
  }
}
