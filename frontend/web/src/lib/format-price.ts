export function formatStartingPrice(amount: number | string | null, currency: string): string {
  if (amount === null) {
    return "Price on request";
  }

  const numericAmount = typeof amount === "number" ? amount : Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return `From ${amount} ${currency}`;
  }

  try {
    return `From ${new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numericAmount)}`;
  } catch {
    return `From ${numericAmount.toLocaleString("en")} ${currency}`;
  }
}
