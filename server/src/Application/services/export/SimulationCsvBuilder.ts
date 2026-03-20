// ============================================================
// SimulationCsvBuilder — HU-41
// Genera el contenido CSV de una simulación persistida.
// Sin dependencias externas.
// BOM UTF-8 + separador coma (,) + escape RFC 4180.
// Estructura: bloque metadata clave,valor → tabla amortización
// → tabla evolución del saldo.
// ============================================================

import type { PersistedSimulationWithUser } from '../../../Core/repositories/ISimulationRepository';

// ── Helpers RFC 4180 ──────────────────────────────────────────

/** Escapa un valor para CSV con separador coma según RFC 4180. */
function esc(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value);
  // Debe ir entre comillas si contiene: coma, comilla doble, salto de línea o CR
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Construye una fila CSV uniendo celdas con coma. */
function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(esc).join(',');
}

/** Formatea fecha corta para mostrar en columna (mes año en español). */
function fmtDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const raw = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(d);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    PREGRADO: 'Pregrado',
    POSGRADO: 'Posgrado',
    UPB_TEC:  'UPB Tec',
  };
  return map[level] ?? level;
}

// ── Builder principal ─────────────────────────────────────────

export function buildSimulationCsv(sim: PersistedSimulationWithUser): string {
  const s   = sim.summary;
  const stu = sim.student;
  const lines: string[] = [];

  // ── Bloque 1: Información de la simulación (clave,valor) ─────
  lines.push(row('Campo', 'Valor'));
  lines.push(row('Simulador', 'Crédito Educativo UPB'));
  lines.push(row('Fecha de generación', new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })));
  lines.push('');

  // Datos del estudiante
  lines.push(row('Nombre completo',           `${stu.firstName} ${stu.lastName}`));
  lines.push(row('Correo electrónico',        stu.email));
  lines.push(row('Tipo de documento',         stu.documentType || ''));
  lines.push(row('Número de identificación',  stu.identificationNumber));
  lines.push(row('Número de celular',         stu.phone || 'No registrado'));
  lines.push(row('Nivel educativo',           levelLabel(sim.level)));
  lines.push(row('Tipo de estudiante',        sim.studentType === 'NUEVO' ? 'Nuevo' : 'Continuo'));
  lines.push(row('Modalidad',                 s.interestMode === 'con_interes' ? 'Con Intereses' : 'Sin Intereses'));
  lines.push(row('Fecha de creación',         new Date(sim.savedAt).toLocaleDateString('es-CO')));
  lines.push(row('Período académico',         s.academicPeriod || ''));
  lines.push('');

  // ── Bloque 2: Resumen financiero (clave,valor) ───────────────
  lines.push(row('Resumen financiero', ''));
  lines.push(row('Valor matrícula (bruto)',       s.tuitionGross));
  lines.push(row('Beca / descuento (%)',           s.scholarshipPct));
  lines.push(row('Matrícula neta',                s.tuitionNet));
  lines.push(row('Cuota inicial',                 s.initialPayment));
  lines.push(row('Cuota inicial (%)',             s.initialPaymentPct));
  lines.push(row('Valor a financiar',             s.financedValue));
  lines.push(row('Tasa de interés mensual (%)',
    s.interestMode === 'con_interes'
      ? Number((sim.appliedRateMonthly * 100).toFixed(4))
      : 0,
  ));
  lines.push(row('Número de cuotas',              s.numberOfPayments));
  lines.push(row('Cuota fija mensual estimada',   s.periodicPayment));
  lines.push(row('Total a pagar',                 s.totalPaid));
  lines.push(row('Total intereses',               s.totalInterest));
  lines.push(row('Observaciones',                 sim.studentObservation ?? ''));
  lines.push('');

  // ── Bloque 3: Cronograma de amortización (tabla) ─────────────
  lines.push(row('Cronograma de amortización', '', '', '', '', '', ''));
  lines.push(row(
    'Cuota inicial (no genera intereses)',
    s.initialPayment,
    `${s.initialPaymentPct}%`,
    '', '', '', '',
  ));
  lines.push('');

  if (s.schedule.length === 0) {
    lines.push(row('Sin cuotas periódicas. La simulación corresponde a pago único.'));
  } else {
    lines.push(row(
      'N° Cuota',
      'Fecha',
      'Saldo Inicial (COP)',
      'Capital (COP)',
      'Interes (COP)',
      'Valor Cuota (COP)',
      'Saldo Final (COP)',
    ));

    for (const r of s.schedule) {
      lines.push(row(
        r.period,
        fmtDate(r.date),
        r.initialBalance,
        r.principal,
        r.interest,
        r.payment,
        r.finalBalance,
      ));
    }
  }

  lines.push('');

  // ── Bloque 4: Evolución del saldo (tabla para gráfica) ───────
  if (s.schedule.length > 0) {
    lines.push(row('Evolucion del saldo', '', ''));
    lines.push(row('N° Cuota', 'Fecha', 'Saldo Final (COP)'));
    for (const r of s.schedule) {
      lines.push(row(r.period, fmtDate(r.date), r.finalBalance));
    }
    lines.push('');
  }

  lines.push(row('Nota', 'Los valores son referenciales y pueden variar segun politicas institucionales vigentes.'));

  // BOM UTF-8 al inicio para apertura correcta en Excel
  return '\uFEFF' + lines.join('\r\n');
}
