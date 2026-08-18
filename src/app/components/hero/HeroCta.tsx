import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTA_CLASS =
  'bg-[#0c3c1f] text-white px-8 py-3 rounded-lg hover:bg-[#0a3019] transition-colors font-bold text-sm inline-flex items-center gap-2 group';

interface HeroCtaProps {
  buttonText: string;
  buttonHref?: string;
  onShopNowClick: () => void;
}

export function HeroCta({ buttonText, buttonHref, onShopNowClick }: HeroCtaProps) {
  const href = (buttonHref || '').trim();

  const label = (
    <>
      <ShoppingCart className="w-5 h-5" />
      {buttonText}
    </>
  );

  const stopBubble = (e: React.MouseEvent) => e.stopPropagation();

  const handleShopNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShopNowClick();
  };

  if (!href) {
    return (
      <button type="button" onClick={handleShopNow} className={CTA_CLASS}>
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
