import { DomainError } from "../../common/problem-details.filter";

export const bookingStatuses = [
  "pending-confirmation",
  "confirmed",
  "partially-paid",
  "paid",
  "in-progress",
  "completed",
  "cancellation-requested",
  "cancelled",
  "refunded",
] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export function confirm(status: BookingStatus): BookingStatus {
  if (status !== "pending-confirmation")
    throw transition(`Cannot confirm a booking that is ${status}.`);
  return "confirmed";
}

export function recordPayment(status: BookingStatus, paid: number, total: number, amount: number) {
  if (["cancelled", "refunded", "completed"].includes(status)) {
    throw transition(`Cannot record payment on a ${status} booking.`);
  }
  if (amount <= 0) throw transition("Payment amount must be positive.");
  const paidAmount = paid + amount;
  const nextStatus =
    paidAmount >= total && ["confirmed", "partially-paid"].includes(status)
      ? "paid"
      : paidAmount < total && status === "confirmed"
        ? "partially-paid"
        : status;
  return { status: nextStatus as BookingStatus, paidAmount };
}

export function startTravel(status: BookingStatus): BookingStatus {
  if (!["confirmed", "partially-paid", "paid"].includes(status)) {
    throw transition(`Travel can only be started for a confirmed or paid booking, not ${status}.`);
  }
  return "in-progress";
}

export function complete(status: BookingStatus): BookingStatus {
  if (status !== "in-progress")
    throw transition(`Expected booking status in-progress but was ${status}.`);
  return "completed";
}

export function requestCancellation(status: BookingStatus): BookingStatus {
  if (["cancelled", "refunded", "completed", "cancellation-requested"].includes(status)) {
    throw transition(`Cannot request cancellation of a ${status} booking.`);
  }
  return "cancellation-requested";
}

export function cancel(status: BookingStatus): BookingStatus {
  if (!["cancellation-requested", "pending-confirmation"].includes(status)) {
    throw transition(`Cannot cancel a booking that is ${status}. Request cancellation first.`);
  }
  return "cancelled";
}

export function refund(status: BookingStatus): BookingStatus {
  if (status !== "cancelled")
    throw transition(`Expected booking status cancelled but was ${status}.`);
  return "refunded";
}

function transition(message: string) {
  return new DomainError(409, message, "Booking transition conflict");
}
