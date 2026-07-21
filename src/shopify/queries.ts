import { GraphQLClient } from 'graphql-request';
import { shopifyConfig, getStorefrontApiUrl } from './config';

// Cliente de GraphQL para Shopify Storefront API
export const shopifyClient = new GraphQLClient(getStorefrontApiUrl(), {
  headers: {
    'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontAccessToken,
    'Content-Type': 'application/json',
  },
});

// Query para obtener productos
export const GET_PRODUCTS = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          description
          descriptionHtml
          handle
          productType
          vendor
          tags
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                image {
                  url
                  altText
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// Query para obtener productos por colección
export const GET_PRODUCTS_BY_COLLECTION = `
  query GetProductsByCollection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      title
      description
      handle
      image {
        url
        altText
      }
      products(first: $first) {
        edges {
          node {
            id
            title
            description
            descriptionHtml
            handle
            productType
            vendor
            tags
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Query para obtener un producto por handle
export const GET_PRODUCT_BY_HANDLE = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      descriptionHtml
      handle
      productType
      vendor
      tags
      seo {
        title
        description
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            availableForSale
            image {
              url
              altText
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;

// Query para obtener colecciones
export const GET_COLLECTIONS = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          image {
            url
            altText
          }
        }
      }
    }
  }
`;

// Query para obtener un carrito por ID
export const GET_CART = `
  query GetCart($id: ID!) {
    cart(id: $id) {
      id
      checkoutUrl
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
        totalTaxAmount {
          amount
          currencyCode
        }
      }
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  id
                  title
                  handle
                }
                image {
                  url
                  altText
                }
                price {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
      totalQuantity
    }
  }
`;

// Mutation para crear un carrito
export const CREATE_CART = `
  mutation CreateCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
        }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    id
                    title
                    handle
                  }
                  image {
                    url
                    altText
                  }
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Mutation para agregar items al carrito
export const ADD_TO_CART = `
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
        }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    id
                    title
                    handle
                  }
                  image {
                    url
                    altText
                  }
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Mutation para actualizar items del carrito
export const UPDATE_CART_LINES = `
  mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    id
                    title
                    handle
                  }
                  image {
                    url
                    altText
                  }
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Mutation para remover items del carrito
export const REMOVE_FROM_CART = `
  mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    id
                    title
                    handle
                  }
                  image {
                    url
                    altText
                  }
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// === BLOG ===

/** Lista los blogs disponibles en la tienda. */
export const GET_BLOGS = `
  query GetBlogs($first: Int!) {
    blogs(first: $first) {
      edges {
        node {
          handle
          title
        }
      }
    }
  }
`;

/**
 * Lista artículos del blog principal de Shopify.
 * Si no se pasa `blogHandle`, se usa el primer blog disponible (Shopify crea
 * uno por defecto llamado "news").
 */
export const GET_ARTICLES = `
  query GetArticles($first: Int!, $blogHandle: String) {
    blog(handle: $blogHandle) {
      id
      handle
      title
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            id
            handle
            title
            excerpt
            publishedAt
            tags
            authorV2 {
              name
            }
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
    }
  }
`;

/** Lista todos los artículos del shop (atajo cuando no se conoce el blog handle). */
export const GET_ALL_ARTICLES = `
  query GetAllArticles($first: Int!) {
    articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
      edges {
        node {
          id
          handle
          title
          excerpt
          publishedAt
          tags
          authorV2 {
            name
          }
          blog {
            handle
            title
          }
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
`;

/** Trae un artículo concreto por su handle, dentro de un blog específico. */
export const GET_ARTICLE_BY_HANDLE = `
  query GetArticleByHandle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      id
      handle
      title
      articleByHandle(handle: $articleHandle) {
        id
        handle
        title
        excerpt
        contentHtml
        publishedAt
        tags
        authorV2 {
          name
          bio
        }
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
`;

// Query para buscar productos
export const SEARCH_PRODUCTS = `
  query SearchProducts($query: String!, $first: Int!) {
    search(query: $query, first: $first, types: PRODUCT) {
      edges {
        node {
          ... on Product {
            id
            title
            description
            descriptionHtml
            handle
            productType
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
