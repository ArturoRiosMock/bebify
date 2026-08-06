import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, Plus, Minus, ShoppingCart, ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useShopifySearch } from '@/shopify/hooks/useShopifyProducts';
import { useCart, type Product } from '@/app/context/CartContext';
import { useNavigate } from 'react-router-dom';
import type { Product as ShopifyProduct } from '@/shopify/types';

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
      <strong className="font-semibold text-[#0c3c1f]">{text.slice(idx, idx + query.trim().length)}</strong>
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
    cantidadLabel: p.cantidadLabel,
    availableForSale: p.availableForSale,
  };
}

export const SearchDrawer = ({ isOpen, onClose, onOpenCart }: SearchDrawerProps) => {
  const navigate = useNavigate();
  const { addToCart, getTotalItems } = useCart();
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
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, qty) }));
  };

  const handleAdd = useCallback((product: ShopifyProduct) => {
    if (product.availableForSale === false) return;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmedQuery.length < 2) return;
    onClose();
    navigate(`/buscar?q=${encodeURIComponent(trimmedQuery)}`);
  };

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
            <div className="bg-[#212121] text-white p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                <h2 className="text-lg font-bold">Buscar</h2>
              </div>
              <button onClick={handleClose} className="hover:bg-white/10 p-2 rounded-lg transition-colors" aria-label="Cerrar búsqueda">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cartCount > 0 && (
              <button
                onClick={handleViewCart}
                className="mx-4 mt-3 flex items-center justify-center gap-2 bg-[#0c3c1f] text-white py-2.5 rounded-lg hover:bg-[#0a3019] transition-colors font-medium text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Ver carrito ({cartCount})
              </button>
            )}

            <div className="px-4 pt-3 pb-2 flex-shrink-0">
              <form onSubmit={handleSubmit} role="search">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="search"
                    placeholder="Buscar..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full border-b-2 border-gray-300 focus:border-[#0c3c1f] px-1 py-2.5 pr-16 outline-none text-[#212121] text-base transition-colors bg-transparent"
                    aria-label="Buscar productos"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query && (
                      <button type="button" onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-[#212121] rounded" aria-label="Limpiar">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="p-1 text-[#0c3c1f] hover:text-[#0a3019] disabled:text-gray-300"
                      aria-label="Buscar"
                      disabled={trimmedQuery.length < 2}
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {trimmedQuery.length < 2 && (
                <div className="flex flex-col items-center justify-center h-full text-[#717182]">
                  <Search className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-base">Escribe para buscar productos</p>
                  <p className="text-sm mt-1">Mínimo 2 caracteres</p>
                </div>
              )}

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

              {trimmedQuery.length >= 2 && !loading && results.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => { onClose(); navigate(`/buscar?q=${encodeURIComponent(trimmedQuery)}`); }}
                    className="w-full text-left px-3 py-2 mb-1 rounded-lg text-sm font-medium text-[#0c3c1f] bg-[#0c3c1f]/5 hover:bg-[#0c3c1f]/10 transition-colors flex items-center justify-between"
                  >
                    <span>Ver todos los resultados de «{trimmedQuery}»</span>
                    <span aria-hidden>→</span>
                  </button>
                  <p className="text-xs font-semibold text-[#717182] uppercase tracking-wide py-2">Productos</p>
                  <div className="space-y-1">
                    {results.map((product) => {
                      const isAdded = addedIds.has(product.id);
                      const qty = getQuantity(product.id);
                      const isSoldOut = product.availableForSale === false;

                      return (
                        <motion.div key={product.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                          <div
                            className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 cursor-pointer border border-gray-100"
                            onClick={() => { onClose(); navigate(`/producto/${product.handle || product.id}`); }}
                          >
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">Sin img</div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium text-[#212121] line-clamp-2 cursor-pointer hover:text-[#0c3c1f] transition-colors"
                              onClick={() => { onClose(); navigate(`/producto/${product.handle || product.id}`); }}
                            >
                              {highlightMatch(product.name, trimmedQuery)}
                            </p>
                            {product.cantidadLabel && (
                              <p className="text-xs text-[#717182] mt-0.5">
                                <span className="font-semibold text-[#212121]">Cantidad:</span> {product.cantidadLabel}
                              </p>
                            )}
                            {!product.cantidadLabel && product.category && (
                              <p className="text-xs text-[#717182] mt-0.5">{product.category}</p>
                            )}
                            <div className="mt-1.5">
                              <p className="text-[#0c3c1f] font-bold text-sm mb-1.5">${product.price.toFixed(2)} MXN</p>
                              <div className="flex items-center gap-2">
                                {!isSoldOut && (
                                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                    <button
                                      onClick={() => setQuantity(product.id, qty - 1)}
                                      className="p-1.5 hover:bg-gray-100 transition-colors"
                                      disabled={qty <= 1}
                                      aria-label={`Disminuir cantidad de ${product.name}`}
                                    >
                                      <Minus className="w-3.5 h-3.5" aria-hidden />
                                    </button>
                                    <span className="px-3 text-sm font-medium min-w-[2rem] text-center" aria-live="polite">{qty}</span>
                                    <button
                                      onClick={() => setQuantity(product.id, qty + 1)}
                                      className="p-1.5 hover:bg-gray-100 transition-colors"
                                      aria-label={`Aumentar cantidad de ${product.name}`}
                                    >
                                      <Plus className="w-3.5 h-3.5" aria-hidden />
                                    </button>
                                  </div>
                                )}
                                <motion.button
                                  onClick={() => handleAdd(product)}
                                  whileTap={isSoldOut || isAdded ? undefined : { scale: 0.95 }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all text-white ${
                                    isSoldOut
                                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                      : isAdded
                                        ? 'bg-green-500'
                                        : 'bg-[#0c3c1f] hover:bg-[#0a3019]'
                                  }`}
                                  disabled={isSoldOut || isAdded}
                                >
                                  {isSoldOut ? 'Agotado' : isAdded ? (<><Check className="w-4 h-4" />Agregado</>) : (<><ShoppingCart className="w-4 h-4" />Agregar</>)}
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

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
