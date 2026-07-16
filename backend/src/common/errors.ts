// catch değişkenleri unknown'dır (tsconfig: useUnknownInCatchVariables);
// daraltma tek yerde yapılır ki catch blokları `any`sız ve tek satır kalsın.
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

// TypeORM/pg unique constraint ihlali (duplicate key)
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === '23505'
}
