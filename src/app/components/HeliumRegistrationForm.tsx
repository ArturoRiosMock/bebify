import React, { useEffect, useRef, useState } from 'react';
import { HELIUM_REGISTRATION_FORM_ID } from '@/integrations/helium/config';
import { mountHeliumForm } from '@/integrations/helium/mountHeliumForm';
import { enhanceHeliumFileFields } from '@/integrations/helium/enhanceHeliumFileFields';

type HeliumRegistrationFormProps = {
  redirectUrl?: string;
};

export const HeliumRegistrationForm: React.FC<HeliumRegistrationFormProps> = ({
  redirectUrl = '/login?registered=1',
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const formElement = formRef.current;
    const wrapperElement = wrapperRef.current;
    if (!formElement || !wrapperElement) return;

    if (formElement.getAttribute('data-cf-state') === 'mounted') {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let stopFileEnhancer: (() => void) | undefined;

    const handleReady = () => {
      if (!cancelled) {
        setLoading(false);
        stopFileEnhancer?.();
        stopFileEnhancer = enhanceHeliumFileFields(wrapperElement);
      }
    };

    document.addEventListener('cf:ready', handleReady);

    const mount = async () => {
      try {
        await mountHeliumForm(formElement, HELIUM_REGISTRATION_FORM_ID, { redirectUrl });
        if (!cancelled && formElement.getAttribute('data-cf-state') === 'mounted') {
          setLoading(false);
          stopFileEnhancer?.();
          stopFileEnhancer = enhanceHeliumFileFields(wrapperElement);
        }
      } catch (mountError) {
        if (!cancelled) {
          setError(
            mountError instanceof Error
              ? mountError.message
              : 'No se pudo cargar el formulario de registro.',
          );
          setLoading(false);
        }
      }
    };

    mount();

    return () => {
      cancelled = true;
      stopFileEnhancer?.();
      document.removeEventListener('cf:ready', handleReady);
    };
  }, [redirectUrl]);

  return (
    <div ref={wrapperRef} className="helium-registration-form">
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-[#717182]" aria-live="polite">
          <div className="w-8 h-8 border-2 border-[#0055a2] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Cargando formulario de registro…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      <form ref={formRef} className={loading ? 'sr-only' : undefined} noValidate />
    </div>
  );
};
