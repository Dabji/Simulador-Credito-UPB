// Servicio: motor de cálculo (summary + amortización).
// Aplica la lógica financiera pura sin dependencia de infraestructura.

import { Money } from '../../Core/entities/Money';
import { SimulationRow } from '../../Core/entities/SimulationRow';
import { InterestRate } from '../../Core/entities/InterestRate';
import { ParameterVersion } from '../../Core/entities/ParameterVersion';
import type { SimulationInput } from '../dtos/SimulationInput';
import type { SimulationSummary, AmortizationRowDTO } from '../dtos/SimulationSummary';
import type { ActiveParameterVersion } from '../../Core/repositories/IParameterVersionRepository';

export class SimulationEngine {

  // Calcula el resumen completo + tabla a partir del input y los parámetros activos
  computeSummary(input: SimulationInput, _params: ParameterVersion, activeVersion?: ActiveParameterVersion): SimulationSummary {
    const schedule = this.buildAmortizationSchedule(input, _params, activeVersion);

    const tuitionNet      = Money.of(input.tuitionGross * (1 - input.scholarshipPct / 100));
    const initialPayment  = Money.of(input.initialPaymentValue);
    const financedValue   = tuitionNet.subtract(initialPayment);
    const totalPaid       = schedule.reduce((acc, r) => acc + r.payment, 0);
    const totalInterest   = schedule.reduce((acc, r) => acc + r.interest, 0);
    const periodicPayment = schedule.length > 0 ? schedule[0].payment : 0;

    return {
      id:                 crypto.randomUUID(),
      tuitionGross:       input.tuitionGross,
      scholarshipPct:     input.scholarshipPct,
      tuitionNet:         tuitionNet.amount,
      initialPayment:     initialPayment.amount,
      initialPaymentPct:  input.initialPaymentPct,
      financedValue:      financedValue.amount,
      interestMode:       input.interestMode,
      academicPeriod:     input.academicPeriod,
      firstPaymentMonth:  input.firstPaymentMonth,
      numberOfPayments:   input.numberOfPayments,
      periodicPayment:    Math.round(periodicPayment),
      totalPaid:          Math.round(totalPaid),
      totalInterest:      Math.round(totalInterest),
      schedule,
    };
  }

  // Construye la tabla de amortización fila a fila (cuotas cada 30 días)
  buildAmortizationSchedule(
    input: SimulationInput,
    _params: ParameterVersion,
    activeVersion?: ActiveParameterVersion,
  ): AmortizationRowDTO[] {
    const tuitionNet     = Money.of(input.tuitionGross * (1 - input.scholarshipPct / 100));
    const initialPayment = Money.of(input.initialPaymentValue);
    const financed       = tuitionNet.subtract(initialPayment);
    const n              = input.numberOfPayments;

    // Usar tasa de BD (activeVersion) si está disponible; de lo contrario, fallback hardcode
    const r              = this.resolveMonthlyRate(input, activeVersion);

    // Cuota fija (Sistema Francés) o cuota igual sin interés
    const periodicPayment = this.computePeriodicPayment(financed.amount, r, n);

    // Fecha base: primer pago el día 1 del mes elegido del año actual
    const baseDate = this.buildFirstPaymentDate(input.academicPeriod, input.firstPaymentMonth);

    const rows: AmortizationRowDTO[] = [];
    let balance = financed.amount;

    for (let i = 1; i <= n; i++) {
      const initialBalance = Math.round(balance);
      const interest       = Math.round(balance * r);
      const principal      = Math.round(periodicPayment - interest);
      balance              = Math.max(0, balance - principal);
      const finalBalance   = i === n ? 0 : Math.round(balance);

      // Fecha: primer pago + 30*(i-1) días
      const payDate = new Date(baseDate);
      payDate.setDate(payDate.getDate() + 30 * (i - 1));
      const dateStr = payDate.toISOString().slice(0, 10);

      rows.push({
        period:         i,
        date:           dateStr,
        initialBalance,
        principal,
        interest,
        payment:        Math.round(periodicPayment),
        finalBalance,
      });
    }

    return rows;
  }

  // Fórmula de cuota fija Sistema Francés: M = P*r*(1+r)^n / ((1+r)^n - 1)
  // Si r=0: M = P/n
  private computePeriodicPayment(principal: number, r: number, n: number): number {
    if (principal <= 0 || n <= 0) return 0;
    if (r === 0) return principal / n;
    const factor = Math.pow(1 + r, n);
    return (principal * r * factor) / (factor - 1);
  }

  // Construye la fecha del primer pago como Date
  // Para periodos YYYY-01: si firstPaymentMonth=12 usar año-1, si 1-5 usar año
  // Para periodos YYYY-02: meses 6-11 del año
  private buildFirstPaymentDate(academicPeriod: string, firstPaymentMonth: number): Date {
    const [yearStr, sem] = academicPeriod.split('-');
    const year = parseInt(yearStr, 10);

    let payYear = year;
    // Periodo 01: Diciembre pertenece al año anterior
    if (sem === '01' && firstPaymentMonth === 12) {
      payYear = year - 1;
    }

    // Día 1 del mes elegido
    return new Date(payYear, firstPaymentMonth - 1, 1);
  }

  // Mapa de niveles del input a los ENUMs de BD
  private static readonly LEVEL_MAP: Record<string, 'PREGRADO' | 'POSGRADO' | 'UPB_TEC'> = {
    pregrado: 'PREGRADO',
    posgrado: 'POSGRADO',
    upbTech:  'UPB_TEC',
  };

  // Resuelve la tasa mensual: prioriza activeVersion de BD; si no existe, usa fallback hardcode
  private resolveMonthlyRate(input: SimulationInput, activeVersion?: ActiveParameterVersion): number {
    if (input.interestMode === 'sin_interes') return 0;

    if (activeVersion) {
      const dbLevel = SimulationEngine.LEVEL_MAP[input.educationLevel];
      const rateEntry = dbLevel
        ? activeVersion.interestRates.find(r => r.levelScope === dbLevel)
        : undefined;
      if (rateEntry?.rateMonthly != null) {
        return rateEntry.rateMonthly;
      }
    }

    // Fallback: valor hardcode del Value Object InterestRate
    return InterestRate.fromMode(input.interestMode).monthlyRate;
  }

  // Expuesto para SimulationService cuando solo necesita la tabla separada
  getScheduleRows(input: SimulationInput, params: ParameterVersion): SimulationRow[] {
    const dtos = this.buildAmortizationSchedule(input, params);
    return dtos.map((d) =>
      new SimulationRow(
        d.period,
        d.date,
        Money.of(d.initialBalance),
        Money.of(d.principal),
        Money.of(d.interest),
        Money.of(d.payment),
        Money.of(d.finalBalance),
      ),
    );
  }
}
