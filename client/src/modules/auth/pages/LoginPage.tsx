import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/services/api';

interface LoginResponse {
  user: Record<string, unknown>;
  token: string;
}

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      localStorage.setItem('token', result.data.token);
      navigate('/simulator');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-upb-green to-green-950 px-4">
      <div className="card w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-upb-green">UPB</h1>
          <p className="text-gray-500 mt-2">
            Simulador de Crédito Educativo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Usuario LDAP
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="usuario@upb.edu.co"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Autenticando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Autenticación vía Active Directory UPB
        </p>
      </div>
    </div>
  );
}
