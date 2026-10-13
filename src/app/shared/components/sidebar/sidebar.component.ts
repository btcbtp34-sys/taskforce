import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { QuickToolsService } from '../../../core/services/quick-tools.service';
import { NotesService } from '../../../core/services/notes.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <aside class="sidebar-container" [class.collapsed]="collapsed">
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="logo-area" routerLink="/reports" title="Task Force – SAP RISE Transformation">
          <div class="logo-icon">
            <img src="/taskforce-logo.png" alt="Task Force Logo" class="brand-logo-img" />
          </div>
          <div class="logo-text" *ngIf="!collapsed">
            <span class="brand-name">TASK FORCE</span>
            <span class="brand-tag">SAP RISE TRANSFORMATION</span>
          </div>
        </div>
        <button class="toggle-btn" (click)="toggleSidebar.emit()" title="Sidebar Daralt/Genişlet">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [style.transform]="collapsed ? 'rotate(180deg)' : 'none'">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <div class="nav-section-title" *ngIf="!collapsed">MENÜ</div>

        <!-- 1. Yönetici Özeti -->
        <a 
          routerLink="/reports" 
          routerLinkActive="active" 
          class="nav-item" 
          [title]="collapsed ? 'Yönetici Özeti' : ''">
          <div class="nav-icon"><app-icon name="file-text" [size]="17" color="#059669"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Yönetici Özeti</span>
          <span class="nav-badge highlight" *ngIf="!collapsed">Özet</span>
        </a>

        <!-- 2. SAP Uygulamaları (Expandable Group) -->
        <div class="nav-group" [class.open]="modulesExpanded">
          <div 
            class="nav-item group-header" 
            [class.active]="isModulesActive()"
            (click)="toggleModules()"
            [title]="collapsed ? 'SAP Uygulamaları' : ''">
            <div class="nav-icon"><app-icon name="sliders" [size]="17"></app-icon></div>
            <span class="nav-label" *ngIf="!collapsed">SAP Uygulamaları</span>
            <div class="chevron-icon" *ngIf="!collapsed">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [style.transform]="modulesExpanded ? 'rotate(90deg)' : 'none'">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          <!-- Alt Kırılımlar: Bulgularımız, Detaylı Analiz, Geliştirmeler, Entegrasyon -->
          <div class="nav-sub-list" *ngIf="modulesExpanded && !collapsed">
            <a 
              (click)="navigateToModulesSummary($event)"
              [class.sub-active]="isModulesSummaryActive()"
              class="sub-item"
              style="cursor: pointer;">
              <span class="sub-dot">•</span>
              <span class="sub-text">Bulgularımız</span>
            </a>

            <a 
              (click)="navigateToModulesDetail($event)"
              [class.sub-active]="isModulesDetailActive()"
              class="sub-item"
              style="cursor: pointer;">
              <span class="sub-dot">•</span>
              <span class="sub-text">Detaylı Analiz</span>
            </a>

            <a 
              routerLink="/development" 
              routerLinkActive="sub-active" 
              [routerLinkActiveOptions]="{ exact: true }"
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">Geliştirmeler</span>
            </a>

            <a 
              routerLink="/architecture-map" 
              [queryParams]="{ mode: 'po' }" 
              [class.sub-active]="isIntegrationActive()" 
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">Entegrasyon</span>
            </a>
          </div>
        </div>

        <!-- 3. SAP Lisans ve Bulut (Yeni Ana Menü) -->
        <div class="nav-group" [class.open]="licenseExpanded">
          <div 
            class="nav-item group-header" 
            [class.active]="isLicenseActive()"
            (click)="toggleLicense()"
            [title]="collapsed ? 'SAP Lisans ve Bulut' : ''">
            <div class="nav-icon"><app-icon name="bolt" [size]="17" color="#059669"></app-icon></div>
            <span class="nav-label" *ngIf="!collapsed">SAP Lisans ve Bulut</span>
            <div class="chevron-icon" *ngIf="!collapsed">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [style.transform]="licenseExpanded ? 'rotate(90deg)' : 'none'">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          <div class="nav-sub-list" *ngIf="licenseExpanded && !collapsed">
            <a 
              routerLink="/analytics" 
              routerLinkActive="sub-active" 
              [routerLinkActiveOptions]="{ exact: true }"
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">FUE Lisans Analizi</span>
            </a>
          </div>
        </div>

        <!-- 4. Teknik Altyapı (Eski Alt Yapı) -->
        <div class="nav-group" [class.open]="basisExpanded">
          <div 
            class="nav-item group-header" 
            [class.active]="isTeknikAltyapiActive()"
            (click)="toggleBasis()"
            [title]="collapsed ? 'Teknik Altyapı' : ''">
            <div class="nav-icon"><app-icon name="database" [size]="17" color="#0284c7"></app-icon></div>
            <span class="nav-label" *ngIf="!collapsed">Teknik Altyapı</span>
            <div class="chevron-icon" *ngIf="!collapsed">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [style.transform]="basisExpanded ? 'rotate(90deg)' : 'none'">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          <!-- Alt Kırılımlar: Mevcut / Hedef Sistem, Sistem Ortamı / Sürüm / Destek Bitişi, En Büyük Tablolar (DVM) -->
          <div class="nav-sub-list" *ngIf="basisExpanded && !collapsed">
            <a 
              routerLink="/source-sizing" 
              routerLinkActive="sub-active" 
              class="sub-item"
              title="Mevcut / Hedef Sistem">
              <span class="sub-dot">•</span>
              <span class="sub-text">Mevcut / Hedef Sistem</span>
            </a>

            <a 
              routerLink="/architecture-map" 
              [queryParams]="{ mode: 'asis' }" 
              [class.sub-active]="isLandscapeActive()" 
              class="sub-item"
              title="Sistem Ortamı / Sürüm / Destek Bitişi">
              <span class="sub-dot">•</span>
              <span class="sub-text">Sistem Ortamı / Sürüm / Destek Bitişi</span>
            </a>

            <a 
              routerLink="/largest-tables" 
              routerLinkActive="sub-active" 
              class="sub-item"
              title="En Büyük Tablolar (DVM)">
              <span class="sub-dot">•</span>
              <span class="sub-text">En Büyük Tablolar (DVM)</span>
            </a>
          </div>
        </div>

        <!-- 5. Çözüm Önerisi (Sıralama: 1. Önerilen Yöntem, 2. Hedef Mimari, 3. Geçiş Yöntemleri) -->
        <div class="nav-group" [class.open]="solutionExpanded">
          <div 
            class="nav-item group-header" 
            [class.active]="isSolutionActive()"
            routerLink="/solution-proposal"
            [title]="collapsed ? 'Çözüm Önerisi' : ''">
            <div class="nav-icon"><app-icon name="map" [size]="17" color="#7c3aed"></app-icon></div>
            <span class="nav-label" *ngIf="!collapsed">Çözüm Önerisi</span>
            <div class="chevron-icon" *ngIf="!collapsed" (click)="$event.stopPropagation(); toggleSolution()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [style.transform]="solutionExpanded ? 'rotate(90deg)' : 'none'">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          <div class="nav-sub-list" *ngIf="solutionExpanded && !collapsed">
            <a 
              routerLink="/solution-proposal" 
              [queryParams]="{ tab: 'recommended' }" 
              [class.sub-active]="isSolutionTabActive('recommended')"
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">1. Önerilen Yöntem</span>
            </a>

            <a 
              routerLink="/solution-proposal" 
              [queryParams]="{ tab: 'target-architecture' }" 
              [class.sub-active]="isSolutionTabActive('target-architecture')"
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">2. Hedef Mimari</span>
            </a>

            <a 
              routerLink="/solution-proposal" 
              [queryParams]="{ tab: 'methods' }" 
              [class.sub-active]="isSolutionTabActive('methods')"
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">3. Geçiş Yöntemleri</span>
            </a>
          </div>
        </div>

        <!-- 6. Toplam Sahip Olma Maliyeti (TCO) -->
        <a routerLink="/business-case" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Toplam Sahip Olma Maliyeti' : ''">
          <div class="nav-icon"><app-icon name="dollar" [size]="17"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Toplam Sahip Olma Maliyeti</span>
        </a>

        <!-- Section: Hızlı İşlemler -->
        <div class="nav-section-title mt-section" *ngIf="!collapsed">HIZLI ARAÇLAR</div>

        <!-- Veri Yükleme -->
        <a routerLink="/data-import" routerLinkActive="active" class="nav-item nav-highlight">
          <div class="nav-icon"><app-icon name="upload" [size]="17" color="#0284c7"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Veri Yükleme</span>
          <span class="nav-badge highlight" *ngIf="!collapsed">+ Excel</span>
        </a>

        <!-- Prompt ile Mimari Çizici (Şimdilik yorum satırında)
        <a routerLink="/architecture-generator" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Prompt ile Mimari Çizici' : ''">
          <div class="nav-icon"><app-icon name="sparkles" [size]="17" color="#7c3aed"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Prompt ile Mimari Çizici</span>
          <span class="nav-badge highlight-purple" *ngIf="!collapsed">AI</span>
        </a>
        -->

        <!-- Rise Skor Hesaplama -->
        <a routerLink="/rise-score" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Rise Skor Hesaplama' : ''">
          <div class="nav-icon"><app-icon name="calculator" [size]="17" color="#d97706"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Rise Skor Hesaplama</span>
          <span class="nav-badge highlight-amber" *ngIf="!collapsed">Skor</span>
        </a>

        <!-- Notlar -->
        <a routerLink="/notes" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Notlar' : ''">
          <div class="nav-icon"><app-icon name="file-text" [size]="17" color="#0284c7"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Notlar</span>
          <span class="nav-badge highlight-blue" *ngIf="!collapsed">{{ notesService.currentCustomerNotesCount() }} Not</span>
        </a>

        <!-- PDF İndir (Tüm Menüler) -->
        <a (click)="quickToolsService.openPdfExport()" class="nav-item" style="cursor: pointer;" [title]="collapsed ? 'PDF İndir (Tüm Menüler)' : ''">
          <div class="nav-icon"><app-icon name="download" [size]="17" color="#059669"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">PDF İndir</span>
          <span class="nav-badge highlight-green" *ngIf="!collapsed">Tüm Menüler</span>
        </a>

        <!-- Ayarlar -->
        <a routerLink="/settings" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Ayarlar & Sistem Yönetimi' : ''">
          <div class="nav-icon"><app-icon name="settings" [size]="17" color="#475569"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Ayarlar</span>
          <span class="nav-badge" *ngIf="!collapsed" style="background: #f1f5f9; color: #475569;">Yedekleme</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    :host { 
      display: block; 
      height: 100vh;
      position: sticky;
      top: 0;
      z-index: 100;
      flex-shrink: 0;
    }

    .sidebar-container {
      width: 272px;
      height: 100vh;
      background: #ffffff;
      color: #374151;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #e5e7eb;
      transition: width 0.2s ease;
      overflow: hidden;

      &.collapsed {
        width: 70px;
        .sidebar-header {
          padding: 0 0.5rem;
          justify-content: center;
          gap: 0.35rem;
        }
        .logo-area {
          gap: 0;
        }
        .logo-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
        }
        .toggle-btn {
          padding: 0.2rem;
        }
        .nav-item { justify-content: center; padding: 0.75rem; }
      }
    }

    .sidebar-header {
      height: 68px;
      padding: 0 0.85rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
      background: #ffffff;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      text-decoration: none;
      min-width: 0;
      transition: all 0.2s ease;

      &:hover {
        .logo-icon {
          transform: scale(1.05);
          box-shadow: 0 0 18px rgba(2, 132, 199, 0.55), 0 0 0 2px rgba(56, 189, 248, 0.75);
        }
        .brand-name {
          color: #0284c7;
        }
      }
    }

    .logo-icon {
      width: 52px;
      height: 52px;
      min-width: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 35% 35%, #0f172a 0%, #020617 100%);
      border: 1.5px solid rgba(56, 189, 248, 0.55);
      box-shadow: 0 3px 12px rgba(2, 132, 199, 0.35);
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

      .brand-logo-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
      min-width: 0;
      user-select: none;

      .brand-name {
        font-weight: 850;
        font-size: 1.02rem;
        color: #0f172a;
        letter-spacing: 0.035em;
        transition: color 0.2s ease;
      }
      .brand-tag {
        font-size: 0.62rem;
        color: #0284c7;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
    }

    .toggle-btn {
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;

      &:hover { background: #f3f4f6; color: #111827; }
      svg { width: 15px; height: 15px; transition: transform 0.2s; }
    }

    .sidebar-nav {
      flex: 1;
      padding: 0.85rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      overflow-y: auto;
    }

    .nav-section-title {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #9ca3af;
      padding: 0.4rem 0.6rem 0.2rem;
      text-transform: uppercase;

      &.mt-section {
        margin-top: 0.6rem;
        padding-top: 0.6rem;
        border-top: 1px solid #f3f4f6;
      }
    }

    .nav-group {
      display: flex;
      flex-direction: column;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.55rem 0.65rem;
      color: #4b5563;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;

      .nav-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        flex-shrink: 0;
      }

      .nav-label {
        white-space: normal;
        line-height: 1.35;
        overflow: hidden;
      }

      .chevron-icon {
        margin-left: auto;
        display: flex;
        align-items: center;
        color: #9ca3af;
        svg { width: 13px; height: 13px; transition: transform 0.2s ease; }
      }

      .nav-badge {
        margin-left: auto;
        font-size: 0.65rem;
        font-weight: 600;
        padding: 0.1rem 0.4rem;
        border-radius: 10px;
        background: #f3f4f6;
        color: #4b5563;

        &.highlight {
          background: #f0f9ff;
          color: #0284c7;
          border: 1px solid #bae6fd;
        }

        &.highlight-purple {
          background: #f5f3ff;
          color: #7c3aed;
          border: 1px solid #ddd6fe;
        }

        &.highlight-green {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        &.highlight-blue {
          background: #f0f9ff;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }

        &.highlight-amber {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
      }

      &:hover {
        background: #f9fafb;
        color: #111827;
        .nav-icon { color: #111827; }
        .chevron-icon { color: #111827; }
      }

      &.active {
        background: #f0f9ff;
        color: #0284c7;
        font-weight: 600;

        .nav-icon { color: #0284c7; }
        .chevron-icon { color: #0284c7; }
      }
    }



    /* Sub Navigation */
    .nav-sub-list {
      display: flex;
      flex-direction: column;
      padding-left: 1.75rem;
      margin: 0.15rem 0 0.35rem;
      gap: 0.15rem;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 1.25rem;
        top: 4px;
        bottom: 6px;
        width: 1.5px;
        background: #e5e7eb;
      }
    }

    .sub-item {
      display: flex;
      align-items: flex-start;
      gap: 0.45rem;
      padding: 0.35rem 0.5rem;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.77rem;
      font-weight: 500;
      border-radius: 5px;
      transition: all 0.15s ease;

      .sub-dot {
        color: #9ca3af;
        font-size: 0.9rem;
        line-height: 1.25;
        margin-top: 1px;
      }

      .sub-text {
        white-space: normal;
        line-height: 1.35;
        overflow: hidden;
      }

      &:hover {
        background: #f9fafb;
        color: #111827;
        .sub-dot { color: #0284c7; }
      }

      &.sub-active {
        background: #f0f9ff;
        color: #0284c7;
        font-weight: 600;
        .sub-dot { color: #0284c7; }
      }
    }
  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  router = inject(Router);
  quickToolsService = inject(QuickToolsService);
  notesService = inject(NotesService);
  modulesExpanded = true;
  licenseExpanded = true;
  basisExpanded = true;
  solutionExpanded = true;

  toggleModules(): void {
    this.modulesExpanded = !this.modulesExpanded;
  }

  toggleLicense(): void {
    this.licenseExpanded = !this.licenseExpanded;
  }

  toggleBasis(): void {
    this.basisExpanded = !this.basisExpanded;
  }

  toggleSolution(): void {
    this.solutionExpanded = !this.solutionExpanded;
  }

  navigateToModulesSummary(event?: Event): void {
    if (event) event.preventDefault();
    this.router.navigate(['/modules'], { 
      queryParams: { tab: 'summary', r: Date.now() } 
    });
  }

  navigateToModulesDetail(event?: Event): void {
    if (event) event.preventDefault();
    this.router.navigate(['/modules'], { 
      queryParams: { tab: 'detail', r: Date.now() } 
    });
  }

  isModulesActive(): boolean {
    const url = this.router.url;
    return url.includes('/modules') || url.includes('/moduller') || url.includes('/sap-uygulamalari') || url.includes('/development') || (url.includes('architecture-map') && url.includes('mode=po'));
  }

  isModulesSummaryActive(): boolean {
    if (!this.router.url.includes('/modules')) return false;
    return this.router.url.includes('tab=summary') || (!this.router.url.includes('tab=detail'));
  }

  isModulesDetailActive(): boolean {
    if (!this.router.url.includes('/modules')) return false;
    return this.router.url.includes('tab=detail');
  }

  isLicenseActive(): boolean {
    const url = this.router.url;
    return url.includes('/analytics') || url.includes('/sap-lisans-bulut') || url.includes('/fue');
  }

  isTeknikAltyapiActive(): boolean {
    const url = this.router.url;
    const isPo = url.includes('architecture-map') && url.includes('mode=po');
    if (isPo) return false;
    return url.includes('source-sizing') || url.includes('largest-tables') || (url.includes('architecture-map') && !url.includes('mode=po'));
  }

  isLandscapeActive(): boolean {
    const url = this.router.url;
    return url.includes('architecture-map') && (url.includes('mode=asis') || (!url.includes('mode=po') && !url.includes('mode=rise')));
  }

  isIntegrationActive(): boolean {
    const url = this.router.url;
    return url.includes('architecture-map') && url.includes('mode=po');
  }

  isSolutionActive(): boolean {
    const url = this.router.url;
    return url.includes('solution-proposal') || url.includes('cozum-onerisi') || url.includes('yol-haritasi');
  }

  isSolutionTabActive(tab: string): boolean {
    if (!this.isSolutionActive()) return false;
    if (tab === 'recommended') {
      return this.router.url.includes('tab=recommended') || (!this.router.url.includes('tab=target-architecture') && !this.router.url.includes('tab=methods'));
    }
    return this.router.url.includes('tab=' + tab);
  }
}
