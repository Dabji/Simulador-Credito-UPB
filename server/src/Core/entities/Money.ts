// Dominio: Value Object para dinero en COP.
// Encapsula un valor monetario entero (sin decimales, política UPB).

export class Money {
  private readonly _amount: number;

  private constructor(amount: number) {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(`Money: valor inválido (${amount})`);
    }
    this._amount = Math.round(amount);
  }

  static of(amount: number): Money {
    return new Money(amount);
  }

  static zero(): Money {
    return new Money(0);
  }

  get amount(): number {
    return this._amount;
  }

  add(other: Money): Money {
    return new Money(this._amount + other._amount);
  }

  subtract(other: Money): Money {
    return new Money(Math.max(0, this._amount - other._amount));
  }

  multiplyByRate(rate: number): Money {
    return new Money(this._amount * rate);
  }

  // Formato COP para logs / respuestas
  toString(): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(this._amount);
  }
}
