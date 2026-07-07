import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus } from 'lucide-react';
import { useHomeContentValue } from '@/app/context/HomeContentContext';

export const RegisterBanner: React.FC = () => {
  const { registerBanner } = useHomeContentValue();
  const desktopImage = registerBanner.imageDesktop || registerBanner.imageMobile;
  const mobileImage = registerBanner.imageMobile || registerBanner.imageDesktop;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-xl bg-[#0055a2] text-white"
    >
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
          <h3 className="text-lg md:text-2xl font-bold mb-1.5">{registerBanner.title}</h3>
          <p className="text-sm md:text-base opacity-90 mb-4 leading-relaxed max-w-xl">
            {registerBanner.description}
          </p>
          <Link
            to="/registro"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg font-bold bg-white text-[#0055a2] transition-all hover:scale-105 hover:bg-gray-50"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            {registerBanner.buttonText}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
