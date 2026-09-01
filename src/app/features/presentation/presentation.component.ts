import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../core/services/customer.service';
import { DataImportService } from '../../core/services/data-import.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-presentation',
  standalone: true,
  imports: [CommonModule, IconComponent, StatusBadgeComponent],
  template: `
    <div class="report-page">
      <!-- Page Header (Screen Only) -->
      <div class="page-header print-hide">
        <div>
          <h1 class="page-title">
            <app-icon name="file-text" [size]="24" color="#0284c7"></app-icon>
            Müşteri Analiz & İyileştirme Teklif Raporu
          </h1>
          <p class="page-subtitle">Veri Analiz Sonuçlarından Otomatik Üretilen Yönetici Özeti ve İş Durumu Raporu</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-primary" (click)="printReport()">
            <app-icon name="download" [size]="15"></app-icon>
            <span>PDF Raporu İndir / Yazdır</span>
          </button>
        </div>
      </div>

      <!-- Printable Executive Document Paper Frame -->
      <div class="document-paper">
        <!-- Document Header Bar -->
        <div class="doc-header">
          <div class="brand-logo">
            <div class="logo-box">
              <app-icon name="layers" [size]="22" color="#0284c7"></app-icon>
            </div>
            <div>
              <strong class="brand-title">TASK FORCE</strong>
              <span class="brand-sub">SAP Customer Opportunity & Business Case Platform</span>
            </div>
          </div>

          <div class="doc-meta">
            <span class="meta-tag">YÖNETİCİ ÖZET RAPORU</span>
            <span class="meta-date">Tarih: {{ currentDate }}</span>
            <span class="meta-id">Rapor No: TF-2026-{{ customerService.activeCustomer().id }}</span>
          </div>
        </div>

        <!-- Customer Identity Section -->
        <div class="customer-banner">
          <div class="c-info">
            <span class="label">MÜŞTERİ / ŞİRKET</span>
            <h2 class="c-name">{{ customerService.activeCustomer().name }}</h2>
            <span class="c-sub">{{ customerService.activeCustomer().sector }} • {{ customerService.activeCustomer().contactPerson }}</span>
          </div>

          <div class="c-status">
            <span class="label">ANALİZ DURUMU</span>
            <app-status-badge [text]="customerService.activeCustomer().taskForceStatus" type="stage"></app-status-badge>
          </div>
        </div>

        <!-- Key Financial & Operational KPI Cards Grid -->
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

        <!-- Section 1: Executive Summary & Bottlenecks -->
        <div class="report-section">
          <h3 class="section-heading">
            <app-icon name="sparkles" [size]="16" color="#0284c7"></app-icon>
            1. Veri Analizi ve Tespit Edilen Darboğazlar
          </h3>
          <p class="section-desc">
            Yüklenen SAP kullanım verilerinin analizi sonucunda aşağıdaki operasyonel ve lisans verimsizlikleri tespit edilmiştir:
          </p>

          <ul class="finding-list">
            <li>
              <span class="dot primary"></span>
              <div>
                <strong>Atıl Lisans Kullanımı:</strong> Toplam 130 kullanıcı Professional lisans hakkına sahip olup düşük kullanım göstermektedir (€35.000/Yıl potansiyel tasarruf).
              </div>
            </li>
            <li>
              <span class="dot warning"></span>
              <div>
                <strong>Manuel Süreç Yükü:</strong> Finans ve Satınalma departmanlarında aylık 400+ fatura manuel işlenmekte ve yılda 1.200 saat kaybolmaktadır.
              </div>
            </li>
            <li>
              <span class="dot info"></span>
              <div>
                <strong>Mükerrer Onay Adımları:</strong> S/4HANA üzerinde standartlaştırılmamış manuel onay akışları işlem sürelerini 3 kat uzatmaktadır.
              </div>
            </li>
          </ul>
        </div>

        <!-- Section 2: Identified ROI Opportunities -->
        <div class="report-section">
          <h3 class="section-heading">
            <app-icon name="opportunities" [size]="16" color="#0284c7"></app-icon>
            2. Önerilen Task Force Fırsat Paketleri & Çözümler
          </h3>

          <table class="report-table">
            <thead>
              <tr>
                <th>Fırsat / İyileştirme Adı</th>
                <th>Çözüm Kategorisi</th>
                <th>Efor / Değer</th>
                <th>Tahmini Yıllık Tasarruf</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>SAP Lisans Optimizasyonu</strong></td>
                <td>Lisans Yönetimi</td>
                <td><span class="pill green">Quick Win</span></td>
                <td><strong class="green">€35.000 / Yıl</strong></td>
              </tr>
              <tr>
                <td><strong>SAP BTP Process Automation</strong></td>
                <td>Otomasyon & RPA</td>
                <td><span class="pill blue">High Value</span></td>
                <td><strong>€40.000 / Yıl (1.200 Sa)</strong></td>
              </tr>
              <tr>
                <td><strong>Süreç Konsolidasyonu & İyileştirme</strong></td>
                <td>S/4HANA ERP Core</td>
                <td><span class="pill gray">Strategic</span></td>
                <td><strong>€45.000 / Yıl</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 3: Financial Model & 3-Year Cash Flow -->
        <div class="report-section">
          <h3 class="section-heading">
            <app-icon name="dollar" [size]="16" color="#0284c7"></app-icon>
            3. Finansal Model & 3 Yıllık Nakit Akış Özeti
          </h3>

          <div class="financial-summary-grid">
            <div class="f-box">
              <span class="f-label">Tek Seferlik Yatırım</span>
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
    .report-page {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      background: #f9fafb;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
      .page-subtitle { margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #6b7280; }
    }

    .btn-primary {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 0.55rem 1rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;

      &:hover { background: #0369a1; }
    }

    /* Printable Document Paper Styling */
    .document-paper {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 2.25rem;
      max-width: 920px;
      margin: 0 auto;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #111827;
      padding-bottom: 1rem;

      .brand-logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .logo-box {
          width: 36px;
          height: 36px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-title { font-size: 1.1rem; font-weight: 900; color: #111827; letter-spacing: 0.03em; }
        .brand-sub { display: block; font-size: 0.68rem; color: #6b7280; }
      }

      .doc-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-size: 0.72rem;
        color: #6b7280;

        .meta-tag { font-weight: 800; color: #0284c7; font-size: 0.75rem; letter-spacing: 0.05em; }
      }
    }

    .customer-banner {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .c-info {
        display: flex;
        flex-direction: column;
        .label { font-size: 0.65rem; font-weight: 800; color: #9ca3af; letter-spacing: 0.05em; }
        .c-name { font-size: 1.3rem; font-weight: 900; color: #111827; margin: 0.1rem 0; }
        .c-sub { font-size: 0.78rem; color: #4b5563; }
      }

      .c-status {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
        .label { font-size: 0.65rem; font-weight: 800; color: #9ca3af; }
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.85rem;

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.85rem;
        display: flex;
        flex-direction: column;

        .kpi-title { font-size: 0.7rem; color: #6b7280; font-weight: 600; }
        .kpi-value { font-size: 1.3rem; font-weight: 800; color: #111827; margin: 0.2rem 0; }
        .kpi-value.green { color: #047857; }
        .kpi-sub { font-size: 0.68rem; color: #9ca3af; }

        &.highlight { background: #ecfdf5; border-color: #a7f3d0; }
      }
    }

    .report-section {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;

      .section-heading {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111827;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 0.4rem;
      }

      .section-desc { font-size: 0.8rem; color: #4b5563; margin: 0; }
    }

    .finding-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      li {
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
        font-size: 0.8rem;
        color: #374151;
        background: #f9fafb;
        padding: 0.6rem 0.75rem;
        border-radius: 6px;
        border: 1px solid #f3f4f6;

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 0.35rem;
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
      font-size: 0.8rem;

      th {
        background: #f9fafb;
        padding: 0.55rem 0.75rem;
        text-align: left;
        font-weight: 700;
        color: #4b5563;
        border-bottom: 1px solid #e5e7eb;
      }

      td {
        padding: 0.65rem 0.75rem;
        border-bottom: 1px solid #f3f4f6;

        .pill {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;

          &.green { background: #ecfdf5; color: #047857; }
          &.blue { background: #f0f9ff; color: #0284c7; }
          &.gray { background: #f3f4f6; color: #4b5563; }
        }

        .green { color: #047857; }
      }
    }

    .financial-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.85rem;

      .f-box {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;

        .f-label { font-size: 0.7rem; color: #6b7280; font-weight: 600; }
        .f-val { font-size: 1.1rem; font-weight: 800; color: #111827; margin-top: 0.15rem; }
        .f-val.green { color: #047857; }

        &.highlight { background: #f0f9ff; border-color: #bae6fd; }
      }
    }

    .doc-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-top: 1rem;
      border-top: 1px dashed #d1d5db;
      padding-top: 1.25rem;

      .sig-box {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.75rem;
        color: #6b7280;

        .sig-name { font-size: 0.85rem; color: #111827; font-weight: 700; margin-top: 0.5rem; }
        .sig-role { font-size: 0.7rem; color: #0284c7; }
      }
    }

    /* Clean PDF Printing CSS rules */
    @media print {
      .print-hide, app-sidebar, app-header { display: none !important; }
      body, .report-page { background: #ffffff !important; padding: 0 !important; }
      .document-paper { box-shadow: none !important; border: none !important; max-width: 100% !important; padding: 0 !important; }
    }
  `]
})
export class PresentationComponent {
  customerService = inject(CustomerService);
  importService = inject(DataImportService);

  readonly currentDate = new Date().toLocaleDateString('tr-TR');

  printReport(): void {
    window.print();
  }
}
