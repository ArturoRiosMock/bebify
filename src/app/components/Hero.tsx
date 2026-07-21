import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AlcoholWarning } from '@/app/components/AlcoholWarning';
import { useHomeContentValue } from '@/app/context/HomeContentContext';
import type { HeroSlide } from '@/types/homeContent';

interface HeroProps {
  onShopNowClick: () => void;
}

const CTA_CLASS =
  'bg-[#0c3c1f] text-white px-8 py-3 rounded-lg hover:bg-[#0a3019] transition-colors font-bold text-sm inline-flex items-center gap-2 group';

function HeroCta({
  buttonText,
  buttonHref,
  onShopNowClick,
}: {
  buttonText: string;
  buttonHref?: string;
  onShopNowClick: () => void;
}) {
  const href = (buttonHref || '').trim();
  const label = (
    <>
      <ShoppingCart className="w-5 h-5" />
      {buttonText}
    </>
  );

  const stopBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!href) {
    return (
      <button
        type="button"
        onClick={(e) => {
          stopBubble(e);
          onShopNowClick();
        }}
        className={CTA_CLASS}
      >
        {label}
      </button>
    );
  }

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={CTA_CLASS} rel="noopener noreferrer" onClick={stopBubble}>
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className={CTA_CLASS} onClick={stopBubble}>
      {label}
    </Link>
  );
}

function resolveSlideImages(slide: HeroSlide) {
  const desktop = slide.imageDesktop || slide.imageMobile || '/hero-barra-boda.webp';
  const mobile = slide.imageMobile || slide.imageDesktop || desktop;
  return { desktop, mobile };
}

export const Hero = ({ onShopNowClick }: HeroProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const content = useHomeContentValue();

  const slides = useMemo(() => {
    if (content.hero.slides?.length) return content.hero.slides;
    return [] as HeroSlide[];
  }, [content.hero.slides]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [currentSlide, slides.length]);

  if (!slides.length) return null;

  const slide = slides[currentSlide];
  const { desktop, mobile } = resolveSlideImages(slide);
  const showTextOverlay = !slide.imageOnly && Boolean(slide.title || slide.badge || slide.subtitle);
  const href = (slide.buttonHref || '').trim();
  const slideIsClickable = Boolean(href) && !slide.buttonText;

  const handleNext = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const handleSlideActivate = () => {
    if (!slideIsClickable || !href) return;
    if (/^https?:\/\//i.test(href)) {
      window.location.href = href;
      return;
    }
    navigate(href);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  return (
    <section
      className="relative overflow-hidden w-screen left-1/2 right-1/2 -translate-x-1/2"
      style={{ maxWidth: 1700 }}
    >
      <div className="relative aspect-square md:aspect-auto md:h-80 lg:h-96">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`${currentSlide}-${desktop}-${mobile}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'tween', duration: 0.8, ease: 'easeInOut' },
              opacity: { duration: 0.6 },
            }}
            className="absolute inset-0 bg-[#0c3c1f]"
          >
            <div
              className={`relative w-full h-full ${slideIsClickable ? 'cursor-pointer' : ''}`}
              onClick={slideIsClickable ? handleSlideActivate : undefined}
              role={slideIsClickable ? 'button' : undefined}
              tabIndex={slideIsClickable ? 0 : undefined}
              onKeyDown={
                slideIsClickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSlideActivate();
                    }
                  : undefined
              }
              aria-label={slideIsClickable ? slide.title || 'Ver promoción' : undefined}
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={mobile} />
                <img
                  src={desktop}
                  alt={slide.title || 'Mr. Brown Banner'}
                  className="w-full h-full object-center object-contain"
                />
              </picture>

              {showTextOverlay && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
              )}

              {(showTextOverlay || slide.buttonText) && (
                <div className="absolute inset-0 flex items-end pb-8">
                  <div className="container mx-auto px-4 md:px-8 lg:px-16">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="max-w-2xl"
                    >
                      {showTextOverlay && slide.badge && (
                        <div className="inline-block mb-4">
                          <div className="bg-[#0c3c1f] text-white px-4 py-2 rounded-full text-sm font-bold">
                            {slide.badge}
                          </div>
                        </div>
                      )}

                      {showTextOverlay && slide.title && (
                        <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                          {slide.title}
                        </h1>
                      )}

                      {showTextOverlay && slide.subtitle && (
                        <p className="text-white/90 text-lg md:text-xl mb-8 max-w-lg">
                          {slide.subtitle}
                        </p>
                      )}

                      {slide.buttonText && (
                        <HeroCta
                          buttonText={slide.buttonText}
                          buttonHref={slide.buttonHref}
                          onShopNowClick={onShopNowClick}
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              <AlcoholWarning variant="hero" />
            </div>
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#212121] p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
              aria-label="Diapositiva anterior"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#212121] p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
              aria-label="Diapositiva siguiente"
            >
              <ChevronRight className="w-6 h-6" aria-hidden />
            </button>

            <div
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30"
              role="tablist"
              aria-label="Selector de diapositiva"
            >
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all ${
                    index === currentSlide
                      ? 'w-8 h-3 bg-white rounded-full'
                      : 'w-3 h-3 bg-white/50 rounded-full hover:bg-white/75'
                  }`}
                  role="tab"
                  aria-selected={index === currentSlide}
                  aria-label={`Ir a la diapositiva ${index + 1} de ${slides.length}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
