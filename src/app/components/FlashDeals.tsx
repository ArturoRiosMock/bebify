import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { Zap, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { useShopifyProducts } from '@/shopify/hooks/useShopifyProducts';
import { isProductInStock } from '@/app/utils/productStock';
import { OutOfStockMessage } from '@/app/components/OutOfStockMessage';
import { QuantityInput } from '@/app/components/QuantityInput';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const FLASH_DEALS_COLLECTION = 'el-buen-fin-llego-a-bebify';

export const FlashDeals: React.FC = () => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { products: allDeals, loading, error } = useShopifyProducts(FLASH_DEALS_COLLECTION);
  const deals = allDeals.slice(0, 20);

  const sliderSettings = {
    dots: true,
    infinite: deals.length > 5,
    speed: 500,
    slidesToShow: Math.min(5, deals.length || 1),
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: Math.min(4, deals.length || 1), slidesToScroll: 1 } },
      { breakpoint: 1024, settings: { slidesToShow: Math.min(3, deals.length || 1), slidesToScroll: 1 } }
    ]
  };

  const handleAddToCart = (deal: typeof deals[number], quantity: number) => {
    if (!isProductInStock(deal)) return;
    addToCart({
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
      packLabel: deal.packLabel,
      inStock: deal.inStock,
    }, quantity);
  };

  if (!loading && deals.length === 0) {
    return null;
  }

  const DealCard = ({ deal }: { deal: typeof deals[number] }) => {
    const hasDiscount = deal.originalPrice && deal.originalPrice > deal.price;
    const discountPercentage = hasDiscount
      ? Math.round(((deal.originalPrice! - deal.price) / deal.originalPrice!) * 100)
      : 0;

    const [quantity, setQuantity] = useState(1);
    const inStock = isProductInStock(deal);

    return (
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white rounded-lg p-2 sm:p-4 relative"
      >
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
                stroke="#0055a2"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h3 className="text-[#212121] text-xs md:text-sm font-medium mb-1 md:mb-2 text-center line-clamp-2 min-h-[32px] md:min-h-[40px]">
          {deal.name}
        </h3>

        {isAuthenticated ? (
          <>
            <div className="text-center mb-1.5 md:mb-3">
              <p className="text-[10px] md:text-xs text-[#717182] mb-0.5">Por apenas:</p>
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {hasDiscount && (
                  <span className="text-[10px] md:text-sm text-[#717182] line-through">
                    ${deal.originalPrice!.toFixed(2)}
                  </span>
                )}
                <span className="text-sm md:text-2xl font-bold text-[#0055a2]">
                  ${deal.price.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-[10px] md:text-xs text-[#212121] mb-1 text-center">
              Cantidad: <span className="font-semibold">{deal.packLabel ?? '1 Botella'}</span>
            </p>
            {!inStock ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-center mb-1.5">
                <OutOfStockMessage compact />
              </div>
            ) : (
              <>
            <div className="flex items-center justify-center mb-1.5 md:mb-2">
              <QuantityInput
                value={quantity}
                onChange={setQuantity}
                size="sm"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAddToCart(deal, quantity)}
              className="w-full bg-[#0055a2] text-white py-1.5 md:py-2 px-2 md:px-4 rounded-lg hover:bg-[#0055a2]/90 transition-colors text-[10px] md:text-sm font-medium"
            >
              Agregar
            </motion.button>
              </>
            )}
          </>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="w-full bg-[#0055a2] text-white py-1.5 md:py-2 px-2 md:px-4 rounded-lg hover:bg-[#0055a2]/90 transition-colors text-[10px] md:text-sm font-medium flex items-center justify-center gap-1"
          >
            <Lock className="w-3 h-3 md:w-3.5 md:h-3.5" />
            Ver precio
          </motion.button>
        )}
      </motion.div>
    );
  };

  return (
    <section className="bg-white py-8 md:py-12 overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-[100vw]">
        {/* Header */}
        <div className="flex items-center justify-center sm:justify-start mb-6 sm:mb-8 gap-2 sm:gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0055a2] rounded-full flex items-center justify-center shrink-0"
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
          </motion.div>
          <h2 className="text-[#0055a2] text-lg sm:text-xl">Los Mejores Descuentos Del Mes</h2>
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
                  <DealCard deal={deal} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Desktop: carrusel Slider */}
        {!loading && deals.length > 0 && (
          <div className="hidden md:block flash-deals-slider">
            <Slider {...sliderSettings}>
              {deals.map((deal) => (
                <div key={deal.id} className="px-3">
                  <DealCard deal={deal} />
                </div>
              ))}
            </Slider>
          </div>
        )}
      </div>

      <style>{`
        .flash-deals-mobile-scroll::-webkit-scrollbar { display: none; }
        .flash-deals-mobile-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .flash-deals-slider { position: relative; padding: 0 48px; }
        .flash-deals-slider .slick-dots { bottom: -35px; }
        .flash-deals-slider .slick-dots li button:before { color: #0055a2; font-size: 8px; }
        .flash-deals-slider .slick-dots li.slick-active button:before { color: #0055a2; }
        .flash-deals-slider .slick-prev,
        .flash-deals-slider .slick-next {
          width: 36px; height: 36px; z-index: 10;
          background: #fff; border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,.15);
          display: flex !important; align-items: center; justify-content: center;
        }
        .flash-deals-slider .slick-prev { left: 0; }
        .flash-deals-slider .slick-next { right: 0; }
        .flash-deals-slider .slick-prev:before,
        .flash-deals-slider .slick-next:before { color: #0055a2; font-size: 20px; line-height: 1; }
        .flash-deals-slider .slick-prev:hover,
        .flash-deals-slider .slick-next:hover { background: #f0f7ff; }
      `}</style>
    </section>
  );
};
