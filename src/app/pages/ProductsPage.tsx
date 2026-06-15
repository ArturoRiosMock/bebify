import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '@/app/components/ProductCard';
import { AdBanner } from '@/app/components/AdBanner';
import { CollectionProductFilters } from '@/app/components/CollectionProductFilters';
import { ProductGridPagination } from '@/app/components/ProductGridPagination';
import {
  defaultCollectionFilterState,
  filterAndSortProducts,
  hasActiveFilters,
} from '@/app/utils/collectionFilters';
import { PRODUCTS_PER_PAGE, useProductPagination } from '@/app/utils/productPagination';
import { useShopifyProductsCatalog } from '@/shopify/hooks/useShopifyProductsCatalog';
import { CategorySidebar } from '@/app/components/CategorySidebar';

/**
 * Página "Todos los productos": catálogo con carga incremental desde Shopify.
 */
export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    loading,
    loadingMore,
    error,
    hasNextPage,
    isFullyLoaded,
    ensureLoadedForPage,
    loadAll,
  } = useShopifyProductsCatalog();

  const [filters, setFilters] = useState(defaultCollectionFilterState);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    setFilters(defaultCollectionFilterState());
  }, []);

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, filters),
    [products, filters],
  );

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedProducts,
    visiblePages,
    handlePageChange,
    setCurrentPage,
  } = useProductPagination(filteredProducts, { hasMore: hasNextPage && !hasActiveFilters(filters) });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, setCurrentPage]);

  useEffect(() => {
    if (hasActiveFilters(filters) && hasNextPage && !isFullyLoaded) {
      void loadAll();
    }
  }, [filters, hasNextPage, isFullyLoaded, loadAll]);

  const handlePageChangeWithFetch = useCallback(
    async (page: number) => {
      if (page === currentPage) {
        return;
      }

      setPageLoading(true);
      try {
        await ensureLoadedForPage(page, true);
        handlePageChange(page);
      } finally {
        setPageLoading(false);
      }
    },
    [currentPage, ensureLoadedForPage, handlePageChange],
  );

  const productCountLabel = useMemo(() => {
    if (loading) {
      return null;
    }

    if (hasActiveFilters(filters)) {
      if (!isFullyLoaded && hasNextPage) {
        return `${filteredProducts.length} productos (filtrando catálogo cargado…)`;
      }

      return hasActiveFilters(filters) && products.length > 0
        ? `${filteredProducts.length} de ${products.length} productos`
        : `${filteredProducts.length} productos encontrados`;
    }

    if (isFullyLoaded) {
      return `${products.length} productos encontrados`;
    }

    return `${products.length}+ productos · cargando catálogo…`;
  }, [loading, filters, filteredProducts.length, products.length, isFullyLoaded, hasNextPage]);

  const showGridLoading = loading || pageLoading;

  return (
    <div className="min-h-[60vh]">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#717182]">
            <Link to="/" className="hover:text-[#0055a2] transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#0055a2] font-medium">Todos los productos</span>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-[#0055a2] mb-2">Todos los productos</h1>
          <p className="text-[#717182]">
            Explora nuestro catálogo completo de bebidas. Filtra por categoría, marca, precio o descuentos para encontrar lo que buscas.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4 pb-0">
        <AdBanner slotId="collection-header-below" variant="leaderboard" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-6">
              <div>
                <h3 className="text-[#0055a2] font-bold mb-3 text-sm uppercase tracking-wide">
                  Categorías
                </h3>
                <CategorySidebar />
              </div>

              <AdBanner slotId="collection-sidebar-skyscraper" variant="sidebar" />
            </div>
          </aside>

          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              {productCountLabel && (
                <p className="text-[#717182] text-sm">
                  {productCountLabel}
                  {filteredProducts.length > PRODUCTS_PER_PAGE && (
                    <span className="text-[#717182]">
                      {' '}
                      · Página {currentPage} de {totalPages}
                      {!isFullyLoaded && hasNextPage ? '+' : ''}
                    </span>
                  )}
                </p>
              )}
              {loadingMore && !loading && (
                <p className="text-xs text-[#717182]">Cargando más productos…</p>
              )}
            </div>

            {!loading && products.length > 0 && (
              <CollectionProductFilters
                products={products}
                value={filters}
                onChange={setFilters}
                disabled={loading || loadingMore}
              />
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
            )}

            {showGridLoading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-60 sm:h-80 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#717182] text-lg mb-4">No hay productos disponibles.</p>
                <Link
                  to="/"
                  className="inline-block bg-[#0055a2] text-white px-6 py-3 rounded-lg hover:bg-[#003d7a] transition-colors font-medium"
                >
                  Volver al inicio
                </Link>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-gray-200 bg-gray-50 px-4">
                <p className="text-[#717182] text-lg mb-4">
                  Ningún producto coincide con los filtros seleccionados.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(defaultCollectionFilterState())}
                  className="inline-block bg-[#0055a2] text-white px-6 py-3 rounded-lg hover:bg-[#003d7a] transition-colors font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={`p-${product.id}`}
                      product={product}
                      onClick={() =>
                        navigate(`/producto/${product.handle || product.id}`)
                      }
                    />
                  ))}
                </div>

                <ProductGridPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  visiblePages={visiblePages}
                  onPageChange={handlePageChangeWithFetch}
                  disabled={pageLoading || loadingMore}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
