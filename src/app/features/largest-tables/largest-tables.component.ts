import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

export interface LargestTableItem {
  name: string;
  sizeGiB: number;
  records: number;
  desc: string;
  module: string;
  isCustom: boolean;
  recommendation: string;
  archivingPotential: string;
}

@Component({
  selector: 'app-largest-tables',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent],
  template: `
    <div class="largest-tables-page">
      
      <!-- Live Upload Indicator Banner -->
      <div class="uploaded-live-banner" *ngIf="basisService.hasUploadedData()">
        <div class="banner-left">
          <span class="live-dot"></span>
          <span class="banner-text">
            <strong>Canlı Sizing Raporu Yüklendi:</strong> {{ basisService.basisPackage()?.fileName }} 
            • <strong>{{ allTables().length }} Tablo</strong> Okundu 
            • Toplam Bellek: <strong>{{ totalTableVolume() | number:'1.1-1' }} GiB</strong>
          </span>
        </div>
        <div class="banner-right">
          <button class="btn-banner-reset" (click)="basisService.clearUploadedData()">
            Varsayılan Görünüme Dön
          </button>
        </div>
      </div>

      <!-- 1. PAGE HEADER -->
      <div class="page-top-header">
        <div class="title-area">
          <div class="customer-tag">
            <app-icon name="customers" [size]="13" color="#0284c7"></app-icon>
            <span>{{ customerService.activeCustomer().name }}</span>
          </div>
          <h1 class="page-title">En Büyük Tablolar & DVM Analizi (Largest Tables)</h1>
          <p class="page-subtitle">S/4HANA Sizing raporundaki en büyük 30 tablo, bellek tüketimi (GiB) ve kayıt hacmi analizi</p>
        </div>

        <div class="header-action-badge">
          <app-icon name="database" [size]="14" color="#0284c7"></app-icon>
          <span>Toplam En Büyük Tablo Hacmi: <strong>{{ basisService.hasUploadedData() ? (totalTableVolume() | number:'1.1-1') + ' GiB' : '—' }}</strong> ({{ basisService.hasUploadedData() ? formatRecordCount(totalRecords()) + ' Kayıt' : 'Veri Bekleniyor' }})</span>
        </div>
      </div>

      <!-- EMPTY STATE WHEN NO EXCEL HAS BEEN UPLOADED -->
      <div class="empty-upload-card" *ngIf="!basisService.hasUploadedData()">
        <div class="empty-icon-wrap" style="background: #f1f5f9;">
          <app-icon name="database" [size]="32" color="#64748b"></app-icon>
        </div>
        <h3 style="color: #334155;">Veri Yok</h3>
        <p style="color: #64748b;">En büyük tablolar ve DVM analizi için henüz veri bulunmamaktadır.</p>
      </div>

      <!-- MAIN CONTENT (Only rendered when an Excel is uploaded!) -->
      <ng-container *ngIf="basisService.hasUploadedData()">

      <!-- 2. EXECUTIVE KPI CARDS (DVM & SIZING POTENTIAL) -->
      <div class="kpi-summary-grid">
        <div class="kpi-card highlight-card">
          <span class="k-label">Lider Tablo ({{ leaderTable().name }})</span>
          <div class="k-val text-blue">{{ leaderTable().sizeGiB | number:'1.1-1' }} <span class="unit">GiB</span></div>
          <span class="k-sub">{{ formatRecordCount(leaderTable().records) }} Kayıt • %{{ getSharePercentage(leaderTable().sizeGiB) }} Bellek Payı</span>
        </div>

        <div class="kpi-card" *ngIf="acdocaTable() as acd">
          <span class="k-label">{{ acd.name === 'ACDOCA' ? 'Universal Journal (ACDOCA)' : acd.name }}</span>
          <div class="k-val text-purple">{{ acd.sizeGiB | number:'1.1-1' }} <span class="unit">GiB</span></div>
          <span class="k-sub">{{ formatRecordCount(acd.records) }} Kayıt • %{{ getSharePercentage(acd.sizeGiB) }} Bellek Payı</span>
        </div>

        <div class="kpi-card">
          <span class="k-label">Özel Geliştirme (Z Tabloları)</span>
          <div class="k-val text-amber">{{ customTablesVolume() | number:'1.1-1' }} <span class="unit">GiB</span></div>
          <span class="k-sub">{{ formatRecordCount(customTablesRecords()) }} Kayıt • {{ customTables().length }} Büyük Z Tablosu</span>
        </div>

        <div class="kpi-card">
          <span class="k-label">Potansiyel DVM Tasarrufu</span>
          <div class="k-val text-green">~{{ (totalTableVolume() * 0.38) | number:'1.0-0' }} <span class="unit">GiB</span></div>
          <span class="k-sub">Arşivleme & Log Temizliği ile RAM Kazancı</span>
        </div>
      </div>

      <!-- 3. TOP 5 MEMORY CONSUMERS VISUAL BARS -->
      <div class="card-box">
        <div class="card-header">
          <div class="c-title-group">
            <div class="icon-circle bg-blue">
              <app-icon name="chart" [size]="16" color="#0284c7"></app-icon>
            </div>
            <div>
              <h3>En Çok Bellek Tüketen Tablolar (Top Consumers Distribution)</h3>
              <span class="c-sub">En büyük 5 tablonun {{ totalTableVolume() | number:'1.1-1' }} GiB toplam bellek içerisindeki yüzdesel dağılımı</span>
            </div>
          </div>
          <span class="badge-total-share">Top 5 Payı: %{{ top5SharePercentage() }}</span>
        </div>

        <div class="top-bars-grid">
          @for (top of topConsumers(); track top.name) {
            <div class="top-bar-item">
              <div class="bar-info">
                <div class="tbl-name-group">
                  <strong>{{ top.name }}</strong>
                  <span class="tbl-sub-desc">{{ top.desc }}</span>
                </div>
                <div class="tbl-stat-group">
                  <strong class="stat-gib">{{ top.sizeGiB }} GiB</strong>
                  <span class="stat-pct">({{ top.percentage }}%)</span>
                </div>
              </div>
              <div class="bar-track">
                <div class="bar-fill" [ngClass]="top.colorClass" [style.width.%]="top.percentage"></div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- 4. FILTER & SEARCH CONTROLS -->
      <div class="filter-controls-card">
        <div class="search-box">
          <app-icon name="search" [size]="15" color="#64748b"></app-icon>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Tablo adı veya açıklama ara (Örn: REGUP, ACDOCA, ZACRON, BSEG...)"
            class="search-input" />
          <button *ngIf="searchQuery" class="clear-btn" (click)="searchQuery = ''">✕</button>
        </div>

        <div class="filter-category-pills">
          <button 
            class="cat-pill" 
            [class.active]="selectedCategory() === 'ALL'"
            (click)="selectedCategory.set('ALL')">
            Tümü ({{ allTables().length }})
          </button>
          
          <button 
            class="cat-pill" 
            [class.active]="selectedCategory() === 'FI'"
            (click)="selectedCategory.set('FI')">
            Finans & Muhasebe (FI/CO)
          </button>

          <button 
            class="cat-pill" 
            [class.active]="selectedCategory() === 'CUSTOM'"
            (click)="selectedCategory.set('CUSTOM')">
            Özel Z Tabloları (Z*)
          </button>

          <button 
            class="cat-pill" 
            [class.active]="selectedCategory() === 'BASIS'"
            (click)="selectedCategory.set('BASIS')">
            Sistem & Loglar (BASIS)
          </button>
        </div>
      </div>

      <!-- 5. COMPLETE LARGEST TABLES DATA TABLE (30 TABLES) -->
      <div class="card-box">
        <div class="card-header">
          <div class="c-title-group">
            <div class="icon-circle bg-emerald">
              <app-icon name="database" [size]="16" color="#059669"></app-icon>
            </div>
            <div>
              <h3>Largest Column Loadable Tables (30 Tablo)</h3>
              <span class="c-sub">/SDF/HDB_SIZING raporu bellek boyutu ve kayıt sayısı sıralaması</span>
            </div>
          </div>
          <span class="badge-count">{{ filteredTables().length }} Tablo Listeleniyor</span>
        </div>

        <div class="table-responsive">
          <table class="saas-table largest-table-view">
            <thead>
              <tr>
                <th class="col-rank">#</th>
                <th class="col-name">Tablo Adı (Table Name)</th>
                <th class="col-desc">Modül & Açıklama</th>
                <th class="col-gib text-right">Tahmini Bellek (GiB)</th>
                <th class="col-records text-right">Tahmini Kayıt Sayısı</th>
                <th class="col-share text-center">Bellek Payı</th>
                <th class="col-dvm">DVM / Arşivleme Aksiyonu</th>
              </tr>
            </thead>
            <tbody>
              @for (tbl of filteredTables(); track tbl.name; let idx = $index) {
                <tr [class.highlight-top]="idx < 3" [class.custom-row]="tbl.isCustom">
                  <td class="col-rank">
                    <span class="rank-circle" [class.top-three]="idx < 3">{{ idx + 1 }}</span>
                  </td>
                  
                  <td class="col-name">
                    <div class="name-cell">
                      <strong class="tbl-code">{{ tbl.name }}</strong>
                      <span *ngIf="tbl.isCustom" class="badge-z">Z-Tablosu</span>
                    </div>
                  </td>

                  <td class="col-desc">
                    <div class="desc-cell">
                      <span class="desc-text">{{ tbl.desc }}</span>
                      <span class="mod-tag">{{ tbl.module }}</span>
                    </div>
                  </td>

                  <td class="col-gib text-right">
                    <span class="gib-badge" [class.huge]="tbl.sizeGiB >= 50" [class.med]="tbl.sizeGiB >= 5 && tbl.sizeGiB < 50">
                      {{ tbl.sizeGiB | number:'1.1-1' }} GiB
                    </span>
                  </td>

                  <td class="col-records text-right">
                    <strong class="rec-count">{{ formatRecordCount(tbl.records) }}</strong>
                    <span class="rec-raw">{{ tbl.records | number }}</span>
                  </td>

                  <td class="col-share text-center">
                    <div class="mini-share-bar">
                      <div class="mini-fill" [style.width.%]="getSharePercentage(tbl.sizeGiB)"></div>
                    </div>
                    <span class="share-text">{{ getSharePercentage(tbl.sizeGiB) }}%</span>
                  </td>

                  <td class="col-dvm">
                    <div class="dvm-action-cell">
                      <span class="pot-tag">{{ tbl.archivingPotential }}</span>
                      <span class="rec-text">{{ tbl.recommendation }}</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- 6. DVM ACTION PLAN CARDS (DANIŞMAN ARŞİVLEME YOL HARİTASI) -->
      <div class="card-box dvm-strategy-card">
        <div class="card-header">
          <div class="c-title-group">
            <div class="icon-circle bg-amber">
              <app-icon name="sparkles" [size]="16" color="#d97706"></app-icon>
            </div>
            <div>
              <h3>DVM (Data Volume Management) Danışman Aksiyon Planı</h3>
              <span class="c-sub">HANA In-Memory geçişi öncesinde bellek tasarrufu sağlayacak 4 temel arşivleme adımı</span>
            </div>
          </div>
          <span class="badge-strategy">Tasarruf Odaklı</span>
        </div>

        <div class="strategy-grid">
          @for (action of dvmActionPlan(); track action.num) {
            <div class="strategy-item">
              <div class="st-num">{{ action.num }}</div>
              <div class="st-content">
                <h4>{{ action.title }}</h4>
                <p>{{ action.desc }}</p>
                <span class="st-gain">{{ action.gain }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      </ng-container>

    </div>
  `,
  styles: [`
    .largest-tables-page {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
    }

    /* 1. TOP HEADER */
    .page-top-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;

      .title-area {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;

        .customer-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: #0284c7;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          width: fit-content;
        }

        .page-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
        }
      }

      .header-action-badge {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.45rem 0.85rem;
        font-size: 0.76rem;
        color: #334155;

        strong { color: #0284c7; font-size: 0.84rem; }
      }
    }

    /* 2. KPI SUMMARY GRID */
    .kpi-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1rem 1.15rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

        &.highlight-card {
          border-color: #bae6fd;
          background: #f0f9ff;
        }

        .k-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
        }

        .k-val {
          font-size: 1.65rem;
          font-weight: 900;
          line-height: 1.15;
          margin: 0.1rem 0;

          .unit {
            font-size: 0.95rem;
            font-weight: 700;
          }

          &.text-blue { color: #0284c7; }
          &.text-purple { color: #7e22ce; }
          &.text-amber { color: #d97706; }
          &.text-green { color: #059669; }
        }

        .k-sub {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 500;
        }
      }
    }

    /* 3. CARD BOX */
    .card-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .c-title-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;

          .icon-circle {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;

            &.bg-blue { background: #f0f9ff; border: 1px solid #bae6fd; }
            &.bg-emerald { background: #ecfdf5; border: 1px solid #a7f3d0; }
            &.bg-amber { background: #fffbeb; border: 1px solid #fde68a; }
          }

          h3 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 800;
            color: #0f172a;
          }

          .c-sub {
            font-size: 0.72rem;
            color: #64748b;
          }
        }

        .badge-total-share {
          font-size: 0.68rem;
          font-weight: 800;
          color: #0284c7;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 0.18rem 0.55rem;
          border-radius: 4px;
        }

        .badge-count {
          font-size: 0.68rem;
          font-weight: 700;
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
      }
    }

    /* TOP 5 BARS */
    .top-bars-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .top-bar-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .bar-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.75rem;

          .tbl-name-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            strong { color: #0f172a; font-family: monospace; font-size: 0.82rem; }
            .tbl-sub-desc { color: #64748b; font-size: 0.72rem; }
          }

          .tbl-stat-group {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            .stat-gib { color: #0f172a; font-family: monospace; font-size: 0.8rem; }
            .stat-pct { color: #0284c7; font-weight: 700; font-size: 0.72rem; }
          }
        }

        .bar-track {
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;

          .bar-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;

            &.fill-blue { background: #0284c7; }
            &.fill-purple { background: #8b5cf6; }
            &.fill-amber { background: #f59e0b; }
            &.fill-teal { background: #0d9488; }
            &.fill-slate { background: #64748b; }
          }
        }
      }
    }

    /* 4. FILTER CONTROLS */
    .filter-controls-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;

      .search-box {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 0.35rem 0.65rem;
        width: 380px;

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.76rem;
          color: #0f172a;
          width: 100%;

          &::placeholder { color: #94a3b8; }
        }

        .clear-btn {
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 0.72rem;
          cursor: pointer;
        }
      }

      .filter-category-pills {
        display: flex;
        gap: 0.35rem;

        .cat-pill {
          padding: 0.35rem 0.65rem;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;

          &:hover { color: #0284c7; border-color: #0284c7; }

          &.active {
            background: #0284c7;
            border-color: #0284c7;
            color: #ffffff;
          }
        }
      }
    }

    /* 5. LARGEST TABLES TABLE */
    .table-responsive {
      overflow-x: auto;
    }

    .saas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.76rem;

      thead th {
        background: #f8fafc;
        color: #334155;
        font-weight: 800;
        padding: 0.6rem 0.75rem;
        text-align: left;
        border-bottom: 2px solid #e2e8f0;
        white-space: nowrap;

        &.text-right { text-align: right; }
        &.text-center { text-align: center; }
      }

      tbody tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.1s;

        &:hover { background: #f8fafc; }

        td {
          padding: 0.55rem 0.75rem;
          vertical-align: middle;

          &.text-right { text-align: right; }
          &.text-center { text-align: center; }
        }

        &.highlight-top {
          background: #fafcff;
        }

        &.custom-row {
          background: #fffdfa;
        }
      }
    }

    .largest-table-view {
      .col-rank {
        width: 36px;
        text-align: center;

        .rank-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.65rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;

          &.top-three {
            background: #0284c7;
            color: #ffffff;
          }
        }
      }

      .name-cell {
        display: flex;
        align-items: center;
        gap: 0.4rem;

        .tbl-code {
          font-family: monospace;
          font-size: 0.82rem;
          color: #0f172a;
        }

        .badge-z {
          font-size: 0.6rem;
          font-weight: 800;
          color: #b45309;
          background: #fef3c7;
          border: 1px solid #fde68a;
          padding: 0.08rem 0.35rem;
          border-radius: 3px;
        }
      }

      .desc-cell {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;

        .desc-text { color: #1e293b; font-size: 0.74rem; font-weight: 500; }
        .mod-tag { font-size: 0.64rem; color: #64748b; font-weight: 700; }
      }

      .gib-badge {
        display: inline-block;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
        font-weight: 800;
        font-size: 0.76rem;
        background: #f1f5f9;
        color: #334155;

        &.huge {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        &.med {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }
      }

      .rec-count {
        display: block;
        color: #0f172a;
        font-size: 0.76rem;
      }

      .rec-raw {
        display: block;
        font-size: 0.64rem;
        color: #94a3b8;
        font-family: monospace;
      }

      .mini-share-bar {
        width: 48px;
        height: 5px;
        background: #f1f5f9;
        border-radius: 3px;
        overflow: hidden;
        margin: 0 auto 0.15rem;

        .mini-fill {
          height: 100%;
          background: #0284c7;
          border-radius: 3px;
        }
      }

      .share-text {
        font-size: 0.65rem;
        color: #64748b;
        font-weight: 600;
      }

      .dvm-action-cell {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;

        .pot-tag {
          display: inline-block;
          width: fit-content;
          font-size: 0.62rem;
          font-weight: 800;
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 0.08rem 0.35rem;
          border-radius: 3px;
        }

        .rec-text {
          font-size: 0.7rem;
          color: #475569;
          line-height: 1.3;
        }
      }
    }

    /* 6. DVM STRATEGY SECTION */
    .dvm-strategy-card {
      border-color: #bae6fd;
      background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);

      .badge-strategy {
        font-size: 0.68rem;
        font-weight: 800;
        color: #0369a1;
        background: #e0f2fe;
        border: 1px solid #bae6fd;
        padding: 0.18rem 0.55rem;
        border-radius: 4px;
      }
    }

    .strategy-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;

      .strategy-item {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        gap: 0.75rem;

        .st-num {
          width: 24px;
          height: 24px;
          background: #0284c7;
          color: #ffffff;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .st-content {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;

          h4 {
            margin: 0;
            font-size: 0.82rem;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.3;
          }

          p {
            margin: 0;
            font-size: 0.74rem;
            line-height: 1.4;
            color: #475569;

            code {
              background: #f1f5f9;
              padding: 0.1rem 0.3rem;
              border-radius: 3px;
              font-family: monospace;
              color: #0284c7;
              font-size: 0.7rem;
            }
          }

          .st-gain {
            margin-top: 0.2rem;
            font-size: 0.68rem;
            font-weight: 700;
            color: #059669;
          }
        }
      }
    }

    .uploaded-live-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 1px 4px rgba(5, 150, 105, 0.08);

      .banner-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .live-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
          animation: pulse 2s infinite;
        }

        .banner-text {
          font-size: 0.78rem;
          color: #166534;
        }
      }

      .btn-banner-reset {
        background: #ffffff;
        border: 1px solid #86efac;
        color: #15803d;
        font-weight: 700;
        font-size: 0.72rem;
        padding: 0.3rem 0.65rem;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: #dcfce7;
        }
      }
    }
  `]
})
export class LargestTablesComponent {
  customerService = inject(CustomerService);
  basisService = inject(BasisSizingService);

  searchQuery = '';
  selectedCategory = signal<'ALL' | 'FI' | 'CUSTOM' | 'BASIS'>('ALL');

  allTables = computed(() => this.basisService.largestTables());

  totalTableVolume = computed(() => {
    return this.allTables().reduce((sum, t) => sum + (t.sizeGiB || 0), 0);
  });

  totalRecords = computed(() => {
    return this.allTables().reduce((sum, t) => sum + (t.records || 0), 0);
  });

  leaderTable = computed(() => {
    const list = this.allTables();
    return list[0] || { name: '—', sizeGiB: 0, records: 0 };
  });

  acdocaTable = computed(() => {
    const list = this.allTables();
    return list.find(t => t.name === 'ACDOCA') || list[1] || null;
  });

  customTables = computed(() => {
    return this.allTables().filter(t => t.isCustom);
  });

  customTablesVolume = computed(() => {
    return this.customTables().reduce((sum, t) => sum + (t.sizeGiB || 0), 0);
  });

  customTablesRecords = computed(() => {
    return this.customTables().reduce((sum, t) => sum + (t.records || 0), 0);
  });

  topConsumers = computed(() => {
    const total = this.totalTableVolume() || 1;
    const colors = ['fill-blue', 'fill-purple', 'fill-amber', 'fill-teal', 'fill-slate'];
    return this.allTables().slice(0, 5).map((t, idx) => ({
      name: t.name,
      desc: t.desc,
      sizeGiB: t.sizeGiB,
      percentage: parseFloat(((t.sizeGiB / total) * 100).toFixed(1)),
      colorClass: colors[idx % colors.length]
    }));
  });

  top5SharePercentage = computed(() => {
    return this.topConsumers().reduce((sum, c) => sum + c.percentage, 0).toFixed(1);
  });

  filteredTables = computed(() => {
    let list = this.allTables();
    const cat = this.selectedCategory();
    const query = this.searchQuery.trim().toLowerCase();

    if (cat === 'FI') {
      list = list.filter(t => t.module.startsWith('FI') || t.module.startsWith('CO') || t.module.startsWith('TR'));
    } else if (cat === 'CUSTOM') {
      list = list.filter(t => t.isCustom);
    } else if (cat === 'BASIS') {
      list = list.filter(t => t.module.startsWith('BC') || t.module.startsWith('BASIS'));
    }

    if (query) {
      list = list.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.desc.toLowerCase().includes(query) || 
        t.module.toLowerCase().includes(query)
      );
    }

    return list;
  });

  getSharePercentage(sizeGiB: number): string {
    const total = this.totalTableVolume() || 1;
    return ((sizeGiB / total) * 100).toFixed(1);
  }

  formatRecordCount(records: number): string {
    if (records >= 1000000000) {
      return (records / 1000000000).toFixed(2) + ' Milyar';
    } else if (records >= 1000000) {
      return (records / 1000000).toFixed(1) + ' Milyon';
    }
    return (records || 0).toLocaleString();
  }

  // DVM Action Plan Cards - Dynamically generated from uploaded tables
  dvmActionPlan = computed(() => {
    const list = this.allTables();
    if (!list || list.length === 0) return [];

    const actions = [];

    // Action 1: #1 Leader Table
    const top1 = list[0];
    if (top1) {
      actions.push({
        num: 1,
        title: `${top1.name} Tablosu DVM & Arşivleme`,
        desc: `${this.formatRecordCount(top1.records)} kayıt ile ${top1.sizeGiB.toFixed(1)} GiB (%${this.getSharePercentage(top1.sizeGiB)}) alan kaplayan lider tablo için ${top1.recommendation}.`,
        gain: `Tahmini Kazanç: ~${(top1.sizeGiB * 0.55).toFixed(0)} GiB RAM Tasarrufu`
      });
    }

    // Action 2: FI/CO Financial Tables
    const fiTables = list.filter(t => t.module.startsWith('FI') || t.module.startsWith('CO') || t.module.startsWith('TR'));
    if (fiTables.length > 0) {
      const topFi = fiTables.slice(0, 2);
      const fiVol = fiTables.reduce((sum, t) => sum + t.sizeGiB, 0);
      const names = topFi.map(t => t.name).join(' & ');
      actions.push({
        num: 2,
        title: `${names} Finansal & Maliyet Arşivlemesi`,
        desc: `Toplam ${fiVol.toFixed(1)} GiB alan kaplayan ${fiTables.length} finans/maliyet tablosunda yasal saklama süreleri dolmuş eski mali yıllar için FI_DOCUMNT / ML_DOCUMNT arşivlemesi uygulanmalıdır.`,
        gain: `Tahmini Kazanç: ~${(fiVol * 0.45).toFixed(0)} GiB RAM Tasarrufu`
      });
    }

    // Action 3: Custom Z Tables OR Logistics/Production (PP/MM)
    const zTables = list.filter(t => t.isCustom);
    if (zTables.length > 0) {
      const zVol = zTables.reduce((sum, t) => sum + t.sizeGiB, 0);
      const zNames = zTables.slice(0, 2).map(t => t.name).join(' / ');
      actions.push({
        num: 3,
        title: `Özel Z Tabloları Housekeeping (${zNames})`,
        desc: `${zTables.length} adet özel Z tablosunda toplam ${zVol.toFixed(1)} GiB veri bulunmaktadır. Tamamlanan entegrasyonlar ve ara log kayıtları için Housekeeping Job yazılmalıdır.`,
        gain: `Tahmini Kazanç: ~${(zVol * 0.65).toFixed(0)} GiB RAM Tasarrufu`
      });
    } else {
      const mmppTables = list.filter(t => t.module.startsWith('MM') || t.module.startsWith('PP') || t.module.startsWith('SD'));
      const mmVol = mmppTables.reduce((sum, t) => sum + t.sizeGiB, 0);
      const mmNames = mmppTables.slice(0, 2).map(t => t.name).join(' & ');
      actions.push({
        num: 3,
        title: `Lojistik & Üretim Planlama Temizliği (${mmNames || 'MM/PP'})`,
        desc: `Toplam ${mmVol.toFixed(1)} GiB büyüklüğündeki üretim ve malzeme tabloları için periyodik DVM housekeeping ve malzeme belgesi arşivlemesi uygulanmalıdır.`,
        gain: `Tahmini Kazanç: ~${(mmVol * 0.40).toFixed(0)} GiB RAM Tasarrufu`
      });
    }

    // Action 4: BASIS / Technical Log Cleanup
    const basisTables = list.filter(t => t.module.startsWith('BC') || t.module.startsWith('BASIS'));
    if (basisTables.length > 0) {
      const bVol = basisTables.reduce((sum, t) => sum + t.sizeGiB, 0);
      const bNames = basisTables.slice(0, 2).map(t => t.name).join(' / ');
      actions.push({
        num: 4,
        title: `${bNames} Değişiklik ve Sistem Log Temizliği`,
        desc: `Sistem denetim ve teknik log tabloları (${bVol.toFixed(1)} GiB) için SAP standart temizlik job'ları (RSCDTCLR, SBAL_DELETE vb.) çalıştırılmalıdır.`,
        gain: `Tahmini Kazanç: ~${(bVol * 0.70).toFixed(0)} GiB RAM Tasarrufu`
      });
    }

    return actions;
  });
}
