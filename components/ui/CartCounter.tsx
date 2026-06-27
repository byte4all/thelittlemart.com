"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { cn } from "@/lib/utils";

type CartCounterProps = {
  isZeroDelete?: boolean;
  onAdd?: (value: number) => void;
  onRemove?: (value: number) => void;
  className?: string;
  initialValue?: number;
  /** Max allowed quantity (e.g. available stock). Add button is disabled when at max. */
  max?: number;
};

const CartCounter = ({
  isZeroDelete,
  onAdd,
  onRemove,
  className,
  initialValue = 1,
  max,
}: CartCounterProps) => {
  const [counter, setCounter] = useState<number>(initialValue);

  const addToCart = () => {
    const next = counter + 1;
    if (max != null && next > max) return;
    if (onAdd) {
      onAdd(next);
    }
    setCounter(next);
  };

  const atMax = max != null && counter >= max;

  const remove = () => {
    if ((counter === 1 && !isZeroDelete) || counter <= 0) return;

    if (onRemove) {
      onRemove(counter - 1);
    }
    if (counter - 1 <= 0) return;
    setCounter(counter - 1);
  };

  return (
    <div
      className={cn(
        "bg-brand/10 border border-brand/30 w-full min-w-[110px] max-w-[110px] sm:max-w-[170px] py-3 md:py-3.5 px-4 sm:px-5 rounded-full flex items-center justify-between",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="h-5 w-5 sm:h-6 sm:w-6 text-xl text-brand hover:bg-brand/20 hover:text-brand/80"
        onClick={() => remove()}
      >
        <FaMinus />
      </Button>
      <span className="font-medium text-sm sm:text-base text-[#1a1a1a]">
        {!isZeroDelete ? counter : initialValue}
      </span>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="h-5 w-5 sm:h-6 sm:w-6 text-xl text-brand hover:bg-brand/20 hover:text-brand/80 disabled:opacity-50 disabled:pointer-events-none"
        onClick={() => addToCart()}
        disabled={atMax}
        aria-label={atMax ? `Maximum ${max} available` : "Increase quantity"}
      >
        <FaPlus />
      </Button>
    </div>
  );
};

export default CartCounter;
