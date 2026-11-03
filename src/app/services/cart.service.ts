// ============================================================
// src/app/services/cart.service.ts
// ============================================================
// Requiere: @ionic/storage-angular
//   npm install @ionic/storage-angular
//   En app.module.ts (o app.config.ts): importar IonicStorageModule.forRoot()
// ============================================================


import { Injectable, inject, signal, computed } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { CartItem, WCProduct, WCVariation } from '../models/woocommerce.models';
 
const CART_STORAGE_KEY = 'wc_cart';
 
// ─── Reglas de descuento y envío ─────────────────────────────
// 15% en toda compra; 20% si el subtotal supera $20,000 MXN
// (el 20% reemplaza al 15%, no se acumulan)
export const DISCOUNT_BASE_RATE      = 0.15;
export const DISCOUNT_HIGH_RATE      = 0.20;
export const DISCOUNT_HIGH_THRESHOLD = 20000;
const FREE_SHIPPING_THRESHOLD = 10000;  // envío gratis si el subtotal es MAYOR a esto
const SHIPPING_COST           = 300;
 
const round2 = (n: number): number => Math.round(n * 100) / 100;
 
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storage = inject(Storage);
 
  // ─── Estado reactivo con Signals (Angular 17+) ──────────
  private readonly _items = signal<CartItem[]>([]);
  private _storageReady = false;
 
  /** Lista de ítems del carrito (solo lectura) */
  readonly items = this._items.asReadonly();
 
  /** Cantidad total de productos en el carrito */
  readonly totalQuantity = computed(() =>
    this._items().reduce((acc, item) => acc + item.quantity, 0)
  );
 
  /** Subtotal del carrito */
  readonly subtotal = computed(() =>
    this._items().reduce((acc, item) => {
      const price = parseFloat(item.variation?.price ?? item.product.price ?? '0');
      return acc + price * item.quantity;
    }, 0)
  );
 
  // ─── Descuento ─────────────────────────────────────────
  /** Tasa de descuento que aplica (0.15 o 0.20) */
  readonly discountRate = computed(() =>
    this.subtotal() > DISCOUNT_HIGH_THRESHOLD ? DISCOUNT_HIGH_RATE : DISCOUNT_BASE_RATE
  );
 
  /** Porcentaje en entero para mostrar en pantalla (15 o 20) */
  readonly discountPercent = computed(() => Math.round(this.discountRate() * 100));
 
  /** Porcentaje del nivel alto, para mensajes tipo "obtén 20%" */
  readonly highTierPercent = Math.round(DISCOUNT_HIGH_RATE * 100);
 
  /** Monto descontado en pesos */
  readonly discountAmount = computed(() => round2(this.subtotal() * this.discountRate()));
 
  /** Subtotal con el descuento ya aplicado */
  readonly subtotalAfterDiscount = computed(() =>
    round2(this.subtotal() - this.discountAmount())
  );
 
  /** Cuánto falta (sobre el subtotal) para pasar al descuento alto */
  readonly amountToHighTier = computed(() =>
    Math.max(0, round2(DISCOUNT_HIGH_THRESHOLD - this.subtotal()))
  );
 
  // ─── Envío y total ─────────────────────────────────────
  /** Envío de $300; gratis si el subtotal (antes del descuento) supera $10,000 */
  readonly shipping = computed(() =>
    this.subtotal() > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  );
 
  /** Cuánto falta (sobre el subtotal) para tener envío gratis */
  readonly amountToFreeShipping = computed(() =>
    Math.max(0, round2(FREE_SHIPPING_THRESHOLD - this.subtotal()))
  );
 
  /** Total a pagar: subtotal - descuento + envío */
  readonly total = computed(() => round2(this.subtotalAfterDiscount() + this.shipping()));
 
  /** Cantidad de líneas distintas en el carrito */
  readonly itemCount = computed(() => this._items().length);
 
  /** ¿El carrito está vacío? */
  readonly isEmpty = computed(() => this._items().length === 0);
 
  constructor() {
    this.initStorage();
  }
 
  // ─── Inicialización ─────────────────────────────────────
  private async initStorage(): Promise<void> {
    await this.storage.create();
    this._storageReady = true;
    await this.loadCart();
  }
 
  private async loadCart(): Promise<void> {
    const saved = await this.storage.get(CART_STORAGE_KEY);
    if (saved) this._items.set(saved);
  }
 
  private async persistCart(): Promise<void> {
    if (!this._storageReady) return;
    await this.storage.set(CART_STORAGE_KEY, this._items());
  }
 
  // ─── Helpers ────────────────────────────────────────────
 
  /** Genera una clave única para identificar un ítem en el carrito */
  private getItemKey(productId: number, variationId?: number): string {
    return variationId ? `${productId}-${variationId}` : `${productId}`;
  }
 
  private findItemIndex(productId: number, variationId?: number): number {
    const key = this.getItemKey(productId, variationId);
    return this._items().findIndex(
      (i) => this.getItemKey(i.product.id, i.variation?.id) === key
    );
  }
 
  // ================================================================
  // ACCIONES PÚBLICAS
  // ================================================================
 
  /** Agrega un producto al carrito. Si ya existe, incrementa la cantidad. */
  async addItem(
    product: WCProduct,
    quantity = 1,
    variation?: WCVariation,
    selectedAttributes?: { [key: string]: string }
  ): Promise<void> {
    const index = this.findItemIndex(product.id, variation?.id);
 
    if (index > -1) {
      // Producto ya en carrito → incrementar cantidad
      const updated = [...this._items()];
      updated[index] = {
        ...updated[index],
        quantity: updated[index].quantity + quantity,
      };
      this._items.set(updated);
    } else {
      // Producto nuevo → agregar
      this._items.update((items) => [
        ...items,
        { product, variation, quantity, selectedAttributes },
      ]);
    }
 
    await this.persistCart();
  }
 
  /** Elimina un ítem del carrito por producto (y variación opcional) */
  async removeItem(productId: number, variationId?: number): Promise<void> {
    const index = this.findItemIndex(productId, variationId);
    if (index === -1) return;
 
    this._items.update((items) => items.filter((_, i) => i !== index));
    await this.persistCart();
  }
 
  /** Actualiza la cantidad de un ítem. Si qty <= 0, lo elimina. */
  async updateQuantity(
    productId: number,
    quantity: number,
    variationId?: number
  ): Promise<void> {
    if (quantity <= 0) {
      await this.removeItem(productId, variationId);
      return;
    }
 
    const index = this.findItemIndex(productId, variationId);
    if (index === -1) return;
 
    const updated = [...this._items()];
    updated[index] = { ...updated[index], quantity };
    this._items.set(updated);
    await this.persistCart();
  }
 
  /** Incrementa en 1 la cantidad de un ítem */
  async incrementItem(productId: number, variationId?: number): Promise<void> {
    const index = this.findItemIndex(productId, variationId);
    if (index === -1) return;
    const current = this._items()[index].quantity;
    await this.updateQuantity(productId, current + 1, variationId);
  }
 
  /** Decrementa en 1 la cantidad. Si llega a 0, elimina el ítem. */
  async decrementItem(productId: number, variationId?: number): Promise<void> {
    const index = this.findItemIndex(productId, variationId);
    if (index === -1) return;
    const current = this._items()[index].quantity;
    await this.updateQuantity(productId, current - 1, variationId);
  }
 
  /** Vacía el carrito completamente */
  async clearCart(): Promise<void> {
    this._items.set([]);
    await this.storage.remove(CART_STORAGE_KEY);
  }
 
  /** Verifica si un producto ya está en el carrito */
  isInCart(productId: number, variationId?: number): boolean {
    return this.findItemIndex(productId, variationId) > -1;
  }
 
  /** Obtiene la cantidad de un ítem específico en el carrito */
  getItemQuantity(productId: number, variationId?: number): number {
    const index = this.findItemIndex(productId, variationId);
    return index > -1 ? this._items()[index].quantity : 0;
  }
 
  /**
   * Convierte los ítems del carrito al formato line_items de WooCommerce
   * para usarlo directamente en createOrder()
   */
  toLineItems() {
    return this._items().map((item) => ({
      product_id: item.product.id,
      variation_id: item.variation?.id,
      quantity: item.quantity,
    }));
  }
}