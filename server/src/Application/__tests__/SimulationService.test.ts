import { SimulationService } from '../services/SimulationService';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { ActiveParameterVersion } from '../../Core/repositories/IParameterVersionRepository';

function makeInput(overrides: Partial<SimulationInput> = {}): SimulationInput {
  return {
    studentType: 'nuevo',
    educationLevel: 'pregrado',
    tuitionGross: 10_000_000,
    scholarshipPct: 0,
    initialPaymentPct: 20,
    initialPaymentValue: 2_000_000,
    interestMode: 'sin_interes',
    academicPeriod: '2026-01',
    firstPaymentMonth: 2,
    numberOfPayments: 3,
    observations: '',
    starred: false,
    ...overrides,
  };
}

function makeActiveVersionWithRule(
  level: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech',
  modality: 'SIN_INTERES' | 'CON_INTERES',
  initialPctRequired: number,
): ActiveParameterVersion {
  return {
    id: 'active-version',
    validFrom: '2026-01-01',
    validTo: null,
    installmentsWindowFrom: '2026-01-01',
    installmentsWindowTo: '2026-06-30',
    paymentPeriodDays: 30,
    initialPaymentRules: [
      {
        level,
        modality,
        extraInstallments: 0,
        initialPctRequired,
      },
    ],
    levelConfigs: [],
  };
}

describe('SimulationService', () => {
  let service: SimulationService;

  beforeEach(() => {
    service = new SimulationService();
  });

  it('rechaza pregrado cuando la cuota inicial es menor al 20%', () => {
    const input = makeInput({
      initialPaymentPct: 19,
      initialPaymentValue: 1_900_000,
    });

    expect(() => service.calculate(input)).toThrow(
      'La cuota inicial debe ser al menos 20% del valor neto de matrícula para pregrado.',
    );
  });

  it('rechaza UPB Tech cuando la cuota inicial es menor al 15%', () => {
    const input = makeInput({
      educationLevel: 'upbTech',
      tuitionGross: 4_000_000,
      initialPaymentPct: 14,
      initialPaymentValue: 560_000,
    });

    expect(() => service.calculate(input)).toThrow(
      'La cuota inicial debe ser al menos 15% del valor neto de matrícula para upbTech.',
    );
  });

  it('usa la regla institucional activa cuando existe una cuota inicial mínima más estricta', () => {
    const input = makeInput({
      initialPaymentPct: 24,
      initialPaymentValue: 2_400_000,
    });
    const activeVersion = makeActiveVersionWithRule('PREGRADO', 'SIN_INTERES', 0.25);

    expect(() => service.calculate(input, activeVersion)).toThrow(
      'La cuota inicial debe ser al menos 25% del valor neto de matrícula para pregrado.',
    );
  });

  it('rechaza un mes de primera cuota que no pertenece al periodo académico', () => {
    const input = makeInput({
      academicPeriod: '2026-01',
      firstPaymentMonth: 7,
    });

    expect(() => service.calculate(input)).toThrow(/El mes 7 no pertenece al periodo 2026-01/);
  });

  it('rechaza cuando la cuota inicial supera la matrícula neta', () => {
    const input = makeInput({
      initialPaymentPct: 100,
      initialPaymentValue: 10_500_000,
      numberOfPayments: 1,
    });

    expect(() => service.calculate(input)).toThrow(
      'El valor de cuota inicial supera la matrícula neta.',
    );
  });

  it('rechaza cuando el valor financiado es 0 pero se solicitan más cuotas', () => {
    const input = makeInput({
      initialPaymentPct: 100,
      initialPaymentValue: 10_000_000,
      numberOfPayments: 2,
    });

    expect(() => service.calculate(input)).toThrow(
      'El valor financiado es 0 pero se indicaron más de 1 cuota.',
    );
  });
});
