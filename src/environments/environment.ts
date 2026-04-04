// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  wooApiUrl:          'https://joyeriainfinity.com.mx/wp-json/wc/v3',
  wooConsumerKey:     'ck_bb124a88cccba82056e500e989ece6bf8982431f',
  wooConsumerSecret:  'cs_b61e132fd94845c9dc2df7e3ceaae347764b40f3',
  checkoutApiUrl:     'https://joyeriainfinity.com.mx/wp-json/joyeria/v1',
  stripePublishableKey: 'pk_test_51SL69ZQ12TgXLZukl9DEjAsWs4jHsoInwVxHXRTE9LKYLGqD5EWwkRuWgAjA0QpgtxE4uaGWqPwTwxm1a3fJvJBN00A6bySDNI',
  stripeMerchantDisplayName: 'Joyeria Infinity',
  stripeReturnUrl:    'joyeriaapp://stripe-redirect',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
