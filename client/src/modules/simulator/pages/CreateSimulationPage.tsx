/* -----------------------------------------------------------------
   PAGINA: CreateSimulationPage - Orquestador
   Ensambla: Header, Form, ResultsPreview, Footer.
   Sin logica de negocio - pendiente integracion backend.
------------------------------------------------------------------ */

import { useState, useRef } from 'react';
import { UpbHeader }                from '@/shared/components/UpbHeader';
import { UpbFooter }                from '@/shared/components/UpbFooter';
import { SimulationForm }           from '@/shared/components/SimulationForm';
import { SimulationResultsPreview } from '@/shared/components/SimulationResultsPreview';
import type { SimulationSummaryDTO, SimulationInputDTO } from '@/shared/services/api';

/* ------------------------------------------------------------------
   Estado del orquestador (HU-13):
     - profileOpen  : controla el dropdown del perfil en el header
     - result       : summary + input del cálculo real (null = no calculado aún)
------------------------------------------------------------------ */

export function CreateSimulationPage() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [result, setResult] = useState<{
    summary: SimulationSummaryDTO;
    input: SimulationInputDTO;
  } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  /* Recibe el resultado del backend y hace scroll suave a la sección */
  const handleResult = (summary: SimulationSummaryDTO, input: SimulationInputDTO) => {
    setResult({ summary, input });
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  /* Oculta resultados y vuelve al inicio */
  const handleNewSimulation = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: '#F4F1F1' }}
      onClick={() => { if (profileOpen) setProfileOpen(false); }}
    >
      {/* Encabezado institucional UPB */}
      <UpbHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((p) => !p)}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8 tracking-tight">
          Formulario de Simulación
        </h1>

        {/* Formulario conectado a la API real */}
        <SimulationForm onResult={handleResult} />

        {/* Resultados reales — visible tras calcular */}
        {result && (
          <div ref={resultsRef}>
            <SimulationResultsPreview
              summary={result.summary}
              input={result.input}
              onNewSimulation={handleNewSimulation}
            />
          </div>
        )}
      </main>

      {/* Pie de página institucional UPB */}
      <UpbFooter />
    </div>
  );
}
