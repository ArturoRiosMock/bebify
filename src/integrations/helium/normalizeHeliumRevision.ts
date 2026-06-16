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
    comparand?: unknown;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
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
  field.settings = { ...field.settings };
  field.dataColumn = field.dataColumn ? { ...field.dataColumn } : undefined;
  field.validations = field.validations?.map((validation) => ({ ...validation })) ?? [];

  if (field.settings.storageLocation === 'file' && field.dataColumn?.dataType === 'file_reference') {
    field.dataColumn.dataType = 'file';
  }

  if (!field.settings.description?.trim()) {
    field.settings.description = 'Sube tu constancia en formato PDF (máximo 20 MB).';
  }

  for (const validation of field.validations) {
    const message = FILE_ERROR_MESSAGES[validation.operator ?? ''];
    if (message) validation.errorMessage = message;
  }

  const hasPdfRule = field.validations.some(
    (validation) => validation.operator === 'file_extension_equals',
  );

  if (!hasPdfRule) {
    field.validations.push({
      operator: 'file_extension_equals',
      comparand: 'pdf',
      errorMessage: FILE_ERROR_MESSAGES.file_extension_equals,
      metadata: { mandatory: true },
    });
  }
}

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
