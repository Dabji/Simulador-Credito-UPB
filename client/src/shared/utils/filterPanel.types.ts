// Tipos y utilidades compartidas del FilterPanel (HU-PV-03).
// Ubicado en shared/utils/ siguiendo el patrón del proyecto
// (igual que academicPeriod.ts). Separado de FilterPanel.tsx
// para que Vite Fast Refresh funcione correctamente.

// ── Tipos públicos ───────────────────────────────────────────

export type FilterFieldType = 'text' | 'select' | 'daterange';

export interface FilterFieldDef {
  readonly key: string;
  readonly label: string;
  readonly type: FilterFieldType;
  /** Solo para type === 'select' */
  readonly options?: ReadonlyArray<{ value: string; label: string }>;
  /** Si true, muestra hint de soporte ";" para OR */
  readonly supportsMultiple?: boolean;
}

/** Criterio activo serializable para la query al backend */
export interface ActiveCriterion {
  field: string;
  value: string;
  /** ISO YYYY-MM-DD; solo para daterange */
  dateFrom?: string;
  /** ISO YYYY-MM-DD; solo para daterange */
  dateTo?: string;
}

// ── Utilidad: etiqueta legible de un criterio activo ─────────

export function criterionDisplayValue(
  criterion: ActiveCriterion,
  fieldDefs: ReadonlyArray<FilterFieldDef>,
): string {
  const def = fieldDefs.find(f => f.key === criterion.field);
  if (!def) return criterion.value;

  if (def.type === 'daterange') {
    const parts: string[] = [];
    if (criterion.dateFrom) parts.push(`desde ${criterion.dateFrom}`);
    if (criterion.dateTo)   parts.push(`hasta ${criterion.dateTo}`);
    return parts.join(' ') || criterion.value;
  }

  if (def.type === 'select' && def.options) {
    const terms  = criterion.value.split(';').map(v => v.trim()).filter(Boolean);
    const labels = terms.map(t => def.options!.find(o => o.value === t)?.label ?? t);
    return labels.join(', ');
  }

  return criterion.value;
}
