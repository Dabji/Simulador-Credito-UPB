// ============================================================
// Unit Tests: SimulationEngine
// Verifica la exactitud matemática de los cálculos financieros
// (amortización francesa, redondeos, reglas de negocio).
// ============================================================

import { SimulationEngine } from '../services/SimulationEngine';
import { ParameterVersion } from '../../Core/entities/ParameterVersion';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { ActiveParameterVersion, ActiveLevelConfig } from '../../Core/repositories/IParameterVersionRepository';

// ── Helpers ──────────────────────────────────────────────────

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
    numberOfPayments: 4,
    observations: '',
    starred: false,
    ...overrides,
  };
}

function makeDummyParams(): ParameterVersion {
  return new ParameterVersion(
    'test-version-id',
    0.009,    // interestRateMonthly
    20,       // minInitialPaymentPct
    6,        // maxInstallments
    30,       // installmentIntervalDays
  );
}

/** Construye una entrada plana ActiveLevelConfig para un (levelScope × paymentCount). */
function makeFlatLevelConfig(
  levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech',
  paymentCount: number,
  rateMonthly: number,
  maxPaymentsSinInteres = 3,
  maxPaymentsConInteres = 6,
  isActive = true,
): ActiveLevelConfig {
  return {
    id: `lc-${levelScope}-${paymentCount}`,
    levelScope,
    isActive,
    validFrom: '2026-01-01',
    validTo: null,
    maxPaymentsSinInteres,
    maxPaymentsConInteres,
    paymentCount,
    rateMonthly,
  };
}

/**
 * Genera un ActiveParameterVersion con levelConfigs planos (1 fila por paymentCount 1..maxCon).
 * paymentCount <= maxSin → rateMonthly=0 (sin_interes); > maxSin → rateForCon.
 */
function makeActiveVersionWithLevelConfigs(
  levelScope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech' = 'PREGRADO',
  maxSin = 3,
  maxCon = 6,
  rateForCon = 0.009,
): ActiveParameterVersion {
  const configs: ActiveLevelConfig[] = [];
  for (let pc = 1; pc <= maxCon; pc++) {
    configs.push(makeFlatLevelConfig(levelScope, pc, pc <= maxSin ? 0 : rateForCon, maxSin, maxCon));
  }
  return {
    id: 'test-version-id',
    validFrom: '2026-01-01',
    validTo: null,
    installmentsWindowFrom: '2026-01-01',
    installmentsWindowTo: '2026-06-30',
    paymentPeriodDays: 30,
    initialPaymentRules: [],
    levelConfigs: configs,
  };
}

function makeActiveVersion(): ActiveParameterVersion {
  return makeActiveVersionWithLevelConfigs('PREGRADO', 3, 6, 0.009);
}

// ── Tests ────────────────────────────────────────────────────

describe('SimulationEngine', () => {
  let engine: SimulationEngine;
  let dummyParams: ParameterVersion;

  beforeEach(() => {
    engine = new SimulationEngine();
    dummyParams = makeDummyParams();
  });

  // ── Sin interés ───────────────────────────────────────────

  describe('Sin interés (cuota lineal)', () => {
    it('debe generar numberOfPayments-1 filas en la tabla (#58)', () => {
      const input = makeInput({ numberOfPayments: 4 });
      const summary = engine.computeSummary(input, dummyParams);
      expect(summary.schedule).toHaveLength(3); // 4-1 = 3 cuotas en el plan
    });

    it('debe calcular cuota lineal = financedValue / (n-1)', () => {
      const input = makeInput({
        tuitionGross: 10_000_000,
        scholarshipPct: 0,
        initialPaymentValue: 2_000_000,
        numberOfPayments: 4,
        interestMode: 'sin_interes',
      });
      const summary = engine.computeSummary(input, dummyParams);
      // financedValue = 10M - 2M = 8M;  cuota = 8M / 3 ≈ 2_666_667
      const expectedPayment = Math.round(8_000_000 / 3);
      expect(summary.periodicPayment).toBe(expectedPayment);
    });

    it('debe tener interest = 0 en todas las filas sin interés', () => {
      const input = makeInput({ interestMode: 'sin_interes' });
      const summary = engine.computeSummary(input, dummyParams);
      summary.schedule.forEach(row => {
        expect(row.interest).toBe(0);
      });
      expect(summary.totalInterest).toBe(0);
    });

    it('la última fila debe tener finalBalance = 0', () => {
      const input = makeInput({ numberOfPayments: 6, interestMode: 'sin_interes' });
      const summary = engine.computeSummary(input, dummyParams);
      const lastRow = summary.schedule[summary.schedule.length - 1];
      expect(lastRow.finalBalance).toBe(0);
    });

    it('totalPaid debe incluir la cuota inicial + suma del plan', () => {
      const input = makeInput({
        tuitionGross: 5_000_000,
        initialPaymentValue: 1_000_000,
        numberOfPayments: 3,
        interestMode: 'sin_interes',
      });
      const summary = engine.computeSummary(input, dummyParams);
      const planSum = summary.schedule.reduce((s, r) => s + r.payment, 0);
      expect(summary.totalPaid).toBe(Math.round(1_000_000 + planSum));
    });

    it('numberOfPayments=1 debe producir schedule vacío (solo cuota inicial)', () => {
      const input = makeInput({ numberOfPayments: 1 });
      const summary = engine.computeSummary(input, dummyParams);
      expect(summary.schedule).toHaveLength(0);
      expect(summary.periodicPayment).toBe(0);
    });
  });

  // ── Con interés (sistema francés) ─────────────────────────

  describe('Con interés (Sistema Francés)', () => {
    it('debe calcular cuota fija con fórmula M = P*r*(1+r)^n / ((1+r)^n - 1)', () => {
      const P = 8_000_000;
      const r = 0.009;
      const n = 3;
      const factor = Math.pow(1 + r, n);
      const expectedM = (P * r * factor) / (factor - 1);

      const input = makeInput({
        numberOfPayments: 4,
        interestMode: 'con_interes',
      });
      const activeVersion = makeActiveVersion();
      const summary = engine.computeSummary(input, dummyParams, activeVersion);
      expect(summary.periodicPayment).toBe(Math.round(expectedM));
    });

    it('interest en cada fila debe ser round(balance * tasa)', () => {
      const input = makeInput({
        numberOfPayments: 4,
        interestMode: 'con_interes',
      });
      const activeVersion = makeActiveVersion();
      const summary = engine.computeSummary(input, dummyParams, activeVersion);

      let balance = summary.financedValue;
      for (const row of summary.schedule) {
        const expectedInterest = Math.round(balance * 0.009);
        expect(row.interest).toBe(expectedInterest);
        const principal = Math.round(summary.periodicPayment - row.interest);
        balance = Math.max(0, balance - principal);
      }
    });

    it('totalInterest debe ser la suma de todos los intereses del plan', () => {
      const input = makeInput({
        numberOfPayments: 6,
        interestMode: 'con_interes',
      });
      const activeVersion = makeActiveVersion();
      const summary = engine.computeSummary(input, dummyParams, activeVersion);
      const sumInterest = summary.schedule.reduce((s, r) => s + r.interest, 0);
      expect(summary.totalInterest).toBe(Math.round(sumInterest));
    });

    it('totalPaid debe incluir la cuota inicial más la suma de cuotas con interés', () => {
      const input = makeInput({
        numberOfPayments: 6,
        interestMode: 'con_interes',
      });
      const activeVersion = makeActiveVersion();
      const summary = engine.computeSummary(input, dummyParams, activeVersion);
      const planSum = summary.schedule.reduce((s, r) => s + r.payment, 0);
      expect(summary.totalPaid).toBe(Math.round(summary.initialPayment + planSum));
    });

    it('la última fila debe tener finalBalance = 0 (absorbe residuo de redondeo)', () => {
      const input = makeInput({
        tuitionGross: 7_777_777,
        initialPaymentValue: 1_555_555,
        numberOfPayments: 8,
        interestMode: 'con_interes',
      });
      const activeVersion = makeActiveVersion();
      const summary = engine.computeSummary(input, dummyParams, activeVersion);
      const lastRow = summary.schedule[summary.schedule.length - 1];
      expect(lastRow.finalBalance).toBe(0);
    });

    it('debe lanzar error si no hay activeVersion para con_interes', () => {
      const input = makeInput({ interestMode: 'con_interes' });
      expect(() => engine.computeSummary(input, dummyParams)).toThrow(
        /versión de parámetros activa/,
      );
    });

    it('debe usar la tasa de posgrado cuando educationLevel=posgrado', () => {
      const input = makeInput({
        educationLevel: 'posgrado',
        interestMode: 'con_interes',
        numberOfPayments: 4,
      });
      const activeVersion = makeActiveVersionWithLevelConfigs('POSGRADO', 3, 6, 0.015);
      const summary = engine.computeSummary(input, dummyParams, activeVersion);
      // Verify first row interest uses posgrado rate from levelConfigs
      const expectedFirstInterest = Math.round(summary.financedValue * 0.015);
      expect(summary.schedule[0].interest).toBe(expectedFirstInterest);
    });
  });

  // ── HU-PV-02: modalidad y tasa desde levelConfigs ─────────

  describe('HU-PV-02 — Modalidad derivada desde levelConfigs', () => {
    it('debe forzar sin_interes cuando numberOfPayments <= maxPaymentsSinInteres', () => {
      const input = makeInput({ interestMode: 'con_interes', numberOfPayments: 3 });
      const av = makeActiveVersionWithLevelConfigs();
      const summary = engine.computeSummary(input, dummyParams, av);
      expect(summary.interestMode).toBe('sin_interes');
      expect(summary.totalInterest).toBe(0);
    });

    it('debe forzar con_interes cuando numberOfPayments > maxPaymentsSinInteres', () => {
      const input = makeInput({ interestMode: 'sin_interes', numberOfPayments: 4 });
      const av = makeActiveVersionWithLevelConfigs();
      const summary = engine.computeSummary(input, dummyParams, av);
      expect(summary.interestMode).toBe('con_interes');
      expect(summary.totalInterest).toBeGreaterThan(0);
    });

    it('debe usar la tasa de levelConfigs en lugar de interestRates', () => {
      const rateLC = 0.012; // distinta a interestRates (0.009)
      const P = 8_000_000;
      const n = 3; // planN = numberOfPayments(4) - 1
      const factor = Math.pow(1 + rateLC, n);
      const expectedM = (P * rateLC * factor) / (factor - 1);

      const input = makeInput({ numberOfPayments: 4, interestMode: 'con_interes' });
      const av = makeActiveVersionWithLevelConfigs('PREGRADO', 3, 6, rateLC);
      const summary = engine.computeSummary(input, dummyParams, av);
      expect(summary.periodicPayment).toBe(Math.round(expectedM));
    });

    it('debe ignorar configs inactivos y caer en fallback legacy (sin_interes <= 3)', () => {
      const input = makeInput({ numberOfPayments: 4, interestMode: 'con_interes' });
      const avInactive: ActiveParameterVersion = {
        ...makeActiveVersion(),
        levelConfigs: [
          makeFlatLevelConfig('PREGRADO', 4, 0.999, 3, 6, false), // isActive=false
        ],
      };
      // Solo hay cfg inactivo → cfgs.filter(isActive) = [] → fallback #59: numberOfPayments(4) > 3 → con_interes
      // El motor usa r=0 (rateMonthly del cfg inactivo no se aplica) → interest = 0
      const summary = engine.computeSummary(input, dummyParams, avInactive);
      expect(summary.interestMode).toBe('con_interes');
    });
  });

  // ── Reglas de negocio ─────────────────────────────────────

  describe('Reglas de negocio', () => {
    it('#57 — upbTech debe ignorar beca (scholarshipPct → 0)', () => {
      const input = makeInput({
        educationLevel: 'upbTech',
        scholarshipPct: 50,
        tuitionGross: 4_000_000,
        initialPaymentValue: 800_000,
      });
      const summary = engine.computeSummary(input, dummyParams);
      // Sin beca: tuitionNet = tuitionGross
      expect(summary.tuitionNet).toBe(4_000_000);
      expect(summary.scholarshipPct).toBe(0);
    });

    it('#59 — forzar sin_interes si numberOfPayments <= 3 y se envió con_interes', () => {
      const input = makeInput({
        interestMode: 'con_interes',
        numberOfPayments: 3,
      });
      const activeVersion = makeActiveVersion();
      const summary = engine.computeSummary(input, dummyParams, activeVersion);
      expect(summary.interestMode).toBe('sin_interes');
      expect(summary.totalInterest).toBe(0);
    });

    it('beca del 50% debe reducir tuitionNet a la mitad', () => {
      const input = makeInput({
        tuitionGross: 10_000_000,
        scholarshipPct: 50,
        initialPaymentValue: 1_000_000,
      });
      const summary = engine.computeSummary(input, dummyParams);
      expect(summary.tuitionNet).toBe(5_000_000);
      expect(summary.financedValue).toBe(4_000_000);
    });
  });

  // ── Fechas (#60) ──────────────────────────────────────────

  describe('Fechas de pago (#60 — mes calendario)', () => {
    it('debe avanzar mes a mes desde firstPaymentMonth', () => {
      const input = makeInput({
        academicPeriod: '2026-01',
        firstPaymentMonth: 3,
        numberOfPayments: 4,
      });
      const summary = engine.computeSummary(input, dummyParams);
      expect(summary.schedule[0].date).toBe('2026-03-01');
      expect(summary.schedule[1].date).toBe('2026-04-01');
      expect(summary.schedule[2].date).toBe('2026-05-01');
    });

    it('debe cruzar año correctamente (dic → ene)', () => {
      const input = makeInput({
        academicPeriod: '2026-02',
        firstPaymentMonth: 11,
        numberOfPayments: 5,
      });
      const summary = engine.computeSummary(input, dummyParams);
      const dates = summary.schedule.map(r => r.date);
      expect(dates[0]).toBe('2026-11-01');
      expect(dates[1]).toBe('2026-12-01');
      expect(dates[2]).toBe('2027-01-01');
      expect(dates[3]).toBe('2027-02-01');
    });
  });

  // ── Resumen (SimulationSummary) ───────────────────────────

  describe('SimulationSummary', () => {
    it('debe incluir un id UUID', () => {
      const input = makeInput();
      const summary = engine.computeSummary(input, dummyParams);
      expect(summary.id).toBeDefined();
      expect(summary.id.length).toBeGreaterThan(0);
    });

    it('financedValue = tuitionNet - initialPayment', () => {
      const input = makeInput({
        tuitionGross: 12_000_000,
        scholarshipPct: 10,
        initialPaymentValue: 2_160_000,
      });
      const summary = engine.computeSummary(input, dummyParams);
      expect(summary.tuitionNet).toBe(10_800_000);
      expect(summary.financedValue).toBe(10_800_000 - 2_160_000);
    });

    it('los periods deben empezar en 2 y ser consecutivos', () => {
      const input = makeInput({ numberOfPayments: 6 });
      const summary = engine.computeSummary(input, dummyParams);
      summary.schedule.forEach((row, i) => {
        expect(row.period).toBe(i + 2);
      });
    });
  });
});
