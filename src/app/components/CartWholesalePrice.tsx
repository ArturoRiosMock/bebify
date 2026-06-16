import React from 'react';
import type { CartItem } from '@/app/context/CartContext';
import {
  computeCartWholesaleSummary,
  getWholesaleUnitPrice,
  type WholesalePriceMap,
} from '@/app/utils/cartWholesalePricing';

interface CartLineWholesalePriceProps {
  item: CartItem;
  prices: WholesalePriceMap;
  showLineTotal?: boolean;
  className?: string;
}

export const CartLineWholesalePrice: React.FC<CartLineWholesalePriceProps> = ({
  item,
  prices,
  showLineTotal = false,
  className = '',
}) => {
  const wholesaleUnit = getWholesaleUnitPrice(item, prices);
  const unitPrice = wholesaleUnit ?? item.price;
  const displayPrice = showLineTotal ? unitPrice * item.quantity : unitPrice;
  const retailDisplay = showLineTotal ? item.price * item.quantity : item.price;

  if (wholesaleUnit == null) {
    return (
      <p className={`text-[#0055a2] font-bold ${className}`}>
        ${displayPrice.toFixed(2)} MXN
      </p>
    );
  }

  const savings = (item.price - wholesaleUnit) * item.quantity;

  return (
    <div className={className}>
      <p className="text-xs text-[#717182] line-through">${retailDisplay.toFixed(2)} MXN</p>
      <p className="text-[#0055a2] font-bold">${displayPrice.toFixed(2)} MXN</p>
      <p className="text-xs text-green-700 font-medium mt-0.5">
        Precio B2B
        {showLineTotal && savings > 0 ? ` · ahorras $${savings.toFixed(2)}` : ''}
      </p>
    </div>
  );
};

interface CartWholesaleSubtotalProps {
  items: CartItem[];
  prices: WholesalePriceMap;
  size?: 'md' | 'lg';
}

export const CartWholesaleSubtotal: React.FC<CartWholesaleSubtotalProps> = ({
  items,
  prices,
  size = 'lg',
}) => {
  const { retailSubtotal, effectiveSubtotal, savings, hasWholesaleDiscount } =
    computeCartWholesaleSummary(items, prices);

  const amountClass = size === 'lg' ? 'text-2xl' : 'text-xl';

  if (!hasWholesaleDiscount) {
    return (
      <span className={`text-[#0055a2] ${amountClass} font-bold`}>
        ${effectiveSubtotal.toFixed(2)} MXN
      </span>
    );
  }

  return (
    <div className="text-right">
      <p className="text-sm text-[#717182] line-through">${retailSubtotal.toFixed(2)} MXN</p>
      <p className={`text-[#0055a2] ${amountClass} font-bold`}>
        ${effectiveSubtotal.toFixed(2)} MXN
      </p>
      <p className="text-xs text-green-700 font-medium mt-1">
        Descuento B2B: −${savings.toFixed(2)} MXN
      </p>
    </div>
  );
};
