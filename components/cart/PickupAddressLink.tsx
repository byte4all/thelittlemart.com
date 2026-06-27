"use client";

import { cn } from "@/lib/utils";
import {
  formatPickupAddress,
  getPickupMapsUrl,
  PICKUP_LOCATION,
} from "@/lib/fulfillment";

type PickupAddressLinkProps = {
  className?: string;
  showName?: boolean;
  showPhone?: boolean;
};

export default function PickupAddressLink({
  className,
  showName = true,
  showPhone = true,
}: PickupAddressLinkProps) {
  const pickupAddressLines = formatPickupAddress().split("\n");
  const mapsUrl = getPickupMapsUrl();

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Google Maps"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "group block text-sm text-foreground/50 transition-colors hover:text-brand",
        className
      )}
    >
      {showName ? <p>{PICKUP_LOCATION.name}</p> : null}
      {pickupAddressLines.map((line) => (
        <p key={line} className="group-hover:underline underline-offset-2">
          {line}
        </p>
      ))}
      {showPhone && PICKUP_LOCATION.phone ? (
        <p>{PICKUP_LOCATION.phone}</p>
      ) : null}
      <p className="text-xs text-brand/70 mt-1 opacity-0 transition-opacity group-hover:opacity-100">
        Open in Google Maps
      </p>
    </a>
  );
}
