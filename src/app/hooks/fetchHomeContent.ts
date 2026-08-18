import type { HomeContent } from '@/types/homeContent';
import { mergeContent } from '@/app/hooks/homeContentMerge';

export async function fetchHomeContent(): Promise<HomeContent> {
  const res = await fetch('/api/home-content', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar el contenido');
  return mergeContent((await res.json()) as Partial<HomeContent>);
}
