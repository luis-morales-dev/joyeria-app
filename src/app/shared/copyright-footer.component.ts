// ============================================================
// src/app/shared/copyright-footer.component.ts
// ============================================================
// Footer reutilizable con el copyright. Se coloca al final del
// <ion-content> de cada página con:
//   <app-copyright-footer></app-copyright-footer>
// ============================================================

import { Component } from '@angular/core';

@Component({
  selector: 'app-copyright-footer',
  standalone: false,
  template: `
    <footer class="copyright">
      <span class="copyright-sym">✦</span>
      <p class="copyright-text">
        © {{ year }} Joyería Infinity. Todos los derechos reservados.
      </p>
      <p class="copyright-text">
        Desarrollado con ❤️ por <a   href="https://roselcom.com.mx/" target="_blank" rel="noopener noreferrer">Roselcom</a>
      </p>
    </footer>
  `,
  styles: [`
    :host { display: block; }

    .copyright {
      margin-top: 24px;
      padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
      text-align: center;
      border-top: 1px solid rgba(26, 43, 60, 0.08);
      font-family: 'Nunito', 'Helvetica Neue', sans-serif;
    }

    .copyright-sym {
      display: block;
      color: #ecb7c7;
      font-size: 12px;
      margin-bottom: 6px;
    }

    .copyright-text {
      margin: 0;
      font-size: 11px;
      line-height: 1.5;
      letter-spacing: 0.3px;
      color: #7a8b9a;
    }
  `],
})
export class CopyrightFooterComponent {
  // Se actualiza solo cada año
  readonly year = new Date().getFullYear();
}
