// ============================================================
// src/app/pages/onboarding/onboarding.page.ts
// ============================================================

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
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

const ONBOARDING_KEY = 'infinity_onboarding_done';

export interface OnboardingSlide {
  icon:        string;
  eyebrow:     string;
  title:       string;
  titleItalic: string;
  description: string;
  accent:      string;
}

@Component({
  selector:    'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls:   ['./onboarding.page.scss'],
  standalone: false,
})
export class OnboardingPage implements OnInit {
  @ViewChild('swiperRef') swiperRef!: ElementRef;

  private readonly router  = inject(Router);
  private readonly storage = inject(Storage);

  swiperModules = [IonicSlides];

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

  activeIndex = signal(0);
  isLastSlide = signal(false);

  constructor() {
    addIcons({
      diamondOutline, bagHandleOutline, shieldCheckmarkOutline,
      arrowForwardOutline, checkmarkOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.storage.create();
    const done = await this.storage.get(ONBOARDING_KEY);
    if (done) this.redirectAfterOnboarding();
  }

  onSlideChange(event: any): void {
    const index = event.target.swiper.activeIndex ?? 0;
    this.activeIndex.set(index);
    this.isLastSlide.set(index === this.slides.length - 1);
  }

  async nextSlide(): Promise<void> {
    if (this.isLastSlide()) {
      await this.completeOnboarding();
      return;
    }
    this.swiperRef.nativeElement.swiper.slideNext();
  }

  goToSlide(index: number): void {
    this.swiperRef.nativeElement.swiper.slideTo(index);
  }

  async skipOnboarding(): Promise<void> {
    await this.completeOnboarding();
  }

  private async completeOnboarding(): Promise<void> {
    await this.storage.set(ONBOARDING_KEY, true);
    this.redirectAfterOnboarding();
  }

  private redirectAfterOnboarding(): void {
    // Siempre va al home — el login se pedirá solo cuando
    // el usuario intente ir al checkout o a sus pedidos
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
