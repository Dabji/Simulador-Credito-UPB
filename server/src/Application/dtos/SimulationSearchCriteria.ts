// DTO: Criterios de búsqueda de simulaciones (stub — pendiente implementación completa).
// Reservado para HU futura de consulta/historial de simulaciones.

import type { InterestMode } from '../../Core/entities/InterestRate';
import type { StudentType } from '../../Core/entities/ModalityRule';

export interface SimulationSearchCriteria {
  readonly studentType?: StudentType;
  readonly interestMode?: InterestMode;
  readonly academicPeriod?: string;
  readonly starred?: boolean;
  readonly fromDate?: Date;
  readonly toDate?: Date;
}
