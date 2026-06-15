import type { Product } from '@/shopify/types';
import { sortProductsInStockFirst } from '@/app/utils/productStock';

export type CollectionSort = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

export interface CollectionFilterState {
  sort: CollectionSort;
  selectedVendor: string;
  discountedOnly: boolean;
}

export function defaultCollectionFilterState(): CollectionFilterState {
  return {
    sort: 'default',
    selectedVendor: '',
    discountedOnly: false,
  };
}

export function hasActiveFilters(state: CollectionFilterState): boolean {
  return (
    state.selectedVendor !== '' ||
    state.discountedOnly ||
    state.sort !== 'default'
  );
}

function vendorLabel(p: Product): string {
  const v = p.vendor?.trim();
  return v || 'Sin marca';
}

function hasDiscount(p: Product): boolean {
  return p.originalPrice != null && p.originalPrice > p.price;
}

export function filterAndSortProducts(products: Product[], state: CollectionFilterState): Product[] {
  let list = [...products];

  if (state.selectedVendor) {
    list = list.filter((p) => vendorLabel(p) === state.selectedVendor);
  }

  if (state.discountedOnly) {
    list = list.filter(hasDiscount);
  }

  switch (state.sort) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
      break;
    default:
      break;
  }

  return sortProductsInStockFirst(list);
}

export function uniqueVendorLabels(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    set.add(vendorLabel(p));
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}
