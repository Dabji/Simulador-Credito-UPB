import { SimulationInputSchema } from '../dtos/SimulationInput';
import { RegisterUserSchema } from '../dtos/RegisterUserInput';
import { LoginUserInputSchema } from '../dtos/LoginUserInput';
import { ResetPasswordInputSchema } from '../dtos/ResetPasswordInput';

function getIssuePaths(result: { success: false; error: { issues: Array<{ path: PropertyKey[] }> } }): string[] {
  return result.error.issues.map((issue) => issue.path.map(String).join('.'));
}

describe('Validation Schemas', () => {
  it('rechaza payload inválido de simulación para pregrado con cuota inicial menor al 20%', () => {
    const result = SimulationInputSchema.safeParse({
      studentType: 'nuevo',
      educationLevel: 'pregrado',
      tuitionGross: 10_000_000,
      scholarshipPct: 0,
      initialPaymentPct: 19,
      initialPaymentValue: 1_900_000,
      interestMode: 'sin_interes',
      academicPeriod: '2026-01',
      firstPaymentMonth: 2,
      numberOfPayments: 3,
      observations: '',
      starred: false,
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toContain(
      'Para pregrado y posgrado el porcentaje de cuota inicial mínimo es 20%',
    );
  });

  it('rechaza registro con formato de documento inválido para el tipo seleccionado', () => {
    const result = RegisterUserSchema.safeParse({
      firstName: 'Juan',
      lastName: 'Pérez',
      documentType: 'CC',
      documentNumber: 'ABC123',
      email: 'juan.perez@upb.edu.co',
      phone: '3001234567',
      password: 'Test123',
      termsAccepted: true,
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const issuePaths = getIssuePaths(result);
    expect(issuePaths).toContain('documentNumber');
  });

  it('rechaza login con correo vacío, contraseña vacía o rol inválido', () => {
    const result = LoginUserInputSchema.safeParse({
      body: {
        email: '',
        password: '',
        role: 'GUEST',
      },
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const issuePaths = getIssuePaths(result);
    expect(issuePaths).toContain('body.email');
    expect(issuePaths).toContain('body.password');
    expect(issuePaths).toContain('body.role');
  });

  it('rechaza reset de contraseña con token faltante y confirmación inconsistente', () => {
    const result = ResetPasswordInputSchema.safeParse({
      body: {
        token: '',
        password: 'abc',
        confirmPassword: 'xyz',
      },
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const issuePaths = getIssuePaths(result);
    expect(issuePaths).toContain('body.token');
    expect(issuePaths).toContain('body.password');
    expect(issuePaths).toContain('body.confirmPassword');
  });
});
