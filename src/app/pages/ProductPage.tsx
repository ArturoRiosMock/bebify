import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductDetail } from '@/app/components/ProductDetail';
import { JsonLd } from '@/app/components/JsonLd';
import { getProductByHandle } from '@/shopify/products';
import { resolveProductHandleRedirect } from '@/shopify/product-handle-redirects';
import { useShopifyProducts } from '@/shopify/hooks/useShopifyProducts';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { absoluteUrl } from '@/content/mrbrown/seo-defaults';
import type { Product } from '@/shopify/types';

const truncate = (text: string, max: number) => {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
};

const buildProductSchema = (product: Product) => {
  const path = product.handle ? `/producto/${product.handle}` : `/producto/${product.id}`;
  const canonical = absoluteUrl(path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.length ? product.images : product.image ? [product.image] : undefined,
    description:
      product.description?.replace(/\s+/g, ' ').trim().slice(0, 500) || undefined,
    sku: product.shopifyId,
    brand: product.vendor
      ? { '@type': 'Brand', name: product.vendor }
      : undefined,
    category: product.category || undefined,
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'MXN',
      price: product.price.toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
};

export const ProductPage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { products: allProducts } = useShopifyProducts();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!handle) return;
      setLoading(true);
      setError(null);
      try {
        // Primero el mapa local: evita 404 / fuzzy-match con handles SKU ya renombrados.
        const redirected = await resolveProductHandleRedirect(handle);
        if (redirected) {
          navigate(`/producto/${redirected}`, { replace: true });
          return;
        }

        const fetched = await getProductByHandle(handle);
        if (fetched) {
          if (fetched.handle && fetched.handle !== handle) {
            navigate(`/producto/${fetched.handle}`, { replace: true });
            return;
          }
          setProduct(fetched);
          return;
        }

        setError('Producto no encontrado');
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [handle, navigate]);

  const handleProductClick = (p: Product) => {
    navigate(`/producto/${p.handle || p.id}`);
  };

  const metaDescription = product
    ? product.seoDescription ||
      truncate(
        [
          product.vendor && `Marca: ${product.vendor}.`,
          product.beverageType && `Tipo: ${product.beverageType}.`,
          product.abvLabel && `Graduación ${product.abvLabel}.`,
          product.volumeLabel && `Contenido ${product.volumeLabel}.`,
          `Precio $${product.price.toFixed(2)} MXN.`,
          'Compra en Mr. Brown con envío rápido en CDMX.',
          product.description ? truncate(product.description, 80) : '',
        ]
          .filter(Boolean)
          .join(' '),
        160,
      )
    : undefined;

  useDocumentMeta({
    title: product?.seoTitle || product?.name,
    description: metaDescription,
    canonicalPath: product?.handle ? `/producto/${product.handle}` : undefined,
    ogImage: product?.image,
    imageAlt: product ? `${product.name} — Mr. Brown` : undefined,
    ogType: 'product',
    priceAmount: product?.price,
    priceCurrency: 'MXN',
    availability: product
      ? product.availableForSale === false
        ? 'out of stock'
        : 'in stock'
      : undefined,
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-lg p-6">
          <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            <div className="h-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-[#717182] text-lg mb-4">{error || 'Producto no encontrado'}</p>
        <button
          onClick={() => navigate('/')}
          className="inline-block bg-[#0c3c1f] text-white px-6 py-3 rounded-lg hover:bg-[#0a3019] transition-colors font-medium"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <>
      <JsonLd schema={buildProductSchema(product)} />
      <ProductDetail
        product={product}
        allProducts={allProducts}
        onBack={() => navigate(-1)}
        onProductClick={handleProductClick}
      />
    </>
  );
};
