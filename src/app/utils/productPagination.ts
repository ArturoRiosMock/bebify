import { useEffect, useMemo, useState } from 'react';

export const PRODUCTS_PER_PAGE = 24;

export function getVisiblePages(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}

export function useProductPagination<T>(
  items: T[],
  options?: { hasMore?: boolean },
) {
  const [currentPage, setCurrentPage] = useState(1);
  const hasMore = options?.hasMore ?? false;

  const loadedPages = Math.max(1, Math.ceil(items.length / PRODUCTS_PER_PAGE));
  const totalPages = hasMore ? loadedPages + 1 : loadedPages;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return items.slice(start, start + PRODUCTS_PER_PAGE);
  }, [items, currentPage]);

  const visiblePages = useMemo(
    () => getVisiblePages(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    visiblePages,
    handlePageChange,
    setCurrentPage,
  };
}
