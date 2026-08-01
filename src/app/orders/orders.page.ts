/*import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}*/

// ============================================================
// src/app/pages/orders/orders.page.ts
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  receiptOutline,
  chevronForwardOutline,
  cartOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshCircleOutline,
  hourglassOutline,
} from 'ionicons/icons';

import { WoocommerceService } from '../services/woocommerce.service';
import { AuthService } from '../services/auth.service';
import { WCOrder } from '../models/woocommerce.models';

interface OrderStatusConfig {
  label: string;
  color: string;
  icon:  string;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls:  ['./orders.page.scss'],
  standalone: false,
})
export class OrdersPage implements OnInit {
  private readonly woo    = inject(WoocommerceService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastController);

  orders  = signal<WCOrder[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);

  readonly skeletonItems = Array(4).fill(0);

  readonly statusConfig: Record<string, OrderStatusConfig> = {
    pending:    { label: 'Pendiente',    color: '#f5a623', icon: 'hourglass-outline'          },
    processing: { label: 'En proceso',   color: '#2e9e6b', icon: 'refresh-circle-outline'      },
    'on-hold':  { label: 'En espera',    color: '#7a8b9a', icon: 'time-outline'                },
    completed:  { label: 'Completado',   color: '#1A7A55', icon: 'checkmark-circle-outline'    },
    cancelled:  { label: 'Cancelado',    color: '#e05555', icon: 'close-circle-outline'        },
    refunded:   { label: 'Reembolsado',  color: '#7a8b9a', icon: 'receiptOutline'              },
    failed:     { label: 'Fallido',      color: '#e05555', icon: 'close-circle-outline'        },
  };

  constructor() {
    addIcons({
      receiptOutline, chevronForwardOutline, cartOutline,
      timeOutline, checkmarkCircleOutline, closeCircleOutline,
      refreshCircleOutline, hourglassOutline,
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const customerId = this.auth.getCustomerId();
    const token      = this.auth.getToken();

    if (!customerId || !token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.woo.getCustomerOrders(customerId, token).subscribe({
      next: (orders) => {
        // Ordenar por fecha descendente (más reciente primero)
        const sorted = [...orders].sort((a, b) =>
          new Date(b.date_created ?? 0).getTime() -
          new Date(a.date_created ?? 0).getTime()
        );
        this.orders.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[OrdersPage] Error:', err);
        this.error.set('No se pudieron cargar tus pedidos');
        this.loading.set(false);
      },
    });
  }

  // ─── Navegación ──────────────────────────────────────────
  goToDetail(orderId: number): void {
    this.router.navigate(['/order-detail', orderId]);
  }

  goToShop(): void {
    this.router.navigate(['/home']);
  }

  // ─── Helpers de UI ───────────────────────────────────────
  getStatus(status: string): OrderStatusConfig {
    return this.statusConfig[status] ?? {
      label: status,
      color: '#7a8b9a',
      icon:  'receipt-outline',
    };
  }

  formatPrice(total: string | undefined): string {
    const num = parseFloat(total ?? '0');
    return new Intl.NumberFormat('es-MX', {
      style:    'currency',
      currency: 'MXN',
    }).format(num);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('es-MX', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    }).format(new Date(dateStr));
  }

  getItemCount(order: WCOrder): number {
    return order.line_items.reduce((acc, item) => acc + (item.quantity ?? 0), 0);
  }

  getFirstImage(order: WCOrder): string {
    return order.line_items?.[0]?.image?.src ?? '';
  }

  trackByOrder(_: number, order: WCOrder): number {
    return order.id ?? 0;
  }
}