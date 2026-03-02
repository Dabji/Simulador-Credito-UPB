// ============================================================
// Application Layer — Barrel Exports
// Solo se exportan los use cases y DTOs activamente utilizados.
// SimulateCreditUseCase y ManageFinancialParametersUseCase se
// mantienen como referencia pero no se usan en runtime todavía.
// ============================================================

export { AuthenticateUserUseCase } from './use-cases/AuthenticateUserUseCase';
export { RegisterUserUseCase } from './use-cases/RegisterUserUseCase';
export { PreviewSimulationUseCase } from './use-cases/PreviewSimulationUseCase';
export { SaveSimulationUseCase } from './use-cases/SaveSimulationUseCase';
export { RequestPasswordResetUseCase } from './use-cases/RequestPasswordResetUseCase';
export { ResetPasswordUseCase } from './use-cases/ResetPasswordUseCase';

export type {
  AuthenticateUserOutput,
  IAuthService,
  ITokenService,
  LdapUserData,
} from './use-cases/AuthenticateUserUseCase';

export { RegisterUserSchema } from './dtos/RegisterUserInput';
export type { RegisterUserInput } from './dtos/RegisterUserInput';
export type { LoginUserInput } from './dtos/LoginUserInput';
export type { SimulationInput } from './dtos/SimulationInput';
export type { SimulationSummary } from './dtos/SimulationSummary';
