import { Component, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { OpportunityEngineService } from '../../core/services/opportunity-engine.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, KpiCardComponent, StatusBadgeComponent, IconComponent],
  template: `
    <div class="dashboard-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Executive Dashboard</h1>
          <p class="page-subtitle">SAP Müşteri Veri Analiz & Fırsat Yönetim Ekranı</p>
        </div>
        <div class="header-actions">
          <a routerLink="/data-import" class="btn btn-primary">
            <app-icon name="upload" [size]="16"></app-icon>
            <span>+ Yeni Excel/CSV Yükle</span>
          </a>
        </div>
      </div>

      <!-- Top KPI Cards Grid -->
      <div class="kpi-grid">
        <app-kpi-card 
          label="Toplam Müşteri" 
          value="24" 
          subtext="Aktif Danışmanlık Portföyü"
          trendText="+3 Bu Ay"
          theme="primary">
          <app-icon name="customers" [size]="20" color="#0284c7"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="Aktif Analiz" 
          value="8" 
          subtext="Task Force Aşamasında"
          trendText="%65 İlerleme Oranı"
          theme="indigo">
          <app-icon name="chart" [size]="20" color="#6366f1"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="Tespit Edilen Fırsat" 
          value="37" 
          subtext="4 Ana Kategoride"
          trendText="12 Quick Win"
          theme="emerald">
          <app-icon name="opportunities" [size]="20" color="#059669"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="Tahmini Business Value" 
          value="€1.250.000" 
          subtext="Yıllık Toplam Katma Değer"
          trendText="+%18 Artış"
          theme="amber">
          <app-icon name="dollar" [size]="20" color="#d97706"></app-icon>
        </app-kpi-card>
      </div>

      <!-- Charts Section (Grid Layout) -->
      <div class="charts-grid">
        <!-- Chart 1: Customer Opportunity Distribution -->
        <div class="chart-card">
          <div class="card-header">
            <h3>Müşterilere Göre Fırsat Dağılımı</h3>
            <span class="card-tag">En Yüksek Potansiyelli Müşteriler</span>
          </div>
          <div class="chart-body">
            <canvas #customerChart></canvas>
          </div>
        </div>

        <!-- Chart 2: Opportunity Categories -->
        <div class="chart-card">
          <div class="card-header">
            <h3>Fırsat Türlerine Göre Dağılım</h3>
            <span class="card-tag">Kategori Oranı</span>
          </div>
          <div class="chart-body">
            <canvas #categoryChart></canvas>
          </div>
        </div>
      </div>

      <div class="charts-grid mt-4">
        <!-- Chart 3: Business Value Distribution -->
        <div class="chart-card">
          <div class="card-header">
            <h3>Business Value & Tasarruf Dağılımı (€)</h3>
            <span class="card-tag">Yıllık Finansal Katkı</span>
          </div>
          <div class="chart-body">
            <canvas #valueChart></canvas>
          </div>
        </div>

        <!-- Chart 4: Opportunity Pipeline -->
        <div class="chart-card">
          <div class="card-header">
            <h3>Opportunity Pipeline</h3>
            <span class="card-tag">Task Force Aşamaları</span>
          </div>
          <div class="chart-body">
            <canvas #pipelineChart></canvas>
          </div>
        </div>
      </div>

      <!-- Meetings & Recent Activity Bottom Section -->
      <div class="bottom-grid">
        <!-- Customer Meetings -->
        <div class="content-card">
          <div class="card-header">
            <h3><app-icon name="presentation" [size]="18"></app-icon> Yaklaşan Müşteri Toplantıları</h3>
            <span class="link-btn">Tümünü Gör</span>
          </div>
          <div class="meeting-list">
            <div class="meeting-item">
              <div class="date-badge">
                <span class="day">04</span>
                <span class="month">EYL</span>
              </div>
              <div class="meeting-info">
                <strong>ABC Holding - Solution Design Presentation</strong>
                <p>SAP BTP Automation & Professional Lisans Optimizasyonu Sunumu</p>
                <small>Saat: 14:00 - Katılımcı: CIO Mehmet Yılmaz</small>
              </div>
              <app-status-badge text="Approved" type="status"></app-status-badge>
            </div>

            <div class="meeting-item">
              <div class="date-badge indigo">
                <span class="day">08</span>
                <span class="month">EYL</span>
              </div>
              <div class="meeting-info">
                <strong>DEF Kimya - Data Review & Discovery</strong>
                <p>Ariba & Tedarik Zinciri Süreç Doğrulama Toplantısı</p>
                <small>Saat: 10:30 - Katılımcı: Ayşe Demir (IT Director)</small>
              </div>
              <app-status-badge text="Under Review" type="status"></app-status-badge>
            </div>
          </div>
        </div>

        <!-- Recent Task Force Activity -->
        <div class="content-card">
          <div class="card-header">
            <h3><app-icon name="workspace" [size]="18"></app-icon> Son Task Force Aktivitesi</h3>
            <span class="link-btn">Canlı Akış</span>
          </div>
          <div class="activity-feed">
            <div class="activity-item">
              <div class="avatar-badge">ZK</div>
              <div class="activity-content">
                <p><strong>Zeynep Kaya</strong> (SAP Consultant), <strong>ABC Holding</strong> için BTP Otomasyon ROI hesabını güncelledi.</p>
                <small>15 dakika önce • ROI %180</small>
              </div>
            </div>

            <div class="activity-item">
              <div class="avatar-badge cd">CD</div>
              <div class="activity-content">
                <p><strong>Caner Demir</strong> (Solution Architect), 15 adet yetkisiz Professional lisansı <strong>Limited</strong> olarak işaretledi.</p>
                <small>1 saat önce • €35.000 Tasarruf</small>
              </div>
            </div>
          </div>
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
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
      .page-subtitle { margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #64748b; }
    }

    .btn-primary {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      text-decoration: none;

      &:hover { background: #0369a1; }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(440px, 1fr));
      gap: 1.25rem;
    }

    .mt-4 { margin-top: 0.5rem; }

    .chart-card, .content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;

        h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.4rem; }
        .card-tag { font-size: 0.72rem; color: #0284c7; font-weight: 600; background: #f0f9ff; padding: 0.15rem 0.5rem; border-radius: 12px; }
        .link-btn { font-size: 0.75rem; color: #0284c7; font-weight: 700; cursor: pointer; }
      }

      .chart-body { position: relative; height: 250px; width: 100%; }
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(440px, 1fr));
      gap: 1.25rem;
    }

    .meeting-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .meeting-item {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.75rem;
        border-radius: 8px;
        background: #f8fafc;
        border: 1px solid #f1f5f9;

        .date-badge {
          width: 44px;
          height: 44px;
          background: #0284c7;
          color: #fff;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1;

          .day { font-size: 1rem; font-weight: 800; }
          .month { font-size: 0.6rem; font-weight: 700; opacity: 0.9; margin-top: 2px; }
          &.indigo { background: #6366f1; }
        }

        .meeting-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          strong { font-size: 0.82rem; color: #0f172a; }
          p { margin: 0.15rem 0; font-size: 0.75rem; color: #64748b; }
          small { font-size: 0.68rem; color: #94a3b8; }
        }
      }
    }

    .activity-feed {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.65rem;
        border-bottom: 1px solid #f1f5f9;

        .avatar-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0284c7;
          color: #fff;
          font-weight: 800;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.cd { background: #6366f1; }
        }

        .activity-content {
          font-size: 0.78rem;
          p { margin: 0; color: #334155; }
          small { color: #94a3b8; font-size: 0.68rem; margin-top: 0.15rem; display: block; }
        }
      }
    }
  `]
})
export class DashboardComponent implements AfterViewInit {
  customerService = inject(CustomerService);
  opportunityService = inject(OpportunityEngineService);

  @ViewChild('customerChart') customerChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('valueChart') valueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pipelineChart') pipelineChartRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    this.initCustomerChart();
    this.initCategoryChart();
    this.initValueChart();
    this.initPipelineChart();
  }

  private initCustomerChart(): void {
    new Chart(this.customerChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['ABC Holding', 'DEF Kimya', 'GHI Lojistik', 'KLM Gıda', 'NOP Enerji'],
        datasets: [{
          label: 'Fırsat Sayısı',
          data: [5, 3, 7, 4, 2],
          backgroundColor: '#0284c7',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
      }
    });
  }

  private initCategoryChart(): void {
    new Chart(this.categoryChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Lisans Optimizasyonu', 'SAP BTP Fırsatı', 'Süreç Optimizasyonu', 'AI FIRSATI'],
        datasets: [{
          data: [35, 30, 20, 15],
          backgroundColor: ['#0284c7', '#6366f1', '#10b981', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
      }
    });
  }

  private initValueChart(): void {
    new Chart(this.valueChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['ABC Holding', 'DEF Kimya', 'GHI Lojistik', 'KLM Gıda'],
        datasets: [
          { label: 'Lisans Tasarrufu (€)', data: [35000, 25000, 60000, 20000], backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'Verimlilik Katkısı (€)', data: [125000, 70000, 180000, 90000], backgroundColor: '#0284c7', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
      }
    });
  }

  private initPipelineChart(): void {
    new Chart(this.pipelineChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Discovery', 'Data Ingestion', 'Analysis', 'Opportunity ID', 'Solution Design', 'Business Case', 'Presentation'],
        datasets: [{ label: 'Müşteri Sayısı', data: [4, 6, 3, 5, 3, 2, 1], backgroundColor: '#6366f1', borderRadius: 4 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, grid: { color: '#f1f5f9' } }, y: { grid: { display: false } } }
      }
    });
  }
}
