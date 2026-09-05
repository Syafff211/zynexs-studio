import { CART_STORAGE_KEY, PROMO_STORAGE_KEY } from "@/lib/constants";
import type { CartLine } from "@/types";

/**
 * The cart is an *external store* backed by localStorage rather than React
 * state, so it can be consumed with `useSyncExternalStore`: no hydration
 * mismatch, no setState-inside-effect, and every open tab stays in sync.
 *
 * It is display-only state. Prices here are never trusted — the server
 * re-reads every product from the database before quoting or creating an
 * order, so tampering with localStorage achieves nothing.
 */

export interface CartState {
  items: CartLine[];
  promoCode: string | null;
}

/** Stable reference: required so the server snapshot never loops. */
export const EMPTY_CART: CartState = Object.freeze({
  items: Object.freeze([]) as unknown as CartLine[],
  promoCode: null,
});

const listeners = new Set<() => void>();

let cachedRawItems: string | null = null;
let cachedRawPromo: string | null = null;
let cachedState: CartState = EMPTY_CART;
let initialised = false;
/** Private browsing / quota errors → keep the cart alive in memory only. */
let memoryOnly = false;

const MAX_QTY = 99;

function parseItems(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CartLine => {
        if (typeof item !== "object" || item === null) return false;
        const candidate = item as Partial<CartLine>;
        return typeof candidate.productId === "string" && typeof candidate.name === "string";
      })
      .map((item) => ({
        ...item,
        quantity: Math.min(MAX_QTY, Math.max(1, Math.trunc(Number(item.quantity) || 1))),
        price: Math.max(0, Math.trunc(Number(item.price) || 0)),
      }));
  } catch {
    return [];
  }
}

export function getCartSnapshot(): CartState {
  if (typeof window === "undefined") return EMPTY_CART;
  if (memoryOnly) return cachedState;

  let rawItems: string | null = null;
  let rawPromo: string | null = null;
  try {
    rawItems = window.localStorage.getItem(CART_STORAGE_KEY);
    rawPromo = window.localStorage.getItem(PROMO_STORAGE_KEY);
  } catch {
    memoryOnly = true;
    return cachedState;
  }

  // Referential stability matters: useSyncExternalStore compares with ===.
  if (initialised && rawItems === cachedRawItems && rawPromo === cachedRawPromo) {
    return cachedState;
  }

  cachedRawItems = rawItems;
  cachedRawPromo = rawPromo;
  cachedState = { items: parseItems(rawItems), promoCode: rawPromo };
  initialised = true;
  return cachedState;
}

export function getCartServerSnapshot(): CartState {
  return EMPTY_CART;
}

function emit() {
  for (const listener of listeners) listener();
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key === null || event.key === CART_STORAGE_KEY || event.key === PROMO_STORAGE_KEY) {
    emit();
  }
}

export function subscribeToCart(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function commit(next: CartState) {
  cachedState = next;
  initialised = true;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next.items));
    if (next.promoCode) window.localStorage.setItem(PROMO_STORAGE_KEY, next.promoCode);
    else window.localStorage.removeItem(PROMO_STORAGE_KEY);
    cachedRawItems = window.localStorage.getItem(CART_STORAGE_KEY);
    cachedRawPromo = window.localStorage.getItem(PROMO_STORAGE_KEY);
  } catch {
    memoryOnly = true;
  }

  emit();
}

/** Single mutation entry point — always derives from the freshest snapshot. */
export function updateCart(updater: (state: CartState) => CartState): void {
  if (typeof window === "undefined") return;
  const current = getCartSnapshot();
  const next = updater(current);
  if (next === current) return;
  commit(next);
}

export function addCartLine(line: Omit<CartLine, "quantity">, quantity = 1): void {
  updateCart((state) => {
    const existing = state.items.find((item) => item.productId === line.productId);
    const items = existing
      ? state.items.map((item) =>
          item.productId === line.productId
            ? { ...item, quantity: Math.min(MAX_QTY, item.quantity + quantity) }
            : item
        )
      : [...state.items, { ...line, quantity: Math.min(MAX_QTY, Math.max(1, quantity)) }];
    return { ...state, items };
  });
}

export function removeCartLine(productId: string): void {
  updateCart((state) => ({
    ...state,
    items: state.items.filter((item) => item.productId !== productId),
  }));
}

export function setCartQuantity(productId: string, quantity: number): void {
  updateCart((state) => ({
    ...state,
    items:
      quantity <= 0
        ? state.items.filter((item) => item.productId !== productId)
        : state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(MAX_QTY, Math.trunc(quantity)) }
              : item
          ),
  }));
}

export function stepCartQuantity(productId: string, delta: number): void {
  updateCart((state) => ({
    ...state,
    items: state.items
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(MAX_QTY, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0),
  }));
}

export function clearCart(): void {
  updateCart(() => ({ items: [], promoCode: null }));
}

export function setCartPromoCode(code: string | null): void {
  updateCart((state) => ({ ...state, promoCode: code ? code.toUpperCase() : null }));
}
