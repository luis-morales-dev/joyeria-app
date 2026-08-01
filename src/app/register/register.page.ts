/*import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}*/

// ============================================================
// src/app/pages/register/register.page.ts
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  mailOutline,
  lockClosedOutline,
  arrowBackOutline,
  checkmarkOutline,
} from 'ionicons/icons';

import { AuthService } from '../services/auth.service';

// Validador personalizado: las contraseñas coinciden
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password        = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password || !confirmPassword) return null;
  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ mismatch: true });
    return { mismatch: true };
  } else {
    // Limpiar solo el error de mismatch si existe
    const errors = { ...confirmPassword.errors };
    delete errors['mismatch'];
    confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    return null;
  }
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastController);

  form!: FormGroup;

  loading          = signal(false);
  showPassword     = signal(false);
  showConfirm      = signal(false);
  registered       = signal(false);

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline, arrowBackOutline, checkmarkOutline });
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }

    this.form = this.fb.group(
      {
        email:           ['', [Validators.required, Validators.email]],
        password:        ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  // ─── Helpers de formulario ───────────────────────────────
  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.errors['required'])  return 'Este campo es obligatorio';
    if (ctrl.errors['email'])     return 'Ingresa un email válido';
    if (ctrl.errors['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.errors['mismatch'])  return 'Las contraseñas no coinciden';
    return '';
  }

  // Indicadores de seguridad de contraseña
  getPasswordStrength(): { level: number; label: string; color: string } {
    const val = this.form.get('password')?.value ?? '';
    if (!val) return { level: 0, label: '', color: '' };

    let score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Z]/.test(val))        score++;
    if (/[0-9]/.test(val))        score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) return { level: 1, label: 'Débil',    color: '#e05555' };
    if (score === 2) return { level: 2, label: 'Regular',  color: '#f5a623' };
    if (score === 3) return { level: 3, label: 'Buena',    color: '#2e9e6b' };
    return              { level: 4, label: 'Excelente', color: '#1A7A55' };
  }

  togglePassword(): void  { this.showPassword.update((v) => !v); }
  toggleConfirm(): void   { this.showConfirm.update((v) => !v); }

  // ─── Registro ────────────────────────────────────────────
  async register(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.loading()) return;

    this.loading.set(true);
    const { email, password } = this.form.value;

    this.auth.register(email, password, '', '').subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/home'], { replaceUrl: true });
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.message?.includes('email')
          ? 'Este email ya está registrado'
          : err?.message ?? 'No se pudo crear la cuenta';
        this.showToast(msg);
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
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
