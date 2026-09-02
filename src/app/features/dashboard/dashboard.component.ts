import { Component, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
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
            <span class="company-badge">ABC Holding</span>
            <span class="pulse-live-badge"><span class="pulse-dot"></span> Canlı Veri Setleri Analizi</span>
          </div>
          <h1 class="main-title">SAP Fırsat & Mimari Genel Bakış Dashboard</h1>
          <p class="sub-title">11 Dağınık Sunucu, 70 FUE Lisansı, 1.3 TB HANA Sizing ve 109 Canlı PO Entegrasyonu Genel Görünümü</p>
        </div>

        <div class="header-actions">
          <a routerLink="/reports" class="btn btn-primary">
            <app-icon name="file-text" [size]="16" color="#ffffff"></app-icon>
            <span>Executive Summary Raporu ➔</span>
          </a>
        </div>
      </div>

      <!-- Top 6 Unified KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" routerLink="/architecture-map" [queryParams]="{ mode: 'asis' }">
          <div class="kpi-top">
            <span class="kpi-title">Altyapı Sunucuları</span>
            <div class="kpi-icon-box bg-blue"><app-icon name="database" [size]="18" color="#0284c7"></app-icon></div>
          </div>
          <div class="kpi-val">11 Sunucu</div>
          <div class="kpi-sub">Target: 1 Konsolide Bulut DB</div>
          <div class="kpi-tag-row">
            <span class="tag-pill red">11 Dağınık On-Prem</span>
            <span class="tag-pill green">%91 Konsolidasyon</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/analytics">
          <div class="kpi-top">
            <span class="kpi-title">FUE Lisans İhtiyacı</span>
            <div class="kpi-icon-box bg-emerald"><app-icon name="users" [size]="18" color="#059669"></app-icon></div>
          </div>
          <div class="kpi-val text-emerald">70 FUE</div>
          <div class="kpi-sub">83 Fiili Kullanıcı Kapsamda</div>
          <div class="tag-row">
            <span class="tag-pill green">Sıfır Aşım Riski</span>
            <span class="tag-pill blue">Optimum Paket</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/source-sizing">
          <div class="kpi-top">
            <span class="kpi-title">HANA DB Sizing</span>
            <div class="kpi-icon-box bg-cyan"><app-icon name="database" [size]="18" color="#0891b2"></app-icon></div>
          </div>
          <div class="kpi-val">1.311 GiB</div>
          <div class="kpi-sub">336 GiB Disk Alanı Kazanımı</div>
          <div class="tag-row">
            <span class="tag-pill blue">1 TB Prod + 768 GB QA</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/architecture-map" [queryParams]="{ mode: 'po' }">
          <div class="kpi-top">
            <span class="kpi-title">Canlı PO Servisleri</span>
            <div class="kpi-icon-box bg-purple"><app-icon name="bolt" [size]="18" color="#7e22ce"></app-icon></div>
          </div>
          <div class="kpi-val text-purple">109 Servis</div>
          <div class="kpi-sub">83 Verici • 26 Alıcı Arayüz</div>
          <div class="tag-row">
            <span class="tag-pill purple">16 Entegre Sunucu</span>
            <span class="tag-pill green">BTP Ready</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/largest-tables">
          <div class="kpi-top">
            <span class="kpi-title">En Büyük Tablolar (DVM)</span>
            <div class="kpi-icon-box bg-amber"><app-icon name="layers" [size]="18" color="#d97706"></app-icon></div>
          </div>
          <div class="kpi-val text-amber">30 Tablo</div>
          <div class="kpi-sub">HANA RAM'in %92.7 Hacmi</div>
          <div class="tag-row">
            <span class="tag-pill amber">REGUP (308 GB)</span>
            <span class="tag-pill gray">4 Adımlı DVM</span>
          </div>
        </div>

        <div class="kpi-card highlight" routerLink="/business-case">
          <div class="kpi-top">
            <span class="kpi-title">Tahmini Yıllık Tasarruf</span>
            <div class="kpi-icon-box bg-emerald"><app-icon name="dollar" [size]="18" color="#059669"></app-icon></div>
          </div>
          <div class="kpi-val text-emerald">€140.000 / Yıl</div>
          <div class="kpi-sub">Donanım, OS, DB & Lisans ROI</div>
          <div class="tag-row">
            <span class="tag-pill green">3 Yıllık Net: €420.000</span>
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
              <h3>Altyapı & Sunucu Dağılımı (11 Sunucu ➔ 1 Bulut DB)</h3>
            </div>
            <a routerLink="/architecture-map" [queryParams]="{ mode: 'asis' }" class="ch-link">Mimari Şema ➔</a>
          </div>
          <div class="chart-body">
            <canvas #infraChart></canvas>
          </div>
        </div>

        <!-- Chart 2: FUE License Distribution -->
        <div class="chart-box">
          <div class="chart-header">
            <div class="ch-left">
              <app-icon name="users" [size]="16" color="#059669"></app-icon>
              <h3>FUE Lisanslama Dağılımı (Toplam 70 FUE)</h3>
            </div>
            <a routerLink="/analytics" class="ch-link">Lisans Analizi ➔</a>
          </div>
          <div class="chart-body">
            <canvas #licenseChart></canvas>
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
            <canvas #sizingChart></canvas>
          </div>
        </div>

        <!-- Chart 4: PO Integration Protocol Breakdown -->
        <div class="chart-box">
          <div class="chart-header">
            <div class="ch-left">
              <app-icon name="bolt" [size]="16" color="#7e22ce"></app-icon>
              <h3>PO Canlı Entegrasyon Protokolleri (109 Servis)</h3>
            </div>
            <a routerLink="/architecture-map" [queryParams]="{ mode: 'po' }" class="ch-link">PO Listesi ➔</a>
          </div>
          <div class="chart-body">
            <canvas #integrationChart></canvas>
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
          <span class="qn-sub">Tüm veri setleri Excel analizleri ile senkronize edilmiştir</span>
        </div>

        <div class="modules-grid">
          <a routerLink="/architecture-map" [queryParams]="{ mode: 'asis' }" class="module-nav-item">
            <div class="m-icon bg-blue"><app-icon name="map" [size]="18" color="#0284c7"></app-icon></div>
            <div class="m-info">
              <strong>Lanscape & EoS Haritası</strong>
              <span>11 Sunucu, Fiori 1511 & CS 6.5 Risk Analizi</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/analytics" class="module-nav-item">
            <div class="m-icon bg-emerald"><app-icon name="users" [size]="18" color="#059669"></app-icon></div>
            <div class="m-info">
              <strong>FUE & Lisans Optimizasyonu</strong>
              <span>83 Aktif Kullanıcı ➔ 70 FUE Paketi</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/source-sizing" class="module-nav-item">
            <div class="m-icon bg-cyan"><app-icon name="database" [size]="18" color="#0891b2"></app-icon></div>
            <div class="m-info">
              <strong>Source Sizing (HANA 2.0)</strong>
              <span>1.311 GiB RAM & 336 GiB Disk Tasarrufu</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/largest-tables" class="module-nav-item">
            <div class="m-icon bg-amber"><app-icon name="layers" [size]="18" color="#d97706"></app-icon></div>
            <div class="m-info">
              <strong>Largest Tables (DVM)</strong>
              <span>REGUP, ACDOCA 30 Kritik Tablo Arşivleme</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/architecture-map" [queryParams]="{ mode: 'po' }" class="module-nav-item">
            <div class="m-icon bg-purple"><app-icon name="bolt" [size]="18" color="#7e22ce"></app-icon></div>
            <div class="m-info">
              <strong>PO Entegrasyon Listesi</strong>
              <span>109 Canlı Servis (83 Verici, 26 Alıcı)</span>
            </div>
            <span class="m-arrow">➔</span>
          </a>

          <a routerLink="/reports" class="module-nav-item highlight">
            <div class="m-icon bg-emerald"><app-icon name="file-text" [size]="18" color="#059669"></app-icon></div>
            <div class="m-info">
              <strong>Executive Summary (PDF Rapor)</strong>
              <span>%84 RISE Match Skoru & Yönetici Raporu</span>
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
    // 1. Infrastructure Chart (Bar Chart: AS-IS vs Target)
    if (this.infraChartRef?.nativeElement) {
      new Chart(this.infraChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['ERP EHP7', 'PO 7.5', 'Fiori 1511 (EoS)', 'Content Server (EoS)', 'WebDisp', 'RISE Target'],
          datasets: [{
            label: 'Sunucu Adedi',
            data: [3, 3, 2, 1, 2, 1],
            backgroundColor: ['#ef4444', '#ef4444', '#dc2626', '#dc2626', '#f59e0b', '#10b981'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 4, ticks: { stepSize: 1 } }
          }
        }
      });
    }

    // 2. FUE License Chart (Doughnut)
    if (this.licenseChartRef?.nativeElement) {
      new Chart(this.licenseChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Advanced (20 FUE)', 'Core (16 FUE)', 'Self-Service (34 FUE)'],
          datasets: [{
            data: [20, 16, 34],
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

    // 3. HANA Sizing Chart (Bar Chart)
    if (this.sizingChartRef?.nativeElement) {
      new Chart(this.sizingChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Başlangıç RAM', 'Hedef RAM', 'Başlangıç Disk', 'Hedef Disk (DVM)'],
          datasets: [{
            label: 'GiB',
            data: [1405.8, 1311.0, 1390.0, 1054.0],
            backgroundColor: ['#94a3b8', '#0284c7', '#cbd5e1', '#059669'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 1600 }
          }
        }
      });
    }

    // 4. PO Integration Protocols Chart (Horizontal Bar or Polar)
    if (this.integrationChartRef?.nativeElement) {
      new Chart(this.integrationChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['JDBC (Veritabanı)', 'SOAP (Web Servis)', 'RFC (SAP İçi)', 'REST (API)', 'SFTP / NFS', 'XI'],
          datasets: [{
            label: 'Servis Sayısı',
            data: [43, 28, 18, 10, 8, 2],
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
            x: { beginAtZero: true, max: 50 }
          }
        }
      });
    }
  }
}
