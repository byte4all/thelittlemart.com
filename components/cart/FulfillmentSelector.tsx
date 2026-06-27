"use client";

import { cn } from "@/lib/utils";
import {
  calcDeliveryFee,
  FREE_SHIPPING_THRESHOLD,
  getShippingFeeLabel,
  SHIPPING_DAYS_LABEL,
  type FulfillmentMethod,
} from "@/lib/fulfillment";
import PickupAddressLink from "@/components/cart/PickupAddressLink";

type FulfillmentSelectorProps = {
  method: FulfillmentMethod;
  onChange: (method: FulfillmentMethod) => void;
  subtotal: number;
  formatPrice: (amount: number) => string;
  className?: string;
};

export default function FulfillmentSelector({
  method,
  onChange,
  subtotal,
  formatPrice,
  className,
}: FulfillmentSelectorProps) {
  const shippingFeeLabel = getShippingFeeLabel(subtotal, formatPrice);

  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      <span className="text-sm font-medium text-foreground/70">Delivery method</span>

      <div
        className={cn(
          "rounded-xl border transition-colors",
          method === "pickup"
            ? "border-brand bg-brand/5"
            : "border-brand/10"
        )}
      >
        <button
          type="button"
          onClick={() => onChange("pickup")}
          className={cn(
            "w-full text-left p-4 transition-colors",
            method !== "pickup" && "hover:border-brand/30"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-medium text-foreground">Self pickup</span>
            <span className="text-sm font-bold text-brand shrink-0">Free</span>
          </div>
        </button>
        {method === "pickup" && (
          <PickupAddressLink className="px-4 pb-4 -mt-1" />
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange("shipping")}
        className={cn(
          "w-full text-left rounded-xl border p-4 transition-colors",
          method === "shipping"
            ? "border-brand bg-brand/5"
            : "border-brand/10 hover:border-brand/30"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="font-medium text-foreground">
            Shipping ({SHIPPING_DAYS_LABEL})
          </span>
          <div className="text-right shrink-0">
            <span className="text-sm font-bold text-brand">
              {shippingFeeLabel}
            </span>
            <p className="text-xs text-foreground/40 mt-0.5">
              Free on orders over RM {FREE_SHIPPING_THRESHOLD}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

export function FulfillmentSummaryRow({
  method,
  subtotal,
  formatPrice,
}: {
  method: FulfillmentMethod;
  subtotal: number;
  formatPrice: (amount: number) => string;
}) {
  const deliveryFee = calcDeliveryFee(subtotal, method);

  if (method === "pickup") {
    return (
      <div className="flex items-center justify-between">
        <span className="md:text-xl text-foreground/60">Pickup</span>
        <span className="md:text-xl font-bold text-brand">Free</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="md:text-xl text-foreground/60">
        Shipping ({SHIPPING_DAYS_LABEL})
      </span>
      <span className="md:text-xl font-bold text-brand">
        {deliveryFee === 0 ? "FREE SHIPPING" : formatPrice(deliveryFee)}
      </span>
    </div>
  );
}
