import { shopifyClient, GET_CART, CREATE_CART, ADD_TO_CART, UPDATE_CART_LINES, REMOVE_FROM_CART } from './queries';
import { shopifyConfig } from './config';
import type { ShopifyCart } from './types';

/**
 * Servicio para gestionar el carrito de Shopify
 */

// Crear un nuevo carrito
export const createCart = async (): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(CREATE_CART, {
      input: {
        lines: []
      }
    });

    if (data.cartCreate.userErrors.length > 0) {
      console.error('Error creating cart:', data.cartCreate.userErrors);
      return null;
    }

    return data.cartCreate.cart;
  } catch (error) {
    console.error('Error creating cart:', error);
    return null;
  }
};

// Crear carrito con líneas iniciales (p. ej. enlace compartido cart_link_id)
export const createCartWithLines = async (
  lines: Array<{ merchandiseId: string; quantity: number }>,
): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(CREATE_CART, {
      input: { lines },
    });

    if (data.cartCreate.userErrors.length > 0) {
      console.error('Error creating cart with lines:', data.cartCreate.userErrors);
      return null;
    }

    return data.cartCreate.cart;
  } catch (error) {
    console.error('Error creating cart with lines:', error);
    return null;
  }
};

// Agregar item al carrito
export const addToShopifyCart = async (
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(ADD_TO_CART, {
      cartId,
      lines: [
        {
          merchandiseId: variantId,
          quantity
        }
      ]
    });

    if (data.cartLinesAdd.userErrors.length > 0) {
      console.error('Error adding to cart:', data.cartLinesAdd.userErrors);
      return null;
    }

    return data.cartLinesAdd.cart;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return null;
  }
};

// Actualizar cantidad de un item en el carrito
export const updateCartLine = async (
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(UPDATE_CART_LINES, {
      cartId,
      lines: [
        {
          id: lineId,
          quantity
        }
      ]
    });

    if (data.cartLinesUpdate.userErrors.length > 0) {
      console.error('Error updating cart:', data.cartLinesUpdate.userErrors);
      return null;
    }

    return data.cartLinesUpdate.cart;
  } catch (error) {
    console.error('Error updating cart:', error);
    return null;
  }
};

// Remover item del carrito
export const removeFromShopifyCart = async (
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(REMOVE_FROM_CART, {
      cartId,
      lineIds
    });

    if (data.cartLinesRemove.userErrors.length > 0) {
      console.error('Error removing from cart:', data.cartLinesRemove.userErrors);
      return null;
    }

    return data.cartLinesRemove.cart;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return null;
  }
};

// Obtener carrito por ID
export const getCart = async (cartId: string): Promise<ShopifyCart | null> => {
  try {
    const data: any = await shopifyClient.request(GET_CART, { id: cartId });
    return data.cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

// Obtener o crear un carrito
export const getOrCreateCart = async (): Promise<ShopifyCart | null> => {
  const existingCartId = localStorage.getItem('shopifyCartId');

  if (existingCartId) {
    const fullCart = await getCart(existingCartId);
    if (fullCart) return fullCart;
    localStorage.removeItem('shopifyCartId');
  }

  const newCart = await createCart();
  if (newCart) {
    localStorage.setItem('shopifyCartId', newCart.id);
  }
  return newCart;
};

// Limpiar el carrito del localStorage
export const clearCart = (): void => {
  localStorage.removeItem('shopifyCartId');
};

// Dominio nativo de Shopify para el checkout (siempre .myshopify.com)
const SHOPIFY_CHECKOUT_DOMAIN = 'mrbrownmx.myshopify.com';
const CHECKOUT_LOCALE = 'es';

/**
 * Normaliza checkoutUrl de la Storefront API al checkout nativo de Shopify.
 * La API suele devolver /cart/c/{token}?key=…; en .myshopify.com eso falla
 * tras volver atrás desde checkout — hay que usar /checkouts/cn/{token}/{locale}.
 */
export function normalizeCheckoutUrl(checkoutUrl: string): string {
  let url = checkoutUrl.replace(
    /https?:\/\/[^/]+/,
    `https://${SHOPIFY_CHECKOUT_DOMAIN}`
  );

  const cartPermalink = url.match(/\/cart\/c\/([^/?]+)/);
  if (cartPermalink) {
    return `https://${SHOPIFY_CHECKOUT_DOMAIN}/checkouts/cn/${cartPermalink[1]}/${CHECKOUT_LOCALE}`;
  }

  return url;
}

// Redirigir al checkout de Shopify
export const redirectToCheckout = (checkoutUrl: string): void => {
  window.location.href = normalizeCheckoutUrl(checkoutUrl);
};
