// DTO: AdminUserSimItemOutput (HU-82)
// Ítem de simulación de un usuario visto desde el panel admin.

export interface AdminUserSimItemOutput {
  readonly id: string;
  readonly academicPeriod: string;
  readonly numberOfPayments: number;
  readonly totalPaid: number;
  readonly createdAt: string; // ISO date string
}
