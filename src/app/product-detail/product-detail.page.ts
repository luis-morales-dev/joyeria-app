/*import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
})
export class ProductDetailPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}*/

// ============================================================
// src/app/pages/product-detail/product-detail.page.ts
// ============================================================

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cartOutline,
  heartOutline,
  heart,
  shareOutline,
  starSharp,
  starOutline,
  chevronForwardOutline,
  checkmarkOutline,
} from 'ionicons/icons';

import { WoocommerceService } from '../services/woocommerce.service';
import { CartService } from '../services/cart.service';
import {
  WCProduct,
  WCVariation,
} from '../models/woocommerce.models';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  standalone: false,
})
export class ProductDetailPage implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly woo    = inject(WoocommerceService);
  private readonly cart   = inject(CartService);
  private readonly toast  = inject(ToastController);

  // ─── Estado del producto ─────────────────────────────────
  product      = signal<WCProduct | null>(null);
  variations   = signal<WCVariation[]>([]);
  loading      = signal(true);
  error        = signal<string | null>(null);

  // ─── Galería ─────────────────────────────────────────────
  activeImageIndex = signal(0);

  // ─── Variaciones seleccionadas ───────────────────────────
  // { 'Color': 'Oro Rosa', 'Talla': '7' }
  selectedAttributes = signal<Record<string, string>>({});

  // Variación activa que coincide con los atributos seleccionados
  activeVariation = computed<WCVariation | undefined>(() => {
    if (!this.variations().length) return undefined;
    const selected = this.selectedAttributes();
    return this.variations().find((v) =>
      v.attributes.every(
        (attr) => selected[attr.name] === attr.option
      )
    );
  });

  // Precio a mostrar (variación activa o precio base)
  displayPrice = computed(() => {
    const v = this.activeVariation();
    if (v) return v.price;
    return this.product()?.price ?? '0';
  });

  displayRegularPrice = computed(() => {
    const v = this.activeVariation();
    if (v) return v.regular_price;
    return this.product()?.regular_price ?? '';
  });

  isOnSale = computed(() => {
    const v = this.activeVariation();
    if (v) return v.on_sale;
    return this.product()?.on_sale ?? false;
  });

  inStock = computed(() => {
    const v = this.activeVariation();
    if (v) return v.stock_status === 'instock';
    return this.product()?.stock_status === 'instock';
  });

  // ─── Descripción expandida ───────────────────────────────
  descExpanded = signal(false);

  // ─── Wishlist (local, sin persistencia por ahora) ────────
  inWishlist = signal(false);

  // ─── Carrito ─────────────────────────────────────────────
  cartCount  = computed(() => this.cart.totalQuantity());
  addingCart = signal(false);

  isInCart = computed(() => {
    const p = this.product();
    if (!p) return false;
    const v = this.activeVariation();
    return this.cart.isInCart(p.id, v?.id);
  });

  constructor() {
    addIcons({
      arrowBackOutline, cartOutline, heartOutline, heart,
      shareOutline, starSharp, starOutline,
      chevronForwardOutline, checkmarkOutline,
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Producto no encontrado');
      this.loading.set(false);
      return;
    }
    this.loadProduct(id);
  }

  // ─── Carga ───────────────────────────────────────────────
  private loadProduct(id: number): void {
    this.loading.set(true);
    this.woo.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        if (product.type === 'variable') {
          this.loadVariations(id);
        }
      },
      error: () => {
        this.error.set('No se pudo cargar el producto');
        this.loading.set(false);
      },
    });
  }

  private loadVariations(productId: number): void {
    this.woo.getVariations(productId).subscribe({
      next: (vars) => this.variations.set(vars),
      error: (err) => console.error('Error cargando variaciones:', err),
    });
  }

  // ─── Galería ─────────────────────────────────────────────
  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  getActiveImage(): string {
    const imgs = this.product()?.images;
    if (!imgs?.length) return 'assets/placeholder-product.png';
    return imgs[this.activeImageIndex()]?.src ?? imgs[0].src;
  }

  // ─── Atributos / Variaciones ─────────────────────────────
  selectAttribute(attrName: string, option: string): void {
    this.selectedAttributes.update((prev) => ({
      ...prev,
      [attrName]: option,
    }));
  }

  isAttributeSelected(attrName: string, option: string): boolean {
    return this.selectedAttributes()[attrName] === option;
  }

  isOptionAvailable(attrName: string, option: string): boolean {
    if (!this.variations().length) return true;
    const current = { ...this.selectedAttributes(), [attrName]: option };
    return this.variations().some((v) =>
      v.attributes.every(
        (a) => !current[a.name] || current[a.name] === a.option
      ) && v.stock_status === 'instock'
    );
  }

  allAttributesSelected(): boolean {
    const product = this.product();
    if (!product || product.type !== 'variable') return true;
    const variableAttrs = product.attributes.filter((a) => a.variation);
    return variableAttrs.every((a) => !!this.selectedAttributes()[a.name]);
  }

  // ─── Descripción ─────────────────────────────────────────
  toggleDesc(): void {
    this.descExpanded.update((v) => !v);
  }

  stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // ─── Wishlist ────────────────────────────────────────────
  toggleWishlist(): void {
    this.inWishlist.update((v) => !v);
  }

  // ─── Carrito ─────────────────────────────────────────────
  async addToCart(): Promise<void> {
    const product = this.product();
    if (!product || this.addingCart()) return;

    if (product.type === 'variable' && !this.allAttributesSelected()) {
      this.showToast('Selecciona todas las opciones del producto', 'warning');
      return;
    }

    this.addingCart.set(true);
    await this.cart.addItem(
      product,
      1,
      this.activeVariation(),
      this.selectedAttributes()
    );

    await this.showToast(`"${product.name}" agregado al carrito`);
    this.addingCart.set(false);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  // ─── Helpers ─────────────────────────────────────────────
  formatPrice(price: string): string {
    const num = parseFloat(price);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(num);
  }

  discountPercent(): number {
    const regular = parseFloat(this.displayRegularPrice());
    const current = parseFloat(this.displayPrice());
    if (!regular || !current || regular <= current) return 0;
    return Math.round(((regular - current) / regular) * 100);
  }

  ratingStars(): number[] {
    const r = Math.round(parseFloat(this.product()?.average_rating ?? '0'));
    return Array(5).fill(0).map((_, i) => i < r ? 1 : 0);
  }

  private async showToast(message: string, color = 'dark'): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 1800,
      position: 'bottom',
      color,
      cssClass: 'infinity-toast',
    });
    await t.present();
  }
}
