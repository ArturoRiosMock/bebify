#!/usr/bin/env node
import { chromium } from 'playwright';

const PDF_PATH = '/Users/christianmock/Downloads/CCMEI-63127332000151.pdf';
const BASE_URL = process.env.REGISTRO_URL ?? 'http://localhost:5173/registro';
const unique = Date.now();

async function fillIfVisible(page, label, value) {
  const field = page.getByLabel(label, { exact: false });
  if (await field.isVisible().catch(() => false)) {
    await field.fill(value);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const uploadResponses = [];
  page.on('response', async (response) => {
    if (response.url().includes('/embed_api/v4/customers/upload')) {
      uploadResponses.push({
        status: response.status(),
        body: await response.text().catch(() => ''),
      });
    }
  });

  console.log(`Abriendo ${BASE_URL}`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.getByText('Razón Social').waitFor({ timeout: 30000 });

  await fillIfVisible(page, 'Razón Social', 'Empresa Prueba QA SA');
  await fillIfVisible(page, 'Giro Comercial', 'Restaurante');
  await fillIfVisible(page, 'Nombre Centro de Consumo', 'Centro QA');
  await fillIfVisible(page, 'Nombre Completo', 'Christian Test');
  await fillIfVisible(page, 'Puesto', 'Gerente');
  await fillIfVisible(page, 'Número de Teléfono', '5512345678');
  await fillIfVisible(page, 'Correo Electrónico', `qa+${unique}@example.com`);
  await fillIfVisible(page, 'Confirmar el Correo Electrónico', `qa+${unique}@example.com`);

  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByLabel('Dirección').waitFor({ timeout: 15000 });

  await fillIfVisible(page, 'Dirección', 'Av. Insurgentes 123');
  await fillIfVisible(page, 'Ciudad', 'Ciudad de México');
  await fillIfVisible(page, 'Código postal', '03100');
  await fillIfVisible(page, 'Días y Horarios de Entregas', 'L-V 9:00-18:00');

  const deliveryName = page.locator('.cf-form-step').filter({ hasText: 'Contacto de Entregas' }).getByLabel('Nombre').first();
  if (await deliveryName.isVisible().catch(() => false)) {
    await deliveryName.fill('Entrega');
  }
  const deliveryLast = page.locator('.cf-form-step').filter({ hasText: 'Contacto de Entregas' }).getByLabel('Apellido').first();
  if (await deliveryLast.isVisible().catch(() => false)) {
    await deliveryLast.fill('QA');
  }
  const deliveryPhone = page.locator('.cf-form-step').filter({ hasText: 'Contacto de Entregas' }).getByLabel('Número de Teléfono').first();
  if (await deliveryPhone.isVisible().catch(() => false)) {
    await deliveryPhone.fill('5512345678');
  }

  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByText('Constancia de Situación Fiscal', { exact: false }).waitFor({ timeout: 15000 });

  const cfdi = page.getByLabel('Uso de CFDI');
  if (await cfdi.isVisible().catch(() => false)) {
    await cfdi.selectOption({ index: 1 });
  }

  await fillIfVisible(page, 'Correo Electrónico de Facturación', `facturacion+${unique}@example.com`);

  const fileInput = page.locator('.helium-registration-form input[type="file"]');
  await fileInput.setInputFiles(PDF_PATH);

  await page.waitForTimeout(3000);

  const preview = page.locator('.helium-registration-form .cf-file-preview');
  const fileName = page.locator('.helium-registration-form .cf-file-name');
  const fieldInvalid = page.locator('.cf-field[data-cf-field-type="file"][data-cf-invalid="true"]');
  const stepErrors = page.locator('.cf-error-message');

  const results = {
    uploadRequests: uploadResponses.length,
    uploadStatus: uploadResponses.at(-1)?.status ?? null,
    uploadBody: uploadResponses.at(-1)?.body?.slice(0, 200) ?? null,
    previewVisible: await preview.isVisible().catch(() => false),
    fileNameText: (await fileName.first().textContent().catch(() => null))?.trim() ?? null,
    fieldInvalid: await fieldInvalid.isVisible().catch(() => false),
    stepErrorText: (await stepErrors.first().textContent().catch(() => null))?.trim() ?? null,
  };

  console.log('\nResultado subida PDF:');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();

  if (!results.previewVisible || results.fieldInvalid) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
