import type { LucideIcon } from 'lucide-react';
import {
  Beer,
  Citrus,
  Coffee,
  FlaskConical,
  GlassWater,
  Grape,
  Martini,
  Sparkles,
  Wine,
} from 'lucide-react';

/** Icono por handle de colección Shopify (mega menú y móvil). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  tequila: Martini,
  whisky: GlassWater,
  ron: Martini,
  vodka: FlaskConical,
  ginebra: Martini,
  mezcal: FlaskConical,
  cognac: GlassWater,
  brandy: GlassWater,
  'cremas-y-licores': Wine,
  jerez: Wine,
  anis: FlaskConical,
  aperitivo: Wine,
  'otros-destilados': FlaskConical,
  'vino-tinto': Wine,
  'vino-tinto-espumoso': Sparkles,
  'vino-blanco': Wine,
  'vino-blanco-espumoso': Sparkles,
  'vino-rosado': Wine,
  'vino-rosado-espumoso': Sparkles,
  espumoso: Sparkles,
  champagne: Sparkles,
  sidra: Grape,
  sake: Wine,
  oporto: Wine,
  crema: Wine,
  licor: Wine,
  rompope: Wine,
  'anis-1': FlaskConical,
  'ready-to-drink': Martini,
  'vinos-1': Wine,
  destilados: Martini,
  'promo-mundialista': Sparkles,
  lmv: Sparkles,
  'hot-days': Sparkles,
  'casa-bacardi': Martini,
  'casa-del-agua': GlassWater,
  condesa: Martini,
  'felix-schorle': GlassWater,
  'flor-de-luna': Martini,
  'la-madrilena': Martini,
  cervezas: Beer,
  refrescos: Citrus,
  aguas: GlassWater,
  'otras-bebidas': Coffee,
} as const;

/** Icono por id de grupo del mega menú (móvil: summary). */
export const NAV_GROUP_ICONS: Record<string, LucideIcon> = {
  destilados: Martini,
  vinos: Wine,
  cervezas: Beer,
  aguas: GlassWater,
  refrescos: Citrus,
  'otras-bebidas': Coffee,
} as const;

export const DEFAULT_CATEGORY_ICON: LucideIcon = Martini;

export function getCategoryIcon(handle: string): LucideIcon {
  return CATEGORY_ICONS[handle] ?? DEFAULT_CATEGORY_ICON;
}

export function getNavGroupIcon(groupId: string): LucideIcon {
  return NAV_GROUP_ICONS[groupId] ?? DEFAULT_CATEGORY_ICON;
}
