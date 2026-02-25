// Dominio: Versión activa de parámetros del simulador.
// Agrupa todas las reglas vigentes para un período de cálculo.
// Sin BD por ahora: se instancia con valores hardcode en ParameterService.

export type PeriodCode = `${number}-01` | `${number}-02`;

export interface PeriodRange {
  readonly startMonth: number; // mes inicio (1-12)
  readonly endMonth: number;   // mes fin   (1-12)
}

export class ParameterVersion {
  private readonly _id: string;
  private readonly _interestRateMonthly: number;     // 0.009 para con_interes
  private readonly _minInitialPaymentPct: number;    // 20
  private readonly _maxInstallments: number;         // 6 (semestre = 6 meses)
  private readonly _installmentIntervalDays: number; // 30

  constructor(
    id: string,
    interestRateMonthly: number,
    minInitialPaymentPct: number,
    maxInstallments: number,
    installmentIntervalDays: number,
  ) {
    this._id                      = id;
    this._interestRateMonthly     = interestRateMonthly;
    this._minInitialPaymentPct    = minInitialPaymentPct;
    this._maxInstallments         = maxInstallments;
    this._installmentIntervalDays = installmentIntervalDays;
  }

  get id(): string { return this._id; }
  get interestRateMonthly(): number { return this._interestRateMonthly; }
  get minInitialPaymentPct(): number { return this._minInitialPaymentPct; }
  get maxInstallments(): number { return this._maxInstallments; }
  get installmentIntervalDays(): number { return this._installmentIntervalDays; }

  // Regla: periodos académicos y meses válidos
  // YYYY-01 cubre Diciembre(año-1) a Mayo(año) → meses 12,1,2,3,4,5
  // YYYY-02 cubre Junio a Noviembre(año)        → meses 6,7,8,9,10,11
  static getMonthsForPeriod(period: string): number[] {
    const [yearStr, sem] = period.split('-');
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) throw new Error(`Periodo inválido: ${period}`);

    if (sem === '01') {
      // Dic(año-1) = 12, luego Ene-May del año = 1..5
      return [12, 1, 2, 3, 4, 5];
    } else if (sem === '02') {
      return [6, 7, 8, 9, 10, 11];
    }
    throw new Error(`Semestre inválido en periodo: ${period}`);
  }

  // Calcula cuántas cuotas hay desde el mes elegido hasta el fin del periodo (inclusivo)
  static maxInstallmentsFromMonth(period: string, firstPaymentMonth: number): number {
    const months = ParameterVersion.getMonthsForPeriod(period);
    const idx = months.indexOf(firstPaymentMonth);
    if (idx === -1) {
      throw new Error(
        `El mes ${firstPaymentMonth} no pertenece al periodo ${period}.`,
      );
    }
    return months.length - idx;
  }
}
