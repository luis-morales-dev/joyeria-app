// ============================================================
// src/app/services/auth.service.ts
// ============================================================
// Requiere:
//   - Plugin: JWT Authentication for WP REST API
//   - @ionic/storage-angular
//
// Variables en environment.ts:
//   jwtApiUrl:          'https://tu-tienda.com/wp-json/jwt-auth/v1'
//   wooApiUrl:          'https://tu-tienda.com/wp-json/wc/v3'
//   wooConsumerKey:     'ck_XXXX'
//   wooConsumerSecret:  'cs_XXXX'
// ============================================================

// ============================================================
// src/app/services/auth.service.ts
// ============================================================

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../environments/environment';
import { WCAuthToken, WCCustomer } from '../models/woocommerce.models';

const TOKEN_KEY   = 'wc_auth_token';
const USER_KEY    = 'wc_auth_user';
const USER_ID_KEY = 'wc_auth_user_id';

// ─── Helper: decodificar el payload del JWT sin librerías ────
// El token JWT tiene formato: header.payload.signature
// El payload es base64url — solo necesitamos decodificarlo
function decodeJwtPayload(token: string): any {
  try {
    const base64 = token.split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http    = inject(HttpClient);
  private readonly storage = inject(Storage);
  private readonly router  = inject(Router);

  // ─── Estado reactivo ─────────────────────────────────────
  private readonly _token    = signal<string | null>(null);
  private readonly _customer = signal<WCCustomer | null>(null);
  private readonly _userId   = signal<number | null>(null);

  readonly token    = this._token.asReadonly();
  readonly customer = this._customer.asReadonly();

  readonly isAuthenticated = computed(() => !!this._token());

  constructor() {
    this.restoreSession();
  }

  // ─── Restaurar sesión al arrancar ────────────────────────
  private async restoreSession(): Promise<void> {
    await this.storage.create();
    const token    = await this.storage.get(TOKEN_KEY);
    const customer = await this.storage.get(USER_KEY);
    const userId   = await this.storage.get(USER_ID_KEY);
    if (token)    this._token.set(token);
    if (customer) this._customer.set(customer);
    if (userId)   this._userId.set(userId);
  }

  // ─── Manejo de errores ───────────────────────────────────
  private readonly handleError = (error: any): Observable<never> => {
    console.error('[AuthService] Error:', error);
    const message =
      error?.error?.message ||
      error?.error?.data?.params?.email ||
      error?.message ||
      'Error de autenticación';
    return throwError(() => new Error(message));
  };

  // ================================================================
  // LOGIN
  // ================================================================
  login(username: string, password: string): Observable<WCCustomer> {
    return this.http
      .post<WCAuthToken>(
        `${environment.jwtApiUrl}/token`,
        { username, password }
      )
      .pipe(
        tap(async (auth) => {
          this._token.set(auth.token);
          await this.storage.set(TOKEN_KEY, auth.token);

          // Extraer el user_id del payload del JWT
          const payload = decodeJwtPayload(auth.token);
          const userId  = payload?.data?.user?.id ?? null;
          if (userId) {
            this._userId.set(Number(userId));
            await this.storage.set(USER_ID_KEY, Number(userId));
          }
        }),
        switchMap((auth) => this.fetchCustomerProfile(auth)),
        catchError(this.handleError)
      );
  }

  // ================================================================
  // LOGOUT
  // ================================================================
  async logout(): Promise<void> {
    this._token.set(null);
    this._customer.set(null);
    this._userId.set(null);
    await this.storage.remove(TOKEN_KEY);
    await this.storage.remove(USER_KEY);
    await this.storage.remove(USER_ID_KEY);
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  // ================================================================
  // REGISTRO
  // ================================================================
  register(
    email: string,
    password: string,
    firstName = '',
    lastName  = ''
  ): Observable<WCCustomer> {
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    const newCustomer: Partial<WCCustomer> = {
      email,
      password,
      username,
      first_name: firstName,
      last_name:  lastName,
      billing: {
        first_name: firstName,
        last_name:  lastName,
        email,
        address_1: '', city: '', state: '', postcode: '', country: 'MX',
      },
      shipping: {
        first_name: firstName,
        last_name:  lastName,
        address_1: '', city: '', state: '', postcode: '', country: 'MX',
      },
    };

    return this.http
      .post<WCCustomer>(
        `${environment.wooApiUrl}/customers`,
        newCustomer,
        {
          params: {
            consumer_key:    environment.wooConsumerKey,
            consumer_secret: environment.wooConsumerSecret,
          },
        }
      )
      .pipe(
        switchMap(() => this.login(email, password)),
        catchError(this.handleError)
      );
  }

  // ================================================================
  // VALIDAR TOKEN
  // ================================================================
  validateToken(): Observable<{ code: string; data: { status: number } }> {
    const token = this._token();
    if (!token) return throwError(() => new Error('No hay token activo'));

    return this.http
      .post<{ code: string; data: { status: number } }>(
        `${environment.jwtApiUrl}/token/validate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .pipe(catchError(this.handleError));
  }

  // ================================================================
  // PERFIL
  // ================================================================

  /**
   * Obtiene el perfil del cliente usando el user_id extraído del JWT.
   * Usa consumer_key/secret porque el endpoint /customers/:id
   * requiere autenticación de administrador, no solo JWT de cliente.
   *
   * ALTERNATIVA: si tienes el plugin "WooCommerce JWT Auth" que sí
   * soporta /customers/me, puedes revertir a ese endpoint.
   */
  private fetchCustomerProfile(auth: WCAuthToken): Observable<WCCustomer> {
    const payload = decodeJwtPayload(auth.token);
    const userId  = payload?.data?.user?.id;

    if (!userId) {
      // Fallback: si no hay user_id en el token, devolver datos básicos del token
      const fallbackCustomer: WCCustomer = {
        email:      auth.user_email,
        first_name: auth.user_display_name,
        last_name:  '',
        username:   auth.user_nicename,
        billing:  { first_name:'',last_name:'',address_1:'',city:'',state:'',postcode:'',country:'MX' },
        shipping: { first_name:'',last_name:'',address_1:'',city:'',state:'',postcode:'',country:'MX' },
      };
      this._customer.set(fallbackCustomer);
      return new Observable((obs) => {
        obs.next(fallbackCustomer);
        obs.complete();
      });
    }

    return this.http
      .get<WCCustomer>(
        `${environment.wooApiUrl}/customers/${userId}`,
        {
          params: {
            consumer_key:    environment.wooConsumerKey,
            consumer_secret: environment.wooConsumerSecret,
          },
        }
      )
      .pipe(
        tap(async (customer) => {
          this._customer.set(customer);
          await this.storage.set(USER_KEY, customer);
        }),
        catchError((err) => {
          // Si falla la carga del perfil completo, usar datos del token JWT
          // para no bloquear el login
          const fallbackCustomer: WCCustomer = {
            email:      auth.user_email,
            first_name: auth.user_display_name,
            last_name:  '',
            username:   auth.user_nicename,
            billing:  { first_name:'',last_name:'',address_1:'',city:'',state:'',postcode:'',country:'MX' },
            shipping: { first_name:'',last_name:'',address_1:'',city:'',state:'',postcode:'',country:'MX' },
          };
          console.warn('[AuthService] No se pudo cargar perfil completo, usando datos del token:', err);
          this._customer.set(fallbackCustomer);
          return new Observable<WCCustomer>((obs) => {
            obs.next(fallbackCustomer);
            obs.complete();
          });
        })
      );
  }

  /** Refresca el perfil usando el user_id guardado */
  refreshProfile(): Observable<WCCustomer> {
    const token  = this._token();
    const userId = this._userId();
    if (!token || !userId) return throwError(() => new Error('No autenticado'));

    return this.http
      .get<WCCustomer>(
        `${environment.wooApiUrl}/customers/${userId}`,
        {
          params: {
            consumer_key:    environment.wooConsumerKey,
            consumer_secret: environment.wooConsumerSecret,
          },
        }
      )
      .pipe(
        tap(async (customer) => {
          this._customer.set(customer);
          await this.storage.set(USER_KEY, customer);
        }),
        catchError(this.handleError)
      );
  }

  // ─── Helpers públicos ────────────────────────────────────
  getToken(): string | null           { return this._token(); }
  getCustomerId(): number | undefined { return this._customer()?.id ?? this._userId() ?? undefined; }
}