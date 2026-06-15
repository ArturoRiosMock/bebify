import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { isShopifyConfigured, getStorefrontApiUrl, shopifyConfig } from '@/shopify/config';
import { AUTH_STORAGE_KEY, loadStoredAuthUser, type StoredAuthUser } from '@/app/authStorage';
import {
  type AuthErrorDisplay,
  getConnectionErrorDisplay,
  getGenericLoginErrorDisplay,
  mapShopifyCustomerError,
} from '@/app/utils/authErrors';

export type AuthUser = StoredAuthUser;

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  errorDisplay: AuthErrorDisplay | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error: string | null }>;
  recoverPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
  resetPassword: (
    password: string,
    options: { customerId: string; resetToken: string } | { resetUrl: string },
  ) => Promise<{ success: boolean; error: string | null }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const saveAuth = (user: AuthUser | null) => {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch { /* silently ignore */ }
};

async function shopifyCustomerLogin(
  email: string,
  password: string,
): Promise<{ user: AuthUser | null; errorDisplay: AuthErrorDisplay | null }> {
  const query = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  try {
    const response = await fetch(getStorefrontApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontAccessToken,
      },
      body: JSON.stringify({
        query,
        variables: { input: { email, password } },
      }),
    });

    const data = await response.json();
    const result = data?.data?.customerAccessTokenCreate;

    if (result?.customerUserErrors?.length > 0) {
      return {
        user: null,
        errorDisplay: mapShopifyCustomerError(result.customerUserErrors[0], 'login'),
      };
    }

    if (result?.customerAccessToken?.accessToken) {
      const customerData = await fetchCustomerInfo(result.customerAccessToken.accessToken);
      return {
        user: {
          email: customerData?.email ?? email,
          firstName: customerData?.firstName ?? '',
          lastName: customerData?.lastName ?? '',
          accessToken: result.customerAccessToken.accessToken,
        },
        errorDisplay: null,
      };
    }

    return { user: null, errorDisplay: getGenericLoginErrorDisplay() };
  } catch {
    return { user: null, errorDisplay: getConnectionErrorDisplay() };
  }
}

async function fetchCustomerInfo(accessToken: string) {
  const query = `
    query {
      customer(customerAccessToken: "${accessToken}") {
        email
        firstName
        lastName
      }
    }
  `;

  try {
    const response = await fetch(getStorefrontApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontAccessToken,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    return data?.data?.customer ?? null;
  } catch {
    return null;
  }
}

async function shopifyCustomerRecover(
  email: string,
): Promise<{ success: boolean; error: string | null }> {
  const query = `
    mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { code field message }
      }
    }
  `;

  try {
    const response = await fetch(getStorefrontApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables: { email } }),
    });

    const data = await response.json();
    const result = data?.data?.customerRecover;

    if (result?.customerUserErrors?.length > 0) {
      const recoverError = result.customerUserErrors[0];
      if (recoverError.code === 'UNIDENTIFIED_CUSTOMER') {
        return { success: true, error: null };
      }
      return {
        success: false,
        error: mapShopifyCustomerError(recoverError, 'recover').title,
      };
    }

    return { success: true, error: null };
  } catch {
    return { success: false, error: 'Error de conexión con el servidor.' };
  }
}

function toCustomerGid(customerId: string): string {
  if (customerId.startsWith('gid://')) return customerId;
  return `gid://shopify/Customer/${customerId}`;
}

async function shopifyCustomerReset(
  password: string,
  options: { customerId: string; resetToken: string } | { resetUrl: string },
): Promise<{ success: boolean; error: string | null; user?: AuthUser }> {
  const useResetUrl = 'resetUrl' in options;

  const query = useResetUrl
    ? `
      mutation customerResetByUrl($resetUrl: URL!, $password: String!) {
        customerResetByUrl(resetUrl: $resetUrl, password: $password) {
          customerAccessToken { accessToken expiresAt }
          customerUserErrors { code field message }
        }
      }
    `
    : `
      mutation customerReset($id: ID!, $input: CustomerResetInput!) {
        customerReset(id: $id, input: $input) {
          customerAccessToken { accessToken expiresAt }
          customerUserErrors { code field message }
        }
      }
    `;

  const variables = useResetUrl
    ? { resetUrl: options.resetUrl, password }
    : {
        id: toCustomerGid(options.customerId),
        input: { resetToken: options.resetToken, password },
      };

  try {
    const response = await fetch(getStorefrontApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    const result = useResetUrl ? data?.data?.customerResetByUrl : data?.data?.customerReset;

    if (result?.customerUserErrors?.length > 0) {
      const resetError = mapShopifyCustomerError(result.customerUserErrors[0], 'reset');
      return { success: false, error: resetError.title };
    }

    const accessToken = result?.customerAccessToken?.accessToken;
    if (!accessToken) {
      return {
        success: false,
        error: 'No se pudo restablecer la contraseña. El enlace puede haber expirado.',
      };
    }

    const customerData = await fetchCustomerInfo(accessToken);
    return {
      success: true,
      error: null,
      user: {
        email: customerData?.email ?? '',
        firstName: customerData?.firstName ?? '',
        lastName: customerData?.lastName ?? '',
        accessToken,
      },
    };
  } catch {
    return { success: false, error: 'Error de conexión con el servidor.' };
  }
}

async function shopifyCustomerCreate(input: RegisterInput): Promise<{ success: boolean; error: string | null }> {
  const query = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email firstName lastName }
        customerUserErrors { code field message }
      }
    }
  `;

  try {
    const response = await fetch(getStorefrontApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables: { input } }),
    });

    const data = await response.json();
    const result = data?.data?.customerCreate;

    if (result?.customerUserErrors?.length > 0) {
      const registerError = mapShopifyCustomerError(result.customerUserErrors[0], 'register');
      return { success: false, error: registerError.title };
    }

    if (result?.customer?.id) {
      return { success: true, error: null };
    }

    return { success: false, error: 'No se pudo crear la cuenta. Intenta de nuevo.' };
  } catch {
    return { success: false, error: 'Error de conexión con el servidor.' };
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(loadStoredAuthUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDisplay, setErrorDisplay] = useState<AuthErrorDisplay | null>(null);

  const setAuthError = useCallback((display: AuthErrorDisplay | null) => {
    setErrorDisplay(display);
    setError(display?.title ?? null);
  }, []);

  useEffect(() => {
    saveAuth(user);
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);

    if (isShopifyConfigured()) {
      const result = await shopifyCustomerLogin(email.trim(), password);
      setLoading(false);
      if (result.user) {
        setUser(result.user);
        return true;
      }
      setAuthError(result.errorDisplay);
      return false;
    }

    // Demo mode: accept any email/password combo with basic validation
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    if (!email.trim() || !password) {
      setAuthError({
        title: 'Faltan datos para iniciar sesión',
        description: 'Completa tu correo y contraseña para continuar.',
        hints: ['Ingresa el correo con el que te registraste en Bebify.'],
      });
      return false;
    }

    if (password.length < 4) {
      setAuthError(getGenericLoginErrorDisplay());
      return false;
    }

    setUser({
      email: email.trim(),
      firstName: email.split('@')[0],
      accessToken: 'demo-token',
    });
    return true;
  }, [setAuthError]);

  const register = useCallback(async (input: RegisterInput): Promise<{ success: boolean; error: string | null }> => {
    setLoading(true);
    setAuthError(null);

    if (isShopifyConfigured()) {
      const result = await shopifyCustomerCreate(input);
      setLoading(false);
      if (!result.success) setAuthError(result.error ? { title: result.error } : null);
      return result;
    }

    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    return { success: true, error: null };
  }, [setAuthError]);

  const recoverPassword = useCallback(
    async (email: string): Promise<{ success: boolean; error: string | null }> => {
      setLoading(true);
      setAuthError(null);

      if (!email.trim()) {
        setLoading(false);
        const message = 'Ingresa el correo electrónico de tu cuenta.';
        setAuthError({
          title: message,
          hints: ['Usa el mismo correo con el que te registraste en Bebify.'],
        });
        return { success: false, error: message };
      }

      if (isShopifyConfigured()) {
        const result = await shopifyCustomerRecover(email.trim());
        setLoading(false);
        if (!result.success) setAuthError(result.error ? { title: result.error } : null);
        return result;
      }

      await new Promise((r) => setTimeout(r, 800));
      setLoading(false);
      return { success: true, error: null };
    },
    [setAuthError],
  );

  const resetPassword = useCallback(
    async (
      password: string,
      options: { customerId: string; resetToken: string } | { resetUrl: string },
    ): Promise<{ success: boolean; error: string | null }> => {
      setLoading(true);
      setAuthError(null);

      if (password.length < 5) {
        setLoading(false);
        const message = 'La contraseña debe tener al menos 5 caracteres.';
        setAuthError({
          title: message,
          hints: ['Elige una contraseña segura que recuerdes fácilmente.'],
        });
        return { success: false, error: message };
      }

      if (isShopifyConfigured()) {
        const result = await shopifyCustomerReset(password, options);
        setLoading(false);
        if (result.success && result.user) {
          setUser(result.user);
          return { success: true, error: null };
        }
        setAuthError(result.error ? { title: result.error } : null);
        return { success: false, error: result.error };
      }

      await new Promise((r) => setTimeout(r, 800));
      setLoading(false);
      return { success: true, error: null };
    },
    [setAuthError],
  );

  const logout = useCallback(() => {
    setUser(null);
    setAuthError(null);
  }, [setAuthError]);

  const clearError = useCallback(() => setAuthError(null), [setAuthError]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      error,
      errorDisplay,
      login,
      register,
      recoverPassword,
      resetPassword,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
