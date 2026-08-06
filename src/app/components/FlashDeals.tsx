import React, { useState, useEffect, useRef } from 'react';
import { Zap, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '@/app/context/CartContext';
import { useShopifyProducts } from '@/shopify/hooks/useShopifyProducts';
import type { Product } from '@/app/context/CartContext';

const FLASH_DEALS_COLLECTION = 'ofertas-relampago';

type DealProduct = Product;

function FlashDealCard({ deal }: { deal: DealProduct }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const hasDiscount = deal.originalPrice && deal.originalPrice > deal.price;
  const discountPercentage = hasDiscount
    ? Math.round(((deal.originalPrice! - deal.price) / deal.originalPrice!) * 100)
    : 0;

  const isSoldOut = deal.availableForSale === false;

  const handleAddToCart = () => {
    if (isSoldOut) return;
    addToCart(
      {
        id: deal.id,
        name: deal.name,
        price: deal.price,
        originalPrice: deal.originalPrice,
        category: deal.category,
        description: deal.description,
        image: deal.image,
        variantId: deal.variantId,
        shopifyId: deal.shopifyId,
        handle: deal.handle,
        cantidadLabel: deal.cantidadLabel,
        availableForSale: deal.availableForSale,
      },
      quantity
    );
    setQuantity(1);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg p-2 sm:p-4 relative"
    >
      {discountPercentage > 0 && (
        <div className="absolute top-1 left-1 z-10 bg-[rgb(255,107,53)] text-white rounded-full w-10 h-10 md:w-16 md:h-16 flex flex-col items-center justify-center shadow-lg">
          <span className="text-xs md:text-lg font-bold leading-none">{discountPercentage}%</span>
          <span className="text-[8px] md:text-xs uppercase leading-none">OFF</span>
        </div>
      )}

      <div className="relative mb-2 md:mb-4 mx-auto w-[85%]">
        <div className="relative w-full aspect-square flex items-center justify-center">
          <img
            src={deal.image}
            alt={deal.name}
            className="relative w-[55%] h-[55%] object-contain"
          />
          <svg
            className="absolute inset-0 w-full h-full z-20 pointer-events-none"
            viewBox="0 0 100 100"
          >
            <path
              d="M50 5 L95 50 L50 95 L5 50 Z"
              fill="none"
              stroke="#0c3c1f"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-[#212121] text-xs md:text-sm font-medium mb-1 md:mb-2 text-center line-clamp-2 min-h-[32px] md:min-h-[40px]">
        {deal.name}
      </h3>

      <div className="text-center mb-1.5 md:mb-3">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {hasDiscount && (
            <span className="text-[10px] md:text-sm text-[#717182] line-through">
              ${deal.originalPrice!.toFixed(2)}
            </span>
          )}
          <span className="text-sm md:text-2xl font-bold text-[#0c3c1f]">
            ${deal.price.toFixed(2)}
          </span>
        </div>
      </div>

      {deal.cantidadLabel && (
        <p className="text-[10px] md:text-xs text-[#717182] mb-1.5 md:mb-2 text-center leading-snug px-0.5">
          <span className="font-semibold text-[#212121]">Cantidad:</span>{' '}
          {deal.cantidadLabel}
        </p>
      )}

      {!isSoldOut && (
        <div className="flex items-center justify-center gap-1 md:gap-1.5 mb-1.5 md:mb-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-7 h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center border border-[#0c3c1f] text-[#0c3c1f] rounded hover:bg-[#0c3c1f] hover:text-white transition-colors"
            aria-label="Reducir cantidad"
          >
            <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-9 md:w-11 h-7 md:h-8 text-center border border-gray-300 rounded text-[#212121] text-xs md:text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Cantidad a agregar"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-7 h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center border border-[#0c3c1f] text-[#0c3c1f] rounded hover:bg-[#0c3c1f] hover:text-white transition-colors"
            aria-label="Aumentar cantidad"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      )}

      <motion.button
        whileHover={isSoldOut ? undefined : { scale: 1.05 }}
        whileTap={isSoldOut ? undefined : { scale: 0.95 }}
        onClick={handleAddToCart}
        disabled={isSoldOut}
        className={`w-full py-1.5 md:py-2 px-2 md:px-4 rounded-lg transition-colors text-[10px] md:text-sm font-medium ${
          isSoldOut
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-[#0c3c1f] text-white hover:bg-[#0c3c1f]/90'
        }`}
      >
        {isSoldOut ? 'Agotado' : 'Agregar'}
      </motion.button>
    </motion.div>
  );
}

export const FlashDeals: React.FC = () => {
  const { products: deals, loading } = useShopifyProducts(FLASH_DEALS_COLLECTION);

  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 18,
    seconds: 15
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          return { hours: 11, minutes: 18, seconds: 15 };
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const desktopScrollerRef = useRef<HTMLDivElement>(null);

  /** Scrollea el carrusel horizontalmente una "página" (= ancho visible). */
  const scrollByPage = (direction: 1 | -1) => {
    const el = desktopScrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * direction * 0.8, behavior: 'smooth' });
  };

  if (!loading && deals.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-8 md:py-12 overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-[100vw]">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0c3c1f] rounded-full flex items-center justify-center shrink-0"
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
            </motion.div>
            <h2 className="text-[#0c3c1f] text-lg sm:text-xl">Ofertas Relámpago</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
            <span className="text-[#212121] font-medium text-sm sm:text-base shrink-0">Las ofertas terminan en:</span>
            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              <div className="bg-[#0c3c1f] text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg min-w-[52px] sm:min-w-[60px] text-center">
                <div className="text-xl sm:text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-[10px] sm:text-xs uppercase">Horas</div>
              </div>
              <div className="bg-[#0c3c1f] text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg min-w-[52px] sm:min-w-[60px] text-center">
                <div className="text-xl sm:text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-[10px] sm:text-xs uppercase">Min</div>
              </div>
              <div className="bg-[#0c3c1f] text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg min-w-[52px] sm:min-w-[60px] text-center">
                <div className="text-xl sm:text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-[10px] sm:text-xs uppercase">Seg</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-48 md:h-72 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Mobile: scroll horizontal con 3 columnas visibles */}
        {!loading && deals.length > 0 && (
          <div className="md:hidden">
            <div className="flash-deals-mobile-scroll flex gap-2 overflow-x-auto pb-4 -mx-3 px-3 snap-x snap-mandatory">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="shrink-0 snap-start"
                  style={{ width: 'calc((100% - 16px) / 3)' }}
                >
                  <FlashDealCard deal={deal} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Desktop: scroll horizontal nativo con snap */}
        {!loading && deals.length > 0 && (
          <div className="hidden md:block relative">
            <div
              ref={desktopScrollerRef}
              className="flash-deals-desktop-scroll flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth"
            >
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="shrink-0 snap-start"
                  style={{ width: 'calc((100% - 96px) / 5)' }}
                >
                  <FlashDealCard deal={deal} />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 flex items-center justify-center bg-white/95 text-[#0c3c1f] rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 flex items-center justify-center bg-white/95 text-[#0c3c1f] rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-6 h-6" aria-hidden />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .flash-deals-mobile-scroll::-webkit-scrollbar { display: none; }
        .flash-deals-mobile-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .flash-deals-desktop-scroll::-webkit-scrollbar { display: none; }
        .flash-deals-desktop-scroll { scrollbar-width: none; -ms-overflow-style: none; }

        @media (max-width: 1279px) {
          .flash-deals-desktop-scroll > div { width: calc((100% - 72px) / 4) !important; }
        }
        @media (max-width: 1023px) {
          .flash-deals-desktop-scroll > div { width: calc((100% - 48px) / 3) !important; }
        }
      `}</style>
    </section>
  );
};
