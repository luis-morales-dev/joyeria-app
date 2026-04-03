/*import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
})
export class CategoryPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
*/

// ============================================================
// src/app/pages/category/category.page.ts
// ============================================================

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cartOutline,
  funnelOutline,
  heartOutline,
  starSharp,
  gridOutline,
  listOutline,
} from 'ionicons/icons';

import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';
import { WCProduct, WCCategory, WCProductParams } from '../models/woocommerce.models';

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'rating' | 'date';

@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
  standalone: false,
})
export class CategoryPage implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly woo    = inject(WoocommerceService);
  private readonly cart   = inject(CartService);
  private readonly toast  = inject(ToastController);

  // ─── Datos de la categoría ───────────────────────────────
  categoryId   = signal<number>(0);
  categoryName = signal<string>('');
  categoryImg  = signal<string>('');

  // ─── Productos ───────────────────────────────────────────
  products     = signal<WCProduct[]>([]);
  loading      = signal(true);
  loadingMore  = signal(false);

  // ─── Paginación ──────────────────────────────────────────
  currentPage  = signal(1);
  totalPages   = signal(1);
  totalItems   = signal(0);
  perPage      = 12;

  hasMore = computed(() => this.currentPage() < this.totalPages());

  // ─── Ordenamiento ────────────────────────────────────────
  activeSort = signal<SortOption>('default');

  readonly sortOptions: { id: SortOption; label: string }[] = [
    { id: 'default',    label: 'Relevancia'    },
    { id: 'date',       label: 'Más recientes' },
    { id: 'price_asc',  label: 'Precio: menor a mayor' },
    { id: 'price_desc', label: 'Precio: mayor a menor' },
    { id: 'rating',     label: 'Mejor valorados' },
  ];

  showSortMenu = signal(false);

  // ─── Carrito ─────────────────────────────────────────────
  cartCount = computed(() => this.cart.totalQuantity());

  // ─── Skeleton placeholders ───────────────────────────────
  readonly skeletonItems = Array(6).fill(0);

  constructor() {
    addIcons({
      arrowBackOutline, cartOutline, funnelOutline,
      heartOutline, starSharp, gridOutline, listOutline,
    });
  }

  ngOnInit(): void {
    // Leer id y nombre desde los parámetros de la ruta
    // Ruta esperada: /category/:id/:name
    const id   = Number(this.route.snapshot.paramMap.get('id'));
    const name = this.route.snapshot.paramMap.get('name') ?? 'Categoría';

    this.categoryId.set(id);
    this.categoryName.set(decodeURIComponent(name));

    // Cargar info de la categoría (imagen del banner)
    this.loadCategoryInfo(id);
    this.loadProducts();
  }

  // ─── Carga la imagen y datos de la categoría ─────────────
  private loadCategoryInfo(id: number): void {
    this.woo.getCategory(id).subscribe({
      next: (cat: WCCategory) => {
        this.categoryName.set(cat.name);
        if (cat.image?.src) this.categoryImg.set(cat.image.src);
      },
      error: () => {},  // no crítico, el nombre ya viene de la ruta
    });
  }

  // ─── Carga inicial de productos ──────────────────────────
  loadProducts(): void {
    this.loading.set(true);
    this.currentPage.set(1);
    this.products.set([]);

    this.woo.getProducts(this.buildParams(1)).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.totalPages.set(res.totalPages);
        this.totalItems.set(res.totalItems);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('No se pudieron cargar los productos');
      },
    });
  }

  // ─── Cargar más productos (siguiente página) ─────────────
  loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) return;

    const nextPage = this.currentPage() + 1;
    this.loadingMore.set(true);

    this.woo.getProducts(this.buildParams(nextPage)).subscribe({
      next: (res) => {
        this.products.update((prev) => [...prev, ...res.data]);
        this.currentPage.set(nextPage);
        this.totalPages.set(res.totalPages);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
        this.showToast('Error al cargar más productos');
      },
    });
  }

  // ─── Construir parámetros de la petición ─────────────────
  private buildParams(page: number): WCProductParams {
    const params: WCProductParams = {
      category: this.categoryId(),
      per_page: this.perPage,
      page,
      status: 'publish',
    };

    switch (this.activeSort()) {
      case 'price_asc':
        params.orderby = 'price';
        params.order   = 'asc';
        break;
      case 'price_desc':
        params.orderby = 'price';
        params.order   = 'desc';
        break;
      case 'rating':
        params.orderby = 'rating';
        break;
      case 'date':
        params.orderby = 'date';
        params.order   = 'desc';
        break;
      default:
        params.orderby = 'popularity';
        break;
    }

    return params;
  }

  // ─── Ordenamiento ────────────────────────────────────────
  toggleSortMenu(): void {
    this.showSortMenu.update((v) => !v);
  }

  selectSort(sort: SortOption): void {
    this.activeSort.set(sort);
    this.showSortMenu.set(false);
    this.loadProducts();
  }

  getSortLabel(): string {
    return this.sortOptions.find((s) => s.id === this.activeSort())?.label ?? 'Ordenar';
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
  goBack(): void {
    this.router.navigate(['/home']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToProduct(id: number): void {
    this.router.navigate(['/product', id]);
  }

  // ─── Helpers de UI ───────────────────────────────────────
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

  trackByProduct(_: number, product: WCProduct): number {
    return product.id;
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await t.present();
  }
}