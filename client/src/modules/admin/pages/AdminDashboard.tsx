export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Panel de Administración
        </h1>
        <p className="text-gray-500 mt-1">
          Gestión de parámetros financieros del simulador
        </p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Parámetros Financieros</h2>
        <p className="text-gray-500 mb-6">
          Módulo en construcción. Aquí podrás configurar tasas de interés,
          plazos máximos y otros parámetros del crédito educativo.
        </p>

        {/* TODO: Tabla editable de parámetros */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-50">
              <tr>
                <th className="text-left py-3 px-4">Parámetro</th>
                <th className="text-right py-3 px-4">Valor</th>
                <th className="text-right py-3 px-4">Unidad</th>
                <th className="text-right py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="py-3 px-4">Tasa de Interés Anual</td>
                <td className="text-right py-3 px-4">12</td>
                <td className="text-right py-3 px-4">%</td>
                <td className="text-right py-3 px-4">
                  <button className="text-upb-green hover:text-upb-green-light text-sm font-medium transition-colors">
                    Editar
                  </button>
                </td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-3 px-4">Plazo Máximo</td>
                <td className="text-right py-3 px-4">120</td>
                <td className="text-right py-3 px-4">meses</td>
                <td className="text-right py-3 px-4">
                  <button className="text-upb-green hover:text-upb-green-light text-sm font-medium transition-colors">
                    Editar
                  </button>
                </td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-3 px-4">Monto Máximo</td>
                <td className="text-right py-3 px-4">50,000,000</td>
                <td className="text-right py-3 px-4">COP</td>
                <td className="text-right py-3 px-4">
                  <button className="text-upb-green hover:text-upb-green-light text-sm font-medium transition-colors">
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
