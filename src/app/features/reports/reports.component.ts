import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../core/services/customer.service';
import { DataImportService } from '../../core/services/data-import.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

export interface ReportCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  type: 'executive' | 'license' | 'financial' | 'architecture';
  updatedAt: string;
  status: 'Ready' | 'Draft';
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, IconComponent, StatusBadgeComponent],
  template: `
    <div class="reports-page">
      <!-- Page Header -->
      <div class="page-header print-hide">
        <div>
          <h1 class="page-title">
            <app-icon name="file-text" [size]="24" color="#0284c7"></app-icon>
            Müşteri Raporlar Merkezi (Reports Hub)
          </h1>
          <p class="page-subtitle">SAP Kullanım Verileri ve Fırsat Analizlerinden Üretilen Kurumsal Görsel Raporlar</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-primary" (click)="printActiveReport()">
            <app-icon name="download" [size]="15"></app-icon>
            <span>Raporu PDF Olarak Yazdır / İndir</span>
          </button>
        </div>
      </div>

      <!-- Report Selection Category Bar -->
      <div class="report-types-bar print-hide">
        @for (rep of availableReports(); track rep.id) {
          <div 
            class="report-type-card" 
            [class.active]="selectedReportId() === rep.id"
            (click)="selectedReportId.set(rep.id)">
            <div class="card-icon">
              <app-icon [name]="rep.icon" [size]="18" [color]="selectedReportId() === rep.id ? '#0284c7' : '#4b5563'"></app-icon>
            </div>
            <div class="card-text">
              <strong>{{ rep.title }}</strong>
              <span class="sub">{{ rep.subtitle }}</span>
            </div>
            <app-status-badge [text]="rep.status" type="status"></app-status-badge>
          </div>
        }
      </div>

      <!-- FULL SCREEN WIDTH EXECUTIVE DOCUMENT CONTAINER -->
      <div class="document-paper full-screen">
        <!-- Document Header Bar -->
        <div class="doc-header">
          <div class="brand-logo">
            <div class="logo-box">
              <app-icon name="layers" [size]="20" color="#0284c7"></app-icon>
            </div>
            <div>
              <strong class="brand-title">TASK FORCE REPORT ENGINE</strong>
              <span class="brand-sub">SAP Customer Opportunity & Business Case Platform</span>
            </div>
          </div>

          <div class="doc-meta">
            <span class="meta-tag">{{ getActiveReportTitle() | uppercase }}</span>
            <span class="meta-date">Tarih: {{ currentDate }}</span>
            <span class="meta-id">Rapor Ref: TR-2026-{{ customerService.activeCustomer().id }}</span>
          </div>
        </div>

        <!-- Customer Banner Bar -->
        <div class="customer-banner">
          <div class="c-info">
            <span class="label">MÜŞTERİ / ŞİRKET</span>
            <h2 class="c-name">{{ customerService.activeCustomer().name }}</h2>
            <span class="c-sub">{{ customerService.activeCustomer().sector }} • {{ customerService.activeCustomer().contactPerson }}</span>
          </div>

          <div class="c-status">
            <span class="label">TASK FORCE EVRESİ</span>
            <app-status-badge [text]="customerService.activeCustomer().taskForceStatus" type="stage"></app-status-badge>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- REPORT TAB 1: Executive Proposal & Analysis -->
        <!-- ========================================== -->
        <div class="report-content" *ngIf="selectedReportId() === 'rep-exec'">
          <div class="kpi-grid">
            <div class="kpi-card">
              <span class="kpi-title">SAP Kullanıcı Sayısı</span>
              <strong class="kpi-value">{{ customerService.activeCustomer().sapUserCount | number }}</strong>
              <span class="kpi-sub">{{ customerService.activeCustomer().lowUsageUserCount }} Düşük Kullanımlı</span>
            </div>
            <div class="kpi-card highlight">
              <span class="kpi-title">Tahmini Yıllık Tasarruf</span>
              <strong class="kpi-value green">€{{ customerService.activeCustomer().estimatedOpportunityValue | number }}</strong>
              <span class="kpi-sub">Sürekli Katma Değer</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-title">Yatırım Getirisi (ROI)</span>
              <strong class="kpi-value">%133</strong>
              <span class="kpi-sub">Geri Ödeme: 6 Ay</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-title">Veri Kalitesi Skoru</span>
              <strong class="kpi-value">%96</strong>
              <span class="kpi-sub">1.250 İşlem Kaydı</span>
            </div>
          </div>

          <div class="charts-two-column-grid">
            <!-- GRAPHIC: Sleek Micro Bar Chart -->
            <div class="report-section">
              <h3 class="section-heading">
                <app-icon name="chart" [size]="15" color="#0284c7"></app-icon>
                1. SAP Modül & Lisans Verimlilik Analizi
              </h3>

              <div class="chart-box compact">
                @for (prod of customerService.activeCustomer().sapProducts; track prod.id) {
                  <div class="bar-chart-row">
                    <div class="bar-label">
                      <strong>{{ prod.name }}</strong>
                      <span class="badge-tag">%85 Aktif Kullanım</span>
                    </div>
                    <div class="bar-track">
                      <div class="bar-fill active-fill" style="width: 85%"></div>
                      <div class="bar-fill low-fill" style="width: 15%"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- GRAPHIC: Financial Projections Pillar Bar Chart -->
            <div class="report-section">
              <h3 class="section-heading">
                <app-icon name="dollar" [size]="15" color="#0284c7"></app-icon>
                2. 3 Yıllık Finansal Projeksiyon (€)
              </h3>
              
              <div class="visual-financial-chart compact">
                <div class="f-chart-bar">
                  <span class="b-val red">€30k</span>
                  <div class="b-pillar red-pillar" style="height: 35px;"></div>
                  <span class="b-tag">Yatırım</span>
                </div>

                <div class="f-chart-bar">
                  <span class="b-val gray">€10k</span>
                  <div class="b-pillar gray-pillar" style="height: 20px;"></div>
                  <span class="b-tag">İşletim</span>
                </div>

                <div class="f-chart-bar">
                  <span class="b-val green">€160k</span>
                  <div class="b-pillar green-pillar" style="height: 85px;"></div>
                  <span class="b-tag">Tasarruf</span>
                </div>

                <div class="f-chart-bar highlight">
                  <span class="b-val dark-green">€450k</span>
                  <div class="b-pillar dark-pillar" style="height: 115px;"></div>
                  <span class="b-tag">3 Yıllık Net</span>
                </div>
              </div>
            </div>
          </div>

          <div class="report-section">
            <h3 class="section-heading">
              <app-icon name="sparkles" [size]="15" color="#0284c7"></app-icon>
              3. Veri Analizi ve Tespit Edilen Darboğazlar
            </h3>
            <ul class="finding-list">
              <li>
                <span class="dot primary"></span>
                <div><strong>Atıl Lisans Kullanımı:</strong> 130 kullanıcı Professional lisansa sahip olup atıl durumdadır (€35.000/Yıl tasarruf).</div>
              </li>
              <li>
                <span class="dot warning"></span>
                <div><strong>Manuel Süreç Yükü:</strong> Finans ve Satınalma departmanlarında yılda 1.200 saat manuel efor harcanmaktadır.</div>
              </li>
            </ul>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- REPORT TAB 2: SAP License Audit & Analytics -->
        <!-- ========================================== -->
        <div class="report-content" *ngIf="selectedReportId() === 'rep-license'">
          <div class="kpi-grid">
            <div class="kpi-card">
              <span class="kpi-title">Toplam Lisans Hacmi</span>
              <strong class="kpi-value">2,280 Adet</strong>
              <span class="kpi-sub">5 Farklı SAP Ürünü</span>
            </div>
            <div class="kpi-card warning-card">
              <span class="kpi-title">Atıl / Düşük Kullanım</span>
              <strong class="kpi-value red-text">342 Adet (%15)</strong>
              <span class="kpi-sub">Over-licensed Risk</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-title">Aylık Lisans Harcaması</span>
              <strong class="kpi-value">€39,200 / Ay</strong>
              <span class="kpi-sub">Süreklilik Arz Eden</span>
            </div>
            <div class="kpi-card highlight">
              <span class="kpi-title">Optimize Edilebilir Hacim</span>
              <strong class="kpi-value green">€35,000 / Yıl</strong>
              <span class="kpi-sub">Quick Win Potansiyel</span>
            </div>
          </div>

          <!-- VISUAL GRAPHICS FOR LICENSE REPORT -->
          <div class="charts-two-column-grid">
            <!-- GRAPHIC: Product License Cost Breakdown Stacked Visual -->
            <div class="report-section">
              <h3 class="section-heading">
                <app-icon name="database" [size]="15" color="#0284c7"></app-icon>
                1. Ürün Bazlı Lisans Maliyet Dağılımı (€/Ay)
              </h3>
              <div class="license-cost-visual">
                @for (prod of customerService.activeCustomer().sapProducts; track prod.id) {
                  <div class="cost-item">
                    <div class="cost-meta">
                      <strong>{{ prod.name }}</strong>
                      <span>€{{ prod.monthlyCost | number }}/Ay</span>
                    </div>
                    <div class="cost-bar-track">
                      <div class="cost-bar-fill" [style.width.%]="(prod.monthlyCost / 22000) * 100"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- GRAPHIC: License Utilization Status Rings -->
            <div class="report-section">
              <h3 class="section-heading">
                <app-icon name="analytics" [size]="15" color="#0284c7"></app-icon>
                2. Yetki vs Kullanım Uyum Oranları
              </h3>
              <div class="utilization-grid">
                <div class="util-card">
                  <span class="u-title">SAP S/4HANA ERP</span>
                  <div class="u-gauge green-gauge">%85 Aktif</div>
                  <span class="u-sub">850 Lisans / 125 Atıl</span>
                </div>
                <div class="util-card">
                  <span class="u-title">SuccessFactors</span>
                  <div class="u-gauge green-gauge">%92 Aktif</div>
                  <span class="u-sub">1250 Lisans / 100 Atıl</span>
                </div>
                <div class="util-card">
                  <span class="u-title">SAP Ariba</span>
                  <div class="u-gauge yellow-gauge">%70 Aktif</div>
                  <span class="u-sub">150 Lisans / 45 Atıl</span>
                </div>
                <div class="util-card">
                  <span class="u-title">SAP BTP Cloud</span>
                  <div class="u-gauge green-gauge">%95 Aktif</div>
                  <span class="u-sub">50 Lisans / 5 Atıl</span>
                </div>
              </div>
            </div>
          </div>

          <div class="report-section">
            <h3 class="section-heading">Detaylı SAP Lisans ve Ürün Envanter Tablosu</h3>
            <table class="report-table">
              <thead>
                <tr>
                  <th>SAP Ürün / Modül</th>
                  <th>Lisans Adedi</th>
                  <th>Aktif Kullanıcı</th>
                  <th>Düşük Kullanım</th>
                  <th>Aylık Maliyet</th>
                  <th>Lisans Durumu</th>
                </tr>
              </thead>
              <tbody>
                @for (prod of customerService.activeCustomer().sapProducts; track prod.id) {
                  <tr>
                    <td><strong>{{ prod.name }}</strong></td>
                    <td>{{ prod.licenseCount }}</td>
                    <td>{{ (prod.licenseCount * 0.85) | number:'1.0-0' }}</td>
                    <td><span class="red-text">{{ (prod.licenseCount * 0.15) | number:'1.0-0' }}</span></td>
                    <td>€{{ prod.monthlyCost | number }}</td>
                    <td><app-status-badge [text]="prod.status" type="status"></app-status-badge></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- REPORT TAB 3: Financial ROI & Cash Flow    -->
        <!-- ========================================== -->
        <div class="report-content" *ngIf="selectedReportId() === 'rep-financial'">
          <div class="kpi-grid">
            <div class="kpi-card">
              <span class="kpi-title">Uygulama Yatırımı</span>
              <strong class="kpi-value">€30,000</strong>
              <span class="kpi-sub">Tek Seferlik Proje</span>
            </div>
            <div class="kpi-card highlight">
              <span class="kpi-title">Yıllık Net Fayda</span>
              <strong class="kpi-value green">€160,000 / Yıl</strong>
              <span class="kpi-sub">Operasyonel + Lisans</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-title">Yatırım Geri Dönüşü</span>
              <strong class="kpi-value">%133 ROI</strong>
              <span class="kpi-sub">Net Kar Oranı</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-title">Payback (Geri Ödeme)</span>
              <strong class="kpi-value">6 Ay</strong>
              <span class="kpi-sub">Kritik Eşik Süresi</span>
            </div>
          </div>

          <!-- VISUAL GRAPHICS FOR FINANCIAL ROI REPORT -->
          <div class="charts-two-column-grid">
            <!-- GRAPHIC 1: Cumulative 3-Year Cash Flow Growth Visual Chart -->
            <div class="report-section">
              <h3 class="section-heading">
                <app-icon name="dollar" [size]="15" color="#0284c7"></app-icon>
                1. Yıllara Göre Kümülatif Nakit Akış Gelişimi (€)
              </h3>
              <div class="cashflow-growth-chart">
                <div class="cf-year-col">
                  <span class="cf-year">Yıl 0 (Başlangıç)</span>
                  <div class="cf-bar initial" style="width: 20%">-€30,000</div>
                </div>
                <div class="cf-year-col">
                  <span class="cf-year">Yıl 1</span>
                  <div class="cf-bar positive" style="width: 45%">+€120,000</div>
                </div>
                <div class="cf-year-col">
                  <span class="cf-year">Yıl 2</span>
                  <div class="cf-bar positive" style="width: 75%">+€280,000</div>
                </div>
                <div class="cf-year-col">
                  <span class="cf-year">Yıl 3</span>
                  <div class="cf-bar positive highlight" style="width: 100%">+€450,000 Net</div>
                </div>
              </div>
            </div>

            <!-- GRAPHIC 2: Cost Savings Category Breakdown -->
            <div class="report-section">
              <h3 class="section-heading">
                <app-icon name="sparkles" [size]="15" color="#0284c7"></app-icon>
                2. Yıllık Tasarruf Kalemleri Dağılımı (€)
              </h3>
              <div class="savings-breakdown-list">
                <div class="sb-item">
                  <div class="sb-info">
                    <strong>Lisans Yetki Dönüşümü (Quick Win)</strong>
                    <span class="green">€35,000 / Yıl</span>
                  </div>
                  <div class="sb-track"><div class="sb-fill green-fill" style="width: 25%"></div></div>
                </div>
                <div class="sb-item">
                  <div class="sb-info">
                    <strong>SAP BTP Otomasyon Zaman Kazancı (1.200 Sa)</strong>
                    <span class="blue">€40,000 / Yıl</span>
                  </div>
                  <div class="sb-track"><div class="sb-fill blue-fill" style="width: 30%"></div></div>
                </div>
                <div class="sb-item">
                  <div class="sb-info">
                    <strong>Süreç Standartlaştırması & Hata Önleme</strong>
                    <span class="dark-fill">€85,000 / Yıl</span>
                  </div>
                  <div class="sb-track"><div class="sb-fill dark-fill" style="width: 45%"></div></div>
                </div>
              </div>
            </div>
          </div>

          <div class="report-section">
            <h3 class="section-heading">Finansal Özet Tablosu</h3>
            <div class="financial-summary-grid">
              <div class="f-box">
                <span class="f-label">Tek Seferlik Uygulama Maliyeti</span>
                <strong class="f-val">€30.000</strong>
              </div>
              <div class="f-box">
                <span class="f-label">Yıllık İşletim Maliyeti</span>
                <strong class="f-val">€10.000</strong>
              </div>
              <div class="f-box highlight">
                <span class="f-label">3 Yıllık Net Kumulatif Fayda</span>
                <strong class="f-val green">€150.000+</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Signatures Footer -->
        <div class="doc-signatures">
          <div class="sig-box">
            <span>Hazırlayan (Task Force Team):</span>
            <strong class="sig-name">Hakan Koçak</strong>
            <span class="sig-role">Lead SAP Architect</span>
          </div>

          <div class="sig-box">
            <span>Müşteri Onayı (Executive Sign-off):</span>
            <strong class="sig-name">{{ customerService.activeCustomer().name }}</strong>
            <span class="sig-role">CIO / Executive Director</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      background: #f9fafb;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .page-title { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
      .page-subtitle { margin: 0.15rem 0 0 0; font-size: 0.8rem; color: #6b7280; }
    }

    .btn-primary {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.78rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;

      &:hover { background: #0369a1; }
    }

    .report-types-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;

      .report-type-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.65rem;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover, &.active {
          border-color: #0284c7;
          background: #f0f9ff;
        }

        .card-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          strong { font-size: 0.78rem; color: #111827; }
          .sub { font-size: 0.65rem; color: #6b7280; }
        }
      }
    }

    /* FULL SCREEN WIDTH DOCUMENT CONTAINER */
    .document-paper.full-screen {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.75rem;
      width: 100%;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #111827;
      padding-bottom: 0.85rem;

      .brand-logo {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .logo-box {
          width: 32px;
          height: 32px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-title { font-size: 1rem; font-weight: 900; color: #111827; letter-spacing: 0.03em; }
        .brand-sub { display: block; font-size: 0.65rem; color: #6b7280; }
      }

      .doc-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-size: 0.68rem;
        color: #6b7280;

        .meta-tag { font-weight: 800; color: #0284c7; font-size: 0.72rem; letter-spacing: 0.05em; }
      }
    }

    .customer-banner {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.85rem 1.1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .c-info {
        display: flex;
        flex-direction: column;
        .label { font-size: 0.62rem; font-weight: 800; color: #9ca3af; letter-spacing: 0.05em; }
        .c-name { font-size: 1.2rem; font-weight: 900; color: #111827; margin: 0.05rem 0; }
        .c-sub { font-size: 0.75rem; color: #4b5563; }
      }

      .c-status {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
        .label { font-size: 0.62rem; font-weight: 800; color: #9ca3af; }
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;

        .kpi-title { font-size: 0.68rem; color: #6b7280; font-weight: 600; }
        .kpi-value { font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0.15rem 0; }
        .kpi-value.green { color: #047857; }
        .kpi-value.red-text { color: #dc2626; }
        .kpi-sub { font-size: 0.65rem; color: #9ca3af; }

        &.highlight { background: #ecfdf5; border-color: #a7f3d0; }
        &.warning-card { background: #fef2f2; border-color: #fecaca; }
      }
    }

    .charts-two-column-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .chart-box.compact {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;

      .bar-chart-row {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;

        .bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          strong { color: #111827; }
          .badge-tag { font-size: 0.62rem; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 0.05rem 0.35rem; border-radius: 4px; }
        }

        .bar-track {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          display: flex;

          .bar-fill {
            height: 100%;
            &.active-fill { background: #0284c7; }
            &.low-fill { background: #f59e0b; }
          }
        }
      }
    }

    .visual-financial-chart.compact {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem;
      height: 150px;

      .f-chart-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3rem;

        .b-val { font-size: 0.75rem; font-weight: 800; }
        .b-val.red { color: #dc2626; }
        .b-val.gray { color: #4b5563; }
        .b-val.green { color: #047857; }
        .b-val.dark-green { color: #065f46; font-weight: 900; }

        .b-pillar {
          width: 36px;
          border-radius: 3px 3px 0 0;

          &.red-pillar { background: #ef4444; }
          &.gray-pillar { background: #9ca3af; }
          &.green-pillar { background: #10b981; }
          &.dark-pillar { background: #047857; }
        }

        .b-tag { font-size: 0.65rem; font-weight: 700; color: #4b5563; }
      }
    }

    /* LICENSE AUDIT REPORT CHARTS STYLING */
    .license-cost-visual {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .cost-item {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;

        .cost-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          strong { color: #111827; }
          span { color: #0284c7; font-weight: 700; }
        }

        .cost-bar-track {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;

          .cost-bar-fill { height: 100%; background: #0284c7; border-radius: 3px; }
        }
      }
    }

    .utilization-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;

      .util-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.65rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        .u-title { font-size: 0.7rem; font-weight: 700; color: #111827; }
        .u-gauge {
          font-size: 0.85rem;
          font-weight: 800;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          margin: 0.25rem 0;

          &.green-gauge { background: #ecfdf5; color: #047857; }
          &.yellow-gauge { background: #fef3c7; color: #d97706; }
        }
        .u-sub { font-size: 0.62rem; color: #6b7280; }
      }
    }

    /* FINANCIAL ROI REPORT CHARTS STYLING */
    .cashflow-growth-chart {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .cf-year-col {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.72rem;

        .cf-year { width: 120px; font-weight: 700; color: #374151; }
        .cf-bar {
          height: 18px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding: 0 0.5rem;
          font-size: 0.65rem;
          font-weight: 800;
          color: #fff;

          &.initial { background: #ef4444; }
          &.positive { background: #10b981; }
          &.highlight { background: #047857; }
        }
      }
    }

    .savings-breakdown-list {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;

      .sb-item {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;

        .sb-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          strong { color: #111827; }
          .green { color: #047857; font-weight: 700; }
          .blue { color: #0284c7; font-weight: 700; }
        }

        .sb-track {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;

          .sb-fill {
            height: 100%;
            &.green-fill { background: #10b981; }
            &.blue-fill { background: #0284c7; }
            &.dark-fill { background: #0f172a; }
          }
        }
      }
    }

    .report-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .section-heading {
        font-size: 0.88rem;
        font-weight: 800;
        color: #111827;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 0.35rem;
      }

      .section-desc { font-size: 0.78rem; color: #4b5563; margin: 0; }
    }

    .finding-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;

      li {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.78rem;
        color: #374151;
        background: #f9fafb;
        padding: 0.5rem 0.65rem;
        border-radius: 6px;
        border: 1px solid #f3f4f6;

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          margin-top: 0.3rem;
          flex-shrink: 0;

          &.primary { background: #0284c7; }
          &.warning { background: #f59e0b; }
          &.info { background: #10b981; }
        }
      }
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;

      th {
        background: #f9fafb;
        padding: 0.5rem 0.65rem;
        text-align: left;
        font-weight: 700;
        color: #4b5563;
        border-bottom: 1px solid #e5e7eb;
      }

      td {
        padding: 0.55rem 0.65rem;
        border-bottom: 1px solid #f3f4f6;
        .red-text { color: #dc2626; font-weight: 700; }
      }
    }

    .financial-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;

      .f-box {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.65rem;
        display: flex;
        flex-direction: column;

        .f-label { font-size: 0.68rem; color: #6b7280; font-weight: 600; }
        .f-val { font-size: 1rem; font-weight: 800; color: #111827; margin-top: 0.1rem; }
        .f-val.green { color: #047857; }

        &.highlight { background: #f0f9ff; border-color: #bae6fd; }
      }
    }

    .doc-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-top: 0.75rem;
      border-top: 1px dashed #d1d5db;
      padding-top: 1rem;

      .sig-box {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        font-size: 0.72rem;
        color: #6b7280;

        .sig-name { font-size: 0.82rem; color: #111827; font-weight: 700; margin-top: 0.4rem; }
        .sig-role { font-size: 0.68rem; color: #0284c7; }
      }
    }

    @media print {
      .print-hide, app-sidebar, app-header { display: none !important; }
      body, .reports-page { background: #ffffff !important; padding: 0 !important; }
      .document-paper { box-shadow: none !important; border: none !important; max-width: 100% !important; padding: 0 !important; }
    }
  `]
})
export class ReportsComponent {
  customerService = inject(CustomerService);
  importService = inject(DataImportService);

  readonly currentDate = new Date().toLocaleDateString('tr-TR');
  selectedReportId = signal<string>('rep-exec');

  availableReports = signal<ReportCategory[]>([
    { id: 'rep-exec', title: 'Yönetici Teklif & İyileştirme Raporu', subtitle: 'Veri Analizi, Görsel Grafikler ve Finansal Özet', icon: 'file-text', type: 'executive', updatedAt: 'Bugün', status: 'Ready' },
    { id: 'rep-license', title: 'SAP Lisans Auditing & Denetim Raporu', subtitle: 'Gereksiz Lisanslar ve Yetki Dağılım Detayı', icon: 'database', type: 'license', updatedAt: 'Bugün', status: 'Ready' },
    { id: 'rep-financial', title: 'Finansal ROI & 3 Yıllık Nakit Akışı', subtitle: 'Maliyet vs Tasarruf Projeksiyon Analizi', icon: 'dollar', type: 'financial', updatedAt: 'Bugün', status: 'Ready' }
  ]);

  getActiveReportTitle(): string {
    return this.availableReports().find(r => r.id === this.selectedReportId())?.title || 'Kurumsal Rapor';
  }

  printActiveReport(): void {
    window.print();
  }
}
