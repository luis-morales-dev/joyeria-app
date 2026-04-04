import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Stripe, PaymentSheetEventsEnum } from '@capacitor-community/stripe';
import { environment } from '../../environments/environment';
import {
  StripeCheckoutPayload,
  StripeOrderConfirmation,
  StripePaymentSheetSession,
} from '../models/stripe.models';

@Injectable({ providedIn: 'root' })
export class StripeCheckoutService {
  private readonly http = inject(HttpClient);
  private initialized = false;

  async pay(payload: StripeCheckoutPayload): Promise<StripeOrderConfirmation> {
    await this.initialize();

    const session = await firstValueFrom(
      this.http.post<StripePaymentSheetSession>(
        `${environment.checkoutApiUrl}/stripe/payment-sheet`,
        payload
      )
    );

    await Stripe.createPaymentSheet({
      paymentIntentClientSecret: session.paymentIntent,
      customerId: session.customer,
      customerEphemeralKeySecret: session.ephemeralKey,
      merchantDisplayName: environment.stripeMerchantDisplayName,
      returnURL: environment.stripeReturnUrl,
      countryCode: payload.customer.country,
      defaultBillingDetails: {
        email: payload.customer.email,
        name: `${payload.customer.firstName} ${payload.customer.lastName}`.trim(),
        phone: payload.customer.phone,
        address: {
          city: payload.customer.city,
          country: payload.customer.country,
          line1: payload.customer.address1,
          line2: payload.customer.address2,
          postalCode: payload.customer.postcode,
          state: payload.customer.state,
        },
      },
      billingDetailsCollectionConfiguration: {
        name: 'always',
        email: 'always',
        phone: 'always',
        address: 'full',
      },
    });

    const { paymentResult } = await Stripe.presentPaymentSheet();

    if (paymentResult === PaymentSheetEventsEnum.Canceled) {
      throw new Error('El pago fue cancelado.');
    }

    if (paymentResult === PaymentSheetEventsEnum.Failed) {
      throw new Error('Stripe no pudo procesar el pago.');
    }

    return firstValueFrom(
      this.http.post<StripeOrderConfirmation>(
        `${environment.checkoutApiUrl}/stripe/confirm-order`,
        {
          paymentIntentId: session.paymentIntentId,
          payload,
        }
      )
    );
  }

  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!environment.stripePublishableKey) {
      throw new Error('Falta configurar stripePublishableKey en environment.');
    }

    await Stripe.initialize({
      publishableKey: environment.stripePublishableKey,
    });

    this.initialized = true;
  }
}
