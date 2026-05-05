/* ─────────────────────────────────────────────────────────────────────
   PÁGINA: AdminParametersPage  (RF-10, RF-23, RF-24 — Épica EP-08)
   Panel de administración para gestionar los parámetros financieros
   del simulador de crédito UPB.
───────────────────────────────────────────────────────────────────── */

import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import { BackNavLink } from '@/shared/components/BackNavLink';
import { useState, useEffect } from 'react';
import {
  getActiveParameters,
  updateParameterVersion,
  type AdminParameterVersion,
} from '@/shared/services/api';
import {
  Pencil,
  Save,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  GraduationCap,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

interface MinInitialPctForm {
  pregradoSinInteres: string;
  pregradoConInteres: string;
  upbTecSinInteres: string;
  upbTecConInteres: string;
}

interface InitialPaymentForm {
  extra0: string; extra1: string; extra2: string;
  extra3: string; extra4: string; extra5: string;
}

/** HU-PV-01: Configuración de tasa por número de pagos para un nivel */
interface LevelConfigFormEntry {
  isActive: boolean;
  validFrom: string;
  rates: [string, string, string, string, string, string]; // payment_count 1..6 como % strings
  sinInteresMax: string; // máx. cuotas totales sin interés para este nivel
  conInteresMax: string; // máx. cuotas totales con interés para este nivel
}

type LevelConfigsForm = Record<'PREGRADO' | 'POSGRADO' | 'UPB_Tech', LevelConfigFormEntry>;

interface ParameterFormState {
  versionId: string;
  /** Fechas de la versión — se envían sin cambios al guardar */
  _validFrom: string;
  _validTo: string;
  _notes: string;
  minInitialPct: MinInitialPctForm;
  initialPayments: InitialPaymentForm;
  /** HU-PV-01: Configuración por nivel académico (incluye límites por nivel) */
  levelConfigs: LevelConfigsForm;
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════


function percentToRate(pct: string): number {
  return parseFloat(pct.replace(',', '.')) / 100;
}

/** Clamp a percentage string value between 0 and 100 */
function clampPct(raw: string): string {
  if (raw === '' || raw === '-') return '';
  const n = parseFloat(raw.replace(',', '.'));
  if (isNaN(n)) return '';
  if (n < 0) return '0';
  if (n > 100) return '100';
  return raw;
}

/** Clamp an integer string value between min and max */
function clampInt(raw: string, min: number, max: number): string {
  if (raw === '' || raw === '-') return '';
  const n = parseInt(raw, 10);
  if (isNaN(n)) return '';
  if (n < min) return String(min);
  if (n > max) return String(max);
  return raw;
}

const LEVEL_SCOPES = ['PREGRADO', 'POSGRADO', 'UPB_Tech'] as const;

/** Construye el estado del formulario de levelConfigs desde la versión activa */
function todayInBogota(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function buildLevelConfigsFromVersion(v: AdminParameterVersion): LevelConfigsForm {
  const today = todayInBogota();
  const defaultEntry = (): LevelConfigFormEntry => ({
    isActive: true,
    validFrom: today,
    rates: ['0', '0', '0', '0', '0', '0'],
    sinInteresMax: '3',
    conInteresMax: '6',
  });

  const result: LevelConfigsForm = {
    PREGRADO: defaultEntry(),
    POSGRADO: defaultEntry(),
    UPB_Tech: defaultEntry(),
  };

  const cfgs = v.levelConfigs ?? [];
  for (const scope of LEVEL_SCOPES) {
    // Tomar el config más reciente para este scope (puede ser activo o inactivo)
    const levelCfgs = cfgs.filter(c => c.levelScope === scope);
    if (levelCfgs.length > 0) {
      const latest = levelCfgs[0];
      result[scope].isActive = latest.isActive;
      result[scope].validFrom = latest.validFrom;
      if (latest.maxPaymentsSinInteres != null)
        result[scope].sinInteresMax = String(latest.maxPaymentsSinInteres);
      if (latest.maxPaymentsConInteres != null)
        result[scope].conInteresMax = String(latest.maxPaymentsConInteres);
      const rates: [string, string, string, string, string, string] = ['0', '0', '0', '0', '0', '0'];
      for (const c of levelCfgs) {
        if (c.paymentCount >= 1 && c.paymentCount <= 6) {
          rates[c.paymentCount - 1] = String(parseFloat((c.rateMonthly * 100).toFixed(10)));
        }
      }
      result[scope].rates = rates;
    }
  }
  return result;
}

/** Deriva el porcentaje mínimo de cuota inicial para un (level, modality) desde initialPaymentRules.
 *  El mínimo es el initialPctRequired de la fila con mayor extraInstallments (la más permisiva = el piso). */
function deriveMinInitialPct(
  rules: AdminParameterVersion['initialPaymentRules'],
  level: string,
  modality: string,
): string {
  const matches = rules.filter(r => r.level === level && r.modality === modality);
  if (matches.length === 0) return '';
  const last = matches.reduce((a, b) => a.extraInstallments > b.extraInstallments ? a : b);
  return (last.initialPctRequired * 100).toFixed(2).replace(/\.?0+$/, '');
}

function buildFormFromVersion(v: AdminParameterVersion): ParameterFormState {
  const getInitPct = (extra: number) =>
    v.initialPaymentRules.find(
      r => r.level === 'PREGRADO' && r.modality === 'CON_INTERES' && r.extraInstallments === extra,
    );

  const ip = (extra: number) => {
    const rule = getInitPct(extra);
    return rule ? (rule.initialPctRequired * 100).toFixed(2).replace(/\.?0+$/, '') : '';
  };

  return {
    versionId: v.id,
    _validFrom: v.validFrom,
    _validTo: v.validTo ?? '',
    _notes: v.notes ?? '',
    minInitialPct: {
      pregradoSinInteres: deriveMinInitialPct(v.initialPaymentRules, 'PREGRADO', 'SIN_INTERES'),
      pregradoConInteres: deriveMinInitialPct(v.initialPaymentRules, 'PREGRADO', 'CON_INTERES'),
      upbTecSinInteres:   deriveMinInitialPct(v.initialPaymentRules, 'UPB_Tech', 'SIN_INTERES'),
      upbTecConInteres:   deriveMinInitialPct(v.initialPaymentRules, 'UPB_Tech', 'CON_INTERES'),
    },
    initialPayments: {
      extra0: ip(0), extra1: ip(1), extra2: ip(2),
      extra3: ip(3), extra4: ip(4), extra5: ip(5),
    },
    levelConfigs: buildLevelConfigsFromVersion(v),
  };
}


// ═══════════════════════════════════════════════════════════════════════
// Reusable UI primitives
// ═══════════════════════════════════════════════════════════════════════

interface FieldProps {
  label: string;
  helper?: string;
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  suffix?: string;
  onChange?: (v: string) => void;
  onBlur?: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}

function Field({ label, helper, value, placeholder, readOnly, suffix, onChange, onBlur, type = 'text', inputMode }: FieldProps) {
  return (
    <div className="flex flex-col mb-4">
      <label className="text-[13px] font-medium text-gray-600 mb-1.5 min-h-10 flex items-end gap-0.5">
        <span>{label}</span>{!readOnly && <span className="text-red-400 shrink-0">*</span>}
      </label>
      {helper && <p className="text-[11px] text-gray-400 mb-1">{helper}</p>}
      <div className="relative mt-auto">
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder ?? ''}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          onBlur={e => onBlur?.(e.target.value)}
          className={[
            'w-full rounded-lg border px-3 py-2 text-sm transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/40 focus:border-[#6b21a8]',
            '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            readOnly
              ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-default'
              : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400',
            suffix ? 'pr-16' : '',
          ].join(' ')}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}

function Card({ icon, title, children, className = '' }: CardProps) {
  return (
    <section className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-col ${className}`.trimEnd()}>
      <div className="flex items-center gap-2.5 mb-5">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#6b21a8]/10 text-[#6b21a8]">
          {icon}
        </span>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════

export function AdminParametersPage() {
  const [profileOpen, setProfileOpen] = useState(false);

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [pencilAnim, setPencilAnim] = useState(false);
  const [saveAnim, setSaveAnim]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm]           = useState<ParameterFormState | null>(null);
  const [original, setOriginal]   = useState<AdminParameterVersion | null>(null);

  // ── Carga de datos ────────────────────────────────────────────────────

  async function fetchActiveParams() {
    const activeRes = await getActiveParameters();
    if (activeRes.error) {
      setError(activeRes.error);
      setLoading(false);
      return;
    }
    const activeVersion = activeRes.data?.data ?? null;
    if (!activeVersion) {
      setLoading(false);
      return;
    }
    setOriginal(activeVersion);
    setForm(buildFormFromVersion(activeVersion));
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const activeRes = await getActiveParameters();
      if (cancelled) return;

      if (activeRes.error) {
        setError(activeRes.error);
        setLoading(false);
        return;
      }

      const activeVersion = activeRes.data?.data ?? null;
      if (!activeVersion) {
        setLoading(false);
        return;
      }

      setOriginal(activeVersion);
      setForm(buildFormFromVersion(activeVersion));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Validación ────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!form) return 'No hay datos cargados';
    const LEVEL_LABELS: Record<string, string> = { PREGRADO: 'Pregrado', POSGRADO: 'Posgrado', UPB_Tech: 'UPB Tech' };
    for (const scope of LEVEL_SCOPES) {
      const entry = form.levelConfigs[scope];
      const sin = parseInt(entry.sinInteresMax, 10);
      const con = parseInt(entry.conInteresMax, 10);
      if (isNaN(sin) || sin < 1) return `${LEVEL_LABELS[scope]}: el máximo de cuotas sin interés debe ser al menos 1`;
      if (sin > 6) return `${LEVEL_LABELS[scope]}: el máximo de cuotas sin interés no puede superar 6`;
      if (isNaN(con) || con < 1) return `${LEVEL_LABELS[scope]}: el máximo de cuotas con interés debe ser al menos 1`;
      if (con > 6) return `${LEVEL_LABELS[scope]}: el máximo de cuotas con interés no puede superar 6`;
      if (sin > con) return `${LEVEL_LABELS[scope]}: el límite sin interés no puede ser mayor que el límite con interés`;
      // Validar que los campos CON INT. no tengan tasa 0
      for (let i = sin; i < con; i++) {
        const ratePct = parseFloat((entry.rates[i] ?? '0').replace(',', '.'));
        if (isNaN(ratePct) || ratePct <= 0) {
          const payLabel = i === 0 ? '1 pago' : `${i + 1} pagos`;
          return `${LEVEL_LABELS[scope]}: la cuota "${payLabel}" tiene modalidad CON INTERÉS pero su tasa es 0%. Debe ingresar un porcentaje mayor a 0.`;
        }
      }
    }
    const pregSin = parseFloat(form.minInitialPct.pregradoSinInteres);
    const pregCon = parseFloat(form.minInitialPct.pregradoConInteres);
    const tecSin  = parseFloat(form.minInitialPct.upbTecSinInteres);
    const tecCon  = parseFloat(form.minInitialPct.upbTecConInteres);
    if (isNaN(pregSin) || pregSin < 0 || pregSin > 100) return 'Cuota inicial mínima Pregrado sin intereses inválida (0-100)';
    if (isNaN(pregCon) || pregCon < 0 || pregCon > 100) return 'Cuota inicial mínima Pregrado con intereses inválida (0-100)';
    if (isNaN(tecSin)  || tecSin  < 0 || tecSin  > 100) return 'Cuota inicial mínima UPB Tech sin intereses inválida (0-100)';
    if (isNaN(tecCon)  || tecCon  < 0 || tecCon  > 100) return 'Cuota inicial mínima UPB Tech con intereses inválida (0-100)';
    return null;
  }

  // ── Guardar ─────────────────────────────────────────────────────────

  /** Construye las reglas de cuota inicial actualizadas desde el form */
  function buildSharedRules() {
    const formInitPcts: Record<number, number> = {};
    ([
      [0, form!.initialPayments.extra0],
      [1, form!.initialPayments.extra1],
      [2, form!.initialPayments.extra2],
      [3, form!.initialPayments.extra3],
      [4, form!.initialPayments.extra4],
      [5, form!.initialPayments.extra5],
    ] as [number, string][]).forEach(([key, value]) => {
      const rate = percentToRate(value);
      if (Number.isFinite(rate)) formInitPcts[key] = rate;
    });

    // Porcentajes mínimos editados por (level, modality)
    const minPcts = form!.minInitialPct;
    const minPctMap: Record<string, number> = {
      'PREGRADO|SIN_INTERES': percentToRate(minPcts.pregradoSinInteres),
      'PREGRADO|CON_INTERES': percentToRate(minPcts.pregradoConInteres),
      'POSGRADO|SIN_INTERES': percentToRate(minPcts.pregradoSinInteres),
      'POSGRADO|CON_INTERES': percentToRate(minPcts.pregradoConInteres),
      'UPB_Tech|SIN_INTERES': percentToRate(minPcts.upbTecSinInteres),
      'UPB_Tech|CON_INTERES': percentToRate(minPcts.upbTecConInteres),
    };

    const initialPaymentRules = original!.initialPaymentRules.map(rule => {
      const comboKey = `${rule.level}|${rule.modality}`;
      const newMinPct = minPctMap[comboKey];

      // Reglas PREGRADO/CON_INTERES y POSGRADO/CON_INTERES: actualizar con tabla de cuotas
      const isTableEditable =
        (rule.level === 'PREGRADO' || rule.level === 'POSGRADO') &&
        rule.modality === 'CON_INTERES' &&
        rule.extraInstallments in formInitPcts;

      let initialPctRequired = rule.initialPctRequired;

      if (
        isTableEditable &&
        Number.isFinite(newMinPct) &&
        rule.extraInstallments >= (parseInt(form!.levelConfigs[rule.level].sinInteresMax, 10) || 0)
      ) {
        // El campo "Con intereses" controla el minimo real de las cuotas con interes.
        initialPctRequired = newMinPct;
      } else if (isTableEditable) {
        // Valor de la tabla (cuotas individuales)
        initialPctRequired = formInitPcts[rule.extraInstallments];
      } else if (Number.isFinite(newMinPct)) {
        // Todas las reglas del combo usan el mismo mínimo editado
        initialPctRequired = newMinPct;
      }

      return {
        level: rule.level,
        modality: rule.modality,
        extraInstallments: rule.extraInstallments,
        initialPctRequired,
      };
    });

    return { initialPaymentRules };
  }

  async function handleSave() {
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 520);
    if (!form || !original) return;

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const { initialPaymentRules } = buildSharedRules();

    const levelConfigsPayload = LEVEL_SCOPES.flatMap(scope => {
      const entry = form.levelConfigs[scope];
      const sinMax = parseInt(entry.sinInteresMax, 10) || 1;
      const conMax = parseInt(entry.conInteresMax, 10) || 6;
      return entry.rates
        .map((ratePct, idx) => {
          const paymentCount = idx + 1;
          const isZeroForced = idx === 0 || paymentCount <= sinMax;
          return {
            levelScope: scope,
            isActive: entry.isActive,
            validFrom: entry.validFrom,
            paymentCount,
            rateMonthly: isZeroForced ? 0 : percentToRate(ratePct || '0'),
            maxPaymentsSinInteres: sinMax,
            maxPaymentsConInteres: conMax,
          };
        })
        .filter(row => row.paymentCount <= conMax);
    });

    const res = await updateParameterVersion(form.versionId, {
      validFrom: form._validFrom,
      validTo: form._validTo || null,
      notes: form._notes || null,
      initialPaymentRules,
      levelConfigs: levelConfigsPayload,
    });

    if (res.error) { setSaving(false); setError(res.error); return; }

    setSaving(false);
    setSuccessMsg('Parámetros actualizados correctamente.');
    setEditMode(false);
    void fetchActiveParams();
  }

  function handleCancelEdit() {
    if (original) setForm(buildFormFromVersion(original));
    setEditMode(false);
    setError(null);
  }

  function setField<K extends keyof ParameterFormState>(key: K, subKey: string, value: string) {
    setForm(prev => {
      if (!prev) return prev;
      return { ...prev, [key]: { ...(prev[key] as unknown as Record<string, string>), [subKey]: value } };
    });
  }

  /** HU-PV-01: Actualiza un campo del levelConfig para un nivel */
  function setLevelConfig(scope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech', patch: Partial<LevelConfigFormEntry>) {
    setForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        levelConfigs: {
          ...prev.levelConfigs,
          [scope]: { ...prev.levelConfigs[scope], ...patch },
        },
      };
    });
  }

  function setLevelRate(scope: 'PREGRADO' | 'POSGRADO' | 'UPB_Tech', idx: number, value: string) {
    setForm(prev => {
      if (!prev) return prev;
      const entry = prev.levelConfigs[scope];
      const rates = [...entry.rates] as [string, string, string, string, string, string];
      rates[idx] = value;
      return {
        ...prev,
        levelConfigs: {
          ...prev.levelConfigs,
          [scope]: { ...entry, rates },
        },
      };
    });
  }

  // ── Section renderers ──────────────────────────────────────────────────

  /** HU-PV-01: Paneles de configuración por nivel académico */
  function renderLevelConfigs() {
    if (!form) return null;

    const LEVEL_LABELS: Record<string, string> = {
      PREGRADO: 'Pregrado',
      POSGRADO: 'Posgrado',
      UPB_Tech: 'UPB Tech',
    };

    const PAYMENT_LABELS = [
      'Solo cuota inicial (1 pago)',
      'Cuota inicial + 1 cuota (2 pagos)',
      'Cuota inicial + 2 cuotas (3 pagos)',
      'Cuota inicial + 3 cuotas (4 pagos)',
      'Cuota inicial + 4 cuotas (5 pagos)',
      'Cuota inicial + 5 cuotas (6 pagos)',
    ];

    return (
      <Card icon={<GraduationCap size={18} />} title="Cuotas vs Tasas de Interés por Nivel">
        <p className="text-[11px] text-gray-400 mb-5">
          Configure los límites de cuotas y el porcentaje de interés mensual vencido (M.V.) por número de pagos para cada nivel.
          Los pagos dentro del límite sin interés se deshabilitan automáticamente (tasa 0%). Cada nivel puede activarse o desactivarse.
        </p>

        <div className="flex flex-col gap-6">
          {LEVEL_SCOPES.map(scope => {
            const entry = form.levelConfigs[scope];
            const label = LEVEL_LABELS[scope];
            const sinMax = parseInt(entry.sinInteresMax, 10) || 0;
            const conMax = parseInt(entry.conInteresMax, 10) || 6;

            return (
              <div
                key={scope}
                className={[
                  'rounded-xl border-2 px-5 pt-4 pb-5 transition-all duration-200',
                  entry.isActive
                    ? 'border-[#7c3aed]/40 bg-[#7c3aed]/2'
                    : 'border-gray-200 bg-gray-50/50',
                ].join(' ')}
              >
                {/* ── Header del panel ── */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-gray-800">{label}</h3>
                    {/* Badge de estado actual */}
                    <span className={[
                      'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full select-none',
                      entry.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600',
                    ].join(' ')}>
                      <span className={[
                        'w-2 h-2 rounded-full',
                        entry.isActive
                          ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.6)]'
                          : 'bg-red-400',
                      ].join(' ')} />
                      {entry.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Botones Activar / Desactivar */}
                  {editMode && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLevelConfig(scope, { isActive: true, validFrom: todayInBogota() })}
                        className={[
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1',
                          entry.isActive
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm focus:ring-emerald-400'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-600 focus:ring-emerald-300',
                        ].join(' ')}
                      >
                        <span className={[
                          'w-2 h-2 rounded-full',
                          entry.isActive ? 'bg-white' : 'bg-gray-400',
                        ].join(' ')} />
                        Activar
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevelConfig(scope, { isActive: false, validFrom: '' })}
                        className={[
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1',
                          !entry.isActive
                            ? 'bg-red-500 border-red-500 text-white shadow-sm focus:ring-red-400'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600 focus:ring-red-300',
                        ].join(' ')}
                      >
                        <span className={[
                          'w-2 h-2 rounded-full',
                          !entry.isActive ? 'bg-white' : 'bg-gray-400',
                        ].join(' ')} />
                        Desactivar
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Vigencia desde ── */}
                {entry.isActive && (
                  <div className="mb-4 max-w-xs">
                    <Field
                      label="Vigencia desde"
                      value={entry.validFrom}
                      type="text"
                      placeholder="AAAA-MM-DD"
                      readOnly={!editMode}
                      onChange={v => setLevelConfig(scope, { validFrom: v })}
                    />
                  </div>
                )}
                {!entry.isActive && (
                  <div className="mb-4 max-w-xs">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Vigencia desde</label>
                    <div className="h-9 rounded-lg border border-gray-200 bg-gray-100 px-3 flex items-center">
                      <span className="text-xs text-gray-400 italic">— nivel inactivo —</span>
                    </div>
                  </div>
                )}

                {/* ── Límites de cuotas por modalidad ── */}
                {(() => {
                  const sinVal = parseInt(entry.sinInteresMax, 10);
                  const conVal = parseInt(entry.conInteresMax, 10);
                  const limitsError =
                    !isNaN(sinVal) && !isNaN(conVal) && sinVal > conVal
                      ? `El límite sin interés (${sinVal}) no puede ser mayor que el límite con interés (${conVal})`
                      : null;

                  return (
                    <div className="mb-5">
                      <div className={[
                        'grid grid-cols-1 sm:grid-cols-2 gap-x-5 p-3 rounded-lg border',
                        limitsError ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-100',
                      ].join(' ')}>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Límites de cuotas</p>
                          <div className="grid grid-cols-2 gap-x-4">
                            <Field
                              label="Máx. sin interés"
                              value={entry.sinInteresMax}
                              placeholder="3"
                              type="text"
                              inputMode="numeric"
                              readOnly={!editMode}
                              onChange={v => {
                                const cleaned = v.replace(/[^0-9]/g, '');
                                const clamped = cleaned && parseInt(cleaned, 10) > 3 ? '3' : cleaned;
                                const newSin = parseInt(clamped, 10);
                                setForm(prev => {
                                  if (!prev) return prev;
                                  const current = prev.levelConfigs[scope];
                                  const rates = [...current.rates] as [string, string, string, string, string, string];
                                  // Idx 0 (1 pago) siempre 0; y los primeros newSin también
                                  rates[0] = '0';
                                  if (!isNaN(newSin)) {
                                    for (let i = 0; i < newSin; i++) rates[i] = '0';
                                  }
                                  return {
                                    ...prev,
                                    levelConfigs: {
                                      ...prev.levelConfigs,
                                      [scope]: { ...current, sinInteresMax: clamped, rates },
                                    },
                                  };
                                });
                              }}
                              onBlur={v => {
                                // Al perder foco: clampear a 1-3 (DB constraint chk_lc_max_sin)
                                const clamped = clampInt(v, 1, 3);
                                const newSin = parseInt(clamped, 10);
                                setForm(prev => {
                                  if (!prev) return prev;
                                  const current = prev.levelConfigs[scope];
                                  const rates = [...current.rates] as [string, string, string, string, string, string];
                                  if (!isNaN(newSin)) {
                                    for (let i = 0; i < newSin; i++) rates[i] = '0';
                                  }
                                  return {
                                    ...prev,
                                    levelConfigs: {
                                      ...prev.levelConfigs,
                                      [scope]: { ...current, sinInteresMax: clamped || '1', rates },
                                    },
                                  };
                                });
                              }}
                            />
                            <Field
                              label="Máx. con interés"
                              value={entry.conInteresMax}
                              placeholder="6"
                              type="text"
                              inputMode="numeric"
                              readOnly={!editMode}
                              onChange={v => {
                                const cleaned = v.replace(/[^0-9]/g, '');
                                const clamped = cleaned && parseInt(cleaned, 10) > 6 ? '6' : cleaned;
                                setForm(prev => {
                                  if (!prev) return prev;
                                  const current = prev.levelConfigs[scope];
                                  return {
                                    ...prev,
                                    levelConfigs: {
                                      ...prev.levelConfigs,
                                      [scope]: { ...current, conInteresMax: clamped },
                                    },
                                  };
                                });
                              }}
                              onBlur={v => {
                                const clamped = clampInt(v, 1, 6);
                                setForm(prev => {
                                  if (!prev) return prev;
                                  const current = prev.levelConfigs[scope];
                                  return {
                                    ...prev,
                                    levelConfigs: {
                                      ...prev.levelConfigs,
                                      [scope]: { ...current, conInteresMax: clamped || '1' },
                                    },
                                  };
                                });
                              }}
                            />
                          </div>
                        </div>
                        {limitsError && (
                          <div className="flex items-end pb-4">
                            <p className="text-[11px] font-semibold text-red-600 leading-relaxed">
                              ⚠ {limitsError}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Tasas por número de pagos ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-1">
                  {PAYMENT_LABELS.map((plabel, idx) => {
                    const paymentCount = idx + 1;
                    const isSinInteres = paymentCount <= sinMax;
                    const isOutOfRange = paymentCount > conMax;
                    // idx=0 y celdas sin interés: siempre 0, nunca editables
                    const isZeroForced = idx === 0 || isSinInteres;

                    const currentRatePct = parseFloat((entry.rates[idx] ?? '0').replace(',', '.'));
                    const isConInteresZero = !isZeroForced && !isOutOfRange && (isNaN(currentRatePct) || currentRatePct <= 0);

                    return (
                      <div key={idx} className="relative">
                        <Field
                          label={plabel}
                          value={isOutOfRange ? '' : isZeroForced ? '0' : entry.rates[idx]}
                          suffix={isOutOfRange ? undefined : '% M.V.'}
                          placeholder={isOutOfRange ? '—' : '0'}
                          type="text"
                          inputMode="decimal"
                          readOnly={!editMode || isOutOfRange || isZeroForced}
                          onChange={v => setLevelRate(scope, idx, clampPct(v))}
                        />
                        {/* Badge indicador de modalidad */}
                        {!isOutOfRange && (
                          <span className={[
                            'absolute top-0 right-0 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-md rounded-tr-md',
                            isSinInteres
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-purple-100 text-purple-700',
                          ].join(' ')}>
                            {isSinInteres ? 'SIN INT.' : 'CON INT.'}
                          </span>
                        )}
                        {isOutOfRange && (
                          <span className="absolute top-0 right-0 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-md rounded-tr-md bg-gray-100 text-gray-400">
                            N/A
                          </span>
                        )}
                        {/* Advertencia: CON INT. con tasa 0 */}
                        {isConInteresZero && editMode && (
                          <p className="mt-1 text-[10px] font-semibold text-amber-600 leading-tight">
                            ⚠ Tasa requerida: este campo tiene interés y no puede ser 0%.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Mensaje cuando está inactivo ── */}
                {!entry.isActive && (
                  <div className="mt-3 rounded-lg px-3 py-2 text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700">
                    Este nivel está deshabilitado. Los estudiantes no podrán crear simulaciones para {label}.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  function renderCuotaMinima() {
    if (!form) return null;

    const fields = [
      { label: 'Sin intereses (Pregrado y Posgrado)', key: 'pregradoSinInteres' as const },
      { label: 'Con intereses (Pregrado y Posgrado)', key: 'pregradoConInteres' as const },
      { label: 'Sin intereses (UPB Tech)',             key: 'upbTecSinInteres'   as const },
      { label: 'Con intereses (UPB Tech)',             key: 'upbTecConInteres'   as const },
    ];

    return (
      <Card icon={<ShieldCheck size={18} />} title="Cuota Inicial Mínima">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {fields.map(({ label, key }) => (
            <Field
              key={key}
              label={label}
              placeholder="20"
              value={form.minInitialPct[key]}
              suffix="%"
              type="text"
              inputMode="decimal"
              readOnly={!editMode}
              onChange={v => setField('minInitialPct', key, clampPct(v))}
            />
          ))}
        </div>
      </Card>
    );
  }


  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-white"
      onClick={() => { if (profileOpen) setProfileOpen(false); }}
    >
      <UpbHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen(p => !p)}
      />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 py-10">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Parámetros del Simulador
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestión de tasas de interés, cuotas iniciales y límites por modalidad
            </p>
          </div>
          <BackNavLink to="/admin/main" label="Volver al menú" />
        </div>

        {/* ── Alerts ──────────────────────────────────────────── */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm" role="alert">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && !error && (
          <div className="mb-5 flex items-start gap-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm" role="status">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-28 text-gray-400">
            <Loader2 size={28} className="animate-spin mr-3 text-[#6b21a8]" />
            <span className="text-sm">Cargando parámetros...</span>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────── */}
        {!loading && !form && (
          <div className="flex flex-col items-center justify-center py-28 text-gray-400">
            <Inbox size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-semibold text-gray-500 mb-1">Sin versión activa</p>
            <p className="text-sm text-center max-w-md">
              No existe una versión de parámetros vigente para la fecha actual.
              Contacte al equipo técnico para sembrar los datos iniciales.
            </p>
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────── */}
        {!loading && form && (
          <>
            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-linear-to-br from-[#6b21a8] to-[#a855f7] shadow-sm">
                  <Sparkles size={14} className="text-white" />
                </span>
                <span className="text-sm font-semibold text-gray-700">Versión activa</span>
              </div>

              {!editMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setPencilAnim(true);
                    setTimeout(() => {
                      setPencilAnim(false);
                      setEditMode(true);
                      setSuccessMsg(null);
                      setError(null);
                    }, 560);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#6b21a8] hover:bg-[#581c87] shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/50"
                >
                  <Pencil size={15} className={pencilAnim ? 'animate-pencil-write' : ''} />
                  Editar parámetros
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    <X size={15} />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#6b21a8] hover:bg-[#581c87] shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/50 disabled:opacity-60"
                  >
                    {saving
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Save size={15} className={saveAnim ? 'animate-save-bounce' : ''} />}
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </div>

            {/* ── Configuración por nivel (full width) ── */}
            {renderLevelConfigs()}

            {/* ── Cuota mínima ── */}
            {renderCuotaMinima()}

            {/* ── Mobile sticky save bar ── */}
            {editMode && (
              <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 p-3 flex gap-3 xl:hidden">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <X size={15} /> Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6b21a8] hover:bg-[#581c87] transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} className={saveAnim ? 'animate-save-bounce' : ''} />}
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <UpbFooter />
    </div>
  );
}

