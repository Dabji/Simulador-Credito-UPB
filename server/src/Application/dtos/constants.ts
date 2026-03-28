// ============================================================
// Constantes compartidas de la capa de Aplicación.
// Evita duplicación de mapeos entre Use Cases y el Engine.
// ============================================================

/** Mapea los valores del frontend a los ENUMs de la BD para nivel educativo */
export const LEVEL_MAP: Record<string, 'PREGRADO' | 'POSGRADO' | 'UPB_Tech'> = {
  pregrado: 'PREGRADO',
  posgrado: 'POSGRADO',
  upbTech:  'UPB_Tech',
};
