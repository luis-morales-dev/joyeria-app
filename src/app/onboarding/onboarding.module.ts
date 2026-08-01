/*import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OnboardingPageRoutingModule } from './onboarding-routing.module';

import { OnboardingPage } from './onboarding.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OnboardingPageRoutingModule
  ],
  declarations: [OnboardingPage]
})
export class OnboardingPageModule {}*/

// ============================================================
// src/app/pages/onboarding/onboarding.module.ts
// ============================================================
// CUSTOM_ELEMENTS_SCHEMA es obligatorio para que Angular
// reconozca <swiper-container> y <swiper-slide> como elementos
// válidos sin lanzar error de compilación.
// ============================================================

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { OnboardingPage } from './onboarding.page';

@NgModule({
  declarations: [OnboardingPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', component: OnboardingPage }
    ]),
  ],
  // Necesario para que Angular no marque error con <swiper-container>
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OnboardingPageModule {}