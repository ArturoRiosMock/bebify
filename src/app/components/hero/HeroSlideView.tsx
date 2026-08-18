import React from 'react';
import type { HeroSlide } from '@/types/homeContent';
import { AlcoholWarning } from '@/app/components/AlcoholWarning';
import { HeroOverlay } from '@/app/components/hero/HeroOverlay';

interface HeroSlideViewProps {
  slide: HeroSlide;
  onActivate?: () => void;
  onShopNowClick: () => void;
}

function resolveSlideImages(slide: HeroSlide) {
  const desktop = slide.imageDesktop || slide.imageMobile || '/hero-barra-boda.webp';
  const mobile = slide.imageMobile || slide.imageDesktop || desktop;
  return { desktop, mobile };
}

export function HeroSlideView({ slide, onActivate, onShopNowClick }: HeroSlideViewProps) {
  const clickable = Boolean(onActivate);
  const showText = !slide.imageOnly && Boolean(slide.title || slide.badge || slide.subtitle);
  const { desktop, mobile } = resolveSlideImages(slide);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    onActivate?.();
  };

  return (
    <div
      className={clickable ? 'relative w-full h-full cursor-pointer' : 'relative w-full h-full'}
      onClick={onActivate}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      aria-label={clickable ? slide.title || 'Ver promoción' : undefined}
    >
      <picture>
        <source media="(max-width: 767px)" srcSet={mobile} />
        <img
          src={desktop}
          alt={slide.title || 'Mr. Brown Banner'}
          className="w-full h-full object-center object-contain"
        />
      </picture>

      {showText && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      )}

      {(showText || slide.buttonText) && (
        <HeroOverlay slide={slide} showText={showText} onShopNowClick={onShopNowClick} />
      )}

      <AlcoholWarning variant="hero" />
    </div>
  );
}
