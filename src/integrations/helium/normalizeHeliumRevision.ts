type HeliumField = {
  type?: string;
  settings?: {
    storageLocation?: string;
    description?: string;
    [key: string]: unknown;
  };
  dataColumn?: {
    dataType?: string;
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
  less_than: 'El archivo debe ser menor a 25 MB.',
  file_extension_not_blank: 'El archivo debe ser un PDF válido.',
  file_extension_equals: 'Solo se permiten archivos PDF.',
  file_extension_not_equals: 'Sube un archivo PDF, no un ejecutable.',
  not_blank: 'Debes subir tu Constancia de Situación Fiscal (PDF).',
};

const FILE_FIELD_DESCRIPTION =
  'Sube tu Constancia de Situación Fiscal en formato PDF (máximo 25 MB).';

function resolveFileColumnType(field: HeliumField): 'file' | 'file_reference' {
  const storage = field.settings?.storageLocation;
  if (storage === 'file_reference') return 'file_reference';
  if (storage === 'file') return 'file';
  return field.dataColumn?.dataType === 'file_reference' ? 'file_reference' : 'file';
}

function normalizeFileField(field: HeliumField) {
  field.settings = field.settings ? { ...field.settings } : {};
  field.dataColumn = field.dataColumn ? { ...field.dataColumn } : {};
  field.validations = field.validations?.map((validation) => ({ ...validation })) ?? [];

  const columnType = resolveFileColumnType(field);
  field.dataColumn.dataType = columnType;
  field.settings.storageLocation = columnType === 'file_reference' ? 'file_reference' : 'file';

  if (!field.settings.description?.trim()) {
    field.settings.description = FILE_FIELD_DESCRIPTION;
  }

  for (const validation of field.validations) {
    const message = FILE_ERROR_MESSAGES[validation.operator ?? ''];
    if (message) validation.errorMessage = message;
  }
}

/**
 * Traduce mensajes al español y alinea dataType con storageLocation cuando Helium
 * publica una mezcla file / file_reference incompatible en el embed.
 */
export function normalizeHeliumRevision(revision: HeliumRevision): HeliumRevision {
  if (!Array.isArray(revision.fields)) return revision;

  const fields = revision.fields.map((field) => {
    if (field.type !== 'file') return field;
    const copy: HeliumField = {
      ...field,
      settings: field.settings ? { ...field.settings } : undefined,
      dataColumn: field.dataColumn ? { ...field.dataColumn } : undefined,
      validations: field.validations?.map((validation) => ({ ...validation })),
    };
    normalizeFileField(copy);
    return copy;
  });

  return { ...revision, fields };
}
