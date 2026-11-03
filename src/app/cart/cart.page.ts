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
  lockClosedOutline,
} from 'ionicons/icons';

import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { CartItem } from '../models/woocommerce.models';

@Component({
  selector:    'app-cart',
  templateUrl: './cart.page.html',
  styleUrls:   ['./cart.page.scss'],
  standalone: false,
})
export class CartPage {
  private readonly cart   = inject(CartService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alert  = inject(AlertController);
  private readonly toast  = inject(ToastController);

  // ─── Estado del CartService ──────────────────────────────
  readonly items    = this.cart.items;
  readonly isEmpty  = this.cart.isEmpty;
  readonly subtotal = this.cart.subtotal;
  readonly totalQty = this.cart.totalQuantity;
 
  // ¿El usuario está autenticado?
  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
 
  // ─── Descuento, envío y total (calculados en CartService) ─
  readonly discountPercent      = this.cart.discountPercent;   // 15 o 20
  readonly discountAmount       = this.cart.discountAmount;    // monto en pesos
  readonly highTierPercent      = this.cart.highTierPercent;   // 20
  readonly amountToHighTier     = this.cart.amountToHighTier;  // falta para el 20%
  readonly shipping             = this.cart.shipping;
  readonly amountToFreeShipping = this.cart.amountToFreeShipping;  // falta para envío gratis
  readonly total                = this.cart.total;

  constructor() {
    addIcons({
      trashOutline, addOutline, removeOutline,
      arrowBackOutline, cartOutline, chevronForwardOutline,
      lockClosedOutline,
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
      header:  'Eliminar producto',
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
      header:  'Vaciar carrito',
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

  // ─── Ir al checkout ──────────────────────────────────────
  //Cambiamos el comportamiento del boton "Checkout"
  /*goToCheckout(): void {
    if (!this.auth.isAuthenticated()) {
      // No tiene sesión → ir al login pasando /checkout como returnUrl
      // El authGuard del checkout también haría esto, pero es mejor
      // UX manejarlo aquí para poder mostrar el mensaje de login
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/checkout' },
      });
      return;
    }
    this.router.navigate(['/checkout']);
  }*/
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
      style:    'currency',
      currency: 'MXN',
    }).format(amount);
  }

  getVariantLabel(item: CartItem): string {
    if (!item.selectedAttributes) return '';
    return Object.values(item.selectedAttributes).join(' · ');
  }

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
