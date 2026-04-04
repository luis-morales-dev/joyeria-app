# Stripe + WooCommerce en Ionic

La app ya quedó preparada para este flujo:

1. El checkout arma el pedido local con cliente, dirección, líneas y totales.
2. La app llama `POST /stripe/payment-sheet` en tu backend.
3. El backend crea el `PaymentIntent` en Stripe y responde los secretos necesarios para `PaymentSheet`.
4. La app presenta el pago seguro de Stripe.
5. Si Stripe confirma el cargo, la app llama `POST /stripe/confirm-order`.
6. El backend verifica el `PaymentIntent` con la secret key y entonces crea la orden en WooCommerce.

## Variables de entorno en la app

Edita:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Campos nuevos:

- `checkoutApiUrl`: base de tu backend o endpoint de WordPress personalizado.
- `stripePublishableKey`: tu public key de Stripe.
- `stripeMerchantDisplayName`: nombre mostrado en `PaymentSheet`.
- `stripeReturnUrl`: deep link para redirecciones 3DS.

## Endpoint 1: crear sesión de PaymentSheet

Ruta esperada:

`POST {checkoutApiUrl}/stripe/payment-sheet`

Body:

```json
{
  "customer": {
    "firstName": "Maria",
    "lastName": "Garcia",
    "email": "maria@ejemplo.com",
    "phone": "5512345678",
    "address1": "Calle 1",
    "address2": "Interior 3",
    "city": "CDMX",
    "state": "CDMX",
    "postcode": "01000",
    "country": "MX",
    "notes": "Entregar por la tarde"
  },
  "totals": {
    "subtotal": 1200,
    "shippingTotal": 0,
    "total": 1200,
    "currency": "mxn"
  },
  "order": {
    "billing": {},
    "shipping": {},
    "line_items": [],
    "customer_note": "Entregar por la tarde",
    "payment_method": "stripe",
    "payment_method_title": "Stripe",
    "set_paid": true
  }
}
```

Respuesta esperada:

```json
{
  "paymentIntent": "pi_client_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "ephemeralKey": "ek_test_xxx",
  "customer": "cus_xxx"
}
```

## Endpoint 2: confirmar pago y crear orden

Ruta esperada:

`POST {checkoutApiUrl}/stripe/confirm-order`

Body:

```json
{
  "paymentIntentId": "pi_xxx",
  "payload": {}
}
```

Respuesta esperada:

```json
{
  "paymentIntentId": "pi_xxx",
  "order": {
    "id": 1234,
    "number": "1234",
    "status": "processing"
  }
}
```

## Recomendación de backend

Lo ideal es hacerlo en un plugin o endpoint custom de WordPress para que:

- Stripe secret key viva sólo en servidor.
- La validación del `PaymentIntent` no dependa del cliente.
- La orden de WooCommerce se cree sólo después de confirmar que `payment_status = succeeded`.

## Importante

Hoy el proyecto ya trae `wooConsumerKey` y `wooConsumerSecret` en frontend. Eso no es seguro para producción. Conviene mover también la creación de órdenes y cualquier acción administrativa a backend.
