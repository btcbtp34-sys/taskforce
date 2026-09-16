import { Component, ElementRef, ViewChild, AfterViewInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
import { DataImportService } from '../../core/services/data-import.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="dashboard-page">
      <!-- Page Header -->
      <div class="dashboard-header">
        <div class="header-left">
          <div class="badge-row">
            <span class="company-badge">{{ customerService.activeCustomer().name }}</span>
            <span class="status-tag">Customer Summary Kokpiti</span>
          </div>
          <h2>Müşteri Özeti (Customer Summary) & Mimari Dönüşüm</h2>
          <p class="sub-title">S/4HANA Sizing, {{ fueDisplayValue() }} Lisanslama ve Canlı Entegrasyon Genel Görünümü</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" routerLink="/reports">
            <app-icon name="file-text" [size]="15"></app-icon>
            <span>Yönetici Raporu</span>
          </button>
          <button class="btn btn-primary" routerLink="/business-case">
            <app-icon name="business-case" [size]="15"></app-icon>
            <span>İş Senaryosu & ROI</span>
          </button>
        </div>
      </div>

      <!-- EMPTY DATA NOTICE BANNER (Only shown when no Excel is uploaded) -->
      <div class="empty-upload-card" *ngIf="!basisService.hasUploadedData()" style="padding: 1.5rem; margin-bottom: 1.5rem;">
        <div class="empty-icon-wrap" style="width: 44px; height: 44px; background: #f1f5f9;">
          <app-icon name="database" [size]="22" color="#64748b"></app-icon>
        </div>
        <h3 style="font-size: 1rem; color: #334155;">Veri Yok</h3>
        <p style="font-size: 0.82rem; max-width: 550px; color: #64748b; margin: 0;">
          Dashboard üzerindeki FUE lisanslama, HANA boyutlandırma ve DVM analizleri için henüz veri yüklenmemiştir.
        </p>
      </div>

      <!-- Live Architecture KPIs (6 Cards) -->
      <div class="kpi-grid">
        <div class="kpi-card" routerLink="/architecture-map">
          <div class="kpi-top">
            <span class="kpi-title">Mevcut Sunucu Envanteri</span>
            <div class="kpi-icon-box bg-blue"><app-icon name="database" [size]="18" color="#0284c7"></app-icon></div>
          </div>
          <div class="kpi-val">{{ serverInventoryVal() }}</div>
          <div class="kpi-sub">{{ serverInventorySub() }}</div>
          <div class="kpi-tag-row">
            <span class="tag-pill red" *ngIf="serverInventoryVal() !== '—'">{{ serverInventoryPill() }}</span>
            <span class="tag-pill green" *ngIf="serverInventoryVal() !== '—'">%91 Konsolidasyon</span>
            <span class="tag-pill gray" *ngIf="serverInventoryVal() === '—'">Mimari Çizim Bekleniyor</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/analytics">
          <div class="kpi-top">
            <span class="kpi-title">FUE Lisans İhtiyacı</span>
            <div class="kpi-icon-box bg-emerald"><app-icon name="users" [size]="18" color="#059669"></app-icon></div>
          </div>
          <div class="kpi-val text-emerald">{{ fueDisplayValue() }}</div>
          <div class="kpi-sub">{{ fueUserSubtitle() }}</div>
          <div class="tag-row">
            <span class="tag-pill green" *ngIf="basisService.fueSummary()">Net Formül: HB+HC/5+HD/30</span>
            <span class="tag-pill blue" *ngIf="basisService.fueSummary()">Optimum Paket</span>
            <span class="tag-pill gray" *ngIf="!basisService.fueSummary()">Veri Bekleniyor</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/source-sizing">
          <div class="kpi-top">
            <span class="kpi-title">HANA DB Sizing</span>
            <div class="kpi-icon-box bg-cyan"><app-icon name="database" [size]="18" color="#0891b2"></app-icon></div>
          </div>
          <div class="kpi-val">{{ sizingDisplayValue() }}</div>
          <div class="kpi-sub">{{ sizingSubtitle() }}</div>
          <div class="tag-row">
            <span class="tag-pill blue" *ngIf="basisService.memoryDetails()">Sizing Raporu</span>
            <span class="tag-pill gray" *ngIf="!basisService.memoryDetails()">Veri Bekleniyor</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/architecture-map" [queryParams]="{ mode: 'po' }">
          <div class="kpi-top">
            <span class="kpi-title">Canlı PO Servisleri</span>
            <div class="kpi-icon-box bg-purple"><app-icon name="bolt" [size]="18" color="#7e22ce"></app-icon></div>
          </div>
          <div class="kpi-val text-purple">{{ poServicesVal() }}</div>
          <div class="kpi-sub">{{ poServicesSub() }}</div>
          <div class="tag-row">
            <span class="tag-pill purple" *ngIf="poServicesVal() !== '—'">{{ poServersCount() }} Entegre Sunucu</span>
            <span class="tag-pill green" *ngIf="poServicesVal() !== '—'">BTP Ready</span>
            <span class="tag-pill gray" *ngIf="poServicesVal() === '—'">PO Listesi Bekleniyor</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/largest-tables">
          <div class="kpi-top">
            <span class="kpi-title">En Büyük Tablolar (DVM)</span>
            <div class="kpi-icon-box bg-amber"><app-icon name="layers" [size]="18" color="#d97706"></app-icon></div>
          </div>
          <div class="kpi-val text-amber">{{ tablesDisplayValue() }}</div>
          <div class="kpi-sub">{{ tablesSubtitle() }}</div>
          <div class="tag-row">
            <span class="tag-pill amber" *ngIf="basisService.largestTables().length > 0">DVM Analizi</span>
            <span class="tag-pill gray" *ngIf="basisService.largestTables().length > 0">Housekeeping</span>
            <span class="tag-pill gray" *ngIf="basisService.largestTables().length === 0">Veri Bekleniyor</span>
          </div>
        </div>

        <div class="kpi-card highlight" routerLink="/business-case">
          <div class="kpi-top">
            <span class="kpi-title">Tahmini Yıllık Tasarruf</span>
            <div class="kpi-icon-box bg-emerald"><app-icon name="dollar" [size]="18" color="#059669"></app-icon></div>
          </div>
          <div class="kpi-val text-emerald">{{ savingsVal() }}</div>
          <div class="kpi-sub">{{ savingsSub() }}</div>
          <div class="tag-row">
            <span class="tag-pill green" *ngIf="savingsVal() !== '—'">{{ savingsPill() }}</span>
            <span class="tag-pill gray" *ngIf="savingsVal() === '—'">Veri Yüklenmesi Bekleniyor</span>
          </div>
        </div>
      </div>

      <!-- Interactive 4-Chart Visual Matrix -->
      <div class="charts-grid-2x2">
        <!-- Chart 1: Infrastructure Breakdown -->
        <div class="chart-box">
          <div class="chart-header">
            <div class="ch-left">
              <app-icon name="database" [size]="16" color="#0284c7"></app-icon>
              <h3>Altyapı & Sunucu Dağılımı <span *ngIf="serverInventoryVal() !== '—'">({{ serverInventoryVal() }} ➔ 1 Bulut DB)</span></h3>
            </div>
            <a routerLink="/architecture-map" [queryParams]="{ mode: 'asis' }" class="ch-link">Mimari Şema ➔</a>
          </div>
          <div class="chart-body">
            <canvas #infraChart *ngIf="serverInventoryVal() !== '—'"></canvas>
            <div class="chart-empty-msg" *ngIf="serverInventoryVal() === '—'">
              <app-icon name="info" [size]="20" color="#94a3b8"></app-icon>
              <span>Mimari şeması veya sunucu verisi henüz girilmedi.</span>
              <a routerLink="/architecture-map" [queryParams]="{ mode: 'asis' }" class="empty-btn">+ Mimariyi Çiz</a>
            </div>
          </div>
        </div>

        <!-- Chart 2: FUE License Distribution -->
        <div class="chart-box">
          <div class="chart-header">
            <div class="ch-left">
              <app-icon name="users" [size]="16" color="#059669"></app-icon>
              <h3>FUE Lisanslama Dağılımı <span *ngIf="basisService.fueSummary()">(Toplam {{ round(basisService.fueSummary()!.calculatedFUE) }} FUE)</span></h3>
            </div>
            <a routerLink="/analytics" class="ch-link">Lisans Analizi ➔</a>
          </div>
          <div class="chart-body">
            <canvas #licenseChart *ngIf="basisService.fueSummary()"></canvas>
            <div class="chart-empty-msg" *ngIf="!basisService.fueSummary()">
              <app-icon name="info" [size]="20" color="#94a3b8"></app-icon>
              <span>FUE lisans tablosu yüklenmedi. Excel ile USMM/FUE verisi yükleyebilirsiniz.</span>
            </div>
          </div>
        </div>

        <!-- Chart 3: HANA Sizing Memory & DVM Savings -->
        <div class="chart-box">
          <div class="chart-header">
            <div class="ch-left">
              <app-icon name="database" [size]="16" color="#0891b2"></app-icon>
              <h3>HANA DB Sizing & DVM Tasarruf Potansiyeli (GiB)</h3>
            </div>
            <a routerLink="/source-sizing" class="ch-link">Sizing Kokpiti ➔</a>
          </div>
          <div class="chart-body">
            <canvas #sizingChart *ngIf="basisService.memoryDetails()"></canvas>
            <div class="chart-empty-msg" *ngIf="!basisService.memoryDetails()">
              <app-icon name="info" [size]="20" color="#94a3b8"></app-icon>
              <span>Source Sizing verisi henüz yüklenmedi.</span>
            </div>
          </div>
        </div>

        <!-- Chart 4: PO Integration Protocol Breakdown -->
        <div class="chart-box">
          <div class="chart-header">
            <div class="ch-left">
              <app-icon name="bolt" [size]="16" color="#7e22ce"></app-icon>
              <h3>PO Canlı Entegrasyon Protokolleri <span *ngIf="poServicesVal() !== '—'">({{ poServicesVal() }})</span></h3>
            </div>
            <a routerLink="/architecture-map" [queryParams]="{ mode: 'po' }" class="ch-link">PO Listesi ➔</a>
          </div>
          <div class="chart-body">
            <canvas #integrationChart *ngIf="importService.hasUploadedPoData() && importService.poInterfaces().length > 0"></canvas>
            <div class="chart-empty-msg" *ngIf="!importService.hasUploadedPoData() || importService.poInterfaces().length === 0">
              <app-icon name="info" [size]="20" color="#94a3b8"></app-icon>
              <span>PO servis listesi Excel dosyası henüz yüklenmedi.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Exploration Navigation Strip -->
      <div class="quick-nav-card">
        <div class="qn-header">
          <div class="qn-left">
            <app-icon name="sparkles" [size]="18" color="#0284c7"></app-icon>
            <h3>Detaylı Analiz Modülleri ve Veri Setleri</h3>
          </div>
          <span class="qn-sub">Tüm veri setleri Excel analizleri ve mimari çizimler ile senkronize edilir</span>
        </div>

        <div class="modules-grid">
          <a routerLink="/architecture-map" [queryParams]="{ mode: 'asis' }" class="module-nav-item">
            <div class="m-icon bg-blue"><app-icon name="map" [size]="18" color="#0284c7"></app-icon></div>
            <div class="m-info">
              <strong>Landscape & EoS Haritası</strong>
              <span>{{ serverInventoryVal() !== '—' ? serverInventoryVal() + ' Kayıtlı Bileşen' : 'Özel AS-IS & RISE Çizim Alanı' }}</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/analytics" class="module-nav-item">
            <div class="m-icon bg-emerald"><app-icon name="users" [size]="18" color="#059669"></app-icon></div>
            <div class="m-info">
              <strong>FUE & Lisans Optimizasyonu</strong>
              <span>{{ basisService.fueSummary() ? (basisService.fueSummary()!.totalUsers + ' Aktif Kullanıcı ➔ ' + round(basisService.fueSummary()!.calculatedFUE) + ' FUE') : 'USMM / FUE Excel Analizi' }}</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/source-sizing" class="module-nav-item">
            <div class="m-icon bg-cyan"><app-icon name="database" [size]="18" color="#0891b2"></app-icon></div>
            <div class="m-info">
              <strong>Source Sizing (HANA 2.0)</strong>
              <span>{{ basisService.memoryDetails() ? (round(basisService.memoryDetails()!.anticipatedInitialMemoryGiB) + ' GiB RAM Hedef') : 'HANA Sizing Raporlama' }}</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/largest-tables" class="module-nav-item">
            <div class="m-icon bg-amber"><app-icon name="layers" [size]="18" color="#d97706"></app-icon></div>
            <div class="m-info">
              <strong>Largest Tables (DVM)</strong>
              <span>{{ basisService.largestTables().length > 0 ? (basisService.largestTables().length + ' Kritik Tablo Analiz Edildi') : 'Kritik Tablo & DVM Arşivleme' }}</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/architecture-map" [queryParams]="{ mode: 'po' }" class="module-nav-item">
            <div class="m-icon bg-purple"><app-icon name="bolt" [size]="18" color="#7e22ce"></app-icon></div>
            <div class="m-info">
              <strong>PO Entegrasyon Listesi</strong>
              <span>{{ importService.hasUploadedPoData() && importService.poInterfaces().length > 0 ? (importService.poInterfaces().length + ' Canlı Servis') : 'Entegrasyon Excel Yükleme' }}</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/reports" class="module-nav-item highlight">
            <div class="m-icon bg-emerald"><app-icon name="file-text" [size]="18" color="#059669"></app-icon></div>
            <div class="m-info">
              <strong>Executive Summary (PDF Rapor)</strong>
              <span>Yönetici ve Karar Verici Özeti</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* HEADER */
    .dashboard-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.25rem;
      background: #ffffff;
      padding: 1.35rem 1.65rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);

      .header-left {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        .badge-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;

          .company-badge {
            background: #0284c7;
            color: #ffffff;
            font-size: 0.72rem;
            font-weight: 800;
            padding: 0.18rem 0.55rem;
            border-radius: 4px;
          }

          .pulse-live-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: #f0fdf4;
            color: #059669;
            border: 1px solid #a7f3d0;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.18rem 0.55rem;
            border-radius: 20px;

            .pulse-dot {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #10b981;
              box-shadow: 0 0 8px #10b981;
            }
          }
        }

        .main-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .sub-title {
          margin: 0;
          font-size: 0.82rem;
          color: #64748b;
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.18s;

          &.btn-primary {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff;
            border-color: #0284c7;
            box-shadow: 0 3px 10px rgba(2, 132, 199, 0.28);

            &:hover {
              background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
              box-shadow: 0 5px 15px rgba(2, 132, 199, 0.38);
              transform: translateY(-1px);
            }
          }
        }
      }
    }

    /* KPI GRID (6 CARDS) */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1.1rem;

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.15rem;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        cursor: pointer;
        text-decoration: none;
        transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
          border-color: #0284c7;
        }

        &.highlight {
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
          border-color: #a7f3d0;
        }

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .kpi-title {
            font-size: 0.74rem;
            font-weight: 700;
            color: #64748b;
          }

          .kpi-icon-box {
            width: 30px;
            height: 30px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;

            &.bg-blue { background: #f0f9ff; }
            &.bg-emerald { background: #ecfdf5; }
            &.bg-cyan { background: #ecfeff; }
            &.bg-purple { background: #fdf4ff; }
            &.bg-amber { background: #fffbeb; }
          }
        }

        .kpi-val {
          font-size: 1.35rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.15;
        }

        .kpi-sub {
          font-size: 0.68rem;
          color: #64748b;
        }

        .kpi-tag-row, .tag-row {
          display: flex;
          gap: 0.3rem;
          flex-wrap: wrap;
          margin-top: 0.25rem;

          .tag-pill {
            font-size: 0.62rem;
            font-weight: 700;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;

            &.red { background: #fee2e2; color: #dc2626; }
            &.green { background: #ecfdf5; color: #047857; }
            &.blue { background: #f0f9ff; color: #0284c7; }
            &.purple { background: #fdf4ff; color: #7e22ce; }
            &.amber { background: #fffbeb; color: #b45309; }
            &.gray { background: #f1f5f9; color: #475569; }
          }
        }
      }
    }

    /* 4-CHART GRID */
    .charts-grid-2x2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
      gap: 1.25rem;

      .chart-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .ch-left {
            display: flex;
            align-items: center;
            gap: 0.45rem;

            h3 {
              margin: 0;
              font-size: 0.88rem;
              font-weight: 800;
              color: #0f172a;
            }
          }

          .ch-link {
            font-size: 0.72rem;
            font-weight: 700;
            color: #0284c7;
            text-decoration: none;

            &:hover { text-decoration: underline; }
          }
        }

        .chart-body {
          position: relative;
          height: 220px;
          width: 100%;

          .chart-empty-msg {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 0.6rem;
            color: #94a3b8;
            font-size: 0.82rem;
            text-align: center;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px dashed #e2e8f0;

            .empty-btn {
              display: inline-block;
              margin-top: 0.25rem;
              padding: 0.35rem 0.75rem;
              background: #0284c7;
              color: white;
              border-radius: 6px;
              font-size: 0.75rem;
              font-weight: 600;
              text-decoration: none;
              transition: background 0.15s;
              &:hover { background: #0369a1; }
            }
          }
        }
      }
    }

    /* QUICK NAVIGATION MODULES */
    .quick-nav-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .qn-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.5rem;

        .qn-left {
          display: flex;
          align-items: center;
          gap: 0.45rem;

          h3 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 800;
            color: #0f172a;
          }
        }

        .qn-sub {
          font-size: 0.74rem;
          color: #64748b;
        }
      }

      .modules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 0.85rem;

        .module-nav-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          transition: all 0.15s;

          &:hover {
            background: #ffffff;
            border-color: #0284c7;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.1);

            .m-arrow {
              transform: translateX(3px);
              color: #0284c7;
            }
          }

          &.highlight {
            background: #ecfdf5;
            border-color: #a7f3d0;

            &:hover {
              border-color: #059669;
              box-shadow: 0 4px 12px rgba(5, 150, 105, 0.12);
            }
          }

          .m-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            &.bg-blue { background: #f0f9ff; }
            &.bg-emerald { background: #ecfdf5; }
            &.bg-cyan { background: #ecfeff; }
            &.bg-purple { background: #fdf4ff; }
            &.bg-amber { background: #fffbeb; }
          }

          .m-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.15rem;

            strong {
              font-size: 0.8rem;
              color: #0f172a;
            }

            span {
              font-size: 0.68rem;
              color: #64748b;
            }
          }

          .m-arrow {
            font-size: 0.9rem;
            color: #94a3b8;
            font-weight: 800;
            transition: transform 0.15s;
          }
        }
      }
    }

    .text-emerald { color: #059669; }
    .text-purple { color: #7e22ce; }
    .text-amber { color: #d97706; }
  `]
})
export class DashboardComponent implements AfterViewInit {
  customerService = inject(CustomerService);
  basisService = inject(BasisSizingService);
  importService = inject(DataImportService);

  round(v: number): number {
    return Math.round(v);
  }

  // 1. Server Inventory (Checks LocalStorage saved architecture or Basis Sizing Matrix)
  serverInventoryVal = computed(() => {
    const custId = this.customerService.activeCustomerId();
    const saved = localStorage.getItem(`taskforce_custom_arch_${custId}_asis`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          const total = parsed.nodes.reduce((sum: number, n: any) => sum + (n.instanceCount || 1), 0);
          return `${total} Sunucu`;
        }
      } catch (e) {}
    }
    if (this.basisService.hasUploadedData() && this.basisService.sizingMatrix().length > 0) {
      return `${this.basisService.sizingMatrix().length} Sunucu`;
    }
    return '—';
  });

  serverInventorySub = computed(() => {
    if (this.serverInventoryVal() !== '—') {
      return 'Target: 1 Konsolide Bulut DB';
    }
    return 'Veri veya Çizim Bekleniyor';
  });

  serverInventoryPill = computed(() => {
    if (this.serverInventoryVal() !== '—') {
      return `${this.serverInventoryVal()} On-Prem`;
    }
    return 'Çizim Bekleniyor';
  });

  // 2. FUE Display Values
  fueDisplayValue = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return `${Math.round(this.basisService.fueSummary()!.calculatedFUE)} FUE`;
    }
    return '—';
  });

  fueUserSubtitle = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return `${this.basisService.fueSummary()!.totalUsers} Fiili Kullanıcı Kapsamda`;
    }
    return 'Veri Yüklenmesi Bekleniyor';
  });

  // 3. HANA DB Sizing Display Values
  sizingDisplayValue = computed(() => {
    const mem = this.basisService.memoryDetails();
    if (this.basisService.hasUploadedData() && mem) {
      return `${Math.round(mem.anticipatedInitialMemoryGiB)} GiB`;
    }
    return '—';
  });

  sizingSubtitle = computed(() => {
    const disk = this.basisService.diskDetails();
    if (this.basisService.hasUploadedData() && disk) {
      return `${Math.round(disk.initialNetDiskGiB * 0.3)} GiB Disk Alanı Kazanımı`;
    }
    return 'Veri Yüklenmesi Bekleniyor';
  });

  // 4. Live PO Services Display Values (Dynamic from importService)
  poServicesVal = computed(() => {
    if (this.importService.hasUploadedPoData() && this.importService.poInterfaces().length > 0) {
      return `${this.importService.poInterfaces().length} Servis`;
    }
    return '—';
  });

  poServicesSub = computed(() => {
    if (this.importService.hasUploadedPoData() && this.importService.poInterfaces().length > 0) {
      const list = this.importService.poInterfaces();
      const outCount = list.filter(i => i.role === 'outbound').length;
      const inCount = list.filter(i => i.role === 'inbound').length;
      return `${outCount} Verici • ${inCount} Alıcı Arayüz`;
    }
    return 'Veri Yüklenmesi Bekleniyor';
  });

  poServersCount = computed(() => {
    if (this.importService.hasUploadedPoData() && this.importService.poSummary()) {
      return this.importService.poSummary()!.totalServers;
    }
    return 0;
  });

  // 5. Largest Tables Display Values
  tablesDisplayValue = computed(() => {
    const tables = this.basisService.largestTables();
    if (this.basisService.hasUploadedData() && tables.length > 0) {
      return `${tables.length} Tablo`;
    }
    return '—';
  });

  tablesSubtitle = computed(() => {
    const tables = this.basisService.largestTables();
    if (this.basisService.hasUploadedData() && tables.length > 0) {
      return `${tables[0].name} (${tables[0].sizeGiB.toFixed(1)} GiB)`;
    }
    return 'Veri Yüklenmesi Bekleniyor';
  });

  // 6. Estimated Savings Display Values
  savingsVal = computed(() => '—');

  savingsSub = computed(() => 'Veri Yüklenmesi Bekleniyor');

  savingsPill = computed(() => 'Hesaplama Bekleniyor');

  @ViewChild('infraChart') infraChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('licenseChart') licenseChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sizingChart') sizingChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('integrationChart') integrationChartRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  private initCharts(): void {
    // 1. Infrastructure Chart (Only initialized if real server data or saved diagram exists)
    if (this.infraChartRef?.nativeElement && this.serverInventoryVal() !== '—') {
      const custId = this.customerService.activeCustomerId();
      const saved = localStorage.getItem(`taskforce_custom_arch_${custId}_asis`);
      let labels: string[] = [];
      let data: number[] = [];

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
            labels = parsed.nodes.slice(0, 6).map((n: any) => n.name);
            data = parsed.nodes.slice(0, 6).map((n: any) => n.instanceCount || 1);
          }
        } catch (e) {}
      }

      if (labels.length === 0 && this.basisService.hasUploadedData() && this.basisService.sizingMatrix().length > 0) {
        labels = this.basisService.sizingMatrix().slice(0, 6).map((m: any) => m.component || m.name || '');
        data = this.basisService.sizingMatrix().slice(0, 6).map((m: any) => m.sourceInstances || 1);
      }

      if (labels.length > 0) {
        new Chart(this.infraChartRef.nativeElement, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Sunucu Adedi',
              data,
              backgroundColor: ['#ef4444', '#ef4444', '#dc2626', '#f59e0b', '#0284c7', '#10b981'],
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
          }
        });
      }
    }

    // 2. FUE License Chart (Only initialized if FUE summary exists)
    if (this.licenseChartRef?.nativeElement && this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      const fue = this.basisService.fueSummary()!;
      const hb = fue.hbCount;
      const hc = Math.round(fue.hcCount / 5);
      const hd = Math.round(fue.hdCount / 30);

      new Chart(this.licenseChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: [`Advanced (${hb} FUE)`, `Core (${hc} FUE)`, `Self-Service (${hd} FUE)`],
          datasets: [{
            data: [hb, hc, hd],
            backgroundColor: ['#0284c7', '#059669', '#7e22ce'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
          }
        }
      });
    }

    // 3. HANA Sizing Chart (Only initialized if Sizing data exists)
    if (this.sizingChartRef?.nativeElement && this.basisService.hasUploadedData()) {
      const mem = this.basisService.memoryDetails()?.anticipatedInitialMemoryGiB || 0;
      const disk = this.basisService.diskDetails()?.initialNetDiskGiB || 0;

      new Chart(this.sizingChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Başlangıç RAM', 'Hedef RAM', 'Başlangıç Disk', 'Hedef Disk (DVM)'],
          datasets: [{
            label: 'GiB',
            data: [
              Math.round(mem),
              Math.round(mem * 0.85),
              Math.round(disk),
              Math.round(disk * 0.70)
            ],
            backgroundColor: ['#94a3b8', '#0284c7', '#cbd5e1', '#059669'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // 4. PO Integration Protocols Chart (Dynamic grouping from actual PO Excel)
    if (this.integrationChartRef?.nativeElement && this.importService.hasUploadedPoData() && this.importService.poInterfaces().length > 0) {
      const interfaces = this.importService.poInterfaces();
      const protoMap: Record<string, number> = {};
      for (const item of interfaces) {
        const p = (item.protocol || 'DİĞER').trim().toUpperCase();
        protoMap[p] = (protoMap[p] || 0) + 1;
      }
      const sorted = Object.entries(protoMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const labels = sorted.map(s => s[0]);
      const data = sorted.map(s => s[1]);

      new Chart(this.integrationChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Servis Sayısı',
            data,
            backgroundColor: ['#7e22ce', '#0284c7', '#059669', '#d97706', '#0891b2', '#64748b'],
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true }
          }
        }
      });
    }
  }
}
