// Dominio: Value Object que representa una tasa de interés mensual.
// Soporta los dos modos de HU-13: sin interés (0%) y con interés (0.9% M.V.).

export type InterestMode = 'sin_interes' | 'con_interes';

export class InterestRate {
  private readonly _monthlyRate: number;
  private readonly _mode: InterestMode;

  private constructor(monthlyRate: number, mode: InterestMode) {
    if (monthlyRate < 0 || monthlyRate > 1) {
      throw new Error(`InterestRate: tasa mensual inválida (${monthlyRate})`);
    }
    this._monthlyRate = monthlyRate;
    this._mode = mode;
  }

  // Regla: tasa mensual 0 para sin interés, 0.9% para con interés
  static fromMode(mode: InterestMode): InterestRate {
    const rate = mode === 'con_interes' ? 0.009 : 0;
    return new InterestRate(rate, mode);
  }

  get monthlyRate(): number {
    return this._monthlyRate;
  }

  get mode(): InterestMode {
    return this._mode;
  }

  get hasInterest(): boolean {
    return this._monthlyRate > 0;
  }
}
