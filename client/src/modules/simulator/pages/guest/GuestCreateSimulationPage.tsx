/* -----------------------------------------------------------------
   PAGINA: GuestCreateSimulationPage (HU-11 — Simulación como invitado)
   Orquestador: GuestLayout + SimulationForm + SimulationResultsPreview.
   Reutiliza los mismos componentes que Student con mode='guest'.
   No permite guardar ni exportar (HU-12).
------------------------------------------------------------------ */

import { useState, useRef } from 'react';
import { GuestLayout }              from '@/shared/components/GuestLayout';
import { SimulationForm }           from '@/shared/components/SimulationForm';
import { SimulationResultsPreview } from '@/shared/components/SimulationResultsPreview';
import type { SimulationSummaryDTO, SimulationInputDTO } from '@/shared/services/api';

export function GuestCreateSimulationPage() {
  const [result, setResult] = useState<{
    summary: SimulationSummaryDTO;
    input: SimulationInputDTO;
  } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleResult = (summary: SimulationSummaryDTO, input: SimulationInputDTO) => {
    setResult({ summary, input });
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleNewSimulation = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <GuestLayout bgColor="#F4F1F1">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 py-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8 tracking-tight">
          Formulario de Simulación
        </h1>

        <SimulationForm onResult={handleResult} mode="guest" />

        {result && (
          <div ref={resultsRef}>
            <SimulationResultsPreview
              summary={result.summary}
              input={result.input}
              onNewSimulation={handleNewSimulation}
              mode="guest"
            />
          </div>
        )}
      </div>
    </GuestLayout>
  );
}
