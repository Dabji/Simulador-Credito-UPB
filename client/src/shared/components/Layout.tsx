import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/useAuth';

interface NavLinkItem {
  to: string;
  label: string;
}

const navLinks: NavLinkItem[] = [
  { to: '/simulator', label: 'Simulador' },
  { to: '/admin', label: 'Admin' },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path: string): boolean => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-upb-green text-white shadow-lg">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-xl font-bold text-upb-gold group-hover:text-yellow-300 transition-colors">
                UPB
              </span>
              <span className="hidden sm:inline text-lg font-semibold">
                Simulador de Crédito
              </span>
              <span className="sm:hidden text-lg font-semibold">Crédito</span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-1 sm:gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(link.to)
                      ? 'bg-white/20 text-upb-gold'
                      : 'text-white/80 hover:text-upb-gold hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="h-6 w-px bg-white/30 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-red-300 hover:bg-white/10 transition-colors duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Universidad Pontificia Bolivariana —
          Simulador de Crédito Educativo
        </div>
      </footer>
    </div>
  );
}
