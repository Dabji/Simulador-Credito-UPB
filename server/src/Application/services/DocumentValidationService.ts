/**
 * Servicio de validación de tipos de documento de identidad.
 * Replica del frontend para validación consistente en backend.
 * Issue #187
 */

export type DocumentTypeCode =
  | 'CC'
  | 'CE'
  | 'DE'
  | 'PA'
  | 'PE'
  | 'PT'
  | 'RC'
  | 'TI'
  | 'VI';

export interface DocumentTypeInfo {
  code: DocumentTypeCode;
  name: string;
  displayLabel: string;
}

/** Catálogo completo de tipos de documento */
export const DOCUMENT_TYPES: ReadonlyArray<DocumentTypeInfo> = [
  { code: 'CC', name: 'Cédula de Ciudadanía', displayLabel: 'CC — Cédula de Ciudadanía' },
  { code: 'CE', name: 'Cédula de Extranjería', displayLabel: 'CE — Cédula de Extranjería' },
  { code: 'DE', name: 'Documento de Identificación Extranjero', displayLabel: 'DE — Documento de Identificación Extranjero' },
  { code: 'PA', name: 'Pasaporte', displayLabel: 'PA — Pasaporte' },
  { code: 'PE', name: 'Permiso Especial de Permanencia', displayLabel: 'PE — Permiso Especial de Permanencia' },
  { code: 'PT', name: 'Permiso por Protección Temporal', displayLabel: 'PT — Permiso por Protección Temporal' },
  { code: 'RC', name: 'Registro Civil', displayLabel: 'RC — Registro Civil' },
  { code: 'TI', name: 'Tarjeta de Identidad', displayLabel: 'TI — Tarjeta de Identidad' },
  { code: 'VI', name: 'Visa', displayLabel: 'VI — Visa' },
] as const;

/** Set de códigos válidos */
export const VALID_DOCUMENT_CODES: ReadonlySet<DocumentTypeCode> = new Set(
  DOCUMENT_TYPES.map((d) => d.code)
);

/** Verifica si un código es válido */
export function isValidDocumentType(code: string): code is DocumentTypeCode {
  return VALID_DOCUMENT_CODES.has(code as DocumentTypeCode);
}

/** Obtiene la información de un tipo por su código */
export function getDocumentTypeInfo(code: string): DocumentTypeInfo | undefined {
  return DOCUMENT_TYPES.find((d) => d.code === code);
}

/** Matriz de validación por tipo de documento */
export interface DocumentValidationRule {
  pattern: RegExp;
  message: string;
  minLength: number;
  maxLength: number;
  placeholder: string;
  digitsOnly: boolean;
  alphanumeric: boolean;
}

/** Reglas de validación por tipo de documento */
export const DOCUMENT_VALIDATION_RULES: Readonly<Record<DocumentTypeCode, DocumentValidationRule>> = {
  // Numéricos: CC, CE, RC, TI
  CC: {
    pattern: /^\d+$/,
    message: 'La cédula debe contener solo números',
    minLength: 5,
    maxLength: 20,
    placeholder: 'Ej: 1234567890',
    digitsOnly: true,
    alphanumeric: false,
  },
  CE: {
    pattern: /^\d+$/,
    message: 'La cédula de extranjería debe contener solo números',
    minLength: 5,
    maxLength: 20,
    placeholder: 'Ej: 1234567890',
    digitsOnly: true,
    alphanumeric: false,
  },
  RC: {
    pattern: /^\d+$/,
    message: 'El registro civil debe contener solo números',
    minLength: 5,
    maxLength: 20,
    placeholder: 'Ej: 1234567890',
    digitsOnly: true,
    alphanumeric: false,
  },
  TI: {
    pattern: /^\d+$/,
    message: 'La tarjeta de identidad debe contener solo números',
    minLength: 5,
    maxLength: 20,
    placeholder: 'Ej: 1234567890',
    digitsOnly: true,
    alphanumeric: false,
  },
  // Alfanuméricos: PA, PT, DE, VI (PE es numérico por ser permiso)
  PA: {
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'El pasaporte debe contener solo letras y números',
    minLength: 5,
    maxLength: 20,
    placeholder: 'Ej: ABC123456',
    digitsOnly: false,
    alphanumeric: true,
  },
  PE: {
    pattern: /^\d+$/,
    message: 'El permiso especial debe contener solo números',
    minLength: 5,
    maxLength: 20,
    placeholder: 'Ej: 1234567890',
    digitsOnly: true,
    alphanumeric: false,
  },
  PT: {
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'El permiso temporal debe contener solo letras y números',
    minLength: 5,
    maxLength: 20,
    placeholder: 'Ej: PT123456',
    digitsOnly: false,
    alphanumeric: true,
  },
  DE: {
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'El documento extranjero debe contener solo letras y números',
    minLength: 5,
    maxLength: 20,
    placeholder: 'Ej: DE123456',
    digitsOnly: false,
    alphanumeric: true,
  },
  VI: {
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'La visa debe contener solo letras y números',
    minLength: 5,
    maxLength: 20,
    placeholder: 'Ej: VI123456',
    digitsOnly: false,
    alphanumeric: true,
  },
} as const;

/** Obtiene las reglas de validación para un tipo de documento */
export function getDocumentValidationRule(code: string): DocumentValidationRule | undefined {
  if (!isValidDocumentType(code)) return undefined;
  return DOCUMENT_VALIDATION_RULES[code];
}

/**
 * Valida un número de documento según su tipo.
 * Retorna null si es válido, o un mensaje de error si no lo es.
 */
export function validateDocumentNumber(documentNumber: string, documentType: string): string | null {
  if (!isValidDocumentType(documentType)) {
    return 'Tipo de documento no válido';
  }

  const rule = DOCUMENT_VALIDATION_RULES[documentType];

  if (documentNumber.length < rule.minLength) {
    return `El documento debe tener al menos ${rule.minLength} caracteres`;
  }

  if (documentNumber.length > rule.maxLength) {
    return `El documento no puede exceder ${rule.maxLength} caracteres`;
  }

  if (!rule.pattern.test(documentNumber)) {
    return rule.message;
  }

  return null;
}

/** Limpia el valor del input según el tipo de documento */
export function sanitizeDocumentInput(value: string, docType: string): string {
  const rule = getDocumentValidationRule(docType);
  if (!rule) return value;

  if (rule.digitsOnly) {
    return value.replace(/\D/g, '');
  }
  if (rule.alphanumeric) {
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }
  return value;
}
