import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useHomeContentValue } from '@/app/context/HomeContentContext';
import { HeroSkeleton } from '@/app/components/hero/HeroSkeleton';
import { HeroSlideView } from '@/app/components/hero/HeroSlideView';
import { HeroControls } from '@/app/components/hero/HeroControls';
import { slideVariants, SLIDE_TRANSITION } from '@/app/components/hero/heroMotion';

interface HeroProps {
  onShopNowClick: () => void;
}

const AUTOPLAY_MS = 8000;

export const Hero = ({ onShopNowClick }: HeroProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const slides = useHomeContentValue().hero.slides ?? [];
  const total = slides.length;

  useEffect(() => {
    setCurrentSlide(0);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [currentSlide, total]);

  if (!total) return <HeroSkeleton />;

  const slide = slides[currentSlide];
  const href = (slide.buttonHref || '').trim();
  const slideIsClickable = Boolean(href) && !slide.buttonText;
  const slideKey = `${currentSlide}-${slide.imageDesktop}-${slide.imageMobile}`;

  const go = (next: number, dir: number) => {
    setDirection(dir);
    setCurrentSlide((next + total) % total);
  };

  const activate = () => {
    if (/^https?:\/\//i.test(href)) {
      window.location.href = href;
      return;
    }
    navigate(href);
  };

  return (
    <section
      className="relative overflow-hidden w-screen left-1/2 right-1/2 -translate-x-1/2"
      style={{ maxWidth: 1700 }}
    >
      <div className="relative aspect-square md:aspect-auto md:h-80 lg:h-96">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={slideKey}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SLIDE_TRANSITION}
            className="absolute inset-0 bg-[#0c3c1f]"
          >
            <HeroSlideView
              slide={slide}
              onActivate={slideIsClickable ? activate : undefined}
              onShopNowClick={onShopNowClick}
            />
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <HeroControls
            count={total}
            current={currentSlide}
            onPrev={() => go(currentSlide - 1, -1)}
            onNext={() => go(currentSlide + 1, 1)}
            onGoTo={(index) => go(index, index > currentSlide ? 1 : -1)}
          />
        )}
      </div>
    </section>
  );
};
