import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, LogOut, Save, ExternalLink, Image, Type, Loader2 } from 'lucide-react';
import type { HomeContent } from '@/types/homeContent';
import homeContentDefault from '@/data/home-content.json';
import { persistHomeContent, useHomeContent } from '@/app/hooks/useHomeContent';
import {
  checkEdicionCredentials,
  isEdicionAuthenticated,
  setEdicionAuthenticated,
  EDICION_PASS,
  EDICION_USER,
} from '@/app/utils/edicionAuth';
import { PLACEHOLDER_IMAGES } from '@/assets/placeholders';

const SECTIONS = ['Hero', 'Banner registro', 'Quiénes somos', 'Beneficios', 'Carruseles'] as const;

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

function ImageFields({
  mobile,
  desktop,
  onMobile,
  onDesktop,
}: {
  mobile: string;
  desktop: string;
  onMobile: (v: string) => void;
  onDesktop: (v: string) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <FieldLabel>Imagen móvil (URL)</FieldLabel>
        <TextInput value={mobile} onChange={onMobile} placeholder="https://..." />
        {mobile && (
          <img src={mobile} alt="" className="mt-2 h-24 w-full object-cover rounded-lg border" />
        )}
      </div>
      <div>
        <FieldLabel>Imagen desktop (URL)</FieldLabel>
        <TextInput value={desktop} onChange={onDesktop} placeholder="https://..." />
        {desktop && (
          <img src={desktop} alt="" className="mt-2 h-24 w-full object-cover rounded-lg border" />
        )}
      </div>
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
  const { content: remoteContent, loading } = useHomeContent();

  useEffect(() => {
    if (authenticated && !loading) {
      setContent(remoteContent);
    }
  }, [authenticated, loading, remoteContent]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkEdicionCredentials(username, password)) {
      setEdicionAuthenticated(true);
      setAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }
  };

  const handleLogout = () => {
    setEdicionAuthenticated(false);
    setAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const saved = await persistHomeContent(EDICION_USER, EDICION_PASS, content);
      setContent(saved);
      setSaveMessage('Cambios guardados correctamente');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
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
            disabled={saving || loading}
            className="flex items-center gap-1.5 bg-white text-[#0055a2] hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
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
              <div className="flex items-center gap-2 text-[#0055a2] font-bold">
                <Image className="w-5 h-5" />
                Hero principal (slider)
              </div>
              {content.hero.slides.map((slide, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <p className="text-sm font-bold text-gray-700">Banner {index + 1}</p>
                  <ImageFields
                    mobile={slide.imageMobile}
                    desktop={slide.imageDesktop}
                    onMobile={(v) => {
                      const slides = [...content.hero.slides];
                      slides[index] = { ...slides[index], imageMobile: v };
                      setContent((c) => ({ ...c, hero: { slides } }));
                    }}
                    onDesktop={(v) => {
                      const slides = [...content.hero.slides];
                      slides[index] = { ...slides[index], imageDesktop: v };
                      setContent((c) => ({ ...c, hero: { slides } }));
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Deja vacío para usar la imagen predeterminada del tema.
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
                onMobile={(v) =>
                  setContent((c) => ({ ...c, registerBanner: { ...c.registerBanner, imageMobile: v } }))
                }
                onDesktop={(v) =>
                  setContent((c) => ({ ...c, registerBanner: { ...c.registerBanner, imageDesktop: v } }))
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
              <div>
                <FieldLabel>Imagen (URL)</FieldLabel>
                <TextInput
                  value={content.about.image}
                  onChange={(v) => setContent((c) => ({ ...c, about: { ...c.about, image: v } }))}
                  placeholder="https://..."
                />
                {content.about.image && (
                  <img
                    src={content.about.image}
                    alt=""
                    className="mt-2 h-32 w-full max-w-md object-cover rounded-lg border"
                  />
                )}
              </div>
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
