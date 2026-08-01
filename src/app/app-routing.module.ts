// ============================================================
// src/app/app-routing.module.ts
// ============================================================

import { NgModule, inject } from '@angular/core';
import { RouterModule, Routes, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

// ================================================================
// GUARDS
// ================================================================

/**
 * authGuard — protege rutas que requieren sesión activa.
 * Si no hay sesión, redirige a /login.
 */
const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};

/**
 * guestGuard — protege rutas solo para usuarios NO autenticados
 * (login, registro, onboarding).
 * Si ya hay sesión, redirige a /home.
 */
const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  return router.createUrlTree(['/home']);
};

// ================================================================
// RUTAS
// ================================================================

const routes: Routes = [

  // ── Ruta raíz ────────────────────────────────────────────────
  // Redirige al onboarding; el onboarding decide si va a login o home
  {
    path:       '',
    redirectTo: 'onboarding',
    pathMatch:  'full',
  },

  // ── Onboarding ───────────────────────────────────────────────
  // Solo se muestra la primera vez (la lógica está en el componente)
  {
    path: 'onboarding',
    loadChildren: () =>
      import('./onboarding/onboarding.module')
        .then((m) => m.OnboardingPageModule),
  },

  // ── Autenticación (solo para usuarios NO autenticados) ────────
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module')
        .then((m) => m.LoginPageModule),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./register/register.module')
        .then((m) => m.RegisterPageModule),
    canActivate: [guestGuard],
  },

  // ── Páginas públicas ─────────────────────────────────────────
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module')
        .then((m) => m.HomePageModule),
  },
  {
    path: 'search',
    loadChildren: () =>
      import('./search/search.module')
        .then((m) => m.SearchPageModule),
  },
  {
    path: 'categories',
    loadChildren: () =>
      import('./categories/categories.module')
        .then((m) => m.CategoriesPageModule),
  },
  {
    path: 'category/:id/:name',
    loadChildren: () =>
      import('./category/category.module')
        .then((m) => m.CategoryPageModule),
  },
  {
    path: 'product/:id',
    loadChildren: () =>
      import('./product-detail/product-detail.module')
        .then((m) => m.ProductDetailPageModule),
  },
  {
    path: 'cart',
    loadChildren: () =>
      import('./cart/cart.module')
        .then((m) => m.CartPageModule),
  },

  // ── Páginas protegidas (requieren sesión) ─────────────────────
  {
    path: 'checkout',
    loadChildren: () =>
      import('./checkout/checkout.module')
        .then((m) => m.CheckoutPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'orders',
    loadChildren: () =>
      import('./orders/orders.module')
        .then((m) => m.OrdersPageModule),
    canActivate: [authGuard],
  },

  // ── Ruta 404 — redirige al home ───────────────────────────────
  {
    path:       '**',
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      // Mantiene el scroll al tope al navegar entre páginas
      scrollPositionRestoration: 'top',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}