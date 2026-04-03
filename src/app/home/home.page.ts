/*import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  constructor() {}

}*/

// ============================================================
// src/app/pages/home/home.page.ts
// ============================================================

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cartOutline, searchOutline, heartOutline, starSharp } from 'ionicons/icons';

import { WoocommerceService} from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';
import { WCProduct, WCCategory } from '../models/woocommerce.models';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  private readonly woo   = inject(WoocommerceService);
  private readonly cart  = inject(CartService);
  private readonly toast = inject(ToastController);

  // ─── Estado ─────────────────────────────────────────────
  categories     = signal<WCCategory[]>([]);
  featured       = signal<WCProduct[]>([]);
  loadingCats    = signal(true);
  loadingFeatured = signal(true);

  // Categoría activa para filtrar (null = todas)
  activeCategory = signal<number | null>(null);

  // Del CartService
  cartCount = computed(() => this.cart.totalQuantity());

  // Skeleton placeholders
  readonly skeletonItems = Array(4).fill(0);

  constructor() {
    addIcons({ cartOutline, searchOutline, heartOutline, starSharp });
  }

  ngOnInit(): void {
    this.loadData();
  }

  // ─── Carga de datos ─────────────────────────────────────
  loadData(): void {
    this.loadCategories();
    this.loadFeatured();
  }

  private loadCategories(): void {
    this.loadingCats.set(true);
    this.woo.getCategories(20, 0).subscribe({
      next: (cats) => {
        // Excluir "Uncategorized" (id 15 por defecto en WC)
        this.categories.set(cats.filter((c) => c.slug !== 'uncategorized'));
        this.loadingCats.set(false);
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.loadingCats.set(false);
        this.showToast('No se pudieron cargar las categorías');
      },
    });
  }

  private loadFeatured(categoryId?: number): void {
    this.loadingFeatured.set(true);

    const params = categoryId
      ? { featured: true, category: categoryId, per_page: 10 }
      : { featured: true, per_page: 10 };

    this.woo.getProducts(params).subscribe({
      next: (res) => {
        this.featured.set(res.data);
        this.loadingFeatured.set(false);
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.loadingFeatured.set(false);
        this.showToast('No se pudieron cargar los productos');
      },
    });
  }

  // ─── Filtro por categoría ────────────────────────────────
  selectCategory(id: number | null): void {
    this.activeCategory.set(id);
    this.loadFeatured(id ?? undefined);
  }

  // ─── Carrito ─────────────────────────────────────────────
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

  // ─── Pull-to-refresh ─────────────────────────────────────
  handleRefresh(event: any): void {
    this.loadData();
    setTimeout(() => event.target.complete(), 1500);
  }

  // ─── Helpers de UI ──────────────────────────────────────
  getProductImage(product: WCProduct): string {
    return product.images?.[0]?.src ?? 'assets/placeholder-product.png';
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

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2500, position: 'bottom' });
    await t.present();
  }

  isInCart(productId: number, variationId?: number): boolean {
    return this.cart.isInCart(productId, variationId);
  }
}
