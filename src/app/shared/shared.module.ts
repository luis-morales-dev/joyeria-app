// ============================================================
// src/app/shared/shared.module.ts
// ============================================================
// Módulo compartido. Impórtalo en el módulo de cada página donde
// quieras mostrar el footer de copyright.
// ============================================================

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CopyrightFooterComponent } from './copyright-footer.component';

@NgModule({
  declarations: [CopyrightFooterComponent],
  imports: [CommonModule],
  exports: [CopyrightFooterComponent],
})
export class SharedModule {}
