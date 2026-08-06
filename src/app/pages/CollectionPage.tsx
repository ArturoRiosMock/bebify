import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/app/components/ProductCard';
import { AdBanner, getInlineAdSlots } from '@/app/components/AdBanner';
import { Breadcrumbs } from '@/app/components/Breadcrumbs';
import { PaginationControls } from '@/app/components/PaginationControls';
import { useShopifyProducts } from '@/shopify/hooks/useShopifyProducts';
import { useShopifyCollections } from '@/shopify/hooks/useShopifyCollections';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { CategorySidebar } from '@/app/components/CategorySidebar';
import {
  getCollectionDisplayTitle,
  resolveShopifyCollectionHandle,
} from '@/shopify/collection-handles';
import { findCatalogTagLabel } from '@/config/category-catalog';

type GridItem =
  | { kind: 'product'; product: ReturnType<typeof useShopifyProducts>['products'][number] }
  | { kind: 'ad'; slotId: string };

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

const PRODUCTS_PER_PAGE = 16;

export const CollectionPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { products, loading, error } = useShopifyProducts(handle);
  const { collections } = useShopifyCollections();

  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [vendorFilter, setVendorFilter] = useState('');
  const [discountOnly, setDiscountOnly] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const productsTopRef = useRef<HTMLDivElement | null>(null);
  const activeTag = searchParams.get('tag');

  useEffect(() => {
    setSortBy('default');
    setVendorFilter('');
    setDiscountOnly(false);
  }, [handle, activeTag]);

  const shopifyHandle = handle ? resolveShopifyCollectionHandle(handle) : undefined;
  const currentCollection = collections.find((c) => c.handle === shopifyHandle);
  const baseCollectionTitle = !handle
    ? 'Todos los productos'
    : getCollectionDisplayTitle(handle)
      || currentCollection?.title
      || handle.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      || 'Colección';
  const tagLabel = handle && activeTag ? findCatalogTagLabel(handle, activeTag) : undefined;
  const collectionTitle = tagLabel ?? baseCollectionTitle;

  const canonicalPath = handle
    ? activeTag
      ? `/categorias/${handle}?tag=${encodeURIComponent(activeTag)}`
      : `/categorias/${handle}`
    : '/productos';
  const collectionDescription = !handle
    ? 'Todos los productos disponibles en Mr. Brown: tequila, whisky, mezcal, vinos, cervezas y más, con envío rápido en CDMX.'
    : activeTag
      ? `Compra ${collectionTitle.toLowerCase()} en Mr. Brown. Filtra por marca, precio y descuentos. Envío rápido en CDMX y zona metropolitana.`
      : `Compra ${baseCollectionTitle.toLowerCase()} premium en Mr. Brown. Filtra por marca, precio y descuentos. Envío rápido en CDMX y zona metropolitana.`;

  useDocumentMeta({
    title: collectionTitle,
    description: collectionDescription,
    canonicalPath,
    imageAlt: handle ? `${collectionTitle} — Mr. Brown` : undefined,
  });

  const inlineAds = useMemo(() => getInlineAdSlots('collection'), []);

  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const v = p.vendor?.trim();
      if (v) set.add(v);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (activeTag && !p.tags?.includes(activeTag)) return false;
      if (vendorFilter && (p.vendor || '') !== vendorFilter) return false;
      if (discountOnly) {
        const hasDiscount = p.originalPrice != null && p.originalPrice > p.price;
        if (!hasDiscount) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    else if (sortBy === 'name-desc') sorted.sort((a, b) => b.name.localeCompare(a.name, 'es'));
    sorted.sort((a, b) => Number(a.availableForSale === false) - Number(b.availableForSale === false));

    return sorted;
  }, [products, sortBy, vendorFilter, discountOnly, activeTag]);

  const filtersActive =
    sortBy !== 'default' || Boolean(vendorFilter) || discountOnly;

  const clearFilters = () => {
    setSortBy('default');
    setVendorFilter('');
    setDiscountOnly(false);
  };

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const safePageParam = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const currentPage = Math.min(Math.max(1, safePageParam), totalPages);

  // Limpa ?page da URL sempre que filtro/handle muda (volta para a primeira página)
  useEffect(() => {
    if (searchParams.get('page')) {
      const next = new URLSearchParams(searchParams);
      next.delete('page');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, activeTag, sortBy, vendorFilter, discountOnly]);

  // Se a URL tem ?page inválido (>totalPages, negativo, NaN) ou redundante (=1), normaliza
  useEffect(() => {
    if (loading) return;
    const raw = searchParams.get('page');
    if (!raw) return;
    if (currentPage !== safePageParam || currentPage === 1) {
      const next = new URLSearchParams(searchParams);
      if (currentPage <= 1) {
        next.delete('page');
      } else {
        next.set('page', String(currentPage));
      }
      setSearchParams(next, { replace: true });
    }
  }, [loading, currentPage, safePageParam, searchParams, setSearchParams]);

  // Scroll suave ao topo da lista quando muda de página
  useEffect(() => {
    if (loading) return;
    if (!searchParams.get('page')) return;
    const el = productsTopRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const gridItems = useMemo<GridItem[]>(() => {
    const items: GridItem[] = [];
    let adIndex = 0;
    let productIndex = 0;
    let position = 0;

    while (productIndex < paginatedProducts.length || adIndex < inlineAds.length) {
      if (adIndex < inlineAds.length && position === inlineAds[adIndex].position - 1) {
        items.push({ kind: 'ad', slotId: inlineAds[adIndex].slotId });
        adIndex++;
        position++;
        continue;
      }

      if (productIndex < paginatedProducts.length) {
        items.push({ kind: 'product', product: paginatedProducts[productIndex] });
        productIndex++;
        position++;
      } else {
        break;
      }
    }

    return items;
  }, [paginatedProducts, inlineAds]);

  const buildPageHref = (page: number) => {
    const next = new URLSearchParams(searchParams);
    if (page <= 1) {
      next.delete('page');
    } else {
      next.set('page', String(page));
    }
    const qs = next.toString();
    return qs ? `${canonicalPath}?${qs}` : canonicalPath;
  };

  return (
    <div className="min-h-[60vh]">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Inicio', to: '/' },
              ...(handle ? [{ label: 'Categorías', to: '/productos' }] : []),
              ...(handle && activeTag
                ? [
                    { label: baseCollectionTitle, to: `/categorias/${handle}` },
                    { label: collectionTitle, to: canonicalPath },
                  ]
                : [{ label: collectionTitle, to: canonicalPath }]),
            ]}
          />
        </div>
      </div>

      <AdBanner
        slotId="collection-header-below"
        variant="leaderboard"
        containerClassName="container mx-auto px-4 pt-4 pb-0"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <aside className="hidden lg:block">
            <CategorySidebar collections={collections} activeHandle={handle} activeTag={activeTag} />
          </aside>

          <div ref={productsTopRef}>

            {!loading && products.length > 0 && (
              <div
                className="mb-6 rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5"
                role="search"
                aria-label="Filtros de productos"
              >
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <SlidersHorizontal className="w-4 h-4 text-[#0c3c1f] shrink-0" aria-hidden />
                  <span className="text-sm font-semibold text-[#0c3c1f]">Filtros</span>
                  {filtersActive && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="ml-auto text-xs sm:text-sm text-[#0c3c1f] underline underline-offset-2 hover:no-underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-[#717182]">Ordenar</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#212121] focus:border-[#0c3c1f] focus:outline-none focus:ring-1 focus:ring-[#0c3c1f]"
                    >
                      <option value="default">Destacados</option>
                      <option value="price-asc">Precio: menor a mayor</option>
                      <option value="price-desc">Precio: mayor a menor</option>
                      <option value="name-asc">Nombre (A–Z)</option>
                      <option value="name-desc">Nombre (Z–A)</option>
                    </select>
                  </label>

                  {vendorOptions.length > 0 && (
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-[#717182]">Marca</span>
                      <select
                        value={vendorFilter}
                        onChange={(e) => setVendorFilter(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#212121] focus:border-[#0c3c1f] focus:outline-none focus:ring-1 focus:ring-[#0c3c1f]"
                      >
                        <option value="">Todas</option>
                        {vendorOptions.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={discountOnly}
                      onChange={(e) => setDiscountOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#0c3c1f] focus:ring-[#0c3c1f]"
                    />
                    <span className="text-sm text-[#212121]">Solo productos con descuento</span>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-60 sm:h-80 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#717182] text-lg mb-4">
                  {handle
                    ? 'No se encontraron productos en esta colección.'
                    : 'No se encontraron productos.'}
                </p>
                {handle ? (
                  <Link
                    to="/productos"
                    className="inline-block bg-[#0c3c1f] text-white px-6 py-3 rounded-lg hover:bg-[#0a3019] transition-colors font-medium"
                  >
                    Ver todos los productos
                  </Link>
                ) : (
                  <Link
                    to="/"
                    className="inline-block bg-[#0c3c1f] text-white px-6 py-3 rounded-lg hover:bg-[#0a3019] transition-colors font-medium"
                  >
                    Ir al inicio
                  </Link>
                )}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                <p className="text-[#717182] text-lg mb-4">Ningún producto coincide con los filtros.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-block bg-[#0c3c1f] text-white px-6 py-3 rounded-lg hover:bg-[#0a3019] transition-colors font-medium"
                >
                  Quitar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                  {gridItems.map((item, i) =>
                    item.kind === 'product' ? (
                      <ProductCard
                        key={`p-${item.product.id}`}
                        product={item.product}
                        onClick={() => navigate(`/producto/${item.product.handle || item.product.id}`)}
                      />
                    ) : (
                      <AdBanner key={`ad-${item.slotId}-${i}`} slotId={item.slotId} variant="inline-card" />
                    )
                  )}
                </div>

                {totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    buildHref={buildPageHref}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
