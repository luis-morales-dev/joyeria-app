import { WCAddress, WCLineItem, WCOrder } from './woocommerce.models';

export interface CheckoutCustomerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  notes?: string;
}

export interface CheckoutTotalsPayload {
  subtotal: number;
  shippingTotal: number;
  total: number;
  currency: string;
}

export interface CheckoutOrderPayload {
  billing: WCAddress;
  shipping: WCAddress;
  line_items: WCLineItem[];
  customer_note?: string;
  payment_method: string;
  payment_method_title: string;
  set_paid?: boolean;
  meta_data?: Array<{ key: string; value: string }>;
}

export interface StripeCheckoutPayload {
  customer: CheckoutCustomerPayload;
  totals: CheckoutTotalsPayload;
  order: CheckoutOrderPayload;
}

export interface StripePaymentSheetSession {
  paymentIntent: string;
  paymentIntentId: string;
  ephemeralKey?: string;
  customer?: string;
}

export interface StripeOrderConfirmation {
  paymentIntentId: string;
  order: WCOrder & { number?: string };
}
