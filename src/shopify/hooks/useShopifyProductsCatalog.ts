import { useState, useEffect, useRef, useCallback } from 'react';
import { getProductsPage } from '@/shopify/products';
import { isShopifyConfigured } from '@/shopify/config';
import type { Product } from '@/shopify/types';
import { PRODUCTS_PER_PAGE } from '@/app/utils/productPagination';

const INITIAL_FETCH_SIZE = PRODUCTS_PER_PAGE;
const BATCH_SIZE = 250;

interface FetchState {
  endCursor: string | null;
  hasNextPage: boolean;
  fetching: boolean;
}

/**
 * Catálogo incremental: carga la primera página al instante y pide más
 * lotes de Shopify solo cuando hace falta (cambio de página, filtros, prefetch).
 */
export const useShopifyProductsCatalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  const fetchState = useRef<FetchState>({
    endCursor: null,
    hasNextPage: true,
    fetching: false,
  });
  const productsLengthRef = useRef(0);

  useEffect(() => {
    productsLengthRef.current = products.length;
  }, [products.length]);

  const fetchBatch = useCallback(async (first: number): Promise<void> => {
    const state = fetchState.current;
    if (state.fetching || !state.hasNextPage) {
      return;
    }

    state.fetching = true;
    setLoadingMore(true);

    try {
      const page = await getProductsPage(first, state.endCursor);

      setProducts((prev) => {
        const seen = new Set(prev.map((product) => product.shopifyId ?? String(product.id)));
        const unique = page.products.filter(
          (product) => !seen.has(product.shopifyId ?? String(product.id)),
        );
        return unique.length > 0 ? [...prev, ...unique] : prev;
      });

      state.endCursor = page.endCursor;
      state.hasNextPage = page.hasNextPage;
      setHasNextPage(page.hasNextPage);

      if (!page.hasNextPage) {
        setIsFullyLoaded(true);
      }
    } catch (err) {
      console.error('Error fetching catalog batch:', err);
      setError('Error al cargar productos');
      state.hasNextPage = false;
      setHasNextPage(false);
    } finally {
      state.fetching = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      setError(null);
      fetchState.current = { endCursor: null, hasNextPage: true, fetching: false };

      if (!isShopifyConfigured()) {
        console.warn('Shopify no está configurado.');
        setProducts([]);
        setHasNextPage(false);
        setIsFullyLoaded(true);
        setLoading(false);
        return;
      }

      await fetchBatch(INITIAL_FETCH_SIZE);
      setLoading(false);

      if (fetchState.current.hasNextPage) {
        window.setTimeout(() => {
          void fetchBatch(BATCH_SIZE);
        }, 300);
      }
    };

    void loadInitial();
  }, [fetchBatch]);

  const ensureLoadedForPage = useCallback(
    async (page: number, prefetchNext = false) => {
      const targetCount = (prefetchNext ? page + 1 : page) * PRODUCTS_PER_PAGE;

      while (
        productsLengthRef.current < targetCount &&
        fetchState.current.hasNextPage
      ) {
        await fetchBatch(BATCH_SIZE);
      }
    },
    [fetchBatch],
  );

  const loadAll = useCallback(async () => {
    while (fetchState.current.hasNextPage) {
      await fetchBatch(BATCH_SIZE);
    }
  }, [fetchBatch]);

  return {
    products,
    loading,
    loadingMore,
    error,
    hasNextPage,
    isFullyLoaded,
    ensureLoadedForPage,
    loadAll,
  };
};
