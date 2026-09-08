export function durationMilliseconds(value: string): number {
  const match = /^(\d+)([mhd])$/u.exec(value.trim());
  if (!match) throw new Error("Duration must use a value such as 30m, 24h, or 30d.");
  const amount = Number(match[1]);
  const factors = { m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return amount * factors[match[2] as keyof typeof factors];
}
