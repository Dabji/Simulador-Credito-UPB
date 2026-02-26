// Dominio: Entidad que representa una fila del plan de amortización.
// Llamada AmortizationRow en el diagrama; aquí se llama SimulationRow
// para no colisionar con la interfaz plana AmortizationRow de Credit.ts.

import { Money } from './Money';

export class SimulationRow {
  private readonly _period: number;
  private readonly _date: string;          // ISO "YYYY-MM-DD"
  private readonly _initialBalance: Money;
  private readonly _principal: Money;
  private readonly _interest: Money;
  private readonly _payment: Money;
  private readonly _finalBalance: Money;

  constructor(
    period: number,
    date: string,
    initialBalance: Money,
    principal: Money,
    interest: Money,
    payment: Money,
    finalBalance: Money,
  ) {
    this._period         = period;
    this._date           = date;
    this._initialBalance = initialBalance;
    this._principal      = principal;
    this._interest       = interest;
    this._payment        = payment;
    this._finalBalance   = finalBalance;
  }

  get period(): number         { return this._period; }
  get date(): string           { return this._date; }
  get initialBalance(): Money  { return this._initialBalance; }
  get principal(): Money       { return this._principal; }
  get interest(): Money        { return this._interest; }
  get payment(): Money         { return this._payment; }
  get finalBalance(): Money    { return this._finalBalance; }

  // Serializa para respuesta JSON
  toJSON(): {
    period: number;
    date: string;
    initialBalance: number;
    principal: number;
    interest: number;
    payment: number;
    finalBalance: number;
  } {
    return {
      period:         this._period,
      date:           this._date,
      initialBalance: this._initialBalance.amount,
      principal:      this._principal.amount,
      interest:       this._interest.amount,
      payment:        this._payment.amount,
      finalBalance:   this._finalBalance.amount,
    };
  }
}
