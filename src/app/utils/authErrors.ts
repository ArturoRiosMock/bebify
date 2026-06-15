export interface AuthErrorDisplay {
  title: string;
  description?: string;
  hints?: string[];
}

interface ShopifyCustomerError {
  code?: string;
  message?: string;
  field?: string[] | null;
}

type AuthErrorContext = 'login' | 'register' | 'recover' | 'reset';

const LOGIN_INVALID_CREDENTIALS: AuthErrorDisplay = {
  title: 'Correo o contraseña incorrectos',
  description: 'No pudimos iniciar sesión con los datos que ingresaste.',
  hints: [
    'Revisa que el correo esté escrito correctamente.',
    'Comprueba tu contraseña, incluyendo mayúsculas y números.',
    'Si olvidaste tu contraseña, usa el enlace «¿Olvidaste tu contraseña?».',
    'Si aún no tienes cuenta en Bebify, regístrate para acceder a precios B2B.',
  ],
};

const LOGIN_TOO_MANY_ATTEMPTS: AuthErrorDisplay = {
  title: 'Demasiados intentos fallidos',
  description: 'Por seguridad, tu acceso se ha bloqueado temporalmente.',
  hints: [
    'Espera unos minutos e inténtalo de nuevo.',
    'Si olvidaste tu contraseña, restablécela desde «¿Olvidaste tu contraseña?».',
  ],
};

const CONNECTION_ERROR: AuthErrorDisplay = {
  title: 'No pudimos conectar con el servidor',
  description: 'Ocurrió un problema de conexión al validar tu acceso.',
  hints: [
    'Revisa tu conexión a internet.',
    'Intenta de nuevo en unos segundos.',
    'Si el problema continúa, contáctanos desde la página de contacto.',
  ],
};

const GENERIC_LOGIN_ERROR: AuthErrorDisplay = {
  title: 'No se pudo iniciar sesión',
  description: 'Verifica tus datos e inténtalo nuevamente.',
  hints: [
    'Confirma tu correo y contraseña.',
    'Usa «¿Olvidaste tu contraseña?» si no recuerdas tu acceso.',
  ],
};

export function mapShopifyCustomerError(
  error: ShopifyCustomerError,
  context: AuthErrorContext,
): AuthErrorDisplay {
  const code = error.code?.toUpperCase() ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (context === 'login') {
    if (code === 'UNIDENTIFIED_CUSTOMER' || message.includes('unidentified customer')) {
      return LOGIN_INVALID_CREDENTIALS;
    }

    if (code === 'TOO_MANY_ATTEMPTS' || message.includes('too many')) {
      return LOGIN_TOO_MANY_ATTEMPTS;
    }

    if (code === 'BLANK' || code === 'INVALID') {
      return {
        title: 'Faltan datos para iniciar sesión',
        description: 'Completa todos los campos obligatorios.',
        hints: ['Ingresa tu correo electrónico y tu contraseña.'],
      };
    }

    return GENERIC_LOGIN_ERROR;
  }

  if (context === 'register') {
    if (code === 'TAKEN' || message.includes('already been taken')) {
      return {
        title: 'Este correo ya está registrado',
        description: 'Ya existe una cuenta con ese correo electrónico.',
        hints: [
          'Inicia sesión con tu correo y contraseña.',
          'Si olvidaste tu contraseña, restablécela desde el enlace correspondiente.',
        ],
      };
    }

    if (code === 'INVALID' || code === 'BLANK') {
      return {
        title: 'Revisa los datos del registro',
        description: 'Algunos campos no cumplen los requisitos.',
        hints: ['Verifica que todos los campos estén completos y sean válidos.'],
      };
    }

    if (code === 'TOO_SHORT') {
      return {
        title: 'Contraseña demasiado corta',
        description: 'Tu contraseña no cumple la longitud mínima.',
        hints: ['Usa al menos 5 caracteres en tu contraseña.'],
      };
    }
  }

  if (context === 'reset') {
    if (code === 'INVALID' || code === 'TOKEN_INVALID') {
      return {
        title: 'Enlace de recuperación inválido o expirado',
        description: 'No pudimos restablecer tu contraseña con este enlace.',
        hints: [
          'Solicita un nuevo enlace desde «Recuperar contraseña».',
          'Los enlaces expiran después de un tiempo por seguridad.',
        ],
      };
    }
  }

  return {
    title: 'Ocurrió un error',
    description: error.message || 'Intenta de nuevo en unos momentos.',
  };
}

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export function validateLoginForm(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = 'Ingresa tu correo electrónico.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Ingresa un correo válido (ejemplo: tu@empresa.com).';
  }

  if (!password) {
    errors.password = 'Ingresa tu contraseña.';
  } else if (password.length < 4) {
    errors.password = 'La contraseña parece incompleta. Verifica que esté escrita correctamente.';
  }

  return errors;
}

export function validateRecoverEmail(email: string): string | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return 'Ingresa el correo electrónico de tu cuenta.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'Ingresa un correo válido (ejemplo: tu@empresa.com).';
  }

  return null;
}

export function getConnectionErrorDisplay(): AuthErrorDisplay {
  return CONNECTION_ERROR;
}

export function getGenericLoginErrorDisplay(): AuthErrorDisplay {
  return GENERIC_LOGIN_ERROR;
}
