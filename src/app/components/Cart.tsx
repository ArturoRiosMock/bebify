import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/app/context/CartContext';
import { PurchaseTypeDialog, type EventFormData } from './PurchaseTypeDialog';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Cart = ({ isOpen, onClose }: CartProps) => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart,
    goToCheckout,
    updateAttributes,
    isShopifyCart,
    cartLoading,
    cartError,
  } = useCart();

  const [showPurchaseType, setShowPurchaseType] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Chrome restaura la página desde bfcache al volver del checkout con estado congelado.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setCheckoutLoading(false);
      setShowPurchaseType(false);
    };

    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const itemId = (item: { lineId?: string; id: number | string }) => item.lineId ?? item.id;

  const handleCheckout = () => {
    if (isShopifyCart && goToCheckout) {
      setShowPurchaseType(true);
      return;
    }
    clearCart();
    onClose();
  };

  const handleConfirmPurchaseType = async (eventData: EventFormData | null) => {
    setCheckoutLoading(true);
    try {
      if (updateAttributes) {
        // Los atributos son opcionales — si fallan, el checkout continúa igual
        if (eventData) {
          await updateAttributes([
            { key: 'Tipo de compra', value: 'Evento' },
            { key: 'Tipo de evento', value: eventData.eventType },
            { key: 'Nombre de la escuela', value: eventData.schoolName },
            { key: 'Nombre del graduado', value: eventData.graduateName },
            { key: 'Número de mesa', value: eventData.tableNumber },
          ]).catch(() => {});
        } else {
          await updateAttributes([{ key: 'Tipo de compra', value: 'Personal' }]).catch(() => {});
        }
      }
      const ok = await goToCheckout!();
      if (ok) {
        setShowPurchaseType(false);
        onClose();
      }
    } catch {
      const ok = await goToCheckout?.();
      if (ok) {
        setShowPurchaseType(false);
        onClose();
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="cart-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={onClose}
            />
            <motion.div
              key="cart-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
            <div className="bg-[#0c3c1f] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <h2 className="text-lg font-bold">Carrito ({getTotalItems()})</h2>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-white/10 p-2 rounded-lg transition-colors"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" aria-hidden />
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
                          {item.cantidadLabel && (
                            <p className="text-xs text-[#717182] mb-1">
                              <span className="font-semibold text-[#212121]">Cantidad:</span> {item.cantidadLabel}
                            </p>
                          )}
                          <p className="text-[#0c3c1f] font-bold mb-2">${item.price.toFixed(2)} MXN</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(itemId(item), item.quantity - 1)}
                              disabled={cartLoading}
                              className="bg-white border border-gray-200 p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
                              aria-label={`Disminuir cantidad de ${item.name}`}
                            >
                              <Minus className="w-3.5 h-3.5" aria-hidden />
                            </button>
                            <span className="text-[#212121] font-medium min-w-[1.5rem] text-center text-sm" aria-live="polite">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(itemId(item), item.quantity + 1)}
                              disabled={cartLoading}
                              className="bg-white border border-gray-200 p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
                              aria-label={`Aumentar cantidad de ${item.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden />
                            </button>
                            <button
                              onClick={() => removeFromCart(itemId(item))}
                              disabled={cartLoading}
                              className="ml-auto text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md disabled:opacity-50 transition-colors"
                              aria-label={`Eliminar ${item.name} del carrito`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden />
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
                <div className="flex items-center justify-between text-[#212121]">
                  <span className="font-medium">Total:</span>
                  <span className="text-[#0c3c1f] text-xl font-bold">${getTotalPrice().toFixed(2)} MXN</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={cartLoading}
                  className="w-full bg-[#0c3c1f] text-white py-3 rounded-lg hover:bg-[#0a3019] transition-colors disabled:opacity-50 font-bold text-base"
                >
                  {isShopifyCart ? 'Ir a pagar' : 'Finalizar Compra'}
                </button>
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

      <PurchaseTypeDialog
        open={showPurchaseType}
        onClose={() => setShowPurchaseType(false)}
        onConfirm={handleConfirmPurchaseType}
        loading={checkoutLoading}
        error={cartError}
      />
    </>
  );
};
