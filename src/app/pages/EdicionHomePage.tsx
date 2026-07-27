import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  LogOut,
  Save,
  ExternalLink,
  Image,
  Type,
  Loader2,
  Upload,
  Trash2,
  Link2,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Search,
} from 'lucide-react';
import type { HeroSlide, HomeContent } from '@/types/homeContent';
import homeContentDefault from '@/data/home-content.json';
import { persistHomeContent, uploadHomeImage, useHomeContent } from '@/app/hooks/useHomeContent';
import {
  getEdicionCredentials,
  isEdicionAuthenticated,
  setEdicionSession,
  verifyEdicionCredentials,
} from '@/app/utils/edicionAuth';
import { PLACEHOLDER_IMAGES } from '@/assets/placeholders';

const SECTIONS = ['Hero', 'Banner registro', 'Quiénes somos', 'Beneficios', 'Carruseles'] as const;

const EMPTY_HERO_SLIDE: HeroSlide = {
  imageMobile: '',
  imageDesktop: '',
  title: '',
  subtitle: '',
  badge: '',
  buttonText: '',
  buttonHref: '',
  imageOnly: true,
};

const MAX_HERO_SLIDES = 8;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>;
}

function TextInput({
  value,
  onChange,
  multiline = false,
  placeholder = '',
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const className =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055a2]';

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

function ImageField({
  label,
  value,
  onChange,
  hint,
  onUploadingChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const localPreviewRef = useRef<string | null>(null);
  const uploadingRef = useRef(false);
  const onUploadingChangeRef = useRef(onUploadingChange);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUrl, setShowUrl] = useState(Boolean(value && value.startsWith('http')));
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  onUploadingChangeRef.current = onUploadingChange;

  const clearLocalPreview = () => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
    setLocalPreview(null);
  };

  useEffect(
    () => () => {
      clearLocalPreview();
      if (uploadingRef.current) onUploadingChangeRef.current?.(false);
    },
    [],
  );

  const setUploadingState = (next: boolean) => {
    uploadingRef.current = next;
    setUploading(next);
    onUploadingChange?.(next);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Elige un archivo de imagen (JPG, PNG, WebP o GIF)');
      return;
    }
    setUploadingState(true);
    setError('');
    clearLocalPreview();
    const blobUrl = URL.createObjectURL(file);
    localPreviewRef.current = blobUrl;
    setLocalPreview(blobUrl);
    try {
      const creds = getEdicionCredentials();
      if (!creds) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      const url = await uploadHomeImage(creds.username, creds.password, file);
      onChange(url);
      clearLocalPreview();
      setShowUrl(false);
    } catch (err) {
      clearLocalPreview();
      setError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploadingState(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const displaySrc = localPreview || value;

  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`rounded-xl border-2 border-dashed p-3 transition-colors ${
          dragOver ? 'border-[#0055a2] bg-blue-50' : 'border-gray-200 bg-gray-50'
        }`}
      >
        {displaySrc ? (
          <div className="space-y-3">
            <img
              key={displaySrc}
              src={displaySrc}
              alt=""
              className="h-36 w-full object-cover rounded-lg border bg-white"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0055a2] px-3 py-2 text-xs font-semibold text-white hover:bg-[#004488] disabled:opacity-60"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Cambiar imagen
              </button>
              <button
                type="button"
                onClick={() => {
                  clearLocalPreview();
                  onChange('');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg py-8 text-center hover:bg-white/70 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-[#0055a2] animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-[#0055a2]" />
            )}
            <span className="text-sm font-semibold text-gray-800">
              {uploading ? 'Subiendo…' : 'Arrastra una imagen o haz clic para subir'}
            </span>
            <span className="text-xs text-gray-500">JPG, PNG, WebP o GIF · máx. 5 MB</span>
          </button>
        )}
        <input
          id={inputId}
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => setShowUrl((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-[#0055a2] hover:underline"
      >
        <Link2 className="w-3.5 h-3.5" />
        {showUrl ? 'Ocultar URL' : 'Usar URL en su lugar'}
      </button>
      {showUrl && (
        <TextInput
          value={value}
          onChange={onChange}
          placeholder="https://… o /banners/…"
        />
      )}
    </div>
  );
}

function ImageFields({
  mobile,
  desktop,
  onMobile,
  onDesktop,
  onUploadingChange,
}: {
  mobile: string;
  desktop: string;
  onMobile: (v: string) => void;
  onDesktop: (v: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <ImageField
        label="Imagen móvil"
        value={mobile}
        onChange={onMobile}
        onUploadingChange={onUploadingChange}
        hint="Recomendado: vertical o cuadrada, ~800px de ancho"
      />
      <ImageField
        label="Imagen desktop"
        value={desktop}
        onChange={onDesktop}
        onUploadingChange={onUploadingChange}
        hint="Recomendado: horizontal, ~1600px de ancho"
      />
    </div>
  );
}

export const EdicionHomePage: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(isEdicionAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeSection, setActiveSection] = useState<(typeof SECTIONS)[number]>('Hero');
  const [content, setContent] = useState<HomeContent>(homeContentDefault as HomeContent);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [syncingWholesale, setSyncingWholesale] = useState(false);
  const [wholesaleMessage, setWholesaleMessage] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);
  const [debugEmail, setDebugEmail] = useState('');
  const [debuggingCustomer, setDebuggingCustomer] = useState(false);
  const [debugResult, setDebugResult] = useState<null | {
    ok: boolean;
    email: string;
    wholesale: boolean;
    matchedTags: string[];
    productsInMatched: number;
    customer: { firstName?: string; lastName?: string; tags: string[] } | null;
    snapshot: { tagCount: number; tags: string[]; generatedAt?: string; generatedFrom?: string };
  }>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [uploadsInFlight, setUploadsInFlight] = useState(0);
  const hydratedRef = useRef(false);
  const contentRef = useRef(content);
  const { content: remoteContent, loading } = useHomeContent();

  contentRef.current = content;

  useEffect(() => {
    if (!authenticated) {
      hydratedRef.current = false;
      return;
    }
    if (!loading && !hydratedRef.current) {
      setContent(remoteContent);
      hydratedRef.current = true;
    }
  }, [authenticated, loading, remoteContent]);

  const trackUpload = (uploading: boolean) => {
    setUploadsInFlight((n) => Math.max(0, n + (uploading ? 1 : -1)));
  };

  const patchHeroSlideImage = (
    index: number,
    field: 'imageMobile' | 'imageDesktop',
    url: string,
  ) => {
    setContent((c) => {
      const slides = [...c.hero.slides];
      const slide = slides[index];
      if (!slide) return c;
      const other = field === 'imageMobile' ? 'imageDesktop' : 'imageMobile';
      slides[index] = {
        ...slide,
        [field]: url,
        // Si el otro tamaño está vacío, reutilizar la misma URL para que el home la muestre.
        [other]: slide[other] || url,
      };
      return { ...c, hero: { slides } };
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const ok = await verifyEdicionCredentials(username, password);
      if (!ok) {
        setLoginError('Usuario o contraseña incorrectos');
        return;
      }
      setEdicionSession({ username, password });
      setAuthenticated(true);
    } catch {
      setLoginError('No se pudo verificar el acceso. Intenta de nuevo.');
    }
  };

  const handleLogout = () => {
    setEdicionSession(null);
    setAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleSave = async () => {
    if (uploadsInFlight > 0) {
      setSaveMessage('Espera a que termine la subida de la imagen antes de guardar');
      return;
    }
    setSaving(true);
    setSaveMessage('');
    try {
      const creds = getEdicionCredentials();
      if (!creds) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      const saved = await persistHomeContent(
        creds.username,
        creds.password,
        contentRef.current,
      );
      setContent(saved);
      setSaveMessage('Cambios guardados correctamente');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleImportCsv = async (file: File | undefined) => {
    if (!file) return;
    setImportingCsv(true);
    setWholesaleMessage('');
    try {
      const creds = getEdicionCredentials();
      if (!creds) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      const csv = await file.text();
      const res = await fetch('/api/import-wholesale-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: creds.username,
          password: creds.password,
          csv,
          fileName: file.name,
          mode: 'merge',
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        tagCount?: number;
        productCount?: number;
        importedGroups?: string[];
        preservedFromBlob?: string[];
      };
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo importar el CSV.');
      }
      const imported = (data.importedGroups ?? []).slice(0, 8);
      const preserved = (data.preservedFromBlob ?? []).slice(0, 6);
      let msg = `CSV importado: ${data.tagCount ?? 0} grupos totales, ${data.productCount ?? 0} productos. Los usuarios lo ven en ~1 minuto.`;
      if (imported.length) {
        msg += ` Importados: ${imported.join(', ')}${(data.importedGroups?.length ?? 0) > imported.length ? '…' : ''}.`;
      }
      if (preserved.length) {
        msg += ` Conservados (no venían en el CSV): ${preserved.join(', ')}${(data.preservedFromBlob?.length ?? 0) > preserved.length ? '…' : ''}.`;
      }
      setWholesaleMessage(msg);
    } catch (err) {
      setWholesaleMessage(err instanceof Error ? err.message : 'Error al importar el CSV');
    } finally {
      setImportingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const handleDebugCustomer = async () => {
    const email = debugEmail.trim();
    if (!email) return;
    setDebuggingCustomer(true);
    setDebugResult(null);
    try {
      const creds = getEdicionCredentials();
      if (!creds) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      const res = await fetch('/api/wholesale-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: creds.username,
          password: creds.password,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo consultar.');
      }
      setDebugResult(data);
    } catch (err) {
      setWholesaleMessage(err instanceof Error ? err.message : 'Error al consultar cliente');
    } finally {
      setDebuggingCustomer(false);
    }
  };

  const handleSyncWholesale = async () => {
    setSyncingWholesale(true);
    setWholesaleMessage('');
    try {
      const creds = getEdicionCredentials();
      if (!creds) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
      const res = await fetch('/api/sync-wholesale-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: creds.username, password: creds.password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        tagCount?: number;
        productCount?: number;
        skippedEmpty?: string[];
        mergedFromBlob?: string[];
      };
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(
            'Samita está limitando requests. Esperá ~5 minutos e intentá de nuevo.',
          );
        }
        throw new Error(data.error || 'No se pudieron sincronizar los precios');
      }
      const skipped = (data.skippedEmpty ?? []).filter(Boolean);
      const merged = (data.mergedFromBlob ?? []).filter(Boolean);
      let msg = `Precios mayoreo actualizados (${data.tagCount ?? 0} grupos, ${data.productCount ?? 0} productos). Los usuarios los ven en ~1 minuto.`;
      if (skipped.length) {
        msg += ` Sin precios en Samita (no importados): ${skipped.join(', ')}. Cargá fixed-amount por producto y volvé a sincronizar.`;
      }
      if (merged.length) {
        msg += ` Se conservaron del Blob: ${merged.join(', ')}.`;
      }
      setWholesaleMessage(msg);
    } catch (err) {
      setWholesaleMessage(err instanceof Error ? err.message : 'Error al sincronizar');
    } finally {
      setSyncingWholesale(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <img src={PLACEHOLDER_IMAGES.logo} alt="Bebify" className="h-14 object-contain" />
          </div>
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Lock className="w-5 h-5 text-[#0055a2]" />
            <h1 className="text-xl font-bold text-[#0055a2]">Edición del Home</h1>
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-[#0055a2] text-sm"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-[#0055a2] text-sm"
          />
          {loginError && <p className="text-red-500 text-xs mb-3">{loginError}</p>}
          <button
            type="submit"
            className="w-full bg-[#0055a2] text-white py-3 rounded-lg font-bold hover:bg-[#004488] transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#0055a2] text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src={PLACEHOLDER_IMAGES.logo} alt="Bebify" className="h-8 object-contain brightness-0 invert" />
          <h1 className="text-lg font-bold">Edición del Home</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Ver sitio</span>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || loading || uploadsInFlight > 0}
            className="flex items-center gap-1.5 bg-white text-[#0055a2] hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
          >
            {saving || uploadsInFlight > 0 ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {uploadsInFlight > 0 ? 'Subiendo…' : 'Guardar'}
          </button>
          <button onClick={handleLogout} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label="Salir">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {saveMessage && (
        <div
          className={`px-4 py-2 text-sm text-center ${
            saveMessage.includes('correctamente') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {saveMessage}
        </div>
      )}
      {wholesaleMessage && (
        <div
          className={`px-4 py-2 text-sm text-center ${
            wholesaleMessage.includes('actualizados')
              ? 'bg-green-100 text-green-800'
              : 'bg-amber-100 text-amber-900'
          }`}
        >
          {wholesaleMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row max-w-6xl mx-auto p-4 gap-4">
        <nav className="md:w-48 shrink-0 flex md:flex-col gap-2 overflow-x-auto">
          {SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === section
                  ? 'bg-[#0055a2] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {section}
            </button>
          ))}
          <div className="mt-2 md:mt-4 p-3 bg-white rounded-lg border border-gray-200 space-y-3 shrink-0 min-w-[12rem]">
            <div>
              <p className="text-xs font-semibold text-gray-700">Precios mayoreo</p>
              <p className="text-[11px] text-gray-500 leading-snug">
                Después de cambiar descuentos en Samita, actualizá acá. Los usuarios los ven en ~1
                minuto (sin redeploy).
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncWholesale}
              disabled={syncingWholesale || importingCsv}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0055a2] px-3 py-2 text-xs font-semibold text-white hover:bg-[#004488] disabled:opacity-60"
              title="Descarga las reglas activas desde la API de Samita y publica el snapshot."
            >
              {syncingWholesale ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {syncingWholesale ? 'Sincronizando…' : 'Sync desde API'}
            </button>
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[11px] text-gray-500 leading-snug">
                Si la API de Samita no trae precios nuevos, subí el CSV export (Samita → Export
                Discount Groups). Se hace merge, no borra grupos existentes.
              </p>
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                disabled={importingCsv || syncingWholesale}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0055a2] px-3 py-2 text-xs font-semibold text-[#0055a2] hover:bg-blue-50 disabled:opacity-60"
              >
                {importingCsv ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                {importingCsv ? 'Importando…' : 'Importar CSV Samita'}
              </button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => void handleImportCsv(e.target.files?.[0])}
              />
            </div>
            <div className="border-t border-gray-100 pt-2 space-y-2">
              <p className="text-[11px] font-semibold text-gray-700">Diagnóstico cliente</p>
              <input
                type="email"
                value={debugEmail}
                onChange={(e) => setDebugEmail(e.target.value)}
                placeholder="email del cliente"
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0055a2]"
              />
              <button
                type="button"
                onClick={handleDebugCustomer}
                disabled={debuggingCustomer || !debugEmail.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {debuggingCustomer ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                {debuggingCustomer ? 'Consultando…' : 'Ver tags / grupos'}
              </button>
              {debugResult && (
                <div className="text-[11px] text-gray-600 leading-snug bg-gray-50 rounded-md p-2 space-y-1">
                  {debugResult.customer ? (
                    <>
                      <p>
                        <span className="font-semibold">Cliente:</span>{' '}
                        {debugResult.customer.firstName} {debugResult.customer.lastName}
                      </p>
                      <p>
                        <span className="font-semibold">Tags:</span>{' '}
                        {debugResult.customer.tags.length
                          ? debugResult.customer.tags.join(', ')
                          : '(sin tags)'}
                      </p>
                      <p>
                        <span className="font-semibold">Mayoreo:</span>{' '}
                        {debugResult.wholesale ? (
                          <span className="text-green-700">
                            sí — {debugResult.matchedTags.join(', ')} (
                            {debugResult.productsInMatched} productos)
                          </span>
                        ) : (
                          <span className="text-red-700">
                            no — ninguno de sus tags coincide con un grupo del snapshot
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Snapshot: {debugResult.snapshot.tagCount} grupos,{' '}
                        {debugResult.snapshot.generatedAt?.slice(0, 16).replace('T', ' ')}
                      </p>
                    </>
                  ) : (
                    <p className="text-red-700">Cliente no encontrado en Shopify.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        <main className="flex-1 bg-white rounded-xl shadow-sm p-6 space-y-5">
          {loading && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando contenido...
            </p>
          )}

          {activeSection === 'Hero' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[#0055a2] font-bold">
                  <Image className="w-5 h-5" />
                  Hero principal (slider)
                </div>
                <button
                  type="button"
                  disabled={content.hero.slides.length >= MAX_HERO_SLIDES}
                  onClick={() =>
                    setContent((c) => ({
                      ...c,
                      hero: { slides: [...c.hero.slides, { ...EMPTY_HERO_SLIDE }] },
                    }))
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0055a2] px-3 py-2 text-xs font-semibold text-white hover:bg-[#004488] disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar banner
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Sube las imágenes desde tu computadora. Luego pulsa Guardar para publicar los cambios.
                Puedes tener hasta {MAX_HERO_SLIDES} banners.
              </p>
              {content.hero.slides.map((slide, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-700">Banner {index + 1}</p>
                    <button
                      type="button"
                      disabled={content.hero.slides.length <= 1}
                      onClick={() =>
                        setContent((c) => ({
                          ...c,
                          hero: { slides: c.hero.slides.filter((_, i) => i !== index) },
                        }))
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                  <ImageFields
                    mobile={slide.imageMobile}
                    desktop={slide.imageDesktop}
                    onUploadingChange={trackUpload}
                    onMobile={(v) => patchHeroSlideImage(index, 'imageMobile', v)}
                    onDesktop={(v) => patchHeroSlideImage(index, 'imageDesktop', v)}
                  />
                  <p className="text-xs text-gray-500">
                    Si subes solo una imagen, se usa también en el otro tamaño. Deja ambos vacíos
                    para la imagen predeterminada del tema.
                  </p>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(slide.imageOnly)}
                      onChange={(e) => {
                        const slides = [...content.hero.slides];
                        slides[index] = { ...slides[index], imageOnly: e.target.checked };
                        setContent((c) => ({ ...c, hero: { slides } }));
                      }}
                    />
                    Solo imagen (sin texto superpuesto)
                  </label>
                  {!slide.imageOnly && (
                    <>
                      <div>
                        <FieldLabel>Badge</FieldLabel>
                        <TextInput
                          value={slide.badge}
                          onChange={(v) => {
                            const slides = [...content.hero.slides];
                            slides[index] = { ...slides[index], badge: v };
                            setContent((c) => ({ ...c, hero: { slides } }));
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Título</FieldLabel>
                        <TextInput
                          value={slide.title}
                          onChange={(v) => {
                            const slides = [...content.hero.slides];
                            slides[index] = { ...slides[index], title: v };
                            setContent((c) => ({ ...c, hero: { slides } }));
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Subtítulo</FieldLabel>
                        <TextInput
                          value={slide.subtitle}
                          onChange={(v) => {
                            const slides = [...content.hero.slides];
                            slides[index] = { ...slides[index], subtitle: v };
                            setContent((c) => ({ ...c, hero: { slides } }));
                          }}
                          multiline
                        />
                      </div>
                      <div>
                        <FieldLabel>Texto del botón</FieldLabel>
                        <TextInput
                          value={slide.buttonText}
                          onChange={(v) => {
                            const slides = [...content.hero.slides];
                            slides[index] = { ...slides[index], buttonText: v };
                            setContent((c) => ({ ...c, hero: { slides } }));
                          }}
                        />
                      </div>
                      <div>
                        <FieldLabel>Link del botón</FieldLabel>
                        <TextInput
                          value={slide.buttonHref || ''}
                          onChange={(v) => {
                            const slides = [...content.hero.slides];
                            slides[index] = { ...slides[index], buttonHref: v };
                            setContent((c) => ({ ...c, hero: { slides } }));
                          }}
                          placeholder="/categorias/whisky o https://…"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Vacío = scroll a productos. Ruta interna o URL completa.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </>
          )}

          {activeSection === 'Banner registro' && (
            <>
              <div className="flex items-center gap-2 text-[#0055a2] font-bold">
                <Image className="w-5 h-5" />
                Banner de registro
              </div>
              <ImageFields
                mobile={content.registerBanner.imageMobile}
                desktop={content.registerBanner.imageDesktop}
                onUploadingChange={trackUpload}
                onMobile={(v) =>
                  setContent((c) => ({
                    ...c,
                    registerBanner: {
                      ...c.registerBanner,
                      imageMobile: v,
                      imageDesktop: c.registerBanner.imageDesktop || v,
                    },
                  }))
                }
                onDesktop={(v) =>
                  setContent((c) => ({
                    ...c,
                    registerBanner: {
                      ...c.registerBanner,
                      imageDesktop: v,
                      imageMobile: c.registerBanner.imageMobile || v,
                    },
                  }))
                }
              />
              <div>
                <FieldLabel>Título</FieldLabel>
                <TextInput
                  value={content.registerBanner.title}
                  onChange={(v) =>
                    setContent((c) => ({ ...c, registerBanner: { ...c.registerBanner, title: v } }))
                  }
                />
              </div>
              <div>
                <FieldLabel>Descripción</FieldLabel>
                <TextInput
                  value={content.registerBanner.description}
                  onChange={(v) =>
                    setContent((c) => ({ ...c, registerBanner: { ...c.registerBanner, description: v } }))
                  }
                  multiline
                />
              </div>
              <div>
                <FieldLabel>Texto del botón</FieldLabel>
                <TextInput
                  value={content.registerBanner.buttonText}
                  onChange={(v) =>
                    setContent((c) => ({ ...c, registerBanner: { ...c.registerBanner, buttonText: v } }))
                  }
                />
              </div>
            </>
          )}

          {activeSection === 'Quiénes somos' && (
            <>
              <div className="flex items-center gap-2 text-[#0055a2] font-bold">
                <Type className="w-5 h-5" />
                Sección Quiénes somos
              </div>
              <ImageField
                label="Imagen"
                value={content.about.image}
                onUploadingChange={trackUpload}
                onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, image: v } }))}
              />
              <div>
                <FieldLabel>Texto alternativo de imagen</FieldLabel>
                <TextInput
                  value={content.about.imageAlt}
                  onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, imageAlt: v } }))}
                />
              </div>
              <div>
                <FieldLabel>Etiqueta</FieldLabel>
                <TextInput
                  value={content.about.badge}
                  onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, badge: v } }))}
                />
              </div>
              <div>
                <FieldLabel>Título</FieldLabel>
                <TextInput
                  value={content.about.title}
                  onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, title: v } }))}
                />
              </div>
              <div>
                <FieldLabel>Párrafo 1</FieldLabel>
                <TextInput
                  value={content.about.paragraph1}
                  onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, paragraph1: v } }))}
                  multiline
                />
              </div>
              <div>
                <FieldLabel>Párrafo 2</FieldLabel>
                <TextInput
                  value={content.about.paragraph2}
                  onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, paragraph2: v } }))}
                  multiline
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Estadística (número)</FieldLabel>
                  <TextInput
                    value={content.about.statValue}
                    onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, statValue: v } }))}
                  />
                </div>
                <div>
                  <FieldLabel>Estadística (etiqueta)</FieldLabel>
                  <TextInput
                    value={content.about.statLabel}
                    onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, statLabel: v } }))}
                  />
                </div>
              </div>
              {content.about.features.map((feature, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500">Característica {index + 1}</p>
                  <TextInput
                    value={feature.title}
                    onChange={(v) => {
                      const features = [...content.about.features];
                      features[index] = { ...features[index], title: v };
                      setContent((c) => ({ ...c, about: { ...c.about, features } }));
                    }}
                  />
                  <TextInput
                    value={feature.description}
                    onChange={(v) => {
                      const features = [...content.about.features];
                      features[index] = { ...features[index], description: v };
                      setContent((c) => ({ ...c, about: { ...c.about, features } }));
                    }}
                  />
                </div>
              ))}
              <div>
                <FieldLabel>Cita destacada</FieldLabel>
                <TextInput
                  value={content.about.quote}
                  onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, quote: v } }))}
                  multiline
                />
              </div>
            </>
          )}

          {activeSection === 'Beneficios' && (
            <>
              <div className="flex items-center gap-2 text-[#0055a2] font-bold">
                <Type className="w-5 h-5" />
                Bloque de beneficios (4 columnas)
              </div>
              {content.benefits.map((benefit, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500">Beneficio {index + 1}</p>
                  <div>
                    <FieldLabel>Icono (emoji)</FieldLabel>
                    <TextInput
                      value={benefit.icon}
                      onChange={(v) => {
                        const benefits = [...content.benefits];
                        benefits[index] = { ...benefits[index], icon: v };
                        setContent((c) => ({ ...c, benefits }));
                      }}
                    />
                  </div>
                  <TextInput
                    value={benefit.title}
                    onChange={(v) => {
                      const benefits = [...content.benefits];
                      benefits[index] = { ...benefits[index], title: v };
                      setContent((c) => ({ ...c, benefits }));
                    }}
                  />
                  <TextInput
                    value={benefit.description}
                    onChange={(v) => {
                      const benefits = [...content.benefits];
                      benefits[index] = { ...benefits[index], description: v };
                      setContent((c) => ({ ...c, benefits }));
                    }}
                    multiline
                  />
                </div>
              ))}
            </>
          )}

          {activeSection === 'Carruseles' && (
            <>
              <div className="flex items-center gap-2 text-[#0055a2] font-bold">
                <Type className="w-5 h-5" />
                Títulos de carruseles
              </div>
              <div>
                <FieldLabel>Productos destacados</FieldLabel>
                <TextInput
                  value={content.carousels.featuredTitle}
                  onChange={(v) =>
                    setContent((c) => ({ ...c, carousels: { ...c.carousels, featuredTitle: v } }))
                  }
                />
              </div>
              <div>
                <FieldLabel>Últimas novedades</FieldLabel>
                <TextInput
                  value={content.carousels.newArrivalsTitle}
                  onChange={(v) =>
                    setContent((c) => ({ ...c, carousels: { ...c.carousels, newArrivalsTitle: v } }))
                  }
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
