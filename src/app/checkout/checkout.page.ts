/*import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}*/


// ============================================================
// src/app/pages/checkout/checkout.page.ts
// ============================================================

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cardOutline,
  cashOutline,
  phonePortraitOutline,
  checkmarkCircle,
  chevronDownOutline,
  chevronUpOutline,
} from 'ionicons/icons';

import { CartService } from '../services/cart.service';

export type PaymentMethod = 'card' | 'cash' | 'transfer';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: false,
})
export class CheckoutPage implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cart   = inject(CartService);
  private readonly toast  = inject(ToastController);

  // ─── Formulario ──────────────────────────────────────────
  Myform!: FormGroup;

  // ─── Carrito ─────────────────────────────────────────────
  readonly items    = this.cart.items;
  readonly subtotal = this.cart.subtotal;
  readonly isEmpty  = this.cart.isEmpty;

  readonly shipping = computed(() => (this.subtotal() >= 999 ? 0 : 150));
  readonly total    = computed(() => this.subtotal() + this.shipping());

  // ─── Resumen expandible ───────────────────────────────────
  summaryExpanded = signal(true);

  // ─── Métodos de pago ─────────────────────────────────────
  readonly paymentOptions: PaymentOption[] = [
    {
      id: 'card',
      label: 'Tarjeta de crédito / débito',
      icon: 'card-outline',
      description: 'Visa, Mastercard, American Express',
    },
    {
      id: 'transfer',
      label: 'Transferencia bancaria',
      icon: 'phone-portrait-outline',
      description: 'SPEI / CoDi',
    },
    {
      id: 'cash',
      label: 'Pago en efectivo',
      icon: 'cash-outline',
      description: 'OXXO, 7-Eleven, Farmacias',
    },
  ];

  selectedPayment = signal<PaymentMethod>('card');

  // ─── Estado ──────────────────────────────────────────────
  submitting   = signal(false);
  orderPlaced  = signal(false);
  orderNumber  = signal('');

  constructor() {
    addIcons({
      arrowBackOutline, cardOutline, cashOutline,
      phonePortraitOutline, checkmarkCircle,
      chevronDownOutline, chevronUpOutline,
    });
  }

  ngOnInit(): void {
    // Si el carrito está vacío redirigir
    if (this.isEmpty()) {
      this.router.navigate(['/home']);
      return;
    }

    this.Myform = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', [Validators.required, Validators.minLength(2)]],
      email:     ['', [Validators.required, Validators.email]],
      phone:     ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    });
  }

  // ─── Helpers de formulario ───────────────────────────────
  isFieldInvalid(field: string): boolean {
    const ctrl = this.Myform.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getFieldError(field: string): string {
    const ctrl = this.Myform.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.errors['required'])   return 'Este campo es obligatorio';
    if (ctrl.errors['minlength'])  return 'Mínimo 2 caracteres';
    if (ctrl.errors['email'])      return 'Ingresa un email válido';
    if (ctrl.errors['pattern'])    return 'Ingresa 10 dígitos sin espacios';
    return '';
  }

  // ─── Método de pago ──────────────────────────────────────
  selectPayment(method: PaymentMethod): void {
    this.selectedPayment.set(method);
  }

  // ─── Resumen ─────────────────────────────────────────────
  toggleSummary(): void {
    this.summaryExpanded.update((v) => !v);
  }

  // ─── Confirmar pedido ────────────────────────────────────
  async placeOrder(): Promise<void> {
    if (this.Myform.invalid) {
      this.Myform.markAllAsTouched();
      this.showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    this.submitting.set(true);

    // Simulación de procesamiento (aquí irá createOrder() en la siguiente fase)
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Generar número de orden aleatorio
    const num = `INF-${Date.now().toString().slice(-6)}`;
    this.orderNumber.set(num);

    // Vaciar carrito
    await this.cart.clearCart();

    this.submitting.set(false);
    this.orderPlaced.set(true);
  }

  // ─── Navegar tras confirmación ───────────────────────────
  goHome(): void {
    this.router.navigate(['/home']);
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }

  // ─── Helpers de UI ───────────────────────────────────────
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  getItemImage(item: any): string {
    return (
      item.variation?.image?.src ??
      item.product.images?.[0]?.src ??
      'assets/placeholder-product.png'
    );
  }

  trackByItem(_: number, item: any): string {
    return `${item.product.id}-${item.variation?.id ?? 0}`;
  }

  private async showToast(message: string, color = 'dark'): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
      cssClass: 'infinity-toast',
    });
    await t.present();
  }
}