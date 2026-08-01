/*import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}*/


// ============================================================
// src/app/pages/onboarding/onboarding.page.ts
// ============================================================
// Se muestra solo la primera vez que el usuario instala la app.
// Usa @ionic/storage-angular para persistir que ya se vio.
// Después redirige a Login o Home según la sesión activa.
// ============================================================

import { Component, OnInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicSlides } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { addIcons } from 'ionicons';
import {
  diamondOutline,
  bagHandleOutline,
  shieldCheckmarkOutline,
  arrowForwardOutline,
  checkmarkOutline,
} from 'ionicons/icons';

import { AuthService } from '../services/auth.service';

const ONBOARDING_KEY = 'infinity_onboarding_done';

export interface OnboardingSlide {
  icon:        string;
  eyebrow:     string;
  title:       string;
  titleItalic: string;
  description: string;
  accent:      string; // color de acento por slide
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls:  ['./onboarding.page.scss'],
  standalone: false,
})
export class OnboardingPage implements OnInit {
  // ─── Referencia al elemento swiper-container ─────────────
  @ViewChild('swiperRef') swiperRef!: ElementRef;

  private readonly router  = inject(Router);
  private readonly storage = inject(Storage);
  private readonly auth    = inject(AuthService);

  // ─── Módulos de Swiper con estilos de Ionic ──────────────
  swiperModules = [IonicSlides];

  // ─── Slides ──────────────────────────────────────────────
  readonly slides: OnboardingSlide[] = [
    {
      icon:        'diamond-outline',
      eyebrow:     'Bienvenida a',
      title:       'Joyería',
      titleItalic: 'Infinity',
      description: 'Descubre nuestra colección de piezas artesanales diseñadas para momentos únicos e irrepetibles.',
      accent:      '#ecb7c7',
    },
    {
      icon:        'bag-handle-outline',
      eyebrow:     'Compra',
      title:       'Fácil y',
      titleItalic: 'segura',
      description: 'Explora por categorías, agrega al carrito y paga con tu tarjeta de forma rápida y protegida.',
      accent:      '#c794a4',
    },
    {
      icon:        'shield-checkmark-outline',
      eyebrow:     'Tu cuenta',
      title:       'Siempre',
      titleItalic: 'protegida',
      description: 'Tus pedidos, favoritos y datos personales seguros. Rastrea cada compra desde tu perfil.',
      accent:      '#ecb7c7',
    },
  ];

  // ─── Estado ──────────────────────────────────────────────
  activeIndex  = signal(0);
  isLastSlide  = signal(false);

  readonly slideOpts = {
    initialSlide: 0,
    speed: 400,
    resistanceRatio: 0.5,
  };

  constructor() {
    addIcons({
      diamondOutline, bagHandleOutline, shieldCheckmarkOutline,
      arrowForwardOutline, checkmarkOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.storage.create();

    // Si ya vio el onboarding, redirigir directamente
    const done = await this.storage.get(ONBOARDING_KEY);
    if (done) {
      this.redirectAfterOnboarding();
    }
  }

  // ─── Evento de cambio de slide ───────────────────────────
  // En Swiper Element el evento es (swiperslidechange) en minúsculas
  onSlideChange(event: any): void {
    // El índice activo se obtiene desde event.target.swiper
    const index = event.target.swiper.activeIndex ?? 0;
    this.activeIndex.set(index);
    this.isLastSlide.set(index === this.slides.length - 1);
  }
 
  // ─── Navegación entre slides ─────────────────────────────
  async nextSlide(): Promise<void> {
    if (this.isLastSlide()) {
      await this.completeOnboarding();
      return;
    }
    // Acceder al swiper nativo desde el ElementRef
    this.swiperRef.nativeElement.swiper.slideNext();
  }
 
  goToSlide(index: number): void {
    this.swiperRef.nativeElement.swiper.slideTo(index);
  }
 
  async skipOnboarding(): Promise<void> {
    await this.completeOnboarding();
  }

  // ─── Completar onboarding ────────────────────────────────
  private async completeOnboarding(): Promise<void> {
    await this.storage.set(ONBOARDING_KEY, true);
    this.redirectAfterOnboarding();
  }

  private redirectAfterOnboarding(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/home'], { replaceUrl: true });
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}