import React from 'react';
import { motion } from 'motion/react';
import { Award, Heart, Users, Sparkles, MapPin, Mail, ExternalLink, ShieldCheck } from 'lucide-react';
import { about } from '@/content/mrbrown/about';
import { formatLicense, hasLicenseInfo, LICENSE_AUTHORITY } from '@/content/mrbrown/business-info';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';

export const SobreNosotrosPage: React.FC = () => {
  useDocumentMeta({
    title: 'Sobre Nosotros',
    description:
      'Mr. Brown — House of Spirits desde 2018: curadores de experiencias premium en bebidas. Selección, mixología y barras para eventos en CDMX.',
    canonicalPath: '/page/sobre-nosotros',
  });

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#0c3c1f] to-[#1a5c35] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)' }}
          />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-[#FDB93A] font-bold text-sm tracking-widest uppercase mb-3">{about.tagline}</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{about.badge}</h1>
            <p className="text-white/80 text-lg max-w-2xl">{about.headline}</p>
          </motion.div>
        </div>
      </section>

      {/* Historia */}
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-10 items-start mb-14">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/sobre_nosotros.jpg"
                alt="Mr. Brown equipo"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c3c1f]/60 to-transparent" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-4">
            <h2 className="text-2xl font-bold text-[#212121]">Nuestra Historia</h2>
            {about.paragraphs.map((p, i) => (
              <p key={i} className="text-[#717182] leading-relaxed">{p}</p>
            ))}
          </motion.div>
        </div>

        {/* Features */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
          {[
            { icon: Award, feature: about.features[0] },
            { icon: Sparkles, feature: about.features[1] },
            { icon: Users, feature: about.features[2] },
            { icon: Heart, feature: about.features[3] },
          ].map(({ icon: Icon, feature }, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-5 text-center">
              <div className="w-12 h-12 bg-[#0c3c1f]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon className="w-6 h-6 text-[#0c3c1f]" />
              </div>
              <h4 className="text-[#212121] font-bold mb-1">{feature.title}</h4>
              <p className="text-[#717182] text-sm">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#0c3c1f]/5 border-l-4 border-[#0c3c1f] p-6 rounded mb-14"
        >
          <p className="text-[#212121] italic text-lg">"{about.quote}"</p>
        </motion.div>

        {/* Contacto */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-[#212121] mb-6">Encuéntranos</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-5">
              <MapPin className="w-5 h-5 text-[#0c3c1f] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-[#212121] mb-1">{about.contact.shipping.title}</h4>
                <p className="text-[#717182] text-sm">{about.contact.shipping.description}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-5">
              <Mail className="w-5 h-5 text-[#0c3c1f] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-[#212121] mb-1">Email</h4>
                <a href={`mailto:${about.contact.email}`} className="text-[#0c3c1f] text-sm hover:underline">{about.contact.email}</a>
              </div>
            </div>
            {hasLicenseInfo() && (
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-5 md:col-span-2">
                <ShieldCheck className="w-5 h-5 text-[#0c3c1f] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#212121] mb-1">Licencia para venta de bebidas alcohólicas</h4>
                  <p className="text-[#717182] text-sm">{formatLicense()}</p>
                  {LICENSE_AUTHORITY && (
                    <p className="text-[#717182] text-xs mt-1">
                      Emitida por {LICENSE_AUTHORITY}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            {[
              { label: 'Facebook', url: about.contact.facebook },
              { label: 'Instagram', url: about.contact.instagram },
              { label: 'TikTok', url: about.contact.tiktok },
            ].map(({ label, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#0c3c1f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0a3019] transition-colors"
              >
                {label}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
};
