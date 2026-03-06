import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../../shared/services/api';

export function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      identificationNumber,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-green-950">
      <div className="card w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">UPB</h1>
          <p className="text-gray-600 mt-2">Crear cuenta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                placeholder="Nombre"
                required
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Apellido
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field"
                placeholder="Apellido"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Correo institucional
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="usuario@upb.edu.co"
              pattern=".+@upb\.edu\.co$"
              title="Debe usar su correo institucional UPB (@upb.edu.co)"
              required
            />
          </div>

          <div>
            <label
              htmlFor="identificationNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Número de identificación
            </label>
            <input
              id="identificationNumber"
              type="text"
              value={identificationNumber}
              onChange={(e) => setIdentificationNumber(e.target.value)}
              className="input-field"
              placeholder="1234567890"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        {/* Back to login */}
        <div className="mt-6 text-center border-t border-gray-100 pt-5">
          <Link
            to="/login"
            className="text-sm text-green-700 hover:text-green-900 font-medium transition-colors"
          >
            ← Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
