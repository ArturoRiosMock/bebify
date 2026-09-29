#!/usr/bin/env node
/**
 * Script de test para verificar que la función Edge de SSR inyecta
 * correctamente las metas de producto en el HTML.
 *
 * Uso (con el servidor de desarrollo corriendo):
 *   node scripts/test-producto-ssr.mjs [handle]
 *
 * Uso con Vercel Preview:
 *   PREVIEW_URL=https://xxxx.vercel.app node scripts/test-producto-ssr.mjs [handle]
 *
 * Ejemplo:
 *   node scripts/test-producto-ssr.mjs tequila-don-julio-70-anejo-700-ml
 */

const handle = process.argv[2] || 'tequila-don-julio-70-anejo-700-ml';
const baseUrl = process.env.PREVIEW_URL || 'http://localhost:3000';
const url = `${baseUrl}/producto/${handle}`;

console.log(`\n🔍 Testing SSR for: ${url}\n`);

async function test() {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    });

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Cache-Control: ${response.headers.get('cache-control')}\n`);

    const html = await response.text();

    const checks = [
      {
        name: '<title> del producto',
        regex: /<title>([^<]+)<\/title>/,
        expected: (m) => m && !m[1].includes('Vinos, Licores y más'),
      },
      {
        name: 'canonical URL',
        regex: /<link\s+rel="canonical"\s+href="([^"]+)"/,
        expected: (m) => m && m[1].includes(`/producto/${handle}`),
      },
      {
        name: 'og:type=product',
        regex: /<meta\s+property="og:type"\s+content="([^"]+)"/,
        expected: (m) => m && m[1] === 'product',
      },
      {
        name: 'og:url del producto',
        regex: /<meta\s+property="og:url"\s+content="([^"]+)"/,
        expected: (m) => m && m[1].includes(`/producto/${handle}`),
      },
      {
        name: 'og:image definido',
        regex: /<meta\s+property="og:image"\s+content="([^"]+)"/,
        expected: (m) => m && m[1].length > 0,
      },
      {
        name: 'product:price:amount',
        regex: /<meta\s+property="product:price:amount"\s+content="([^"]+)"/,
        expected: (m) => m && parseFloat(m[1]) > 0,
      },
      {
        name: 'product:price:currency=MXN',
        regex: /<meta\s+property="product:price:currency"\s+content="([^"]+)"/,
        expected: (m) => m && m[1] === 'MXN',
      },
      {
        name: 'product:availability',
        regex: /<meta\s+property="product:availability"\s+content="([^"]+)"/,
        expected: (m) => m && (m[1] === 'in stock' || m[1] === 'out of stock'),
      },
      {
        name: 'JSON-LD Product (data-ssr-product)',
        regex: /<script\s+type="application\/ld\+json"\s+data-ssr-product="true">([^<]+)<\/script>/,
        expected: (m) => {
          if (!m) return false;
          try {
            const json = JSON.parse(m[1]);
            return json['@type'] === 'Product' && json.offers?.price;
          } catch {
            return false;
          }
        },
      },
      {
        name: 'twitter:title',
        regex: /<meta\s+name="twitter:title"\s+content="([^"]+)"/,
        expected: (m) => m && !m[1].includes('Vinos, Licores y más'),
      },
      {
        name: 'SPA shell intact (div#root)',
        regex: /<div\s+id="root">/,
        expected: (m) => !!m,
      },
      {
        name: 'Vite script intact',
        regex: /<script\s+type="module"\s+src="[^"]*main/,
        expected: (m) => !!m,
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const check of checks) {
      const match = html.match(check.regex);
      const ok = check.expected(match);

      if (ok) {
        console.log(`✅ ${check.name}: ${match ? match[1]?.slice(0, 60) || 'OK' : 'OK'}`);
        passed++;
      } else {
        console.log(`❌ ${check.name}: ${match ? match[1]?.slice(0, 60) : 'NOT FOUND'}`);
        failed++;
      }
    }

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Make sure the server is running (vercel dev or npm run dev)\n');
    process.exit(1);
  }
}

test();
