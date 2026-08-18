import { useEffect, useState } from 'react';
import type { HomeContent } from '@/types/homeContent';
import homeContentDefault from '@/data/home-content.json';
import { mergeContent } from '@/app/hooks/homeContentMerge';
import { fetchHomeContent } from '@/app/hooks/fetchHomeContent';
import { fileToBase64 } from '@/app/utils/fileToBase64';

const DEFAULTS = homeContentDefault as HomeContent;

/** Sin slides hasta resolver el remoto: evita pintar un hero obsoleto del bundle. */
const PENDING_CONTENT: HomeContent = { ...DEFAULTS, hero: { slides: [] } };

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Contenido por defecto';
}

export function useHomeContent() {
  const [content, setContent] = useState<HomeContent>(PENDING_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const alive = { current: true };
    const settle = (next: HomeContent, err: string | null) => {
      if (!alive.current) return;
      setContent(next);
      setError(err);
      setLoading(false);
    };

    fetchHomeContent()
      .then((data) => settle(data, null))
      .catch((err: unknown) => settle(DEFAULTS, errorMessage(err)));

    return () => {
      alive.current = false;
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
  if (!res.ok) throw new Error(data.error || 'Error al guardar');
  return mergeContent(data.content);
}

export async function uploadHomeImage(
  username: string,
  password: string,
  file: File,
): Promise<string> {
  const res = await fetch('/api/upload-home-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      filename: file.name,
      contentType: file.type || 'image/jpeg',
      data: await fileToBase64(file),
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir imagen');
  return data.url as string;
}
