import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { AuthFormError } from '@/app/components/AuthFormError';
import { validateLoginForm, type LoginFieldErrors } from '@/app/utils/authErrors';
import logoColor from '@/assets/logo-bebify-color.svg';

export const LoginPage: React.FC = () => {
  const { login, loading, errorDisplay, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const from = (location.state as { from?: string; registered?: boolean })?.from || '/';
  const justRegistered = (location.state as { registered?: boolean })?.registered === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const validationErrors = validateLoginForm(email, password);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const success = await login(email.trim(), password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const inputErrorClass = (hasError: boolean) =>
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-300 focus:ring-[#0055a2]';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link to="/">
          <img src={logoColor} alt="Bebify" className="h-14" />
        </Link>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-[#717182] hover:text-[#0055a2] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la tienda
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#212121] mb-1">Iniciar sesión</h1>
            <p className="text-sm text-[#717182]">
              Accede a precios exclusivos y realiza tus compras
            </p>
          </div>

          {justRegistered && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 bg-green-50 text-green-700 border border-green-200 px-4 py-3 rounded-lg text-sm font-medium"
            >
              ¡Cuenta creada con éxito! Ya puedes iniciar sesión.
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#212121] mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                  clearError();
                }}
                placeholder="tu@correo.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-[#212121] ${inputErrorClass(Boolean(fieldErrors.email))}`}
              />
              {fieldErrors.email && (
                <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#212121] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    clearError();
                  }}
                  placeholder="••••••••"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-[#212121] pr-12 ${inputErrorClass(Boolean(fieldErrors.password))}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
              <div className="mt-2 text-right">
                <Link
                  to="/recuperar-contrasena"
                  className="text-sm text-[#0055a2] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {errorDisplay && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AuthFormError error={errorDisplay} />
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full bg-[#0055a2] text-white py-3 px-6 rounded-lg font-bold text-base flex items-center justify-center gap-2 hover:bg-[#004488] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar sesión
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-[#717182]">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-[#0055a2] font-medium hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
