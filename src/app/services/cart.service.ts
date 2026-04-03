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
