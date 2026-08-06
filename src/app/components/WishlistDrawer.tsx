import React from 'react';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWishlist } from '@/app/context/WishlistContext';
import { useCart } from '@/app/context/CartContext';
import { useNavigate } from 'react-router-dom';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ isOpen, onClose }) => {
  const { items, removeItem, clearWishlist, totalItems } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (item: typeof items[number]) => {
    if (item.availableForSale === false) return;
    addToCart({
      id: typeof item.id === 'string' ? parseInt(item.id) || 0 : item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      category: item.category || '',
      description: '',
      variantId: item.variantId,
      availableForSale: item.availableForSale,
    });
  };

  const handleProductClick = (item: typeof items[number]) => {
    onClose();
    if (item.handle) {
      navigate(`/producto/${item.handle}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <h2 className="text-lg font-bold text-[#0c3c1f]">
                  Mis Favoritos ({totalItems})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar lista de favoritos"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Heart className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-[#717182] text-lg mb-2">Tu lista está vacía</p>
                  <p className="text-[#717182] text-sm">Agrega productos tocando el corazón</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <div
                        className="w-20 h-20 shrink-0 bg-white rounded-lg flex items-center justify-center cursor-pointer"
                        onClick={() => handleProductClick(item)}
                      >
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium text-[#212121] line-clamp-2 cursor-pointer hover:text-[#0c3c1f]"
                          onClick={() => handleProductClick(item)}
                        >
                          {item.name}
                        </p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-xs text-[#717182] line-through">${item.originalPrice.toFixed(2)}</span>
                          )}
                          <span className="text-base font-bold text-[#0c3c1f]">${item.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={item.availableForSale === false}
                            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                              item.availableForSale === false
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-[#0c3c1f] text-white hover:bg-[#0a3019]'
                            }`}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            {item.availableForSale === false ? 'Agotado' : 'Agregar'}
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            aria-label={`Eliminar ${item.name} de favoritos`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t space-y-2">
                <button
                  onClick={() => {
                    for (const item of items) {
                      if (item.availableForSale !== false) handleAddToCart(item);
                    }
                    onClose();
                  }}
                  className="w-full bg-[#0c3c1f] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#0a3019] transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Agregar todos al carrito
                </button>
                <button
                  onClick={clearWishlist}
                  className="w-full text-red-500 text-sm py-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Vaciar lista de favoritos
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
