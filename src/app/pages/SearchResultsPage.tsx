import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/app/components/ProductCard';
import { AdBanner, getInlineAdSlots } from '@/app/components/AdBanner';
import { Breadcrumbs } from '@/app/components/Breadcrumbs';
import { useShopifySearch } from '@/shopify/hooks/useShopifyProducts';
import { useShopifyCollections } from '@/shopify/hooks/useShopifyCollections';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { CategorySidebar } from '@/app/components/CategorySidebar';
import type { Product } from '@/shopify/types';

type GridItem =
  | { kind: 'product'; product: Product }
  | { kind: 'ad'; slotId: string };

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: SortOption[] = ['default', 'price-asc', 'price-desc', 'name-asc', 'name-desc'];

const isSortOption = (value: string | null): value is SortOption =>
  value !== null && (SORT_OPTIONS as string[]).includes(value);

export const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawQuery = searchParams.get('q') ?? '';
  const sortParam = searchParams.get('sort_by');
  const sortBy: SortOption = isSortOption(sortParam) ? sortParam : 'default';

  const [inputValue, setInputValue] = useState(rawQuery);
  const [vendorFilter, setVendorFilter] = useState('');
  const [discountOnly, setDiscountOnly] = useState(false);

  const trimmedQuery = rawQuery.trim();
  const { results, loading, error } = useShopifySearch(trimmedQuery, 100);
  const { collections } = useShopifyCollections();

  useEffect(() => {
    setInputValue(rawQuery);
  }, [rawQuery]);

  useEffect(() => {
    setVendorFilter('');
    setDiscountOnly(false);
  }, [trimmedQuery]);

  const pageTitle = trimmedQuery
    ? `Resultados para «${trimmedQuery}»`
    : 'Buscar productos';
  const canonicalPath = trimmedQuery
    ? `/buscar?q=${encodeURIComponent(trimmedQuery)}`
    : '/buscar';

  useDocumentMeta({
    title: pageTitle,
    description: trimmedQuery
      ? `Resultados de búsqueda para "${trimmedQuery}" en Mr. Brown. Encuentra tequila, whisky, mezcal, vinos y más.`
      : 'Busca tequila, whisky, mezcal, vinos, cervezas y todas las bebidas premium de Mr. Brown.',
    canonicalPath,
  });

  const inlineAds = useMemo(() => getInlineAdSlots('collection'), []);

  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of results) {
      const v = p.vendor?.trim();
      if (v) set.add(v);
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [results]);

  const filteredResults = useMemo(() => {
    const list = results.filter((p) => {
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

    return sorted;
  }, [results, sortBy, vendorFilter, discountOnly]);

  const filtersActive = sortBy !== 'default' || Boolean(vendorFilter) || discountOnly;

  const clearFilters = () => {
    setVendorFilter('');
    setDiscountOnly(false);
    const next = new URLSearchParams(searchParams);
    next.delete('sort_by');
    setSearchParams(next, { replace: true });
  };

  const handleSortChange = (value: SortOption) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'default') next.delete('sort_by');
    else next.set('sort_by', value);
    setSearchParams(next, { replace: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next);
  };

  const gridItems = useMemo<GridItem[]>(() => {
    const items: GridItem[] = [];
    let adIndex = 0;
    let productIndex = 0;
    let position = 0;

    while (productIndex < filteredResults.length || adIndex < inlineAds.length) {
      if (adIndex < inlineAds.length && position === inlineAds[adIndex].position - 1) {
        items.push({ kind: 'ad', slotId: inlineAds[adIndex].slotId });
        adIndex++;
        position++;
        continue;
      }

      if (productIndex < filteredResults.length) {
        items.push({ kind: 'product', product: filteredResults[productIndex] });
        productIndex++;
        position++;
      } else {
        break;
      }
    }

    return items;
  }, [filteredResults, inlineAds]);

  return (
    <div className="min-h-[60vh]">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Inicio', to: '/' },
              { label: 'Búsqueda', to: '/buscar' },
              ...(trimmedQuery ? [{ label: `«${trimmedQuery}»`, to: canonicalPath }] : []),
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
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0c3c1f]">
            {loading && trimmedQuery
              ? `Buscando «${trimmedQuery}»…`
              : trimmedQuery
                ? `Resultados para «${trimmedQuery}»`
                : 'Buscar productos'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8" role="search">
          <div className="relative">
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="w-full border-b-2 border-gray-300 focus:border-[#0c3c1f] px-1 py-3 pr-20 outline-none text-[#212121] text-lg bg-transparent transition-colors"
              aria-label="Buscar productos"
              autoFocus={!trimmedQuery}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {inputValue && (
                <button
                  type="button"
                  onClick={() => setInputValue('')}
                  className="p-1.5 text-gray-400 hover:text-[#212121] rounded"
                  aria-label="Limpiar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit"
                className="p-1.5 text-[#0c3c1f] hover:text-[#0a3019]"
                aria-label="Buscar"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <aside className="hidden lg:block">
            <CategorySidebar collections={collections} />
          </aside>

          <div>
            {trimmedQuery && results.length > 0 && (
              <div
                className="mb-6 rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5"
                role="search"
                aria-label="Filtros de resultados"
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
                      onChange={(e) => handleSortChange(e.target.value as SortOption)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#212121] focus:border-[#0c3c1f] focus:outline-none focus:ring-1 focus:ring-[#0c3c1f]"
                    >
                      <option value="default">Relevancia</option>
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
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
            )}

            {!trimmedQuery ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden />
                <p className="text-[#717182] text-lg mb-2">Escribe un término para buscar</p>
                <p className="text-[#717182] text-sm">Mínimo 2 caracteres</p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-60 sm:h-80 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#717182] text-lg mb-4">
                  No se encontraron resultados para «{trimmedQuery}».
                </p>
                <p className="text-[#717182] text-sm mb-6">Prueba con otras palabras o explora las categorías.</p>
                <Link
                  to="/productos"
                  className="inline-block bg-[#0c3c1f] text-white px-6 py-3 rounded-lg hover:bg-[#0a3019] transition-colors font-medium"
                >
                  Ver todos los productos
                </Link>
              </div>
            ) : filteredResults.length === 0 ? (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
