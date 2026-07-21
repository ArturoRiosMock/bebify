import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PartyPopper, ArrowRight } from 'lucide-react';
import { useHomeContentValue } from '@/app/context/HomeContentContext';

const CTA_CLASS =
  'inline-flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg font-bold bg-[#FDB93A] text-[#212121] transition-colors hover:bg-[#FF8A00]';

/** Banner CTA editable del home (eventos / promo). */
export const HomeRegisterBanner: React.FC = () => {
  const { registerBanner } = useHomeContentValue();
  const desktopImage = registerBanner.imageDesktop || registerBanner.imageMobile;
  const mobileImage = registerBanner.imageMobile || registerBanner.imageDesktop;
  const hasImage = Boolean(desktopImage || mobileImage);
  const href = (registerBanner.buttonHref || '').trim() || '/cotizar-evento';
  const isExternal = /^https?:\/\//i.test(href);

  if (!registerBanner.title && !registerBanner.description && !registerBanner.buttonText) {
    return null;
  }

  const cta = registerBanner.buttonText ? (
    isExternal ? (
      <a href={href} rel="noopener noreferrer" className={CTA_CLASS}>
        <PartyPopper className="w-4 h-4 shrink-0" />
        {registerBanner.buttonText}
      </a>
    ) : (
      <Link to={href} className={CTA_CLASS}>
        <PartyPopper className="w-4 h-4 shrink-0" />
        {registerBanner.buttonText}
      </Link>
    )
  ) : null;

  const gradientInner = (
    <>
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)',
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-10 py-8 sm:py-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#FDB93A] rounded-full flex items-center justify-center flex-shrink-0">
            <PartyPopper className="w-7 h-7 text-[#212121]" />
          </div>
          <div>
            {registerBanner.title && (
              <h3 className="text-white text-xl sm:text-2xl font-bold mb-1">{registerBanner.title}</h3>
            )}
            {registerBanner.description && (
              <p className="text-white/70 text-sm sm:text-base">{registerBanner.description}</p>
            )}
          </div>
        </div>
        {registerBanner.buttonText && (
          <div className="flex items-center gap-2 bg-[#FDB93A] text-[#212121] px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap group-hover:bg-[#FF8A00] transition-colors flex-shrink-0">
            {registerBanner.buttonText}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </>
  );

  return (
    <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-[100vw]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
      >
        {hasImage ? (
          <div className="relative overflow-hidden rounded-2xl bg-[#0c3c1f] text-white">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 p-5 md:p-8">
              <div className="w-full md:w-2/5 shrink-0">
                <picture>
                  <source media="(min-width: 768px)" srcSet={desktopImage} />
                  <img
                    src={mobileImage}
                    alt=""
                    className="w-full h-40 md:h-52 object-cover rounded-lg"
                    loading="lazy"
                  />
                </picture>
              </div>
              <div className="flex-1 text-center md:text-left">
                {registerBanner.title && (
                  <h3 className="text-lg md:text-2xl font-bold mb-1.5">{registerBanner.title}</h3>
                )}
                {registerBanner.description && (
                  <p className="text-sm md:text-base text-white/80 mb-4 leading-relaxed max-w-xl">
                    {registerBanner.description}
                  </p>
                )}
                {cta}
              </div>
            </div>
          </div>
        ) : isExternal ? (
          <a
            href={href}
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden bg-gradient-to-r from-[#0c3c1f] via-[#1a5c35] to-[#0c3c1f] relative group"
          >
            {gradientInner}
          </a>
        ) : (
          <Link
            to={href}
            className="block rounded-2xl overflow-hidden bg-gradient-to-r from-[#0c3c1f] via-[#1a5c35] to-[#0c3c1f] relative group"
          >
            {gradientInner}
          </Link>
        )}
      </motion.div>
    </section>
  );
};
