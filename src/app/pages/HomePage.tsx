import React, { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '@/app/components/Hero';
import { FlashDeals } from '@/app/components/FlashDeals';
import { BrandsSection } from '@/app/components/BrandsSection';
import { About } from '@/app/components/About';
import { ProductsCarousel } from '@/app/components/ProductsCarousel';
import { RegisterBanner } from '@/app/components/RegisterBanner';
import { useShopifyProducts, useShopifyLatestProducts } from '@/shopify/hooks/useShopifyProducts';
import { HomeContentContext } from '@/app/context/HomeContentContext';
import { useHomeContent } from '@/app/hooks/useHomeContent';

const PRODUCTS_PER_CAROUSEL = 20;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const productsRef = useRef<HTMLDivElement>(null);
  const { products, loading, error } = useShopifyProducts();
  const { products: latestProducts } = useShopifyLatestProducts(PRODUCTS_PER_CAROUSEL);
  const { content } = useHomeContent();

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const featuredProducts = useMemo(
    () => products.slice(0, PRODUCTS_PER_CAROUSEL),
    [products],
  );

  const newArrivals = useMemo(() => {
    if (latestProducts.length > 0) {
      return latestProducts.slice(0, PRODUCTS_PER_CAROUSEL);
    }
    return products.slice(-PRODUCTS_PER_CAROUSEL).reverse();
  }, [latestProducts, products]);

  const newArrivalsHref = '/productos';

  const handleProductClick = (handleOrId: string) => {
    navigate(`/producto/${handleOrId}`);
  };

  return (
    <HomeContentContext.Provider value={content}>
      <Hero onShopNowClick={scrollToProducts} />

      <FlashDeals />

      <div ref={productsRef}>
        {error && (
          <div className="container mx-auto px-3 sm:px-4 mt-4">
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
          </div>
        )}

        {loading && (
          <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-10 max-w-[100vw]">
            <div className="h-7 w-40 bg-gray-100 rounded mb-6 animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </section>
        )}

        {!loading && (
          <>
            <ProductsCarousel
              title={content.carousels.featuredTitle}
              products={featuredProducts}
              onProductClick={(p) => handleProductClick(p.handle || p.id)}
            />

            {newArrivals.length > 0 && (
              <ProductsCarousel
                title={content.carousels.newArrivalsTitle}
                products={newArrivals}
                onProductClick={(p) => handleProductClick(p.handle || p.id)}
                cornerBadge="Nuevo"
                viewAllHref={newArrivalsHref}
              />
            )}
          </>
        )}
      </div>

      <BrandsSection />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-[100vw]">
        <RegisterBanner />
      </div>

      <About />

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.benefits.map((benefit, index) => {
              const isBlog = index === 3;

              if (isBlog) {
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => navigate('/blog')}
                    className="text-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0055a2] focus-visible:ring-offset-2 rounded-lg"
                  >
                    <div className="w-16 h-16 bg-[#0055a2]/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors group-hover:bg-[#0055a2]/20">
                      <span className="text-[#0055a2] text-2xl">{benefit.icon}</span>
                    </div>
                    <h3 className="text-[#212121] mb-2 group-hover:text-[#0055a2] transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-[#717182]">{benefit.description}</p>
                  </button>
                );
              }

              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-[#0055a2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-[#0055a2] text-2xl">{benefit.icon}</span>
                  </div>
                  <h3 className="text-[#212121] mb-2">{benefit.title}</h3>
                  <p className="text-[#717182]">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </HomeContentContext.Provider>
  );
};
