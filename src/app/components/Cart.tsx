import React from 'react';
import { X, Trash2, ShoppingBag, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { formatMinimumOrderMessage } from '@/config/commerce';
import { QuantityInput } from '@/app/components/QuantityInput';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Cart = ({ isOpen, onClose }: CartProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart,
    cartLoading,
    cartError,
    minimumOrderStatus,
    minimumOrderLabel,
  } = useCart();

  const itemId = (item: { lineId?: string; id: number | string }) => item.lineId ?? item.id;
  const minimumOrderMessage = formatMinimumOrderMessage(minimumOrderStatus);
  const canCheckout = minimumOrderStatus.meetsMinimum;

  const handleViewCart = () => {
    onClose();
    navigate('/carrito');
    window.scrollTo(0, 0);
  };

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
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className="bg-[#0055a2] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <h2 className="text-lg font-bold">Carrito ({getTotalItems()})</h2>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cartError && (
              <div className="mx-4 mt-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {cartError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {cartLoading && cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-[#717182]">
                  <p>Cargando carrito...</p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#717182]">
                  <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-lg">Tu carrito está vacío</p>
                  <p className="text-sm mt-2">¡Agrega productos para comenzar!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {cartItems.map(item => (
                      <motion.div
                        key={item.lineId ?? String(item.id)}
                        layout
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 80, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="bg-gray-50 rounded-xl p-3 flex gap-3 border border-gray-100"
                      >
                        <img
                          src={item.image || 'https://placehold.co/80x80?text=Sin+imagen'}
                          alt={item.name}
                          className="w-18 h-18 object-contain rounded-lg bg-white p-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-[#212121] line-clamp-2 mb-1">{item.name}</h3>
                          {isAuthenticated ? (
                            <p className="text-[#0055a2] font-bold mb-1">${item.price.toFixed(2)} MXN</p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                navigate('/login');
                              }}
                              className="text-xs sm:text-sm text-[#0055a2] font-medium flex items-center gap-1 mb-1 hover:underline"
                            >
                              <Lock className="w-3 h-3 shrink-0" />
                              Inicia sesión para ver precio
                            </button>
                          )}
                          <p className="text-xs text-[#717182] mb-1.5">
                            Cantidad: <span className="font-semibold text-[#212121]">{item.packLabel ?? '1 Botella'}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <QuantityInput
                              value={item.quantity}
                              onChange={(nextQuantity) => updateQuantity(itemId(item), nextQuantity)}
                              size="sm"
                              disabled={cartLoading}
                            />
                            <button
                              onClick={() => removeFromCart(itemId(item))}
                              disabled={cartLoading}
                              aria-label="Eliminar producto"
                              className="ml-auto text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="border-t border-gray-200 p-4 space-y-3"
              >
                {isAuthenticated ? (
                  <>
                    {!canCheckout && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Pedido mínimo: {minimumOrderLabel}</p>
                            <p className="mt-1">{minimumOrderMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[#212121]">
                      <span className="font-medium">Subtotal:</span>
                      <span className="text-[#0055a2] text-xl font-bold">${getTotalPrice().toFixed(2)} MXN</span>
                    </div>
                    <p className="text-xs text-[#717182]">+ IVA al checkout</p>
                    <button
                      onClick={handleViewCart}
                      disabled={cartLoading}
                      className="w-full bg-[#0055a2] text-white py-3 rounded-lg hover:bg-[#004488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base"
                    >
                      Ver Carrito
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/login');
                    }}
                    className="w-full bg-[#0055a2] text-white py-3 rounded-lg hover:bg-[#004488] transition-colors font-bold text-base flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    Inicia sesión para comprar
                  </button>
                )}
                <button
                  onClick={clearCart}
                  disabled={cartLoading}
                  className="w-full border border-gray-300 text-[#717182] py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                >
                  Vaciar Carrito
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
