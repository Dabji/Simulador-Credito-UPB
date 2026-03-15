/* ─────────────────────────────────────────────────────────────────────
   PÁGINA: AdminParametersPage  (RF-10, RF-23, RF-24 — Épica EP-08)
   Panel de administración para gestionar los parámetros financieros
   del simulador de crédito UPB.
───────────────────────────────────────────────────────────────────── */

import { useNavigate } from 'react-router-dom';
import { UpbHeader } from '@/shared/components/UpbHeader';
import { UpbFooter } from '@/shared/components/UpbFooter';
import { useState, useEffect, useCallback } from 'react';
import {
  getActiveParameters,
  updateParameterVersion,
  type AdminParameterVersion,
} from '@/shared/services/api';
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  Loader2,
  TrendingUp,
  Sparkles,
  Percent,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Inbox,
} from 'lucide-react';

/** A complete set of all 3 institutional rates with per-rate vigencia (UI only) */
interface RateSet {
  pregradoRate: string;
  pregradoValidFrom: string;
  posgradoRate: string;
  posgradoValidFrom: string;
  upbTecRate: string;
  upbTecValidFrom: string;
}

type ActiveOption = 1 | 2;

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

interface ModalityLimitsForm {
  sinInteresMax: string;
  conInteresMax: string;
}

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

interface ParameterFormState {
  versionId: string;
  /** Version-level dates — passed through unchanged on save */
  _validFrom: string;
  _validTo: string;
  _notes: string;
  /** Two alternative rate configurations; activeOption decides which is saved */
  rateOptions: [RateSet, RateSet];
  limits: ModalityLimitsForm;
  minInitialPct: MinInitialPctForm;
  initialPayments: InitialPaymentForm;
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function rateToPercent(rate: number): string {
  return (rate * 100).toFixed(4).replace(/\.?0+$/, '');
}

function percentToRate(pct: string): number {
  return parseFloat(pct) / 100;
}

/** Clamp a percentage string value between 0 and 100 */
function clampPct(raw: string): string {
  if (raw === '' || raw === '-') return '';
  const n = parseFloat(raw);
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

function buildFormFromVersion(v: AdminParameterVersion): ParameterFormState {
  const pregrado = v.interestRates.find(r => r.levelScope === 'PREGRADO');
  const posgrado = v.interestRates.find(r => r.levelScope === 'POSGRADO');
  const upbTec   = v.interestRates.find(r => r.levelScope === 'UPB_TEC');

  const sinInteresPreg = v.modalityRules.find(r => r.modality === 'SIN_INTERES' && r.level === 'PREGRADO');
  const conInteresPreg = v.modalityRules.find(r => r.modality === 'CON_INTERES' && r.level === 'PREGRADO');
  const sinInteresTec  = v.modalityRules.find(r => r.modality === 'SIN_INTERES' && r.level === 'UPB_TEC');
  const conInteresTec  = v.modalityRules.find(r => r.modality === 'CON_INTERES' && r.level === 'UPB_TEC');

  const getInitPct = (extra: number) =>
    v.initialPaymentRules.find(
      r => r.level === 'PREGRADO' && r.modality === 'CON_INTERES' && r.extraInstallments === extra,
    );

  const ip = (extra: number) => {
    const rule = getInitPct(extra);
    return rule ? (rule.initialPctRequired * 100).toFixed(2).replace(/\.?0+$/, '') : '';
  };

  /** Blank template used for options 2 & 3 on fresh load */
  const emptyRateSet: RateSet = { pregradoRate: '', pregradoValidFrom: '', posgradoRate: '', posgradoValidFrom: '', upbTecRate: '', upbTecValidFrom: '' };

  return {
    versionId: v.id,
    _validFrom: v.validFrom,
    _validTo: v.validTo ?? '',
    _notes: v.notes ?? '',
    rateOptions: [
      {
        pregradoRate: pregrado ? rateToPercent(pregrado.rateMonthly) : '',
        pregradoValidFrom: v.validFrom,
        posgradoRate: posgrado ? rateToPercent(posgrado.rateMonthly) : '',
        posgradoValidFrom: v.validFrom,
        upbTecRate:   upbTec   ? rateToPercent(upbTec.rateMonthly)   : '',
        upbTecValidFrom: v.validFrom,
      },
      { ...emptyRateSet },
    ],
    limits: {
      sinInteresMax: sinInteresPreg ? String(sinInteresPreg.maxTotalPayments) : '',
      conInteresMax: conInteresPreg ? String(conInteresPreg.maxTotalPayments) : '',
    },
    minInitialPct: {
      pregradoSinInteres: sinInteresPreg ? (sinInteresPreg.minInitialPct * 100).toFixed(2).replace(/\.?0+$/, '') : '',
      pregradoConInteres: conInteresPreg ? (conInteresPreg.minInitialPct * 100).toFixed(2).replace(/\.?0+$/, '') : '',
      upbTecSinInteres:   sinInteresTec  ? (sinInteresTec.minInitialPct  * 100).toFixed(2).replace(/\.?0+$/, '') : '',
      upbTecConInteres:   conInteresTec  ? (conInteresTec.minInitialPct  * 100).toFixed(2).replace(/\.?0+$/, '') : '',
    },
    initialPayments: {
      extra0: ip(0), extra1: ip(1), extra2: ip(2),
      extra3: ip(3), extra4: ip(4), extra5: ip(5),
    },
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
  type?: string;
}

function Field({ label, helper, value, placeholder, readOnly, suffix, onChange, type = 'text' }: FieldProps) {
  return (
    <div className="flex flex-col mb-4">
      <label className="text-[13px] font-medium text-gray-600 mb-1.5 min-h-10 flex items-end gap-0.5">
        <span>{label}</span>{!readOnly && <span className="text-red-400 shrink-0">*</span>}
      </label>
      {helper && <p className="text-[11px] text-gray-400 mb-1">{helper}</p>}
      <div className="relative mt-auto">
        <input
          type={type}
          value={value}
          placeholder={placeholder ?? ''}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          className={[
            'w-full rounded-lg border px-3 py-2 text-sm transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/40 focus:border-[#6b21a8]',
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
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [pencilAnim, setPencilAnim] = useState(false);
  const [saveAnim, setSaveAnim]     = useState(false);
  /** Which of the 3 rate-option cards is currently selected as primary */
  const [activeOption, setActiveOption] = useState<ActiveOption>(1);
  const [error, setError]         = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm]           = useState<ParameterFormState | null>(null);
  const [original, setOriginal]   = useState<AdminParameterVersion | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────

  const loadParams = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getActiveParameters();
    if (res.error) {
      setError(res.error);
    } else if (res.data?.data) {
      const version = res.data.data;
      setOriginal(version);
      setForm(buildFormFromVersion(version));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const res = await getActiveParameters();
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
      } else if (res.data?.data) {
        const version = res.data.data;
        setOriginal(version);
        setForm(buildFormFromVersion(version));
      }
      setLoading(false);
    }
    void init();
    return () => { cancelled = true; };
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!form) return 'No hay datos cargados';

    const active = form.rateOptions[activeOption - 1];
    const pregRate = parseFloat(active.pregradoRate);
    const tecRate  = parseFloat(active.upbTecRate);

    if (isNaN(pregRate) || pregRate <= 0) return `Opción ${activeOption} — la tasa de Pregrado / Posgrado debe ser mayor que 0`;
    if (isNaN(tecRate)  || tecRate  <= 0) return `Opción ${activeOption} — la tasa de UPB TEC debe ser mayor que 0`;

    const sinMax = parseInt(form.limits.sinInteresMax, 10);
    const conMax = parseInt(form.limits.conInteresMax, 10);
    if (isNaN(sinMax) || sinMax < 1) return 'El máximo de cuotas sin intereses debe ser al menos 1';
    if (isNaN(conMax) || conMax < 1) return 'El máximo de cuotas con intereses debe ser al menos 1';

    const pregSin = parseFloat(form.minInitialPct.pregradoSinInteres);
    const pregCon = parseFloat(form.minInitialPct.pregradoConInteres);
    const tecSin  = parseFloat(form.minInitialPct.upbTecSinInteres);
    const tecCon  = parseFloat(form.minInitialPct.upbTecConInteres);
    if (isNaN(pregSin) || pregSin < 0 || pregSin > 100) return 'Cuota inicial mínima Pregrado sin intereses inválida (0-100)';
    if (isNaN(pregCon) || pregCon < 0 || pregCon > 100) return 'Cuota inicial mínima Pregrado con intereses inválida (0-100)';
    if (isNaN(tecSin)  || tecSin  < 0 || tecSin  > 100) return 'Cuota inicial mínima UPB TEC sin intereses inválida (0-100)';
    if (isNaN(tecCon)  || tecCon  < 0 || tecCon  > 100) return 'Cuota inicial mínima UPB TEC con intereses inválida (0-100)';

    return null;
  }

  // ── Save ───────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaveAnim(true);
    setTimeout(() => setSaveAnim(false), 520);
    if (!form || !original) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const levels = ['PREGRADO', 'POSGRADO', 'UPB_TEC'] as const;

    // Use the rates from the selected active option
    const activeRates = form.rateOptions[activeOption - 1];
    const rateMap: Record<string, number> = {
      PREGRADO: percentToRate(activeRates.pregradoRate),
      POSGRADO: percentToRate(activeRates.posgradoRate),
      UPB_TEC:  percentToRate(activeRates.upbTecRate),
    };
    const interestRates = levels.map(l => ({ levelScope: l, rateMonthly: rateMap[l] }));

    const sinMax = parseInt(form.limits.sinInteresMax, 10);
    const conMax = parseInt(form.limits.conInteresMax, 10);
    const sinMinPreg = percentToRate(form.minInitialPct.pregradoSinInteres);
    const conMinPreg = percentToRate(form.minInitialPct.pregradoConInteres);
    const sinMinTec  = percentToRate(form.minInitialPct.upbTecSinInteres);
    const conMinTec  = percentToRate(form.minInitialPct.upbTecConInteres);

    const modalityRules = levels.flatMap(level => [
      {
        modality: 'SIN_INTERES' as const, level,
        maxTotalPayments: sinMax,
        minInitialPct: level === 'UPB_TEC' ? sinMinTec : sinMinPreg,
      },
      {
        modality: 'CON_INTERES' as const, level,
        maxTotalPayments: conMax,
        minInitialPct: level === 'UPB_TEC' ? conMinTec : conMinPreg,
      },
    ]);

    const formInitPcts: Record<number, number> = {};
    ([
      [0, form.initialPayments.extra0],
      [1, form.initialPayments.extra1],
      [2, form.initialPayments.extra2],
      [3, form.initialPayments.extra3],
      [4, form.initialPayments.extra4],
      [5, form.initialPayments.extra5],
    ] as [number, string][]).forEach(([key, value]) => {
      const rate = percentToRate(value);
      if (Number.isFinite(rate)) formInitPcts[key] = rate;
    });

    const initialPaymentRules = original.initialPaymentRules.map(rule => {
      const isEditable =
        rule.level === 'PREGRADO' && rule.modality === 'CON_INTERES' && rule.extraInstallments in formInitPcts;
      const pct = isEditable ? formInitPcts[rule.extraInstallments] : rule.initialPctRequired;
      const isMirrored =
        rule.level === 'POSGRADO' && rule.modality === 'CON_INTERES' && rule.extraInstallments in formInitPcts;
      return {
        level: rule.level, modality: rule.modality,
        extraInstallments: rule.extraInstallments,
        initialPctRequired: isMirrored ? formInitPcts[rule.extraInstallments] : pct,
      };
    });

    // Pass version-level dates unchanged — UI does not expose them
    const res = await updateParameterVersion(form.versionId, {
      validFrom: form._validFrom,
      validTo: form._validTo || null,
      notes: form._notes || null,
      interestRates,
      modalityRules,
      initialPaymentRules,
    });

    setSaving(false);

    if (res.error) { setError(res.error); return; }

    setSuccessMsg('Parámetros actualizados correctamente.');
    setEditMode(false);
    void loadParams();
  }

  function handleCancelEdit() {
    if (original) setForm(buildFormFromVersion(original));
    setEditMode(false);
    setError(null);
  }

  function setField<K extends keyof Omit<ParameterFormState, 'rateOptions'>>(key: K, subKey: string, value: string) {
    setForm(prev => {
      if (!prev) return prev;
      return { ...prev, [key]: { ...(prev[key] as unknown as Record<string, string>), [subKey]: value } };
    });
  }

  function setRateField(optionIdx: 0 | 1, key: keyof RateSet, value: string) {
    setForm(prev => {
      if (!prev) return prev;
      const updated = prev.rateOptions.map((opt, i) => {
        if (i !== optionIdx) return opt;
        const patch: Partial<RateSet> = { [key]: value };
        // Pregrado and Posgrado share the same rate; mirror automatically
        if (key === 'pregradoRate')      patch.posgradoRate      = value;
        if (key === 'pregradoValidFrom') patch.posgradoValidFrom = value;
        return { ...opt, ...patch };
      }) as [RateSet, RateSet];
      return { ...prev, rateOptions: updated };
    });
  }

  // ── Section renderers ──────────────────────────────────────────────────

  function renderTasaSection() {
    if (!form) return null;

    const RELAXED_PURPLE = '#7c3aed';

    const options: { ordinal: string; idx: 0 | 1; optNum: ActiveOption }[] = [
      { ordinal: 'Primera opción', idx: 0, optNum: 1 },
      { ordinal: 'Segunda opción', idx: 1, optNum: 2 },
    ];

    const rates: { label: string; rateKey: keyof RateSet; validFromKey: keyof RateSet; nivel: string }[] = [
      { label: 'Tasa Institucional — Pregrado / Posgrado', rateKey: 'pregradoRate', validFromKey: 'pregradoValidFrom', nivel: 'Pregrado / Posgrado' },
      { label: 'Tasa Institucional — UPB TEC',            rateKey: 'upbTecRate',   validFromKey: 'upbTecValidFrom',   nivel: 'UPBTec' },
    ];

    return (
      <Card icon={<TrendingUp size={18} />} title="Tasas de Interés Vigentes">
        <div className="flex flex-col gap-5">
          {options.map(({ ordinal, idx, optNum }) => {
            const isActive = activeOption === optNum;
            const rateSet  = form.rateOptions[idx];
            return (
              <div
                key={optNum}
                className={[
                  'rounded-xl border-2 px-5 pt-4 pb-4 transition-all duration-200',
                  isActive
                    ? 'border-[#7c3aed] bg-[#7c3aed]/3 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300',
                ].join(' ')}
              >
                {/* ── Card header ── */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                    style={{
                      backgroundColor: isActive ? RELAXED_PURPLE : '#f3f4f6',
                      color: isActive ? '#fff' : '#6b7280',
                    }}
                  >
                    {ordinal}
                  </span>

                  <button
                    type="button"
                    title={isActive ? 'Tasa activa' : 'Clic para activar esta opción'}
                    onClick={() => { if (!isActive) setActiveOption(optNum); }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold focus:outline-none group select-none"
                  >
                    <span className={[
                      'w-3 h-3 rounded-full transition-all duration-200',
                      isActive
                        ? 'bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.4)]'
                        : 'bg-red-400 group-hover:bg-red-500',
                    ].join(' ')} />
                    <span className={isActive ? 'text-emerald-600' : 'text-red-500'}>
                      {isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </button>
                </div>

                {/* ── Rate rows ── */}
                <div className="flex flex-col gap-2">
                  {rates.map(({ label, rateKey, validFromKey, nivel }) => (
                    <div key={rateKey} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 items-end">
                      <Field
                        label={label}
                        helper={`Nivel: ${nivel}`}
                        placeholder="0.9"
                        value={rateSet[rateKey]}
                        suffix="% M.V."
                        type="number"
                        readOnly={!editMode}
                        onChange={v => setRateField(idx, rateKey, clampPct(v))}
                      />
                      <Field
                        label="Vigencia desde"
                        value={rateSet[validFromKey]}
                        type="date"
                        readOnly={!editMode}
                        onChange={v => setRateField(idx, validFromKey, v)}
                      />
                    </div>
                  ))}
                </div>

                {/* ── Footer action ── */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 select-none">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Seleccionada como activa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveOption(optNum)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white rounded-lg px-3 py-1.5 transition-opacity duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 focus:ring-offset-1"
                      style={{ backgroundColor: RELAXED_PURPLE }}
                    >
                      <span className="w-2 h-2 rounded-full bg-white/70" />
                      Activar esta opción
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  function renderCuotasVsTasas() {
    if (!form) return null;

    const items: { label: string; helper: string; key: keyof InitialPaymentForm }[] = [
      {
        label: 'Solo cuota inicial',
        helper: '0 cuotas adicionales — el estudiante paga únicamente la cuota inicial',
        key: 'extra0',
      },
      {
        label: 'Cuota inicial + 1 cuota adicional',
        helper: 'Porcentaje requerido de cuota inicial al financiar 1 cuota más (2 pagos totales)',
        key: 'extra1',
      },
      {
        label: 'Cuota inicial + 2 cuotas adicionales',
        helper: 'Porcentaje requerido de cuota inicial al financiar 2 cuotas más (3 pagos totales)',
        key: 'extra2',
      },
      {
        label: 'Cuota inicial + 3 cuotas adicionales',
        helper: 'Porcentaje requerido de cuota inicial al financiar 3 cuotas más (4 pagos totales)',
        key: 'extra3',
      },
      {
        label: 'Cuota inicial + 4 cuotas adicionales',
        helper: 'Porcentaje requerido de cuota inicial al financiar 4 cuotas más (5 pagos totales)',
        key: 'extra4',
      },
      {
        label: 'Cuota inicial + 5 cuotas adicionales',
        helper: 'Porcentaje requerido de cuota inicial al financiar 5 cuotas más (6 pagos totales)',
        key: 'extra5',
      },
    ];

    return (
      <Card icon={<Percent size={18} />} title="Cuotas vs Tasas de Interés" className="grow">
        <p className="text-[11px] text-gray-400 mb-4">
          Porcentaje requerido de cuota inicial según el número de cuotas adicionales financiadas (aplica a Pregrado / Posgrado con intereses)
        </p>
        <div className="grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 content-evenly">
          {items.map(({ label, helper, key }) => (
            <Field
              key={key}
              label={label}
              helper={helper}
              value={form.initialPayments[key]}
              suffix="%"
              placeholder="%"
              type="number"
              readOnly={!editMode}
              onChange={v => setField('initialPayments', key, clampPct(v))}
            />
          ))}
        </div>
      </Card>
    );
  }

  function renderCuotaMinima() {
    if (!form) return null;

    const fields = [
      { label: 'Sin intereses (Pregrado y Posgrado)', key: 'pregradoSinInteres' as const, hint: 'Mínimo recomendado: 20%' },
      { label: 'Con intereses (Pregrado y Posgrado)', key: 'pregradoConInteres' as const, hint: 'Mínimo recomendado: 20%' },
      { label: 'Sin intereses (UPB TEC)',              key: 'upbTecSinInteres'   as const, hint: 'Mínimo recomendado: 15%' },
      { label: 'Con intereses (UPB TEC)',              key: 'upbTecConInteres'   as const, hint: 'Mínimo recomendado: 15%' },
    ];

    return (
      <Card icon={<ShieldCheck size={18} />} title="Cuota Inicial Mínima">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {fields.map(({ label, key, hint }) => (
            <Field
              key={key}
              label={label}
              placeholder="20"
              value={form.minInitialPct[key]}
              suffix="%"
              type="number"
              readOnly={!editMode}
              helper={hint}
              onChange={v => setField('minInitialPct', key, clampPct(v))}
            />
          ))}
        </div>
      </Card>
    );
  }

  function renderLimites() {
    if (!form) return null;
    return (
      <Card icon={<Layers size={18} />} title="Límites de Cuotas por Modalidad">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Field
            label="Máx. pagos totales – Sin Intereses (incluye cuota inicial)"
            placeholder="3"
            value={form.limits.sinInteresMax}
            type="number"
            readOnly={!editMode}
            onChange={v => setField('limits', 'sinInteresMax', clampInt(v, 1, 12))}
          />
          <Field
            label="Máx. pagos totales – Con Intereses (incluye cuota inicial)"
            placeholder="6"
            value={form.limits.conInteresMax}
            type="number"
            readOnly={!editMode}
            onChange={v => setField('limits', 'conInteresMax', clampInt(v, 1, 12))}
          />
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
          <button
            type="button"
            onClick={() => navigate('/admin/main')}
            className="group inline-flex items-center gap-1.5 self-start sm:self-auto text-sm font-semibold text-[#6b21a8] hover:text-[#581c87] transition-all duration-200 focus:outline-none relative"
          >
            <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="relative">
              Volver al menú
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#6b21a8] rounded-full transition-all duration-200 group-hover:w-full" />
            </span>
          </button>
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

            {/* ── Sections ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6">
              <div>
                {renderTasaSection()}
              </div>
              <div className="flex flex-col">
                {renderCuotaMinima()}
                {renderCuotasVsTasas()}
              </div>
            </div>

            {/* ── Límites — full-width centred row ── */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                {renderLimites()}
              </div>
            </div>

            {/* ── No-rate warning ── */}
            {!original?.interestRates?.length && (
              <div className="flex items-start gap-2.5 mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700" role="alert">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <span>
                  <strong>Sin tasa vigente:</strong> No existe una tasa de interés configurada.
                  Las simulaciones con modalidad &quot;con intereses&quot; no estarán disponibles hasta configurar al menos una tasa.
                </span>
              </div>
            )}

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

