import React from 'react';
import { Link } from 'react-router-dom';
import Slider, { Settings } from 'react-slick';
import { ProductCard } from '@/app/components/ProductCard';
import type { Product } from '@/app/context/CartContext';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface ProductsCarouselProps {
  title: string;
  products: Product[];
  onProductClick?: (product: Product) => void;
  className?: string;
  /** Si se pasa, muestra link "Ver todo" en el header */
  viewAllHref?: string;
  /** Texto de banderita en la esquina superior izquierda de cada card (ej: "NUEVO") */
  cornerBadge?: string;
  /** Color de la banderita */
  cornerBadgeColor?: string;
}

const SLIDER_SETTINGS: Settings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 4,
  slidesToScroll: 1,
  arrows: true,
  responsive: [
    { breakpoint: 1280, settings: { slidesToShow: 3, slidesToScroll: 1 } },
    { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 2 } },
    { breakpoint: 640, settings: { slidesToShow: 3, slidesToScroll: 3, arrows: false } },
  ],
};

export const ProductsCarousel: React.FC<ProductsCarouselProps> = ({
  title,
  products,
  onProductClick,
  className = '',
  viewAllHref,
  cornerBadge,
  cornerBadgeColor = '#FF6B35',
}) => {
  if (products.length === 0) return null;

  return (
    <section className={`container mx-auto px-3 sm:px-4 py-8 sm:py-10 max-w-[100vw] ${className}`}>
      <div className="flex items-end justify-between mb-4 sm:mb-6 gap-3 flex-wrap">
        <h2 className="text-[#212121]">{title}</h2>
        <div className="flex items-center gap-4 shrink-0">
          <p className="text-[#717182] text-sm">{products.length} productos</p>
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="text-sm font-semibold text-[#0055a2] hover:text-[#003d7a] transition-colors"
            >
              Ver todo
            </Link>
          )}
        </div>
      </div>

      <div className={`products-carousel ${cornerBadge ? 'products-carousel--with-badge' : ''}`}>
        <Slider {...SLIDER_SETTINGS}>
          {products.map((product) => (
            <div key={product.id} className="px-1 sm:px-3 py-2 relative">
              {cornerBadge && (
                <div className="corner-badge" style={{ ['--badge-color' as string]: cornerBadgeColor }}>
                  <span>{cornerBadge}</span>
                </div>
              )}
              <ProductCard
                product={product}
                onClick={onProductClick ? () => onProductClick(product) : undefined}
              />
            </div>
          ))}
        </Slider>
      </div>

      <style>{`
        @media (min-width: 641px) {
          .products-carousel {
            position: relative;
            padding: 0 48px;
          }
        }
        .products-carousel .slick-list { margin: 0 -8px; }
        .products-carousel .slick-dots { bottom: -32px; }
        .products-carousel .slick-dots li button:before { color: #0055a2; font-size: 8px; opacity: 0.4; }
        .products-carousel .slick-dots li.slick-active button:before { color: #0055a2; opacity: 1; }
        @media (min-width: 641px) {
          .products-carousel .slick-prev,
          .products-carousel .slick-next {
            width: 36px;
            height: 36px;
            z-index: 10;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .products-carousel .slick-prev { left: 0; }
          .products-carousel .slick-next { right: 0; }
          .products-carousel .slick-prev:before,
          .products-carousel .slick-next:before {
            color: #0055a2;
            font-size: 20px;
            line-height: 1;
            opacity: 1;
          }
          .products-carousel .slick-prev:hover,
          .products-carousel .slick-next:hover { background: #f0f7ff; }
          .products-carousel .slick-prev.slick-disabled,
          .products-carousel .slick-next.slick-disabled {
            opacity: 0.35;
            cursor: default;
          }
        }
        .corner-badge {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 46px;
          height: 46px;
          overflow: hidden;
          pointer-events: none;
          z-index: 5;
        }
        .corner-badge::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          border-style: solid;
          border-width: 46px 46px 0 0;
          border-color: var(--badge-color, #FF6B35) transparent transparent transparent;
        }
        .corner-badge span {
          position: absolute;
          top: 7px;
          left: -3px;
          width: 44px;
          text-align: center;
          transform: rotate(-45deg);
          color: #fff;
          font-weight: 700;
          font-size: 7px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        @media (min-width: 640px) {
          .corner-badge { width: 70px; height: 70px; top: 8px; left: 8px; }
          .corner-badge::before { border-width: 70px 70px 0 0; }
          .corner-badge span { top: 13px; left: 0; width: 66px; font-size: 10px; }
        }
        /* Cuando hay banderita esquinera, el badge de descuento se mueve a la esquina
           inferior izquierda del área de imagen para evitar solaparse con la banderita. */
        .products-carousel--with-badge [data-discount-badge] {
          top: auto;
          bottom: 8px;
          left: 8px;
        }
      `}</style>
    </section>
  );
};
