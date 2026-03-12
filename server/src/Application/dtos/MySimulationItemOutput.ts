// DTO: MySimulationItemOutput (HU-81)
// Ítem de simulación devuelto al listar las simulaciones del usuario.

export interface MySimulationItemOutput {
  readonly id: string;
  readonly academicPeriod: string;
  readonly numberOfPayments: number;
  readonly totalPaid: number;
  readonly createdAt: string; // ISO date string
}
