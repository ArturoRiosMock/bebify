import type { CartItem } from '@/app/context/CartContext';

export type WholesalePriceMap = Record<string, number>;

export function getWholesaleUnitPrice(
  item: CartItem,
  prices: WholesalePriceMap,
): number | undefined {
  if (!item.variantId) {
    return undefined;
  }

  const wholesaleUnit = prices[item.variantId];
  if (wholesaleUnit == null || wholesaleUnit >= item.price) {
    return undefined;
  }

  return wholesaleUnit;
}

export function computeCartWholesaleSummary(
  items: CartItem[],
  prices: WholesalePriceMap,
) {
  let retailSubtotal = 0;
  let effectiveSubtotal = 0;

  for (const item of items) {
    const lineRetail = item.price * item.quantity;
    retailSubtotal += lineRetail;
    const wholesaleUnit = getWholesaleUnitPrice(item, prices);
    effectiveSubtotal += (wholesaleUnit ?? item.price) * item.quantity;
  }

  const savings = +(retailSubtotal - effectiveSubtotal).toFixed(2);

  return {
    retailSubtotal,
    effectiveSubtotal,
    savings,
    hasWholesaleDiscount: savings > 0,
  };
}
