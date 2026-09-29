import React, { useEffect, useState } from 'react';

interface JsonLdProps {
  /** Schema u objeto schema.org (o un array de varios). */
  schema: object | object[];
  /**
   * Si true, detecta si ya existe un bloque SSR de producto (data-ssr-product)
   * y lo reemplaza en lugar de añadir uno nuevo. Esto evita duplicar JSON-LD
   * cuando la función Edge ya inyectó el schema Product.
   */
  replaceSSRProduct?: boolean;
}

/**
 * Inyecta uno o varios bloques `<script type="application/ld+json">` en el
 * árbol de la página. Google reconoce JSON-LD en cualquier parte del HTML.
 *
 * Cuando `replaceSSRProduct` es true, el componente primero elimina cualquier
 * script JSON-LD con `data-ssr-product="true"` (inyectado por la función Edge
 * de SSR) para evitar duplicación del schema Product.
 */
export const JsonLd: React.FC<JsonLdProps> = ({ schema, replaceSSRProduct = false }) => {
  const [ssrRemoved, setSsrRemoved] = useState(false);

  useEffect(() => {
    if (replaceSSRProduct && !ssrRemoved) {
      const ssrScript = document.querySelector(
        'script[type="application/ld+json"][data-ssr-product="true"]'
      );
      if (ssrScript) {
        ssrScript.parentNode?.removeChild(ssrScript);
      }
      setSsrRemoved(true);
    }
  }, [replaceSSRProduct, ssrRemoved]);

  const blocks = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {blocks.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
};
