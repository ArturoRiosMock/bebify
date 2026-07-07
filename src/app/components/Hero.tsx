import React, { useMemo } from 'react';
import Slider, { Settings } from 'react-slick';
import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import heroSlide1 from '@/assets/hero-slideshow-1.jpg';
import { useHomeContentValue } from '@/app/context/HomeContentContext';
import type { HeroSlide } from '@/types/homeContent';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface HeroProps {
  onShopNowClick: () => void;
}

const GIFFARD_DESKTOP = '/banners/hero-giffard-desktop.jpeg';
const GIFFARD_MOBILE = '/banners/hero-giffard-mobile.jpeg';

const SLIDER_SETTINGS: Settings = {
  dots: true,
  infinite: true,
  speed: 600,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 6000,
  fade: true,
  arrows: false,
  pauseOnHover: true,
};

function resolveSlideImages(slide: HeroSlide, index: number) {
  const desktop =
    slide.imageDesktop ||
    (index === 0 ? heroSlide1 : GIFFARD_DESKTOP);
  const mobile = slide.imageMobile
    || (slide.imageOnly ? null : slide.imageDesktop)
    || (index === 0 ? heroSlide1 : GIFFARD_MOBILE);

  return { desktop, mobile };
}

function HeroSlideContent({
  slide,
  index,
  onShopNowClick,
}: {
  slide: HeroSlide;
  index: number;
  onShopNowClick: () => void;
}) {
  const { desktop, mobile } = resolveSlideImages(slide, index);
  const showOverlay = !slide.imageOnly;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px]">
      {slide.imageOnly ? (
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop} />
          <img
            src={mobile}
            alt={slide.title || 'Banner promocional'}
            className="w-full h-full object-contain bg-[#d1e9f6]"
          />
        </picture>
      ) : (
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop} />
          <img
            src={mobile}
            alt={slide.title || 'Banner promocional'}
            className="w-full h-full object-cover"
          />
        </picture>
      )}

      {showOverlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 md:px-8 lg:px-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="max-w-2xl"
              >
                {slide.badge && (
                  <div className="inline-block mb-4">
                    <div className="bg-[#0055a2] text-white px-4 py-2 rounded-full text-sm font-bold">
                      {slide.badge}
                    </div>
                  </div>
                )}

                {slide.title && (
                  <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                    {slide.title}
                  </h1>
                )}

                {slide.subtitle && (
                  <p className="text-white/90 text-lg md:text-xl mb-8 max-w-lg">{slide.subtitle}</p>
                )}

                {slide.buttonText && (
                  <button
                    type="button"
                    onClick={onShopNowClick}
                    className="bg-[#0055a2] text-white px-8 py-3 rounded-lg hover:bg-[#004488] transition-colors font-bold text-sm flex items-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {slide.buttonText}
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const Hero = ({ onShopNowClick }: HeroProps) => {
  const content = useHomeContentValue();

  const slides = useMemo(() => {
    if (content.hero.slides?.length) return content.hero.slides;
    return [
      {
        imageMobile: '',
        imageDesktop: '',
        title: 'La Plataforma de Bebidas B2B',
        subtitle:
          'Centraliza tus compras de bebidas con acceso a más de 2,000 productos de más de 200 proveedores',
        badge: 'B2B',
        buttonText: 'EXPLORAR CATÁLOGO',
      },
      {
        imageMobile: '/banners/hero-giffard-mobile.jpeg',
        imageDesktop: '/banners/hero-giffard-desktop.jpeg',
        title: 'Giffard Próximamente',
        subtitle: '',
        badge: '',
        buttonText: '',
        imageOnly: true,
      },
    ] satisfies HeroSlide[];
  }, [content.hero.slides]);

  return (
    <section className="relative bg-gray-100 overflow-hidden hero-slider">
      <Slider {...SLIDER_SETTINGS}>
        {slides.map((slide, index) => (
          <div key={index}>
            <HeroSlideContent slide={slide} index={index} onShopNowClick={onShopNowClick} />
          </div>
        ))}
      </Slider>

      <style>{`
        .hero-slider .slick-dots { bottom: 16px; z-index: 10; }
        .hero-slider .slick-dots li button:before {
          color: #fff;
          font-size: 10px;
          opacity: 0.5;
        }
        .hero-slider .slick-dots li.slick-active button:before {
          color: #fff;
          opacity: 1;
        }
      `}</style>
    </section>
  );
};
