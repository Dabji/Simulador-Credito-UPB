// ============================================================
// Use Case: GetSimulationByIdAdminUseCase (HU-43)
// Retorna el detalle completo de una simulación para el admin,
// incluyendo cronograma de amortización y datos del estudiante.
// ============================================================

import { NotFoundError } from '../../Core/errors';
import type { ISimulationRepository, PersistedSimulationWithUser } from '../../Core/repositories/ISimulationRepository';

export class GetSimulationByIdAdminUseCase {
  constructor(private readonly simulationRepo: ISimulationRepository) {}

  async execute(simulationId: string): Promise<PersistedSimulationWithUser> {
    const simulation = await this.simulationRepo.findByIdWithUser(simulationId);
    if (!simulation) {
      throw new NotFoundError('Simulación no encontrada.');
    }
    return simulation;
  }
}
