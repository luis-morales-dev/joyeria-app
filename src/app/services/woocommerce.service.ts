// ============================================================
// src/app/services/woocommerce.service.ts
// ============================================================
// Requiere en environment.ts:
//   wooApiUrl: 'https://tu-tienda.com/wp-json/wc/v3',
//   wooConsumerKey: 'ck_xxxx',
//   wooConsumerSecret: 'cs_xxxx'
// ============================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  WCProduct,
  WCCategory,
  WCOrder,
  WCCustomer,
  WCVariation,
  WCProductParams,
  WCPaginatedResponse,
} from '../models/woocommerce.models';

@Injectable({ providedIn: 'root' })
export class WoocommerceService {
  private readonly http = inject(HttpClient);

  // Base URL de la API REST de WooCommerce
  private readonly apiUrl = environment.wooApiUrl;

  // Credenciales de la API (solo para endpoints públicos/admin)
  private get authParams(): HttpParams {
    return new HttpParams()
      .set('consumer_key', environment.wooConsumerKey)
      .set('consumer_secret', environment.wooConsumerSecret);
  }

  // ─── Headers con JWT (para endpoints que requieren cliente autenticado) ──
  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ─── Manejo de errores ──────────────────────────────────
  private handleError(error: any): Observable<never> {
    console.error('[WoocommerceService] Error:', error);
    const message =
      error?.error?.message || error?.message || 'Error desconocido en la API';
    return throwError(() => new Error(message));
  }

  // ================================================================
  // PRODUCTOS
  // ================================================================

  /** Obtiene lista paginada de productos con filtros opcionales */
  getProducts(params: WCProductParams = {}): Observable<WCPaginatedResponse<WCProduct>> {
    let httpParams = this.authParams;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http
      .get<WCProduct[]>(`${this.apiUrl}/products`, {
        params: httpParams,
        observe: 'response',
      })
      .pipe(
        map((response) => ({
          data: response.body ?? [],
          totalItems: parseInt(response.headers.get('X-WP-Total') ?? '0', 10),
          totalPages: parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10),
        })),
        catchError(this.handleError)
      );
  }

  /** Obtiene productos para la página de inicio (ej. últimos 6 productos) */
  getProductsHome(): Observable<WCProduct[]> {
    const params = this.authParams.set('per_page', 6).set('orderby', 'date').set('order', 'desc');
    return this.http
      .get<WCProduct[]>(`${this.apiUrl}/products`, { params })
      .pipe(catchError(this.handleError));
  }

  /** Obtiene un producto por ID */
  getProduct(id: number): Observable<WCProduct> {
    return this.http
      .get<WCProduct>(`${this.apiUrl}/products/${id}`, { params: this.authParams })
      .pipe(catchError(this.handleError));
  }

  /** Busca productos por texto */
  searchProducts(query: string, perPage = 20): Observable<WCProduct[]> {
    const params = this.authParams.set('search', query).set('per_page', perPage);
    return this.http
      .get<WCProduct[]>(`${this.apiUrl}/products`, { params })
      .pipe(catchError(this.handleError));
  }

  /** Obtiene productos destacados */
  getFeaturedProducts(perPage = 10): Observable<WCProduct[]> {
    const params = this.authParams.set('featured', 'true').set('per_page', perPage);
    return this.http
      .get<WCProduct[]>(`${this.apiUrl}/products`, { params })
      .pipe(catchError(this.handleError));
  }

  /** Obtiene productos en oferta */
  getSaleProducts(perPage = 10): Observable<WCProduct[]> {
    const params = this.authParams.set('on_sale', 'true').set('per_page', perPage);
    return this.http
      .get<WCProduct[]>(`${this.apiUrl}/products`, { params })
      .pipe(catchError(this.handleError));
  }

  /** Obtiene variaciones de un producto variable */
  getVariations(productId: number): Observable<WCVariation[]> {
    return this.http
      .get<WCVariation[]>(`${this.apiUrl}/products/${productId}/variations`, {
        params: this.authParams,
      })
      .pipe(catchError(this.handleError));
  }

  // ================================================================
  // CATEGORÍAS
  // ================================================================

  /** Obtiene todas las categorías */
  getCategories(perPage = 100, parent?: number): Observable<WCCategory[]> {
    let params = this.authParams.set('per_page', perPage).set('hide_empty', 'true');
    if (parent !== undefined) params = params.set('parent', parent);
    return this.http
      .get<WCCategory[]>(`${this.apiUrl}/products/categories`, { params })
      .pipe(catchError(this.handleError));
  }

  /** Obtiene categorías para la página de inicio */
  getCategoriasHome() {
    let params = this.authParams;
    return this.http.get(`${this.apiUrl}/products/categories`, { params });
  }

  /** Obtiene una categoría por ID */
  getCategory(id: number): Observable<WCCategory> {
    return this.http
      .get<WCCategory>(`${this.apiUrl}/products/categories/${id}`, {
        params: this.authParams,
      })
      .pipe(catchError(this.handleError));
  }

  // ================================================================
  // ÓRDENES
  // ================================================================

  /** Crea una nueva orden */
  createOrder(order: Partial<WCOrder>, token: string): Observable<WCOrder> {
    return this.http
      .post<WCOrder>(`${this.apiUrl}/orders`, order, {
        headers: this.getAuthHeaders(token),
      })
      .pipe(catchError(this.handleError));
  }

  /** Obtiene las órdenes del cliente autenticado */
  getCustomerOrders(customerId: number, token: string): Observable<WCOrder[]> {
    const params = new HttpParams().set('customer', customerId).set('per_page', 20);
    return this.http
      .get<WCOrder[]>(`${this.apiUrl}/orders`, {
        params,
        headers: this.getAuthHeaders(token),
      })
      .pipe(catchError(this.handleError));
  }

  /** Obtiene una orden por ID */
  getOrder(orderId: number, token: string): Observable<WCOrder> {
    return this.http
      .get<WCOrder>(`${this.apiUrl}/orders/${orderId}`, {
        headers: this.getAuthHeaders(token),
      })
      .pipe(catchError(this.handleError));
  }

  // ================================================================
  // CLIENTES
  // ================================================================

  /** Obtiene el perfil del cliente autenticado */
  getCustomer(customerId: number, token: string): Observable<WCCustomer> {
    return this.http
      .get<WCCustomer>(`${this.apiUrl}/customers/${customerId}`, {
        headers: this.getAuthHeaders(token),
      })
      .pipe(catchError(this.handleError));
  }

  /** Actualiza el perfil del cliente */
  updateCustomer(
    customerId: number,
    data: Partial<WCCustomer>,
    token: string
  ): Observable<WCCustomer> {
    return this.http
      .put<WCCustomer>(`${this.apiUrl}/customers/${customerId}`, data, {
        headers: this.getAuthHeaders(token),
      })
      .pipe(catchError(this.handleError));
  }

  /** Registra un nuevo cliente */
  registerCustomer(customer: Partial<WCCustomer>): Observable<WCCustomer> {
    return this.http
      .post<WCCustomer>(`${this.apiUrl}/customers`, customer, {
        params: this.authParams,
      })
      .pipe(catchError(this.handleError));
  }
}
