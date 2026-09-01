import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, KpiCardComponent, StatusBadgeComponent, IconComponent],
  template: `
    <div class="customer-360-page">
      <!-- Breadcrumb & Header -->
      <div class="header-nav">
        <a routerLink="/customers" class="back-link">
          <app-icon name="arrow-right" [size]="14" style="transform: rotate(180deg);"></app-icon>
          <span>Müşteri Listesine Dön</span>
        </a>

        <div class="header-main">
          <div class="title-area">
            <div class="customer-logo-large">
              <app-icon name="database" [size]="24" color="#0284c7"></app-icon>
            </div>
            <div>
              <div class="title-row">
                <h1 class="customer-title">{{ activeCustomer().name }}</h1>
                <app-status-badge [text]="activeCustomer().taskForceStatus" type="stage"></app-status-badge>
              </div>
              <p class="customer-sub">
                Sektör: <strong>{{ activeCustomer().sector }}</strong> • Kod: {{ activeCustomer().code }} • İletişim: {{ activeCustomer().contactPerson }} ({{ activeCustomer().email }})
              </p>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="quick-nav-bar">
            <a routerLink="/data-import" class="nav-btn">
              <app-icon name="upload" [size]="15"></app-icon>
              <span>Veri Yükle</span>
            </a>
            <a routerLink="/architecture-map" class="nav-btn">
              <app-icon name="map" [size]="15"></app-icon>
              <span>Şirket Haritası</span>
            </a>
            <a routerLink="/analytics" class="nav-btn">
              <app-icon name="analytics" [size]="15"></app-icon>
              <span>Analizler</span>
            </a>
            <a routerLink="/opportunities" class="nav-btn primary">
              <app-icon name="opportunities" [size]="15" color="#0284c7"></app-icon>
              <span>Fırsatlar ({{ activeCustomer().activeOpportunityCount }})</span>
            </a>
            <a routerLink="/business-case" class="nav-btn">
              <app-icon name="business-case" [size]="15"></app-icon>
              <span>Business Case</span>
            </a>
            <a routerLink="/workspace" class="nav-btn">
              <app-icon name="workspace" [size]="15"></app-icon>
              <span>Workspace</span>
            </a>
            <a routerLink="/presentation" class="nav-btn accent">
              <app-icon name="presentation" [size]="15" color="#ffffff"></app-icon>
              <span>Sunum</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Müşteri Özeti KPI Grid -->
      <div class="section-title">
        <h2><app-icon name="user" [size]="18" color="#0284c7"></app-icon> Müşteri Özeti</h2>
      </div>

      <div class="kpi-grid">
        <app-kpi-card 
          label="Toplam SAP Kullanıcısı" 
          [value]="activeCustomer().sapUserCount" 
          unit="Kullanıcı"
          subtext="Lisans Tanımlı Tüm Personel"
          theme="primary">
          <app-icon name="users" [size]="18" color="#4b5563"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="Aktif Kullanıcı" 
          [value]="activeCustomer().activeUserCount" 
          unit="Kullanıcı"
          trendText="%90 Aktif Oran"
          theme="emerald">
          <app-icon name="check" [size]="18" color="#047857"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="Düşük Kullanımlı Kullanıcı" 
          [value]="activeCustomer().lowUsageUserCount" 
          unit="Kullanıcı"
          trendText="Optimizasyon Adayı"
          [trendPositive]="false"
          theme="amber">
          <app-icon name="alert" [size]="18" color="#b45309"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="Toplam Lisans Maliyeti" 
          [value]="'€' + activeCustomer().totalLicenseCost" 
          unit="/ Yıl"
          subtext="Yıllık Birim Maliyet"
          theme="indigo">
          <app-icon name="dollar" [size]="18" color="#4b5563"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="Tahmini Fırsat Değeri" 
          [value]="'€' + activeCustomer().estimatedOpportunityValue" 
          unit="/ Yıl"
          trendText="Yıllık Katma Değer"
          theme="emerald">
          <app-icon name="opportunities" [size]="18" color="#047857"></app-icon>
        </app-kpi-card>
      </div>

      <!-- SAP Landscape & Problems Dual Section -->
      <div class="dual-grid">
        <!-- SAP Landscape Section -->
        <div class="card-box">
          <div class="card-box-header">
            <h3><app-icon name="database" [size]="18"></app-icon> SAP Landscape (Mevcut Ürün Mimarisi)</h3>
            <span class="card-subtitle">{{ activeCustomer().sapProducts.length }} SAP Ürünü Aktif</span>
          </div>

          <div class="landscape-list">
            @for (prod of activeCustomer().sapProducts; track prod.id) {
              <div class="landscape-item">
                <div class="product-icon">
                  <app-icon name="database" [size]="16" color="#0284c7"></app-icon>
                </div>
                <div class="product-details">
                  <strong>{{ prod.name }}</strong>
                  <span class="category-text">{{ prod.category }} • {{ prod.licenseCount }} Lisans</span>
                </div>
                <div class="product-cost">
                  <strong>€{{ prod.monthlyCost * 12 | number }} / Yıl</strong>
                  <app-status-badge [text]="prod.status" type="status"></app-status-badge>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Temel Problemler Section -->
        <div class="card-box">
          <div class="card-box-header">
            <h3><app-icon name="alert" [size]="18" color="#b91c1c"></app-icon> Müşteride Tespit Edilen Temel Problemler</h3>
            <span class="card-subtitle">Task Force Öncelikli Alanlar</span>
          </div>

          <div class="problems-list">
            @for (prob of activeCustomer().coreProblems; track prob) {
              <div class="problem-item">
                <div class="alert-icon">
                  <app-icon name="alert" [size]="16" color="#b91c1c"></app-icon>
                </div>
                <div class="problem-content">
                  <strong>{{ prob }}</strong>
                  <p>Mevcut manuel süreçler ve yetkisiz lisans atamaları sebebiyle verimsizlik oluşturmaktadır.</p>
                </div>
                <app-status-badge text="In Progress" type="status"></app-status-badge>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .customer-360-page {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .header-nav { display: flex; flex-direction: column; gap: 0.6rem; }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      color: #0284c7;
      font-size: 0.78rem;
      font-weight: 700;
      text-decoration: none;
    }

    .header-main {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .title-area {
      display: flex;
      align-items: center;
      gap: 0.85rem;

      .customer-logo-large {
        width: 44px;
        height: 44px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .title-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .customer-title { font-size: 1.35rem; font-weight: 800; color: #111827; margin: 0; }
      }

      .customer-sub { margin: 0.15rem 0 0 0; font-size: 0.78rem; color: #6b7280; }
    }

    .quick-nav-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      border-top: 1px solid #f3f4f6;
      padding-top: 0.85rem;

      .nav-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.75rem;
        border-radius: 6px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        color: #374151;
        font-size: 0.78rem;
        font-weight: 600;
        text-decoration: none;

        &:hover { background: #f9fafb; }
        &.primary { background: #f0f9ff; color: #0284c7; border-color: #bae6fd; }
        &.accent { background: #0284c7; color: #fff; border: none; }
      }
    }

    .section-title {
      h2 { font-size: 1.05rem; font-weight: 800; color: #111827; margin: 0; display: flex; align-items: center; gap: 0.4rem; }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 1rem;
    }

    .dual-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 1.25rem;
    }

    .card-box {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;

      .card-box-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        h3 { margin: 0; font-size: 0.92rem; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 0.4rem; }
        .card-subtitle { font-size: 0.72rem; color: #6b7280; font-weight: 600; }
      }
    }

    .landscape-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;

      .landscape-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem;
        background: #f9fafb;
        border: 1px solid #f3f4f6;
        border-radius: 6px;

        .product-icon {
          width: 32px;
          height: 32px;
          background: #f0f9ff;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          strong { font-size: 0.82rem; color: #111827; }
          .category-text { font-size: 0.7rem; color: #6b7280; }
        }

        .product-cost {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
          strong { font-size: 0.78rem; color: #111827; }
        }
      }
    }

    .problems-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;

      .problem-item {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        padding: 0.6rem;
        background: #fef2f2;
        border: 1px solid #fee2e2;
        border-radius: 6px;

        .alert-icon { font-size: 1rem; }

        .problem-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          strong { font-size: 0.8rem; color: #b91c1c; }
          p { margin: 0.1rem 0 0 0; font-size: 0.72rem; color: #991b1b; }
        }
      }
    }
  `]
})
export class CustomerDetailComponent {
  customerService = inject(CustomerService);

  readonly activeCustomer = this.customerService.activeCustomer;
}
