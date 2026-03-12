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

    const simulations = await this.simulationRepo.findSummariesByUserId(userId, 20);

    return simulations.map((sim) => ({
      id:               sim.id,
      academicPeriod:   sim.academicPeriod,
      numberOfPayments: sim.numberOfPayments,
      totalPaid:        sim.totalPaid,
      createdAt:        sim.createdAt.toISOString(),
    }));
  }
}
