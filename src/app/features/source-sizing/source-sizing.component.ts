import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-source-sizing',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="source-page">
      
      <!-- Live Upload Indicator Banner -->
      <div class="uploaded-live-banner" *ngIf="basisService.hasUploadedData()">
        <div class="banner-left">
          <span class="live-dot"></span>
          <span class="banner-text">
            <strong>Canlı Sizing Raporu Yüklendi:</strong> {{ basisService.basisPackage()?.fileName }} 
            • SID: <strong>{{ basisService.systemInfo()?.sid }}</strong> 
            • Veritabanı: <strong>{{ basisService.systemInfo()?.dbType }}</strong>
            • Tahmini RAM: <strong>{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB | number:'1.0-1' }} GiB</strong>
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
          <h1 class="page-title">Source (Current / Target) Altyapı & Boyutlandırma</h1>
          <p class="page-subtitle">SAP HANA Cockpit sistem durumu, /SDF/HDB_SIZING raporu ve Hedef S/4HANA boyutlandırma matrisi</p>
        </div>

        <!-- Cockpit Quick Status Pills -->
        <div class="cockpit-status-bar">
          <div class="status-pill" [ngClass]="basisService.hasUploadedData() ? 'green' : 'amber'">
            <span class="pulse-dot"></span>
            <span>{{ basisService.hasUploadedData() ? 'All Services Started' : 'Veri Yüklenmesi Bekleniyor' }}</span>
          </div>
          <div class="status-pill blue">
            <app-icon name="database" [size]="13" color="#0284c7"></app-icon>
            <span>SID: {{ basisService.systemInfo()?.sid || '—' }} ({{ basisService.hasUploadedData() ? 'Yüklenen Rapor' : 'Tanımsız' }})</span>
          </div>
          <div class="status-pill" [ngClass]="basisService.hasUploadedData() ? 'blue' : 'amber'">
            <app-icon name="alert" [size]="13" [color]="basisService.hasUploadedData() ? '#0284c7' : '#d97706'"></app-icon>
            <span>{{ basisService.hasUploadedData() ? 'Boyutlandırma Aktif' : '0 Veri' }}</span>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE WHEN NO EXCEL HAS BEEN UPLOADED -->
      <div class="empty-upload-card" *ngIf="!basisService.hasUploadedData()">
        <div class="empty-icon-wrap">
          <app-icon name="upload" [size]="32" color="#0284c7"></app-icon>
        </div>
        <h3>Sizing ve Donanım Analizi İçin Excel Yüklenmesi Bekleniyor</h3>
        <p>S/4HANA boyutlandırma matrisi, HANA Cockpit metrikleri ve /SDF/HDB_SIZING bellek/disk hesaplamaları yükleyeceğiniz Excel dosyasına göre otomatik üretilecektir. Lütfen müşteriye ait SAP Basis & Sizing Excel dosyasını yükleyiniz.</p>
        <button class="btn btn-primary" routerLink="/data-import">
          <app-icon name="upload" [size]="16" color="#ffffff"></app-icon>
          <span>Excel Yükle (Veri İçe Aktar)</span>
        </button>
      </div>

      <!-- MAIN SIZING & COCKPIT CONTENT (Only rendered when an Excel is uploaded!) -->
      <ng-container *ngIf="basisService.hasUploadedData()">

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
              @for (row of sizingMatrix(); track row.product) {
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
            <strong class="s-val text-blue">{{ totalDbRam() }}</strong>
          </div>
          <div class="summary-item">
            <span class="s-label">Toplam Uygulama RAM:</span>
            <strong class="s-val text-blue">{{ totalAppRam() }}</strong>
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
              <span class="c-sub">Yüklenen /SDF/HDB_SIZING ve altyapı analizine göre otomatik hesaplanan öneriler</span>
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
            <h4 class="recom-title">{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB | number:'1.0-0' }} GiB Başlangıç RAM İhtiyacı</h4>
            <p class="recom-text">
              Sizing raporuna göre başlangıç bellek ihtiyacı <strong>{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB | number:'1.0-1' }} GiB</strong> seviyesindedir. DVM ve veri arşivleme aksiyonları ile bellek hacmi <strong>{{ ((basisService.memoryDetails()?.anticipatedInitialMemoryGiB || 0) * 0.85) | number:'1.0-0' }} GiB</strong> seviyesine çekilebilir.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Optimum bulut paketi sınırlarında kalma, ek RAM maliyetinden kaçınma</span>
            </div>
          </div>

          <!-- Öneri 2: Disk Alanı & Arşivleme Tasarrufu -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-emerald-light text-emerald">Disk & Arşivleme</span>
              <span class="recom-impact text-emerald">%30 Tasarruf</span>
            </div>
            <h4 class="recom-title">{{ ((basisService.diskDetails()?.initialNetDiskGiB || 0) * 0.3) | number:'1.0-0' }} GiB Disk Alanı Optimizasyonu</h4>
            <p class="recom-text">
              Sizing raporundaki net veri hacmi <strong>{{ basisService.diskDetails()?.initialNetDiskGiB | number:'1.0-1' }} GiB</strong> ölçülmüştür. Geçiş öncesi teknik log tabloları temizlenerek ve arşivleme uygulanarak veri hacmi <strong>{{ ((basisService.diskDetails()?.initialNetDiskGiB || 0) * 0.7) | number:'1.0-0' }} GiB</strong> seviyesine düşürülebilir.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Geçiş (Downtime) süresinde hızlanma ve disk depolama maliyeti düşüşü</span>
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
              Analiz edilen sistemde (SID: <strong>{{ basisService.systemInfo()?.sid }}</strong>) SAPS gereksinimi <strong>XS (Extra Small)</strong> olarak ölçülmüş olup toplam <strong>{{ basisService.systemInfo()?.tablesAnalyzed | number }}</strong> tablo analiz edilmiştir. RISE with SAP standart compute kapasitesi yeterlidir.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Optimum bulut bütçesi, gereksiz compute kapasitesi maliyetinden kaçınma</span>
            </div>
          </div>

          <!-- Öneri 4: Bulut Konsolidasyonu -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-amber-light text-amber">Bulut Konsolidasyonu</span>
              <span class="recom-impact text-emerald">Yüksek Uyum</span>
            </div>
            <h4 class="recom-title">{{ sizingMatrix().length }} Bileşenden Konsolide Bulut Mimarisine</h4>
            <p class="recom-text">
              Raporlanan <strong>{{ sizingMatrix().length }} adet bileşen ve veritabanı</strong>, RISE with SAP kapsamında konsolide edilerek tek bir merkezi mimaride yönetilebilir. Eski ve bakım süresi dolan bileşenler tasfiye edilmelidir.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Konsolide altyapı yönetimi ve %100 SAP bulut SLA güvencesi</span>
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
                <span class="c-sub">SID: {{ basisService.systemInfo()?.sid || 'SAP' }} • Canlı Veritabanı ve Donanım Metrikleri</span>
              </div>
            </div>
            <span class="source-tag">HANA Cockpit</span>
          </div>

          <!-- System General Meta Grid -->
          <div class="hana-general-meta">
            <div class="meta-row">
              <span class="m-lbl">Operational State:</span>
              <strong class="m-val text-green">All services are started (Analiz Edildi)</strong>
            </div>
            <div class="meta-row">
              <span class="m-lbl">System Usage / ID:</span>
              <strong class="m-val">Analiz Edilen Sistem (SID = {{ basisService.systemInfo()?.sid }})</strong>
            </div>
            <div class="meta-row">
              <span class="m-lbl">HANA / DB Sürümü:</span>
              <strong class="m-val">{{ basisService.systemInfo()?.dbType }} ({{ basisService.systemInfo()?.dbVersion }})</strong>
            </div>
            <div class="meta-row">
              <span class="m-lbl">Platform / OS:</span>
              <strong class="m-val">{{ basisService.systemInfo()?.operatingSystem }}</strong>
            </div>
          </div>

          <!-- Progress Bars & Usage Metrics -->
          <div class="usage-gauges-list">
            <h4 class="section-sub-title">Database Memory & CPU Usage</h4>

            <!-- Memory Used -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Column + Row Store / Total Memory</span>
                <strong class="g-val">{{ ((basisService.memoryDetails()?.columnLoadable || 0) + (basisService.memoryDetails()?.rowStore || 0)) | number:'1.1-1' }} GiB / {{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar amber" style="width: 75%"></div>
              </div>
            </div>

            <!-- CPU Usage -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">CPU Status (32 Available CPUs)</span>
                <strong class="g-val">32 CPUs <span class="pct">(Aktif & Stabil)</span></strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar blue" style="width: 35%"></div>
              </div>
            </div>

            <h4 class="section-sub-title mt-3">Database Disk Usage (SID: {{ basisService.systemInfo()?.sid || 'SAP' }})</h4>

            <!-- Data Volume Size -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Net Data Volume (GiB)</span>
                <strong class="g-val">{{ basisService.diskDetails()?.initialNetDiskGiB | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar blue" style="width: 70%"></div>
              </div>
            </div>

            <!-- Log Volume Size -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Tahmini Log & Cache Hacmi</span>
                <strong class="g-val">{{ ((basisService.diskDetails()?.initialNetDiskGiB || 0) * 0.25) | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar teal" style="width: 50%"></div>
              </div>
            </div>

            <!-- Trace Files -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Trace & Log Files</span>
                <strong class="g-val">1.50 GB <span class="pct">(Normal)</span></strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar green" style="width: 2%"></div>
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
              <strong class="sk-val text-blue">{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB | number:'1.1-1' }} GiB</strong>
              <span class="sk-sub">Maksimum Başlangıç RAM</span>
            </div>

            <div class="s-kpi-card">
              <span class="sk-lbl">Memory After Optimization</span>
              <strong class="sk-val text-emerald">{{ ((basisService.memoryDetails()?.anticipatedInitialMemoryGiB || 0) * 0.85) | number:'1.1-1' }} GiB</strong>
              <span class="sk-sub">Optimizasyon Sonrası RAM</span>
            </div>

            <div class="s-kpi-card">
              <span class="sk-lbl">Net Data Volume (Disk)</span>
              <strong class="sk-val text-purple">{{ basisService.diskDetails()?.initialNetDiskGiB | number:'1.1-1' }} GiB</strong>
              <span class="sk-sub">Disk Net Veri Hacmi</span>
            </div>

            <div class="s-kpi-card">
              <span class="sk-lbl">Disk After Optimization</span>
              <strong class="sk-val text-teal">{{ ((basisService.diskDetails()?.initialNetDiskGiB || 0) * 0.70) | number:'1.1-1' }} GiB</strong>
              <span class="sk-sub">%30 Arşivleme Tasarrufu</span>
            </div>
          </div>

          <!-- Memory Sizing Calculation Tree Table -->
          <div class="sizing-calc-tree">
            <h4 class="section-sub-title">Memory Sizing Calculation Details (HANA Size in GiB)</h4>

            <div class="calc-tree-list">
              <div class="tree-row">
                <span class="t-name">Column loadable data</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.columnLoadable | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Row Store data</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.rowStore | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row subtotal">
                <span class="t-name">= Memory requirement for initial loadable data</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.initialLoadable | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Hybrid LOB cache (10% of size on disk)</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.hybridLobCache | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Work space (100% Column + 50% Row Store)</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.workSpace | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Fixed size for code, stack and other services</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.fixedSize | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row grand-total">
                <span class="t-name"><strong>= Anticipated initial memory requirement</strong></span>
                <strong class="t-val text-blue font-bold">{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB | number:'1.1-1' }} GiB</strong>
              </div>
            </div>
          </div>

          <!-- Technical Metadata Footer -->
          <div class="report-meta-footer">
            <span>SAPS: <strong>XS</strong></span>
            <span>Analiz Edilen Tablo: <strong>{{ basisService.systemInfo()?.tablesAnalyzed | number }}</strong> (Hata: {{ basisService.systemInfo()?.tablesWithError }})</span>
            <span>Kernel: <strong>{{ basisService.systemInfo()?.kernelVersion }} ({{ basisService.systemInfo()?.nwRelease }})</strong></span>
          </div>
        </div>

      </div>

      </ng-container>

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
export class SourceSizingComponent {
  customerService = inject(CustomerService);
  basisService = inject(BasisSizingService);

  sizingMatrix = this.basisService.sizingMatrix;

  totalDbRam = computed(() => {
    const matrix = this.sizingMatrix();
    if (!this.basisService.hasUploadedData() || !matrix || matrix.length === 0) return '—';
    const dbRow = matrix.find(r => r.isDb && (r.product.toLowerCase().includes('prod') || r.product.toLowerCase().includes('product')));
    return dbRow ? dbRow.target : (matrix.find(r => r.isDb)?.target || '—');
  });

  totalAppRam = computed(() => {
    const matrix = this.sizingMatrix();
    if (!this.basisService.hasUploadedData() || !matrix || matrix.length === 0) return '—';
    const appRows = matrix.filter(r => !r.isDb);
    return appRows.length > 0 ? appRows.map(r => r.target).join(' • ') : '—';
  });
}
