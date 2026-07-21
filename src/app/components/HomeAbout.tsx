import React from 'react';
import { motion } from 'motion/react';
import { Truck, Package, Users, Zap } from 'lucide-react';
import { useHomeContentValue } from '@/app/context/HomeContentContext';

const FEATURE_ICONS = [Zap, Package, Truck, Users];

/** Sección Quiénes somos editable del home. */
export const HomeAbout: React.FC = () => {
  const { about } = useHomeContentValue();

  if (!about.title && !about.paragraph1) {
    return null;
  }

  return (
    <section id="about" className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={about.image || '/sobre_nosotros.jpg'}
                alt={about.imageAlt || about.title}
                className="w-full h-80 sm:h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c3c1f]/55 to-transparent" />
            </div>

            {(about.statValue || about.statLabel) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.45 }}
                className="absolute -bottom-5 -right-2 sm:-right-4 bg-white p-5 rounded-xl shadow-lg border border-[#0c3c1f]/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#0c3c1f] rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[#0c3c1f] font-bold text-xl">{about.statValue}</div>
                    <div className="text-[#717182] text-sm">{about.statLabel}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            {about.badge && (
              <div className="inline-block bg-[#0c3c1f]/10 px-4 py-2 rounded-full mb-4">
                <span className="text-[#0c3c1f] font-medium">{about.badge}</span>
              </div>
            )}

            {about.title && <h2 className="text-[#212121] mb-6">{about.title}</h2>}
            {about.paragraph1 && (
              <p className="text-[#717182] mb-6 leading-relaxed">{about.paragraph1}</p>
            )}
            {about.paragraph2 && (
              <p className="text-[#717182] mb-8 leading-relaxed">{about.paragraph2}</p>
            )}

            {about.features?.length > 0 && (
              <div className="grid grid-cols-2 gap-5 mb-8">
                {about.features.map((feature, index) => {
                  const Icon = FEATURE_ICONS[index] || Zap;
                  return (
                    <div key={`${feature.title}-${index}`} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#0c3c1f]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#0c3c1f]" />
                      </div>
                      <div>
                        <h4 className="text-[#212121] mb-1">{feature.title}</h4>
                        <p className="text-[#717182] text-sm">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {about.quote && (
              <div className="bg-[#0c3c1f]/5 border-l-4 border-[#0c3c1f] p-4 rounded">
                <p className="text-[#212121] italic">&ldquo;{about.quote}&rdquo;</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
