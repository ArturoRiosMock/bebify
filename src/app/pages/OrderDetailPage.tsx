import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useCart } from '@/app/context/CartContext';
import { useCustomerOrder } from '@/shopify/hooks/useCustomerOrder';
import {
  formatOrderDate,
  getFinancialStatusLabel,
  getFulfillmentStatusLabel,
  type CustomerOrderLineItem,
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

function canReorderItem(item: CustomerOrderLineItem): boolean {
  return Boolean(item.variantId && item.availableForSale !== false);
}

export const OrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderNumber: orderNumberParam } = useParams<{ orderNumber: string }>();
  const { user, isAuthenticated } = useAuth();
  const { reorderItems, cartLoading } = useCart();
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const orderNumber = Number(orderNumberParam);
  const { order, loading, error, refresh } = useCustomerOrder(user?.accessToken, orderNumber);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [orderNumberParam]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/pedidos/${orderNumberParam}` }, replace: true });
    }
  }, [isAuthenticated, navigate, orderNumberParam]);

  const reorderableItems = useMemo(
    () => (order?.lineItems ?? []).filter(canReorderItem),
    [order?.lineItems],
  );

  const skippedCount = (order?.lineItems.length ?? 0) - reorderableItems.length;

  const handleReorder = async () => {
    if (!reorderItems || reorderableItems.length === 0) {
      return;
    }

    setReorderMessage(null);
    setReorderError(null);

    const success = await reorderItems(
      reorderableItems.map((item) => ({
        variantId: item.variantId!,
        quantity: item.quantity,
      })),
    );

    if (!success) {
      setReorderError('No se pudo agregar el pedido al carrito. Intenta de nuevo.');
      return;
    }

    const suffix = skippedCount > 0
      ? ` (${skippedCount} producto${skippedCount === 1 ? '' : 's'} no disponible${skippedCount === 1 ? '' : 's'} omitido${skippedCount === 1 ? '' : 's'})`
      : '';

    setReorderMessage(`Productos agregados al carrito${suffix}.`);
    navigate('/carrito');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#717182] flex-wrap">
            <Link to="/" className="hover:text-[#0055a2] transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link to="/cuenta" className="hover:text-[#0055a2] transition-colors">
              Mi cuenta
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-[#0055a2] font-medium">
              Pedido {order?.name ?? `#${orderNumberParam}`}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          to="/cuenta"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#0055a2] hover:text-[#004488] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis pedidos
        </Link>

        {loading ? (
          <div className="py-16 text-center text-[#717182]">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#0055a2]" />
            <p>Cargando pedido...</p>
          </div>
        ) : error || !order ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-[#212121] font-medium mb-2">{error ?? 'Pedido no encontrado'}</p>
            <Link
              to="/cuenta"
              className="inline-flex items-center gap-2 bg-[#0055a2] text-white px-5 py-2.5 rounded-lg hover:bg-[#004488] transition-colors text-sm font-medium"
            >
              Ir a mis pedidos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-[#212121]">{order.name}</h1>
                    <p className="text-sm text-[#717182] mt-1">
                      {formatOrderDate(order.processedAt)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-[#0055a2]">
                      ${order.totalPrice.toFixed(2)} {order.currencyCode}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 sm:justify-end">
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
              </div>

              <div className="p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-[#212121] mb-4">Productos</h2>
                <ul className="divide-y divide-gray-100">
                  {order.lineItems.map((item, index) => (
                    <li
                      key={`${item.variantId ?? item.title}-${index}`}
                      className="flex gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {item.productHandle ? (
                          <Link
                            to={`/producto/${item.productHandle}`}
                            className="font-medium text-[#212121] hover:text-[#0055a2] line-clamp-2"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <p className="font-medium text-[#212121] line-clamp-2">{item.title}</p>
                        )}
                        <p className="text-sm text-[#717182] mt-1">Cantidad: {item.quantity}</p>
                        {!canReorderItem(item) && (
                          <p className="text-xs text-amber-700 mt-1">No disponible para reordenar</p>
                        )}
                      </div>

                      {item.unitPrice != null && (
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-[#212121]">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-[#717182] mt-0.5">
                              ${item.unitPrice.toFixed(2)} c/u
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleReorder}
                disabled={cartLoading || reorderableItems.length === 0}
                className="inline-flex items-center justify-center gap-2 bg-[#0055a2] text-white px-5 py-3 rounded-lg hover:bg-[#004488] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {cartLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Agregando al carrito...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Volver a pedir
                  </>
                )}
              </button>

              <Link
                to="/carrito"
                className="inline-flex items-center justify-center gap-2 border border-[#0055a2] text-[#0055a2] px-5 py-3 rounded-lg hover:bg-[#f0f7ff] transition-colors text-sm font-medium"
              >
                <ShoppingCart className="w-4 h-4" />
                Ver carrito
              </Link>

              {order.statusUrl && (
                <a
                  href={order.statusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-gray-200 text-[#717182] px-5 py-3 rounded-lg hover:border-gray-300 hover:text-[#212121] transition-colors text-sm font-medium"
                >
                  Estado de pago
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {reorderError && (
              <p className="text-sm text-red-600">{reorderError}</p>
            )}
            {reorderMessage && (
              <p className="text-sm text-green-700">{reorderMessage}</p>
            )}

            {skippedCount > 0 && reorderableItems.length > 0 && (
              <p className="text-sm text-[#717182]">
                {skippedCount} producto{skippedCount === 1 ? '' : 's'} de este pedido ya no
                {' '}está{skippedCount === 1 ? '' : 'n'} disponible{skippedCount === 1 ? '' : 's'} y no se
                {' '}incluirá{skippedCount === 1 ? '' : 'n'} al volver a pedir.
              </p>
            )}

            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-sm text-[#0055a2] hover:text-[#004488] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
