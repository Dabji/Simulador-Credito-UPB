import { FrenchAmortizationStrategy } from '../strategies/FrenchAmortizationStrategy';
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
    interestMode: 'con_interes',
    academicPeriod: '2026-01',
    firstPaymentMonth: 2,
    numberOfPayments: 4,
    observations: '',
    starred: false,
    ...overrides,
  };
}

function makeActiveVersion(
  paymentCount: number,
  rateMonthly: number,
): ActiveParameterVersion {
  return {
    id: 'active-version',
    validFrom: '2026-01-01',
    validTo: null,
    installmentsWindowFrom: '2026-01-01',
    installmentsWindowTo: '2026-06-30',
    paymentPeriodDays: 30,
    initialPaymentRules: [],
    levelConfigs: [
      {
        id: `cfg-${paymentCount}`,
        levelScope: 'PREGRADO',
        isActive: true,
        validFrom: '2026-01-01',
        validTo: null,
        maxPaymentsSinInteres: 3,
        maxPaymentsConInteres: 6,
        paymentCount,
        rateMonthly,
      },
    ],
  };
}

describe('FrenchAmortizationStrategy', () => {
  let strategy: FrenchAmortizationStrategy;

  beforeEach(() => {
    strategy = new FrenchAmortizationStrategy();
  });

  it('retorna 0 cuando el principal es 0', () => {
    expect(strategy.computePeriodicPayment(0, 0.009, 6)).toBe(0);
  });

  it('retorna 0 cuando el número de cuotas es 0', () => {
    expect(strategy.computePeriodicPayment(8_000_000, 0.009, 0)).toBe(0);
  });

  it('cae a cuota lineal cuando la tasa es 0', () => {
    expect(strategy.computePeriodicPayment(8_000_000, 0, 4)).toBe(2_000_000);
  });

  it('cae a cuota lineal cuando la tasa es prácticamente 0', () => {
    expect(strategy.computePeriodicPayment(8_000_000, 1e-12, 4)).toBe(2_000_000);
  });

  it('retorna 0 cuando falta la tasa para el número de cuotas solicitado', () => {
    const input = makeInput({ numberOfPayments: 4 });
    const activeVersion = makeActiveVersion(6, 0.009);

    expect(strategy.resolveMonthlyRate(input, activeVersion)).toBe(0);
  });

  it('lanza error cuando no recibe una versión activa para resolver la tasa', () => {
    const input = makeInput();

    expect(() => strategy.resolveMonthlyRate(input)).toThrow(/versión de parámetros activa/);
  });
});
