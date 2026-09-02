import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <aside class="sidebar-container" [class.collapsed]="collapsed">
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="logo-area">
          <div class="logo-icon">
            <app-icon name="layers" [size]="18" color="#0284c7"></app-icon>
          </div>
          <div class="logo-text" *ngIf="!collapsed">
            <span class="brand-name">TASK FORCE</span>
            <span class="brand-tag">SAP Opportunity Engine</span>
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

        <!-- 0. Overview Dashboard -->
        <a 
          routerLink="/dashboard" 
          routerLinkActive="active" 
          [routerLinkActiveOptions]="{ exact: true }" 
          class="nav-item"
          [title]="collapsed ? 'Dashboard' : ''">
          <div class="nav-icon"><app-icon name="dashboard" [size]="17" color="#0284c7"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Dashboard</span>
        </a>

        <!-- 1. Basis/Infra (Expandable Group) -->
        <div class="nav-group" [class.open]="basisExpanded">
          <div 
            class="nav-item group-header" 
            [class.active]="isBasisActive()"
            (click)="toggleBasis()"
            [title]="collapsed ? 'Basis/Infra' : ''">
            <div class="nav-icon"><app-icon name="database" [size]="17"></app-icon></div>
            <span class="nav-label" *ngIf="!collapsed">Basis/Infra</span>
            <div class="chevron-icon" *ngIf="!collapsed">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [style.transform]="basisExpanded ? 'rotate(90deg)' : 'none'">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          <!-- Alt Kırılımlar (Sub Items) -->
          <div class="nav-sub-list" *ngIf="basisExpanded && !collapsed">
            <!-- 1. Lanscape/Versiyon / EoS (Mevcut Durum) -->
            <a 
              routerLink="/architecture-map" 
              [queryParams]="{ mode: 'asis' }" 
              routerLinkActive="sub-active" 
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">Lanscape/Versiyon / EoS</span>
            </a>

            <!-- 2. FUE / License -->
            <a 
              routerLink="/analytics" 
              routerLinkActive="sub-active" 
              [routerLinkActiveOptions]="{ exact: true }"
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">FUE / License</span>
            </a>

            <!-- 3. Source (Current/Target) -->
            <a 
              routerLink="/source-sizing" 
              routerLinkActive="sub-active" 
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">Source (Current/Target)</span>
            </a>

            <!-- 4. Largest Table (DVM) -->
            <a 
              routerLink="/largest-tables" 
              routerLinkActive="sub-active" 
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">Largest Table (DVM)</span>
            </a>

            <!-- 5. Integration (PO Entegrasyon Listesi) -->
            <a 
              routerLink="/architecture-map" 
              [queryParams]="{ mode: 'po' }" 
              routerLinkActive="sub-active" 
              class="sub-item">
              <span class="sub-dot">•</span>
              <span class="sub-text">Integration</span>
            </a>
          </div>
        </div>

        <!-- 2. Modules -->
        <a routerLink="/opportunities" [queryParams]="{ category: 'modules' }" routerLinkActive="active" class="nav-item">
          <div class="nav-icon"><app-icon name="sliders" [size]="17"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Modules</span>
        </a>

        <!-- 3. Development -->
        <a routerLink="/opportunities" [queryParams]="{ category: 'development' }" routerLinkActive="active" class="nav-item">
          <div class="nav-icon"><app-icon name="cpu" [size]="17"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Development</span>
        </a>

        <!-- 4. TCO -->
        <a routerLink="/business-case" routerLinkActive="active" class="nav-item">
          <div class="nav-icon"><app-icon name="dollar" [size]="17"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">TCO</span>
        </a>

        <!-- 5. Executive Summary (Comprehensive Report & PDF) -->
        <a routerLink="/reports" routerLinkActive="active" class="nav-item" [title]="collapsed ? 'Executive Summary' : ''">
          <div class="nav-icon"><app-icon name="file-text" [size]="17" color="#059669"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Executive Summary</span>
          <span class="nav-badge" *ngIf="!collapsed">PDF</span>
        </a>

        <!-- Section: Hızlı İşlemler -->
        <div class="nav-section-title mt-section" *ngIf="!collapsed">HIZLI ARAÇLAR</div>

        <!-- Veri Yükleme (Sadece Bu Kalıyor) -->
        <a routerLink="/data-import" routerLinkActive="active" class="nav-item nav-highlight">
          <div class="nav-icon"><app-icon name="upload" [size]="17" color="#0284c7"></app-icon></div>
          <span class="nav-label" *ngIf="!collapsed">Veri Yükleme</span>
          <span class="nav-badge highlight" *ngIf="!collapsed">+ Excel</span>
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
      width: 240px;
      height: 100vh;
      background: #ffffff;
      color: #374151;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #e5e7eb;
      transition: width 0.2s ease;
      overflow: hidden;

      &.collapsed {
        width: 64px;
        .nav-item { justify-content: center; padding: 0.75rem; }
      }
    }

    .sidebar-header {
      height: 56px;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      .brand-name { font-weight: 800; font-size: 0.9rem; color: #111827; letter-spacing: 0.02em; }
      .brand-tag { font-size: 0.65rem; color: #0284c7; font-weight: 600; }
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
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
      padding-left: 1.85rem;
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
      align-items: center;
      gap: 0.45rem;
      padding: 0.32rem 0.5rem;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.77rem;
      font-weight: 500;
      border-radius: 5px;
      transition: all 0.15s ease;

      .sub-dot {
        color: #9ca3af;
        font-size: 0.9rem;
        line-height: 1;
      }

      .sub-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
  basisExpanded = true;

  toggleBasis(): void {
    this.basisExpanded = !this.basisExpanded;
  }

  isBasisActive(): boolean {
    const url = this.router.url;
    return url.includes('architecture-map') || (url.includes('analytics') && !url.includes('category'));
  }
}
