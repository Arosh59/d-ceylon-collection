const correlationIdPattern = /^[A-Za-z0-9._:-]{1,64}$/;

export function resolveCorrelationId(value: string | null | undefined): string {
  return value && correlationIdPattern.test(value) ? value : crypto.randomUUID();
}
