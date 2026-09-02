import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="executive-report-page">
      <!-- Header Banner & Print Actions -->
      <div class="dashboard-header no-print">
        <div class="header-left">
          <div class="badge-row">
            <span class="company-badge">ABC Holding</span>
            <span class="report-type-tag">Executive Summary & Transformation Report</span>
            <span class="date-tag">Eylül 2026</span>
          </div>
          <h1 class="main-title">Yönetici Özeti (Executive Summary)</h1>
          <p class="sub-title">11 Dağınık Sunucu Konsolidasyonu, 70 FUE Lisanslama, 1.3TB HANA Sizing ve 109 PO Canlı Entegrasyon Analizi</p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="refreshScores()">
            <app-icon name="refresh" [size]="16" color="#475569"></app-icon>
            <span>Verileri Yenile</span>
          </button>
          
          <button 
            type="button" 
            class="btn btn-primary btn-pdf-export" 
            (click)="exportToPDF()"
            [disabled]="isExporting()">
            <app-icon [name]="isExporting() ? 'refresh' : 'download'" [size]="16" color="#ffffff"></app-icon>
            <span>{{ isExporting() ? 'PDF Üretiliyor...' : 'Yönetici Raporunu İndir (PDF)' }}</span>
          </button>
        </div>
      </div>

      <!-- MAIN PRINTABLE / EXPORTABLE REPORT CONTAINER -->
      <div class="report-content-container" #reportContainer id="reportContainer">
        <!-- 1. LIGHT & MODERN HERO SCORE CARD (%84 MATCH SKORU) -->
        <div class="hero-score-card">
          <div class="score-ring-section">
            <div class="circular-score-badge">
              <div class="score-number">%84</div>
              <div class="score-label">MATCH SKORU</div>
            </div>

            <div class="score-ring-text">
              <div class="status-pill-green">
                <app-icon name="check" [size]="13" color="#059669"></app-icon>
                <span>RISE WITH SAP GEÇİŞİNE YÜKSEK DERECEDE UYGUN</span>
              </div>
              <h3>ABC Holding Bulut Hazırlık & Dönüşüm Uyumu</h3>
              <p>
                Mevcut SAP altyapısı, fiili kullanıcı profili ve entegrasyon envanteri incelendiğinde; 
                <strong>11 parçalı dağınık On-Premise sunucu yapısının</strong> tek bir S/4HANA Private Cloud veri tabanına konsolide edilmesi ve 
                sözleşme fazlası lisansların <strong>70 FUE</strong> seviyesine optimize edilmesi durumunda şirketiniz 
                <strong>%84 genel bulut uyum skoru</strong> ile dönüşüme tam hazır durumdadır.
              </p>
            </div>
          </div>

          <!-- Pillar Match Breakdown Progress Bars -->
          <div class="pillar-breakdown-grid">
            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="database" [size]="14" color="#0284c7"></app-icon> Altyapı Konsolidasyonu</span>
                <strong class="p-score text-blue">%91</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-blue" style="width: 91%"></div></div>
              <span class="p-desc">11 Dağınık Sunucu ➔ 1 S/4HANA Private Cloud DB</span>
            </div>

            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="users" [size]="14" color="#059669"></app-icon> FUE Lisans Optimizasyonu</span>
                <strong class="p-score text-emerald">%85</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-emerald" style="width: 85%"></div></div>
              <span class="p-desc">83 Aktif Kullanıcı ➔ 70 FUE Lisansı (Sıfır Aşım Riski)</span>
            </div>

            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="bolt" [size]="14" color="#7e22ce"></app-icon> PO Entegrasyon BTP Uyumu</span>
                <strong class="p-score text-purple">%82</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-purple" style="width: 82%"></div></div>
              <span class="p-desc">109 Canlı Servis BTP Integration Suite uyumlu</span>
            </div>

            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="layers" [size]="14" color="#d97706"></app-icon> DVM & Bellek Tasarrufu</span>
                <strong class="p-score text-amber">%78</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-amber" style="width: 78%"></div></div>
              <span class="p-desc">1.311 GiB RAM Hedefi & 336 GiB Disk Azaltımı</span>
            </div>

            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="shield" [size]="14" color="#059669"></app-icon> EoS Destek Riski Eliminasyonu</span>
                <strong class="p-score text-emerald">%100</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-emerald" style="width: 100%"></div></div>
              <span class="p-desc">FES 200 & CS 6.5 (2020 EoS) riski sıfırlanıyor</span>
            </div>
          </div>
        </div>

        <!-- 2. SIX EXECUTIVE KPI METRIC CARDS -->
        <div class="kpi-cards-grid">
          <!-- KPI 1 -->
          <div class="exec-kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Altyapı Konsolidasyonu</span>
              <div class="kpi-icon-box bg-blue"><app-icon name="database" [size]="16" color="#0284c7"></app-icon></div>
            </div>
            <div class="kpi-main-val">11 ➔ 1 Sunucu</div>
            <div class="kpi-sub">%100 SAP Bulut Yönetimli Altyapı</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill red">AS-IS: 11 Sunucu</span>
              <span class="kpi-pill green">Target: 1 Bulut DB</span>
            </div>
          </div>

          <!-- KPI 2 -->
          <div class="exec-kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Önerilen FUE Lisans Paketi</span>
              <div class="kpi-icon-box bg-emerald"><app-icon name="users" [size]="16" color="#059669"></app-icon></div>
            </div>
            <div class="kpi-main-val text-emerald">70 FUE</div>
            <div class="kpi-sub">83 Fiili Kullanıcı İçin Tam Uyumlu</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill green">Sözleşme Fazlası Tasarruf Edildi</span>
            </div>
          </div>

          <!-- KPI 3 -->
          <div class="exec-kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">HANA DB Hedef Boyutu</span>
              <div class="kpi-icon-box bg-cyan"><app-icon name="database" [size]="16" color="#0891b2"></app-icon></div>
            </div>
            <div class="kpi-main-val">1.311 GiB RAM</div>
            <div class="kpi-sub">Başlangıç: 1.405 GiB • 336 GiB Disk Tasarrufu</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill blue">1 TB Prod + 768 GB QA</span>
            </div>
          </div>

          <!-- KPI 4 -->
          <div class="exec-kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Canlı PO Entegrasyonları</span>
              <div class="kpi-icon-box bg-purple"><app-icon name="bolt" [size]="16" color="#7e22ce"></app-icon></div>
            </div>
            <div class="kpi-main-val text-purple">109 Servis</div>
            <div class="kpi-sub">83 Verici (Outbound) • 26 Alıcı (Inbound)</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill purple">BTP Integration Suite Hazır</span>
            </div>
          </div>

          <!-- KPI 5 -->
          <div class="exec-kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">En Büyük Tablolar (DVM)</span>
              <div class="kpi-icon-box bg-amber"><app-icon name="layers" [size]="16" color="#d97706"></app-icon></div>
            </div>
            <div class="kpi-main-val text-amber">30 Kritik Tablo</div>
            <div class="kpi-sub">HANA Belleğinin %92.7'sini Kapsıyor</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill amber">REGUP (308 GB) & ACDOCA</span>
            </div>
          </div>

          <!-- KPI 6 -->
          <div class="exec-kpi-card highlight-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Tahmini Yıllık TCO Tasarrufu</span>
              <div class="kpi-icon-box bg-emerald"><app-icon name="dollar" [size]="16" color="#059669"></app-icon></div>
            </div>
            <div class="kpi-main-val text-emerald">€140.000 / Yıl</div>
            <div class="kpi-sub">Donanım, OS, DB & Lisans Optimizasyonu</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill green">3 Yıllık Net TCO: €420.000</span>
            </div>
          </div>
        </div>

        <!-- 3. DETAILED 4-PILLAR TRANSFORMATION MATRICES -->
        <div class="breakdown-grid-2x2">
          <!-- Matrix 1: AS-IS vs RISE with SAP Altyapı Karşılaştırması -->
          <div class="card-box matrix-card">
            <div class="c-header">
              <div class="c-title-group">
                <app-icon name="database" [size]="16" color="#0284c7"></app-icon>
                <h3>Altyapı Konsolidasyon Matrisi (11 Sunucu ➔ RISE Bulut)</h3>
              </div>
              <a routerLink="/architecture-map" [queryParams]="{ mode: 'asis' }" class="c-link no-print">Detaylı Şema ➔</a>
            </div>

            <table class="mini-table">
              <thead>
                <tr>
                  <th>Mevcut Sistem (AS-IS)</th>
                  <th>Sunucu</th>
                  <th>EoS Durumu</th>
                  <th>RISE with SAP Hedefi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>ERP EHP7 (1503 SFin)</strong></td>
                  <td><span class="badge-red">3 Sunucu</span></td>
                  <td><span class="badge-gray">Aktif</span></td>
                  <td><strong class="text-teal">S/4HANA Private Cloud</strong></td>
                </tr>
                <tr>
                  <td><strong>PO 7.5 (Process Orch.)</strong></td>
                  <td><span class="badge-red">3 Sunucu</span></td>
                  <td><span class="badge-gray">Aktif</span></td>
                  <td><strong class="text-teal">SAP BTP Integration Suite</strong></td>
                </tr>
                <tr>
                  <td><strong>Fiori Front-End (FES 200)</strong></td>
                  <td><span class="badge-red">2 Sunucu</span></td>
                  <td><span class="badge-eos">EoS 2020</span></td>
                  <td><strong class="text-teal">Embedded Fiori Launchpad</strong></td>
                </tr>
                <tr>
                  <td><strong>Content Server (CS 6.5)</strong></td>
                  <td><span class="badge-red">1 Sunucu</span></td>
                  <td><span class="badge-eos">EoS 2020</span></td>
                  <td><strong class="text-teal">SAP Document Management (BTP)</strong></td>
                </tr>
                <tr>
                  <td><strong>Web Dispatcher</strong></td>
                  <td><span class="badge-red">2 Sunucu</span></td>
                  <td><span class="badge-gray">Aktif</span></td>
                  <td><strong class="text-teal">Cloud Connector & BTP Gateway</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Matrix 2: FUE Lisans Dağılımı ve Kullanım Doğrulaması -->
          <div class="card-box matrix-card">
            <div class="c-header">
              <div class="c-title-group">
                <app-icon name="users" [size]="16" color="#059669"></app-icon>
                <h3>FUE Lisanslama & Kullanıcı Doğrulama Matrisi</h3>
              </div>
              <a routerLink="/analytics" class="c-link no-print">Lisans Detayı ➔</a>
            </div>

            <table class="mini-table">
              <thead>
                <tr>
                  <th>Kullanıcı Seviyesi</th>
                  <th>Fiili Kullanıcı</th>
                  <th>FUE Oranı</th>
                  <th>Gereken FUE</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>SAP S/4HANA Cloud Advanced</strong></td>
                  <td>20 Kullanıcı</td>
                  <td>1.0 FUE</td>
                  <td><strong class="text-emerald">20.0 FUE</strong></td>
                  <td><span class="badge-green">Kapsamda</span></td>
                </tr>
                <tr>
                  <td><strong>SAP S/4HANA Cloud Core</strong></td>
                  <td>32 Kullanıcı</td>
                  <td>0.5 FUE</td>
                  <td><strong class="text-emerald">16.0 FUE</strong></td>
                  <td><span class="badge-green">Kapsamda</span></td>
                </tr>
                <tr>
                  <td><strong>SAP S/4HANA Cloud Self-Service</strong></td>
                  <td>340 Kullanıcı</td>
                  <td>0.1 FUE</td>
                  <td><strong class="text-emerald">34.0 FUE</strong></td>
                  <td><span class="badge-green">Kapsamda</span></td>
                </tr>
                <tr class="total-highlight-row">
                  <td><strong>TOPLAM GEREKEN FUE LİSANSI</strong></td>
                  <td><strong>392 Kullanıcı</strong></td>
                  <td>—</td>
                  <td><strong class="text-emerald font-bold">70 FUE</strong></td>
                  <td><span class="badge-green">Optimum Paket</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Matrix 3: HANA DB Sizing & DVM Arşivleme Raporu -->
          <div class="card-box matrix-card">
            <div class="c-header">
              <div class="c-title-group">
                <app-icon name="database" [size]="16" color="#0891b2"></app-icon>
                <h3>HANA Bellek & Disk Boyutlandırma (/SDF/HDB_SIZING)</h3>
              </div>
              <a routerLink="/source-sizing" class="c-link no-print">Sizing Kokpiti ➔</a>
            </div>

            <table class="mini-table">
              <thead>
                <tr>
                  <th>Metrik / Boyut</th>
                  <th>Başlangıç (Initial)</th>
                  <th>DVM Sonrası (Optimized)</th>
                  <th>Elde Edilen Kazanç</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>RAM Bellek Gereksinimi</strong></td>
                  <td>1.405,8 GiB</td>
                  <td><strong class="text-blue">1.311,0 GiB</strong></td>
                  <td><span class="badge-green">94,8 GiB RAM Boşaltıldı</span></td>
                </tr>
                <tr>
                  <td><strong>Disk Boyutu (Data + Log)</strong></td>
                  <td>1.390,0 GiB</td>
                  <td><strong class="text-blue">1.054,0 GiB</strong></td>
                  <td><span class="badge-green">336,0 GiB Disk Tasarrufu</span></td>
                </tr>
                <tr>
                  <td><strong>En Büyük Tablo Hacmi (REGUP)</strong></td>
                  <td>308,6 GiB (%22,7)</td>
                  <td>120,0 GiB</td>
                  <td><span class="badge-green">FI_PAYDATA Arşivleme</span></td>
                </tr>
                <tr>
                  <td><strong>İkinci Büyük Tablo (ACDOCA)</strong></td>
                  <td>168,1 GiB (%12,4)</td>
                  <td>95,0 GiB</td>
                  <td><span class="badge-green">FI_DOCUMNT Arşivleme</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Matrix 4: PO Entegrasyon Listesi & Protokol Dağılımı -->
          <div class="card-box matrix-card">
            <div class="c-header">
              <div class="c-title-group">
                <app-icon name="bolt" [size]="16" color="#7e22ce"></app-icon>
                <h3>PO Canlı Entegrasyon & Adaptör Dağılımı (109 Servis)</h3>
              </div>
              <a routerLink="/architecture-map" [queryParams]="{ mode: 'po' }" class="c-link no-print">Entegrasyon Haritası ➔</a>
            </div>

            <table class="mini-table">
              <thead>
                <tr>
                  <th>Entegrasyon Protokolü</th>
                  <th>Servis Sayısı</th>
                  <th>Akış Yönü</th>
                  <th>BTP Bulut Dönüşüm Durumu</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>SOAP ➔ JDBC (Veritabanı)</strong></td>
                  <td><strong class="text-purple">43 Servis</strong></td>
                  <td>Verici (Outbound)</td>
                  <td><span class="badge-green">Cloud Connector JDBC Uyumlu</span></td>
                </tr>
                <tr>
                  <td><strong>SOAP ➔ SOAP (Web Servisleri)</strong></td>
                  <td><strong class="text-purple">28 Servis</strong></td>
                  <td>Çift Yönlü / Senkron</td>
                  <td><span class="badge-green">BTP Cloud iFlows Hazır</span></td>
                </tr>
                <tr>
                  <td><strong>SOAP ➔ RFC (SAP İçi Çağrılar)</strong></td>
                  <td><strong class="text-purple">18 Servis</strong></td>
                  <td>Senkron (Real-time)</td>
                  <td><span class="badge-green">S/4HANA OData / RFC Uyumlu</span></td>
                </tr>
                <tr>
                  <td><strong>SOAP ➔ REST (Acente & Portallar)</strong></td>
                  <td><strong class="text-purple">10 Servis</strong></td>
                  <td>Alıcı (Inbound)</td>
                  <td><span class="badge-green">BTP API Management Uyumlu</span></td>
                </tr>
                <tr>
                  <td><strong>NFS / SFTP ➔ RFC & File (Ekstre)</strong></td>
                  <td><strong class="text-purple">8 Servis</strong></td>
                  <td>Alıcı (Inbound)</td>
                  <td><span class="badge-green">BTP Secure SFTP Gateway</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. EXECUTIVE ADVISORY & 4-STEP ACTION ROADMAP -->
        <div class="card-box roadmap-card">
          <div class="c-header">
            <div class="c-title-group">
              <app-icon name="sparkles" [size]="18" color="#047857"></app-icon>
              <h3>RISE with SAP Dönüşüm Yol Haritası & Yönetici Tavsiyeleri</h3>
            </div>
            <span class="badge-green">Stratejik Eylem Planı</span>
          </div>

          <div class="roadmap-grid">
            <!-- Step 1 -->
            <div class="roadmap-step">
              <div class="step-num">1</div>
              <div class="step-content">
                <h4>70 FUE Lisans Sözleşmesi</h4>
                <p>Fiili 83 kullanıcı aktivitesi doğrultusunda sözleşme başlangıcında 70 FUE paketi seçilmeli, atıl lisans maliyetleri engellenmelidir.</p>
                <span class="step-benefit">Yıllık €65.000 Lisans Tasarrufu</span>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="roadmap-step">
              <div class="step-num">2</div>
              <div class="step-content">
                <h4>DVM & REGUP Tablo Arşivleme</h4>
                <p>S/4HANA geçişi öncesinde <code>FI_PAYDATA</code> ve <code>FI_DOCUMNT</code> arşivleme projeleri çalıştırılarak 336 GiB disk alanı kazanılmalıdır.</p>
                <span class="step-benefit">336 GiB Disk & 95 GiB RAM Tasarrufu</span>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="roadmap-step">
              <div class="step-num">3</div>
              <div class="step-content">
                <h4>S/4HANA Private Cloud Geçişi</h4>
                <p>Mevcut 11 parçalı altyapı tek bir SAP S/4HANA Private Cloud HANA 2.0 In-Memory veri tabanında birleştirilmeli, EoS riski sıfırlanmalıdır.</p>
                <span class="step-benefit">%40 Performans Artışı & 0 EoS Riski</span>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="roadmap-step">
              <div class="step-num">4</div>
              <div class="step-content">
                <h4>PO ➔ BTP Integration Suite</h4>
                <p>109 canlı entegrasyon servisi SAP BTP Integration Suite bulut standardına taşınarak On-Premise PO sunucu bakım yükü kaldırılmalıdır.</p>
                <span class="step-benefit">16 Entegrasyon Sunucusu Kapatılıyor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .executive-report-page {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    .report-content-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* BUTTONS STYLING */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      outline: none;
      transition: all 0.18s ease-in-out;
      user-select: none;
      white-space: nowrap;
      border: 1px solid transparent;

      &:active {
        transform: scale(0.98);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background: #ffffff;
      color: #334155;
      border-color: #cbd5e1;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      &:hover:not(:disabled) {
        background: #f1f5f9;
        border-color: #94a3b8;
        color: #0f172a;
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      border-color: #0284c7;
      box-shadow: 0 3px 10px rgba(2, 132, 199, 0.28);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
        box-shadow: 0 5px 15px rgba(2, 132, 199, 0.38);
        transform: translateY(-1px);
      }
    }

    .btn-pdf-export {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      border-color: #059669;
      box-shadow: 0 3px 10px rgba(5, 150, 105, 0.28);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #047857 0%, #065f46 100%);
        box-shadow: 0 5px 15px rgba(5, 150, 105, 0.38);
        transform: translateY(-1px);
      }
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
          gap: 0.5rem;

          .company-badge {
            background: #0284c7;
            color: #ffffff;
            font-size: 0.72rem;
            font-weight: 800;
            padding: 0.18rem 0.55rem;
            border-radius: 4px;
            letter-spacing: 0.02em;
          }

          .report-type-tag {
            background: #f0f9ff;
            color: #0369a1;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.18rem 0.55rem;
            border-radius: 4px;
            border: 1px solid #bae6fd;
          }

          .date-tag {
            font-size: 0.7rem;
            color: #64748b;
            font-weight: 600;
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
      }
    }

    /* 1. LIGHT & MODERN HERO SCORE CARD (%84 MATCH) */
    .hero-score-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
      border: 1.5px solid #bae6fd;
      border-radius: 14px;
      padding: 1.75rem;
      box-shadow: 0 8px 24px rgba(2, 132, 199, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      .score-ring-section {
        display: flex;
        align-items: center;
        gap: 1.75rem;
        flex-wrap: wrap;

        .circular-score-badge {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border: 4px solid #0284c7;
          box-shadow: 0 0 20px rgba(2, 132, 199, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          .score-number {
            font-size: 2.1rem;
            font-weight: 900;
            color: #0369a1;
            line-height: 1;
          }

          .score-label {
            font-size: 0.62rem;
            font-weight: 800;
            color: #0284c7;
            letter-spacing: 0.05em;
            margin-top: 0.2rem;
          }
        }

        .score-ring-text {
          flex: 1;
          min-width: 280px;

          .status-pill-green {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
            font-size: 0.72rem;
            font-weight: 800;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            margin-bottom: 0.45rem;
          }

          h3 {
            margin: 0 0 0.4rem 0;
            font-size: 1.25rem;
            font-weight: 800;
            color: #0f172a;
          }

          p {
            margin: 0;
            font-size: 0.84rem;
            color: #475569;
            line-height: 1.5;

            strong { color: #0f172a; }
          }
        }
      }

      .pillar-breakdown-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1.15rem;

        .pillar-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;

          .p-head {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .p-name {
              font-size: 0.74rem;
              font-weight: 700;
              color: #334155;
              display: flex;
              align-items: center;
              gap: 0.35rem;
            }

            .p-score {
              font-size: 0.85rem;
              font-weight: 800;
            }
          }

          .progress-bar {
            height: 7px;
            background: #f1f5f9;
            border-radius: 10px;
            overflow: hidden;

            .progress-fill {
              height: 100%;
              border-radius: 10px;
            }
          }

          .p-desc {
            font-size: 0.67rem;
            color: #64748b;
          }
        }
      }
    }

    /* KPI CARDS (6 GRIDS) */
    .kpi-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;

      .exec-kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.15rem;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        transition: transform 0.15s, box-shadow 0.15s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        }

        &.highlight-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
          border-color: #a7f3d0;
        }

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .kpi-lbl {
            font-size: 0.72rem;
            font-weight: 700;
            color: #64748b;
          }

          .kpi-icon-box {
            width: 28px;
            height: 28px;
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

        .kpi-main-val {
          font-size: 1.25rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.2;
        }

        .kpi-sub {
          font-size: 0.68rem;
          color: #64748b;
        }

        .kpi-tag-row {
          display: flex;
          gap: 0.3rem;
          flex-wrap: wrap;
          margin-top: 0.2rem;

          .kpi-pill {
            font-size: 0.62rem;
            font-weight: 700;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;

            &.red { background: #fee2e2; color: #dc2626; }
            &.green { background: #ecfdf5; color: #047857; }
            &.blue { background: #f0f9ff; color: #0284c7; }
            &.purple { background: #fdf4ff; color: #7e22ce; }
            &.amber { background: #fffbeb; color: #b45309; }
          }
        }
      }
    }

    /* 2x2 BREAKDOWN MATRICES */
    .breakdown-grid-2x2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
      gap: 1.25rem;

      .matrix-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        display: flex;
        flex-direction: column;
        gap: 0.85rem;

        .c-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .c-title-group {
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

          .c-link {
            font-size: 0.72rem;
            font-weight: 700;
            color: #0284c7;
            text-decoration: none;

            &:hover { text-decoration: underline; }
          }
        }
      }
    }

    .mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.74rem;

      th {
        background: #f8fafc;
        color: #475569;
        font-weight: 700;
        padding: 0.5rem 0.65rem;
        text-align: left;
        border-bottom: 2px solid #e2e8f0;
      }

      td {
        padding: 0.55rem 0.65rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      tr.total-highlight-row {
        background: #f0fdf4;
        border-top: 2px solid #a7f3d0;
      }
    }

    /* ROADMAP CARD */
    .roadmap-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .c-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .c-title-group {
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
      }

      .roadmap-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;

        .roadmap-step {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;

          .step-num {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #0284c7;
            color: #ffffff;
            font-weight: 800;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .step-content {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;

            h4 {
              margin: 0;
              font-size: 0.82rem;
              font-weight: 800;
              color: #0f172a;
            }

            p {
              margin: 0;
              font-size: 0.72rem;
              color: #64748b;
              line-height: 1.4;
            }

            .step-benefit {
              font-size: 0.66rem;
              font-weight: 800;
              color: #059669;
              background: #ecfdf5;
              padding: 0.15rem 0.45rem;
              border-radius: 4px;
              display: inline-block;
              margin-top: 0.2rem;
              align-self: flex-start;
            }
          }
        }
      }
    }

    /* BADGES & UTILITIES */
    .badge-red { background: #fee2e2; color: #dc2626; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.65rem; }
    .badge-eos { background: #ef4444; color: #ffffff; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.65rem; }
    .badge-green { background: #ecfdf5; color: #047857; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.65rem; }
    .badge-gray { background: #f1f5f9; color: #475569; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.65rem; }
    
    .text-blue { color: #0284c7; }
    .text-emerald { color: #059669; }
    .text-purple { color: #7e22ce; }
    .text-amber { color: #d97706; }
    .text-teal { color: #0d9488; }
    
    .bg-blue { background: #0284c7; }
    .bg-emerald { background: #10b981; }
    .bg-purple { background: #7e22ce; }
    .bg-amber { background: #f59e0b; }

    /* HIGH RESOLUTION PDF PRINT STYLES */
    @media print {
      body { background: #ffffff !important; }
      .no-print, .sidebar, app-sidebar, .header-actions, .c-link { display: none !important; }
      .executive-report-page { padding: 0 !important; background: #ffffff !important; }
      .hero-score-card { break-inside: avoid; background: #ffffff !important; border: 2px solid #0284c7 !important; }
      .kpi-cards-grid { break-inside: avoid; }
      .breakdown-grid-2x2 { break-inside: avoid; }
      .roadmap-card { break-inside: avoid; }
    }
  `]
})
export class ReportsComponent {
  customerService = inject(CustomerService);
  isExporting = signal<boolean>(false);

  @ViewChild('reportContainer') reportContainer!: ElementRef<HTMLDivElement>;

  async exportToPDF(): Promise<void> {
    if (this.isExporting()) return;
    this.isExporting.set(true);

    try {
      const element = this.reportContainer?.nativeElement || document.getElementById('reportContainer');
      if (!element) {
        window.print();
        this.isExporting.set(false);
        return;
      }

      // Generate canvas from HTML with high scale for crystal clear PDF
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width mm
      const pageHeight = 297; // A4 height mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save('ABC_Holding_Executive_Summary_Report.pdf');
    } catch (error) {
      console.error('PDF export failed, fallback to print:', error);
      window.print();
    } finally {
      this.isExporting.set(false);
    }
  }

  refreshScores(): void {
    // Quick refresh feedback
  }
}
