/**
 * Simula latencia de red real. Usada en todos los route handlers para que los
 * estados de loading/skeleton sean visibles durante el desarrollo.
 */
export const simulateDelay = (ms = 800): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Genera un ID único simple para mocks (no UUID real, suficiente para el reto).
 */
export const mockId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Elige aleatoriamente uno de los posibles outcomes del endpoint de transfer.
 * Pesos ajustables para testear cada escenario en desarrollo.
 */
export type MockTransferScenario =
  | 'success'
  | 'insufficient_funds'
  | 'network_error'
  | 'timeout'
  | 'unknown_error';

const SCENARIOS: MockTransferScenario[] = [
  'success',
  'success',
  'success',       // 3/6 = 50% éxito
  'network_error', // 1/6
  'timeout',       // 1/6
  'unknown_error', // 1/6
];

export const pickTransferScenario = (): MockTransferScenario =>
  SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)] as MockTransferScenario;
