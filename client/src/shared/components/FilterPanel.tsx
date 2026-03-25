// ============================================================
// FilterPanel — Multi-criteria filter panel (HU-PV-03)
// Permite seleccionar varios campos simultáneamente con checkboxes,
// rellenar sus valores y agregar todos de una vez.
//
// Tipos, interfaces y utilidades en: @/shared/utils/filterPanel.types.ts
// (separados para que Vite Fast Refresh funcione correctamente)
// ============================================================

import { useState, useRef, useEffect } from 'react';
import type { FilterFieldDef, ActiveCriterion } from '@/shared/utils/filterPanel.types';
import { criterionDisplayValue } from '@/shared/utils/filterPanel.types';

interface FilterPanelProps {
  fieldDefs: ReadonlyArray<FilterFieldDef>;
  criteria: ActiveCriterion[];
  onChange: (criteria: ActiveCriterion[]) => void;
  onClose: () => void;
}

// ── Chip de criterio activo ───────────────────────────────────

interface CriterionChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function CriterionChip({ label, value, onRemove }: CriterionChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold max-w-xs"
      style={{ backgroundColor: '#EDE9FE', color: '#6b21a8', border: '1px solid #DDD6FE' }}
    >
      <span className="font-bold text-[#581c87]">{label}:</span>
      <span className="truncate">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full w-4 h-4 flex items-center justify-center hover:bg-[#C4B5FD] transition-colors focus:outline-none"
        aria-label={`Quitar filtro ${label}`}
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// ── Subcomponente: input individual por campo seleccionado ────
// Recibe valores desde el padre (estado centralizado) y los notifica hacia arriba.

interface FieldInputProps {
  def: FilterFieldDef;
  isAlreadyActive: boolean;
  textValue: string;
  selectValue: string;
  dateFrom: string;
  dateTo: string;
  onTextChange: (v: string) => void;
  onSelectChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}

function FieldInput({
  def, isAlreadyActive,
  textValue, selectValue, dateFrom, dateTo,
  onTextChange, onSelectChange, onDateFromChange, onDateToChange,
}: FieldInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-[#6b21a8] uppercase tracking-wide">{def.label}</span>
        {isAlreadyActive && (
          <span className="text-[10px] text-[#A85BFF] font-medium">(actualizará el activo)</span>
        )}
      </div>

      {def.type === 'text' && (
        <div>
          <input
            type="text"
            value={textValue}
            onChange={e => onTextChange(e.target.value)}
            placeholder={def.supportsMultiple ? 'Valor1; Valor2; ...' : 'Escribir valor…'}
            className="
              w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40 focus:border-[#A85BFF]
              transition-all duration-150
            "
          />
          {def.supportsMultiple && (
            <p className="mt-1 text-xs text-gray-400">
              Separa con <code className="bg-gray-100 px-1 rounded">;</code> para buscar varios a la vez
            </p>
          )}
        </div>
      )}

      {def.type === 'select' && def.options && def.options.length >= 4 && (
        /* Listbox custom scrollable para campos con muchas opciones (ej: Período Académico).
           Muestra el código en negrita y las fechas en gris, igual que el simulador. */
        <div
          className="w-full rounded-lg border border-gray-200 bg-white overflow-hidden"
          style={{ boxShadow: '0 1px 4px rgba(110,17,176,0.07)' }}
        >
          {/* Trigger — muestra la opción seleccionada */}
          <div
            className="flex items-center justify-between px-3 py-2 cursor-pointer border-b border-gray-100"
            style={{ borderColor: selectValue ? '#A85BFF' : undefined }}
          >
            {selectValue ? (() => {
              const opt = def.options!.find(o => o.value === selectValue);
              if (!opt) return <span className="text-sm text-gray-400">Seleccionar…</span>;
              const [code, ...rest] = opt.label.split(' ');
              const detail = rest.join(' ');
              return (
                <span className="text-sm flex items-center gap-1.5">
                  <span className="font-bold text-gray-900">{code}</span>
                  {detail && <span className="text-gray-400 text-xs">{detail}</span>}
                </span>
              );
            })() : <span className="text-sm text-gray-400">Seleccionar…</span>}
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {/* Lista scrollable */}
          <div className="overflow-y-auto" style={{ maxHeight: '180px' }}>
            <button
              type="button"
              onClick={() => onSelectChange('')}
              className={`w-full text-left px-3 py-2 text-sm transition-colors focus:outline-none
                ${selectValue === '' ? 'bg-[#EDE9FE] text-[#6b21a8] font-semibold' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              Seleccionar…
            </button>
            {def.options.map(opt => {
              const [code, ...rest] = opt.label.split(' ');
              const detail = rest.join(' ');
              const isSelected = selectValue === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectChange(opt.value)}
                  className={`
                    w-full text-left px-3 py-2 flex items-center gap-1.5 transition-colors focus:outline-none
                    ${isSelected
                      ? 'bg-[#EDE9FE] text-[#6b21a8]'
                      : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <span className={`text-sm font-bold ${isSelected ? 'text-[#6b21a8]' : 'text-gray-900'}`}>{code}</span>
                  {detail && <span className={`text-xs ${isSelected ? 'text-[#A85BFF]' : 'text-gray-400'}`}>{detail}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {def.type === 'select' && def.options && def.options.length < 4 && (
        /* Select nativo para pocas opciones (ej: Modalidad) */
        <select
          value={selectValue}
          onChange={e => onSelectChange(e.target.value)}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800
            focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40 focus:border-[#A85BFF]
            bg-white transition-all duration-150
          "
        >
          <option value="">Seleccionar…</option>
          {def.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {def.type === 'daterange' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => onDateFromChange(e.target.value)}
              className="
                w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-800
                focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40 focus:border-[#A85BFF]
                transition-all duration-150
              "
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => onDateToChange(e.target.value)}
              className="
                w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-800
                focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40 focus:border-[#A85BFF]
                transition-all duration-150
              "
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tipo interno para el estado del formulario multi-campo ────

interface FieldFormState {
  textValue: string;
  selectValue: string;
  dateFrom: string;
  dateTo: string;
}

function emptyFieldState(): FieldFormState {
  return { textValue: '', selectValue: '', dateFrom: '', dateTo: '' };
}

// ── Componente principal ─────────────────────────────────────

export function FilterPanel({ fieldDefs, criteria, onChange, onClose }: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Campos seleccionados (checkboxes) — set de keys
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  // Estado del formulario por campo: key → valores
  const [formState, setFormState] = useState<Record<string, FieldFormState>>({});

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Cerrar al click fuera del panel
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  function toggleField(key: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        // Inicializar estado vacío si no existe
        setFormState(fs => key in fs ? fs : { ...fs, [key]: emptyFieldState() });
      }
      return next;
    });
  }

  function updateField(key: string, patch: Partial<FieldFormState>) {
    setFormState(fs => ({ ...fs, [key]: { ...(fs[key] ?? emptyFieldState()), ...patch } }));
  }

  function handleApply() {
    const newCriteria: ActiveCriterion[] = [];

    for (const key of selectedKeys) {
      const def = fieldDefs.find(f => f.key === key);
      if (!def) continue;
      const fs = formState[key] ?? emptyFieldState();

      if (def.type === 'text') {
        const v = fs.textValue.trim();
        if (!v) continue;
        newCriteria.push({ field: key, value: v });
      } else if (def.type === 'select') {
        const v = fs.selectValue.trim();
        if (!v) continue;
        newCriteria.push({ field: key, value: v });
      } else if (def.type === 'daterange') {
        if (!fs.dateFrom && !fs.dateTo) continue;
        newCriteria.push({
          field:    key,
          value:    [fs.dateFrom, fs.dateTo].filter(Boolean).join(' a '),
          dateFrom: fs.dateFrom || undefined,
          dateTo:   fs.dateTo   || undefined,
        });
      }
    }

    if (newCriteria.length === 0) return;

    // Reemplazar criterios existentes de los mismos campos, mantener el resto
    const keys = new Set(newCriteria.map(c => c.field));
    const kept = criteria.filter(c => !keys.has(c.field));
    onChange([...kept, ...newCriteria]);

    // Limpiar selección y formulario
    setSelectedKeys(new Set());
    setFormState({});
  }

  function handleRemoveCriterion(field: string) {
    onChange(criteria.filter(c => c.field !== field));
  }

  function handleClearAll() {
    onChange([]);
  }

  const hasSelections = selectedKeys.size > 0;
  const hasFilledSelections = [...selectedKeys].some(key => {
    const def = fieldDefs.find(f => f.key === key);
    const fs  = formState[key] ?? emptyFieldState();
    if (!def) return false;
    if (def.type === 'text')      return fs.textValue.trim() !== '';
    if (def.type === 'select')    return fs.selectValue !== '';
    if (def.type === 'daterange') return fs.dateFrom !== '' || fs.dateTo !== '';
    return false;
  });

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden"
      style={{ width: '420px', maxHeight: '80vh', overflowY: 'auto', animation: 'fadeScaleIn 0.18s ease-out' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 sticky top-0 z-10"
        style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)' }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6b21a8]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M4 6h16M4 12h10M4 18h7" />
          </svg>
          <span className="text-sm font-black text-[#6b21a8]">Filtros avanzados</span>
          {hasSelections && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#6E11B0', color: '#fff' }}
            >
              {selectedKeys.size} campo{selectedKeys.size > 1 ? 's' : ''} seleccionado{selectedKeys.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {criteria.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium focus:outline-none"
            >
              Limpiar todo
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-all focus:outline-none"
            aria-label="Cerrar panel de filtros"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chips de filtros activos ya aplicados */}
      {criteria.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 font-medium w-full mb-0.5">Filtros activos:</span>
          {criteria.map(c => {
            const def = fieldDefs.find(f => f.key === c.field);
            return (
              <CriterionChip
                key={c.field}
                label={def?.label ?? c.field}
                value={criterionDisplayValue(c, fieldDefs)}
                onRemove={() => handleRemoveCriterion(c.field)}
              />
            );
          })}
        </div>
      )}

      {/* Body */}
      <div className="p-5 space-y-4">

        {/* Paso 1: Selección de campos con checkboxes */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            1. Selecciona los campos a filtrar
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {fieldDefs.map(def => {
              const isChecked = selectedKeys.has(def.key);
              const isActive  = criteria.some(c => c.field === def.key);
              return (
                <button
                  key={def.key}
                  type="button"
                  onClick={() => toggleField(def.key)}
                  className={`
                    flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl text-sm
                    border transition-all duration-150 focus:outline-none
                    ${isChecked
                      ? 'border-[#A85BFF] bg-[#EDE9FE] text-[#6b21a8] font-semibold shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-[#DDD6FE] hover:bg-gray-50'}
                  `}
                >
                  {/* Checkbox visual */}
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all"
                    style={{
                      backgroundColor: isChecked ? '#6E11B0' : '#fff',
                      borderColor:     isChecked ? '#6E11B0' : '#D1D5DB',
                    }}
                  >
                    {isChecked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{def.label}</span>
                  {/* Punto si ya tiene filtro activo */}
                  {isActive && !isChecked && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A85BFF] flex-shrink-0 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Paso 2: Inputs de los campos seleccionados */}
        {hasSelections && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              2. Ingresa los valores
            </p>
            <div className="space-y-4">
              {[...selectedKeys].map(key => {
                const def = fieldDefs.find(f => f.key === key);
                if (!def) return null;
                const fs = formState[key] ?? emptyFieldState();
                const isActive = criteria.some(c => c.field === key);
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-[#EDE9FE] bg-[#FAFAFE] p-3.5 space-y-2"
                  >
                    <FieldInput
                      def={def}
                      isAlreadyActive={isActive}
                      textValue={fs.textValue}
                      selectValue={fs.selectValue}
                      dateFrom={fs.dateFrom}
                      dateTo={fs.dateTo}
                      onTextChange={v    => updateField(key, { textValue: v })}
                      onSelectChange={v  => updateField(key, { selectValue: v })}
                      onDateFromChange={v => updateField(key, { dateFrom: v })}
                      onDateToChange={v  => updateField(key, { dateTo: v })}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botón aplicar */}
        <button
          type="button"
          onClick={handleApply}
          disabled={!hasFilledSelections}
          className="
            w-full py-2.5 rounded-xl text-sm font-bold text-white
            transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#A85BFF]/40
            hover:brightness-110 active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed
          "
          style={{ backgroundColor: '#6E11B0', boxShadow: hasFilledSelections ? '0 2px 10px rgba(110,17,176,0.30)' : undefined }}
        >
          {hasSelections
            ? `Aplicar ${selectedKeys.size} filtro${selectedKeys.size > 1 ? 's' : ''}`
            : 'Selecciona campos arriba'}
        </button>

      </div>

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.94) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
