// ============================================================
// src/app/pages/search/search.page.ts
// ============================================================

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  closeOutline,
  cartOutline,
  arrowBackOutline,
  heartOutline,
  starSharp,
} from 'ionicons/icons';

import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';
import { WCProduct, WCCategory } from '../models/woocommerce.models';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: false,
})
export class SearchPage implements OnInit {
  private readonly router = inject(Router);
  private readonly woo    = inject(WoocommerceService);
  private readonly cart   = inject(CartService);
  private readonly toast  = inject(ToastController);

  // ─── Campo de búsqueda ───────────────────────────────────
  query        = signal('');
  inputValue   = '';  // ngModel del input (no signal para compatibilidad con template)

  // ─── Estado ──────────────────────────────────────────────
  searching    = signal(false);
  hasSearched  = signal(false);

  // ─── Resultados ──────────────────────────────────────────
  results      = signal<WCProduct[]>([]);
  totalResults = signal(0);

  // ─── Categorías sugeridas (estado vacío) ─────────────────
  categories   = signal<WCCategory[]>([]);
  loadingCats  = signal(true);

  // ─── Carrito ─────────────────────────────────────────────
  cartCount    = computed(() => this.cart.totalQuantity());

  // Skeletons
  readonly skeletonItems = Array(6).fill(0);

  constructor() {
    addIcons({
      searchOutline, closeOutline, cartOutline,
      arrowBackOutline, heartOutline, starSharp,
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  // ─── Carga categorías sugeridas ──────────────────────────
  private loadCategories(): void {
    this.loadingCats.set(true);
    this.woo.getCategories(12, 0).subscribe({
      next: (cats) => {
        this.categories.set(cats.filter((c) => c.slug !== 'uncategorized'));
        this.loadingCats.set(false);
      },
      error: () => this.loadingCats.set(false),
    });
  }

  // ─── Búsqueda ────────────────────────────────────────────
  onSearch(): void {
    const q = this.inputValue.trim();
    if (!q) return;

    this.query.set(q);
    this.searching.set(true);
    this.hasSearched.set(true);
    this.results.set([]);

    this.woo.searchProducts(q, 20).subscribe({
      next: (products) => {
        this.results.set(products);
        this.totalResults.set(products.length);
        this.searching.set(false);
      },
      error: () => {
        this.searching.set(false);
        this.showToast('Error al buscar productos');
      },
    });
  }

  // ─── Limpiar búsqueda ────────────────────────────────────
  clearSearch(): void {
    this.inputValue  = '';
    this.query.set('');
    this.results.set([]);
    this.hasSearched.set(false);
    this.totalResults.set(0);
  }

  // ─── Búsqueda desde chip de categoría ───────────────────
  searchByCategory(cat: WCCategory): void {
    this.router.navigate(['/category', cat.id, cat.name]);
  }

  // ─── Carrito ─────────────────────────────────────────────
  isInCart(productId: number): boolean {
    return this.cart.isInCart(productId);
  }

  async addToCart(product: WCProduct, event: Event): Promise<void> {
    event.stopPropagation();
    if (product.stock_status !== 'instock') return;
    await this.cart.addItem(product, 1);
    const t = await this.toast.create({
      message: `"${product.name}" agregado al carrito`,
      duration: 1800,
      position: 'bottom',
      color: 'dark',
      cssClass: 'infinity-toast',
    });
    await t.present();
  }

  // ─── Navegación ──────────────────────────────────────────
  goBack(): void           { this.router.navigate(['/home']); }
  goToCart(): void         { this.router.navigate(['/cart']); }
  goToProduct(id: number): void { this.router.navigate(['/product', id]); }

  // ─── Helpers ─────────────────────────────────────────────
  getProductImage(product: WCProduct): string {
    return product.images?.[0]?.src ?? 'assets/placeholder-product.png';
  }

  getCategoryImage(cat: WCCategory): string {
    return cat.image?.src ?? '';
  }

  formatPrice(price: string): string {
    const num = parseFloat(price);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(num);
  }

  hasDiscount(product: WCProduct): boolean {
    return product.on_sale && !!product.sale_price && !!product.regular_price;
  }

  discountPercent(product: WCProduct): number {
    const regular = parseFloat(product.regular_price);
    const sale    = parseFloat(product.sale_price);
    if (!regular || !sale) return 0;
    return Math.round(((regular - sale) / regular) * 100);
  }

  trackByProduct(_: number, p: WCProduct): number { return p.id; }
  trackByCat(_: number, c: WCCategory): number     { return c.id; }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
  }
}
