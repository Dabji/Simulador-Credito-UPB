// Dominio: Regla que define qué modalidades de financiación están disponibles
// según el tipo de estudiante y nivel educativo.

export type StudentType    = 'nuevo' | 'continuo';
export type EducationLevel = 'pregrado' | 'posgrado' | 'upbTech';

export class ModalityRule {
  private readonly _studentType: StudentType;
  private readonly _educationLevel: EducationLevel;

  constructor(studentType: StudentType, educationLevel: EducationLevel) {
    this._studentType    = studentType;
    this._educationLevel = educationLevel;
  }

  get studentType(): StudentType {
    return this._studentType;
  }

  get educationLevel(): EducationLevel {
    return this._educationLevel;
  }

  // Regla: estudiante nuevo no puede tener beca
  scholarshipAllowed(): boolean {
    return this._studentType === 'continuo';
  }

  // Ambas modalidades (con/sin interés) disponibles para todos
  allowedModes(): string[] {
    return ['sin_interes', 'con_interes'];
  }
}
