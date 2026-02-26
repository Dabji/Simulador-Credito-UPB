// Dominio: Entidad principal de simulación de crédito educativo (HU-13).
// Agrupa todos los datos de una simulación calculada.

import { Money } from './Money';
import { SimulationRow } from './SimulationRow';
import type { InterestMode } from './InterestRate';
import type { StudentType, EducationLevel } from './ModalityRule';

export interface SimulationProps {
  readonly id: string;
  readonly studentType: StudentType;
  readonly educationLevel: EducationLevel;
  readonly tuitionGross: Money;
  readonly scholarshipPct: number;
  readonly tuitionNet: Money;
  readonly initialPaymentPct: number;
  readonly initialPayment: Money;
  readonly financedValue: Money;
  readonly interestMode: InterestMode;
  readonly academicPeriod: string;
  readonly firstPaymentMonth: number;
  readonly numberOfPayments: number;
  readonly periodicPayment: Money;
  readonly totalPaid: Money;
  readonly totalInterest: Money;
  readonly schedule: SimulationRow[];
  readonly createdAt: Date;
  readonly starred: boolean;
  readonly observations: string;
}

export class Simulation {
  private readonly _props: SimulationProps;

  private constructor(props: SimulationProps) {
    this._props = Object.freeze({ ...props });
  }

  static create(props: Omit<SimulationProps, 'createdAt'>): Simulation {
    return new Simulation({ ...props, createdAt: new Date() });
  }

  get id(): string                   { return this._props.id; }
  get studentType(): StudentType     { return this._props.studentType; }
  get educationLevel(): EducationLevel { return this._props.educationLevel; }
  get tuitionGross(): Money          { return this._props.tuitionGross; }
  get scholarshipPct(): number       { return this._props.scholarshipPct; }
  get tuitionNet(): Money            { return this._props.tuitionNet; }
  get initialPaymentPct(): number    { return this._props.initialPaymentPct; }
  get initialPayment(): Money        { return this._props.initialPayment; }
  get financedValue(): Money         { return this._props.financedValue; }
  get interestMode(): InterestMode   { return this._props.interestMode; }
  get academicPeriod(): string       { return this._props.academicPeriod; }
  get firstPaymentMonth(): number    { return this._props.firstPaymentMonth; }
  get numberOfPayments(): number     { return this._props.numberOfPayments; }
  get periodicPayment(): Money       { return this._props.periodicPayment; }
  get totalPaid(): Money             { return this._props.totalPaid; }
  get totalInterest(): Money         { return this._props.totalInterest; }
  get schedule(): SimulationRow[]    { return this._props.schedule; }
  get createdAt(): Date              { return this._props.createdAt; }
  get starred(): boolean             { return this._props.starred; }
  get observations(): string         { return this._props.observations; }
}
