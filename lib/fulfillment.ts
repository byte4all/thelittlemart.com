export type FulfillmentMethod = "pickup" | "shipping";

export const SHIPPING_FLAT_FEE = 8;
export const FREE_SHIPPING_THRESHOLD = 35;
export const SHIPPING_DAYS_LABEL = "3–7 days";

export const PICKUP_MAPS_URL =
  "https://maps.app.goo.gl/Ar82oubNsZsZx9ZN9";

export const PICKUP_LOCATION = {
  name: "Pause Café",
  address:
    "28 Dutamas condominium, 28, Jalan Dutamas Raya, Segambut, 51200 Kuala Lumpur, Federal Territory of Kuala Lumpur",
  city: "Kuala Lumpur",
  state: "Wilayah Persekutuan",
  zip: "51200",
  country: "Malaysia",
  phone: undefined as string | undefined,
} as const;

export function formatPickupAddress(): string {
  const { address, city, state, zip, country } = PICKUP_LOCATION;
  return [address, [city, state, zip].filter(Boolean).join(", "), country]
    .filter(Boolean)
    .join("\n");
}

export function getPickupMapsUrl(): string {
  if (PICKUP_MAPS_URL) return PICKUP_MAPS_URL;
  const query = [
    PICKUP_LOCATION.name,
    PICKUP_LOCATION.address,
    PICKUP_LOCATION.city,
    PICKUP_LOCATION.state,
    PICKUP_LOCATION.zip,
    PICKUP_LOCATION.country,
  ]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
export function calcDeliveryFee(
  subtotal: number,
  method: FulfillmentMethod
): number {
  if (method === "pickup") return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
}

export function getShippingFeeLabel(
  subtotal: number,
  formatPrice: (amount: number) => string
): string {
  return calcDeliveryFee(subtotal, "shipping") === 0
    ? "FREE SHIPPING"
    : formatPrice(SHIPPING_FLAT_FEE);
}

export type FulfillmentAddressInput = {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

export type StoredFulfillmentAddress =
  | ({
      type: "pickup";
    } & FulfillmentAddressInput)
  | ({
      type: "shipping";
    } & FulfillmentAddressInput);

export function buildStoredFulfillmentAddress(
  method: FulfillmentMethod,
  input: FulfillmentAddressInput
): StoredFulfillmentAddress {
  if (method === "pickup") {
    return {
      type: "pickup",
      fullName: input.fullName,
      phone: input.phone,
      address: PICKUP_LOCATION.address,
      city: PICKUP_LOCATION.city,
      state: PICKUP_LOCATION.state,
      zip: PICKUP_LOCATION.zip,
      country: PICKUP_LOCATION.country,
    };
  }
  return {
    type: "shipping",
    fullName: input.fullName,
    phone: input.phone,
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
    country: input.country,
  };
}

export function isPickupAddress(
  address: unknown
): address is StoredFulfillmentAddress & { type: "pickup" } {
  return (
    typeof address === "object" &&
    address !== null &&
    "type" in address &&
    (address as { type: string }).type === "pickup"
  );
}
