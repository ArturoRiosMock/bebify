/** Producto disponible para venta (Shopify availableForSale). */
export const isProductInStock = (product: { inStock?: boolean }): boolean =>
  product.inStock !== false;

/** Disponibles primero; agotados al final conservando el orden relativo de cada grupo. */
export const sortProductsInStockFirst = <T extends { inStock?: boolean }>(products: T[]): T[] => {
  const inStock: T[] = [];
  const outOfStock: T[] = [];

  for (const product of products) {
    if (isProductInStock(product)) {
      inStock.push(product);
    } else {
      outOfStock.push(product);
    }
  }

  return [...inStock, ...outOfStock];
};
