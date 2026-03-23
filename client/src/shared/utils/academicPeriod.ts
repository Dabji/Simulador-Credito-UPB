/* ─────────────────────────────────────────────────────────────────────
   UTILIDAD: academicPeriod
   Calcula la fecha de inicio de vigencia a partir de un código de
   período académico institucional UPB.
   Reglas:
     • YYYY-01  →  01/12/(YYYY-1)   (primer semestre: inicia dic. del año anterior)
     • YYYY-02  →  01/06/YYYY        (segundo semestre: inicia jun. del mismo año)
───────────────────────────────────────────────────────────────────── */

/** Regex que valida el formato de período académico: YYYY-01 o YYYY-02 */
const PERIOD_RE = /^(\d{4})-(01|02)$/;

/**
 * Dado un código de período académico (e.g. "2026-01"),
 * retorna la fecha de inicio de vigencia en formato "YYYY-MM-DD".
 *
 * @returns fecha ISO o `null` si el código es inválido.
 *
 * Ejemplos:
 *   periodStartDate("2026-01") → "2025-12-01"
 *   periodStartDate("2026-02") → "2026-06-01"
 */
export function periodStartDate(periodCode: string): string | null {
  const m = PERIOD_RE.exec(periodCode.trim());
  if (!m) return null;

  const year = parseInt(m[1], 10);
  const semester = m[2];

  if (semester === '01') {
    // Primer semestre: vigencia comienza el 1 de diciembre del año anterior
    return `${year - 1}-12-01`;
  }
  // Segundo semestre: vigencia comienza el 1 de junio
  return `${year}-06-01`;
}

/**
 * Valida si un string tiene formato de período académico válido.
 */
export function isValidPeriodCode(code: string): boolean {
  return PERIOD_RE.test(code.trim());
}
