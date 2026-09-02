import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-source-sizing',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="source-page">
      
      <!-- 1. PAGE HEADER -->
      <div class="page-top-header">
        <div class="title-area">
          <div class="customer-tag">
            <app-icon name="customers" [size]="13" color="#0284c7"></app-icon>
            <span>{{ customerService.activeCustomer().name }}</span>
          </div>
          <h1 class="page-title">Source (Current / Target) Altyapı & Boyutlandırma</h1>
          <p class="page-subtitle">SAP HANA Cockpit sistem durumu, /SDF/HDB_SIZING raporu ve Hedef S/4HANA boyutlandırma matrisi</p>
        </div>

        <!-- Cockpit Quick Status Pills -->
        <div class="cockpit-status-bar">
          <div class="status-pill green">
            <span class="pulse-dot"></span>
            <span>All Services Started</span>
          </div>
          <div class="status-pill blue">
            <app-icon name="database" [size]="13" color="#0284c7"></app-icon>
            <span>SID: SEP (Production)</span>
          </div>
          <div class="status-pill amber">
            <app-icon name="alert" [size]="13" color="#d97706"></app-icon>
            <span>3 Low Alerts</span>
          </div>
        </div>
      </div>

      <!-- 2. GÖRSEL 3: PRODUCT / CURRENT ➔ TARGET SIZING MATRİSİ -->
      <div class="card-box highlight-card">
        <div class="card-header">
          <div class="c-title-group">
            <div class="icon-circle bg-blue">
              <app-icon name="layers" [size]="16" color="#0284c7"></app-icon>
            </div>
            <div>
              <h3>S/4HANA Boyutlandırma & Hedef Bulut Kapasite Matrisi</h3>
              <span class="c-sub">Mevcut on-premise HANA ve uygulama sunucularının RISE with SAP hedef mimarisine eşlenmesi</span>
            </div>
          </div>
          <span class="badge-target-spec">RISE Sizing Spec</span>
        </div>

        <div class="table-responsive">
          <table class="saas-table sizing-matrix-table">
            <thead>
              <tr>
                <th class="col-product">Bileşen / Ürün (Product)</th>
                <th class="col-current text-center">Mevcut Kapasite (Current)</th>
                <th class="col-target text-center">Hedef Bulut Mimarisi (Target)</th>
                <th>Avantaj & Açıklama</th>
              </tr>
            </thead>
            <tbody>
              @for (row of sizingMatrix; track row.product) {
                <tr [class.db-row]="row.isDb">
                  <td class="product-cell">
                    <span class="p-dot" [class.db]="row.isDb" [class.app]="!row.isDb"></span>
                    <strong>{{ row.product }}</strong>
                  </td>
                  <td class="text-center">
                    <span class="spec-badge cur">{{ row.current }}</span>
                  </td>
                  <td class="text-center">
                    <span class="spec-badge target">{{ row.target }}</span>
                  </td>
                  <td class="text-muted">{{ row.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="matrix-footer-summary">
          <div class="summary-item">
            <span class="s-label">Toplam Mevcut HANA RAM:</span>
            <strong class="s-val text-blue">2.02 TB</strong>
          </div>
          <div class="summary-item">
            <span class="s-label">Toplam Uygulama RAM:</span>
            <strong class="s-val text-blue">192 GB (2x64GB + 32GB + 32GB)</strong>
          </div>
          <div class="summary-item">
            <span class="s-label">Hedef Konsolidasyon:</span>
            <strong class="s-val text-emerald">1 Konsolide Private Cloud DB</strong>
          </div>
        </div>
      </div>

      <!-- 3. DANIŞMAN ALTYAPI & BOYUTLANDIRMA ÖNERİLERİ -->
      <div class="card-box recommendations-card">
        <div class="card-header">
          <div class="c-title-group">
            <div class="icon-circle bg-amber">
              <app-icon name="sparkles" [size]="16" color="#d97706"></app-icon>
            </div>
            <div>
              <h3>Danışman Altyapı & Boyutlandırma Önerileri</h3>
              <span class="c-sub">HANA Cockpit ve /SDF/HDB_SIZING analiz sonuçlarına göre teknik aksiyon ve tasarruf tavsiyeleri</span>
            </div>
          </div>
          <span class="badge-recom-count">4 Teknik Tavsiye</span>
        </div>

        <div class="recommendations-grid">
          
          <!-- Öneri 1: RAM & Sizing Optimizasyonu -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-blue-light text-blue">RAM & Boyutlandırma</span>
              <span class="recom-impact text-amber">Kritik Öncelik</span>
            </div>
            <h4 class="recom-title">Canlı RAM Doluluğu (%91.1) ve DVM Temizliği</h4>
            <p class="recom-text">
              Canlı üretim veritabanında bellek kullanımı <strong>801.23 GB / 878.91 GB (%91.1)</strong> seviyesindedir. Sizing raporunda öngörülen 1,405 GiB başlangıç ihtiyacı, DVM ve veri arşivleme ile <strong>1,311 GiB</strong> seviyesine çekilmeli ve <strong>1 TB Private Cloud</strong> paketinde güvenle çalışması sağlanmalıdır.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: 1 TB bulut paketi sınırlarında kalma, ek bellek lisans maliyetinden kaçınma</span>
            </div>
          </div>

          <!-- Öneri 2: Disk Alanı & Arşivleme Tasarrufu -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-emerald-light text-emerald">Disk & Arşivleme</span>
              <span class="recom-impact text-emerald">336 GiB Tasarruf</span>
            </div>
            <h4 class="recom-title">336 GiB Disk Alanı Optimizasyonu</h4>
            <p class="recom-text">
              Sizing raporuna göre optimizasyon ile disk veri hacmi <strong>1,139 GiB'den 803 GiB'ye (%29.5 tasarruf)</strong> düşürülebilmektedir. Geçiş öncesi CDPOS, CDHDR ve EDI40 teknik log tabloları temizlenmeli, eski muhasebe kayıtları (BKPF/BSEG) arşivlenmelidir.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Geçiş (Downtime) süresinde %30 hızlanma ve disk depolama maliyeti düşüşü</span>
            </div>
          </div>

          <!-- Öneri 3: CPU & SAPS Kapasitesi -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-purple-light text-purple">İşlemci & SAPS</span>
              <span class="recom-impact text-blue">Standart Compute</span>
            </div>
            <h4 class="recom-title">SAPS "XS" Seviyesi & Standart İşlemci</h4>
            <p class="recom-text">
              Sizing raporunda SAPS kategorisi <strong>"XS" (Extra Small)</strong> olarak ölçülmüş, canlı CPU kullanımı ise <strong>%35</strong> seviyesinde kalmıştır. RISE with SAP bulut paketinde standart compute tier yeterli olup ek işlemci kapasitesi satın alımına gerek yoktur.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Optimum bulut bütçesi, gereksiz compute kapasitesi maliyetinden kaçınma</span>
            </div>
          </div>

          <!-- Öneri 4: 11 Sunucu Konsolidasyonu & EoS Tasfiyesi -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-amber-light text-amber">Bulut Konsolidasyonu</span>
              <span class="recom-impact text-emerald">0 EoS Riski</span>
            </div>
            <h4 class="recom-title">11 Dağınık Sunucudan Tek Bulut DB'ye Geçiş</h4>
            <p class="recom-text">
              Mevcut 11 sunuculu yapı yerine <strong>1 Konsolide S/4HANA Private Cloud DB</strong> yapısına geçilmelidir. Destek süresi dolan (EoS 2020) Fiori 1511 ve CS 6.5 MaxDB sunucuları kapatılarak doğrudan Embedded Fiori ve BTP Storage kullanılmalıdır.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Yıllık €140.000 net altyapı & bakım tasarrufu ve %100 SAP bulut güvencesi</span>
            </div>
          </div>

        </div>
      </div>

      <!-- 4. TWO-COLUMN LAYOUT: (GÖRSEL 1: HANA COCKPIT CANLI DURUMU) & (GÖRSEL 2: /SDF/HDB_SIZING SİSTEM RAPORU) -->
      <div class="two-col-grid">
        
        <!-- GÖRSEL 1: SAP HANA DATABASE & HOST COCKPIT -->
        <div class="card-box">
          <div class="card-header">
            <div class="c-title-group">
              <div class="icon-circle bg-emerald">
                <app-icon name="database" [size]="16" color="#059669"></app-icon>
              </div>
              <div>
                <h3>SAP HANA Database & Host Cockpit</h3>
                <span class="c-sub">Host: sgvprdhana01 • Canlı Veritabanı ve Donanım Metrikleri</span>
              </div>
            </div>
            <span class="source-tag">HANA Cockpit Live</span>
          </div>

          <!-- System General Meta Grid -->
          <div class="hana-general-meta">
            <div class="meta-row">
              <span class="m-lbl">Operational State:</span>
              <strong class="m-val text-green">All services are started (In Sync)</strong>
            </div>
            <div class="meta-row">
              <span class="m-lbl">System Usage / ID:</span>
              <strong class="m-val">Production System (SystemID = SEP)</strong>
            </div>
            <div class="meta-row">
              <span class="m-lbl">HANA Version / Build:</span>
              <strong class="m-val">2.00.079.08 (fa/hana2sp07) • 2025-12-22</strong>
            </div>
            <div class="meta-row">
              <span class="m-lbl">Platform / OS:</span>
              <strong class="m-val">SUSE Linux Enterprise Server 15 SP7 (VMware)</strong>
            </div>
          </div>

          <!-- Progress Bars & Usage Metrics -->
          <div class="usage-gauges-list">
            <h4 class="section-sub-title">Database Memory & CPU Usage</h4>

            <!-- Memory Used -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Memory Used / Allocation Limit</span>
                <strong class="g-val">801.23 GB / 878.91 GB <span class="pct">(91.1%)</span></strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar amber" style="width: 91.1%"></div>
              </div>
            </div>

            <!-- CPU Usage -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">CPU Usage (32 Available CPUs)</span>
                <strong class="g-val">32 CPUs <span class="pct">(35.0%)</span></strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar blue" style="width: 35%"></div>
              </div>
            </div>

            <h4 class="section-sub-title mt-3">Database Disk Usage (Host: sgvprdhana01)</h4>

            <!-- Data Volume Size -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Data Volume Size / Disk Size</span>
                <strong class="g-val">1,391.63 GB / 1,740.30 GB <span class="pct">(79.9%)</span></strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar blue" style="width: 79.9%"></div>
              </div>
            </div>

            <!-- Log Volume Size -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Log Volume Size / Disk Size</span>
                <strong class="g-val">271.58 GB / 399.87 GB <span class="pct">(67.9%)</span></strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar teal" style="width: 67.9%"></div>
              </div>
            </div>

            <!-- Trace Files -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Trace Files / Disk Size</span>
                <strong class="g-val">1.32 GB / 511.75 GB <span class="pct">(0.3%)</span></strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar green" style="width: 1%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- GÖRSEL 2: /SDF/HDB_SIZING RAPORU DETAYLARI -->
        <div class="card-box">
          <div class="card-header">
            <div class="c-title-group">
              <div class="icon-circle bg-purple">
                <app-icon name="cpu" [size]="16" color="#7e22ce"></app-icon>
              </div>
              <div>
                <h3>/SDF/HDB_SIZING Sizing Raporu (GiB)</h3>
                <span class="c-sub">S/4HANA Geçişi İçin Öngörülen Maksimum Bellek ve Disk Gereksinimleri</span>
              </div>
            </div>
            <span class="source-tag">Rapor Sürümü: 99</span>
          </div>

          <!-- Key Sizing Numbers Highlight Grid -->
          <div class="sizing-kpi-grid">
            <div class="s-kpi-card">
              <span class="sk-lbl">Initial Memory Requirement</span>
              <strong class="sk-val text-blue">1,405.8 GiB</strong>
              <span class="sk-sub">Maksimum Başlangıç RAM</span>
            </div>

            <div class="s-kpi-card">
              <span class="sk-lbl">Memory After Optimization</span>
              <strong class="sk-val text-emerald">1,311.0 GiB</strong>
              <span class="sk-sub">Optimizasyon Sonrası RAM</span>
            </div>

            <div class="s-kpi-card">
              <span class="sk-lbl">Net Data Volume (Disk)</span>
              <strong class="sk-val text-purple">1,139.0 GiB</strong>
              <span class="sk-sub">Disk Net Veri Hacmi</span>
            </div>

            <div class="s-kpi-card">
              <span class="sk-lbl">Disk After Optimization</span>
              <strong class="sk-val text-teal">803.0 GiB</strong>
              <span class="sk-sub">336 GiB Disk Tasarrufu</span>
            </div>
          </div>

          <!-- Memory Sizing Calculation Tree Table -->
          <div class="sizing-calc-tree">
            <h4 class="section-sub-title">Memory Sizing Calculation Details (HANA Size in GiB)</h4>

            <div class="calc-tree-list">
              <div class="tree-row">
                <span class="t-name">Column loadable data (Row Store dönüşümü: 4.4 GiB)</span>
                <strong class="t-val">658.6 GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Row Store data (Column Store çıkarılan: 13.6 GiB)</span>
                <strong class="t-val">2.5 GiB</strong>
              </div>
              <div class="tree-row subtotal">
                <span class="t-name">= Memory requirement for initial loadable data</span>
                <strong class="t-val">661.2 GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Hybrid LOB cache (10% of size on disk)</span>
                <strong class="t-val">34.7 GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Work space (100% Column + 50% Row Store)</span>
                <strong class="t-val">659.9 GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Fixed size for code, stack and other services</span>
                <strong class="t-val">50.0 GiB</strong>
              </div>
              <div class="tree-row grand-total">
                <span class="t-name"><strong>= Anticipated initial memory requirement</strong></span>
                <strong class="t-val text-blue font-bold">1,405.8 GiB</strong>
              </div>
            </div>
          </div>

          <!-- Technical Metadata Footer -->
          <div class="report-meta-footer">
            <span>SAPS Kategorisi: <strong>XS</strong></span>
            <span>Analiz Edilen Tablo: <strong>92,134</strong> (Hata: 0)</span>
            <span>Kernel: <strong>753_REL (NW 740 SP12)</strong></span>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .source-page {
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

      .cockpit-status-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;

        .status-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.65rem;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;

          &.green {
            background: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;

            .pulse-dot {
              width: 6px;
              height: 6px;
              background: #10b981;
              border-radius: 50%;
              box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
            }
          }

          &.blue {
            background: #f0f9ff;
            color: #0284c7;
            border: 1px solid #bae6fd;
          }

          &.amber {
            background: #fffbeb;
            color: #d97706;
            border: 1px solid #fde68a;
          }
        }
      }
    }

    /* 2. CARD BOX */
    .card-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      &.highlight-card {
        border-color: #cbd5e1;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      }

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
            &.bg-purple { background: #fdf4ff; border: 1px solid #f5d0fe; }
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

        .badge-target-spec {
          font-size: 0.68rem;
          font-weight: 800;
          color: #0284c7;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 0.18rem 0.55rem;
          border-radius: 4px;
        }

        .source-tag {
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

    /* 3. TABLE STYLES */
    .table-responsive {
      overflow-x: auto;
    }

    .saas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;

      thead th {
        background: #f8fafc;
        color: #334155;
        font-weight: 800;
        padding: 0.6rem 0.85rem;
        text-align: left;
        border-bottom: 2px solid #e2e8f0;

        &.text-center { text-align: center; }
      }

      tbody tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.1s;

        &:hover { background: #f8fafc; }

        td {
          padding: 0.55rem 0.85rem;
          vertical-align: middle;

          &.text-center { text-align: center; }
          &.text-muted { color: #64748b; font-size: 0.74rem; }
        }

        &.db-row {
          background: #fafcff;
        }
      }
    }

    .sizing-matrix-table {
      .product-cell {
        display: flex;
        align-items: center;
        gap: 0.45rem;

        .p-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          &.db { background: #0284c7; }
          &.app { background: #8b5cf6; }
        }

        strong {
          color: #0f172a;
          font-size: 0.82rem;
        }
      }

      .spec-badge {
        display: inline-block;
        padding: 0.15rem 0.55rem;
        border-radius: 4px;
        font-weight: 800;
        font-size: 0.75rem;

        &.cur {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }

        &.target {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }
      }
    }

    .matrix-footer-summary {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;

      .summary-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;

        .s-label { color: #64748b; font-weight: 500; }
        .s-val { font-weight: 800; }
        .text-blue { color: #0284c7; }
        .text-emerald { color: #059669; }
      }
    }

    /* 4. RECOMMENDATIONS SECTION STYLING */
    .recommendations-card {
      border-color: #fde68a;
      background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);

      .badge-recom-count {
        font-size: 0.68rem;
        font-weight: 800;
        color: #b45309;
        background: #fef3c7;
        border: 1px solid #fde68a;
        padding: 0.18rem 0.55rem;
        border-radius: 4px;
      }
    }

    .recommendations-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .recom-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      transition: box-shadow 0.15s, border-color 0.15s;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
      }

      .recom-top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .recom-category {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.12rem 0.45rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;

          &.bg-blue-light { background: #f0f9ff; }
          &.bg-emerald-light { background: #ecfdf5; }
          &.bg-purple-light { background: #fdf4ff; }
          &.bg-amber-light { background: #fffbeb; }
        }

        .recom-impact {
          font-size: 0.68rem;
          font-weight: 800;
        }
      }

      .recom-title {
        margin: 0;
        font-size: 0.88rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.25;
      }

      .recom-text {
        margin: 0;
        font-size: 0.78rem;
        line-height: 1.45;
        color: #334155;

        strong {
          color: #0f172a;
        }
      }

      .recom-benefit {
        margin-top: 0.2rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.35rem 0.55rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.72rem;
        color: #047857;
        font-weight: 600;
      }
    }

    /* 4. TWO-COLUMN GRID */
    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    /* HANA COCKPIT METRICS */
    .hana-general-meta {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      .meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.74rem;

        .m-lbl { color: #64748b; font-weight: 500; }
        .m-val { color: #1e293b; font-weight: 700; }
        .text-green { color: #059669; }
      }
    }

    .section-sub-title {
      margin: 0.25rem 0 0.5rem;
      font-size: 0.78rem;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .mt-3 { margin-top: 0.85rem; }

    .usage-gauges-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;

      .gauge-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .gauge-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.74rem;

          .g-title { color: #475569; font-weight: 600; }
          .g-val { color: #0f172a; font-weight: 700; font-family: monospace; }
          .pct { color: #0284c7; font-weight: 800; font-family: sans-serif; }
        }

        .progress-track {
          height: 7px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;

          .progress-bar {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;

            &.blue { background: #0284c7; }
            &.amber { background: #d97706; }
            &.teal { background: #0d9488; }
            &.green { background: #10b981; }
          }
        }
      }
    }

    /* SIZING S/4HANA REPORT SECTION */
    .sizing-kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;

      .s-kpi-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.65rem 0.85rem;
        display: flex;
        flex-direction: column;

        .sk-lbl { font-size: 0.68rem; color: #64748b; font-weight: 600; }
        .sk-val { font-size: 1.15rem; font-weight: 900; margin: 0.1rem 0; }
        .sk-sub { font-size: 0.65rem; color: #94a3b8; }

        .text-blue { color: #0284c7; }
        .text-emerald { color: #059669; }
        .text-purple { color: #7e22ce; }
        .text-teal { color: #0d9488; }
      }
    }

    .sizing-calc-tree {
      display: flex;
      flex-direction: column;

      .calc-tree-list {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;

        .tree-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.45rem 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.74rem;

          .t-name { color: #334155; }
          .t-val { font-family: monospace; font-weight: 700; color: #0f172a; }

          &.subtotal {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 700;
          }

          &.grand-total {
            background: #f0f9ff;
            border-top: 2px solid #bae6fd;
            border-bottom: none;
            padding: 0.6rem 0.75rem;
            font-size: 0.78rem;
          }
        }
      }
    }

    .report-meta-footer {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.45rem 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.7rem;
      color: #64748b;

      strong { color: #1e293b; }
    }
  `]
})
export class SourceSizingComponent {
  customerService = inject(CustomerService);

  // GÖRSEL 3: PRODUCT / CURRENT ➔ TARGET SIZING MATRİSİ
  sizingMatrix = [
    { product: 'S4 HANA DB Prod', current: '1 TB', target: '1 TB (SAP S/4HANA Private Cloud)', description: 'Canlı In-Memory HANA Veritabanı (SEP)', isDb: true },
    { product: 'S4 HANA DB QA', current: '768 GB', target: '768 GB (Quality Assurance Cloud DB)', description: 'Kalite & Test ortamı HANA veritabanı', isDb: true },
    { product: 'S4 HANA DB Dev', current: '256 GB', target: '256 GB (Development Cloud DB)', description: 'Geliştirme & Sandbox ortamı', isDb: true },
    { product: 'S4 App Prod', current: '2x64 GB', target: '2x64 GB (Production App Cluster)', description: 'Yük dengelemeli uygulama sunucuları', isDb: false },
    { product: 'S4 App Qa', current: '32 GB', target: '32 GB (QA App Server)', description: 'Test ve entegrasyon sunucusu', isDb: false },
    { product: 'S4 App Dev', current: '32 GB', target: '32 GB (Dev App Server)', description: 'ABAP & Fiori geliştirme ortamı', isDb: false }
  ];
}
