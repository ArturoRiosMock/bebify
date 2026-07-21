import React, { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '@/app/components/Hero';
import { FlashDeals } from '@/app/components/FlashDeals';
import { BrandsSection } from '@/app/components/BrandsSection';
import { Newsletter } from '@/app/components/Newsletter';
import { FAQ } from '@/app/components/FAQ';
import { ProductCard } from '@/app/components/ProductCard';
import { AdBanner, getInlineAdSlots } from '@/app/components/AdBanner';
import { JsonLd } from '@/app/components/JsonLd';
import { HomeRegisterBanner } from '@/app/components/HomeRegisterBanner';
import { HomeAbout } from '@/app/components/HomeAbout';
import { HomeBenefits } from '@/app/components/HomeBenefits';
import { HomeContentContext } from '@/app/context/HomeContentContext';
import { useHomeContent } from '@/app/hooks/useHomeContent';
import { useShopifyProducts } from '@/shopify/hooks/useShopifyProducts';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';
import { organizationSchema, websiteSchema } from '@/content/mrbrown/seo-defaults';

/** Handle esperado; si Admin usa otro, el fallback por título lo corrige. */
const HOME_FEATURED_COLLECTION_HANDLE = 'los-favoritos-del-club';
const HOME_FEATURED_COLLECTION_TITLE = 'Los Favoritos del Club';

type GridItem =
  | { kind: 'product'; product: ReturnType<typeof useShopifyProducts>['products'][number] }
  | { kind: 'ad'; slotId: string };

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const productsRef = useRef<HTMLElement>(null);
  const { content } = useHomeContent();
  const { products, loading, error } = useShopifyProducts(
    HOME_FEATURED_COLLECTION_HANDLE,
    HOME_FEATURED_COLLECTION_TITLE
  );

  useDocumentMeta({
    // Sin `title` → usa DEFAULT_TITLE (ya optimizado para la home).
    description:
      'Compra bebidas premium en línea: tequila, whisky, mezcal, vinos y mixología con envío rápido en CDMX. 100% originales y barras para eventos sociales y corporativos.',
    canonicalPath: '/',
  });

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const inlineAds = useMemo(() => getInlineAdSlots('home'), []);

  const gridItems = useMemo<GridItem[]>(() => {
    const items: GridItem[] = [];
    let adIndex = 0;
    let productIndex = 0;
    let position = 0;

    while (productIndex < products.length || adIndex < inlineAds.length) {
      if (adIndex < inlineAds.length && position === inlineAds[adIndex].position - 1) {
        items.push({ kind: 'ad', slotId: inlineAds[adIndex].slotId });
        adIndex++;
        position++;
        continue;
      }

      if (productIndex < products.length) {
        items.push({ kind: 'product', product: products[productIndex] });
        productIndex++;
        position++;
      } else {
        break;
      }
    }

    return items;
  }, [products, inlineAds]);

  const midBannerAfter = 8;
  const beforeMidBanner = gridItems.slice(0, midBannerAfter);
  const afterMidBanner = gridItems.slice(midBannerAfter);
  const featuredTitle = content.carousels.featuredTitle || HOME_FEATURED_COLLECTION_TITLE;

  return (
    <HomeContentContext.Provider value={content}>
      <JsonLd schema={[organizationSchema(), websiteSchema()]} />
      <Hero onShopNowClick={scrollToProducts} />

      <AdBanner
        slotId="home-hero-below"
        containerClassName="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-[100vw]"
      />

      <FlashDeals />

      <HomeRegisterBanner />

      <section ref={productsRef} className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-[100vw]">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-[#212121]">{featuredTitle}</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex gap-2 sm:gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="shrink-0 w-[calc((100%-0.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)] h-60 sm:h-80 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-[#717182] text-center py-12">
            Pronto tendremos novedades en {featuredTitle}.
          </p>
        ) : (
          <>
            <div
              className="flex gap-2 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4"
              style={{ scrollbarWidth: 'thin' }}
            >
              {beforeMidBanner.map((item, i) => (
                <div
                  key={
                    item.kind === 'product'
                      ? `p-${item.product.id}`
                      : `ad-${item.slotId}-${i}`
                  }
                  className="snap-start shrink-0 w-[calc((100%-0.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
                >
                  {item.kind === 'product' ? (
                    <ProductCard
                      product={item.product}
                      onClick={() =>
                        navigate(`/producto/${item.product.handle || item.product.id}`)
                      }
                    />
                  ) : (
                    <AdBanner slotId={item.slotId} variant="inline-card" />
                  )}
                </div>
              ))}
            </div>

            {afterMidBanner.length > 0 && (
              <AdBanner
                slotId="home-products-mid"
                containerClassName="my-4 sm:my-8"
              />
            )}

            {afterMidBanner.length > 0 && (
              <div
                className="flex gap-2 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4"
                style={{ scrollbarWidth: 'thin' }}
              >
                {afterMidBanner.map((item, i) => (
                  <div
                    key={
                      item.kind === 'product'
                        ? `p-${item.product.id}`
                        : `ad-${item.slotId}-${i}`
                    }
                    className="snap-start shrink-0 w-[calc((100%-0.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
                  >
                    {item.kind === 'product' ? (
                      <ProductCard
                        product={item.product}
                        onClick={() =>
                          navigate(`/producto/${item.product.handle || item.product.id}`)
                        }
                      />
                    ) : (
                      <AdBanner slotId={item.slotId} variant="inline-card" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <BrandsSection />

      <AdBanner
        slotId="home-brands-below"
        containerClassName="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-[100vw]"
      />

      <HomeAbout />

      <Newsletter />
      <FAQ />

      <AdBanner
        slotId="home-faq-below"
        variant="leaderboard"
        containerClassName="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-[100vw]"
      />

      <HomeBenefits />
    </HomeContentContext.Provider>
  );
};
