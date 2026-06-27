"use client";

import { addToCart } from "@/lib/features/carts/cartsSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import { Product } from "@/types/product.types";
import React from "react";

const AddToCartBtn = ({
  data,
  availableQuantity,
}: {
  data: Product & { quantity: number; slug?: string; brand?: string };
  availableQuantity?: number;
}) => {
  const dispatch = useAppDispatch();
  const { sizeSelection, colorSelection } = useAppSelector(
    (state: RootState) => state.products
  );

  const outOfStock = typeof availableQuantity === "number" && availableQuantity < 1;

  return (
    <button
      type="button"
      className="bg-brand w-full ml-3 sm:ml-5 rounded-full h-11 md:h-[52px] text-sm sm:text-base text-white hover:bg-brand/90 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      onClick={() =>
        dispatch(
          addToCart({
            id: data.id,
            name: data.title,
            srcUrl: data.srcUrl,
            price: data.price,
            attributes: [sizeSelection, colorSelection.name],
            discount: data.discount,
            quantity: data.quantity,
            availableQuantity,
            ...(data.slug && { slug: data.slug }),
            ...(data.brand && { brand: data.brand }),
          })
        )
      }
      disabled={outOfStock}
      aria-disabled={outOfStock}
    >
      {outOfStock ? "Out of stock" : "Add to Cart"}
    </button>
  );
};

export default AddToCartBtn;
