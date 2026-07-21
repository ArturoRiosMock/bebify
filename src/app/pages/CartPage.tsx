import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Breadcrumbs } from '@/app/components/Breadcrumbs';
import { useCart } from '@/app/context/CartContext';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { PurchaseTypeDialog, type EventFormData } from '@/app/components/PurchaseTypeDialog';

type SharedCartLine = {
  variantId: string;
  quantity: number;
};

export const CartPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const cartLinkId = searchParams.get('cart_link_id');

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
    importSharedCart,
  } = useCart();

  const [importState, setImportState] = useState<'idle' | 'loading' | 'done' | 'error'>(
    cartLinkId ? 'loading' : 'idle',
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [showPurchaseType, setShowPurchaseType] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useDocumentMeta({
    title: 'Carrito de compras',
    description: 'Revisa los productos en tu carrito y continúa al pago en Mr. Brown.',
    canonicalPath: '/cart',
  });

  const importAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!cartLinkId || !importSharedCart) {
      if (!cartLinkId) setImportState('idle');
      return;
    }

    if (importAttemptRef.current === cartLinkId) return;
    importAttemptRef.current = cartLinkId;

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);

    const run = async () => {
      setImportState('loading');
      setImportError(null);

      try {
        const country = searchParams.get('country') || 'MX';
        const res = await fetch(
          `/api/cart-link?cart_link_id=${encodeURIComponent(cartLinkId)}&country=${encodeURIComponent(country)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          ok: boolean;
          lines?: SharedCartLine[];
          error?: string;
        };

        if (cancelled) return;

        if (!res.ok || !data.ok) {
          setImportState('error');
          setImportError(data.error ?? 'No se pudo importar el carrito compartido.');
          return;
        }

        if (!data.lines?.length) {
          setImportState('done');
          setImportError('Este enlace no tiene productos o ya expiró.');
        } else {
          const ok = await importSharedCart(data.lines);
          if (!ok) {
            setImportState('error');
            setImportError('No se pudieron agregar los productos al carrito.');
            return;
          }
          setImportState('done');
        }

        const next = new URLSearchParams(searchParams);
        next.delete('cart_link_id');
        next.delete('country');
        setSearchParams(next, { replace: true });
      } catch {
        if (!cancelled) {
          setImportState('error');
          setImportError(
            controller.signal.aborted
              ? 'La importación tardó demasiado. Intenta de nuevo o agrega productos manualmente.'
              : 'Error de conexión al cargar el carrito compartido.',
          );
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [cartLinkId, importSharedCart, searchParams, setSearchParams]);

  const itemId = (item: { lineId?: string; id: number | string }) => item.lineId ?? item.id;

  const handleCheckout = () => {
    if (isShopifyCart && goToCheckout) {
      setShowPurchaseType(true);
      return;
    }
    clearCart();
  };

  const handleConfirmPurchaseType = async (eventData: EventFormData | null) => {
    setCheckoutLoading(true);
    try {
      if (updateAttributes) {
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
      await goToCheckout?.();
      setShowPurchaseType(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isLoading =
    importState === 'loading' ||
    (!cartLinkId && cartLoading && cartItems.length === 0 && importState === 'idle');
  const displayError = importError || cartError;

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Inicio', to: '/' },
              { label: 'Carrito', to: '/cart' },
            ]}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="w-7 h-7 text-[#0c3c1f]" aria-hidden />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0c3c1f]">
            Carrito de compras
            {getTotalItems() > 0 ? ` (${getTotalItems()})` : ''}
          </h1>
        </div>

        {importState === 'loading' && (
          <div className="mb-6 rounded-xl border border-[#0c3c1f]/20 bg-[#0c3c1f]/5 px-4 py-3 text-sm text-[#0c3c1f]">
            Importando carrito compartido…
          </div>
        )}

        {displayError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {displayError}
          </div>
        )}

        {isLoading && cartItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-[#717182]">
            Cargando carrito…
          </div>
        ) : cartItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" aria-hidden />
            <p className="text-lg text-[#717182] mb-6">Tu carrito está vacío en este momento.</p>
            <Link
              to="/productos"
              className="inline-block bg-[#0c3c1f] text-white px-6 py-3 rounded-lg hover:bg-[#0a3019] transition-colors font-medium"
            >
              Continuar comprando
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-3">
              {cartItems.map((item) => (
                <li
                  key={item.lineId ?? String(item.id)}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4"
                >
                  <img
                    src={item.image || 'https://placehold.co/96x96?text=Sin+imagen'}
                    alt={item.name}
                    className="w-20 h-20 object-contain rounded-lg bg-gray-50 p-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#212121] line-clamp-2">{item.name}</p>
                    {item.cantidadLabel && (
                      <p className="text-xs text-[#717182] mt-1">{item.cantidadLabel}</p>
                    )}
                    <p className="text-[#0c3c1f] font-bold mt-2">${item.price.toFixed(2)} MXN</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(itemId(item), item.quantity - 1)}
                        disabled={cartLoading}
                        className="bg-gray-50 border border-gray-200 p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        aria-label={`Disminuir cantidad de ${item.name}`}
                      >
                        <Minus className="w-4 h-4" aria-hidden />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(itemId(item), item.quantity + 1)}
                        disabled={cartLoading}
                        className="bg-gray-50 border border-gray-200 p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        aria-label={`Aumentar cantidad de ${item.name}`}
                      >
                        <Plus className="w-4 h-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(itemId(item))}
                        disabled={cartLoading}
                        className="ml-auto text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-md disabled:opacity-50"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-medium text-[#212121]">Total</span>
                <span className="text-[#0c3c1f] text-xl font-bold">
                  ${getTotalPrice().toFixed(2)} MXN
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cartLoading}
                className="w-full bg-[#0c3c1f] text-white py-3.5 rounded-lg hover:bg-[#0a3019] transition-colors disabled:opacity-50 font-bold text-base"
              >
                {isShopifyCart ? 'Continuar al pago' : 'Finalizar compra'}
              </button>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/productos"
                  className="flex-1 text-center border border-gray-300 text-[#212121] py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Seguir comprando
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cartLoading}
                  className="flex-1 border border-gray-300 text-[#717182] py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PurchaseTypeDialog
        open={showPurchaseType}
        onClose={() => setShowPurchaseType(false)}
        onConfirm={handleConfirmPurchaseType}
        loading={checkoutLoading}
        error={cartError}
      />
    </div>
  );
};
