"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import type {
  AdminAvailabilitySummary,
  AdminBookingProfile,
  AdminExperienceSlot,
  AdminRoomType,
} from "@/lib/admin-availability";

export function AvailabilityEditor({
  availability,
  moduleSlug,
}: {
  availability: AdminAvailabilitySummary;
  moduleSlug: string;
}) {
  const isExperience = availability.product.productType.slug === "experience";

  return (
    <div className="availability-layout">
      <section className="availability-card">
        <div className="availability-section-header">
          <div>
            <h2>Booking profile</h2>
            <p>Customer-facing booking facts and fulfilment rules for this product.</p>
          </div>
          <Link
            className="secondary-button"
            href={`/modules/${moduleSlug}/${availability.product.id}`}
          >
            Back to product
          </Link>
        </div>
        <ProfileForm
          isExperience={isExperience}
          productId={availability.product.id}
          profile={availability.profile}
        />
      </section>

      {isExperience ? (
        <ExperienceInventory
          currency={availability.product.currency}
          productId={availability.product.id}
          slots={availability.experienceSlots}
        />
      ) : (
        <RoomInventory
          currency={availability.product.currency}
          productId={availability.product.id}
          rooms={availability.roomTypes}
          timeZone={availability.profile?.timeZone ?? "Asia/Colombo"}
        />
      )}
    </div>
  );
}

function ProfileForm({
  productId,
  profile,
  isExperience,
}: {
  productId: string;
  profile: AdminBookingProfile | null;
  isExperience: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({ busy: false });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(setState, async () => {
      await adminRequest(`/products/${productId}/availability/profile`, "PUT", {
        bookingMode: value(form, "bookingMode"),
        pricingUnit: value(form, "pricingUnit"),
        timeZone: value(form, "timeZone"),
        meetingPoint: optional(form, "meetingPoint"),
        pickupAvailable: form.has("pickupAvailable"),
        pickupInstructions: optional(form, "pickupInstructions"),
        languages: list(form, "languages"),
        minimumAge: optionalNumber(form, "minimumAge"),
        maximumGroupSize: optionalNumber(form, "maximumGroupSize"),
        accessibilityInformation: optional(form, "accessibilityInformation"),
        inclusions: list(form, "inclusions"),
        exclusions: list(form, "exclusions"),
        whatToBring: list(form, "whatToBring"),
        importantInformation: list(form, "importantInformation"),
        cancellationPolicy: optional(form, "cancellationPolicy"),
        weatherPolicy: optional(form, "weatherPolicy"),
        instantConfirmation: form.has("instantConfirmation"),
        concurrencyToken: profile?.concurrencyToken,
      });
      router.refresh();
    });
  }

  return (
    <form className="editor-form" onSubmit={submit}>
      <div className="editor-grid editor-grid-three">
        <SelectField
          defaultValue={profile?.bookingMode ?? "request"}
          label="Booking mode"
          name="bookingMode"
          options={[
            ["request", "Request to book"],
            ["instant", "Instant book"],
          ]}
        />
        <SelectField
          defaultValue={profile?.pricingUnit ?? (isExperience ? "person" : "night")}
          label="Pricing unit"
          name="pricingUnit"
          options={
            isExperience
              ? [
                  ["person", "Per person"],
                  ["group", "Per group"],
                ]
              : [
                  ["night", "Per night"],
                  ["room", "Per room"],
                ]
          }
        />
        <TextField
          defaultValue={profile?.timeZone ?? "Asia/Colombo"}
          label="IANA time zone"
          name="timeZone"
          required
        />
      </div>
      <div className="editor-grid">
        <TextField
          defaultValue={profile?.meetingPoint ?? ""}
          label={isExperience ? "Meeting point" : "Check-in location"}
          name="meetingPoint"
        />
        <TextField
          defaultValue={profile?.languages.join(", ") ?? ""}
          label="Languages (comma separated)"
          name="languages"
        />
        <NumberField
          defaultValue={profile?.minimumAge ?? ""}
          label="Minimum age"
          min="0"
          name="minimumAge"
        />
        <NumberField
          defaultValue={profile?.maximumGroupSize ?? ""}
          label={isExperience ? "Maximum group size" : "Maximum guests per booking"}
          min="1"
          name="maximumGroupSize"
        />
      </div>
      <Checkbox
        defaultChecked={profile?.pickupAvailable ?? false}
        label="Pickup is available"
        name="pickupAvailable"
      />
      <TextArea
        defaultValue={profile?.pickupInstructions ?? ""}
        label="Pickup or arrival instructions"
        name="pickupInstructions"
      />
      <TextArea
        defaultValue={profile?.accessibilityInformation ?? ""}
        label="Accessibility information"
        name="accessibilityInformation"
      />
      <div className="editor-grid">
        <TextArea
          defaultValue={profile?.inclusions.join("\n") ?? ""}
          label="Inclusions (one per line)"
          name="inclusions"
        />
        <TextArea
          defaultValue={profile?.exclusions.join("\n") ?? ""}
          label="Exclusions (one per line)"
          name="exclusions"
        />
        <TextArea
          defaultValue={profile?.whatToBring.join("\n") ?? ""}
          label="What to bring (one per line)"
          name="whatToBring"
        />
        <TextArea
          defaultValue={profile?.importantInformation.join("\n") ?? ""}
          label="Important information (one per line)"
          name="importantInformation"
        />
      </div>
      <div className="editor-grid">
        <TextArea
          defaultValue={profile?.cancellationPolicy ?? ""}
          label="Cancellation policy"
          name="cancellationPolicy"
        />
        <TextArea
          defaultValue={profile?.weatherPolicy ?? ""}
          label="Weather policy"
          name="weatherPolicy"
        />
      </div>
      <Checkbox
        defaultChecked={profile?.instantConfirmation ?? false}
        label="Confirm eligible bookings instantly"
        name="instantConfirmation"
      />
      <FormActions label="Save booking profile" state={state} />
    </form>
  );
}

function ExperienceInventory({
  productId,
  currency,
  slots,
}: {
  productId: string;
  currency: string;
  slots: AdminExperienceSlot[];
}) {
  return (
    <section className="availability-card">
      <div className="availability-section-header">
        <div>
          <h2>Experience departures</h2>
          <p>Only open departures with sufficient capacity appear on the public website.</p>
        </div>
      </div>
      <SlotForm currency={currency} productId={productId} />
      {slots.length ? (
        slots.map((slot) => (
          <details className="availability-record" key={slot.id}>
            <summary>
              {formatDateTime(slot.startsAtUtc)} · {slot.capacity - slot.reservedCapacity} of{" "}
              {slot.capacity} available
            </summary>
            <SlotForm currency={currency} productId={productId} slot={slot} />
          </details>
        ))
      ) : (
        <p className="availability-empty">No departures have been created yet.</p>
      )}
    </section>
  );
}

function SlotForm({
  productId,
  currency,
  slot,
}: {
  productId: string;
  currency: string;
  slot?: AdminExperienceSlot;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({ busy: false });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(setState, async () => {
      await adminRequest(
        `/products/${productId}/availability/experience-slots${slot ? `/${slot.id}` : ""}`,
        slot ? "PUT" : "POST",
        {
          startsAtUtc: new Date(value(form, "startsAtUtc")).toISOString(),
          endsAtUtc: optionalDateTime(form, "endsAtUtc"),
          capacity: numberValue(form, "capacity"),
          minimumParticipants: numberValue(form, "minimumParticipants"),
          priceOverride: optionalNumber(form, "priceOverride"),
          currency: value(form, "currency").toUpperCase(),
          status: value(form, "status"),
          bookingCutoffMinutes: numberValue(form, "bookingCutoffMinutes"),
          concurrencyToken: slot?.concurrencyToken,
        },
      );
      if (!slot) formElement.reset();
      router.refresh();
    });
  }
  return (
    <form className="editor-form" onSubmit={submit}>
      {!slot ? <h3>Add a departure</h3> : null}
      <div className="editor-grid editor-grid-three">
        <TextField
          defaultValue={slot ? localDateTime(slot.startsAtUtc) : ""}
          label="Starts (your local time)"
          name="startsAtUtc"
          required
          type="datetime-local"
        />
        <TextField
          defaultValue={slot?.endsAtUtc ? localDateTime(slot.endsAtUtc) : ""}
          label="Ends (your local time)"
          name="endsAtUtc"
          type="datetime-local"
        />
        <SelectField
          defaultValue={slot?.status ?? "open"}
          label="Status"
          name="status"
          options={[
            ["open", "Open"],
            ["closed", "Closed"],
          ]}
        />
        <NumberField
          defaultValue={slot?.capacity ?? ""}
          label="Capacity"
          min={String(Math.max(1, slot?.reservedCapacity ?? 1))}
          name="capacity"
          required
        />
        <NumberField
          defaultValue={slot?.minimumParticipants ?? 1}
          label="Minimum participants"
          min="1"
          name="minimumParticipants"
          required
        />
        <NumberField
          defaultValue={slot?.bookingCutoffMinutes ?? 0}
          label="Booking cutoff (minutes)"
          min="0"
          name="bookingCutoffMinutes"
          required
        />
        <NumberField
          defaultValue={slot?.priceOverride ?? ""}
          label="Price override (optional)"
          min="0"
          name="priceOverride"
          step="0.01"
        />
        <TextField
          defaultValue={slot?.currency ?? currency}
          label="Currency"
          maxLength={3}
          minLength={3}
          name="currency"
          required
        />
      </div>
      {slot ? (
        <p className="availability-meta">{slot.reservedCapacity} places already reserved.</p>
      ) : null}
      <FormActions label={slot ? "Update departure" : "Create departure"} state={state} />
    </form>
  );
}

function RoomInventory({
  productId,
  currency,
  rooms,
  timeZone,
}: {
  productId: string;
  currency: string;
  rooms: AdminRoomType[];
  timeZone: string;
}) {
  return (
    <section className="availability-card">
      <div className="availability-section-header">
        <div>
          <h2>Room types and nightly inventory</h2>
          <p>A stay is offered only when every requested night has enough open inventory.</p>
        </div>
      </div>
      <RoomTypeForm currency={currency} productId={productId} />
      {rooms.length ? (
        rooms.map((room) => (
          <details className="availability-record" key={room.id}>
            <summary>
              {room.name} · {room.roomQuantity} physical room{room.roomQuantity === 1 ? "" : "s"}
            </summary>
            <RoomTypeForm currency={currency} productId={productId} room={room} />
            <NightInventoryForm productId={productId} room={room} timeZone={timeZone} />
            {room.inventory.length ? (
              <p className="availability-meta">
                {room.inventory.length} night{room.inventory.length === 1 ? "" : "s"} configured,
                from {dateOnly(room.inventory[0].stayDate)} to{" "}
                {dateOnly(room.inventory.at(-1)!.stayDate)}.
              </p>
            ) : (
              <p className="availability-empty">No nightly inventory configured.</p>
            )}
          </details>
        ))
      ) : (
        <p className="availability-empty">No room types have been created yet.</p>
      )}
    </section>
  );
}

function RoomTypeForm({
  productId,
  currency,
  room,
}: {
  productId: string;
  currency: string;
  room?: AdminRoomType;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({ busy: false });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(setState, async () => {
      await adminRequest(
        `/products/${productId}/availability/room-types${room ? `/${room.id}` : ""}`,
        room ? "PUT" : "POST",
        {
          name: value(form, "name"),
          slug: value(form, "slug").toLowerCase(),
          description: optional(form, "description"),
          maximumAdults: numberValue(form, "maximumAdults"),
          maximumChildren: numberValue(form, "maximumChildren"),
          roomQuantity: numberValue(form, "roomQuantity"),
          beds: optional(form, "beds"),
          bathrooms: numberValue(form, "bathrooms"),
          amenities: list(form, "amenities"),
          mealPlan: optional(form, "mealPlan"),
          basePrice: numberValue(form, "basePrice"),
          currency: value(form, "currency").toUpperCase(),
          cancellationPolicy: optional(form, "cancellationPolicy"),
          isActive: form.has("isActive"),
          concurrencyToken: room?.concurrencyToken,
        },
      );
      if (!room) formElement.reset();
      router.refresh();
    });
  }
  return (
    <form className="editor-form" onSubmit={submit}>
      {!room ? <h3>Add a room type</h3> : <h3>Edit room type</h3>}
      <div className="editor-grid editor-grid-three">
        <TextField defaultValue={room?.name ?? ""} label="Name" name="name" required />
        <TextField
          defaultValue={room?.slug ?? ""}
          label="URL-safe slug"
          name="slug"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          required
        />
        <TextField defaultValue={room?.beds ?? ""} label="Beds" name="beds" />
        <NumberField
          defaultValue={room?.maximumAdults ?? 2}
          label="Maximum adults"
          min="1"
          name="maximumAdults"
          required
        />
        <NumberField
          defaultValue={room?.maximumChildren ?? 0}
          label="Maximum children"
          min="0"
          name="maximumChildren"
          required
        />
        <NumberField
          defaultValue={room?.roomQuantity ?? 1}
          label="Physical room quantity"
          min="1"
          name="roomQuantity"
          required
        />
        <NumberField
          defaultValue={room?.bathrooms ?? 1}
          label="Bathrooms"
          min="0"
          name="bathrooms"
          required
        />
        <NumberField
          defaultValue={room?.basePrice ?? ""}
          label="Base nightly price"
          min="0"
          name="basePrice"
          required
          step="0.01"
        />
        <TextField
          defaultValue={room?.currency ?? currency}
          label="Currency"
          maxLength={3}
          minLength={3}
          name="currency"
          required
        />
        <TextField defaultValue={room?.mealPlan ?? ""} label="Meal plan" name="mealPlan" />
        <TextField
          defaultValue={room?.amenities.join(", ") ?? ""}
          label="Amenities (comma separated)"
          name="amenities"
        />
      </div>
      <TextArea defaultValue={room?.description ?? ""} label="Description" name="description" />
      <TextArea
        defaultValue={room?.cancellationPolicy ?? ""}
        label="Cancellation policy"
        name="cancellationPolicy"
      />
      <Checkbox
        defaultChecked={room?.isActive ?? true}
        label="Room type is active"
        name="isActive"
      />
      <FormActions label={room ? "Update room type" : "Create room type"} state={state} />
    </form>
  );
}

function NightInventoryForm({
  productId,
  room,
  timeZone,
}: {
  productId: string;
  room: AdminRoomType;
  timeZone: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({ busy: false });
  const [stayDate, setStayDate] = useState("");
  const [capacity, setCapacity] = useState(room.roomQuantity);
  const [priceOverride, setPriceOverride] = useState("");
  const [minimumStayNights, setMinimumStayNights] = useState(1);
  const [isClosed, setIsClosed] = useState(false);

  function selectDate(nextDate: string) {
    setStayDate(nextDate);
    const configured = room.inventory.find((item) => dateOnly(item.stayDate) === nextDate);
    setCapacity(configured?.capacity ?? room.roomQuantity);
    setPriceOverride(
      configured?.priceOverride === null || !configured ? "" : String(configured.priceOverride),
    );
    setMinimumStayNights(configured?.minimumStayNights ?? 1);
    setIsClosed(configured?.isClosed ?? false);
    setState({ busy: false });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const existing = room.inventory.find((item) => dateOnly(item.stayDate) === stayDate);
    await runAction(setState, async () => {
      await adminRequest(
        `/products/${productId}/availability/room-types/${room.id}/inventory`,
        "PUT",
        {
          stayDate,
          capacity,
          priceOverride: priceOverride ? Number(priceOverride) : undefined,
          minimumStayNights,
          isClosed,
          concurrencyToken: existing?.concurrencyToken,
        },
      );
      router.refresh();
    });
  }
  return (
    <form className="editor-form availability-record" onSubmit={submit}>
      <h3>Add or update one night</h3>
      <div className="editor-grid editor-grid-three">
        <label className="editor-field">
          <span>Stay date</span>
          <input
            min={dateInTimeZone(new Date(), timeZone)}
            onChange={(event) => selectDate(event.target.value)}
            required
            type="date"
            value={stayDate}
          />
        </label>
        <label className="editor-field">
          <span>Sellable rooms</span>
          <input
            max={room.roomQuantity}
            min="1"
            onChange={(event) => setCapacity(Number(event.target.value))}
            required
            type="number"
            value={capacity}
          />
        </label>
        <label className="editor-field">
          <span>Nightly price override</span>
          <input
            min="0"
            onChange={(event) => setPriceOverride(event.target.value)}
            step="0.01"
            type="number"
            value={priceOverride}
          />
        </label>
        <label className="editor-field">
          <span>Minimum stay (nights)</span>
          <input
            min="1"
            onChange={(event) => setMinimumStayNights(Number(event.target.value))}
            required
            type="number"
            value={minimumStayNights}
          />
        </label>
      </div>
      <label className="checkbox-field">
        <input
          checked={isClosed}
          name="isClosed"
          onChange={(event) => setIsClosed(event.target.checked)}
          type="checkbox"
        />
        <span>Close this night</span>
      </label>
      <p className="availability-meta">
        Selecting a previously configured date updates it safely; reserved inventory cannot be
        reduced.
      </p>
      <FormActions label="Save night" state={state} />
    </form>
  );
}

interface ActionState {
  busy: boolean;
  error?: string;
  success?: string;
}

async function runAction(
  setState: (state: ActionState) => void,
  action: () => Promise<void>,
): Promise<void> {
  setState({ busy: true });
  try {
    await action();
    setState({ busy: false, success: "Saved successfully." });
  } catch (reason) {
    setState({
      busy: false,
      error: reason instanceof Error ? reason.message : "The record could not be saved.",
    });
  }
}

async function adminRequest(path: string, method: "POST" | "PUT", body: unknown): Promise<void> {
  const response = await fetch(`/api/administration${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const value = (await response.json().catch(() => null)) as {
      detail?: string;
      error?: string;
      message?: string | string[];
    } | null;
    const message = Array.isArray(value?.message) ? value.message.join(" ") : value?.message;
    throw new Error(
      value?.detail ??
        value?.error ??
        message ??
        `The request failed with HTTP ${response.status}.`,
    );
  }
}

function FormActions({ label, state }: { label: string; state: ActionState }) {
  return (
    <>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="form-success" role="status">
          {state.success}
        </p>
      ) : null}
      <div className="editor-actions">
        <button className="primary-button" disabled={state.busy} type="submit">
          {state.busy ? "Saving…" : label}
        </button>
      </div>
    </>
  );
}

function TextField({
  label,
  name,
  defaultValue = "",
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue">) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      <input defaultValue={defaultValue} name={name} {...props} />
    </label>
  );
}

function NumberField(props: Parameters<typeof TextField>[0]) {
  return <TextField step="1" type="number" {...props} />;
}

function TextArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      <textarea defaultValue={defaultValue} name={name} rows={3} />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[][];
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      <select defaultValue={defaultValue} name={name}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked = false,
}: {
  label: ReactNode;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="checkbox-field">
      <input defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function value(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

function optional(form: FormData, name: string): string | undefined {
  return value(form, name) || undefined;
}

function numberValue(form: FormData, name: string): number {
  return Number(value(form, name));
}

function optionalNumber(form: FormData, name: string): number | undefined {
  const item = value(form, name);
  return item ? Number(item) : undefined;
}

function list(form: FormData, name: string): string[] {
  return value(form, name)
    .split(/[\n,]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalDateTime(form: FormData, name: string): string | undefined {
  const item = value(form, name);
  return item ? new Date(item).toISOString() : undefined;
}

function localDateTime(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function dateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
