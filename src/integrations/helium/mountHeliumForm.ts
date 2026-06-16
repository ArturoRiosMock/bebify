import {
  HELIUM_CF_VERSION,
  HELIUM_FORM_UPDATED_AT,
  HELIUM_CAPTCHA_SITE_KEY,
  heliumAssetBaseUrl,
  heliumFormApiUrl,
  heliumProxyUrl,
  heliumShopDomain,
} from '@/integrations/helium/config';
import {
  HELIUM_MEXICO_COUNTRIES,
  HELIUM_MEXICO_COUNTRY_OPTION,
} from '@/integrations/helium/countryOptions';

type HeliumFormPayload = {
  form: {
    id: string;
    target: string;
    [key: string]: unknown;
  };
  revision: Record<string, unknown>;
};

type HeliumEntrypoint = {
  $form: HTMLFormElement;
  registration: boolean;
  formId: string;
  updatedAt: number;
  target: string;
  originalForm: HTMLFormElement;
  version: string;
  form?: {
    id: string;
    currentRevision: Record<string, unknown>;
    target: string;
    [key: string]: unknown;
  };
  restore: () => void;
};

type HeliumWindow = Window &
  typeof globalThis & {
    CF?: Record<string, unknown> & {
      mountForm?: (form: HeliumEntrypoint['form']) => void;
      entrypoints?: HeliumEntrypoint[];
      requestedEmbedJS?: boolean;
      requestedEmbedCSS?: boolean;
    };
  };

const REACT_TARGET_MARKUP = `
<div class="cf-react-target">
  <div class="cf-preload">
    <div class="cf-preload-label cf-preload-item"></div>
    <div class="cf-preload-field cf-preload-item"></div>
    <div class="cf-preload-label cf-preload-item"></div>
    <div class="cf-preload-field cf-preload-item"></div>
    <div class="cf-preload-label cf-preload-item"></div>
    <div class="cf-preload-field cf-preload-item"></div>
    <span class="cf-preload-button cf-preload-item"></span>
    <span class="cf-preload-button cf-preload-item"></span>
  </div>
</div>`;

function getHeliumWindow(): HeliumWindow {
  return window as HeliumWindow;
}

function ensureHeliumGlobals(formId: string) {
  const heliumWindow = getHeliumWindow();

  if (!heliumWindow.CF) {
    heliumWindow.CF = { appEmbedEnabled: true };
  }

  heliumWindow.CF.appEmbedEnabled = true;
  heliumWindow.CF.registrationFormId = formId;
  heliumWindow.CF.version = HELIUM_CF_VERSION;
  heliumWindow.CF.environment = {
    domain: heliumShopDomain,
    baseApiUrl: 'https://app.customerfields.com',
    captchaSiteKey: HELIUM_CAPTCHA_SITE_KEY,
    captchaEnabled: true,
    proxyPath: heliumProxyUrl,
    countries: HELIUM_MEXICO_COUNTRIES,
    locale: 'es',
    localeRootPath: '/',
    adminIsLoggedIn: false,
  };
  heliumWindow.CF.allCountryOptionTags = HELIUM_MEXICO_COUNTRY_OPTION;
  heliumWindow.CF.shippingZoneCountryOptionTags = HELIUM_MEXICO_COUNTRY_OPTION;
}

function loadStylesheet(href: string) {
  const heliumWindow = getHeliumWindow();
  if (heliumWindow.CF?.requestedEmbedCSS) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = href;
  document.head.appendChild(link);
  heliumWindow.CF!.requestedEmbedCSS = true;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const heliumWindow = getHeliumWindow();
    if (heliumWindow.CF?.requestedEmbedJS && typeof heliumWindow.CF.mountForm === 'function') {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (typeof heliumWindow.CF?.mountForm === 'function') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Helium Customer Fields.')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      heliumWindow.CF!.requestedEmbedJS = true;
      resolve();
    };
    script.onerror = () => reject(new Error('No se pudo cargar Helium Customer Fields.'));
    document.head.appendChild(script);
  });
}

async function fetchFormData(formId: string, updatedAt: number): Promise<HeliumFormPayload | null> {
  const response = await fetch(heliumFormApiUrl(formId, updatedAt), {
    headers: {
      'X-Shopify-Shop-Domain': heliumShopDomain,
    },
  });

  if (!response.ok) return null;
  return response.json() as Promise<HeliumFormPayload>;
}

function prepareFormElement(formElement: HTMLFormElement, formId: string, redirectUrl: string) {
  formElement.setAttribute('data-cf-form', formId);
  formElement.setAttribute('action', '');
  formElement.setAttribute('data-cf-state', 'loading');
  formElement.innerHTML = `${REACT_TARGET_MARKUP}
    <input type="hidden" name="redirect" value="false" />
    <input type="hidden" name="login" value="false" />
    <input type="hidden" name="redirect_url" value="${redirectUrl}" />`;
  formElement.submit = () => {};

  const detectedForm = formElement as HTMLFormElement & { __cfDetected?: boolean };
  detectedForm.__cfDetected = true;
}

export async function mountHeliumForm(
  formElement: HTMLFormElement,
  formId: string,
  options: { updatedAt?: number; redirectUrl?: string } = {},
): Promise<void> {
  const updatedAt = options.updatedAt ?? HELIUM_FORM_UPDATED_AT;
  const redirectUrl = options.redirectUrl ?? '/login?registered=1';

  ensureHeliumGlobals(formId);
  prepareFormElement(formElement, formId, redirectUrl);

  document.documentElement.setAttribute('data-cf-initialized', 'loading');

  const formPayload = await fetchFormData(formId, updatedAt);
  if (!formPayload) {
    throw new Error('No se pudo cargar la configuración del formulario de registro.');
  }

  if (formPayload.form.target === 'customer-account') {
    throw new Error('Este formulario no es compatible con el registro en la tienda.');
  }

  loadStylesheet(`${heliumAssetBaseUrl}/customer-fields.css`);
  await loadScript(`${heliumAssetBaseUrl}/customer-fields.js`);

  const heliumWindow = getHeliumWindow();

  const entrypoint: HeliumEntrypoint = {
    $form: formElement,
    registration: true,
    formId,
    updatedAt,
    target: formPayload.form.target,
    originalForm: formElement.cloneNode(true) as HTMLFormElement,
    version: HELIUM_CF_VERSION,
    restore: () => {
      formElement.replaceWith(entrypoint.originalForm);
    },
    form: {
      ...formPayload.form,
      currentRevision: formPayload.revision,
    },
  };

  if (heliumWindow.CF?.entrypoints?.length) {
    heliumWindow.CF.entrypoints.push(entrypoint);
    heliumWindow.CF.mountForm?.(entrypoint.form);
    return;
  }

  heliumWindow.CF!.entrypoints = [entrypoint];

  if (typeof heliumWindow.CF?.mountForm === 'function') {
    heliumWindow.CF.mountForm(entrypoint.form);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('Helium Customer Fields no respondió a tiempo.'));
    }, 15000);

    const handleReady = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };

    document.addEventListener('cf:ready', handleReady, { once: true });
    document.dispatchEvent(new CustomEvent('cf:entrypoints_ready'));
  });
}
