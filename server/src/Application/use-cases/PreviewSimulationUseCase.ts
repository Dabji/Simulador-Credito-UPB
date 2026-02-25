// Caso de uso: Calcular vista previa de simulación (HU-13, Criterio 2 y 3).
// Sin persistencia en DB — calcula y retorna el resultado en memoria.
// Sin autenticación requerida (endpoint público temporal para HU-13).

import { SimulationService } from '../services/SimulationService';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { SimulationSummary } from '../dtos/SimulationSummary';

export class PreviewSimulationUseCase {
  private readonly simulationService: SimulationService;

  constructor() {
    this.simulationService = new SimulationService();
  }

  // Ejecuta la validación y cálculo; retorna el summary con tabla de amortización
  execute(input: SimulationInput): SimulationSummary {
    return this.simulationService.calculate(input);
  }
}
