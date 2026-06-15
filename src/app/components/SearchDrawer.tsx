import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, ShoppingCart, ShoppingBag, Check, Lock } from 'lucide-react';
import { QuantityInput } from '@/app/components/QuantityInput';
import { motion, AnimatePresence } from 'motion/react';
import { useShopifySearch } from '@/shopify/hooks/useShopifyProducts';
import { useCart, type Product } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Product as ShopifyProduct } from '@/shopify/types';
import { isProductInStock } from '@/app/utils/productStock';
import { OutOfStockMessage } from '@/app/components/OutOfStockMessage';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const lower = query.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(lower);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-[#0055a2]">{text.slice(idx, idx + query.trim().length)}</strong>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

function toCartProduct(p: ShopifyProduct): Product {
  return {
    id: typeof p.id === 'string' ? parseInt(p.id.replace(/\D/g, '').slice(-8), 10) || 0 : Number(p.id),
    name: p.name,
    price: p.price,
    image: p.image || '',
    category: p.category || '',
    description: p.description || '',
    variantId: p.variantId,
    handle: p.handle,
    packLabel: p.packLabel,
    inStock: p.inStock,
  };
}

export const SearchDrawer = ({ isOpen, onClose, onOpenCart }: SearchDrawerProps) => {
  const navigate = useNavigate();
  const { addToCart, getTotalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const trimmedQuery = query.trim();
  const { results, loading } = useShopifySearch(trimmedQuery);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setQuantities({});
      setAddedIds(new Set());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getQuantity = (productId: string) => quantities[productId] ?? 1;

  const setQuantity = (productId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.min(99, Math.max(1, qty)) }));
  };

  const handleAdd = useCallback((product: ShopifyProduct) => {
    if (!isProductInStock(product)) return;

    const qty = quantities[product.id] ?? 1;
    addToCart(toCartProduct(product), qty);

    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);

    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  }, [addToCart, quantities]);

  const handleClose = () => {
    onClose();
    if (getTotalItems() > 0) {
      setTimeout(() => onOpenCart(), 350);
    }
  };

  const handleViewCart = () => {
    onClose();
    setTimeout(() => onOpenCart(), 350);
  };

  const cartCount = getTotalItems();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#212121] text-white p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                <h2 className="text-lg font-bold">Buscar</h2>
              </div>
              <button
                onClick={handleClose}
                className="hover:bg-white/10 p-2 rounded-lg transition-colors"
                aria-label="Cerrar búsqueda"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View Cart Button */}
            {cartCount > 0 && (
              <button
                onClick={handleViewCart}
                className="mx-4 mt-3 flex items-center justify-center gap-2 bg-[#0055a2] text-white py-2.5 rounded-lg hover:bg-[#004488] transition-colors font-medium text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Ver carrito ({cartCount})
              </button>
            )}

            {/* Search Input */}
            <div className="px-4 pt-3 pb-2 flex-shrink-0">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim().length >= 2) {
                      onClose();
                      navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
                    }
                  }}
                  className="w-full border-b-2 border-gray-300 focus:border-[#0055a2] px-1 py-2.5 pr-10 outline-none text-[#212121] text-base transition-colors bg-transparent"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="p-1 text-gray-400 hover:text-[#212121] rounded"
                      aria-label="Limpiar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Empty state */}
              {trimmedQuery.length < 2 && (
                <div className="flex flex-col items-center justify-center h-full text-[#717182]">
                  <Search className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-base">Escribe para buscar productos</p>
                  <p className="text-sm mt-1">Mínimo 2 caracteres</p>
                </div>
              )}

              {/* Loading skeletons */}
              {trimmedQuery.length >= 2 && loading && (
                <div className="space-y-4 pt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {trimmedQuery.length >= 2 && !loading && results.length > 0 && (
                <div className="pt-1">
                  <div className="flex items-center justify-between py-2">
                    <p className="text-xs font-semibold text-[#717182] uppercase tracking-wide">
                      Productos
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/buscar?q=${encodeURIComponent(trimmedQuery)}`);
                      }}
                      className="text-xs text-[#0055a2] hover:underline font-medium"
                    >
                      Ver todos los resultados →
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.map((product) => {
                      const isAdded = addedIds.has(product.id);
                      const qty = getQuantity(product.id);

                      return (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 py-3 border-b border-gray-100 last:border-0"
                        >
                          {/* Thumbnail */}
                          <div
                            className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 cursor-pointer border border-gray-100"
                            onClick={() => {
                              onClose();
                              navigate(`/producto/${product.handle || product.id}`);
                            }}
                          >
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                Sin img
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium text-[#212121] line-clamp-2 cursor-pointer hover:text-[#0055a2] transition-colors"
                              onClick={() => {
                                onClose();
                                navigate(`/producto/${product.handle || product.id}`);
                              }}
                            >
                              {highlightMatch(product.name, trimmedQuery)}
                            </p>

                            <p className="text-xs text-[#717182] mt-0.5">
                              Cantidad: {product.packLabel ?? '1 Botella'}
                            </p>

                            {isAuthenticated ? (
                              <div className="mt-1.5">
                                <p className="text-[#0055a2] font-bold text-sm mb-1.5">
                                  ${product.price.toFixed(2)} MXN
                                </p>
                                {!isProductInStock(product) ? (
                                  <OutOfStockMessage compact />
                                ) : (
                                <div className="flex items-center gap-2">
                                  <QuantityInput
                                    value={qty}
                                    onChange={(nextQuantity) => setQuantity(product.id, nextQuantity)}
                                    variant="grouped"
                                    size="sm"
                                  />

                                  {/* Add to Cart */}
                                  <motion.button
                                    onClick={() => handleAdd(product)}
                                    whileTap={{ scale: 0.95 }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                      isAdded
                                        ? 'bg-green-500 text-white'
                                        : 'bg-[#0055a2] text-white hover:bg-[#004488]'
                                    }`}
                                    disabled={isAdded}
                                  >
                                    {isAdded ? (
                                      <>
                                        <Check className="w-4 h-4" />
                                        Agregado
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCart className="w-4 h-4" />
                                        Agregar
                                      </>
                                    )}
                                  </motion.button>
                                </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-[#717182] mt-1.5 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                inicia sesión para agregar productos al carrito
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No results */}
              {trimmedQuery.length >= 2 && !loading && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-[#717182]">
                  <Search className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="font-medium">No se encontraron resultados</p>
                  <p className="text-sm mt-1">Prueba con otras palabras</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
