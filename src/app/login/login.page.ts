// ============================================================
// src/app/pages/login/login.page.ts
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  mailOutline,
  lockClosedOutline,
  arrowForwardOutline,
} from 'ionicons/icons';

import { AuthService } from '../services/auth.service';

@Component({
  selector:    'app-login',
  templateUrl: './login.page.html',
  styleUrls:   ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastController);

  form!: FormGroup;

  loading      = signal(false);
  showPassword = signal(false);

  // URL a la que regresar tras el login (ej: /checkout)
  private returnUrl = '/home';

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline, arrowForwardOutline });
  }

  ngOnInit(): void {
    // Leer el returnUrl del queryParam si existe
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';

    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.errors['required'])  return 'Este campo es obligatorio';
    if (ctrl.errors['email'])     return 'Ingresa un email válido';
    if (ctrl.errors['minlength']) return 'Mínimo 6 caracteres';
    return '';
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  async login(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.loading()) return;

    this.loading.set(true);
    const { email, password } = this.form.value;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        // Regresar a la URL que intentó visitar (ej: /checkout)
        // o al home si no había returnUrl
        this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.message?.includes('invalid')
          ? 'Email o contraseña incorrectos'
          : err?.message ?? 'No se pudo iniciar sesión';
        this.showToast(msg);
      },
    });
  }

  goToRegister(): void {
    // Pasar el returnUrl al registro también para mantener el flujo
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: this.returnUrl },
    });
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 2500,
      position: 'bottom',
      color: 'danger',
      cssClass: 'infinity-toast',
    });
    await t.present();
  }
}
