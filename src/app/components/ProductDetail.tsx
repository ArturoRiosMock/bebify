import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Share2, Heart, ShoppingCart, Star, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import Slider from 'react-slick';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { useAuth } from '@/app/context/AuthContext';
import { FlashDeals } from '@/app/components/FlashDeals';
import { AdBanner } from '@/app/components/AdBanner';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import type { Product } from '@/shopify/types';
import { isProductInStock } from '@/app/utils/productStock';
import { OutOfStockMessage } from '@/app/components/OutOfStockMessage';
import { QuantityInput } from '@/app/components/QuantityInput';

interface ProductDetailProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onProductClick: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, allProducts, onBack, onProductClick }) => {
  const { addToCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const isFavorite = isInWishlist(product.id);
  const inStock = isProductInStock(product);
  const handleToggleFavorite = () => {
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      handle: product.handle,
      variantId: product.variantId,
    });
  };
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  const images = product.images && product.images.length > 0
    ? product.images
    : product.image ? [product.image] : [];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const similarProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 8);

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        category: product.category,
        description: product.description,
        image: product.image,
        variantId: product.variantId,
        shopifyId: product.shopifyId,
        handle: product.handle,
        packLabel: product.packLabel,
        inStock: product.inStock,
      },
      quantity
    );
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `${product.name} - Solo $${product.price.toFixed(2)} MXN`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const handleSimilarProductClick = (p: Product) => {
    setQuantity(1);
    setSelectedImage(0);
    onProductClick(p);
    window.scrollTo(0, 0);
  };

  const sliderSettings = {
    dots: true,
    infinite: similarProducts.length > 4,
    speed: 500,
    slidesToShow: Math.min(4, similarProducts.length),
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: Math.min(4, similarProducts.length) } },
      { breakpoint: 1024, settings: { slidesToShow: Math.min(3, similarProducts.length) } }
    ]
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 max-w-[100vw]">
          <div className="flex items-center gap-2 text-sm text-[#717182]">
            <Link to="/" className="hover:text-[#0055a2] transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#0055a2]">{product.category || 'Producto'}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#717182] truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Sección Principal del Producto */}
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-8 max-w-[100vw]">
        <div className="bg-white rounded-lg p-3 sm:p-6 lg:p-8 shadow-sm max-w-5xl mx-auto">

          {/* === MOBILE LAYOUT === */}
          <div className="md:hidden">
            <div className="flex gap-3 mb-3">
              <div className="relative shrink-0 w-[40%]">
                {discountPercentage > 0 && (
                  <div className="absolute top-1 left-1 z-10 bg-purple-600 text-white rounded-full w-9 h-9 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-[9px] font-bold leading-none">-{discountPercentage}%</span>
                    <span className="text-[7px] uppercase leading-none">OFF</span>
                  </div>
                )}
                <div className="flex items-center justify-center bg-gray-50 rounded-lg p-2 aspect-square">
                  {images.length > 0 ? (
                    <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      Sin imagen
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-1 mt-1.5 overflow-x-auto">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`shrink-0 border-2 rounded p-0.5 w-10 h-10 flex items-center justify-center transition-colors ${
                          selectedImage === idx ? 'border-[#0055a2]' : 'border-gray-200'
                        }`}
                      >
                        <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h1 className="text-[#0055a2] text-sm font-bold mb-1 line-clamp-2">{product.name}</h1>
                  {product.category && (
                    <p className="text-[10px] text-[#717182] mb-1">
                      Categoría: <span className="text-[#0055a2] font-medium">{product.category}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                {isAuthenticated ? (
                  <div>
                    {hasDiscount && (
                      <p className="text-[10px] text-[#717182] line-through">${product.originalPrice!.toFixed(2)}</p>
                    )}
                    <span className="text-xl font-bold text-[#0055a2]">${product.price.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded px-2 py-1">
                    <span className="text-[10px] text-[#0055a2] font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Inicia sesión
                    </span>
                  </div>
                )}
              </div>
            </div>

            {!inStock ? (
              <div ref={ctaRef} className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-center">
                <OutOfStockMessage />
              </div>
            ) : isAuthenticated ? (
              <>
                <p className="text-xs text-[#212121] mb-1.5">
                  Cantidad: <span className="font-semibold">{product.packLabel ?? '1 Botella'}</span>
                </p>
                <div ref={ctaRef} className="flex gap-2 mb-3">
                  <QuantityInput
                    value={quantity}
                    onChange={setQuantity}
                    variant="grouped"
                    className="shrink-0"
                  />
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-[#0055a2] text-white py-2.5 px-4 rounded-lg hover:bg-[#004488] transition-colors font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    AGREGAR
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={handleShare}
                    className="flex-1 p-2 rounded-lg bg-[#0055a2] text-white hover:bg-[#004488] transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir
                  </button>
                  <button onClick={handleToggleFavorite} className={`p-2 rounded-lg border transition-colors ${isFavorite ? 'bg-red-50 border-red-200' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-[#0055a2]'}`} />
                  </button>
                </div>
              </>
            ) : (
              <div ref={ctaRef} className="mb-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#0055a2] text-white py-2.5 px-4 rounded-lg hover:bg-[#004488] transition-colors font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Inicia sesión para comprar
                </button>
              </div>
            )}
          </div>

          {/* === DESKTOP LAYOUT === */}
          <div className="hidden md:grid grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-start">
            {/* Columna Izquierda - Imágenes con thumbnails */}
            <div className="relative">
              <div className={`flex gap-4 ${images.length > 1 ? '' : 'justify-center'}`}>
                {/* Thumbnails verticales */}
                {images.length > 1 && (
                  <div className="flex flex-col gap-2 shrink-0 w-16">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`border-2 rounded-lg p-1.5 w-16 h-16 flex items-center justify-center transition-all ${
                          selectedImage === idx
                            ? 'border-[#0055a2] shadow-md'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Imagen principal */}
                <div className="relative flex-1">
                  {discountPercentage > 0 && (
                    <div className="absolute top-3 left-3 z-10 bg-purple-600 text-white rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-sm font-bold">-{discountPercentage}%</span>
                      <span className="text-[10px] uppercase">OFF</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center bg-gray-50 rounded-xl p-6 min-h-[380px] max-h-[460px]">
                    {images.length > 0 ? (
                      <motion.img
                        key={selectedImage}
                        initial={{ opacity: 0.6, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25 }}
                        src={images[selectedImage]}
                        alt={product.name}
                        className="max-h-[400px] max-w-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-[380px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">Sin imagen</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha - Información */}
            <div className="space-y-5">
              <div>
                <h1 className="text-[#0055a2] text-2xl font-bold mb-2">{product.name}</h1>
                {product.category && (
                  <p className="text-sm text-[#717182]">
                    Categoría: <span className="text-[#0055a2] font-medium">{product.category}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-[#0055a2] text-white hover:bg-green-600 transition-colors flex items-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-xs">Compartir</span>
                  </button>
                  <button onClick={handleToggleFavorite} className={`p-2 rounded-full border transition-colors ${isFavorite ? 'bg-red-50 border-red-200' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-[#0055a2]'}`} />
                  </button>
                </div>
              </div>

              {!inStock ? (
              <div ref={ctaRef} className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-center">
                <OutOfStockMessage />
              </div>
            ) : isAuthenticated ? (
                <>
                  <div className="bg-blue-50 rounded-xl p-5 space-y-2">
                    {hasDiscount && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#717182]">De:</span>
                        <span className="text-lg text-[#717182] line-through">${product.originalPrice!.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#717182]">{hasDiscount ? 'Por:' : 'Precio:'}</span>
                      <span className="text-4xl font-bold text-[#0055a2]">${product.price.toFixed(2)}</span>
                    </div>
                    {hasDiscount && (
                      <p className="text-sm text-[#717182]">
                        Al contado <span className="text-[#0055a2] font-medium">({discountPercentage}% de descuento)</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-[#212121] mb-2">
                      Cantidad: <span className="font-semibold">{product.packLabel ?? '1 Botella'}</span>
                    </p>
                    <div ref={ctaRef} className="flex gap-3">
                      <QuantityInput
                        value={quantity}
                        onChange={setQuantity}
                        variant="grouped"
                        className="shrink-0"
                      />
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-[#0055a2] text-white py-3 px-6 rounded-lg hover:bg-[#004488] transition-colors font-bold text-lg flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        AGREGAR
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-blue-50 rounded-xl p-5 flex items-center gap-3">
                    <Lock className="w-6 h-6 text-[#0055a2]" />
                    <div>
                      <p className="text-[#0055a2] font-bold">Precio exclusivo para miembros</p>
                      <p className="text-sm text-[#717182]">Inicia sesión para ver el precio y comprar</p>
                    </div>
                  </div>
                  <div ref={ctaRef}>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full bg-[#0055a2] text-white py-3 px-6 rounded-lg hover:bg-[#004488] transition-colors font-bold text-lg flex items-center justify-center gap-2"
                    >
                      <Lock className="w-5 h-5" />
                      Iniciar sesión para comprar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Descripción del producto - sección completa */}
        {(product.descriptionHtml || product.description) && (
          <div className="bg-white rounded-lg p-6 shadow-sm mt-6 max-w-5xl mx-auto">
            <h2 className="text-[#0055a2] text-xl font-bold mb-4">Descripción del producto</h2>
            {product.descriptionHtml ? (
              <div
                className="text-[#212121] text-sm leading-relaxed prose prose-sm max-w-none
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
                  [&_li]:mb-1
                  [&_p]:mb-3
                  [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-[#0055a2] [&_h1]:mb-2
                  [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[#0055a2] [&_h2]:mb-2
                  [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-[#0055a2] [&_h3]:mb-2
                  [&_strong]:font-semibold
                  [&_a]:text-[#0055a2] [&_a]:underline
                  [&_table]:w-full [&_table]:border-collapse [&_table]:mb-3
                  [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs
                  [&_th]:border [&_th]:border-gray-200 [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:bg-gray-50 [&_th]:font-semibold"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            ) : (
              <p className="text-[#212121] text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <AdBanner slotId="product-description-below" />
          </div>
          <div className="hidden lg:block shrink-0 w-[300px]">
            <AdBanner slotId="product-sidebar-rectangle" variant="sidebar" />
          </div>
        </div>

        {/* Productos Similares */}
        {similarProducts.length > 0 && (
          <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm mt-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-[#0055a2] text-base sm:text-xl font-bold">Productos similares</h2>
              <Link to="/" className="text-white bg-[#0055a2] px-4 sm:px-6 py-1.5 sm:py-2 rounded-full hover:bg-[#0055a2]/90 text-xs sm:text-sm shrink-0">
                Ver Todos
              </Link>
            </div>

            {/* Móvil: scroll horizontal con 2 productos visibles */}
            <div className="md:hidden">
              <div className="similar-scroll flex gap-2 overflow-x-auto pb-4 -mx-3 px-3 snap-x snap-mandatory">
                {similarProducts.map((item) => {
                  const itemHasDiscount = item.originalPrice && item.originalPrice > item.price;
                  const itemDiscount = itemHasDiscount
                    ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
                    : 0;
                  return (
                    <div
                      key={item.id}
                      className="shrink-0 snap-start"
                      style={{ width: 'calc((100% - 8px) / 2)' }}
                    >
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="border rounded-lg p-2 relative cursor-pointer h-full"
                        onClick={() => handleSimilarProductClick(item)}
                      >
                        {itemDiscount > 0 && (
                          <div className="absolute top-1.5 left-1.5 bg-[rgb(255,107,53)] text-white rounded-full w-8 h-8 flex flex-col items-center justify-center z-10">
                            <span className="text-[8px] font-bold leading-none">-{itemDiscount}%</span>
                          </div>
                        )}
                        <button className="absolute top-1.5 right-1.5 z-10" onClick={(e) => { e.stopPropagation(); toggleItem({ id: item.id, name: item.name, price: item.price, originalPrice: item.originalPrice, image: item.image, category: item.category, handle: item.handle, variantId: item.variantId }); }}>
                          <Heart className={`w-4 h-4 ${isInWishlist(item.id) ? 'fill-red-500 text-red-500' : 'text-[#0055a2]'}`} />
                        </button>
                        <img src={item.image} alt={item.name} className="w-full h-28 object-contain mb-2" />
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px]">5.0</span>
                        </div>
                        <p className="text-[10px] text-[#212121] font-medium mb-1 line-clamp-2 min-h-[24px]">{item.name}</p>
                        {isAuthenticated ? (
                          <span className="text-sm font-bold text-[#0055a2]">${item.price.toFixed(2)}</span>
                        ) : (
                          <span className="text-[10px] text-[#0055a2] font-medium flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />Ver precio</span>
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: carrusel Slider */}
            {similarProducts.length >= 2 ? (
              <div className="hidden md:block">
                <Slider {...sliderSettings}>
                  {similarProducts.map((item) => {
                    const itemHasDiscount = item.originalPrice && item.originalPrice > item.price;
                    const itemDiscount = itemHasDiscount
                      ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
                      : 0;
                    return (
                      <div key={item.id} className="px-3">
                        <motion.div
                          whileHover={{ y: -5 }}
                          className="border rounded-lg p-4 relative cursor-pointer"
                          onClick={() => handleSimilarProductClick(item)}
                        >
                          {itemDiscount > 0 && (
                            <div className="absolute top-2 left-2 bg-[rgb(255,107,53)] text-white rounded-full w-12 h-12 flex flex-col items-center justify-center text-xs z-10">
                              <span className="font-bold">-{itemDiscount}%</span>
                              <span className="uppercase">OFF</span>
                            </div>
                          )}
                          <button className="absolute top-2 right-2" onClick={(e) => { e.stopPropagation(); toggleItem({ id: item.id, name: item.name, price: item.price, originalPrice: item.originalPrice, image: item.image, category: item.category, handle: item.handle, variantId: item.variantId }); }}>
                            <Heart className={`w-5 h-5 ${isInWishlist(item.id) ? 'fill-red-500 text-red-500' : 'text-[#0055a2]'}`} />
                          </button>
                          <img src={item.image} alt={item.name} className="w-full h-40 object-contain mb-4" />
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">5.0</span>
                          </div>
                          <p className="text-sm text-[#212121] font-medium mb-2 line-clamp-2">{item.name}</p>
                          {isAuthenticated ? (
                            <div className="space-y-1">
                              {itemHasDiscount && (
                                <p className="text-sm text-[#717182] line-through">
                                  De: ${item.originalPrice!.toFixed(2)}
                                </p>
                              )}
                              <p className="text-sm text-[#212121]">
                                {itemHasDiscount ? 'por: ' : ''}
                                <span className="text-xl font-bold text-[#0055a2]">${item.price.toFixed(2)}</span>
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-[#0055a2] font-medium flex items-center gap-1"><Lock className="w-3.5 h-3.5" />Inicia sesión para ver precio</span>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}
                </Slider>
              </div>
            ) : (
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {similarProducts.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -5 }}
                    className="border rounded-lg p-4 cursor-pointer"
                    onClick={() => handleSimilarProductClick(item)}
                  >
                    <img src={item.image} alt={item.name} className="w-full h-40 object-contain mb-4" />
                    <p className="text-sm text-[#212121] font-medium mb-2 line-clamp-2">{item.name}</p>
                    {isAuthenticated ? (
                      <p className="text-xl font-bold text-[#0055a2]">${item.price.toFixed(2)}</p>
                    ) : (
                      <span className="text-sm text-[#0055a2] font-medium flex items-center gap-1"><Lock className="w-3.5 h-3.5" />Ver precio</span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        <style>{`
          .similar-scroll::-webkit-scrollbar { display: none; }
          .similar-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-[100vw]">
        <AdBanner slotId="product-similar-below" className="max-w-5xl mx-auto" />
      </div>

      {/* Sección de Ofertas Relámpago */}
      <FlashDeals />

      {/* Barra sticky de compra - solo móvil, aparece al hacer scroll */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-3 py-2.5 transition-transform duration-300 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {!inStock ? (
          <div className="py-1 text-center">
            <OutOfStockMessage />
          </div>
        ) : isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#717182] truncate">{product.name}</p>
              <span className="text-lg font-bold text-[#0055a2]">${product.price.toFixed(2)}</span>
            </div>
            <QuantityInput
              value={quantity}
              onChange={setQuantity}
              variant="grouped"
              size="sm"
              className="shrink-0"
            />
            <button
              onClick={handleAddToCart}
              className="bg-[#0055a2] text-white py-2.5 px-5 rounded-lg hover:bg-[#004488] transition-colors font-bold text-sm flex items-center gap-1.5 shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
              AGREGAR
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#0055a2] text-white py-2.5 rounded-lg hover:bg-[#004488] transition-colors font-bold text-sm flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Inicia sesión para ver precio y comprar
          </button>
        )}
      </div>

      {/* Espaciador para evitar que el contenido quede detrás de la barra sticky */}
      <div className="md:hidden h-16" />
    </div>
  );
};
