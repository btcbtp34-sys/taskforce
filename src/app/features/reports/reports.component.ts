import { Component, inject, signal, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
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
            <span class="company-badge">{{ activeCustomerName() }}</span>
            <span class="report-type-tag">Executive Summary & Transformation Report</span>
            <span class="date-tag">Eylül 2026</span>
          </div>
          <h1 class="main-title">Yönetici Özeti (Executive Summary)</h1>
          <p class="sub-title">{{ basisService.hasUploadedData() ? ('Boyutlandırma: ' + ramText() + ' RAM, ' + fueValueText() + ' Lisanslama ve Canlı Entegrasyon Analizi') : 'S/4HANA Dönüşüm Yönetici Özeti ve Boyutlandırma Raporu' }}</p>
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
            [disabled]="isExporting() || !basisService.hasUploadedData()">
            <app-icon [name]="isExporting() ? 'refresh' : 'download'" [size]="16" color="#ffffff"></app-icon>
            <span>{{ isExporting() ? 'PDF Üretiliyor...' : 'Yönetici Raporunu İndir (PDF)' }}</span>
          </button>
        </div>
      </div>

      <!-- EMPTY STATE WHEN NO EXCEL HAS BEEN UPLOADED -->
      <div class="empty-upload-card" *ngIf="!basisService.hasUploadedData()">
        <div class="empty-icon-wrap" style="background: #f1f5f9;">
          <app-icon name="file-text" [size]="32" color="#64748b"></app-icon>
        </div>
        <h3 style="color: #334155;">Veri Yok</h3>
        <p style="color: #64748b;">Yönetici özeti raporu için henüz veri bulunmamaktadır.</p>
      </div>

      <!-- MAIN PRINTABLE / EXPORTABLE REPORT CONTAINER (Only rendered when an Excel is uploaded!) -->
      <div class="report-content-container" #reportContainer id="reportContainer" *ngIf="basisService.hasUploadedData()">
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
              <h3>{{ activeCustomerName() }} Bulut Hazırlık & Dönüşüm Uyumu</h3>
              <p>
                Mevcut SAP altyapısı, fiili kullanıcı profili ve entegrasyon envanteri incelendiğinde; 
                <strong>11 parçalı dağınık On-Premise sunucu yapısının</strong> tek bir S/4HANA Private Cloud veri tabanına konsolide edilmesi ve 
                sözleşme lisanslarının <strong>{{ fueValueText() }}</strong> seviyesine optimize edilmesi durumunda şirketiniz 
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
              <span class="p-desc">{{ usersCountText() }} Aktif Kullanıcı ➔ {{ fueValueText() }} Lisansı (Sıfır Aşım Riski)</span>
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
              <span class="p-desc">{{ ramText() }} RAM Hedefi & {{ diskText() }} Disk Hacmi</span>
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
            <div class="kpi-main-val text-emerald">{{ fueValueText() }}</div>
            <div class="kpi-sub">{{ usersCountText() }} Fiili Kullanıcı İçin Tam Uyumlu</div>
            <div class="tag-row">
              <span class="kpi-pill green">Doğrudan SAP Formülü</span>
            </div>
          </div>

          <!-- KPI 3 -->
          <div class="exec-kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">HANA DB Sizing Boyutu</span>
              <div class="kpi-icon-box bg-cyan"><app-icon name="database" [size]="16" color="#0891b2"></app-icon></div>
            </div>
            <div class="kpi-main-val">{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB }} GiB RAM</div>
            <div class="kpi-sub">Net Disk: {{ basisService.diskDetails()?.initialNetDiskGiB }} GiB • {{ basisService.systemInfo()?.tablesAnalyzed }} Tablo</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill blue">S/4HANA Prod DB: 2,2 TB</span>
            </div>
          </div>

          <!-- KPI 4 -->
          <div class="exec-kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Canlı Sistem & Veritabanı</span>
              <div class="kpi-icon-box bg-purple"><app-icon name="bolt" [size]="16" color="#7e22ce"></app-icon></div>
            </div>
            <div class="kpi-main-val text-purple">{{ basisService.systemInfo()?.dbType }}</div>
            <div class="kpi-sub">SID: {{ basisService.systemInfo()?.sid }} • OS: {{ basisService.systemInfo()?.operatingSystem }}</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill purple">S/4HANA Private Cloud Hazır</span>
            </div>
          </div>

          <!-- KPI 5 -->
          <div class="exec-kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">En Büyük Tablolar (DVM)</span>
              <div class="kpi-icon-box bg-amber"><app-icon name="layers" [size]="16" color="#d97706"></app-icon></div>
            </div>
            <div class="kpi-main-val text-amber">{{ basisService.largestTables().length }} Tablo</div>
            <div class="kpi-sub">En Büyük: {{ topTable1().name }} ({{ topTable1().sizeGiB }} GiB) & {{ topTable2().name }}</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill amber">DVM Yaşam Döngüsü Planlandı</span>
            </div>
          </div>

          <!-- KPI 6 -->
          <div class="exec-kpi-card highlight-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Tahmini Yıllık Lisans & TCO</span>
              <div class="kpi-icon-box bg-emerald"><app-icon name="dollar" [size]="16" color="#059669"></app-icon></div>
            </div>
            <div class="kpi-main-val text-emerald">{{ fueValueText() }} Paketi</div>
            <div class="kpi-sub">Atıl Lisans Optimizasyonu ve Konsolidasyon</div>
            <div class="kpi-tag-row">
              <span class="kpi-pill green">Tam Formül / Sıfır Aşım Riski</span>
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
                <h3>Altyapı Konsolidasyon Matrisi (Source ➔ Target Sizing)</h3>
              </div>
              <a routerLink="/source-sizing" class="c-link no-print">Sizing Kokpiti ➔</a>
            </div>

            <table class="mini-table">
              <thead>
                <tr>
                  <th>Bileşen (Component)</th>
                  <th>Mevcut (Current)</th>
                  <th>Hedef (Target S/4HANA)</th>
                  <th>Açıklama</th>
                </tr>
              </thead>
              <tbody>
                @for (item of basisService.sizingMatrix(); track item.product) {
                  <tr>
                    <td><strong>{{ item.product }}</strong></td>
                    <td><span class="badge-red">{{ item.current }}</span></td>
                    <td><strong class="text-teal">{{ item.target }}</strong></td>
                    <td class="text-muted">{{ item.description }}</td>
                  </tr>
                }
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
                  <th>Hesaplanan FUE</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>HB Professional Use</strong></td>
                  <td>{{ hbCount() }} Kullanıcı</td>
                  <td>1.0 FUE</td>
                  <td><strong class="text-emerald">{{ hbCount() }}.0 FUE</strong></td>
                  <td><span class="badge-green">Kapsamda</span></td>
                </tr>
                <tr>
                  <td><strong>HC Functional Use</strong></td>
                  <td>{{ hcCount() }} Kullanıcı</td>
                  <td>0.2 FUE (5:1)</td>
                  <td><strong class="text-emerald">{{ (hcCount() / 5).toFixed(1) }} FUE</strong></td>
                  <td><span class="badge-green">Kapsamda</span></td>
                </tr>
                <tr>
                  <td><strong>HD Productivity Use</strong></td>
                  <td>{{ hdCount() }} Kullanıcı</td>
                  <td>0.033 FUE (30:1)</td>
                  <td><strong class="text-emerald">{{ (hdCount() / 30).toFixed(2) }} FUE</strong></td>
                  <td><span class="badge-green">Kapsamda</span></td>
                </tr>
                <tr class="total-highlight-row">
                  <td><strong>TOPLAM GEREKEN FUE LİSANSI</strong></td>
                  <td><strong>{{ usersCountText() }} Kullanıcı</strong></td>
                  <td>—</td>
                  <td><strong class="text-emerald font-bold">{{ fueValueText() }}</strong></td>
                  <td><span class="badge-green">Doğrudan SAP Formülü</span></td>
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
                  <th>Değer (GiB)</th>
                  <th>Açıklama / Durum</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Anticipated Initial RAM</strong></td>
                  <td><strong class="text-blue">{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB }} GiB</strong></td>
                  <td>Column Loadable ({{ basisService.memoryDetails()?.columnLoadable }} GiB) + Workspace ({{ basisService.memoryDetails()?.workSpace }} GiB)</td>
                </tr>
                <tr>
                  <td><strong>Initial Net Disk Size</strong></td>
                  <td><strong class="text-blue">{{ basisService.diskDetails()?.initialNetDiskGiB }} GiB</strong></td>
                  <td>LOB, NSE Cache ve sıkıştırma sonrası net disk ihtiyacı</td>
                </tr>
                <tr>
                  <td><strong>En Büyük Tablo ({{ topTable1().name }})</strong></td>
                  <td>{{ topTable1().sizeGiB }} GiB</td>
                  <td><span class="badge-green">{{ topTable1().recommendation }}</span></td>
                </tr>
                <tr>
                  <td><strong>İkinci Büyük Tablo ({{ topTable2().name }})</strong></td>
                  <td>{{ topTable2().sizeGiB }} GiB</td>
                  <td><span class="badge-green">{{ topTable2().recommendation }}</span></td>
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
                <h4>{{ fueValueText() }} Lisans Sözleşmesi</h4>
                <p>Fiili {{ usersCountText() }} kullanıcı aktivitesi ve SAP standart formülü (HB + HC/5 + HD/30) doğrultusunda {{ fueValueText() }} paketi seçilmeli, atıl lisans maliyetleri engellenmelidir.</p>
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
  basisService = inject(BasisSizingService);
  isExporting = signal<boolean>(false);

  activeCustomerName = computed(() => this.customerService.activeCustomer()?.name || 'T***A');

  fueValueText = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return `${Math.round(this.basisService.fueSummary()!.calculatedFUE)} FUE`;
    }
    return '—';
  });

  usersCountText = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return `${this.basisService.fueSummary()!.totalUsers}`;
    }
    return '0';
  });

  ramText = computed(() => {
    const mem = this.basisService.memoryDetails();
    return mem ? `${Math.round(mem.anticipatedInitialMemoryGiB)} GiB` : '—';
  });

  diskText = computed(() => {
    const d = this.basisService.diskDetails();
    return d ? `${Math.round(d.initialNetDiskGiB)} GiB` : '—';
  });

  topTable1 = computed(() => {
    const list = this.basisService.largestTables();
    return (list && list.length > 0) ? list[0] : { name: '—', sizeGiB: 0, recommendation: '—' };
  });

  topTable2 = computed(() => {
    const list = this.basisService.largestTables();
    return (list && list.length > 1) ? list[1] : { name: '—', sizeGiB: 0, recommendation: '—' };
  });

  hbCount = computed(() => this.basisService.fueSummary()?.hbCount ?? 0);
  hcCount = computed(() => this.basisService.fueSummary()?.hcCount ?? 0);
  hdCount = computed(() => this.basisService.fueSummary()?.hdCount ?? 0);

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
