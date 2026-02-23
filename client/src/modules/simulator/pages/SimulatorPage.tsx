import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../../../shared/services/api';

interface SimulationResult {
  credit: {
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
  };
  schedule: Array<{
    period: number;
    payment: number;
    interest: number;
    principal: number;
    balance: number;
  }>;
}

export function SimulatorPage() {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [term, setTerm] = useState('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const response = await api.post<SimulationResult>('/simulator/simulate', {
      userId: 'temp-user-id', // TODO: obtener del contexto de auth
      amount: Number(amount),
      annualRate: Number(rate) / 100,
      termMonths: Number(term),
      amortizationType: 'FRENCH',
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    if (response.data) {
      setResult(response.data);
    }
  };

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Simulador de Crédito Educativo
        </h1>
        <p className="text-gray-500 mt-1">
          Sistema de amortización francesa (cuota fija)
        </p>
      </div>

      {/* Formulario */}
      <div className="card max-w-lg">
        <form onSubmit={handleSimulate} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto del crédito (COP)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="10000000"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasa de interés anual (%)
            </label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="input-field"
              placeholder="12"
              min="0.1"
              step="0.1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plazo (meses)
            </label>
            <input
              type="number"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="input-field"
              placeholder="48"
              min="1"
              max="120"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculando...' : 'Simular Crédito'}
          </button>
        </form>
      </div>

      {/* Resultados */}
      {result && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-sm text-gray-500">Cuota Mensual</p>
              <p className="text-2xl font-bold text-upb-green">
                {formatCurrency(result.credit.monthlyPayment)}
              </p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Intereses</p>
              <p className="text-2xl font-bold text-upb-gold-dark">
                {formatCurrency(result.credit.totalInterest)}
              </p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total a Pagar</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(result.credit.totalPayment)}
              </p>
            </div>
          </div>

          {/* Tabla de amortización */}
          <div className="card overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4">
              Tabla de Amortización
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-upb-green/20">
                  <th className="text-left py-2 px-2">Período</th>
                  <th className="text-right py-2 px-2">Cuota</th>
                  <th className="text-right py-2 px-2">Interés</th>
                  <th className="text-right py-2 px-2">Capital</th>
                  <th className="text-right py-2 px-2">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => (
                  <tr key={row.period} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2">{row.period}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(row.payment)}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(row.interest)}</td>
                    <td className="text-right py-2 px-2">
                      {formatCurrency(row.principal)}
                    </td>
                    <td className="text-right py-2 px-2">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
