/*import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}*/


// ============================================================
// src/app/pages/cart/cart.page.ts
// ============================================================

import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  addOutline,
  removeOutline,
  arrowBackOutline,
  cartOutline,
  chevronForwardOutline,
} from 'ionicons/icons';

import { CartService } from '../services/cart.service';
import { CartItem } from '../models/woocommerce.models';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: false,
})
export class CartPage {
  private readonly cart  = inject(CartService);
  private readonly router = inject(Router);
  private readonly alert  = inject(AlertController);
  private readonly toast  = inject(ToastController);

  // ─── Estado del CartService expuesto al template ─────────
  readonly items        = this.cart.items;
  readonly isEmpty      = this.cart.isEmpty;
  readonly totalQty     = this.cart.totalQuantity;
  readonly subtotal     = this.cart.subtotal;

  // Cálculos adicionales
  readonly shipping = computed(() => (this.subtotal() >= 999 ? 0 : 150));
  readonly total    = computed(() => this.subtotal() + this.shipping());

  // Estado de loading para el botón de checkout
  processingCheckout = signal(false);

  constructor() {
    addIcons({
      trashOutline,
      addOutline,
      removeOutline,
      arrowBackOutline,
      cartOutline,
      chevronForwardOutline,
    });
  }

  // ─── Acciones de cantidad ────────────────────────────────
  async increment(item: CartItem): Promise<void> {
    await this.cart.incrementItem(item.product.id, item.variation?.id);
  }

  async decrement(item: CartItem): Promise<void> {
    if (item.quantity === 1) {
      await this.confirmRemove(item);
      return;
    }
    await this.cart.decrementItem(item.product.id, item.variation?.id);
  }

  // ─── Eliminar ítem ───────────────────────────────────────
  async confirmRemove(item: CartItem): Promise<void> {
    const a = await this.alert.create({
      header: 'Eliminar producto',
      message: `¿Quitar "${item.product.name}" del carrito?`,
      cssClass: 'infinity-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.cart.removeItem(item.product.id, item.variation?.id);
            this.showToast(`"${item.product.name}" eliminado`);
          },
        },
      ],
    });
    await a.present();
  }

  // ─── Vaciar carrito ──────────────────────────────────────
  async confirmClear(): Promise<void> {
    const a = await this.alert.create({
      header: 'Vaciar carrito',
      message: '¿Eliminar todos los productos del carrito?',
      cssClass: 'infinity-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Vaciar',
          role: 'destructive',
          handler: async () => {
            await this.cart.clearCart();
            this.showToast('Carrito vaciado');
          },
        },
      ],
    });
    await a.present();
  }

  // ─── Ir a checkout ───────────────────────────────────────
  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  // ─── Seguir comprando ────────────────────────────────────
  goToShop(): void {
    this.router.navigate(['/home']);
  }

  // ─── Helpers de UI ───────────────────────────────────────
  getProductImage(item: CartItem): string {
    return (
      item.variation?.image?.src ??
      item.product.images?.[0]?.src ??
      'assets/placeholder-product.png'
    );
  }

  getItemPrice(item: CartItem): number {
    return parseFloat(item.variation?.price ?? item.product.price ?? '0');
  }

  getItemSubtotal(item: CartItem): number {
    return this.getItemPrice(item) * item.quantity;
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  getVariantLabel(item: CartItem): string {
    if (!item.selectedAttributes) return '';
    return Object.values(item.selectedAttributes).join(' · ');
  }

  // trackBy para el *ngFor
  trackByItem(_: number, item: CartItem): string {
    return `${item.product.id}-${item.variation?.id ?? 0}`;
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 1800,
      position: 'bottom',
      color: 'dark',
      cssClass: 'infinity-toast',
    });
    await t.present();
  }
}
