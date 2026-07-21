import React from 'react';
import { useHomeContentValue } from '@/app/context/HomeContentContext';

/** Bloque de beneficios editable del home. */
export const HomeBenefits: React.FC = () => {
  const { benefits } = useHomeContentValue();

  if (!benefits?.length) return null;

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={`${benefit.title}-${index}`} className="text-center">
              <div className="w-16 h-16 bg-[#0c3c1f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#0c3c1f] text-2xl">{benefit.icon}</span>
              </div>
              <h3 className="text-[#212121] mb-2">{benefit.title}</h3>
              <p className="text-[#717182]">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
