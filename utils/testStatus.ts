export enum TestStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  BLOCK = 'BLOCK',
}

export function formatResult(status: TestStatus, message: string): string {
  return `${status} - ${message}`;
}

export function logResult(status: TestStatus, message: string): void {
  console.log(formatResult(status, message));
}
