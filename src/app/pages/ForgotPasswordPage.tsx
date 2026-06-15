import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Mail } from 'lucide-react';
import { AuthFormError } from '@/app/components/AuthFormError';
import { validateRecoverEmail } from '@/app/utils/authErrors';
import { useAuth } from '@/app/context/AuthContext';
import logoColor from '@/assets/logo-bebify-color.svg';

export const ForgotPasswordPage: React.FC = () => {
  const { recoverPassword, loading, errorDisplay, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldError(null);

    const validationError = validateRecoverEmail(email);
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    const result = await recoverPassword(email.trim());
    if (result.success) {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link to="/">
          <img src={logoColor} alt="Bebify" className="h-14" />
        </Link>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-sm text-[#717182] hover:text-[#0055a2] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al login
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
            <h1 className="text-2xl font-bold text-[#212121] mb-1">Recuperar contraseña</h1>
            <p className="text-sm text-[#717182]">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 text-green-700 border border-green-200 px-4 py-4 rounded-lg text-sm space-y-3"
            >
              <p className="font-medium">Revisa tu correo</p>
              <p>
                Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un enlace
                para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="text-green-600">
                Revisa también la carpeta de spam si no lo encuentras.
              </p>
              <Link
                to="/login"
                className="inline-block text-[#0055a2] font-medium hover:underline mt-2"
              >
                Volver a iniciar sesión
              </Link>
            </motion.div>
          ) : (
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
                    setFieldError(null);
                    clearError();
                  }}
                  placeholder="tu@correo.com"
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? 'recover-email-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-[#212121] ${
                    fieldError ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#0055a2]'
                  }`}
                />
                {fieldError && (
                  <p id="recover-email-error" role="alert" className="mt-1.5 text-sm text-red-600">
                    {fieldError}
                  </p>
                )}
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
                    <Mail className="w-5 h-5" />
                    Enviar enlace de recuperación
                  </>
                )}
              </motion.button>
            </form>
          )}

          {!sent && (
            <p className="mt-6 text-center text-sm text-[#717182]">
              ¿Recordaste tu contraseña?{' '}
              <Link to="/login" className="text-[#0055a2] font-medium hover:underline">
                Iniciar sesión
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};
