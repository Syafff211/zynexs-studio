"use client";

import * as React from "react";
import {
  addCartLine,
  clearCart,
  getCartServerSnapshot,
  getCartSnapshot,
  removeCartLine,
  setCartPromoCode,
  setCartQuantity,
  stepCartQuantity,
  subscribeToCart,
} from "@/lib/cart-store";
import { useMounted } from "@/hooks/use-mounted";
import type { CartLine } from "@/types";

/**
 * Thin React binding over the localStorage-backed cart store.
 * All state lives in `@/lib/cart-store`; this file only exposes it to
 * components (and keeps the API surface identical across the app).
 */

interface CartContextValue {
  items: CartLine[];
  promoCode: string | null;
  count: number;
  subtotal: number;
  /** false until localStorage has been read — use it to avoid flashing "empty". */
  hydrated: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  clear: () => void;
  setPromoCode: (code: string | null) => void;
  has: (productId: string) => boolean;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const state = React.useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getCartServerSnapshot
  );
  const hydrated = useMounted();

  const value = React.useMemo<CartContextValue>(() => {
    const { items, promoCode } = state;
    return {
      items,
      promoCode,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      hydrated,
      add: addCartLine,
      remove: removeCartLine,
      setQuantity: setCartQuantity,
      increment: (productId: string) => stepCartQuantity(productId, 1),
      decrement: (productId: string) => stepCartQuantity(productId, -1),
      clear: clearCart,
      setPromoCode: setCartPromoCode,
      has: (productId: string) => items.some((item) => item.productId === productId),
    };
  }, [state, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
