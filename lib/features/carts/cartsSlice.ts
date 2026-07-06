import { roundTo2 } from "@/lib/currency";
import type { FulfillmentMethod } from "@/lib/fulfillment";
import { compareArrays } from "@/lib/utils";
import { Discount } from "@/types/product.types";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const calcAdjustedTotalPrice = (data: CartItem, quantity?: number): number => {
  return data.price * (quantity ?? data.quantity);
};

/** Hard upper bound so a buggy flow can’t explode cart counts. */
const GLOBAL_MAX_QUANTITY_PER_ITEM = 20;

function clampQuantity(
  desired: number,
  availableQuantity?: number
): number {
  const base = Math.max(1, desired);
  const withStockLimit =
    typeof availableQuantity === "number"
      ? Math.min(base, availableQuantity)
      : base;
  return Math.min(withStockLimit, GLOBAL_MAX_QUANTITY_PER_ITEM);
}

export type RemoveCartItem = {
  id: number | string;
  attributes: string[];
};

export type CartItem = {
  id: number | string;
  name: string;
  srcUrl: string;
  price: number;
  attributes: string[];
  discount: Discount;
  quantity: number;
  /** Max quantity allowed (e.g. available stock). Optional for backward compatibility. */
  availableQuantity?: number;
  /** Product slug; used when syncing cart to account. */
  slug?: string;
  /** Brand name; shown in cart when product has no size/color attributes. */
  brand?: string;
};

export type Cart = {
  items: CartItem[];
  totalQuantities: number;
};

export type CartPromo = {
  code: string;
  discountAmount: number;
};

// Define a type for the slice state
interface CartsState {
  cart: Cart | null;
  totalPrice: number;
  adjustedTotalPrice: number;
  action: "update" | "add" | "delete" | null;
  fulfillmentMethod: FulfillmentMethod;
  promo: CartPromo | null;
}

// Define the initial state using that type
const initialState: CartsState = {
  cart: null,
  totalPrice: 0,
  adjustedTotalPrice: 0,
  action: null,
  fulfillmentMethod: "shipping",
  promo: null,
};

export const cartsSlice = createSlice({
  name: "carts",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      state.promo = null;
      // if cart is empty then add
      if (state.cart === null) {
        const maxQty = action.payload.availableQuantity;
        const qty = clampQuantity(action.payload.quantity, maxQty);
        const item = {
          ...action.payload,
          quantity: qty,
          availableQuantity: maxQty,
        };
        state.cart = {
          items: [item],
          totalQuantities: qty,
        };
        state.totalPrice = roundTo2(
          state.totalPrice + action.payload.price * qty
        );
        state.adjustedTotalPrice = roundTo2(
          state.adjustedTotalPrice + calcAdjustedTotalPrice(item)
        );
        return;
      }

      // check item in cart
      const isItemInCart = state.cart.items.find(
        (item) =>
          action.payload.id === item.id &&
          compareArrays(action.payload.attributes, item.attributes)
      );

      if (isItemInCart) {
        const addedQty = clampQuantity(
          action.payload.quantity,
          action.payload.availableQuantity ?? isItemInCart.availableQuantity
        );
        const newTotal = isItemInCart.quantity + addedQty;
        const maxQty =
          typeof action.payload.availableQuantity === "number"
            ? action.payload.availableQuantity
            : isItemInCart.availableQuantity;
        const cappedTotal =
          maxQty != null ? Math.min(newTotal, maxQty) : newTotal;
        const actualAdded = cappedTotal - isItemInCart.quantity;

        state.cart = {
          ...state.cart,
          items: state.cart.items.map((eachCartItem) => {
            if (
              eachCartItem.id === action.payload.id
                ? !compareArrays(
                    eachCartItem.attributes,
                    isItemInCart.attributes
                  )
                : eachCartItem.id !== action.payload.id
            )
              return eachCartItem;

            return {
              ...isItemInCart,
              quantity: cappedTotal,
              availableQuantity: maxQty ?? isItemInCart.availableQuantity,
            };
          }),
          totalQuantities: state.cart.totalQuantities + actualAdded,
        };
        state.totalPrice = roundTo2(
          state.totalPrice + action.payload.price * actualAdded
        );
        state.adjustedTotalPrice = roundTo2(
          state.adjustedTotalPrice +
            calcAdjustedTotalPrice({
              ...action.payload,
              quantity: actualAdded,
            })
        );
        return;
      }

      const maxQty = action.payload.availableQuantity;
      const qty = clampQuantity(action.payload.quantity, maxQty);
      const item = {
        ...action.payload,
        quantity: qty,
        availableQuantity: maxQty,
      };
      state.cart = {
        ...state.cart,
        items: [...state.cart.items, item],
        totalQuantities: state.cart.totalQuantities + qty,
      };
      state.totalPrice = roundTo2(state.totalPrice + action.payload.price * qty);
      state.adjustedTotalPrice = roundTo2(
        state.adjustedTotalPrice + calcAdjustedTotalPrice(item)
      );
    },
    removeCartItem: (state, action: PayloadAction<RemoveCartItem>) => {
      if (state.cart === null) return;
      state.promo = null;

      // check item in cart
      const isItemInCart = state.cart.items.find(
        (item) =>
          action.payload.id === item.id &&
          compareArrays(action.payload.attributes, item.attributes)
      );

      if (isItemInCart) {
        state.cart = {
          ...state.cart,
          items: state.cart.items
            .map((eachCartItem) => {
              if (
                eachCartItem.id === action.payload.id
                  ? !compareArrays(
                      eachCartItem.attributes,
                      isItemInCart.attributes
                    )
                  : eachCartItem.id !== action.payload.id
              )
                return eachCartItem;

              return {
                ...isItemInCart,
                quantity: eachCartItem.quantity - 1,
              };
            })
            .filter((item) => item.quantity > 0),
          totalQuantities: state.cart.totalQuantities - 1,
        };

        state.totalPrice = roundTo2(state.totalPrice - isItemInCart.price * 1);
        state.adjustedTotalPrice = roundTo2(
          state.adjustedTotalPrice -
            calcAdjustedTotalPrice(isItemInCart, 1)
        );
      }
    },
    remove: (
      state,
      action: PayloadAction<RemoveCartItem & { quantity: number }>
    ) => {
      if (!state.cart) return;
      state.promo = null;

      // check item in cart
      const isItemInCart = state.cart.items.find(
        (item) =>
          action.payload.id === item.id &&
          compareArrays(action.payload.attributes, item.attributes)
      );

      if (!isItemInCart) return;

      state.cart = {
        ...state.cart,
        items: state.cart.items.filter((pItem) => {
          return pItem.id === action.payload.id
            ? !compareArrays(pItem.attributes, isItemInCart.attributes)
            : pItem.id !== action.payload.id;
        }),
        totalQuantities: state.cart.totalQuantities - isItemInCart.quantity,
      };
      state.totalPrice = roundTo2(
        state.totalPrice - isItemInCart.price * isItemInCart.quantity
      );
      state.adjustedTotalPrice = roundTo2(
        state.adjustedTotalPrice -
          calcAdjustedTotalPrice(isItemInCart, isItemInCart.quantity)
      );
    },
    /** Replace cart with server state (e.g. after login). */
    setFulfillmentMethod: (
      state,
      action: PayloadAction<FulfillmentMethod>
    ) => {
      state.fulfillmentMethod = action.payload;
    },
    setPromo: (state, action: PayloadAction<CartPromo>) => {
      state.promo = action.payload;
    },
    clearPromo: (state) => {
      state.promo = null;
    },
    setCartFromServer: (state, action: PayloadAction<CartItem[]>) => {
      // Clamp any incoming quantities for safety so a bad server value can't explode the cart.
      const items = action.payload.map((item) => {
        const clampedQty = clampQuantity(item.quantity, item.availableQuantity);
        return clampedQty === item.quantity
          ? item
          : { ...item, quantity: clampedQty };
      });
      if (!items.length) {
        state.cart = null;
        state.totalPrice = 0;
        state.adjustedTotalPrice = 0;
        state.promo = null;
        return;
      }
      let totalPrice = 0;
      let adjustedTotalPrice = 0;
      let totalQuantities = 0;
      for (const item of items) {
        totalQuantities += item.quantity;
        totalPrice += item.price * item.quantity;
        adjustedTotalPrice += calcAdjustedTotalPrice(item);
      }
      state.cart = {
        items: [...items],
        totalQuantities,
      };
      state.totalPrice = roundTo2(totalPrice);
      state.adjustedTotalPrice = roundTo2(adjustedTotalPrice);
    },
  },
});

export const {
  addToCart,
  removeCartItem,
  remove,
  setCartFromServer,
  setFulfillmentMethod,
  setPromo,
  clearPromo,
} = cartsSlice.actions;

export default cartsSlice.reducer;
