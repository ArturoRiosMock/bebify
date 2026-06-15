import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/app/components/ui/pagination';

interface ProductGridPaginationProps {
  currentPage: number;
  totalPages: number;
  visiblePages: (number | 'ellipsis')[];
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const ProductGridPagination: React.FC<ProductGridPaginationProps> = ({
  currentPage,
  totalPages,
  visiblePages,
  onPageChange,
  disabled = false,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination className="mt-10">
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            href="#"
            size="default"
            aria-label="Página anterior"
            onClick={(event) => {
              event.preventDefault();
              if (!disabled && currentPage > 1) {
                onPageChange(currentPage - 1);
              }
            }}
            className={`gap-1 px-2.5 sm:pl-2.5 ${
              currentPage === 1 || disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'
            }`}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:block">Anterior</span>
          </PaginationLink>
        </PaginationItem>

        {visiblePages.map((page, index) =>
          page === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(event) => {
                  event.preventDefault();
                  if (!disabled) {
                    onPageChange(page);
                  }
                }}
                className={disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationLink
            href="#"
            size="default"
            aria-label="Página siguiente"
            onClick={(event) => {
              event.preventDefault();
              if (!disabled && currentPage < totalPages) {
                onPageChange(currentPage + 1);
              }
            }}
            className={`gap-1 px-2.5 sm:pr-2.5 ${
              currentPage === totalPages || disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'
            }`}
          >
            <span className="hidden sm:block">Siguiente</span>
            <ChevronRight className="size-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
