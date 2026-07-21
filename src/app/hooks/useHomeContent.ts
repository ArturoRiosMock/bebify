import { useEffect, useState } from 'react';
import type { HeroContent, HeroSlide, HomeContent } from '@/types/homeContent';
import homeContentDefault from '@/data/home-content.json';

function migrateHero(hero: Partial<HeroContent> & Record<string, unknown>): HeroContent {
  const defaults = (homeContentDefault as HomeContent).hero;

  if (Array.isArray(hero.slides) && hero.slides.length > 0) {
    return { slides: hero.slides as HeroSlide[] };
  }

  const legacy = hero as {
    imageMobile?: string;
    imageDesktop?: string;
    title?: string;
    subtitle?: string;
    badge?: string;
    buttonText?: string;
  };

  if (legacy.title || legacy.imageDesktop || legacy.imageMobile) {
    return {
      slides: [
        {
          imageMobile: legacy.imageMobile ?? '',
          imageDesktop: legacy.imageDesktop ?? '',
          title: legacy.title ?? defaults.slides[0].title,
          subtitle: legacy.subtitle ?? defaults.slides[0].subtitle,
          badge: legacy.badge ?? defaults.slides[0].badge,
          buttonText: legacy.buttonText ?? defaults.slides[0].buttonText,
        },
        ...defaults.slides.slice(1),
      ],
    };
  }

  return defaults;
}

function mergeContent(remote: Partial<HomeContent>): HomeContent {
  const defaults = homeContentDefault as HomeContent;
  return {
    ...defaults,
    ...remote,
    hero: migrateHero((remote.hero ?? {}) as Partial<HeroContent> & Record<string, unknown>),
    registerBanner: { ...defaults.registerBanner, ...remote.registerBanner },
    about: {
      ...defaults.about,
      ...remote.about,
      features: remote.about?.features ?? defaults.about.features,
    },
    benefits: remote.benefits ?? defaults.benefits,
    carousels: { ...defaults.carousels, ...remote.carousels },
  };
}

export function useHomeContent() {
  const [content, setContent] = useState<HomeContent>(homeContentDefault as HomeContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/home-content', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('No se pudo cargar el contenido');
        }
        const data = (await res.json()) as Partial<HomeContent>;
        if (!cancelled) {
          setContent(mergeContent(data));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setContent(homeContentDefault as HomeContent);
          setError(err instanceof Error ? err.message : 'Contenido por defecto');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { content, loading, error, setContent };
}

export async function persistHomeContent(
  username: string,
  password: string,
  content: HomeContent,
): Promise<HomeContent> {
  const res = await fetch('/api/home-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, content }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al guardar');
  }

  return mergeContent(data.content);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('No se pudo leer el archivo'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export async function uploadHomeImage(
  username: string,
  password: string,
  file: File,
): Promise<string> {
  const dataUrl = await fileToBase64(file);
  const res = await fetch('/api/upload-home-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      filename: file.name,
      contentType: file.type || 'image/jpeg',
      data: dataUrl,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al subir imagen');
  }

  return data.url as string;
}
