#!/usr/bin/env node
/**
 * Verifica que el formulario Helium de registro exponga campos file (PDF).
 *
 * Si falla, restaurar en Shopify Admin:
 * Apps → Customer Fields → Formulario "Registro" (kntKby)
 * → paso "Datos de Facturación" → campo File "Constancia de Situación Fiscal (PDF)" → Publicar
 */

const SHOP_DOMAIN = process.env.VITE_SHOPIFY_STORE_DOMAIN?.trim() || 'mr-brown-mayoreo.myshopify.com';
const FORM_ID = process.env.VITE_HELIUM_REGISTRATION_FORM_ID?.trim() || 'kntKby';

const url = `https://app.customerfields.com/embed_api/v4/forms/${FORM_ID}.json`;

const response = await fetch(url, {
  headers: { 'X-Shopify-Shop-Domain': SHOP_DOMAIN },
});

if (!response.ok) {
  console.error(`Error ${response.status} al consultar el formulario Helium.`);
  process.exit(1);
}

const payload = await response.json();
const fields = payload.revision?.fields ?? [];
const fileFields = fields.filter((field) => field.type === 'file');
const billingStepId = payload.revision?.steps?.find((step) => step.title === 'Datos de Facturación')?.id;
const billingFileFields = fileFields.filter((field) => field.stepId === billingStepId);

console.log(`Formulario: ${payload.form?.name ?? FORM_ID}`);
console.log(`Revisión: ${payload.revision?.id} (${payload.revision?.updated_at})`);
console.log(`Campos file totales: ${fileFields.length}`);
console.log(`Campos file en "Datos de Facturación": ${billingFileFields.length}`);

if (billingFileFields.length === 0) {
  console.error('\nFalta el campo PDF en el paso Datos de Facturación.');
  console.error('Agregar y publicar en Helium Admin (ver comentario al inicio de este script).');
  process.exit(1);
}

for (const field of billingFileFields) {
  console.log(`  - ${field.label ?? field.settings?.label}`);
}

console.log('\nOK: el formulario incluye subida de PDF en Datos de Facturación.');
