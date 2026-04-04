import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cardOutline,
  checkmarkCircle,
  chevronDownOutline,
  chevronUpOutline,
  logoUsd,
} from 'ionicons/icons';

import { StripeCheckoutService } from '../services/stripe-checkout.service';
import { CartService } from '../services/cart.service';
import { CartItem, WCAddress } from '../models/woocommerce.models';
import { StripeCheckoutPayload } from '../models/stripe.models';

interface CheckoutFormValue {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  notes: string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: false,
})
export class CheckoutPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastController);
  private readonly stripeCheckout = inject(StripeCheckoutService);

  checkoutForm!: FormGroup;

  readonly items = this.cart.items;
  readonly subtotal = this.cart.subtotal;
  readonly isEmpty = this.cart.isEmpty;

  readonly shipping = computed(() => (this.subtotal() >= 999 ? 0 : 150));
  readonly total = computed(() => this.subtotal() + this.shipping());

  readonly summaryExpanded = signal(true);
  readonly submitting = signal(false);
  readonly orderPlaced = signal(false);
  readonly orderNumber = signal('');
  readonly paymentLabel = signal('Stripe');

  constructor() {
    addIcons({
      arrowBackOutline,
      cardOutline,
      checkmarkCircle,
      chevronDownOutline,
      chevronUpOutline,
      logoUsd,
    });
  }

  ngOnInit(): void {
    if (this.isEmpty()) {
      this.router.navigate(['/home']);
      return;
    }

    this.checkoutForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      address1: ['', [Validators.required, Validators.minLength(5)]],
      address2: [''],
      city: ['', [Validators.required, Validators.minLength(2)]],
      state: ['', [Validators.required, Validators.minLength(2)]],
      postcode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
      country: ['MX', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
      notes: [''],
    });
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.checkoutForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getFieldError(field: string): string {
    const ctrl = this.checkoutForm.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.errors['required']) return 'Este campo es obligatorio';
    if (ctrl.errors['minlength']) return 'Revisa la información capturada';
    if (ctrl.errors['email']) return 'Ingresa un email válido';
    if (ctrl.errors['pattern']) {
      if (field === 'phone') return 'Ingresa 10 dígitos sin espacios';
      if (field === 'postcode') return 'Ingresa un código postal de 5 dígitos';
      return 'Formato inválido';
    }
    return '';
  }

  toggleSummary(): void {
    this.summaryExpanded.update((value) => !value);
  }

  async placeOrder(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      await this.showToast('Completa los datos del envío y contacto.', 'warning');
      return;
    }

    this.submitting.set(true);

    try {
      const payload = this.buildStripePayload();
      const confirmation = await this.stripeCheckout.pay(payload);

      this.orderNumber.set(String(confirmation.order.number ?? confirmation.order.id ?? ''));
      await this.cart.clearCart();
      this.orderPlaced.set(true);
      await this.showToast('Pago aprobado y orden creada en WooCommerce.', 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No fue posible completar el pago.';
      await this.showToast(message, 'danger');
    } finally {
      this.submitting.set(false);
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  getItemImage(item: CartItem): string {
    return (
      item.variation?.image?.src ??
      item.product.images?.[0]?.src ??
      'assets/placeholder-product.png'
    );
  }

  trackByItem(_: number, item: CartItem): string {
    return `${item.product.id}-${item.variation?.id ?? 0}`;
  }

  private buildStripePayload(): StripeCheckoutPayload {
    const form = this.checkoutForm.getRawValue() as CheckoutFormValue;
    const billingAddress = this.buildAddress(form);

    return {
      customer: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address1: form.address1,
        address2: form.address2,
        city: form.city,
        state: form.state,
        postcode: form.postcode,
        country: form.country,
        notes: form.notes,
      },
      totals: {
        subtotal: this.subtotal(),
        shippingTotal: this.shipping(),
        total: this.total(),
        currency: 'mxn',
      },
      order: {
        billing: billingAddress,
        shipping: billingAddress,
        line_items: this.cart.toLineItems(),
        customer_note: form.notes,
        payment_method: 'stripe',
        payment_method_title: 'Stripe',
        set_paid: true,
        meta_data: [
          { key: '_created_from', value: 'ionic-app' },
        ],
      },
    };
  }

  private buildAddress(form: CheckoutFormValue): WCAddress {
    return {
      first_name: form.firstName,
      last_name: form.lastName,
      address_1: form.address1,
      address_2: form.address2,
      city: form.city,
      state: form.state,
      postcode: form.postcode,
      country: form.country,
      email: form.email,
      phone: form.phone,
    };
  }

  private async showToast(message: string, color = 'dark'): Promise<void> {
    const toast = await this.toast.create({
      message,
      duration: 2400,
      position: 'bottom',
      color,
      cssClass: 'infinity-toast',
    });
    await toast.present();
  }
}
