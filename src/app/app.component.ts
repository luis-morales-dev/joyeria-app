/*import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {}
}*/


// ============================================================
// src/app/app.component.ts
// ============================================================
import { register } from 'swiper/element/bundle';
register();
import { Component, inject, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  homeOutline, searchOutline, cartOutline,
  receiptOutline, logInOutline, logOutOutline,
  personAddOutline, gridOutline,
} from 'ionicons/icons';

import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

interface MenuPage {
  title: string;
  url:   string;
  icon:  string;
}

@Component({
  selector:    'app-root',
  templateUrl: 'app.component.html',
  styleUrls:   ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private readonly auth   = inject(AuthService);
  private readonly cart   = inject(CartService);
  private readonly router = inject(Router);

  // ─── Estado ──────────────────────────────────────────────
  isAuthenticated = computed(() => this.auth.isAuthenticated());
  cartCount       = computed(() => this.cart.totalQuantity());
  currentUrl      = '';

  // ─── Páginas del menú ────────────────────────────────────
  readonly mainPages: MenuPage[] = [
    { title: 'Inicio',      url: '/home',       icon: 'home-outline'    },
    { title: 'Categorías',  url: '/categories', icon: 'grid-outline'    },
    { title: 'Buscar',      url: '/search',     icon: 'search-outline'  },
    { title: 'Mi carrito',  url: '/cart',       icon: 'cart-outline'    },
  ];

  readonly accountPages: MenuPage[] = [
    { title: 'Mis pedidos', url: '/orders',     icon: 'receipt-outline' },
  ];

  constructor() {
    addIcons({
      homeOutline, searchOutline, cartOutline,
      receiptOutline, logInOutline, logOutOutline,
      personAddOutline, gridOutline,
    });

    // Rastrear la URL activa para resaltar el ítem del menú
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentUrl = e.urlAfterRedirects;
      });
  }

  // ─── Navegación ──────────────────────────────────────────
  navigate(url: string): void {
    this.router.navigate([url]);
  }

  isActivePage(url: string): boolean {
    return this.currentUrl.startsWith(url);
  }

  // ─── Logout ──────────────────────────────────────────────
  async logout(): Promise<void> {
    await this.auth.logout();
  }

  // ─── Helpers de usuario ──────────────────────────────────
  getUserName(): string {
    const c = this.auth.customer();
    if (!c) return '';
    const name = `${c.first_name} ${c.last_name}`.trim();
    return name || c.username || c.email;
  }

  getUserEmail(): string {
    return this.auth.customer()?.email ?? '';
  }

  getUserInitial(): string {
    const name = this.getUserName();
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}