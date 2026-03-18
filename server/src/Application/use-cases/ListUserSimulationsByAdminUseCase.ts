// ============================================================
// Use Case: ListUserSimulationsByAdminUseCase (HU-82)
// Lista las simulaciones de un usuario específico para admin.
// Retorna máx. 50, orden descendente por fecha de creación.
// ============================================================

import type { ISimulationRepository } from '../../Core/repositories/ISimulationRepository';
import type { AdminUserSimItemOutput } from '../dtos/AdminUserSimItemOutput';
import { NotFoundError } from '../../Core/errors';
import type { IUserRepository } from '../../Core/repositories/IUserRepository';

export class ListUserSimulationsByAdminUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly simulationRepo: ISimulationRepository,
  ) {}

  async execute(targetUserId: string): Promise<AdminUserSimItemOutput[]> {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new NotFoundError('Usuario');

    const simulations = await this.simulationRepo.findSummariesByUserId(targetUserId, 50);

    return simulations.map((sim) => ({
      id:               sim.id,
      academicPeriod:   sim.academicPeriod,
      numberOfPayments: sim.numberOfPayments,
      totalPaid:        sim.totalPaid,
      createdAt:        sim.createdAt.toISOString(),
    }));
  }
}
