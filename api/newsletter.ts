// Vercel Function: recebe o formulário do componente Newsletter e cria/atualiza
// o cliente no Shopify Admin API com consentimento de email marketing.
// Roda em Node (Fluid Compute) — não expõe o token de Admin ao browser.

export const config = { runtime: 'nodejs' };

type NewsletterBody = {
  name?: unknown;
  whatsapp?: unknown;
  email?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// MX-first phone normalization. Returns E.164 (+52...) or null if it can't normalize confidently.
function normalizePhoneMX(input: string): string | null {
  const digits = input.replace(/\D+/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `+52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('521')) return `+${digits}`;
  return null;
}

export async function POST(req: Request): Promise<Response> {
  const storeDomain = process.env.SHOPIFY_ADMIN_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!storeDomain || !adminToken) {
    console.error('[newsletter] Missing SHOPIFY_ADMIN_STORE_DOMAIN or SHOPIFY_ADMIN_API_TOKEN');
    return json(500, { ok: false, error: 'Servicio no disponible' });
  }

  let body: NewsletterBody;
  try {
    body = (await req.json()) as NewsletterBody;
  } catch {
    return json(400, { ok: false, error: 'Cuerpo inválido' });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const whatsappRaw = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';

  if (!name) return json(400, { ok: false, error: 'Nombre requerido' });
  if (!EMAIL_RE.test(email)) return json(400, { ok: false, error: 'Email inválido' });
  if (!whatsappRaw) return json(400, { ok: false, error: 'WhatsApp requerido' });

  const phone = normalizePhoneMX(whatsappRaw);
  if (!phone) {
    return json(400, { ok: false, error: 'Número de WhatsApp inválido' });
  }

  const mutation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer { id email phone }
        userErrors { field message }
      }
    }
  `;

  const variables = {
    input: {
      email,
      firstName: name,
      phone,
      emailMarketingConsent: {
        marketingState: 'SUBSCRIBED',
        marketingOptInLevel: 'SINGLE_OPT_IN',
        consentUpdatedAt: new Date().toISOString(),
      },
      tags: ['newsletter', 'website-signup'],
    },
  };

  let shopifyRes: Response;
  try {
    shopifyRes = await fetch(
      `https://${storeDomain}/admin/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );
  } catch (err) {
    console.error('[newsletter] Network error calling Shopify', err);
    return json(502, { ok: false, error: 'Error de red' });
  }

  if (!shopifyRes.ok) {
    const text = await shopifyRes.text().catch(() => '');
    console.error('[newsletter] Shopify HTTP error', shopifyRes.status, text);
    return json(502, { ok: false, error: 'Error del proveedor' });
  }

  const payload = (await shopifyRes.json().catch(() => null)) as {
    data?: {
      customerCreate?: {
        customer?: { id?: string } | null;
        userErrors?: Array<{ field?: string[] | null; message?: string }>;
      };
    };
    errors?: unknown;
  } | null;

  if (!payload || payload.errors) {
    console.error('[newsletter] Shopify GraphQL errors', payload?.errors);
    return json(502, { ok: false, error: 'Error del proveedor' });
  }

  const userErrors = payload.data?.customerCreate?.userErrors ?? [];
  if (userErrors.length > 0) {
    const isDuplicate = userErrors.some(
      (e) => /already|has been taken|exists/i.test(e.message ?? '')
    );
    if (isDuplicate) {
      return json(200, { ok: true, alreadySubscribed: true });
    }
    console.error('[newsletter] userErrors', userErrors);
    return json(422, { ok: false, error: 'No fue posible registrarte' });
  }

  return json(200, { ok: true });
}
