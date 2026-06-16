type HeliumField = {
  type?: string;
  settings?: {
    description?: string;
    [key: string]: unknown;
  };
  validations?: Array<{
    operator?: string;
    errorMessage?: string;
  }>;
  [key: string]: unknown;
};

type HeliumRevision = {
  fields?: HeliumField[];
  [key: string]: unknown;
};

const FILE_ERROR_MESSAGES: Record<string, string> = {
  less_than: 'El archivo debe ser menor a 20 MB.',
  file_extension_not_blank: 'El archivo debe ser un PDF válido.',
  file_extension_equals: 'Solo se permiten archivos PDF.',
  not_blank: 'Debes subir tu constancia de razón social.',
};

function normalizeFileField(field: HeliumField) {
  field.settings = field.settings ? { ...field.settings } : {};
  field.validations = field.validations?.map((validation) => ({ ...validation })) ?? [];

  if (!field.settings.description?.trim()) {
    field.settings.description = 'Sube tu constancia en formato PDF (máximo 20 MB).';
  }

  for (const validation of field.validations) {
    const message = FILE_ERROR_MESSAGES[validation.operator ?? ''];
    if (message) validation.errorMessage = message;
  }
}

/**
 * Solo traduce mensajes y descripción. No altera dataType ni reglas de validación
 * para que el comportamiento coincida con el preview de Helium Admin.
 */
export function normalizeHeliumRevision(revision: HeliumRevision): HeliumRevision {
  if (!Array.isArray(revision.fields)) return revision;

  const fields = revision.fields.map((field) => {
    if (field.type !== 'file') return field;
    const copy: HeliumField = {
      ...field,
      settings: field.settings ? { ...field.settings } : undefined,
      validations: field.validations?.map((validation) => ({ ...validation })),
    };
    normalizeFileField(copy);
    return copy;
  });

  return { ...revision, fields };
}
