/*import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SearchPageRoutingModule } from './search-routing.module';

import { SearchPage } from './search.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SearchPageRoutingModule
  ],
  declarations: [SearchPage]
})
export class SearchPageModule {}*/


// ============================================================
// src/app/pages/search/search.module.ts
// ============================================================

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { SearchPage } from './search.page';

@NgModule({
  declarations: [SearchPage],
  imports: [
    CommonModule,
    FormsModule,       // necesario para [(ngModel)] en el input
    IonicModule,
    RouterModule.forChild([
      { path: '', component: SearchPage }
    ]),
  ],
})
export class SearchPageModule {}