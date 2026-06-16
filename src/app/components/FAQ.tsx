import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const SUPPORT_WHATSAPP_NUMBER = '525653213061';
const SUPPORT_WHATSAPP_MESSAGE = 'Hola, necesito asistencia con mi cuenta Bebify.';
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`;
const SUPPORT_EMAIL = 'hola@gpbebidas.mx';

const linkClass = 'text-[#0055a2] underline underline-offset-2 hover:text-[#003d7a] transition-colors';

const faqs: FAQItem[] = [
  {
    question: '¿Por qué elegir Bebify para mi negocio?',
    answer: (
      <div className="space-y-4">
        <div>
          <p className="font-semibold text-[#212121] mb-1">Centraliza tus pedidos en un solo lugar</p>
          <p>
            Olvídate de hablar con múltiples proveedores. Con Bebify gestionas todo desde una
            sola plataforma, ahorrando tiempo operativo todos los días.
          </p>
        </div>

        <div>
          <p className="font-semibold text-[#212121] mb-1">Compara y elige mejor</p>
          <p>
            Accede a más de 200 proveedores y más de 2,000 bebidas para tomar decisiones
            inteligentes, optimizando costo, disponibilidad y variedad.
          </p>
        </div>

        <div>
          <p className="font-semibold text-[#212121] mb-1">Ordena sin errores</p>
          <p>
            Nuestra tecnología estandariza tus pedidos, evitando equivocaciones, retrabajos y
            pérdidas innecesarias.
          </p>
        </div>

        <div>
          <p className="font-semibold text-[#212121] mb-1">Recibe sin complicaciones</p>
          <p>
            Coordinamos entregas confiables para que tu operación nunca se detenga ni pierda
            ventas.
          </p>
        </div>

        <div>
          <p className="font-semibold text-[#212121] mb-1">Cuenta con apoyo personalizado</p>
          <p>
            Tendrás un ejecutivo de cuenta que se encarga de auxiliarte ante temas
            administrativos, vincularte con marcas y resolver oportunidades de operación.
          </p>
        </div>

        <div>
          <p className="font-semibold text-[#212121] mb-1">Facilita tu administración</p>
          <p>
            Una sola factura, reducción de distracciones en la operación, opción de crédito
            (sujeto a autorización previa) y plataforma con histórico de pedidos.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/registro"
            className="inline-flex items-center justify-center gap-2 bg-[#0055a2] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#003d7a] transition-colors"
          >
            Regístrate ahora
          </Link>
        </div>
      </div>
    )
  },
  {
    question: '¿Bebify es para cualquier negocio?',
    answer:
      'Trabajamos con centros de consumo en CDMX y Área Metropolitana que buscan eficiencia operativa.'
  },
  {
    question: '¿Cómo me registro como cliente en Bebify?',
    answer: (
      <>
        Da click en{' '}
        <Link to="/registro" className={linkClass}>
          este vínculo
        </Link>{' '}
        y regístrate directamente para comenzar a aprovechar todos los beneficios de trabajar con
        Bebify, solo necesitas llenar un formulario, tu Constancia de Situación Fiscal y Opinión de
        Cumplimiento.
      </>
    )
  },
  {
    question: '¿Cuál es el tiempo de entrega?',
    answer:
      'Realizamos entregas a partir de 24 horas en toda la CDMX: nuestra plataforma tecnológica facilita la carga de pedidos sin errores y entregas rápidas y confiables para que tu negocio nunca se quede sin stock.'
  },
  {
    question: '¿Cómo puedo ver los precios de los productos?',
    answer:
      'Los precios son exclusivos para clientes registrados. Una vez que inicies sesión con tu cuenta, podrás ver todos los precios y realizar pedidos. Esto nos permite ofrecer precios competitivos B2B a nuestros clientes.'
  },
  {
    question: '¿Cuáles son los métodos de pago?',
    answer: 'Aceptamos pagos por transferencia.'
  },
  {
    question: '¿Hay pedido mínimo?',
    answer:
      'Nuestro modelo está diseñado para optimizar costos y operación, por lo que trabajamos con un pedido mínimo semanal de $3,000+IVA, asegurando mejores precios, disponibilidad y servicio continuo.'
  },
  {
    question: '¿Qué variedad de productos manejan?',
    answer:
      'Contamos con más de 2,000 productos disponibles de más de 200 proveedores: destilados (whisky, vodka, tequila, gin, ron, mezcal), vinos, champagne, cervezas artesanales, nacionales e importadas, refrescos, aguas y más.'
  },
  {
    question: '¿Puedo devolver un producto?',
    answer:
      'En Bebify cuidamos que cada pedido llegue correctamente desde el origen. Por eso, nuestra plataforma valida la orden en tres etapas antes de confirmarlo. Este nivel de control nos permite garantizar precisión en cada entrega, por lo que los cambios se realizan únicamente en caso de producto en mal estado.'
  },
  {
    question: '¿Cómo contacto a servicio al cliente?',
    answer: (
      <>
        Gracias por tu interés en contactar con nosotros; solo da click en{' '}
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          esta liga
        </a>{' '}
        y un ejecutivo te asistirá en breve, o escríbenos a{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
          {SUPPORT_EMAIL}
        </a>
        .
        <br />
        <br />
        Nuestro equipo de soporte está disponible de Lunes a Viernes, de 9:00 am a 06:00 pm para
        atender todas tus dudas y solicitudes.
      </>
    )
  }
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-[#0055a2]/10 px-4 py-2 rounded-full mb-4"
          >
            <HelpCircle className="w-4 h-4 text-[#0055a2]" />
            <span className="text-[#0055a2]">Preguntas Frecuentes</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#212121] mb-4"
          >
            ¿Tienes alguna duda?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#717182] max-w-2xl mx-auto"
          >
            Aquí encontrarás respuestas a las preguntas más comunes. Si no encuentras lo que buscas, no dudes en contactarnos.
          </motion.p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="mb-4"
            >
              <div className="bg-white rounded-lg hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-panel-${index}`}
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                >
                  <h3 className="text-[#212121]">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-[#0055a2]" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {openIndex === index && (
                    <motion.div
                      id={`faq-panel-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="text-[#717182] px-6 pb-6 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-[#0055a2] to-[#0a5028] text-white rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-white mb-3">¿Aún tienes preguntas?</h3>
            <p className="text-white/90 mb-6">
              Nuestro equipo de soporte está disponible de lunes a viernes de 9:00 AM a 6:00 PM
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://bebify.mx/pages/contact"
                className="bg-white text-[#0055a2] px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Contáctanos
              </a>
              <a
                href="tel:+525653213061"
                className="border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-[#0055a2] transition-colors"
              >
                Llamar Ahora
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
