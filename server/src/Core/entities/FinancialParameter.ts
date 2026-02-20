// ============================================================
// Entity: FinancialParameter (Domain Layer)
// Parámetros financieros configurables por el administrador.
// ============================================================

export interface FinancialParameterProps {
  id: string;
  name: string;             // ej: "tasa_interes_semestral"
  displayName: string;      // ej: "Tasa de Interés Semestral"
  value: number;
  minValue: number;
  maxValue: number;
  unit: string;             // ej: "percentage", "months", "COP"
  isActive: boolean;
  updatedBy: string;        // userId del admin que lo modificó
  createdAt: Date;
  updatedAt: Date;
}

export class FinancialParameter {
  private readonly props: FinancialParameterProps;

  private constructor(props: FinancialParameterProps) {
    this.props = Object.freeze({ ...props });
  }

  static create(
    props: Omit<FinancialParameterProps, 'createdAt' | 'updatedAt'>,
  ): FinancialParameter {
    FinancialParameter.validate(props);
    const now = new Date();
    return new FinancialParameter({ ...props, createdAt: now, updatedAt: now });
  }

  static reconstitute(props: FinancialParameterProps): FinancialParameter {
    return new FinancialParameter(props);
  }

  private static validate(
    props: Omit<FinancialParameterProps, 'createdAt' | 'updatedAt'>,
  ): void {
    if (props.value < props.minValue || props.value > props.maxValue) {
      throw new Error(
        `El valor debe estar entre ${props.minValue} y ${props.maxValue}`,
      );
    }
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get value(): number {
    return this.props.value;
  }

  get unit(): string {
    return this.props.unit;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  toJSON(): FinancialParameterProps {
    return { ...this.props };
  }
}
