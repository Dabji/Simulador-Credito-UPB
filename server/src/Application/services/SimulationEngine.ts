// Servicio: motor de cálculo (summary + amortización).
// Aplica la lógica financiera pura sin dependencia de infraestructura.
//
// ═══════════════════════════════════════════════════════════════════
// FÓRMULA Y POLÍTICA DE REDONDEO
// ───────────────────────────────────────────────────────────────────
// 1. VALOR FINANCIADO
//    financedValue = tuitionGross × (1 − scholarshipPct/100) − initialPaymentValue
//    → scholarshipPct se ignora para educationLevel=upbTech (#57).
//
// 2. CUOTA PERIÓDICA (Sistema Francés)
//    Con interés: M = P × r × (1+r)^n / ((1+r)^n − 1)
//    Sin interés: M = P / n
//    donde P = financedValue, r = tasa mensual BD, n = cuotas del plan (= numberOfPayments − 1)
//    → La cuota inicial NO está incluida en el plan de amortización (#58).
//
// 3. TABLA DE AMORTIZACIÓN
//    La tabla muestra n = numberOfPayments − 1 filas (cuota 2..N).
//    La cuota inicial se muestra como "Pago inicial" en el resumen, fuera de la tabla.
//    Redondeo por fila: interest = round(balance × r), principal = round(M − interest).
//    Última fila: finalBalance forzado a 0 para absorber diferencias de redondeo acumuladas.
//
// 4. TOTALES
//    totalPaid    = initialPaymentValue + Σ payment[i]  (incluye inicial)
//    totalInterest = Σ interest[i]                       (solo cuotas del plan)
//
// 5. FECHAS (#60 — Mes contable)
//    Las fechas de pago avanzan por mes calendario (mismo día del mes siguiente).
//    Si el día de inicio no existe en el mes destino, se ajusta al último día del mes (clamp).
//    Ejemplos: 01/03 → 01/04 → 01/05 | 31/01 → 28/02 | 15/03 → 15/04
//    El cálculo de interés usa tasa mensual fija (base 30 días contables en BD).
// ═══════════════════════════════════════════════════════════════════

import { Money } from '../../Core/entities/Money';
import { SimulationRow } from '../../Core/entities/SimulationRow';
import { ParameterVersion } from '../../Core/entities/ParameterVersion';
import type { SimulationInput } from '../dtos/SimulationInput';
import { LEVEL_MAP } from '../dtos/constants';
import type { SimulationSummary, AmortizationRowDTO } from '../dtos/SimulationSummary';
import type { ActiveParameterVersion } from '../../Core/repositories/IParameterVersionRepository';

export class SimulationEngine {

  // Calcula el resumen completo + tabla a partir del input y los parámetros activos
  computeSummary(input: SimulationInput, _params: ParameterVersion, activeVersion?: ActiveParameterVersion): SimulationSummary {
    // #57 — UPB Tech: ignorar beca/descuento aunque llegue en payload
    const effectiveScholarshipPct = input.educationLevel === 'upbTech' ? 0 : input.scholarshipPct;

    // #59 — Forzar sin_interes si numberOfPayments <= 3 y se envió con_interes
    const effectiveInterestMode =
      input.interestMode === 'con_interes' && input.numberOfPayments <= 3
        ? 'sin_interes'
        : input.interestMode;

    const effectiveInput: SimulationInput = {
      ...input,
      scholarshipPct: effectiveScholarshipPct,
      interestMode:   effectiveInterestMode,
    };

    const schedule = this.buildAmortizationSchedule(effectiveInput, _params, activeVersion);

    const tuitionNet      = Money.of(effectiveInput.tuitionGross * (1 - effectiveScholarshipPct / 100));
    const initialPayment  = Money.of(effectiveInput.initialPaymentValue);
    const financedValue   = tuitionNet.subtract(initialPayment);

    // totalPaid incluye la cuota inicial + suma de cuotas del plan (#58)
    const planTotal       = schedule.reduce((acc, r) => acc + r.payment, 0);
    const totalPaid       = initialPayment.amount + planTotal;
    const totalInterest   = schedule.reduce((acc, r) => acc + r.interest, 0);
    const periodicPayment = schedule.length > 0 ? schedule[0].payment : 0;

    return {
      id:                 crypto.randomUUID(),
      tuitionGross:       effectiveInput.tuitionGross,
      scholarshipPct:     effectiveScholarshipPct,
      tuitionNet:         tuitionNet.amount,
      initialPayment:     initialPayment.amount,
      initialPaymentPct:  effectiveInput.initialPaymentPct,
      financedValue:      financedValue.amount,
      interestMode:       effectiveInterestMode,
      academicPeriod:     effectiveInput.academicPeriod,
      firstPaymentMonth:  effectiveInput.firstPaymentMonth,
      numberOfPayments:   effectiveInput.numberOfPayments,
      periodicPayment:    Math.round(periodicPayment),
      totalPaid:          Math.round(totalPaid),
      totalInterest:      Math.round(totalInterest),
      schedule,
    };
  }

  // Construye la tabla de amortización fila a fila.
  // #58: n = numberOfPayments − 1 (la cuota inicial NO es cuota del plan).
  // #60: fechas avanzan por mes calendario, no por +30 días.
  buildAmortizationSchedule(
    input: SimulationInput,
    _params: ParameterVersion,
    activeVersion?: ActiveParameterVersion,
  ): AmortizationRowDTO[] {
    // #57 — UPB Tech: ignorar beca/descuento
    const effectiveScholarshipPct = input.educationLevel === 'upbTech' ? 0 : input.scholarshipPct;

    // #59 — Forzar sin_interes si numberOfPayments <= 3 y se envió con_interes
    const effectiveInterestMode =
      input.interestMode === 'con_interes' && input.numberOfPayments <= 3
        ? 'sin_interes'
        : input.interestMode;

    const tuitionNet     = Money.of(input.tuitionGross * (1 - effectiveScholarshipPct / 100));
    const initialPayment = Money.of(input.initialPaymentValue);
    const financed       = tuitionNet.subtract(initialPayment);

    // #58: plan de n-1 cuotas (la cuota 1 es la inicial, el plan va de cuota 2..N)
    const planN = Math.max(0, input.numberOfPayments - 1);

    // Tasa mensual: 0 si sin_interes, resuelve desde BD si con_interes
    const effectiveInput = { ...input, interestMode: effectiveInterestMode };
    const r = this.resolveMonthlyRate(effectiveInput, activeVersion);

    // Cuota fija del plan (Sistema Francés o lineal)
    const periodicPayment = this.computePeriodicPayment(financed.amount, r, planN);

    // Fecha base del primer pago del plan (= cuota 2 cronológicamente)
    const baseDate = this.buildFirstPaymentDate(input.academicPeriod, input.firstPaymentMonth);

    const rows: AmortizationRowDTO[] = [];
    let balance = financed.amount;

    for (let i = 0; i < planN; i++) {
      const cuotaNum       = i + 2;                           // cuota 2, 3, … N
      const initialBalance = Math.round(balance);
      const interest       = Math.round(balance * r);         // #58: sin interés en cuota inicial
      const principal      = Math.round(periodicPayment - interest);
      balance              = Math.max(0, balance - principal);
      const finalBalance   = i === planN - 1 ? 0 : Math.round(balance);

      // #60: fecha por mes calendario (misma fecha del mes +i)
      const payDate = this.addMonths(baseDate, i);
      const dateStr = this.toISODate(payDate);

      rows.push({
        period:         cuotaNum,
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

  // Construye la fecha del primer pago como Date (día 1 del mes elegido).
  // Para periodos YYYY-01: si firstPaymentMonth=12 usar año-1, si 1-5 usar año.
  // Para periodos YYYY-02: meses 6-11 del año.
  private buildFirstPaymentDate(academicPeriod: string, firstPaymentMonth: number): Date {
    const [yearStr, sem] = academicPeriod.split('-');
    const year = parseInt(yearStr, 10);
    let payYear = year;
    // Periodo 01: Diciembre pertenece al año anterior
    if (sem === '01' && firstPaymentMonth === 12) {
      payYear = year - 1;
    }
    return new Date(payYear, firstPaymentMonth - 1, 1);
  }

  // #60: avanza una fecha exactamente `months` meses calendario.
  // Usa el mismo día del mes; si no existe en el mes destino, clamp al último día.
  // Ejemplos: 01/03 +1 → 01/04 | 31/01 +1 → 28/02 | 15/08 +6 → 15/02
  private addMonths(date: Date, months: number): Date {
    const d    = date.getDate();
    const m    = date.getMonth() + months;
    const year = date.getFullYear() + Math.floor(m / 12);
    const month = ((m % 12) + 12) % 12;
    // Último día del mes destino para clamp
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(d, lastDay));
  }

  // Serializa un Date a "YYYY-MM-DD" sin depender de toISOString (evita desfases UTC)
  private toISODate(date: Date): string {
    const y  = date.getFullYear();
    const m  = String(date.getMonth() + 1).padStart(2, '0');
    const d  = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Mapa de niveles del input a los ENUMs de BD (importado de constante compartida)
  private static readonly LEVEL_MAP = LEVEL_MAP;

  // Resuelve la tasa mensual usando la versión activa de parámetros de BD
  private resolveMonthlyRate(input: SimulationInput, activeVersion?: ActiveParameterVersion): number {
    if (input.interestMode === 'sin_interes') return 0;

    if (!activeVersion) {
      throw new Error(
        'No se puede calcular: se requiere la versión de parámetros activa para resolver la tasa de interés.',
      );
    }

    const dbLevel = SimulationEngine.LEVEL_MAP[input.educationLevel];
    const rateEntry = dbLevel
      ? activeVersion.interestRates.find(r => r.levelScope === dbLevel)
      : undefined;

    if (rateEntry?.rateMonthly == null) {
      throw new Error(
        'No se puede calcular: la versión de parámetros activa no define una tasa de interés para este nivel.',
      );
    }

    return rateEntry.rateMonthly;
  }

  // Expuesto para SimulationService cuando solo necesita la tabla separada
  getScheduleRows(input: SimulationInput, params: ParameterVersion, activeVersion?: ActiveParameterVersion): SimulationRow[] {
    const dtos = this.buildAmortizationSchedule(input, params, activeVersion);
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
