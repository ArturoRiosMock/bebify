import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronRight,
  Package,
  RefreshCw,
  LogIn,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useCustomerOrders } from '@/shopify/hooks/useCustomerOrders';
import {
  formatOrderDate,
  getFinancialStatusLabel,
  getFulfillmentStatusLabel,
} from '@/shopify/customerOrders';

const statusBadgeClass = (type: 'financial' | 'fulfillment', value: string): string => {
  if (type === 'financial') {
    if (value === 'PAID') return 'bg-green-50 text-green-700 border-green-200';
    if (value === 'PENDING' || value === 'AUTHORIZED') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (value === 'REFUNDED' || value === 'VOIDED') return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }

  if (value === 'FULFILLED') return 'bg-green-50 text-green-700 border-green-200';
  if (value === 'PARTIAL') return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-gray-100 text-[#212121] border-gray-200';
};

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    orders,
    numberOfOrders,
    loading,
    loadingMore,
    error,
    hasNextPage,
    loadMore,
    refresh,
  } = useCustomerOrders(user?.accessToken);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cuenta' }, replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email;

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#717182]">
            <Link to="/" className="hover:text-[#0055a2] transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#0055a2] font-medium">Mi cuenta</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#212121] mb-1">Mi cuenta</h1>
          <p className="text-[#717182]">
            Hola, <span className="font-medium text-[#212121]">{displayName}</span>
          </p>
          {user?.email && (
            <p className="text-sm text-[#717182] mt-0.5">{user.email}</p>
          )}
        </div>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#0055a2]" />
              <h2 className="text-lg font-semibold text-[#212121]">Mis pedidos</h2>
              {!loading && numberOfOrders > 0 && (
                <span className="text-sm text-[#717182]">({numberOfOrders})</span>
              )}
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-sm text-[#0055a2] hover:text-[#004488] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          <div className="p-5">
            {loading && orders.length === 0 ? (
              <div className="py-12 text-center text-[#717182]">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#0055a2]" />
                <p>Cargando pedidos...</p>
              </div>
            ) : error ? (
              <div className="py-10 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { from: '/cuenta' } })}
                  className="inline-flex items-center gap-2 bg-[#0055a2] text-white px-4 py-2 rounded-lg hover:bg-[#004488] transition-colors text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar sesión
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-[#212121] font-medium mb-1">Aún no tienes pedidos</p>
                <p className="text-sm text-[#717182] mb-5">
                  Cuando realices una compra, aparecerá aquí tu historial.
                </p>
                <Link
                  to="/productos"
                  className="inline-flex items-center gap-2 bg-[#0055a2] text-white px-5 py-2.5 rounded-lg hover:bg-[#004488] transition-colors text-sm font-medium"
                >
                  Ver productos
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <motion.article
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="rounded-xl border border-gray-200 p-4 sm:p-5 hover:border-[#0055a2]/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div>
                        <p className="text-base font-semibold text-[#212121]">{order.name}</p>
                        <p className="text-sm text-[#717182] mt-0.5">
                          {formatOrderDate(order.processedAt)}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold text-[#0055a2]">
                          ${order.totalPrice.toFixed(2)} {order.currencyCode}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 sm:justify-end">
                          <span
                            className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${statusBadgeClass('financial', order.financialStatus)}`}
                          >
                            {getFinancialStatusLabel(order.financialStatus)}
                          </span>
                          <span
                            className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${statusBadgeClass('fulfillment', order.fulfillmentStatus)}`}
                          >
                            {getFulfillmentStatusLabel(order.fulfillmentStatus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.lineItems.length > 0 && (
                      <ul className="text-sm text-[#717182] space-y-1 mb-4 border-t border-gray-100 pt-3">
                        {order.lineItems.map((item, itemIndex) => (
                          <li key={`${order.id}-${itemIndex}`} className="line-clamp-1">
                            {item.quantity}× {item.title}
                          </li>
                        ))}
                      </ul>
                    )}

                    <Link
                      to={`/pedidos/${order.orderNumber}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0055a2] hover:text-[#004488] hover:underline"
                    >
                      Ver detalle del pedido
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </motion.article>
                ))}

                {hasNextPage && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 border border-[#0055a2] text-[#0055a2] px-5 py-2.5 rounded-lg hover:bg-[#f0f7ff] disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        'Cargar más pedidos'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
