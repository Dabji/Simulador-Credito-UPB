import { Outlet, Link } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-yellow-400">UPB</span>
              <span className="text-lg font-semibold">
                Simulador de Crédito
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/simulator"
                className="hover:text-yellow-300 transition-colors"
              >
                Simulador
              </Link>
              <Link
                to="/admin"
                className="hover:text-yellow-300 transition-colors"
              >
                Admin
              </Link>
              <Link
                to="/login"
                className="hover:text-yellow-300 transition-colors"
              >
                Cerrar Sesión
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
