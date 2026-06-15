import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Trash2, ShoppingBag, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { formatMinimumOrderMessage } from '@/config/commerce';
import { QuantityInput } from '@/app/components/QuantityInput';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart,
    goToCheckout,
    isShopifyCart,
    cartLoading,
    cartError,
    minimumOrderStatus,
    minimumOrderLabel,
  } = useCart();

  const itemId = (item: { lineId?: string; id: number | string }) => item.lineId ?? item.id;
  const minimumOrderMessage = formatMinimumOrderMessage(minimumOrderStatus);
  const canCheckout = minimumOrderStatus.meetsMinimum;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!canCheckout) {
      return;
    }

    if (isShopifyCart && goToCheckout) {
      await goToCheckout();
      return;
    }

    clearCart();
  };

  return (
    <div className="min-h-[60vh]">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#717182]">
            <Link to="/" className="hover:text-[#0055a2] transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#0055a2] font-medium">Carrito</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="w-7 h-7 text-[#0055a2]" />
          <h1 className="text-3xl font-bold text-[#0055a2]">
            Carrito ({getTotalItems()})
          </h1>
        </div>

        {cartError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {cartError}
          </div>
        )}

        {cartLoading && cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#717182]">
            <p>Cargando carrito...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#717182]">
            <ShoppingBag className="w-20 h-20 text-gray-200 mb-4" />
            <p className="text-lg">Tu carrito está vacío</p>
            <p className="text-sm mt-2 mb-6">¡Agrega productos para comenzar!</p>
            <Link
              to="/productos"
              className="bg-[#0055a2] text-white py-3 px-6 rounded-lg hover:bg-[#004488] transition-colors font-bold"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {cartItems.map(item => (
                  <motion.div
                    key={item.lineId ?? String(item.id)}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    className="bg-white rounded-xl p-4 flex gap-4 border border-gray-100 shadow-sm"
                  >
                    <img
                      src={item.image || 'https://placehold.co/80x80?text=Sin+imagen'}
                      alt={item.name}
                      className="w-20 h-20 object-contain rounded-lg bg-gray-50 p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#212121] line-clamp-2 mb-1">{item.name}</h3>
                      {isAuthenticated ? (
                        <p className="text-[#0055a2] font-bold mb-1">${item.price.toFixed(2)} MXN</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/login')}
                          className="text-sm text-[#0055a2] font-medium flex items-center gap-1 mb-1 hover:underline"
                        >
                          <Lock className="w-3 h-3 shrink-0" />
                          Inicia sesión para ver precio
                        </button>
                      )}
                      <p className="text-xs text-[#717182] mb-2">
                        Cantidad: <span className="font-semibold text-[#212121]">{item.packLabel ?? '1 Botella'}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <QuantityInput
                          value={item.quantity}
                          onChange={(nextQuantity) => updateQuantity(itemId(item), nextQuantity)}
                          disabled={cartLoading}
                        />
                        <button
                          onClick={() => removeFromCart(itemId(item))}
                          disabled={cartLoading}
                          aria-label="Eliminar producto"
                          className="ml-auto text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-md disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <aside className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4 lg:sticky lg:top-4">
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
                    <span className="text-[#0055a2] text-2xl font-bold">${getTotalPrice().toFixed(2)} MXN</span>
                  </div>
                  <p className="text-xs text-[#717182]">+ IVA al checkout</p>
                  <button
                    onClick={handleCheckout}
                    disabled={cartLoading || !canCheckout}
                    className="w-full bg-[#0055a2] text-white py-3 rounded-lg hover:bg-[#004488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base"
                  >
                    Ir a pagar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#0055a2] text-white py-3 rounded-lg hover:bg-[#004488] transition-colors font-bold text-base flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  Inicia sesión para comprar
                </button>
              )}
              <Link
                to="/productos"
                className="block w-full text-center border border-gray-300 text-[#717182] py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Seguir comprando
              </Link>
              <button
                onClick={clearCart}
                disabled={cartLoading}
                className="w-full border border-gray-300 text-[#717182] py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
              >
                Vaciar carrito
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
