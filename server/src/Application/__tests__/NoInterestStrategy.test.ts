import { NoInterestStrategy } from '../strategies/NoInterestStrategy';

describe('NoInterestStrategy', () => {
  let strategy: NoInterestStrategy;

  beforeEach(() => {
    strategy = new NoInterestStrategy();
  });

  it('calcula P / n para cuota sin interés', () => {
    expect(strategy.computePeriodicPayment(10_000_000, 0, 4)).toBe(2_500_000);
  });

  it('retorna 0 cuando el principal es 0', () => {
    expect(strategy.computePeriodicPayment(0, 0, 4)).toBe(0);
  });

  it('retorna 0 cuando el número de cuotas es 0', () => {
    expect(strategy.computePeriodicPayment(10_000_000, 0, 0)).toBe(0);
  });
});
