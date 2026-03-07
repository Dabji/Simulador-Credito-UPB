/* ─────────────────────────────────────────────────────────────
   COMPONENTE: SimulationForm
   Formulario de simulación de crédito educativo.
   Conectado a POST /api/simulator/preview (HU-13).
   Secciones: A) Información Académica  B) Datos Financieros
              C) Modalidad de Financiación
───────────────────────────────────────────────────────────────── */

import { useState, useMemo, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { simulateCredit } from '../services/api';
import type { SimulationSummaryDTO, SimulationInputDTO } from '../services/api';

/* ── Helpers de formateo (sin over-ingeniería) ──────────────────
   parseDigits   : extrae solo dígitos de un string
   formatCOPInput: añade separadores de miles CO (punto) para display
   parseCOPInput : devuelve el número entero sin separadores
   formatPctInput: muestra el número con símbolo % al final
   parsePctInput : devuelve el número decimal sin símbolo
──────────────────────────────────────────────────────────────── */

/** Devuelve solo los dígitos de un string */
function parseDigits(v: string): string {
  return v.replace(/\D/g, '');
}

/** Formatea número entero con separadores de miles (punto CO).
 *  Ejemplo: 5000000 → "5.000.000" */
function formatCOPInput(raw: string): string {
  const digits = parseDigits(raw);
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('es-CO');
}

/** Extrae el valor numérico de un string con separadores CO.
 *  Ejemplo: "5.000.000" → "5000000" */
function parseCOPInput(displayed: string): string {
  return displayed.replace(/\./g, '').replace(/,/g, '');
}

/** Muestra un número con símbolo % al final.
 *  Ejemplo: "20" → "20%" */
function formatPctInput(raw: string): string {
  if (!raw) return '';
  const clean = raw.replace(/%/g, '').replace(/[^0-9.]/g, '');
  return clean ? `${clean}%` : '';
}

/** Extrae el número de un string con símbolo %.
 *  Ejemplo: "20%" → "20" */
function parsePctInput(displayed: string): string {
  return displayed.replace(/%/g, '').replace(/[^0-9.]/g, '');
}

/** Limita un string numérico al rango 0-100 (para campos de porcentaje). */
function clampPct(raw: string): string {
  if (!raw) return raw;
  const n = parseFloat(raw);
  if (isNaN(n)) return raw;
  if (n > 100) return '100';
  if (n < 0)   return '0';
  return raw;
}

/* ── Constantes de dominio ─────────────────────────────────────
   CURRENT_YEAR : año en curso para generar la ventana de periodos
   EDUCATION_LEVELS: solo los 3 niveles válidos (HU-13)
──────────────────────────────────────────────────────────────── */

/** Año actual — se evalúa una sola vez al cargar el módulo */
const CURRENT_YEAR = new Date().getFullYear();

/** Niveles de formación permitidos según ParameterVersion del backend */
const EDUCATION_LEVELS = [
  { value: 'pregrado', label: 'Pregrado' },
  { value: 'posgrado', label: 'Posgrado' },
  { value: 'upbTech',  label: 'UPB Tech' },
] as const;

type EducationLevelValue = typeof EDUCATION_LEVELS[number]['value'];

/* Todos los meses del año con número y etiqueta */
const ALL_MONTHS = [
  { num: 1,  label: 'Enero' },
  { num: 2,  label: 'Febrero' },
  { num: 3,  label: 'Marzo' },
  { num: 4,  label: 'Abril' },
  { num: 5,  label: 'Mayo' },
  { num: 6,  label: 'Junio' },
  { num: 7,  label: 'Julio' },
  { num: 8,  label: 'Agosto' },
  { num: 9,  label: 'Septiembre' },
  { num: 10, label: 'Octubre' },
  { num: 11, label: 'Noviembre' },
  { num: 12, label: 'Diciembre' },
];

/* Regla: periodos académicos y meses válidos (espeja ParameterVersion del backend)
   YYYY-01 → [Dic(año-1), Ene, Feb, Mar, Abr, May(año)]  — Diciembre primero
   YYYY-02 → [Jun, Jul, Ago, Sep, Oct, Nov(año)] */
function getMonthsForPeriod(period: string): number[] {
  const sem = period.split('-')[1];
  if (sem === '01') return [12, 1, 2, 3, 4, 5];  // Diciembre encabeza el semestre
  if (sem === '02') return [6, 7, 8, 9, 10, 11];
  return [];
}

/** Año calendario que corresponde a un mes dentro de un periodo.
 *  Ejemplo: periodo 2026-01, mes 12 → año 2025; mes 1-5 → año 2026. */
function yearForMonth(period: string, month: number): number {
  const [yearStr, sem] = period.split('-');
  const y = parseInt(yearStr, 10);
  return sem === '01' && month === 12 ? y - 1 : y;
}

/** Devuelve true si el mes+año ya quedó en el pasado respecto al mes actual.
 *  Se usa para deshabilitar meses que el usuario ya no puede escoger. */
function isMonthPast(month: number, year: number): boolean {
  const now = new Date();
  return year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1);
}

/** Cuotas máximas desde el mes elegido hasta el fin del periodo:
 *  - con_interes  → máximo absoluto 6
 *  - sin_interes  → máximo absoluto 3
 *  Siempre limitado por cuántos meses quedan en el periodo. */
function maxInstallmentsFor(
  period: string,
  firstPaymentMonth: number,
  interestMode: string,
): number {
  const months  = getMonthsForPeriod(period);
  const idx     = months.indexOf(firstPaymentMonth);
  if (idx === -1) return 0;
  const remaining = months.length - idx;           // cuotas disponibles en el periodo
  const cap       = interestMode === 'sin_interes' ? 3 : 6;  // tope por modalidad
  return Math.min(remaining, cap);
}

/* Ventana móvil de 2 años: año actual + siguiente.
   Etiquetas exactas como aparecen en el diseño:
     YYYY-01 → "YYYY-01 (Dic YYYY-1 – May YYYY)"
     YYYY-02 → "YYYY-02 (Jun – Nov YYYY)" */
const PERIOD_OPTIONS = (() => {
  const opts: { value: string; label: string }[] = [];
  [CURRENT_YEAR, CURRENT_YEAR + 1].forEach((y) => {
    opts.push({ value: `${y}-01`, label: `${y}-01 (Dic ${y - 1} – May ${y})` });
    opts.push({ value: `${y}-02`, label: `${y}-02 (Jun – Nov ${y})` });
  });
  return opts;
})();

/* Estado del formulario — todos los campos como strings para inputs controlados.
   Los campos COP (tuitionValue, downPaymentValue) almacenan el número sin
   separadores internamente y solo se formatean en la capa de display. */
interface FormFields {
  studentType: string;
  educationLevel: EducationLevelValue | '';
  tuitionValue: string;
  scholarshipPercent: string;
  downPaymentPercent: string;
  downPaymentValue: string;
  interestMode: string;
  academicPeriod: string;
  firstPaymentMonth: string;
  numberOfPayments: string;
  observations: string;
}

const INITIAL_FIELDS: FormFields = {
  studentType: '',
  educationLevel: '',
  tuitionValue: '',
  scholarshipPercent: '',
  downPaymentPercent: '20',
  downPaymentValue: '',
  interestMode: '',
  academicPeriod: '',
  firstPaymentMonth: '',
  numberOfPayments: '',
  observations: '',
};

/* #59 — Aviso de modalidad forzada a sin_interes (dinámico según número de cuotas) */
const forcedSinInteresText = (n: number): string =>
  `Por regla institucional, con ${n} cuota${n === 1 ? '' : 's'} totales se aplica modalidad sin intereses.`;

/* Clases CSS compartidas para inputs, labels y helpers */
const INPUT_BASE =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400';
const LABEL_CLASS  = 'block text-sm font-semibold text-gray-700 mb-1.5';
const HELPER_CLASS = 'mt-1.5 text-xs leading-relaxed';
const HELPER_COLOR = { color: '#4A5565' } as const;

interface SimulationFormProps {
  onResult: (summary: SimulationSummaryDTO, input: SimulationInputDTO) => void;
}

/* ── Tipo para el diálogo de confirmación ──────────────────────────────────
   Se reutiliza para las acciones: limpiar formulario,
   nueva simulación y guardar simulación.
──────────────────────────────────────────────────────────────── */
interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const DIALOG_CLOSED: ConfirmDialogState = {
  open: false, title: '', message: '', onConfirm: () => undefined,
};

/* Clave de sessionStorage para persistir el formulario entre navegaciones */
const SESSION_KEY = 'sim_form_draft';

/** Lee el borrador guardado en sessionStorage (si existe y es válido) */
function readDraft(): FormFields {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return INITIAL_FIELDS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return INITIAL_FIELDS;
    // Mezcla con INITIAL_FIELDS para tolerar campos nuevos en versiones futuras
    return { ...INITIAL_FIELDS, ...(parsed as Partial<FormFields>) };
  } catch {
    return INITIAL_FIELDS;
  }
}

export function SimulationForm({ onResult }: SimulationFormProps) {
  const [fields, setFields]     = useState<FormFields>(readDraft);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  /* Diálogo de confirmación emergente — usado para Limpiar formulario */
  const [dialog, setDialog]     = useState<ConfirmDialogState>(DIALOG_CLOSED);

  /* Persiste el borrador en sessionStorage cada vez que cambian los campos */
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(fields));
    } catch {
      // sessionStorage no disponible (modo incognito con cuota llena, etc.) — ignorar
    }
  }, [fields]);

  /* ── Abre el diálogo modal de confirmación */
  const confirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({ open: true, title, message, onConfirm });
  };

  /* ── Cierra el diálogo sin ejecutar acción */
  const closeDialog = () => setDialog(DIALOG_CLOSED);

  /* Actualiza un campo individual con sincronización bidireccional % ↔ COP.
     IMPORTANTE: tuitionValue y downPaymentValue se almacenan SIEMPRE como
     dígitos puros (sin separadores) para no romper cálculos internos.
     Los inputs de display aplican formatCOPInput / formatPctInput al renderizar. */
  /* #59 — aviso visible cuando la modalidad fue forzada */
  const [forcedSinInteresMsg, setForcedSinInteresMsg] = useState<string | null>(null);

  const set = (key: keyof FormFields, value: string) => {
    setApiError(null);
    setFields((prev) => {
      const next = { ...prev, [key]: value };

      /* Sincronización bidireccional cuota inicial %↔COP.
         Usamos parseCOPInput porque tuitionValue puede llegar
         con separadores desde el campo display. */
      const tuition     = parseFloat(parseCOPInput(next.tuitionValue))      || 0;
      const scholarship = parseFloat(parsePctInput(next.scholarshipPercent)) || 0;
      const netTuition  = tuition * (1 - scholarship / 100);

      if (key === 'downPaymentPercent') {
        /* Porcentaje editado → recalcular valor COP */
        const pct = parseFloat(parsePctInput(value)) || 0;
        next.downPaymentValue = netTuition > 0 ? String(Math.round(netTuition * pct / 100)) : '';
      }
      if (key === 'downPaymentValue') {
        /* Valor COP editado → recalcular porcentaje */
        const val = parseFloat(parseCOPInput(value)) || 0;
        next.downPaymentPercent = netTuition > 0
          ? String(Math.round((val / netTuition) * 1000) / 10)
          : '0';
      }
      if (key === 'tuitionValue' || key === 'scholarshipPercent') {
        /* Matrícula o beca cambió → recalcular valor COP de la cuota */
        const rawTuition     = key === 'tuitionValue' ? parseCOPInput(value) : parseCOPInput(next.tuitionValue);
        const rawScholarship = key === 'scholarshipPercent' ? parsePctInput(value) : parsePctInput(next.scholarshipPercent);
        const newNet = (parseFloat(rawTuition) || 0) * (1 - (parseFloat(rawScholarship) || 0) / 100);
        const pct    = parseFloat(parsePctInput(next.downPaymentPercent)) || 0;
        next.downPaymentValue = newNet > 0 && pct > 0 ? String(Math.round(newNet * pct / 100)) : '';
      }
      /* #58 — Al seleccionar upbTech, forzar cuota inicial a 15% */
      if (key === 'educationLevel' && value === 'upbTech') {
        next.downPaymentPercent = '15';
        const tuition    = parseFloat(parseCOPInput(next.tuitionValue)) || 0;
        const scholarship = parseFloat(parsePctInput(next.scholarshipPercent)) || 0;
        const netT       = tuition * (1 - scholarship / 100);
        next.downPaymentValue = netT > 0 ? String(Math.round(netT * 0.15)) : '';
      }
      /* #58 — Al cambiar de upbTech a otro nivel, restaurar mínimo 20% si estaba en 15 */
      if (key === 'educationLevel' && value !== 'upbTech' && prev.educationLevel === 'upbTech') {
        next.downPaymentPercent = '20';
        const tuition    = parseFloat(parseCOPInput(next.tuitionValue)) || 0;
        const scholarship = parseFloat(parsePctInput(next.scholarshipPercent)) || 0;
        const netT       = tuition * (1 - scholarship / 100);
        next.downPaymentValue = netT > 0 ? String(Math.round(netT * 0.2)) : '';
      }
      /* Al cambiar periodo, limpiar mes y cuotas dependientes */
      if (key === 'academicPeriod') { next.firstPaymentMonth = ''; next.numberOfPayments = ''; }
      /* Al cambiar mes, limpiar número de cuotas */
      if (key === 'firstPaymentMonth') { next.numberOfPayments = ''; }

      return next;
    });
  };

  /* #59 — Forzar sin_interes si con_interes + numberOfPayments <= 3 */
  const handleNumberOfPayments = (raw: string) => {
    const v = raw.replace(/[^0-9]/g, '');
    const n = parseInt(v, 10);
    const capped = !v || n <= maxCuotas ? v : String(maxCuotas);
    const nFinal = parseInt(capped, 10);
    if (fields.interestMode === 'con_interes' && nFinal >= 1 && nFinal <= 3) {
      setForcedSinInteresMsg(forcedSinInteresText(nFinal));
      setFields((prev) => ({ ...prev, interestMode: 'sin_interes', numberOfPayments: capped }));
      setApiError(null);
    } else {
      setForcedSinInteresMsg(null);
      set('numberOfPayments', capped);
    }
  };

  /* Limpiar aviso al cambiar interestMode manualmente */
  const handleInterestMode = (value: string) => {
    setForcedSinInteresMsg(null);
    set('interestMode', value);
  };

  /* Porcentaje mínimo de cuota inicial según nivel de formación:
     UPB Tech → 15%   |   Pregrado / Posgrado → 20% */
  const minDownPct = fields.educationLevel === 'upbTech' ? 15 : 20;

  /* Error inline para cuota inicial — se muestra en tiempo real */
  const downPctNum    = parseFloat(parsePctInput(fields.downPaymentPercent)) || 0;
  const downPctError  = fields.downPaymentPercent
    ? downPctNum < minDownPct
      ? `La cuota inicial debe ser mínimo del ${minDownPct}% para ${fields.educationLevel === 'upbTech' ? 'UPB Tech' : fields.educationLevel === 'posgrado' ? 'Posgrado' : 'Pregrado'}.`
      : null
    : null;

  /* Meses válidos según el periodo académico seleccionado */
  const validMonths = useMemo(
    () => getMonthsForPeriod(fields.academicPeriod),
    [fields.academicPeriod],
  );

  /* Máximo de cuotas según periodo, mes elegido Y modalidad:
     con_interes → tope 6  |  sin_interes → tope 3 */
  const maxCuotas = useMemo(() => {
    const m = parseInt(fields.firstPaymentMonth, 10);
    if (!fields.academicPeriod || !m) return fields.interestMode === 'sin_interes' ? 3 : 6;
    return maxInstallmentsFor(fields.academicPeriod, m, fields.interestMode);
  }, [fields.academicPeriod, fields.firstPaymentMonth, fields.interestMode]);

  /* Limpiar formulario — pide confirmación antes de borrar */
  const handleReset = () => {
    confirm(
      'Limpiar formulario',
      '¿Estás seguro de que deseas limpiar todos los campos? Esta acción no se puede deshacer.',
      () => {
        setFields(INITIAL_FIELDS);
        setApiError(null);
        try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignorar */ }
      },
    );
  };

  /* Error inline para mes pasado — mismo patrón que downPctError */
  const selectedMonthNum  = parseInt(fields.firstPaymentMonth, 10);
  const selectedMonthYear = fields.academicPeriod && selectedMonthNum
    ? yearForMonth(fields.academicPeriod, selectedMonthNum)
    : null;
  const monthPastError = fields.firstPaymentMonth && selectedMonthYear !== null
    ? isMonthPast(selectedMonthNum, selectedMonthYear)
      ? `El mes seleccionado ya pasó. Elige un mes igual o posterior a ${new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' })}.`
      : null
    : null;

  /* Construye el DTO de entrada validando campos mínimos */
  function buildInput(): SimulationInputDTO | string {
    if (!fields.studentType)       return 'Selecciona el tipo de estudiante.';
    if (!fields.educationLevel)    return 'Selecciona el nivel de formación.';
    /* Extraer valores numéricos limpios de los campos formateados */
    const rawTuition      = parseCOPInput(fields.tuitionValue);
    const rawDownPct      = parsePctInput(fields.downPaymentPercent);
    const rawDownVal      = parseCOPInput(fields.downPaymentValue);
    const rawScholarship  = parsePctInput(fields.scholarshipPercent);

    if (!rawTuition)             return 'Ingresa el valor de matrícula.';
    /* Mínimo dinámico: 15% UPB Tech, 20% Pregrado/Posgrado */
    const minPct = fields.educationLevel === 'upbTech' ? 15 : 20;
    if (parseFloat(rawDownPct) < minPct)
      return `La cuota inicial debe ser mínimo del ${minPct}% para este nivel de formación.`;
    if (!rawDownVal)             return 'Ingresa el valor de cuota inicial.';
    if (!fields.interestMode)    return 'Selecciona la modalidad de financiación.';
    if (!fields.academicPeriod)  return 'Selecciona el periodo académico.';
    if (!fields.firstPaymentMonth) return 'Selecciona el mes de la primera cuota.';
    /* Bloquear mes pasado */
    const fpm    = parseInt(fields.firstPaymentMonth, 10);
    const fpmYr  = yearForMonth(fields.academicPeriod, fpm);
    if (isMonthPast(fpm, fpmYr))
      return 'El mes de la primera cuota ya pasó. Selecciona un mes válido.';
    const nPayments = parseInt(fields.numberOfPayments, 10);
    if (!nPayments || nPayments < 1) return 'Ingresa el número de cuotas (mínimo 1).';
    /* Bloquear si supera el tope de la modalidad */
    const maxPay = maxInstallmentsFor(fields.academicPeriod, fpm, fields.interestMode);
    if (nPayments > maxPay)
      return `El número de cuotas supera el máximo permitido (${maxPay}) para esta modalidad y mes.`;

    /* Los 3 niveles del select coinciden 1:1 con los valores del backend */
    return {
      studentType:         fields.studentType as SimulationInputDTO['studentType'],
      educationLevel:      fields.educationLevel as SimulationInputDTO['educationLevel'],
      tuitionGross:        parseInt(rawTuition, 10),
      scholarshipPct:      parseFloat(rawScholarship) || 0,
      initialPaymentPct:   parseFloat(rawDownPct),
      initialPaymentValue: parseInt(rawDownVal, 10),
      interestMode:        fields.interestMode as SimulationInputDTO['interestMode'],
      academicPeriod:      fields.academicPeriod,
      firstPaymentMonth:   parseInt(fields.firstPaymentMonth, 10),
      numberOfPayments:    nPayments,
      observations:        fields.observations,
      starred:             false,
    };
  }

  /* Enviar al backend y pasar resultado al padre */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const inputOrError = buildInput();
    if (typeof inputOrError === 'string') { setApiError(inputOrError); return; }
    setLoading(true);
    const response = await simulateCredit(inputOrError);
    setLoading(false);
    if (response.error || !response.data) {
      setApiError(response.error ?? 'Error al calcular la simulación.');
      return;
    }
    onResult(response.data, inputOrError);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* ── A) Información Académica ── */}
      <section
        className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-5"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
          Información Académica
        </h2>

        {/* Tipo de estudiante */}
        <fieldset className="mb-5">
          <legend className={LABEL_CLASS}>
            Tipo de estudiante <span className="text-red-500">*</span>
          </legend>
          <div className="flex flex-wrap gap-6 mt-1">
            {(['nuevo', 'continuo'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="studentType"
                  value={type}
                  checked={fields.studentType === type}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => set('studentType', e.target.value)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="capitalize">Estudiante {type}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Nivel de formación */}
        <div>
          <label htmlFor="educationLevel" className={LABEL_CLASS}>
            Nivel de formación <span className="text-red-500">*</span>
          </label>
          {/* Solo 3 niveles permitidos según ParameterVersion del backend */}
          <select
            id="educationLevel"
            value={fields.educationLevel}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              set('educationLevel', e.target.value as EducationLevelValue)
            }
            className={INPUT_BASE}
          >
            <option value="">Seleccionar...</option>
            {EDUCATION_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ── B) Datos Financieros ── */}
      <section
        className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-5"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
          Datos Financieros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Valor de matrícula */}
          <div>
            <label htmlFor="tuitionValue" className={LABEL_CLASS}>
              Valor de matrícula (COP) <span className="text-red-500">*</span>
            </label>
            {/* Valor matrícula — se muestra con separadores de miles CO (punto).
                Se guarda internamente sin separadores vía parseCOPInput. */}
            <input
              id="tuitionValue"
              type="text"
              inputMode="numeric"
              placeholder="6.700.000"
              value={formatCOPInput(fields.tuitionValue)}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                set('tuitionValue', parseCOPInput(e.target.value))
              }
              className={INPUT_BASE}
            />
            <p className={HELPER_CLASS} style={HELPER_COLOR}>Valores en pesos colombianos (COP)</p>
          </div>

          {/* Beca / Descuento — #57: disabled+gris para UPB Tech, visible siempre */}
          <div>
            <label
              htmlFor="scholarshipPercent"
              className={LABEL_CLASS}
              style={fields.educationLevel === 'upbTech' ? { color: '#9CA3AF' } : undefined}
            >
              Beca / Descuento (%)
            </label>
            <input
              id="scholarshipPercent"
              type="text"
              inputMode="decimal"
              placeholder="20%"
              value={fields.educationLevel === 'upbTech' ? '' : formatPctInput(fields.scholarshipPercent)}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                set('scholarshipPercent', clampPct(parsePctInput(e.target.value)))
              }
              disabled={fields.educationLevel === 'upbTech'}
              className={INPUT_BASE}
              style={fields.educationLevel === 'upbTech'
                ? { backgroundColor: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed', borderColor: '#E5E7EB' }
                : undefined}
            />
            {fields.educationLevel === 'upbTech' && (
              <p className={HELPER_CLASS} style={{ color: '#9CA3AF' }}>
                Beca / Descuento no aplica para el nivel de formación UPB Tech.
              </p>
            )}
          </div>
        </div>

        {/* Cuota inicial — porcentaje y valor COP */}
        <fieldset className="mt-5">
          <legend className={`${LABEL_CLASS} mb-2`}>
            Cuota inicial <span className="text-red-500">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="downPaymentPercent" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Porcentaje (%)
              </label>
              {/* Cuota inicial % — muestra símbolo % y borde rojo si está bajo el mínimo */}
              <input
                id="downPaymentPercent"
                type="text"
                inputMode="decimal"
                placeholder={`${minDownPct}%`}
                value={formatPctInput(fields.downPaymentPercent)}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set('downPaymentPercent', clampPct(parsePctInput(e.target.value)))
                }
                className={INPUT_BASE}
                style={downPctError ? { borderColor: '#EF4444' } : undefined}
                aria-invalid={!!downPctError}
                aria-describedby="downPctErrorMsg"
              />
              {downPctError && (
                <p
                  id="downPctErrorMsg"
                  className="mt-1.5 text-xs font-medium"
                  style={{ color: '#B91C1C' }}
                  role="alert"
                >
                  {downPctError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="downPaymentValue" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Valor (COP)
              </label>
              {/* Cuota inicial COP — separadores de miles CO para UX clara */}
              <input
                id="downPaymentValue"
                type="text"
                inputMode="numeric"
                placeholder="1.273.000"
                value={formatCOPInput(fields.downPaymentValue)}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set('downPaymentValue', parseCOPInput(e.target.value))
                }
                className={INPUT_BASE}
              />
            </div>
          </div>
          {/* Helper text dinámico: indica el mínimo según el nivel de formación */}
          {!downPctError && (
            <p className={HELPER_CLASS} style={HELPER_COLOR}>
              {fields.educationLevel === 'upbTech'
                ? 'Cuota inicial predeterminada al 15% para UPB Tech. Puedes modificarla si lo requieres.'
                : `Modifica el porcentaje (mín. ${minDownPct}%) o el valor COP; el sistema recalculará el campo restante.`}
            </p>
          )}
        </fieldset>
      </section>

      {/* ── C) Modalidad de Financiación ── */}
      <section
        className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-5"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">
          Modalidad de Financiación
        </h2>

        {/* Tipo de financiación */}
        <fieldset className="mb-5">
          <legend className={LABEL_CLASS}>
            Financiación <span className="text-red-500">*</span>
          </legend>
          <div className="flex flex-wrap gap-6 mt-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="interestMode"
                value="sin_interes"
                checked={fields.interestMode === 'sin_interes'}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInterestMode(e.target.value)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              Sin intereses (0%)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="interestMode"
                value="con_interes"
                checked={fields.interestMode === 'con_interes'}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInterestMode(e.target.value)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              Con intereses (0.9% mensual M.V.)
            </label>
          </div>
        </fieldset>

        {/* Banner nota informativa */}
        <div
          className="rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D4FF', color: '#6E11B0' }}
          role="note"
        >
          <strong>Nota:</strong> El interés se calcula mes vencido. La fecha de pago será fija cada 30 días calendario.
        </div>

        {/* Periodo académico — select dinámico YYYY-01 / YYYY-02 */}
        <div className="mb-5">
          <label htmlFor="academicPeriod" className={LABEL_CLASS}>
            Periodo académico <span className="text-red-500">*</span>
          </label>
          <select
            id="academicPeriod"
            value={fields.academicPeriod}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => set('academicPeriod', e.target.value)}
            className={INPUT_BASE}
          >
            <option value="">Seleccionar periodo...</option>
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <p className={HELPER_CLASS} style={HELPER_COLOR}>
            Las cuotas se programan cada 30 días. La fecha de inicio se define tras validación institucional.
          </p>
        </div>

        {/* Mes de la primera cuota — filtrado según el periodo */}
        <div className="mb-5">
          <label htmlFor="firstPaymentMonth" className={LABEL_CLASS}>
            Fecha de pago de la primera cuota (Mes) <span className="text-red-500">*</span>
          </label>
          {/* Select de meses — orden correcto (Dic primero en -01), pasados deshabilitados */}
          <select
            id="firstPaymentMonth"
            value={fields.firstPaymentMonth}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => set('firstPaymentMonth', e.target.value)}
            disabled={validMonths.length === 0}
            className={INPUT_BASE}
            style={monthPastError ? { borderColor: '#EF4444' } : undefined}
            aria-invalid={!!monthPastError}
            aria-describedby="monthPastErrorMsg"
          >
            <option value="">
              {validMonths.length === 0 ? 'Selecciona primero el periodo' : 'Selecciona un mes...'}
            </option>
            {validMonths.map((num) => {
              const mo    = ALL_MONTHS.find((x) => x.num === num)!;
              const yr    = fields.academicPeriod ? yearForMonth(fields.academicPeriod, num) : CURRENT_YEAR;
              const past  = isMonthPast(num, yr);
              return (
                <option key={num} value={String(num)} disabled={past}>
                  {mo.label} {yr}{past ? ' (no disponible)' : ''}
                </option>
              );
            })}
          </select>
          {monthPastError ? (
            <p
              id="monthPastErrorMsg"
              className="mt-1.5 text-xs font-medium"
              style={{ color: '#B91C1C' }}
              role="alert"
            >
              {monthPastError}
            </p>
          ) : (
            <p className={HELPER_CLASS} style={HELPER_COLOR}>
              Mes en que se realizará el primer pago. Las siguientes cuotas se calcularán cada 30 días.
            </p>
          )}
        </div>

        {/* Número de cuotas — limitado al máximo disponible */}
        <div>
          <label htmlFor="numberOfPayments" className={LABEL_CLASS}>
            Número de cuotas / pagos <span className="text-red-500">*</span>
          </label>
          <input
            id="numberOfPayments"
            type="text"
            inputMode="numeric"
            placeholder={fields.firstPaymentMonth ? `Máximo ${maxCuotas}` : '4'}
            value={fields.numberOfPayments}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleNumberOfPayments(e.target.value)}
            className={INPUT_BASE}
          />
          {/* #59 — aviso modalidad forzada */}
          {forcedSinInteresMsg && (
            <div
              className="mt-2 rounded-lg px-3 py-2 text-xs font-medium"
              style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF' }}
              role="alert"
            >
              {forcedSinInteresMsg}
            </div>
          )}
          {/* #54 — helper text: cuotas incluye la inicial */}
          <p className={HELPER_CLASS} style={HELPER_COLOR}>
            {fields.firstPaymentMonth
              ? `Máximo ${maxCuotas} cuota(s). El número de cuotas incluye la cuota inicial.`
              : 'Selecciona el mes de la primera cuota para ver el máximo. El número de cuotas incluye la cuota inicial.'}
          </p>
        </div>
      </section>

      {/* Banner de error de API / validación */}
      {apiError && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-sm font-medium"
          style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
          role="alert"
        >
          {apiError}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
           Diálogo de confirmación modal — se usa para acciones destructivas:
           - Limpiar formulario (SimulationForm)
           - Nueva simulación / Guardar simulación (SimulationResultsPreview)
           Renderizado dentro del <form> para centralizar el portal;
           se controla vía estado `dialog`.
      ───────────────────────────────────────────────────────────────── */}
      {dialog.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          onClick={closeDialog}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-7 mx-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="confirm-dialog-title"
              className="text-base font-bold text-gray-900 mb-2"
            >
              {dialog.title}
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDialog}
                className="px-5 py-2 rounded-full text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { dialog.onConfirm(); closeDialog(); }}
                className="px-5 py-2 rounded-full text-sm font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                style={{ backgroundColor: '#A85BFF' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Botones de acción ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
        >
          {loading ? 'Calculando...' : 'Calcular Simulación'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="w-full sm:w-auto px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:brightness-125 active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: '#262626' }}
        >
          Limpiar formulario
        </button>
      </div>
    </form>
  );
}
