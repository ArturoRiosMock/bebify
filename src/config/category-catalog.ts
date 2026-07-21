import type { CollectionItem } from '@/shopify/hooks/useShopifyCollections';
import {
  getCollectionDisplayTitle,
  resolveShopifyCollectionHandle,
  toCanonicalCollectionHandle,
} from '@/shopify/collection-handles';

export type CatalogEntry =
  | { type: 'collection'; label: string; handle: string }
  | { type: 'tag'; label: string; tag: string; collectionHandle: string }
  | { type: 'heading'; label: string }
  | { type: 'route'; label: string; path: string };

/** @deprecated Alias para compatibilidad con componentes existentes */
export type NavDropdownEntry = Exclude<CatalogEntry, { type: 'heading' }>;

export type ResolvedDesktopNavItem =
  | {
      kind: 'link';
      id: string;
      title: string;
      entry: NavDropdownEntry;
    }
  | {
      kind: 'dropdown';
      id: string;
      title: string;
      entries: CatalogEntry[];
      featuredImage: string | null;
      featuredTitle: string | null;
      viewAllLabel?: string;
      viewAllHandle: string | null;
    };

export type CategoryGroupConfig =
  | {
      id: string;
      title: string;
      mode: 'link';
      entry: CatalogEntry;
    }
  | {
      id: string;
      title: string;
      mode: 'dropdown';
      children: CatalogEntry[];
      featuredHandle?: string;
      viewAllLabel?: string;
      viewAllHandle?: string;
    };

export const HIDDEN_SIDEBAR_HANDLES = new Set([
  'ofertas-relampago',
  'aguas-1',
  'cervezas-1',
  'refrescos-1',
  'otras-bebidas-1',
  'vinos-1',
  'destilados',
]);

export const CATEGORY_GROUPS: CategoryGroupConfig[] = [
  {
    id: 'destilados',
    title: 'Destilados',
    mode: 'dropdown',
    featuredHandle: 'tequila',
    viewAllLabel: 'Ver todos los destilados',
    viewAllHandle: 'destilados',
    children: [
      { type: 'heading', label: 'Destilados mexicanos' },
      { type: 'collection', label: 'Tequila', handle: 'tequila' },
      { type: 'collection', label: 'Mezcal', handle: 'mezcal' },
      { type: 'collection', label: 'Rompope', handle: 'rompope' },
      { type: 'heading', label: 'Whisky, ron y brandy' },
      { type: 'collection', label: 'Whisky', handle: 'whisky' },
      { type: 'collection', label: 'Ron', handle: 'ron' },
      { type: 'collection', label: 'Brandy', handle: 'brandy' },
      { type: 'collection', label: 'Cognac', handle: 'cognac' },
      { type: 'heading', label: 'Vodka y ginebra' },
      { type: 'collection', label: 'Vodka', handle: 'vodka' },
      { type: 'collection', label: 'Ginebra', handle: 'ginebra' },
      { type: 'heading', label: 'Licores y aperitivos' },
      { type: 'collection', label: 'Licor', handle: 'licor' },
      { type: 'collection', label: 'Cremas', handle: 'crema' },
      { type: 'collection', label: 'Aperitivo', handle: 'aperitivo' },
      { type: 'heading', label: 'Especialidades' },
      { type: 'collection', label: 'Jerez', handle: 'jerez' },
      { type: 'collection', label: 'Anís', handle: 'anis-1' },
      { type: 'collection', label: 'Ready To Drink', handle: 'ready-to-drink' },
      { type: 'collection', label: 'Sin alcohol', handle: 'otros-destilados' },
    ],
  },
  {
    id: 'vinos',
    title: 'Vinos',
    mode: 'dropdown',
    featuredHandle: 'vino-tinto',
    viewAllLabel: 'Ver todos los vinos',
    viewAllHandle: 'vinos-1',
    children: [
      { type: 'heading', label: 'Tintos' },
      { type: 'collection', label: 'Vino tinto', handle: 'vino-tinto' },
      { type: 'collection', label: 'Vino tinto espumoso', handle: 'vino-tinto-espumoso' },
      { type: 'heading', label: 'Blancos' },
      { type: 'collection', label: 'Vino blanco', handle: 'vino-blanco' },
      { type: 'collection', label: 'Vino blanco espumoso', handle: 'vino-blanco-espumoso' },
      { type: 'heading', label: 'Rosados' },
      { type: 'collection', label: 'Vino rosado', handle: 'vino-rosado' },
      { type: 'collection', label: 'Vino rosado espumoso', handle: 'vino-rosado-espumoso' },
      { type: 'heading', label: 'Espumosos y especiales' },
      { type: 'collection', label: 'Champagne', handle: 'champagne' },
      { type: 'collection', label: 'Sake', handle: 'sake' },
      { type: 'collection', label: 'Oporto', handle: 'oporto' },
    ],
  },
  {
    id: 'cervezas',
    title: 'Cervezas',
    mode: 'dropdown',
    featuredHandle: 'cervezas',
    viewAllLabel: 'Ver todas las cervezas',
    viewAllHandle: 'cervezas',
    children: [
      { type: 'heading', label: 'Por tipo' },
      {
        type: 'tag',
        label: 'Cerveza nacional',
        tag: 'Cerveza Nacional',
        collectionHandle: 'cervezas',
      },
      {
        type: 'tag',
        label: 'Cerveza importada',
        tag: 'Cerveza Importada',
        collectionHandle: 'cervezas',
      },
      {
        type: 'tag',
        label: 'Cerveza artesanal',
        tag: 'Cerveza Artesanal',
        collectionHandle: 'cervezas',
      },
    ],
  },
  {
    id: 'aguas',
    title: 'Aguas',
    mode: 'dropdown',
    featuredHandle: 'aguas',
    viewAllLabel: 'Ver todas las aguas',
    viewAllHandle: 'aguas',
    children: [
      { type: 'heading', label: 'Por tipo' },
      { type: 'tag', label: 'Agua mineral', tag: 'Agua Mineral', collectionHandle: 'aguas' },
      { type: 'tag', label: 'Agua natural', tag: 'Agua Natural', collectionHandle: 'aguas' },
      { type: 'tag', label: 'Agua saborizada', tag: 'Agua Saborizada', collectionHandle: 'aguas' },
      { type: 'tag', label: 'Agua tónica', tag: 'Agua Tonica', collectionHandle: 'aguas' },
      { type: 'tag', label: 'Agua quina', tag: 'Agua Quina', collectionHandle: 'aguas' },
    ],
  },
  {
    id: 'refrescos',
    title: 'Refrescos',
    mode: 'dropdown',
    featuredHandle: 'refrescos',
    viewAllLabel: 'Ver todos los refrescos',
    viewAllHandle: 'refrescos',
    children: [
      { type: 'heading', label: 'Por marca' },
      { type: 'tag', label: 'Coca-Cola', tag: 'Coca-Cola', collectionHandle: 'refrescos' },
      { type: 'tag', label: 'Sprite', tag: 'Sprite', collectionHandle: 'refrescos' },
      { type: 'tag', label: 'Sidral Mundet', tag: 'Sidral Mundet', collectionHandle: 'refrescos' },
      { type: 'tag', label: 'Fresca', tag: 'Fresca', collectionHandle: 'refrescos' },
      { type: 'heading', label: 'Otros' },
      { type: 'tag', label: 'Otros refrescos', tag: 'Otros Refrescos', collectionHandle: 'refrescos' },
    ],
  },
  {
    id: 'otras-bebidas',
    title: 'Otras bebidas',
    mode: 'dropdown',
    featuredHandle: 'otras-bebidas',
    viewAllLabel: 'Ver todas',
    viewAllHandle: 'otras-bebidas',
    children: [
      { type: 'heading', label: 'Por tipo' },
      { type: 'tag', label: 'Jugos', tag: 'Jugos', collectionHandle: 'otras-bebidas' },
      { type: 'tag', label: 'Jarabes', tag: 'Jarabes', collectionHandle: 'otras-bebidas' },
      {
        type: 'tag',
        label: 'Bebidas energizantes',
        tag: 'Bebidas Energizantes',
        collectionHandle: 'otras-bebidas',
      },
      { type: 'tag', label: 'Complementos', tag: 'Complementos', collectionHandle: 'otras-bebidas' },
      { type: 'tag', label: 'LMP', tag: 'LMP', collectionHandle: 'otras-bebidas' },
    ],
  },
];

export const FEATURED_COLLECTIONS: CatalogEntry[] = [
  { type: 'collection', label: 'Promo Mundialista', handle: 'promo-mundialista' },
  { type: 'collection', label: 'Los Favoritos del Club', handle: 'lmv' },
  { type: 'collection', label: 'Más Vendidos', handle: 'hot-days' },
];

export const BRAND_COLLECTIONS: CatalogEntry[] = [
  { type: 'collection', label: 'Casa Bacardí', handle: 'casa-bacardi' },
  { type: 'collection', label: 'Flor de Luna', handle: 'flor-de-luna' },
  { type: 'collection', label: 'Casa del Agua', handle: 'casa-del-agua' },
  { type: 'collection', label: 'Félix Schorle', handle: 'felix-schorle' },
  { type: 'collection', label: 'La Madrileña', handle: 'la-madrilena' },
  { type: 'collection', label: 'Condesa', handle: 'condesa' },
];

export const PRODUCT_TAG_TO_COLLECTION: Record<string, string> = {
  'Vino Tinto': 'vino-tinto',
  'Vino Tinto Espumoso': 'vino-tinto-espumoso',
  'Vino Blanco': 'vino-blanco',
  'Vino Blanco Espumoso': 'vino-blanco-espumoso',
  'Vino Rosado': 'vino-rosado',
  'Vino Rosado Espumoso': 'vino-rosado-espumoso',
  Champagne: 'champagne',
  Tequila: 'tequila',
  Whisky: 'whisky',
  Ron: 'ron',
  Mezcal: 'mezcal',
  Vodka: 'vodka',
  Ginebra: 'ginebra',
  Brandy: 'brandy',
  Cognac: 'cognac',
  Crema: 'crema',
  Licor: 'licor',
  Rompope: 'rompope',
  Jerez: 'jerez',
  Anis: 'anis-1',
  Aperitivo: 'aperitivo',
  'Ready To Drink': 'ready-to-drink',
  'Destilados Sin Alcohol': 'otros-destilados',
  Sake: 'sake',
  Oporto: 'oporto',
  'Cerveza Nacional': 'cervezas',
  'Cerveza Importada': 'cervezas',
  'Cerveza Artesanal': 'cervezas',
  'Agua Mineral': 'aguas',
  'Agua Natural': 'aguas',
  'Agua Saborizada': 'aguas',
  'Agua Tonica': 'aguas',
  'Agua Quina': 'aguas',
  'Coca-Cola': 'refrescos',
  Sprite: 'refrescos',
  'Sidral Mundet': 'refrescos',
  Fresca: 'refrescos',
  'Otros Refrescos': 'refrescos',
  Jugos: 'otras-bebidas',
  Jarabes: 'otras-bebidas',
  'Bebidas Energizantes': 'otras-bebidas',
  Complementos: 'otras-bebidas',
  LMP: 'otras-bebidas',
};

export type SidebarItem =
  | { kind: 'heading'; label: string }
  | { kind: 'link'; label: string; href: string; active: boolean };

export type SidebarSection = {
  id: string;
  title: string;
  items: SidebarItem[];
};

function collectionExists(collections: CollectionItem[], handle: string): boolean {
  const shopifyHandle = resolveShopifyCollectionHandle(handle);
  return collections.some((c) => c.handle === shopifyHandle);
}

function labelForHandle(handle: string, fallback: string): string {
  return getCollectionDisplayTitle(handle) ?? fallback;
}

function isClickableEntry(entry: CatalogEntry): entry is Exclude<CatalogEntry, { type: 'heading' }> {
  return entry.type !== 'heading';
}

export function catalogEntryHref(entry: Exclude<CatalogEntry, { type: 'heading' }>): string {
  if (entry.type === 'route') return entry.path;
  if (entry.type === 'collection') {
    return `/categorias/${toCanonicalCollectionHandle(entry.handle)}`;
  }
  const base = toCanonicalCollectionHandle(entry.collectionHandle);
  return `/categorias/${base}?tag=${encodeURIComponent(entry.tag)}`;
}

function resolveEntry(entry: CatalogEntry, collections: CollectionItem[]): CatalogEntry | null {
  if (entry.type === 'heading') return entry;
  if (entry.type === 'route') return entry;
  if (entry.type === 'tag') {
    if (collectionExists(collections, entry.collectionHandle)) return entry;
    return null;
  }
  if (collectionExists(collections, entry.handle)) {
    return { ...entry, label: labelForHandle(entry.handle, entry.label) };
  }
  return null;
}

function clickableEntries(entries: CatalogEntry[]): Exclude<CatalogEntry, { type: 'heading' }>[] {
  return entries.filter(isClickableEntry);
}

function firstCollectionHandle(entries: CatalogEntry[]): string | null {
  for (const entry of entries) {
    if (entry.type === 'collection') return entry.handle;
    if (entry.type === 'tag') return entry.collectionHandle;
  }
  return null;
}

export function resolveDesktopNav(collections: CollectionItem[]): ResolvedDesktopNavItem[] {
  const out: ResolvedDesktopNavItem[] = [];

  for (const g of CATEGORY_GROUPS) {
    if (g.mode === 'link') {
      const resolved = resolveEntry(g.entry, collections);
      if (resolved && isClickableEntry(resolved)) {
        out.push({ kind: 'link', id: g.id, title: resolved.label, entry: resolved });
      }
      continue;
    }

    const entries = g.children.map((e) => resolveEntry(e, collections)).filter(Boolean) as CatalogEntry[];
    const clickables = clickableEntries(entries);
    if (clickables.length === 0) continue;

    if (clickables.length === 1 && entries.every((e) => e.type !== 'heading')) {
      out.push({ kind: 'link', id: g.id, title: g.title, entry: clickables[0] });
      continue;
    }

    const viewAllHandle =
      g.viewAllHandle && collectionExists(collections, g.viewAllHandle)
        ? g.viewAllHandle
        : g.featuredHandle && collectionExists(collections, g.featuredHandle)
          ? g.featuredHandle
          : firstCollectionHandle(entries);

    let featuredCol: CollectionItem | null = null;
    if (viewAllHandle) {
      const featuredShopifyHandle = resolveShopifyCollectionHandle(viewAllHandle);
      featuredCol = collections.find((c) => c.handle === featuredShopifyHandle) ?? null;
    }

    out.push({
      kind: 'dropdown',
      id: g.id,
      title: g.title,
      entries,
      featuredImage: featuredCol?.image ?? null,
      featuredTitle: featuredCol?.title ?? null,
      viewAllLabel: g.viewAllLabel,
      viewAllHandle,
    });
  }

  return out;
}

function isEntryActive(
  entry: Exclude<CatalogEntry, { type: 'heading' }>,
  activeHandle?: string,
  activeTag?: string | null,
): boolean {
  if (entry.type === 'collection') {
    return activeHandle === entry.handle && !activeTag;
  }
  if (entry.type === 'tag') {
    return activeHandle === entry.collectionHandle && activeTag === entry.tag;
  }
  return false;
}

function entriesToSidebarItems(
  entries: CatalogEntry[],
  collections: CollectionItem[],
  activeHandle?: string,
  activeTag?: string | null,
): SidebarItem[] {
  const items: SidebarItem[] = [];

  for (const entry of entries) {
    const resolved = resolveEntry(entry, collections);
    if (!resolved) continue;
    if (resolved.type === 'heading') {
      items.push({ kind: 'heading', label: resolved.label });
      continue;
    }
    items.push({
      kind: 'link',
      label: resolved.label,
      href: catalogEntryHref(resolved),
      active: isEntryActive(resolved, activeHandle, activeTag),
    });
  }

  return items;
}

export function resolveCategorySidebar(
  collections: CollectionItem[],
  activeHandle?: string,
  activeTag?: string | null,
): SidebarSection[] {
  const sections: SidebarSection[] = [];

  for (const g of CATEGORY_GROUPS) {
    if (g.mode === 'link') {
      const resolved = resolveEntry(g.entry, collections);
      if (!resolved || !isClickableEntry(resolved)) continue;
      sections.push({
        id: g.id,
        title: g.title,
        items: [
          {
            kind: 'link',
            label: resolved.label,
            href: catalogEntryHref(resolved),
            active: isEntryActive(resolved, activeHandle, activeTag),
          },
        ],
      });
      continue;
    }

    const items = entriesToSidebarItems(g.children, collections, activeHandle, activeTag);
    if (items.length === 0) continue;
    sections.push({ id: g.id, title: g.title, items });
  }

  const featuredItems = entriesToSidebarItems(FEATURED_COLLECTIONS, collections, activeHandle, activeTag);
  if (featuredItems.length > 0) {
    sections.push({ id: 'destacados', title: 'Destacados', items: featuredItems });
  }

  const brandItems = entriesToSidebarItems(BRAND_COLLECTIONS, collections, activeHandle, activeTag);
  if (brandItems.length > 0) {
    sections.push({ id: 'marcas', title: 'Marcas', items: brandItems });
  }

  return sections;
}

export function getCatalogCollectionHandles(): Set<string> {
  const handles = new Set<string>();

  for (const g of CATEGORY_GROUPS) {
    if (g.mode === 'link' && g.entry.type === 'collection') {
      handles.add(g.entry.handle);
    } else if (g.mode === 'dropdown') {
      for (const child of g.children) {
        if (child.type === 'collection') handles.add(child.handle);
        if (child.type === 'tag') handles.add(child.collectionHandle);
      }
      if (g.viewAllHandle) handles.add(g.viewAllHandle);
    }
  }

  for (const entry of [...FEATURED_COLLECTIONS, ...BRAND_COLLECTIONS]) {
    if (entry.type === 'collection') handles.add(entry.handle);
  }

  return handles;
}

export function findCatalogTagLabel(collectionHandle: string, tag: string): string | undefined {
  for (const g of CATEGORY_GROUPS) {
    if (g.mode !== 'dropdown') continue;
    for (const child of g.children) {
      if (
        child.type === 'tag' &&
        child.collectionHandle === collectionHandle &&
        child.tag === tag
      ) {
        return child.label;
      }
    }
  }
  return undefined;
}

export { toCanonicalCollectionHandle };
