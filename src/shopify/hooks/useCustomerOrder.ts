import { useCallback, useEffect, useState } from 'react';
import { fetchCustomerOrderByNumber, type CustomerOrder } from '@/shopify/customerOrders';

export const useCustomerOrder = (
  customerAccessToken: string | undefined,
  orderNumber: number | undefined,
) => {
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customerAccessToken || !orderNumber || !Number.isFinite(orderNumber)) {
      setOrder(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCustomerOrderByNumber(customerAccessToken, orderNumber);

      if (!result) {
        setOrder(null);
        setError('No encontramos este pedido en tu cuenta.');
        return;
      }

      setOrder(result);
    } catch {
      setError('Error al cargar el pedido.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [customerAccessToken, orderNumber]);

  useEffect(() => {
    load();
  }, [load]);

  return { order, loading, error, refresh: load };
};
