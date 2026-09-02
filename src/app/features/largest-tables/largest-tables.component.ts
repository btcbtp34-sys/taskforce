import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
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
          <span>Toplam En Büyük Tablo Hacmi: <strong>630.8 GiB</strong> (13.4 Milyar Kayıt)</span>
        </div>
      </div>

      <!-- 2. EXECUTIVE KPI CARDS (DVM & SIZING POTENTIAL) -->
      <div class="kpi-summary-grid">
        <div class="kpi-card highlight-card">
          <span class="k-label">Lider Tablo (REGUP)</span>
          <div class="k-val text-blue">308.6 <span class="unit">GiB</span></div>
          <span class="k-sub">7.14 Milyar Kayıt • %48.9 Bellek Payı</span>
        </div>

        <div class="kpi-card">
          <span class="k-label">Universal Journal (ACDOCA)</span>
          <div class="k-val text-purple">168.1 <span class="unit">GiB</span></div>
          <span class="k-sub">2.81 Milyar Kayıt • %26.7 Bellek Payı</span>
        </div>

        <div class="kpi-card">
          <span class="k-label">Özel Geliştirme (Z Tabloları)</span>
          <div class="k-val text-amber">64.3 <span class="unit">GiB</span></div>
          <span class="k-sub">1.33 Milyar Kayıt • 6 Büyük Z Tablosu</span>
        </div>

        <div class="kpi-card">
          <span class="k-label">Potansiyel DVM Tasarrufu</span>
          <div class="k-val text-green">~240 <span class="unit">GiB</span></div>
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
              <span class="c-sub">En büyük 5 tablonun 630.8 GiB toplam bellek içerisindeki yüzdesel dağılımı</span>
            </div>
          </div>
          <span class="badge-total-share">Top 5 Payı: %92.7</span>
        </div>

        <div class="top-bars-grid">
          @for (top of topConsumers; track top.name) {
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
            Tümü ({{ allTables.length }})
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
          <div class="strategy-item">
            <div class="st-num">1</div>
            <div class="st-content">
              <h4>REGUP / REGUH Ödeme Tabloları Arşivlemesi</h4>
              <p>7.14 milyar kayıt ile <strong>308.6 GiB (%48.9)</strong> alan kaplayan ödeme tabloları için SAP standart <code>FI_PAYDATA</code> nesnesi ile geçmiş dönemler arşivlenmelidir.</p>
              <span class="st-gain">Tahmini Kazanç: ~200 GiB RAM Tasarrufu</span>
            </div>
          </div>

          <div class="strategy-item">
            <div class="st-num">2</div>
            <div class="st-content">
              <h4>ACDOCA & BSEG Finansal Belge Arşivlemesi</h4>
              <p>Universal Journal (168.1 GiB) ve BSEG (35.0 GiB) üzerinde yasal saklama süreleri dolmuş eski mali yıllar için <code>FI_DOCUMNT</code> arşivlemesi uygulanmalıdır.</p>
              <span class="st-gain">Tahmini Kazanç: ~60 GiB RAM Tasarrufu</span>
            </div>
          </div>

          <div class="strategy-item">
            <div class="st-num">3</div>
            <div class="st-content">
              <h4>Özel Z Tabloları Housekeeping (ZACRON / ZFIT)</h4>
              <p>1.16 milyar kayıtlı <code>ZACRON_EI_T_206</code> (57.9 GiB) ve 103 milyon kayıtlı <code>ZFIT_B_LOG</code> için otomatik periyodik log temizleme job'ları yazılmalıdır.</p>
              <span class="st-gain">Tahmini Kazanç: ~45 GiB RAM Tasarrufu</span>
            </div>
          </div>

          <div class="strategy-item">
            <div class="st-num">4</div>
            <div class="st-content">
              <h4>CDPOS / BALDAT Değişiklik ve Log Temizliği</h4>
              <p>Teknik değişiklik kalemleri (<code>CDPOS</code> - 15 GiB) ve uygulama logları (<code>BALDAT</code> - 3.2 GiB) için <code>RSCDTCLR</code> ve <code>SBAL_DELETE</code> job'ları çalıştırılmalıdır.</p>
              <span class="st-gain">Tahmini Kazanç: ~15 GiB RAM Tasarrufu</span>
            </div>
          </div>
        </div>
      </div>

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
  `]
})
export class LargestTablesComponent {
  customerService = inject(CustomerService);

  searchQuery = '';
  selectedCategory = signal<'ALL' | 'FI' | 'CUSTOM' | 'BASIS'>('ALL');

  // SCREENSHOT DATA: 30 LARGEST COLUMN LOADABLE TABLES
  allTables: LargestTableItem[] = [
    { name: 'REGUP', sizeGiB: 308.6, records: 7141689711, desc: 'Ödeme Programı İşlem Kalemleri', module: 'FI-AP/AR', isCustom: false, recommendation: 'FI_PAYDATA Arşivleme Nesnesi ile eski ödeme çalıştırmaları temizlenmeli', archivingPotential: '%65 Arşivleme' },
    { name: 'ACDOCA', sizeGiB: 168.1, records: 2807910194, desc: 'Universal Journal (Evrensel Muhasebe Defteri)', module: 'FI/CO', isCustom: false, recommendation: 'Geçmiş mali yıllar için FI_DOCUMNT arşivlemesi uygulanmalı', archivingPotential: '%40 Arşivleme' },
    { name: 'ZACRON_EI_T_206', sizeGiB: 57.9, records: 1165794101, desc: 'Özel Z E-İrsaliye Entegrasyon Tablosu', module: 'Z-Custom', isCustom: true, recommendation: 'Başarılı tamamlanan entegrasyon logları için Housekeeping Job yazılmalı', archivingPotential: '%70 Temizleme' },
    { name: 'BSEG', sizeGiB: 35.0, records: 524124859, desc: 'Muhasebe Belge Kalemleri', module: 'FI', isCustom: false, recommendation: 'Eski mali dönemler FI_DOCUMNT arşivlemesine dahil edilmeli', archivingPotential: '%50 Arşivleme' },
    { name: 'CDPOS', sizeGiB: 15.0, records: 390844903, desc: 'Değişiklik Belgeleri Kalem', module: 'BASIS', isCustom: false, recommendation: 'CHANGELOG silme/arşivleme job (RSCDTCLR) çalıştırılmalı', archivingPotential: '%60 Temizleme' },
    { name: 'BKPF', sizeGiB: 11.3, records: 153413836, desc: 'Muhasebe Belge Başlıkları', module: 'FI', isCustom: false, recommendation: 'BSEG ile ilişkili olarak FI_DOCUMNT nesnesiyle arşivlenmeli', archivingPotential: '%50 Arşivleme' },
    { name: 'FAGL_SPLINFO_VAL', sizeGiB: 7.3, records: 368075627, desc: 'Belge Bölme Değer Bilgileri', module: 'FI-GL', isCustom: false, recommendation: 'Yeni Defteri Kebir belge bölme geçmişi arşivlenmeli', archivingPotential: '%45 Arşivleme' },
    { name: 'FAGL_SPLINFO', sizeGiB: 5.7, records: 183903851, desc: 'Belge Bölme Başlık Bilgileri', module: 'FI-GL', isCustom: false, recommendation: 'Yeni Defteri Kebir belge bölme geçmişi arşivlenmeli', archivingPotential: '%45 Arşivleme' },
    { name: 'REGUH', sizeGiB: 4.2, records: 64622323, desc: 'Ödeme Programı Ödeme Başlıkları', module: 'FI-AP/AR', isCustom: false, recommendation: 'REGUP ile eş zamanlı FI_PAYDATA ile arşivlenmeli', archivingPotential: '%65 Arşivleme' },
    { name: 'BALDAT', sizeGiB: 3.2, records: 10049442, desc: 'Uygulama Log Verileri (Application Log)', module: 'BASIS', isCustom: false, recommendation: 'SBP log temizleme job (BC_SBAL / SBAL_DELETE) çalıştırılmalı', archivingPotential: '%80 Temizleme' },
    { name: 'ZACRON_EI_T_205', sizeGiB: 2.9, records: 47969039, desc: 'Özel Z E-Fatura Hareket Tablosu', module: 'Z-Custom', isCustom: true, recommendation: '3 yıldan eski e-fatura log kayıtları temizlenmeli', archivingPotential: '%60 Temizleme' },
    { name: 'GLPCA', sizeGiB: 2.9, records: 47693923, desc: 'Kar Merkezi Muhasebesi Fiili Kalemleri', module: 'CO-PCA', isCustom: false, recommendation: 'PCA_OBJECT nesnesiyle arşivleme uygulanmalı', archivingPotential: '%40 Arşivleme' },
    { name: 'FLQITEMFI', sizeGiB: 2.9, records: 39379211, desc: 'Likidite Tahmin Kalemleri', module: 'TR-CM', isCustom: false, recommendation: 'Eski nakit akış geçmişi temizleme programı çalıştırılmalı', archivingPotential: '%50 Temizleme' },
    { name: 'FMIFIIT', sizeGiB: 2.4, records: 45988903, desc: 'Fon Yönetimi Fiili Kalemleri', module: 'PSM-FM', isCustom: false, recommendation: 'FM_ACT_DOC nesnesiyle eski bütçe kayıtları arşivlenmeli', archivingPotential: '%40 Arşivleme' },
    { name: 'SOC3', sizeGiB: 2.4, records: 7038512, desc: 'SAPoffice Doküman Nesneleri', module: 'BC-SRV-COM', isCustom: false, recommendation: 'RSBCS_REORG ile eski e-posta ve ekler temizlenmeli', archivingPotential: '%70 Temizleme' },
    { name: 'COEP', sizeGiB: 2.0, records: 42268453, desc: 'Maliyet Muhasebesi Fiili Kalemleri', module: 'CO-OM', isCustom: false, recommendation: 'CO_ITEM nesnesi ile arşivleme uygulanmalı', archivingPotential: '%40 Arşivleme' },
    { name: 'D010TAB', sizeGiB: 1.9, records: 41445911, desc: 'ABAP Program Tablo Çapraz Referansı', module: 'BC-ABA', isCustom: false, recommendation: 'HANA In-Memory dönüşümünde otomatik yeniden derlenir', archivingPotential: '%30 Sıkıştırma' },
    { name: 'ZFIT_B_LOG', sizeGiB: 1.6, records: 103013214, desc: 'Özel Finans Banka Entegrasyon Logu', module: 'Z-Custom', isCustom: true, recommendation: 'Eski banka iletişim logları 60 günden sonraya göre silinmeli', archivingPotential: '%85 Temizleme' },
    { name: 'DOKTL', sizeGiB: 1.3, records: 26995508, desc: 'Dokümantasyon Metin Satırları', module: 'BC-DOC', isCustom: false, recommendation: 'Kullanılmayan diller ve eski versiyon metinleri elenmeli', archivingPotential: '%30 Sıkıştırma' },
    { name: 'REPOSRC', sizeGiB: 1.1, records: 4077405, desc: 'ABAP Rapor Kaynak Kodları', module: 'BC-ABA', isCustom: false, recommendation: 'Geçersiz Z programları ve eski sürümler temizlenmeli', archivingPotential: '%25 Temizleme' },
    { name: 'RF048', sizeGiB: 1.0, records: 64538301, desc: 'Ödeme Talepleri ve Geçici Kayıtlar', module: 'FI-AP', isCustom: false, recommendation: 'Tamamlanmış ödeme talepleri tasfiye edilmeli', archivingPotential: '%75 Temizleme' },
    { name: 'D010INC', sizeGiB: 0.9, records: 15879035, desc: 'ABAP Include Program Referansları', module: 'BC-ABA', isCustom: false, recommendation: 'Sistem derleme önbelleği optimizasyonu', archivingPotential: '%20 Sıkıştırma' },
    { name: 'ZACR_OB_HAREKETL', sizeGiB: 0.9, records: 7333055, desc: 'Özel Z Ortak Banka Hareket Tablosu', module: 'Z-Custom', isCustom: true, recommendation: 'Eski hareketler periyodik arşive aktarılmalı', archivingPotential: '%60 Arşivleme' },
    { name: 'COBK', sizeGiB: 0.7, records: 11100770, desc: 'Maliyet Muhasebesi Belge Başlıkları', module: 'CO-OM', isCustom: false, recommendation: 'CO_ITEM ile senkron arşivlenmeli', archivingPotential: '%40 Arşivleme' },
    { name: 'BSIP', sizeGiB: 0.7, records: 9154188, desc: 'Satıcı Çift Fatura Kontrol İndeksi', module: 'FI-AP', isCustom: false, recommendation: 'Ödenmiş eski faturaların indeks kayıtları temizlenmeli', archivingPotential: '%50 Temizleme' },
    { name: 'DD03L', sizeGiB: 0.6, records: 7753940, desc: 'Data Dictionary Tablo Alanları', module: 'BC-DWB', isCustom: false, recommendation: 'HANA sütun bazlı sıkıştırma uygulanır', archivingPotential: '%25 Sıkıştırma' },
    { name: 'BKORM', sizeGiB: 0.5, records: 8514714, desc: 'Muhasebe Yazışma Talepleri', module: 'FI', isCustom: false, recommendation: 'Gönderilmiş eski yazışmalar silinmeli', archivingPotential: '%80 Temizleme' },
    { name: 'ZACRON_EI_T_201', sizeGiB: 0.5, records: 6202786, desc: 'Özel Z E-İrsaliye Başlık Tablosu', module: 'Z-Custom', isCustom: true, recommendation: 'T_206 ile birlikte eski dönemler arşivlenmeli', archivingPotential: '%70 Temizleme' },
    { name: 'ZFIT_OD_LOG', sizeGiB: 0.5, records: 5629458, desc: 'Özel Otomatik Ödeme Logu', module: 'Z-Custom', isCustom: true, recommendation: 'Eski ödeme işlem logları silinmeli', archivingPotential: '%80 Temizleme' },
    { name: 'ZENT_T_AKIBET', sizeGiB: 0.5, records: 5609500, desc: 'Özel Entegrasyon Akıbet Takip Tablosu', module: 'Z-Custom', isCustom: true, recommendation: 'Statüsü kapanmış entegrasyonlar tasfiye edilmeli', archivingPotential: '%85 Temizleme' }
  ];

  topConsumers = [
    { name: 'REGUP', desc: 'Ödeme İşlem Kalemleri', sizeGiB: 308.6, percentage: 48.9, colorClass: 'fill-blue' },
    { name: 'ACDOCA', desc: 'Universal Journal Defteri', sizeGiB: 168.1, percentage: 26.7, colorClass: 'fill-purple' },
    { name: 'ZACRON_EI_T_206', desc: 'Özel E-İrsaliye Tablosu', sizeGiB: 57.9, percentage: 9.2, colorClass: 'fill-amber' },
    { name: 'BSEG', desc: 'Muhasebe Belge Kalemleri', sizeGiB: 35.0, percentage: 5.5, colorClass: 'fill-teal' },
    { name: 'CDPOS', desc: 'Değişiklik Belgeleri Kalem', sizeGiB: 15.0, percentage: 2.4, colorClass: 'fill-slate' }
  ];

  filteredTables = computed(() => {
    let list = this.allTables;
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
    const total = 630.8;
    return ((sizeGiB / total) * 100).toFixed(1);
  }

  formatRecordCount(records: number): string {
    if (records >= 1000000000) {
      return (records / 1000000000).toFixed(2) + ' Milyar';
    } else if (records >= 1000000) {
      return (records / 1000000).toFixed(1) + ' Milyon';
    }
    return records.toLocaleString();
  }
}
