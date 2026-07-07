import React from 'react';
import { motion } from 'motion/react';
import { Truck, Package, Users, Zap } from 'lucide-react';
import aboutBarShelfImage from '@/assets/about-bar-shelf.png';
import { useHomeContentValue } from '@/app/context/HomeContentContext';

const FEATURE_ICONS = [Zap, Package, Truck, Users];

export const About = () => {
  const { about } = useHomeContentValue();
  const imageSrc = about.image || aboutBarShelfImage;

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={imageSrc}
                alt={about.imageAlt}
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0055a2]/60 to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl border-2 border-[#0055a2]/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#0055a2] rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-[#0055a2] font-bold text-xl">{about.statValue}</div>
                  <div className="text-[#717182] text-sm">{about.statLabel}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-[#0055a2]/10 px-4 py-2 rounded-full mb-4">
              <span className="text-[#0055a2]">{about.badge}</span>
            </div>

            <h2 className="text-[#212121] mb-6">{about.title}</h2>

            <p className="text-[#717182] mb-6 leading-relaxed">{about.paragraph1}</p>

            <p className="text-[#717182] mb-8 leading-relaxed">{about.paragraph2}</p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {about.features.map((feature, index) => {
                const Icon = FEATURE_ICONS[index] || Zap;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-10 h-10 bg-[#0055a2]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#0055a2]" />
                    </div>
                    <div>
                      <h4 className="text-[#212121] mb-1">{feature.title}</h4>
                      <p className="text-[#717182] text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="bg-[#0055a2]/5 border-l-4 border-[#0055a2] p-4 rounded">
              <p className="text-[#212121] italic">&ldquo;{about.quote}&rdquo;</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
