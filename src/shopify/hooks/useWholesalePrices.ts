import { useEffect, useState } from 'react';

export type WholesalePriceMap = Record<string, number>;

export const useWholesalePrices = (
  customerAccessToken: string | undefined,
  variantIds: string[],
) => {
  const [prices, setPrices] = useState<WholesalePriceMap>({});
  const [hasWholesale, setHasWholesale] = useState(false);
  const [loading, setLoading] = useState(false);

  const variantKey = variantIds.slice().sort().join('|');

  useEffect(() => {
    if (!customerAccessToken || customerAccessToken === 'demo-token' || variantIds.length === 0) {
      setPrices({});
      setHasWholesale(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch('/api/wholesale-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerAccessToken, variantIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPrices(data?.prices ?? {});
        setHasWholesale(Boolean(data?.wholesale && Object.keys(data?.prices ?? {}).length > 0));
      })
      .catch(() => {
        if (!cancelled) {
          setPrices({});
          setHasWholesale(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [customerAccessToken, variantKey]);

  return { prices, hasWholesale, loading };
};
