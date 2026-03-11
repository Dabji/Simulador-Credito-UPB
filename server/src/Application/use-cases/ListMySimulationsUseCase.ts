// ============================================================
// Use Case: ListMySimulationsUseCase (HU-81)
// Lista las simulaciones del usuario autenticado.
// Retorna máx. 20, orden descendente por fecha.
// ============================================================

import type { ISimulationRepository } from '../../Core/repositories/ISimulationRepository';
import type { MySimulationItemOutput } from '../dtos/MySimulationItemOutput';
import { UnauthorizedError } from '../../Core/errors';

export class ListMySimulationsUseCase {
  constructor(private readonly simulationRepo: ISimulationRepository) {}

  async execute(userId: string): Promise<MySimulationItemOutput[]> {
    if (!userId) throw new UnauthorizedError('Usuario no identificado.');

    const simulations = await this.simulationRepo.findByUserId(userId);

    // Orden descendente (más reciente primero), límite 20
    return simulations
      .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
      .slice(0, 20)
      .map((sim) => ({
        id:              sim.id,
        academicPeriod:  sim.summary.academicPeriod,
        numberOfPayments: sim.summary.numberOfPayments,
        totalPaid:       sim.summary.totalPaid,
        createdAt:       sim.savedAt.toISOString(),
      }));
  }
}
