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

export function CreateSimulationPage() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleShowResults = () => {
    setShowResults(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleNewSimulation = () => {
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: '#F4F1F1' }}
      onClick={() => { if (profileOpen) setProfileOpen(false); }}
    >
      <UpbHeader
        profileOpen={profileOpen}
        onToggleProfile={() => setProfileOpen((p) => !p)}
      />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8 tracking-tight">
          Formulario de Simulacion
        </h1>
        <SimulationForm onCalculate={handleShowResults} />
        {showResults && (
          <div ref={resultsRef}>
            <SimulationResultsPreview onNewSimulation={handleNewSimulation} />
          </div>
        )}
      </main>
      <UpbFooter />
    </div>
  );
}
