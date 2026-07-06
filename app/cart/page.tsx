"use client";

import BreadcrumbCart from "@/components/cart-page/BreadcrumbCart";
import ProductCard from "@/components/cart-page/ProductCard";
import FulfillmentSelector, {
  FulfillmentSummaryRow,
} from "@/components/cart/FulfillmentSelector";
import { Button } from "@/components/ui/button";
import InputGroup from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { FaArrowRight } from "react-icons/fa6";
import { MdOutlineLocalOffer } from "react-icons/md";
import { TbBasketExclamation } from "react-icons/tb";
import React from "react";
import { RootState } from "@/lib/store";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { clearPromo, setFulfillmentMethod, setPromo } from "@/lib/features/carts/cartsSlice";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { roundTo2 } from "@/lib/currency";
import { calcDeliveryFee } from "@/lib/fulfillment";
import { useAuthUser } from "@/lib/auth/client";
import { authLoginUrl } from "@/lib/auth/login-path";

export default function CartPage() {
  const searchParams = useSearchParams();
  const checkoutPending = searchParams.get("checkout") === "pending";
  const user = useAuthUser();
  const dispatch = useAppDispatch();
  const { cart, totalPrice, fulfillmentMethod, promo } = useAppSelector(
    (state: RootState) => state.carts
  );
  const { formatPrice } = useCurrency();
  const subtotalRounded = roundTo2(totalPrice);
  const promoDiscount = promo?.discountAmount ?? 0;
  const deliveryFee = calcDeliveryFee(subtotalRounded, fulfillmentMethod);
  const totalRounded = roundTo2(subtotalRounded - promoDiscount + deliveryFee);
  const [promoInput, setPromoInput] = React.useState(promo?.code ?? "");
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [promoLoading, setPromoLoading] = React.useState(false);

  React.useEffect(() => {
    setPromoInput(promo?.code ?? "");
  }, [promo?.code]);

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Please enter a promo code.");
      return;
    }

    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/shop/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: subtotalRounded }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Invalid promo code.");
        return;
      }
      dispatch(setPromo({ code: data.code, discountAmount: data.discountAmount }));
    } catch {
      setPromoError("Failed to apply promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    dispatch(clearPromo());
    setPromoInput("");
    setPromoError(null);
  };

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        {checkoutPending && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Payment wasn&apos;t completed. Your cart is still here — you can try checkout again.
          </div>
        )}
        {cart && cart.items.length > 0 ? (
          <>
            <BreadcrumbCart />
            <h2
              className={cn([
                integralCF.className,
                "font-bold text-[32px] md:text-[40px] uppercase mb-5 md:mb-6 text-brand",
              ])}
            >
              your cart
            </h2>
            <div className="flex flex-col lg:flex-row space-y-5 lg:space-y-0 lg:space-x-5 items-start">
              <div className="w-full p-3.5 md:px-6 flex-col space-y-4 md:space-y-6 rounded-[20px] border border-brand/10">
                {cart?.items.map((product, idx, arr) => (
                  <React.Fragment key={idx}>
                    <ProductCard data={product} />
                    {arr.length - 1 !== idx && (
                      <hr className="border-t-brand/10" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="w-full lg:max-w-[505px] p-5 md:px-6 flex-col space-y-4 md:space-y-6 rounded-[20px] border border-brand/10">
                <h6 className="text-xl md:text-2xl font-bold text-foreground">
                  Order Summary
                </h6>
                <FulfillmentSelector
                  method={fulfillmentMethod}
                  onChange={(method) => dispatch(setFulfillmentMethod(method))}
                  subtotal={subtotalRounded}
                  formatPrice={formatPrice}
                />
                <div className="flex flex-col space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-foreground/60">Subtotal</span>
                    <span className="md:text-xl font-bold">
                      {formatPrice(subtotalRounded)}
                    </span>
                  </div>
                  <FulfillmentSummaryRow
                    method={fulfillmentMethod}
                    subtotal={subtotalRounded}
                    formatPrice={formatPrice}
                  />
                  {promo && promoDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="md:text-xl text-foreground/60">
                        Promo ({promo.code})
                      </span>
                      <span className="md:text-xl font-bold text-green-700">
                        -{formatPrice(promoDiscount)}
                      </span>
                    </div>
                  )}
                  <hr className="border-t-brand/10" />
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-foreground">Total</span>
                    <span className="text-xl md:text-2xl font-bold">
                      {formatPrice(totalRounded)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <InputGroup className="bg-[#F0F0F0]">
                    <InputGroup.Text>
                      <MdOutlineLocalOffer className="text-black/40 text-2xl" />
                    </InputGroup.Text>
                    <InputGroup.Input
                      type="text"
                      name="code"
                      placeholder="Add promo code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="bg-transparent placeholder:text-black/40 uppercase"
                      disabled={!!promo}
                    />
                  </InputGroup>
                  {promo ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemovePromo}
                      className="rounded-full w-full max-w-[119px] h-[48px]"
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading}
                      className="rounded-full w-full max-w-[119px] h-[48px]"
                    >
                      {promoLoading ? "…" : "Apply"}
                    </Button>
                  )}
                </div>
                {promoError && (
                  <p className="text-sm text-red-600" role="alert">
                    {promoError}
                  </p>
                )}
                <Button
                  type="button"
                  className="text-sm md:text-base font-medium rounded-full w-full py-4 h-[54px] md:h-[60px] group"
                  asChild
                >
                  <Link
                    href={
                      user === null ? authLoginUrl("/checkout") : "/checkout"
                    }
                  >
                    Go to Checkout{" "}
                    <FaArrowRight className="text-xl ml-2 group-hover:translate-x-1 transition-all" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center flex-col text-gray-300 mt-32">
            <TbBasketExclamation strokeWidth={1} className="text-6xl" />
            <span className="block mb-4">Your shopping cart is empty.</span>
            <Button className="rounded-full w-24" asChild>
              <Link href="/shop">Shop</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
