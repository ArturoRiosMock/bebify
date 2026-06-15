/**
 * Configuración centralizada del menú de navegación.
 * Los `handle` de cada ítem deben coincidir exactamente con los handles
 * de colecciones en Shopify (mr-brown-mayoreo.myshopify.com).
 *
 * Handles especiales:
 *   - "Todos"        → redirige a /productos (todos los productos)
 *   - parentHandle   → colección virtual (merge de sus subcategorías en collectionRoutes.ts)
 *   - "espumosos"    → colección virtual (merge de vino-blanco-espumoso, vino-rosado-espumoso, vino-tinto-espumoso)
 *   - "jerez"        → carga por tag "Jerez" (no hay colección en Shopify)
 */

export interface MenuLink {
  type: 'link';
  label: string;
  handle: string;
}

export interface MenuAccordion {
  type: 'accordion';
  label: string;
  icon: 'destilados' | 'vinos' | 'cervezas' | 'refrescos' | 'aguas' | 'otras-bebidas';
  parentHandle: string;
  children: { label: string; handle: string; image: string }[];
}

export type MenuItem = MenuLink | MenuAccordion;

/** Ruta interna para un handle del menú (colección o catálogo completo). */
export function getCategoryHref(handle: string): string {
  if (handle === 'Todos') return '/productos';
  return `/categorias/${handle}`;
}

export const MENU_ITEMS: MenuItem[] = [
  { type: 'link', label: 'Todos los productos', handle: 'Todos' },
  {
    type: 'accordion',
    label: 'Destilados',
    icon: 'destilados',
    parentHandle: 'destilados',
    children: [
      { label: 'Tequila', handle: 'tequila', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop' },
      { label: 'Whisky', handle: 'whisky', image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=300&fit=crop' },
      { label: 'Ron', handle: 'ron', image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400&h=300&fit=crop' },
      { label: 'Brandy', handle: 'brandy', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=300&fit=crop' },
      { label: 'Vodka', handle: 'vodka', image: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&h=300&fit=crop' },
      { label: 'Cognac', handle: 'cognac', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
      { label: 'Mezcal', handle: 'mezcal', image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop' },
      { label: 'Ginebra', handle: 'ginebra', image: 'https://images.unsplash.com/photo-1559628233-100c798642d6?w=400&h=300&fit=crop' },
      { label: 'Jerez', handle: 'jerez', image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop' },
      { label: 'Aperitivo', handle: 'aperitivo', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop' },
      { label: 'Destilados Sin Alcohol', handle: 'destilados-sin-alcohol', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop' },
    ],
  },
  {
    type: 'accordion',
    label: 'Vinos',
    icon: 'vinos',
    parentHandle: 'vinos',
    children: [
      { label: 'Vino Tinto', handle: 'vino-tinto', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop' },
      { label: 'Vino Blanco', handle: 'vino-blanco-1', image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop' },
      { label: 'Vino Rosado', handle: 'vino-rosado', image: 'https://images.unsplash.com/photo-1560148218-1a83060f7b32?w=400&h=300&fit=crop' },
      { label: 'Espumosos', handle: 'espumosos', image: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=300&fit=crop' },
      { label: 'Champagne', handle: 'champagne', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop' },
    ],
  },
  {
    type: 'accordion',
    label: 'Cervezas',
    icon: 'cervezas',
    parentHandle: 'cerveza',
    children: [
      { label: 'Cervezas Artesanales', handle: 'cerveza-artesanal', image: 'https://images.unsplash.com/photo-1571645163064-77faa9676a46?w=400&h=300&fit=crop' },
      { label: 'Cervezas Importadas', handle: 'cerveza-importada', image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop' },
      { label: 'Cervezas Nacionales', handle: 'cerveza-nacional', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop' },
    ],
  },
  {
    type: 'accordion',
    label: 'Refrescos',
    icon: 'refrescos',
    parentHandle: 'refrescos',
    children: [
      { label: 'Canada Dry', handle: 'canada-dry', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop' },
      { label: 'Coca-Cola', handle: 'coca-cola', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop' },
      { label: 'Fresca', handle: 'fresca', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=300&fit=crop' },
      { label: 'Sidral Mundet', handle: 'sidral-mundet', image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=300&fit=crop' },
      { label: 'Sprite', handle: 'sprite', image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&h=300&fit=crop' },
      { label: 'Otros Refrescos', handle: 'otros-refrescos', image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop' },
    ],
  },
  {
    type: 'accordion',
    label: 'Aguas',
    icon: 'aguas',
    parentHandle: 'aguas',
    children: [
      { label: 'Agua Saborizada', handle: 'agua-de-sabor', image: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&h=300&fit=crop' },
      { label: 'Agua Mineral', handle: 'agua-mineral', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop' },
      { label: 'Agua Natural', handle: 'agua-natural', image: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400&h=300&fit=crop' },
      { label: 'Agua Tónica', handle: 'agua-tonica', image: 'https://images.unsplash.com/photo-1502920514313-52581002a659?w=400&h=300&fit=crop' },
    ],
  },
  {
    type: 'accordion',
    label: 'Otras Bebidas',
    icon: 'otras-bebidas',
    parentHandle: 'otros',
    children: [
      { label: 'Bebidas Energizantes', handle: 'bebida-energeticas', image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&h=300&fit=crop' },
      { label: 'Jarabes', handle: 'jarabes', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop' },
      { label: 'Jugos', handle: 'jugos', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop' },
      { label: 'Leches', handle: 'leche', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop' },
    ],
  },
];

export const STATIC_LINKS = [
  { label: 'Blog', href: '/blog' },
  { label: 'Regístrate aquí', href: '/registro' },
];
