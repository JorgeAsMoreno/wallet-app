export const simulateDelay = (ms = 800): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export type MockTransferScenario =
  | 'success'
  | 'insufficient_funds'
  | 'network_error'
  | 'timeout'
  | 'unknown_error';

const SCENARIOS: MockTransferScenario[] = [
  'success',
  'success',
  'success',       // 3/6 = 50% success
  'network_error', // 1/6
  'timeout',       // 1/6
  'unknown_error', // 1/6
];

export const pickTransferScenario = (): MockTransferScenario =>
  SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)] as MockTransferScenario;
