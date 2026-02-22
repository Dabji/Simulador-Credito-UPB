/* ─────────────────────────────────────────────────────────────
   COMPONENTE: SimulationForm
   Formulario de simulación de crédito educativo — solo UI.
   Sin validaciones ni lógica de cálculo. Los campos son controlados
   con estado local simple. Pendiente integración backend.
   Secciones:
     A) Información Académica
     B) Datos Financieros
     C) Modalidad de Financiación
───────────────────────────────────────────────────────────────── */

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

/* Año actual para el selector de mes de primera cuota */
const CURRENT_YEAR = new Date().getFullYear();

/* Lista de meses del año */
const MONTHS = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

/* Estado del formulario — todos los campos como strings para inputs controlados */
interface FormFields {
  studentType: string;
  educationLevel: string;
  tuitionValue: string;
  scholarshipPercent: string;
  downPaymentPercent: string;
  downPaymentValue: string;
  interestMode: string;
  academicPeriod: string;
  firstPaymentMonth: string;
  numberOfPayments: string;
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
};

/* Clases CSS compartidas para inputs, labels y helpers */
const INPUT_BASE =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400';
const LABEL_CLASS  = 'block text-sm font-semibold text-gray-700 mb-1.5';
const HELPER_CLASS = 'mt-1.5 text-xs leading-relaxed';
const HELPER_COLOR = { color: '#4A5565' } as const;

interface SimulationFormProps {
  onCalculate: () => void;
}

export function SimulationForm({ onCalculate }: SimulationFormProps) {
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);

  /* Actualiza un campo individual */
  const set = (key: keyof FormFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  /* Limpiar todos los campos */
  const handleReset = () => setFields(INITIAL_FIELDS);

  /* Al enviar: no calcula nada, solo notifica al padre para mostrar resultados */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onCalculate();
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
          <select
            id="educationLevel"
            value={fields.educationLevel}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => set('educationLevel', e.target.value)}
            className={INPUT_BASE}
          >
            <option value="">Seleccionar...</option>
            <option value="pregrado">Pregrado</option>
            <option value="posgrado">Posgrado</option>
            <option value="maestria">Maestría</option>
            <option value="doctorado">Doctorado</option>
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
            <input
              id="tuitionValue"
              type="text"
              inputMode="numeric"
              placeholder="6.700.000 COP"
              value={fields.tuitionValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                set('tuitionValue', e.target.value.replace(/[^0-9]/g, ''))
              }
              className={INPUT_BASE}
            />
            <p className={HELPER_CLASS} style={HELPER_COLOR}>Valores en pesos colombianos (COP)</p>
          </div>

          {/* Beca / Descuento */}
          <div>
            <label htmlFor="scholarshipPercent" className={LABEL_CLASS}>
              Beca / Descuento (%)
            </label>
            <input
              id="scholarshipPercent"
              type="text"
              inputMode="decimal"
              placeholder="5%"
              value={fields.scholarshipPercent}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                set('scholarshipPercent', e.target.value.replace(/[^0-9.]/g, ''))
              }
              className={INPUT_BASE}
            />
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
              <input
                id="downPaymentPercent"
                type="text"
                inputMode="decimal"
                placeholder="20%"
                value={fields.downPaymentPercent}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set('downPaymentPercent', e.target.value.replace(/[^0-9.]/g, ''))
                }
                className={INPUT_BASE}
              />
            </div>
            <div>
              <label htmlFor="downPaymentValue" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Valor (COP)
              </label>
              <input
                id="downPaymentValue"
                type="text"
                inputMode="numeric"
                placeholder="1.273.000 COP"
                value={fields.downPaymentValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set('downPaymentValue', e.target.value.replace(/[^0-9]/g, ''))
                }
                className={INPUT_BASE}
              />
            </div>
          </div>
          <p className={HELPER_CLASS} style={HELPER_COLOR}>
            Modifica el porcentaje (mín. 20%) o el valor COP; el sistema recalculará el campo restante.
          </p>
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => set('interestMode', e.target.value)}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => set('interestMode', e.target.value)}
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

        {/* Periodo académico */}
        <div className="mb-5">
          <label htmlFor="academicPeriod" className={LABEL_CLASS}>
            Periodo académico <span className="text-red-500">*</span>
          </label>
          <input
            id="academicPeriod"
            type="text"
            placeholder="2025-01 / 2025-02"
            value={fields.academicPeriod}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set('academicPeriod', e.target.value)}
            className={INPUT_BASE}
          />
          <p className={HELPER_CLASS} style={HELPER_COLOR}>
            Las cuotas se programan cada 30 días. La fecha de inicio se define tras validación institucional.
          </p>
        </div>

        {/* Fecha de pago de la primera cuota */}
        <div className="mb-5">
          <label htmlFor="firstPaymentMonth" className={LABEL_CLASS}>
            Fecha de pago de la primera cuota (Mes) <span className="text-red-500">*</span>
          </label>
          <select
            id="firstPaymentMonth"
            value={fields.firstPaymentMonth}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => set('firstPaymentMonth', e.target.value)}
            className={INPUT_BASE}
          >
            <option value="">Selecciona un mes — {CURRENT_YEAR}</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} {CURRENT_YEAR}
              </option>
            ))}
          </select>
          <p className={HELPER_CLASS} style={HELPER_COLOR}>
            Mes en que se realizará el primer pago de la cuota. Las siguientes cuotas se calcularán cada 30 días.
          </p>
        </div>

        {/* Número de cuotas */}
        <div>
          <label htmlFor="numberOfPayments" className={LABEL_CLASS}>
            Número de cuotas / pagos (estimado) <span className="text-red-500">*</span>
          </label>
          <input
            id="numberOfPayments"
            type="text"
            inputMode="numeric"
            placeholder="4"
            value={fields.numberOfPayments}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              set('numberOfPayments', e.target.value.replace(/[^0-9]/g, ''))
            }
            className={INPUT_BASE}
          />
          <p className={HELPER_CLASS} style={HELPER_COLOR}>
            Máximo # cuotas para esta modalidad y el número de cuotas es estimado.
          </p>
        </div>
      </section>

      {/* ── Botones de acción ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
        <button
          type="submit"
          className="w-full sm:w-auto px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:brightness-110 active:scale-95"
          style={{ backgroundColor: '#A85BFF', boxShadow: '0 4px 14px rgba(168,91,255,0.35)' }}
        >
          Calcular Simulación
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="w-full sm:w-auto px-10 py-3 rounded-full text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:brightness-125 active:scale-95"
          style={{ backgroundColor: '#262626' }}
        >
          Limpiar formulario
        </button>
      </div>
    </form>
  );
}
