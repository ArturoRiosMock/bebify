import React from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Clock, ExternalLink } from 'lucide-react';
import { about } from '@/content/mrbrown/about';
import { useDocumentMeta } from '@/app/hooks/useDocumentMeta';

export const ContactoPage: React.FC = () => {
  useDocumentMeta({
    title: 'Contacto',
    description:
      'Contacto Mr. Brown: correo, envío en 24 h en CDMX y Valle de Bravo, zonas de entrega y horarios. Atención por email y redes sociales.',
    canonicalPath: '/contacto',
  });

  return (
    <>
      <section className="bg-gradient-to-r from-[#0c3c1f] to-[#1a5c35] py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-4xl font-bold text-white">
            Contacto
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/70 mt-2">
            Estamos aquí para ayudarte
          </motion.p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-100 p-6 flex items-start gap-4 shadow-sm">
            <div className="w-11 h-11 bg-[#0c3c1f]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#0c3c1f]" />
            </div>
            <div>
              <h3 className="font-bold text-[#212121] mb-1">Correo electrónico</h3>
              <a href="mailto:hola@mrbrown.com.mx" className="text-[#0c3c1f] text-sm hover:underline">hola@mrbrown.com.mx</a>
              <br />
              <a href="mailto:contacto@mrbrown.com.mx" className="text-[#717182] text-sm hover:underline">contacto@mrbrown.com.mx</a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl border border-gray-100 p-6 flex items-start gap-4 shadow-sm">
            <div className="w-11 h-11 bg-[#0c3c1f]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#0c3c1f]" />
            </div>
            <div>
              <h3 className="font-bold text-[#212121] mb-1">{about.contact.shipping.title}</h3>
              <p className="text-[#717182] text-sm">{about.contact.shipping.description}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-gray-100 p-6 flex items-start gap-4 shadow-sm">
            <div className="w-11 h-11 bg-[#0c3c1f]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-[#0c3c1f]" />
            </div>
            <div>
              <h3 className="font-bold text-[#212121] mb-1">Área de entrega</h3>
              <p className="text-[#717182] text-sm">Ciudad de México · Estado de México<br />Valle de Bravo (horarios especiales)</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-xl border border-gray-100 p-6 flex items-start gap-4 shadow-sm">
            <div className="w-11 h-11 bg-[#FDB93A]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-5 h-5 text-[#0c3c1f]" aria-hidden />
            </div>
            <div>
              <h3 className="font-bold text-[#212121] mb-2">Redes sociales</h3>
              <div className="flex flex-col gap-1">
                {[
                  { label: 'Facebook', url: about.contact.facebook },
                  { label: 'Instagram', url: about.contact.instagram },
                  { label: 'TikTok', url: about.contact.tiktok },
                ].map(({ label, url }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="text-[#0c3c1f] text-sm hover:underline">
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#0c3c1f] to-[#1a5c35] rounded-xl p-8 text-center text-white"
        >
          <h2 className="text-white mb-3">¿Tienes alguna duda?</h2>
          <p className="text-white/80 mb-5">Escríbenos y un asesor te contactará a la brevedad.</p>
          <a
            href="mailto:hola@mrbrown.com.mx"
            className="inline-block bg-[#FDB93A] text-[#212121] px-8 py-3 rounded-lg font-bold hover:bg-[#FF8A00] transition-colors"
          >
            Enviar mensaje
          </a>
        </motion.div>
      </section>
    </>
  );
};
