// ============================================================
// Entity: Credit (Domain Layer)
// Representa una simulación de crédito educativo.
// ============================================================

export enum AmortizationType {
  FRENCH = 'FRENCH', // Sistema Francés (cuota fija)
}

export interface CreditProps {
  id: string;
  userId: string;
  amount: number;           // Monto del crédito en COP
  annualRate: number;       // Tasa de interés anual (ej: 0.12 = 12%)
  termMonths: number;       // Plazo en meses
  amortizationType: AmortizationType;
  monthlyPayment: number;   // Cuota mensual calculada
  totalInterest: number;    // Total de intereses
  totalPayment: number;     // Total a pagar (capital + intereses)
  createdAt: Date;
  updatedAt: Date;
}

export interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export class Credit {
  private readonly props: CreditProps;

  private constructor(props: CreditProps) {
    this.props = Object.freeze({ ...props });
  }

  // ── Factory ─────────────────────────────────────────────────
  static create(props: Omit<CreditProps, 'createdAt' | 'updatedAt'>): Credit {
    Credit.validate(props);
    const now = new Date();
    return new Credit({
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CreditProps): Credit {
    return new Credit(props);
  }

  // ── Validación de dominio ───────────────────────────────────
  private static validate(
    props: Omit<CreditProps, 'createdAt' | 'updatedAt'>,
  ): void {
    if (props.amount <= 0) {
      throw new Error('El monto del crédito debe ser mayor a 0');
    }
    if (props.annualRate <= 0 || props.annualRate > 1) {
      throw new Error('La tasa anual debe estar entre 0 y 1 (ej: 0.12 = 12%)');
    }
    if (props.termMonths < 1 || props.termMonths > 120) {
      throw new Error('El plazo debe estar entre 1 y 120 meses');
    }
  }

  // ── Getters ─────────────────────────────────────────────────
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get annualRate(): number {
    return this.props.annualRate;
  }

  get termMonths(): number {
    return this.props.termMonths;
  }

  get amortizationType(): AmortizationType {
    return this.props.amortizationType;
  }

  get monthlyPayment(): number {
    return this.props.monthlyPayment;
  }

  get totalInterest(): number {
    return this.props.totalInterest;
  }

  get totalPayment(): number {
    return this.props.totalPayment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): CreditProps {
    return { ...this.props };
  }
}
