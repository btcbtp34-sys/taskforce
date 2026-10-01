import { Component, inject, signal, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuickToolsService } from '../../../core/services/quick-tools.service';
import { CustomerService } from '../../../core/services/customer.service';
import { BasisSizingService } from '../../../core/services/basis-sizing.service';
import { NotesService } from '../../../core/services/notes.service';
import { ModullerService } from '../../../core/services/moduller.service';
import { IconComponent } from '../icon/icon.component';
import { 
  DEFAULT_CUSTOM_CODE_ITEMS, 
  CustomCodeItem 
} from '../../../features/development/development.component';
import { 
  getDefaultExecutiveData, 
  ExecutiveSummaryData 
} from '../../../features/reports/reports.component';
import { 
  getDefaultMethodCards, 
  getDefaultRecommendedData, 
  MethodCardData, 
  RecommendedMethodData 
} from '../../../features/solution-proposal/solution-proposal.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportMenuItem {
  id: string;
  name: string;
  group: string;
  desc: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-quick-pdf-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    @if (quickToolsService.isPdfExportOpen()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-left">
              <div class="icon-circle">
                <app-icon name="download" [size]="20" color="#0284c7"></app-icon>
              </div>
              <div>
                <h3>Rapor İndir (PDF) - Kapsamlı Menü & Sayfa Seçimi</h3>
                <span class="sub-text">
                  <strong>{{ customerService.activeCustomer().name }}</strong> için PDF dokümanına dahil edilecek tüm menü ve sayfaları seçiniz.
                </span>
              </div>
            </div>
            <button class="btn-close" (click)="close()" title="Kapat">
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <!-- Selection Controls Bar -->
          <div class="controls-bar">
            <div class="status-summary">
              <span class="badge-count">{{ selectedCount() }} / {{ menuItems.length }} Menü & Sayfa Seçildi</span>
              <span class="sub-lead">Tüm sayfalar, canlı tablolar, mimari şemalar ve geçiş yöntemleri eksiksiz tek bir PDF'te birleştirilir.</span>
            </div>

            <div class="btn-group-quick">
              <button class="btn-quick" (click)="selectAll()">
                <app-icon name="check" [size]="13"></app-icon>
                <span>Tümünü Seç</span>
              </button>
              <button class="btn-quick" (click)="deselectAll()">
                <app-icon name="x" [size]="13"></app-icon>
                <span>Temizle</span>
              </button>
            </div>
          </div>

          <!-- Menu Checkbox List -->
          <div class="menu-list-container">
            <div class="menu-grid">
              @for (item of menuItems; track item.id) {
                <label class="menu-checkbox-card" [class.checked]="item.selected">
                  <div class="checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="item.selected" 
                      (change)="onSelectionChange()" 
                    />
                  </div>
                  <div class="menu-icon-box">
                    <app-icon [name]="item.icon" [size]="17" [color]="item.selected ? '#0284c7' : '#64748b'"></app-icon>
                  </div>
                  <div class="menu-details">
                    <div class="menu-group-tag">{{ item.group }}</div>
                    <strong class="menu-name">{{ item.name }}</strong>
                    <p class="menu-desc">{{ item.desc }}</p>
                  </div>
                </label>
              }
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <div class="footer-left">
              <span class="footer-tip">
                <app-icon name="info" [size]="14" color="#0284c7"></app-icon>
                Her sayfa, yüksek çözünürlüklü A4 formatında vektörel netlikte ve sayfa kırılımları korunarak derlenir.
              </span>
            </div>

            <div class="footer-actions">
              <button class="btn-cancel" (click)="close()" [disabled]="isExporting()">Vazgeç</button>
              <button 
                class="btn-export" 
                [disabled]="selectedCount() === 0 || isExporting()" 
                (click)="generateMultiMenuPdf()">
                <app-icon name="download" [size]="16" color="#ffffff"></app-icon>
                <span>Tüm Seçilen Sayfaları PDF İndir ({{ selectedCount() }})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- FULL SCREEN EXPORT PROGRESS OVERLAY (Visible during rendering) -->
    <div class="pdf-exporting-overlay" *ngIf="isExporting()">
      <div class="exporting-card">
        <div class="spinner-pulse"></div>
        <h3>Kapsamlı PDF Dokümanı Hazırlanıyor</h3>
        <p class="export-status-text">{{ exportProgress() }}</p>
        <div class="export-progress-bar">
          <div class="progress-bar-fill" [style.width]="exportPercent() + '%'"></div>
        </div>
        <span class="export-hint">Seçilen tüm menüler, canlı tablolar, grafikler ve mimari çizimler taranıyor. Lütfen bekleyiniz...</span>
      </div>
    </div>

    <!-- HIGH-RES TEMPLATE RENDERED IN DOM FOR FLAWLESS HTML2CANVAS CONVERSION -->
    <div class="hidden-pdf-document-wrapper" *ngIf="isExporting()">
      <div class="pdf-export-container" #exportContainer id="multiMenuPdfContainer">
        
        <!-- ========================================================================= -->
        <!-- COVER / TITLE SECTION                                                     -->
        <!-- ========================================================================= -->
        <div class="pdf-page pdf-cover-page">
          <div class="cover-top-bar">
            <div class="brand">
              <app-icon name="layers" [size]="24" color="#0284c7"></app-icon>
              <span>TASK FORCE • SAP Opportunity Engine</span>
            </div>
            <div class="cover-date">{{ currentDateStr }}</div>
          </div>

          <div class="cover-body">
            <div class="report-badge">KAPSAMLI KURUMSAL DÖNÜŞÜM & ANALİZ RAPORU</div>
            <h1 class="cover-title">{{ customerService.activeCustomer().name }}</h1>
            <h2 class="cover-sub">RISE with SAP S/4HANA Hazırlık, Sistem Mimarisi, Geçiş Yöntemleri ve Maliyet Değerlendirmesi</h2>

            <div class="cover-meta-grid">
              <div class="meta-item">
                <span class="m-lbl">Müşteri / Kurum:</span>
                <strong class="m-val">{{ customerService.activeCustomer().name }}</strong>
              </div>
              <div class="meta-item">
                <span class="m-lbl">Sektör / İş Alanı:</span>
                <strong class="m-val">{{ customerService.activeCustomer().sector || 'Kurumsal Üretim & Sanayi' }}</strong>
              </div>
              <div class="meta-item">
                <span class="m-lbl">SAP Kullanıcı Sayısı:</span>
                <strong class="m-val">{{ customerService.activeCustomer().sapUserCount }} Kullanıcı</strong>
              </div>
              <div class="meta-item">
                <span class="m-lbl">Mevcut Veritabanı:</span>
                <strong class="m-val">{{ basisService.systemInfo()?.dbType || 'Oracle / MS SQL' }} ({{ basisService.systemInfo()?.diskSizeGiB || 1250 }} GB)</strong>
              </div>
              <div class="meta-item">
                <span class="m-lbl">Dönüşüm Modeli:</span>
                <strong class="m-val">RISE with SAP Private Cloud Edition (PCE)</strong>
              </div>
              <div class="meta-item">
                <span class="m-lbl">Hedef ERP Sürümü:</span>
                <strong class="m-val">SAP S/4HANA Cloud, Private Edition</strong>
              </div>
            </div>

            <!-- Table of Contents of selected items -->
            <div class="toc-box">
              <div class="toc-title">RAPOR KAPSAMI VE SEÇİLEN MENÜ SAYFALARI ({{ selectedCount() }})</div>
              <div class="toc-items">
                @for (item of selectedItems(); track item.id; let idx = $index) {
                  <div class="toc-line">
                    <span class="toc-num">{{ idx + 1 }}.</span>
                    <span class="toc-name">{{ item.name }}</span>
                    <span class="toc-group">[{{ item.group }}]</span>
                    <span class="toc-dots">....................................................................................................</span>
                    <span class="toc-badge">DAHİL</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="cover-footer">
            <span>Bu rapor TASK FORCE SAP Analiz Motoru tarafından müşteri özel verilerine dayanılarak otomatik oluşturulmuştur.</span>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- 1. YÖNETİCİ ÖZETİ                                                         -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('reports')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">1. YÖNETİCİ ÖZETİ & DÖNÜŞÜM VİZYONU</div>
              <div class="sb-meta">RISE with SAP Uyumu, 8 Stratejik Amaç ve 4 Dönüşüm Metodolojisi</div>
            </div>

            <div class="section-content-box">
              <!-- Hero Score Card -->
              <div class="hero-score-card-pdf">
                <div class="hsc-left">
                  <div class="circular-score-badge-pdf">
                    <div class="score-number">%{{ getExecutiveData().heroScore?.matchScore || 84 }}</div>
                    <div class="score-label">{{ getExecutiveData().heroScore?.matchLabel || 'MATCH SKORU' }}</div>
                  </div>
                  <div class="score-text-pdf">
                    <div class="status-pill-green-pdf">✓ {{ getExecutiveData().heroScore?.badgeText || 'RISE WITH SAP GEÇİŞİNE YÜKSEK DERECEDE UYGUN' }}</div>
                    <h3>{{ getExecutiveData().heroScore?.title || (customerService.activeCustomer().name + ' RISE Readiness & Bulut Uyum Analizi') }}</h3>
                    <p>{{ getExecutiveData().heroScore?.description }}</p>
                  </div>
                </div>

                <!-- 5 Pillar Status Bars (NO percentages displayed as requested) -->
                <div class="pillar-grid-pdf">
                  @for (pillar of getExecutiveData().heroScore?.pillars; track pillar.id) {
                    <div class="pillar-card-pdf">
                      <div class="p-head-pdf">
                        <span class="p-name-pdf">
                          <app-icon [name]="pillar.icon" [size]="14" [color]="getPillarColor(pillar.colorClass)"></app-icon>
                          {{ pillar.name }}
                        </span>
                      </div>
                      <div class="progress-bar-pdf">
                        <div class="progress-fill-pdf" [ngClass]="'bg-' + pillar.colorClass" [style.width.%]="pillar.score"></div>
                      </div>
                      <span class="p-desc-pdf">{{ pillar.desc }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- 1. Amaç: RISE with SAP ile Kurumsal Dönüşüm (Tüm 8 Sütun) -->
              <div class="sub-block-title" style="margin-top: 15px;">
                <app-icon name="sparkles" [size]="15" color="#059669"></app-icon>
                <span>{{ getExecutiveData().objectiveTitle }}</span>
              </div>
              <p class="section-p">{{ getExecutiveData().objectiveSubtitle }}</p>

              <div class="purpose-grid-pdf">
                @for (item of getExecutiveData().objectivePillars; track item.id) {
                  <div class="purpose-card-pdf">
                    <div class="pc-icon">
                      <app-icon [name]="item.icon" [size]="16" color="#0284c7"></app-icon>
                    </div>
                    <div class="pc-body">
                      <h4>{{ item.title }}</h4>
                      <p>{{ item.desc }}</p>
                    </div>
                  </div>
                }
              </div>

              <!-- 2. Nasıl Yapıyoruz? Kanıtlanmış 4 Aşamalı Dönüşüm Metodolojisi -->
              <div class="sub-block-title" style="margin-top: 20px;">
                <app-icon name="map" [size]="15" color="#7c3aed"></app-icon>
                <span>{{ getExecutiveData().howTitle }}</span>
              </div>
              <p class="section-p">{{ getExecutiveData().howSubtitle }}</p>

              <div class="how-grid-pdf">
                @for (item of getExecutiveData().howPillars; track item.id) {
                  <div class="how-card-pdf">
                    <div class="hc-head">
                      <span class="hc-badge">{{ item.badge }}</span>
                      <h4>{{ item.title }}</h4>
                    </div>
                    <ul class="hc-bullets">
                      @for (b of item.bullets; track b) {
                        <li><span class="bullet-dot">•</span> {{ b }}</li>
                      }
                    </ul>
                    <div class="hc-foot">{{ item.note }}</div>
                  </div>
                }
              </div>

              <!-- 3. Önerilen Geçiş Yöntemi Hero Kartı -->
              <div class="hero-recommendation-card-pdf" style="margin-top: 15px;">
                <div class="hr-left">
                  <span class="hr-pill">{{ getExecutiveData().recommendedMethod?.badge || getRecommendedData().badge }}</span>
                  <h2>{{ getExecutiveData().recommendedMethod?.title || getRecommendedData().title }}</h2>
                  <p>{{ getExecutiveData().recommendedMethod?.description || getRecommendedData().description }}</p>
                </div>
                <div class="hr-stats">
                  <div class="stat-box-pdf">
                    <span class="sb-val text-emerald">{{ getExecutiveData().recommendedMethod?.stat1Value || getRecommendedData().stat1Value }}</span>
                    <span class="sb-lbl">{{ getExecutiveData().recommendedMethod?.stat1Label || getRecommendedData().stat1Label }}</span>
                  </div>
                  <div class="stat-box-pdf">
                    <span class="sb-val text-blue">{{ getExecutiveData().recommendedMethod?.stat2Value || getRecommendedData().stat2Value }}</span>
                    <span class="sb-lbl">{{ getExecutiveData().recommendedMethod?.stat2Label || getRecommendedData().stat2Label }}</span>
                  </div>
                  <div class="stat-box-pdf">
                    <span class="sb-val text-purple">{{ getExecutiveData().recommendedMethod?.stat3Value || getRecommendedData().stat3Value }}</span>
                    <span class="sb-lbl">{{ getExecutiveData().recommendedMethod?.stat3Label || getRecommendedData().stat3Label }}</span>
                  </div>
                </div>
              </div>

              <!-- Presales Değerlendirme Notları -->
              @if (getExecutiveData().salesNotes) {
                <div class="sales-notes-box-pdf" style="margin-top: 15px;">
                  <h4>Presales & Satış Strateji Değerlendirmesi:</h4>
                  <p>{{ getExecutiveData().salesNotes }}</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 2. SAP UYGULAMALARI - BULGULARIMIZ                                        -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('modules-summary')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">2. SAP UYGULAMALARI - BULGULARIMIZ</div>
              <div class="sb-meta">Modül Kullanım Oranları, Önem Derecesi ve Süreç Kazanımları</div>
            </div>

            <div class="section-content-box">
              <div class="analysis-card">
                <h3>Genel Modül Durumu & Tespit Edilen Bulgular</h3>
                <p>Aktif SAP ERP sistemindeki işlem hacimleri ve kullanıcı rolleri incelendiğinde; Finans (FI/CO), Satış (SD) ve Satınalma/Stok (MM) operasyon omurgasını oluşturmaktadır. Clean Core prensipleri ile iş süreçlerinin standartlaştırılması hedeflenmektedir.</p>
                <div class="module-stat-row">
                  <div class="m-pill"><strong>FI/CO:</strong> %94 Kullanım Oranı • Standarda Uyumlu</div>
                  <div class="m-pill"><strong>SD:</strong> %88 Kullanım Oranı • Entegrasyon Yoğun</div>
                  <div class="m-pill"><strong>MM/PP:</strong> %82 Kullanım Oranı • MRP Live ile Hızlanacak</div>
                  <div class="m-pill"><strong>QM/PM:</strong> %74 Kullanım Oranı • Fiori ile Mobil Uyumlu</div>
                </div>
              </div>

              <!-- Severity Breakdown -->
              <div class="kpi-mini-grid" style="margin-top: 15px;">
                <div class="kpi-box">
                  <span class="k-label">Toplam İncelenen Kart</span>
                  <strong class="k-val">{{ modullerService.cards().length }} Adet</strong>
                  <span class="k-sub">Bulgu & Analiz</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Kritik Seviye</span>
                  <strong class="k-val text-red">{{ getSeverityCount('Kritik') }} Adet</strong>
                  <span class="k-sub">Öncelikli Eylem</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Yüksek Seviye</span>
                  <strong class="k-val text-amber">{{ getSeverityCount('Yüksek') }} Adet</strong>
                  <span class="k-sub">İyileştirme Fırsatı</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Standart / Önerilen</span>
                  <strong class="k-val text-emerald">{{ getSeverityCount('Orta') + getSeverityCount('Düşük') }} Adet</strong>
                  <span class="k-sub">S/4HANA Hazır</span>
                </div>
              </div>

              <!-- Module Cards Summary -->
              <div class="table-wrap" style="margin-top: 15px;">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Modül / Kategori</th>
                      <th>Bulgu Başlığı</th>
                      <th>Önem Seviyesi</th>
                      <th>Durum</th>
                      <th>Temel Bulgular & Notlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (card of getTopModuleCards(8); track card.id) {
                      <tr>
                        <td><strong>{{ card.category }}</strong></td>
                        <td>{{ card.title }}</td>
                        <td>
                          <span class="risk-pill" [ngClass]="card.severity === 'Kritik' ? 'red' : card.severity === 'Yüksek' ? 'amber' : 'blue'">
                            {{ card.severity }}
                          </span>
                        </td>
                        <td>{{ card.status }}</td>
                        <td>{{ card.bullets && card.bullets.length > 0 ? card.bullets[0] : (card.footerNote || '—') }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 3. SAP UYGULAMALARI - DETAYLI ANALİZ                                      -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('modules-detail')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">3. SAP UYGULAMALARI - DETAYLI MODÜLER SÜREÇ ANALİZİ</div>
              <div class="sb-meta">Süreç Kırılımları, İşlem Hacimleri ve S/4HANA Dönüşüm Çözümleri</div>
            </div>

            <div class="section-content-box">
              <div class="table-wrap">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Modül</th>
                      <th>Kullanıcı Sayısı</th>
                      <th>İşlem Hacmi (Aylık)</th>
                      <th>Tespit Edilen Darboğaz</th>
                      <th>S/4HANA Çözüm Önerisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>FI - Mali İşler & Genel Muhasebe</strong></td>
                      <td>120 Kullanıcı</td>
                      <td>45.000 Kayıt</td>
                      <td>Dönem sonu kapanışlarında manuel mutabakat yükü</td>
                      <td>Universal Journal (ACDOCA) & Otomatik Kapanış Cockpit</td>
                    </tr>
                    <tr>
                      <td><strong>CO - Masraf Yeri & Karlılık (CO-PA)</strong></td>
                      <td>45 Kullanıcı</td>
                      <td>28.000 Kayıt</td>
                      <td>Maliyet dağıtımı hesaplamalarında gece batch gecikmeleri</td>
                      <td>HANA Gerçek Zamanlı Karlılık Analizi (Account-based CO-PA)</td>
                    </tr>
                    <tr>
                      <td><strong>MM - Malzeme Yönetimi & Satınalma</strong></td>
                      <td>160 Kullanıcı</td>
                      <td>85.000 Kayıt</td>
                      <td>Stok devir hızı ve onay darboğazı</td>
                      <td>MRP Live & Otomatik Satınalma Sipariş Yönetimi (Fiori)</td>
                    </tr>
                    <tr>
                      <td><strong>SD - Satış Dağıtım & Sevkiyat</strong></td>
                      <td>190 Kullanıcı</td>
                      <td>110.000 Kayıt</td>
                      <td>B2B entegrasyonlarında batch bekleme süreleri</td>
                      <td>API Tabanlı Sipariş Karşılama & Gelişmiş ATP (aATP)</td>
                    </tr>
                    <tr>
                      <td><strong>PP - Üretim Planlama & Kontrol</strong></td>
                      <td>75 Kullanıcı</td>
                      <td>35.000 Kayıt</td>
                      <td>Kapasite planlama ve üretim çizelgeleme zorlukları</td>
                      <td>PP/DS (Production Planning and Detailed Scheduling)</td>
                    </tr>
                    <tr>
                      <td><strong>QM - Kalite Yönetimi</strong></td>
                      <td>40 Kullanıcı</td>
                      <td>18.000 Kayıt</td>
                      <td>Kağıt tabanlı kalite onayları ve denetim takibi</td>
                      <td>Mobil Kalite Kontrol Fiori Uygulamaları & Dijital İmzalar</td>
                    </tr>
                    <tr>
                      <td><strong>PM - Bakım Onarım Yönetimi</strong></td>
                      <td>35 Kullanıcı</td>
                      <td>12.000 Kayıt</td>
                      <td>Arıza bildirimlerinde sahadan gecikmeli kayıt girişi</td>
                      <td>SAP Service and Asset Manager & Kestirimci Bakım</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 4. GELİŞTİRMELER (CUSTOM CODE - 10 NESNE TİPİ)                             -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('development')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">4. SAP GELİŞTİRMELERİ & CLEAN CORE UYUMU (CUSTOM CODE)</div>
              <div class="sb-meta">10 Nesne Tipi, Z-Programlar, Custom Tablolar ve Uyarlama Eforları</div>
            </div>

            <div class="section-content-box">
              <div class="kpi-mini-grid">
                <div class="kpi-box">
                  <span class="k-label">Toplam Z/Y Nesnesi</span>
                  <strong class="k-val">1.240 Adet</strong>
                  <span class="k-sub">Aktif Custom Kod</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Atıl / Kullanılmayan Kod</span>
                  <strong class="k-val text-emerald">%38</strong>
                  <span class="k-sub">Doğrudan Temizlenebilir</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Standarda Dönüştürülebilir</span>
                  <strong class="k-val text-blue">410 Adet</strong>
                  <span class="k-sub">S/4HANA Standart Süreci</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">BTP Clean Core Adayı</span>
                  <strong class="k-val text-purple">125 Adet</strong>
                  <span class="k-sub">Side-by-Side Genişletme</span>
                </div>
              </div>

              <!-- 10 Custom Code Objects Table -->
              <div class="table-wrap" style="margin-top: 15px;">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Nesne Tipi</th>
                      <th>Kategori</th>
                      <th>Mevcut Adet</th>
                      <th>Risk Seviyesi</th>
                      <th>S/4HANA Clean Core Stratejisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of getCustomCodeItems(); track item.id) {
                      <tr>
                        <td><strong>{{ item.name }}</strong></td>
                        <td>{{ item.category }}</td>
                        <td><strong>{{ item.count }} Adet</strong></td>
                        <td>
                          <span class="risk-pill" [ngClass]="item.level === 'Yüksek' ? 'red' : item.level === 'Orta' ? 'amber' : 'blue'">
                            {{ item.level }}
                          </span>
                        </td>
                        <td>{{ item.s4Recommendation }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 5. ENTEGRASYON MİMARİSİ (PO / BTP INTEGRATION SUITE)                       -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('architecture-po')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">5. ENTEGRASYON MİMARİSİ (SAP PO & BTP INTEGRATION SUITE)</div>
              <div class="sb-meta">Entegrasyon Akış Topolojisi, Canlı Arayüzler ve Bulut Dönüşümü</div>
            </div>

            <div class="section-content-box">
              <div class="analysis-card">
                <h3>SAP Process Orchestration (PO) ➔ Integration Suite Geçişi</h3>
                <p>SAP PO desteğinin 2027 sonunda sonlanması ile birlikte mevcut canlı entegrasyonlar modernize edilmektedir. Migration Assessment aracı ile arayüzler analiz edilmiş ve SAP Integration Suite (BTP) taşıma haritası oluşturulmuştur.</p>
                <div class="module-stat-row">
                  <div class="m-pill"><strong>Canlı Arayüz Sayısı:</strong> 48 Aktif Servis</div>
                  <div class="m-pill"><strong>BTP Uyum Oranı:</strong> %92 Doğrudan Taşınabilir</div>
                  <div class="m-pill"><strong>Destek Sonu (EoS):</strong> 31 Aralık 2027</div>
                </div>
              </div>

              <!-- VISUAL PO / BTP INTEGRATION TOPOLOGY DIAGRAM -->
              <div class="arch-schematic-card" style="margin-top: 15px;">
                <div class="schematic-title">
                  <app-icon name="bolt" [size]="14" color="#0284c7"></app-icon>
                  <span>SAP PO / BTP Entegrasyon Akış Topolojisi Şeması</span>
                </div>

                <div class="integration-topology-flow">
                  <!-- Source Column -->
                  <div class="flow-col source-col">
                    <div class="col-head">Dış / Kaynak Sistemler</div>
                    <div class="flow-box">Satış & CRM (Salesforce / Web)</div>
                    <div class="flow-box">B2B Portalleri & Mobil</div>
                    <div class="flow-box">Banka Entegrasyonları (MT940)</div>
                    <div class="flow-box">GİB e-Fatura / e-Defter</div>
                    <div class="flow-box">Lojistik, WMS & MES</div>
                  </div>

                  <!-- Connector Arrow -->
                  <div class="flow-arrow-col">
                    <span class="proto-tag">REST / SOAP</span>
                    <span class="arr-icon">➔</span>
                    <span class="proto-tag">RFC / SFTP</span>
                  </div>

                  <!-- Integration Hub Column -->
                  <div class="flow-col hub-col">
                    <div class="col-head">Merkezi Entegrasyon Katmanı</div>
                    <div class="hub-main-box">
                      <div class="hub-title">SAP Process Orchestration (PO 7.5)</div>
                      <div class="hub-sub">Mevcut Çift Yığın (Dual-Stack) Altyapı</div>
                      <div class="hub-mig-badge">➔ SAP Integration Suite (BTP)</div>
                      <div class="hub-desc">Cloud Integration • Open Connectors • API Management • Event Mesh</div>
                    </div>
                  </div>

                  <!-- Connector Arrow -->
                  <div class="flow-arrow-col">
                    <span class="proto-tag">OData / HTTPS</span>
                    <span class="arr-icon">➔</span>
                    <span class="proto-tag">Cloud Connector</span>
                  </div>

                  <!-- Target Core Column -->
                  <div class="flow-col target-col">
                    <div class="col-head">Hedef Dijital Çekirdek</div>
                    <div class="flow-box core-box">RISE with SAP S/4HANA PCE</div>
                    <div class="flow-box">SAP Analytics Cloud (SAC)</div>
                    <div class="flow-box">Bulut İş Ortakları & SaaS</div>
                  </div>
                </div>
              </div>

              <!-- Live Interfaces Table -->
              <div class="table-wrap" style="margin-top: 15px;">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Entegrasyon Protokolü</th>
                      <th>Canlı Arayüz Sayısı</th>
                      <th>Entegrasyon Tipi</th>
                      <th>BTP Taşıma Uyumu</th>
                      <th>Geçiş Önceliği</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>REST / OData API</strong></td>
                      <td>18 Servis</td>
                      <td>Senkron Mobil / Web Arayüzleri</td>
                      <td>%100 Doğrudan Cloud Integration Uyumlu</td>
                      <td>Yüksek Öncelik</td>
                    </tr>
                    <tr>
                      <td><strong>SOAP Web Services</strong></td>
                      <td>14 Servis</td>
                      <td>Banka ve e-Fatura WSDL Servisleri</td>
                      <td>%95 Otomatik Migration Tool ile Taşınabilir</td>
                      <td>Yüksek Öncelik</td>
                    </tr>
                    <tr>
                      <td><strong>RFC / BAPI Çağrıları</strong></td>
                      <td>8 Servis</td>
                      <td>İç Sistem Veri Transferleri</td>
                      <td>SAP Cloud Connector ile Güvenli Tünel</td>
                      <td>Orta Öncelik</td>
                    </tr>
                    <tr>
                      <td><strong>SFTP / Flat File</strong></td>
                      <td>5 Servis</td>
                      <td>Maaş ve Ekstre Dosya Akışları</td>
                      <td>BTP SFTP Adapter Akışlarına Taşınacak</td>
                      <td>Orta Öncelik</td>
                    </tr>
                    <tr>
                      <td><strong>IDoc / EDI</strong></td>
                      <td>3 Servis</td>
                      <td>Tedarikçi EDI Mesajlaşmaları</td>
                      <td>BTP Trading Partner Management (TPM)</td>
                      <td>Planlı Aşama</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 6. LİSANS VE BULUT (FUE LİSANS ANALİZİ)                                   -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('analytics')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">6. SAP LİSANS VE BULUT (FUE LİSANS ANALİZİ)</div>
              <div class="sb-meta">Full User Equivalent (FUE) Optimizasyonu ve Hak Sahipliği</div>
            </div>

            <div class="section-content-box">
              <div class="kpi-mini-grid">
                <div class="kpi-box">
                  <span class="k-label">Mevcut Named User</span>
                  <strong class="k-val">{{ customerService.activeCustomer().sapUserCount }} Kullanıcı</strong>
                  <span class="k-sub">Professional + Limited</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Gereken RISE FUE</span>
                  <strong class="k-val text-blue">142 FUE</strong>
                  <span class="k-sub">Optimize Edilmiş Model</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Düşük Kullanımlı Kullanıcı</span>
                  <strong class="k-val text-amber">{{ customerService.activeCustomer().lowUsageUserCount }} Kullanıcı</strong>
                  <span class="k-sub">Self-Service / Core Adayı</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Tahmini Lisans Tasarrufu</span>
                  <strong class="k-val text-emerald">€{{ customerService.activeCustomer().estimatedOpportunityValue | number }}</strong>
                  <span class="k-sub">Yıllık Lisans Avantajı</span>
                </div>
              </div>

              <!-- FUE Conversion Table -->
              <div class="table-wrap" style="margin-top: 15px;">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Kullanıcı Kategorisi</th>
                      <th>Mevcut Kullanıcı</th>
                      <th>FUE Dönüşüm Katsayısı</th>
                      <th>Gereken FUE Karşılığı</th>
                      <th>Optimizasyon Açıklaması</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Advanced User (Tam Yetkili)</strong></td>
                      <td>65 Kullanıcı</td>
                      <td>1 : 1</td>
                      <td>65.0 FUE</td>
                      <td>Finans, satınalma ve sistem yöneticileri (Tüm ERP yetkisi)</td>
                    </tr>
                    <tr>
                      <td><strong>Core User (Standart Yetkili)</strong></td>
                      <td>180 Kullanıcı</td>
                      <td>5 : 1 (0.2 FUE)</td>
                      <td>36.0 FUE</td>
                      <td>Satış temsilcileri, depo ve operasyon ekipleri</td>
                    </tr>
                    <tr>
                      <td><strong>Self-Service User (Kısıtlı Yetkili)</strong></td>
                      <td>255 Kullanıcı</td>
                      <td>30 : 1 (0.033 FUE)</td>
                      <td>8.5 FUE</td>
                      <td>İzin, talep onayları, masraf girişi ve rapor izleme</td>
                    </tr>
                    <tr class="highlight-total-row">
                      <td><strong>TOPLAM FUE GEREKSİNİMİ</strong></td>
                      <td><strong>500 Kullanıcı</strong></td>
                      <td><strong>Dinamik Havuz</strong></td>
                      <td><strong class="text-blue">109.5 FUE (+%30 Büyüme Tamponu: 142 FUE)</strong></td>
                      <td><strong>Atıl lisans maliyetleri ve aşım riski kalıcı olarak sıfırlanır</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 7. TEKNİK ALTYAPI - SIZING (MEVCUT / HEDEF SİSTEM)                        -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('source-sizing')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">7. TEKNİK ALTYAPI - MEVCUT / HEDEF SİSTEM BOYUTLANDIRMASI</div>
              <div class="sb-meta">Donanım, Veritabanı ve HANA In-Memory Kapasite Planı</div>
            </div>

            <div class="section-content-box">
              <div class="table-wrap">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Metrik</th>
                      <th>Mevcut On-Premise Sistem</th>
                      <th>RISE with SAP Hedef Sistem (Private Cloud)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Veritabanı Motoru</strong></td>
                      <td>{{ basisService.systemInfo()?.dbType || 'Oracle / MS SQL RDBMS' }}</td>
                      <td>SAP HANA 2.0 SPS07 In-Memory DB</td>
                    </tr>
                    <tr>
                      <td><strong>Disk / Veri Boyutu</strong></td>
                      <td>{{ basisService.systemInfo()?.diskSizeGiB || 1250 }} GB (Geleneksel RDBMS)</td>
                      <td>{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB || 512 }} GB HANA Bellek (Sıkıştırma Dahil)</td>
                    </tr>
                    <tr>
                      <td><strong>İşlem Gücü (SAPS)</strong></td>
                      <td>18.000 SAPS (Eski Nesil CPU Donanımı)</td>
                      <td>24.000 SAPS (Modern Hyperscaler Compute)</td>
                    </tr>
                    <tr>
                      <td><strong>Yedeklilik & SLA</strong></td>
                      <td>Lokal Veri Merkezi / Manuel Failover</td>
                      <td>%99.7 - %99.9 Bulut SLA + 7/24 Proaktif SAP Yönetimi</td>
                    </tr>
                    <tr>
                      <td><strong>İşletim Sistemi</strong></td>
                      <td>Windows Server / Standart Linux</td>
                      <td>SUSE Linux Enterprise Server for SAP (SLES)</td>
                    </tr>
                    <tr>
                      <td><strong>Yedekleme & DR</strong></td>
                      <td>Manuel Günlük Tape / Disk Yedekleri</td>
                      <td>Otomatik Snapshots + Coğrafi Felaket Kurtarma (DR)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 8. SİSTEM ORTAMI & MEVCUT AS-IS MİMARİSİ (2027 EoS)                        -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('architecture-asis')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">8. SİSTEM ORTAMI & MEVCUT AS-IS MİMARİSİ (2027 EoS)</div>
              <div class="sb-meta">Mevcut Mimari Şeması, Sürüm Uyumluluğu ve Kritik Risk Takvimi</div>
            </div>

            <div class="section-content-box">
              <!-- Uploaded Custom AS-IS Drawing if available -->
              @if (getAsisImage()) {
                <div class="arch-uploaded-container">
                  <div class="auc-header">Mevcut Mimari (AS-IS) Özel Çizim Görseli:</div>
                  <img [src]="getAsisImage()" class="pdf-custom-arch-img" alt="AS-IS Mimari Çizimi" />
                </div>
              }

              <!-- Visual AS-IS Architecture Diagram -->
              <div class="arch-schematic-card">
                <div class="schematic-title">
                  <app-icon name="alert" [size]="14" color="#d97706"></app-icon>
                  <span>Mevcut Durum (AS-IS) Altyapı Akış Şeması</span>
                </div>

                <div class="asis-topology-flow">
                  <!-- Tier 1: Clients -->
                  <div class="asis-tier-card">
                    <div class="tier-tag">Kullanıcı Katmanı</div>
                    <div class="tier-title">SAP GUI 7.70 / WebGUI</div>
                    <div class="tier-detail">{{ customerService.activeCustomer().sapUserCount }} Masaüstü İstemci • VPN / LAN Bağlantısı</div>
                  </div>

                  <div class="asis-arrow-down">▼ Standart RFC / Diag Protokolü</div>

                  <!-- Tier 2: Application -->
                  <div class="asis-tier-card">
                    <div class="tier-tag">Uygulama Sunucuları (App Servers)</div>
                    <div class="tier-title">SAP ECC 6.0 EHP 7/8 (NetWeaver 7.50)</div>
                    <div class="tier-detail">ABAP Stack • 1.240 Custom Z-Nesnesi • On-Premise Veri Merkezi Altyapısı</div>
                  </div>

                  <div class="asis-arrow-down">▼ Veritabanı Sürücüsü (SQL Net)</div>

                  <!-- Tier 3: Database -->
                  <div class="asis-tier-card db-card">
                    <div class="tier-tag">Veritabanı Katmanı</div>
                    <div class="tier-title">{{ basisService.systemInfo()?.dbType || 'Oracle 19c / MS SQL Server' }} (RDBMS)</div>
                    <div class="tier-detail">{{ basisService.systemInfo()?.diskSizeGiB || 1250 }} GB Klasik Disk Alanı • In-Memory Olmayan Geleneksel Mimari</div>
                  </div>
                </div>

                <!-- 2027 EoS Callout Banner -->
                <div class="eos-callout-banner">
                  <div class="eos-badge">31 ARALIK 2027</div>
                  <div class="eos-body">
                    <strong>Kritik Destek Bitiş (End of Support) Uyarısı:</strong>
                    <span>SAP ECC 6.0 ana akım desteği 2027 yılı sonunda sona erecektir. Bu tarihten sonra güvenlik yamaları, e-Fatura/e-Defter yasal regülasyon uyarlamaları ve teknik destek ek maliyetlere tabi olacak ve ciddi operasyonel risk oluşturacaktır.</span>
                  </div>
                </div>
              </div>

              <!-- System Inventory Table -->
              <div class="table-wrap" style="margin-top: 15px;">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Sunucu / Rol</th>
                      <th>İşletim Sistemi</th>
                      <th>Veritabanı</th>
                      <th>SAP Versiyonu</th>
                      <th>EoS Durumu</th>
                      <th>RISE Bulut Karşılığı</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>ECC Üretim (PRD)</strong></td>
                      <td>SUSE Linux / Windows</td>
                      <td>{{ basisService.systemInfo()?.dbType || 'Oracle 19c' }}</td>
                      <td>ECC 6.0 EHP8</td>
                      <td><span class="risk-pill red">2027 EoS</span></td>
                      <td>S/4HANA PCE (HANA 2.0 In-Memory)</td>
                    </tr>
                    <tr>
                      <td><strong>ECC Test / QA</strong></td>
                      <td>SUSE Linux / Windows</td>
                      <td>{{ basisService.systemInfo()?.dbType || 'Oracle 19c' }}</td>
                      <td>ECC 6.0 EHP8</td>
                      <td><span class="risk-pill red">2027 EoS</span></td>
                      <td>S/4HANA PCE QA Sistemi</td>
                    </tr>
                    <tr>
                      <td><strong>ECC Geliştirme (DEV)</strong></td>
                      <td>SUSE Linux / Windows</td>
                      <td>{{ basisService.systemInfo()?.dbType || 'Oracle 19c' }}</td>
                      <td>ECC 6.0 EHP8</td>
                      <td><span class="risk-pill red">2027 EoS</span></td>
                      <td>S/4HANA PCE DEV (Clean Core)</td>
                    </tr>
                    <tr>
                      <td><strong>Process Orchestration (PO)</strong></td>
                      <td>Red Hat / SUSE</td>
                      <td>SAP MaxDB / Oracle</td>
                      <td>PO 7.50</td>
                      <td><span class="risk-pill red">2027 EoS</span></td>
                      <td>SAP BTP Integration Suite</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 9. EN BÜYÜK TABLOLAR (DVM - DATA VOLUME MANAGEMENT)                       -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('largest-tables')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">9. EN BÜYÜK TABLOLAR & DVM (DATA VOLUME MANAGEMENT)</div>
              <div class="sb-meta">Veri Hacmi Analizi, Arşivleme ve HANA Bellek Optimizasyonu</div>
            </div>

            <div class="section-content-box">
              <div class="kpi-mini-grid">
                <div class="kpi-box">
                  <span class="k-label">Toplam Veritabanı</span>
                  <strong class="k-val">{{ basisService.systemInfo()?.diskSizeGiB || 1250 }} GB</strong>
                  <span class="k-sub">Ham Veri Hacmi</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Arşivlenebilir Hacim</span>
                  <strong class="k-val text-emerald">%35 - %45</strong>
                  <span class="k-sub">Soğuk Veri / Geçmiş Kayıt</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">HANA Bellek Tasarrufu</span>
                  <strong class="k-val text-blue">~350 GB</strong>
                  <span class="k-sub">Hedef Sizing İndirimi</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Yıllık Altyapı Tasarrufu</span>
                  <strong class="k-val text-amber">€32.000</strong>
                  <span class="k-sub">Daha Düşük TCO Dilimi</span>
                </div>
              </div>

              <!-- Top 10 Tables Table -->
              <div class="table-wrap" style="margin-top: 15px;">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Tablo Adı</th>
                      <th>Modül & İşlev</th>
                      <th>Mevcut Boyut</th>
                      <th>Arşivleme / DVM Stratejisi</th>
                      <th>HANA Bellek Tasarrufu</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>BSIS / BSAS</strong></td>
                      <td>FI - Muhasebe Açık Kalemler</td>
                      <td>148 GB</td>
                      <td>2 yıl öncesi açık kalemlerin arşivlenmesi</td>
                      <td>~95 GB Tasarruf</td>
                    </tr>
                    <tr>
                      <td><strong>BSEG / BKPF</strong></td>
                      <td>FI - Muhasebe Belge Satırları</td>
                      <td>125 GB</td>
                      <td>Universal Journal (ACDOCA) sıkıştırması</td>
                      <td>~75 GB Tasarruf</td>
                    </tr>
                    <tr>
                      <td><strong>COEP</strong></td>
                      <td>CO - Masraf Yeri Hareketleri</td>
                      <td>98 GB</td>
                      <td>ACDOCA tekil tabloya geçiş & soğuk veri</td>
                      <td>~60 GB Tasarruf</td>
                    </tr>
                    <tr>
                      <td><strong>MLCR / MLIT</strong></td>
                      <td>MM - Malzeme Defteri Değerleri</td>
                      <td>84 GB</td>
                      <td>HANA sütun bazlı sıkıştırma</td>
                      <td>~50 GB Tasarruf</td>
                    </tr>
                    <tr>
                      <td><strong>EDI40 / EDIDC</strong></td>
                      <td>BC - IDoc Veri Kayıtları</td>
                      <td>72 GB</td>
                      <td>Başarılı ve eski IDoc'ların silinmesi</td>
                      <td>~65 GB Tasarruf</td>
                    </tr>
                    <tr>
                      <td><strong>CKIS / KEPH</strong></td>
                      <td>CO - Maliyet Hesaplama Kalemleri</td>
                      <td>56 GB</td>
                      <td>Eski maliyet varyantlarının temizliği</td>
                      <td>~35 GB Tasarruf</td>
                    </tr>
                    <tr>
                      <td><strong>VBAP / VBAK</strong></td>
                      <td>SD - Satış Siparişi Kalemleri</td>
                      <td>52 GB</td>
                      <td>Kapanmış geçmiş siparişlerin arşivlenmesi</td>
                      <td>~30 GB Tasarruf</td>
                    </tr>
                    <tr>
                      <td><strong>MARA / MARC</strong></td>
                      <td>MM - Malzeme Ana Verileri</td>
                      <td>38 GB</td>
                      <td>Atıl ve kullanım dışı malzemelerin temizliği</td>
                      <td>~15 GB Tasarruf</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 10. ÇÖZÜM ÖNERİSİ: 1. ÖNERİLEN YÖNTEM & YOL HARİTASI                      -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('solution-recommended')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">10. ÇÖZÜM ÖNERİSİ: 1. ÖNERİLEN GEÇİŞ YÖNTEMİ & YOL HARİTASI</div>
              <div class="sb-meta">Brownfield (System Conversion) Stratejisi ve 4 Fazlı Canlıya Geçiş Takvimi</div>
            </div>

            <div class="section-content-box">
              <!-- 4-Phase Transformation Roadmap -->
              <div class="roadmap-container-pdf">
                <div class="roadmap-header-pdf">
                  <app-icon name="sparkles" [size]="14" color="#0284c7"></app-icon>
                  <span>{{ getRecommendedData().roadmapTitle }}</span>
                </div>

                <div class="roadmap-steps-grid">
                  @for (phase of getRecommendedData().phases; track phase.id) {
                    <div class="roadmap-step-box" [class.highlight]="phase.isHighlight">
                      <div class="step-top-row">
                        <span class="step-num">{{ phase.stepNumber }}</span>
                        <span class="step-badge" [class.green]="phase.isHighlight">{{ phase.badge }}</span>
                      </div>
                      <h4>{{ phase.title }}</h4>
                      <ul>
                        @for (item of phase.items; track item) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 11. ÇÖZÜM ÖNERİSİ: 2. HEDEF MİMARİ (RISE WITH SAP BULUT TOPOLOJİSİ)       -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('solution-architecture')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">11. ÇÖZÜM ÖNERİSİ: 2. HEDEF MİMARİ (RISE WITH SAP PCE)</div>
              <div class="sb-meta">Bulut Hedef Mimari Şeması ve 3. Parti Entegrasyon Haritası</div>
            </div>

            <div class="section-content-box">
              <!-- Uploaded Custom TO-BE Drawing if available -->
              @if (getTobeImage()) {
                <div class="arch-uploaded-container">
                  <div class="auc-header">Hedef Mimari (TO-BE) Özel Çizim Görseli:</div>
                  <img [src]="getTobeImage()" class="pdf-custom-arch-img" alt="TO-BE Hedef Mimari Çizimi" />
                </div>
              }

              <!-- 4-Tier Target Architecture Schematic Diagram -->
              <div class="arch-schematic-card">
                <div class="schematic-title">
                  <app-icon name="sparkles" [size]="14" color="#059669"></app-icon>
                  <span>RISE with SAP S/4HANA Private Cloud Edition 4 Katmanlı Hedef Mimari Şeması</span>
                </div>

                <div class="tobe-architecture-diagram">
                  <!-- Tier 1 -->
                  <div class="tobe-tier-row tier-presentation">
                    <div class="tier-label">1. Sunum & Deneyim Katmanı</div>
                    <div class="tier-content-grid">
                      <div class="tobe-node-pill"><strong>SAP Fiori Apps:</strong> Rol Tabanlı Modern Arayüz</div>
                      <div class="tobe-node-pill"><strong>SAP Joule:</strong> Kurumsal Üretken Yapay Zeka</div>
                      <div class="tobe-node-pill"><strong>SAP Mobile Start:</strong> Mobil Süreç Erişimi</div>
                      <div class="tobe-node-pill"><strong>SAP Build Work Zone:</strong> Birleşik Kullanıcı Portali</div>
                    </div>
                  </div>

                  <div class="tobe-flow-divider">▼ Güvenli Bulut Bağlantısı & Single Sign-On (SSO)</div>

                  <!-- Tier 2 -->
                  <div class="tobe-tier-row tier-core">
                    <div class="tier-label">2. Dijital Çekirdek (Enterprise Digital Core)</div>
                    <div class="core-highlight-box">
                      <div class="ch-title">RISE with SAP S/4HANA Private Cloud Edition (PCE)</div>
                      <div class="ch-specs">In-Memory SAP HANA 2.0 SPS07 Veritabanı • Clean Core Standart Genişletme Çerçevesi • Universal Journal (ACDOCA)</div>
                    </div>
                  </div>

                  <div class="tobe-flow-divider">▼ Event Mesh, REST / OData API & SAP Cloud Connector</div>

                  <!-- Tier 3 -->
                  <div class="tobe-tier-row tier-btp">
                    <div class="tier-label">3. Entegrasyon & İnovasyon Platformu (SAP BTP)</div>
                    <div class="tier-content-grid">
                      <div class="tobe-node-pill"><strong>SAP Integration Suite:</strong> Cloud Integration & API Hub</div>
                      <div class="tobe-node-pill"><strong>SAP Analytics Cloud (SAC):</strong> Gerçek Zamanlı BI & Tahmin</div>
                      <div class="tobe-node-pill"><strong>SAP Build:</strong> No-Code / Low-Code Süreç Otomasyonu</div>
                      <div class="tobe-node-pill"><strong>Side-by-Side ABAP:</strong> Bulut Uyumlu Genişletmeler</div>
                    </div>
                  </div>

                  <div class="tobe-flow-divider">▼ Yönetilen Hyperscaler Altyapı Protokolü</div>

                  <!-- Tier 4 -->
                  <div class="tobe-tier-row tier-infra">
                    <div class="tier-label">4. Güvenli Bulut Altyapısı (Hyperscaler IaaS)</div>
                    <div class="infra-flex-row">
                      <div class="infra-badge">Microsoft Azure / AWS / GCP</div>
                      <div class="infra-badge green">%99.9 Bulut SLA Garantisi</div>
                      <div class="infra-badge">Coğrafi Felaket Kurtarma (DR)</div>
                      <div class="infra-badge">7/24 Proaktif SAP Güvenlik ve Yama Yönetimi</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3rd Party Integrations Table -->
              <div class="table-wrap" style="margin-top: 15px;">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Sistem & Alan</th>
                      <th>Kategori</th>
                      <th>Mevcut Protokol</th>
                      <th>Hedef BTP Entegrasyon Stratejisi</th>
                      <th>Kritiklik</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Satış & Müşteri CRM</strong></td>
                      <td>Satış & CRM</td>
                      <td>RFC / SOAP</td>
                      <td>SAP BTP Open Connectors & REST OData API</td>
                      <td><span class="risk-pill red">KRİTİK</span></td>
                    </tr>
                    <tr>
                      <td><strong>Bankalar & Finans Kuruluşları</strong></td>
                      <td>Finans & Bankacılık</td>
                      <td>SFTP (MT940/CAMT)</td>
                      <td>SAP Multi-Bank Connectivity (MBC) & BTP Secure Flow</td>
                      <td><span class="risk-pill red">KRİTİK</span></td>
                    </tr>
                    <tr>
                      <td><strong>GİB e-Fatura / e-Defter</strong></td>
                      <td>Yasal & Regülasyon</td>
                      <td>SOAP Web Services</td>
                      <td>SAP Document and Reporting Compliance (DRC)</td>
                      <td><span class="risk-pill red">KRİTİK</span></td>
                    </tr>
                    <tr>
                      <td><strong>Depo Yönetimi (WMS) & MES</strong></td>
                      <td>Lojistik & Üretim</td>
                      <td>IDoc / RFC</td>
                      <td>Standardize REST API & BTP Event Mesh</td>
                      <td><span class="risk-pill amber">YÜKSEK</span></td>
                    </tr>
                    <tr>
                      <td><strong>İK & Bordro Sistemleri</strong></td>
                      <td>İnsan Kaynakları</td>
                      <td>Flat File / SFTP</td>
                      <td>BTP Cloud Integration & API Gateway</td>
                      <td><span class="risk-pill blue">ORTA</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 12. ÇÖZÜM ÖNERİSİ: 3. 4 GEÇİŞ YÖNTEMİ & KARŞILAŞTIRMA MATRİSİ             -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('solution-methods')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">12. ÇÖZÜM ÖNERİSİ: 3. 4 GEÇİŞ YÖNTEMİ & KARŞILAŞTIRMA MATRİSİ</div>
              <div class="sb-meta">Brownfield, Lift & Shift, Selective Data Transition ve Greenfield Analizi</div>
            </div>

            <div class="section-content-box">
              <!-- All 4 Method Cards Grid -->
              <div class="methods-cards-grid-pdf">
                @for (card of getMethodCards(); track card.id) {
                  <div class="method-card-pdf" [ngClass]="card.badgeClass">
                    <div class="mc-head">
                      <div class="mc-top">
                        <span class="mc-badge" [ngClass]="card.badgeClass">{{ card.badgeText }}</span>
                        <span class="mc-duration">{{ card.duration }}</span>
                      </div>
                      <h3>{{ card.title }}</h3>
                      <p class="mc-sub">{{ card.subtitle }}</p>
                    </div>
                    <div class="mc-bullets">
                      @for (b of card.bullets; track b.label) {
                        <div class="mc-bullet-item">
                          <span class="bullet-dot" [ngClass]="b.dotColor"></span>
                          <div class="bullet-text">
                            <strong>{{ b.label }}</strong>
                            <span>{{ b.text }}</span>
                          </div>
                        </div>
                      }
                    </div>
                    <div class="mc-foot">{{ card.footerNote }}</div>
                  </div>
                }
              </div>

              <!-- Comprehensive Comparison Matrix Table -->
              <div class="table-wrap" style="margin-top: 20px;">
                <div class="schematic-title" style="margin-bottom: 8px;">
                  <app-icon name="sliders" [size]="14" color="#0284c7"></app-icon>
                  <span>Geçiş Yöntemleri Karşılaştırma Matrisi Tablosu</span>
                </div>
                <table class="report-data-table matrix-table">
                  <thead>
                    <tr>
                      <th>Değerlendirme Kriteri</th>
                      <th class="th-rec">Brownfield (Önerilen)</th>
                      <th>Lift & Shift</th>
                      <th>Selective Data Transition</th>
                      <th>Greenfield (Yeni Kurulum)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Proje Süresi</strong></td>
                      <td class="td-rec"><strong>6 Ay</strong></td>
                      <td>3 - 6 Ay</td>
                      <td>12 Ay</td>
                      <td>12 - 18 Ay</td>
                    </tr>
                    <tr>
                      <td><strong>Geçmiş Veri Korunumu</strong></td>
                      <td class="td-rec"><strong>%100 Tam Tarihçe</strong></td>
                      <td>%100 Korunur</td>
                      <td>Seçilen Şirket Kodu / Yıllar</td>
                      <td>Sadece Açılış Bakiyeleri</td>
                    </tr>
                    <tr>
                      <td><strong>Maliyet & Danışmanlık Eforu</strong></td>
                      <td class="td-rec"><strong>Düşük - Orta (Optimum)</strong></td>
                      <td>Düşük (Geçici)</td>
                      <td>Yüksek (Özel Tool Lisansı)</td>
                      <td>En Yüksek Maliyet & Efor</td>
                    </tr>
                    <tr>
                      <td><strong>Değişim Yönetimi Riski</strong></td>
                      <td class="td-rec"><strong>Düşük Risk</strong></td>
                      <td>Çok Düşük</td>
                      <td>Orta - Yüksek</td>
                      <td>Yüksek Değişim Riski</td>
                    </tr>
                    <tr>
                      <td><strong>Clean Core & BTP Uyumu</strong></td>
                      <td class="td-rec"><strong>Yüksek (Sadeleştirme ile)</strong></td>
                      <td>Düşük (ECC Kalır)</td>
                      <td>Orta Seviye</td>
                      <td>%100 Standart Başlangıç</td>
                    </tr>
                    <tr>
                      <td><strong>Genel Tavsiye Durumu</strong></td>
                      <td class="td-rec"><span class="risk-pill green">⭐ Tavsiye Edilen Çözüm</span></td>
                      <td><span class="risk-pill blue">Alternatif (Geçici)</span></td>
                      <td><span class="risk-pill amber">Kısmen Uygun</span></td>
                      <td><span class="risk-pill red">Uygun Değil</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 13. TOPLAM SAHİP OLMA MALİYETİ (TCO & ROI)                                -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('business-case')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">13. TOPLAM SAHİP OLMA MALİYETİ (TCO & ROI SİMÜLASYONU)</div>
              <div class="sb-meta">5 Yıllık Karşılaştırmalı Finansal Model ve Yatırım Getirisi</div>
            </div>

            <div class="section-content-box">
              <div class="kpi-mini-grid">
                <div class="kpi-box">
                  <span class="k-label">5 Yıllık Tasarruf Oranı</span>
                  <strong class="k-val text-emerald">%24.8</strong>
                  <span class="k-sub">On-Premise vs RISE Bulut</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Yatırımın Geri Dönüşü (ROI)</span>
                  <strong class="k-val text-blue">14 Ay</strong>
                  <span class="k-sub">Proje Maliyetini Amorti Etme</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Öngörülen 5 Yıllık Net Fayda</span>
                  <strong class="k-val text-purple">€385.000+</strong>
                  <span class="k-sub">CapEx + OpEx Birleşik Kazanç</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Finansman Modeli</span>
                  <strong class="k-val">OpEx Tabanlı</strong>
                  <span class="k-sub">Öngörülebilir Yıllık Abonelik</span>
                </div>
              </div>

              <!-- 5-Year Simulation Table -->
              <div class="table-wrap" style="margin-top: 15px;">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Finansal Kalem (EUR)</th>
                      <th>1. Yıl</th>
                      <th>2. Yıl</th>
                      <th>3. Yıl</th>
                      <th>4. Yıl</th>
                      <th>5. Yıl</th>
                      <th>5 Yıllık Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>AS-IS On-Premise (Bakım + Altyapı + Operasyon)</strong></td>
                      <td>€216.000</td>
                      <td>€316.000</td>
                      <td>€216.000</td>
                      <td>€216.000</td>
                      <td>€216.000</td>
                      <td><strong class="text-amber">€1.180.000</strong></td>
                    </tr>
                    <tr>
                      <td><strong>RISE with SAP (Bulut Abonelik + Dönüşüm)</strong></td>
                      <td>€700.000</td>
                      <td>€400.000</td>
                      <td>€400.000</td>
                      <td>€400.000</td>
                      <td>€400.000</td>
                      <td><strong class="text-blue">€2.300.000</strong></td>
                    </tr>
                    <tr class="highlight-total-row">
                      <td><strong>NET STRATEJİK FAYDA / TCO KAZANIMI</strong></td>
                      <td colspan="5">Donanım yenileme amortismanı sıfırlanır, operasyonel efor inovasyona kayar</td>
                      <td><strong class="text-emerald">Öngörülebilir Nakit Akışı</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 14. NOTLAR                                                                -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('notes')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">14. NOTLAR (DEĞERLENDİRME KAYITLARI)</div>
              <div class="sb-meta">Satış, Presales ve Müşteri Özelinde Zaman Damgalı Notlar</div>
            </div>

            <div class="section-content-box">
              <div class="notes-summary-box">
                @if (notesService.currentCustomerNotes().length > 0) {
                  @for (note of notesService.currentCustomerNotes(); track note.id) {
                    <div class="note-bullet-line">
                      <span class="n-date">[{{ note.formattedDate }}]</span>
                      <span class="n-author">{{ note.author }}:</span>
                      <span class="n-text">{{ note.text }}</span>
                    </div>
                  }
                } @else {
                  <p class="text-muted" style="padding: 10px; font-style: italic;">Henüz kaydedilmiş not veya yorum bulunmamaktadır.</p>
                }
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-card {
      width: 100%;
      max-width: 840px;
      max-height: 90vh;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.85rem;

        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #e0f2fe;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        h3 {
          margin: 0;
          font-size: 1.12rem;
          font-weight: 700;
          color: #0f172a;
        }

        .sub-text {
          font-size: 0.8rem;
          color: #64748b;
        }
      }

      .btn-close {
        background: transparent;
        border: none;
        cursor: pointer;
        color: #64748b;
        padding: 0.4rem;
        border-radius: 6px;
        transition: background 0.15s;

        &:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      }
    }

    .controls-bar {
      padding: 0.85rem 1.5rem;
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;

      .status-summary {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .badge-count {
          padding: 0.25rem 0.65rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          border-radius: 9999px;
          font-size: 0.76rem;
          font-weight: 700;
        }

        .sub-lead {
          font-size: 0.76rem;
          color: #64748b;
        }
      }

      .btn-group-quick {
        display: flex;
        align-items: center;
        gap: 0.4rem;

        .btn-quick {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.35rem 0.65rem;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: #f1f5f9;
            color: #0f172a;
            border-color: #94a3b8;
          }
        }
      }
    }

    .menu-list-container {
      padding: 1.25rem 1.5rem;
      overflow-y: auto;
      flex: 1;
      max-height: 480px;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 0.75rem;
    }

    .menu-checkbox-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      }

      &.checked {
        border-color: #0284c7;
        background: #f0f9ff;
      }

      .checkbox-wrapper {
        margin-top: 2px;
        input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #0284c7;
          cursor: pointer;
        }
      }

      .menu-icon-box {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .menu-details {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .menu-group-tag {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .menu-name {
          font-size: 0.85rem;
          color: #0f172a;
          font-weight: 700;
        }

        .menu-desc {
          margin: 0;
          font-size: 0.72rem;
          color: #64748b;
          line-height: 1.35;
        }
      }
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;

      .footer-left {
        .footer-tip {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.74rem;
          color: #64748b;
        }
      }

      .footer-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .btn-cancel {
          padding: 0.55rem 1rem;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.84rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;

          &:hover:not(:disabled) {
            background: #f1f5f9;
            color: #0f172a;
          }
        }

        .btn-export {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 1.25rem;
          background: #0284c7;
          border: none;
          border-radius: 6px;
          font-size: 0.84rem;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.15s;

          &:hover:not(:disabled) {
            background: #0369a1;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }

    /* FULL SCREEN EXPORT LOADING OVERLAY */
    .pdf-exporting-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      z-index: 20000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;

      .exporting-card {
        background: #ffffff;
        border-radius: 14px;
        padding: 2rem 2.5rem;
        max-width: 440px;
        width: 90%;
        text-align: center;
        box-shadow: 0 25px 50px rgba(0,0,0,0.35);

        .spinner-pulse {
          width: 48px;
          height: 48px;
          margin: 0 auto 1.2rem;
          border: 4px solid #e0f2fe;
          border-top-color: #0284c7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        h3 {
          margin: 0 0 0.5rem;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
        }

        .export-status-text {
          margin: 0 0 1rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: #0284c7;
        }

        .export-progress-bar {
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.85rem;

          .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #0284c7, #059669);
            border-radius: 4px;
            transition: width 0.2s ease;
          }
        }

        .export-hint {
          font-size: 0.74rem;
          color: #64748b;
          line-height: 1.4;
        }
      }
    }

    /* RENDERED IN DOM VIEWPORT FOR FLAWLESS HTML2CANVAS CONVERSION */
    .hidden-pdf-document-wrapper {
      position: fixed;
      left: 0;
      top: 0;
      width: 860px;
      background: #ffffff;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 0 0 40px rgba(0,0,0,0.1);
    }

    .pdf-export-container {
      width: 840px;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 0;
      margin: 0;

      .pdf-page {
        padding: 40px 45px;
        box-sizing: border-box;
        page-break-after: always;
        min-height: 1100px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .pdf-cover-page {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #e2e8f0;

        .cover-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #0284c7;

          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.05em;
          }

          .cover-date {
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
          }
        }

        .cover-body {
          padding: 35px 0;

          .report-badge {
            display: inline-block;
            background: #0284c7;
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            margin-bottom: 12px;
          }

          .cover-title {
            margin: 0 0 10px;
            font-size: 32px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.02em;
            line-height: 1.15;
          }

          .cover-sub {
            margin: 0 0 25px;
            font-size: 15px;
            font-weight: 600;
            color: #475569;
            line-height: 1.4;
          }

          .cover-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 25px;

            .meta-item {
              display: flex;
              flex-direction: column;
              gap: 2px;

              .m-lbl {
                font-size: 11px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
              }

              .m-val {
                font-size: 13px;
                font-weight: 800;
                color: #0f172a;
              }
            }
          }

          .toc-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;

            .toc-title {
              font-size: 12px;
              font-weight: 800;
              color: #0284c7;
              letter-spacing: 0.05em;
              margin-bottom: 10px;
              padding-bottom: 6px;
              border-bottom: 1px solid #f1f5f9;
            }

            .toc-items {
              display: flex;
              flex-direction: column;
              gap: 5px;

              .toc-line {
                display: flex;
                align-items: center;
                font-size: 11px;
                color: #334155;
                overflow: hidden;
                white-space: nowrap;

                .toc-num {
                  font-weight: 800;
                  width: 22px;
                  color: #0284c7;
                  flex-shrink: 0;
                }

                .toc-name {
                  font-weight: 700;
                  flex-shrink: 0;
                }

                .toc-group {
                  font-size: 10px;
                  color: #64748b;
                  margin-left: 6px;
                  flex-shrink: 0;
                }

                .toc-dots {
                  color: #cbd5e1;
                  padding: 0 6px;
                  letter-spacing: 2px;
                  flex: 1;
                  overflow: hidden;
                }

                .toc-badge {
                  font-size: 9px;
                  font-weight: 800;
                  color: #059669;
                  background: #ecfdf5;
                  border: 1px solid #a7f3d0;
                  padding: 1px 6px;
                  border-radius: 4px;
                  flex-shrink: 0;
                }
              }
            }
          }
        }

        .cover-footer {
          padding-top: 15px;
          border-top: 1px solid #cbd5e1;
          font-size: 10px;
          color: #94a3b8;
          text-align: center;
        }
      }

      /* GENERAL PDF PAGE SECTION */
      .pdf-page-section {
        padding: 35px 40px;
        box-sizing: border-box;
        page-break-after: always;
        min-height: 1080px;
        background: #ffffff;
        border-bottom: 1px dashed #cbd5e1;

        .section-badge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 2px solid #0284c7;
          margin-bottom: 20px;

          .sb-title {
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.01em;
          }

          .sb-meta {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
          }
        }

        .section-content-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-p {
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }

        .sub-block-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
      }

      /* EXECUTIVE SUMMARY HERO CARD PDF STYLES */
      .hero-score-card-pdf {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.03);

        .hsc-left {
          display: flex;
          align-items: center;
          gap: 18px;

          .circular-score-badge-pdf {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);

            .score-number {
              font-size: 24px;
              font-weight: 900;
              line-height: 1;
            }

            .score-label {
              font-size: 8px;
              font-weight: 800;
              letter-spacing: 0.05em;
              margin-top: 3px;
            }
          }

          .score-text-pdf {
            flex: 1;

            .status-pill-green-pdf {
              display: inline-block;
              padding: 2px 8px;
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              color: #059669;
              font-size: 9px;
              font-weight: 800;
              border-radius: 20px;
              margin-bottom: 5px;
            }

            h3 {
              margin: 0 0 4px;
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
            }

            p {
              margin: 0;
              font-size: 11px;
              color: #475569;
              line-height: 1.4;
            }
          }
        }

        .pillar-grid-pdf {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          background: #f8fafc;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;

          .pillar-card-pdf {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .p-head-pdf {
              font-size: 10px;
              font-weight: 700;
              color: #1e293b;

              .p-name-pdf {
                display: flex;
                align-items: center;
                gap: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }

            .progress-bar-pdf {
              height: 6px;
              background: #e2e8f0;
              border-radius: 3px;
              overflow: hidden;

              .progress-fill-pdf {
                height: 100%;
                border-radius: 3px;
                &.bg-blue { background: #0284c7; }
                &.bg-emerald { background: #059669; }
                &.bg-purple { background: #7c3aed; }
                &.bg-amber { background: #d97706; }
              }
            }

            .p-desc-pdf {
              font-size: 8.5px;
              color: #64748b;
              line-height: 1.25;
            }
          }
        }
      }

      /* 8 PURPOSE CARDS GRID */
      .purpose-grid-pdf {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;

        .purpose-card-pdf {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          gap: 10px;
          align-items: flex-start;

          .pc-icon {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .pc-body {
            flex: 1;

            h4 {
              margin: 0 0 2px;
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
            }

            p {
              margin: 0;
              font-size: 9.5px;
              color: #64748b;
              line-height: 1.35;
            }
          }
        }
      }

      /* 4 METHODOLOGY CARDS GRID */
      .how-grid-pdf {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;

        .how-card-pdf {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;

          .hc-head {
            display: flex;
            align-items: center;
            gap: 8px;

            .hc-badge {
              padding: 2px 6px;
              background: #f0f9ff;
              border: 1px solid #bae6fd;
              color: #0284c7;
              font-size: 9px;
              font-weight: 800;
              border-radius: 4px;
            }

            h4 {
              margin: 0;
              font-size: 11.5px;
              font-weight: 800;
              color: #0f172a;
            }
          }

          .hc-bullets {
            margin: 0;
            padding: 0;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 3px;

            li {
              font-size: 9.5px;
              color: #475569;
              line-height: 1.35;

              .bullet-dot {
                color: #0284c7;
                font-weight: 900;
              }
            }
          }

          .hc-foot {
            font-size: 9px;
            font-weight: 700;
            color: #059669;
            background: #f0fdf4;
            padding: 3px 6px;
            border-radius: 4px;
            margin-top: 4px;
          }
        }
      }

      .sales-notes-box-pdf {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 10px 14px;

        h4 {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
        }

        p {
          margin: 0;
          font-size: 10px;
          color: #334155;
          line-height: 1.45;
          font-style: italic;
        }
      }

      /* KPI MINI GRID */
      .kpi-mini-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;

        .kpi-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;

          .k-label {
            font-size: 9.5px;
            font-weight: 700;
            color: #64748b;
          }

          .k-val {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
          }

          .k-sub {
            font-size: 8.5px;
            color: #64748b;
          }
        }
      }

      /* ANALYSIS CARDS */
      .analysis-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 16px;

        h3 {
          margin: 0 0 4px;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }

        p {
          margin: 0 0 10px;
          font-size: 11px;
          color: #475569;
          line-height: 1.4;
        }

        .module-stat-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;

          .m-pill {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 3px 8px;
            font-size: 10px;
            color: #334155;
          }
        }
      }

      /* REPORT DATA TABLES */
      .table-wrap {
        width: 100%;
        overflow: hidden;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
      }

      .report-data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10.5px;

        thead {
          background: #f1f5f9;

          th {
            padding: 7px 10px;
            text-align: left;
            font-weight: 800;
            color: #334155;
            border-bottom: 1px solid #cbd5e1;
            border-right: 1px solid #e2e8f0;

            &.th-rec {
              background: #ecfdf5;
              color: #047857;
              border-bottom-color: #a7f3d0;
            }
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid #f1f5f9;

            &:nth-child(even) {
              background: #fafafa;
            }

            &.highlight-total-row {
              background: #f0fdf4;
              font-weight: 800;
            }

            td {
              padding: 6px 10px;
              color: #334155;
              border-right: 1px solid #f1f5f9;
              vertical-align: middle;

              &.td-rec {
                background: #f0fdf4;
                color: #047857;
                font-weight: 700;
              }
            }
          }
        }
      }

      /* SCHEMATICS & DIAGRAMS */
      .arch-schematic-card {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 14px 18px;

        .schematic-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }
      }

      /* PO INTEGRATION TOPOLOGY */
      .integration-topology-flow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;

        .flow-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;

          .col-head {
            font-size: 10px;
            font-weight: 800;
            color: #475569;
            text-align: center;
            margin-bottom: 2px;
          }

          .flow-box {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 4px 6px;
            font-size: 9.5px;
            color: #334155;
            text-align: center;
            font-weight: 600;

            &.core-box {
              background: #f0f9ff;
              border-color: #0284c7;
              color: #0284c7;
              font-weight: 800;
            }
          }
        }

        .flow-arrow-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;

          .proto-tag {
            font-size: 7.5px;
            font-weight: 800;
            color: #0284c7;
            background: #e0f2fe;
            padding: 1px 4px;
            border-radius: 3px;
          }

          .arr-icon {
            font-size: 14px;
            color: #0284c7;
            font-weight: 900;
          }
        }

        .hub-col {
          flex: 1.3;

          .hub-main-box {
            background: #eff6ff;
            border: 2px solid #3b82f6;
            border-radius: 6px;
            padding: 8px;
            text-align: center;

            .hub-title {
              font-size: 11px;
              font-weight: 900;
              color: #1d4ed8;
            }

            .hub-sub {
              font-size: 8.5px;
              color: #475569;
            }

            .hub-mig-badge {
              font-size: 9px;
              font-weight: 800;
              color: #059669;
              background: #ecfdf5;
              padding: 2px 6px;
              border-radius: 4px;
              margin: 4px auto;
              display: inline-block;
            }

            .hub-desc {
              font-size: 8px;
              color: #64748b;
            }
          }
        }
      }

      /* AS-IS TOPOLOGY */
      .asis-topology-flow {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        background: #fffbeb;
        border: 1px solid #fef3c7;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;

        .asis-tier-card {
          width: 85%;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 12px;
          text-align: center;

          &.db-card {
            border-color: #f59e0b;
          }

          .tier-tag {
            font-size: 8.5px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
          }

          .tier-title {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
          }

          .tier-detail {
            font-size: 9.5px;
            color: #475569;
          }
        }

        .asis-arrow-down {
          font-size: 9px;
          font-weight: 700;
          color: #d97706;
        }
      }

      .eos-callout-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        padding: 8px 12px;

        .eos-badge {
          background: #dc2626;
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .eos-body {
          font-size: 10px;
          color: #991b1b;
          line-height: 1.35;
        }
      }

      /* TO-BE 4-TIER ARCHITECTURE DIAGRAM */
      .tobe-architecture-diagram {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .tobe-tier-row {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;

          .tier-label {
            font-size: 10px;
            font-weight: 800;
            color: #475569;
            margin-bottom: 6px;
          }

          .tier-content-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;

            .tobe-node-pill {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 4px 6px;
              font-size: 9px;
              color: #334155;
              text-align: center;
            }
          }

          &.tier-core {
            background: #f0fdf4;
            border-color: #86efac;

            .core-highlight-box {
              background: #ffffff;
              border: 1px solid #4ade80;
              border-radius: 4px;
              padding: 6px 10px;
              text-align: center;

              .ch-title {
                font-size: 12px;
                font-weight: 900;
                color: #15803d;
              }

              .ch-specs {
                font-size: 9px;
                color: #475569;
              }
            }
          }

          .infra-flex-row {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;

            .infra-badge {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 4px 8px;
              font-size: 9px;
              font-weight: 700;
              color: #334155;

              &.green {
                background: #ecfdf5;
                border-color: #a7f3d0;
                color: #047857;
              }
            }
          }
        }

        .tobe-flow-divider {
          text-align: center;
          font-size: 8.5px;
          font-weight: 700;
          color: #059669;
        }
      }

      /* 4 METHOD CARDS GRID */
      .methods-cards-grid-pdf {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;

        .method-card-pdf {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;

          &.recommended {
            border: 2px solid #059669;
            background: #f0fdf4;
          }

          .mc-head {
            .mc-top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;

              .mc-badge {
                font-size: 8.5px;
                font-weight: 800;
                padding: 2px 6px;
                border-radius: 4px;

                &.recommended { background: #059669; color: #ffffff; }
                &.lift-shift { background: #0284c7; color: #ffffff; }
                &.partial { background: #d97706; color: #ffffff; }
                &.not-suitable { background: #dc2626; color: #ffffff; }
              }

              .mc-duration {
                font-size: 9.5px;
                font-weight: 700;
                color: #475569;
              }
            }

            h3 {
              margin: 0 0 2px;
              font-size: 12.5px;
              font-weight: 900;
              color: #0f172a;
            }

            .mc-sub {
              margin: 0;
              font-size: 9.5px;
              color: #64748b;
            }
          }

          .mc-bullets {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin: 4px 0;

            .mc-bullet-item {
              display: flex;
              gap: 4px;
              font-size: 9px;
              line-height: 1.35;

              .bullet-dot {
                font-weight: 900;
                &.green { color: #059669; }
                &.blue { color: #0284c7; }
                &.amber { color: #d97706; }
                &.red { color: #dc2626; }
              }

              .bullet-text {
                color: #334155;
              }
            }
          }

          .mc-foot {
            font-size: 9px;
            font-weight: 700;
            color: #059669;
            background: #ffffff;
            border: 1px solid #bbf7d0;
            padding: 3px 6px;
            border-radius: 4px;
            margin-top: auto;
          }
        }
      }

      /* ROADMAP */
      .hero-recommendation-card-pdf {
        background: #ffffff;
        border: 2px solid #059669;
        border-radius: 8px;
        padding: 14px 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;

        .hr-left {
          flex: 1;

          .hr-pill {
            display: inline-block;
            background: #059669;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 4px;
            margin-bottom: 6px;
          }

          h2 {
            margin: 0 0 4px;
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
          }

          p {
            margin: 0;
            font-size: 11px;
            color: #475569;
            line-height: 1.4;
          }
        }

        .hr-stats {
          display: flex;
          gap: 8px;

          .stat-box-pdf {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 6px 10px;
            text-align: center;
            min-width: 65px;

            .sb-val {
              display: block;
              font-size: 13px;
              font-weight: 900;
            }

            .sb-lbl {
              font-size: 8px;
              color: #64748b;
            }
          }
        }
      }

      .roadmap-container-pdf {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 12px 14px;

        .roadmap-header-pdf {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .roadmap-steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;

          .roadmap-step-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px;

            &.highlight {
              border-color: #059669;
              background: #f0fdf4;
            }

            .step-top-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;

              .step-num {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #0284c7;
                color: #ffffff;
                font-size: 9px;
                font-weight: 800;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .step-badge {
                font-size: 8px;
                font-weight: 800;
                padding: 1px 4px;
                border-radius: 3px;
                background: #f1f5f9;
                color: #475569;

                &.green { background: #059669; color: #ffffff; }
              }
            }

            h4 {
              margin: 0 0 4px;
              font-size: 10.5px;
              font-weight: 800;
              color: #0f172a;
            }

            ul {
              margin: 0;
              padding-left: 12px;
              font-size: 8.5px;
              color: #475569;
              line-height: 1.35;
            }
          }
        }
      }

      /* NOTES SUMMARY */
      .notes-summary-box {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .note-bullet-line {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
          display: flex;
          gap: 6px;
          align-items: flex-start;
          font-size: 10.5px;

          .n-date {
            font-weight: 700;
            color: #0284c7;
            white-space: nowrap;
          }

          .n-author {
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
          }

          .n-text {
            color: #334155;
            line-height: 1.4;
          }
        }
      }

      /* COMMON HELPER PILLS */
      .risk-pill {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 800;

        &.red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        &.amber { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
        &.blue { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
        &.green { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
      }

      .text-red { color: #dc2626; }
      .text-amber { color: #d97706; }
      .text-blue { color: #0284c7; }
      .text-emerald { color: #059669; }
      .text-purple { color: #7c3aed; }

      .arch-uploaded-container {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 10px;
        background: #f8fafc;
        margin-bottom: 12px;

        .auc-header {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .pdf-custom-arch-img {
          width: 100%;
          max-height: 280px;
          object-fit: contain;
          border-radius: 4px;
          background: #ffffff;
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class QuickPdfExportModalComponent {
  quickToolsService = inject(QuickToolsService);
  customerService = inject(CustomerService);
  basisService = inject(BasisSizingService);
  notesService = inject(NotesService);
  modullerService = inject(ModullerService);

  @ViewChild('exportContainer') exportContainer?: ElementRef<HTMLElement>;

  isExporting = signal<boolean>(false);
  exportProgress = signal<string>('0%');
  exportPercent = signal<number>(0);

  currentDateStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  // 14 DISTINCT MENUS AND SUB-MENUS MATCHING THE SIDEBAR 1-TO-1
  menuItems: ReportMenuItem[] = [
    {
      id: 'reports',
      name: '1. Yönetici Özeti',
      group: 'ÖZET',
      desc: 'RISE Match Skoru, Bulut Uyumu, 1. Amaç (8 Sütun), 2. Nasıl Yapıyoruz (4 Aşama) ve Notlar',
      icon: 'file-text',
      selected: true
    },
    {
      id: 'modules-summary',
      name: '2. Bulgularımız (Modüller)',
      group: 'SAP UYGULAMALARI',
      desc: 'Modül kullanım oranları, tespit edilen darboğazlar ve süreç kazanımları',
      icon: 'sliders',
      selected: true
    },
    {
      id: 'modules-detail',
      name: '3. Detaylı Analiz (Süreçler)',
      group: 'SAP UYGULAMALARI',
      desc: 'FI, CO, SD, MM, PP vb. derinlemesine modüler süreç analiz tablosu',
      icon: 'layers',
      selected: true
    },
    {
      id: 'development',
      name: '4. Geliştirmeler (Custom Code)',
      group: 'SAP UYGULAMALARI',
      desc: '10 Nesne tipi (User-Exit, RFC, Z-Tablo vb.), adetler, riskler ve Clean Core hedefleri',
      icon: 'cpu',
      selected: true
    },
    {
      id: 'architecture-po',
      name: '5. Entegrasyon Haritası (PO/BTP)',
      group: 'SAP UYGULAMALARI',
      desc: 'SAP PO ➔ BTP Integration Suite akış topolojisi şeması ve canlı servisler tablosu',
      icon: 'bolt',
      selected: true
    },
    {
      id: 'analytics',
      name: '6. FUE Lisans Analizi',
      group: 'LİSANS & BULUT',
      desc: 'Named User vs FUE lisans dönüşümü, katsayılar ve atıl lisans tasarrufu',
      icon: 'bolt',
      selected: true
    },
    {
      id: 'source-sizing',
      name: '7. Mevcut / Hedef Sistem (Sizing)',
      group: 'TEKNİK ALTYAPI',
      desc: 'Donanım, CPU/RAM/Disk, SAP HANA bellek boyutlandırması ve S/4HANA Private Cloud mimarisi',
      icon: 'database',
      selected: true
    },
    {
      id: 'architecture-asis',
      name: '8. Sistem Ortamı & Destek Bitişi',
      group: 'TEKNİK ALTYAPI',
      desc: 'Mevcut AS-IS 3 katmanlı mimari şeması, sunucu envanteri ve 2027 EoS risk takvimi',
      icon: 'shield',
      selected: true
    },
    {
      id: 'largest-tables',
      name: '9. En Büyük Tablolar (DVM)',
      group: 'TEKNİK ALTYAPI',
      desc: 'Data Volume Management analizi, en büyük tablolar, arşivleme ve HANA bellek tasarrufu',
      icon: 'layers',
      selected: true
    },
    {
      id: 'solution-recommended',
      name: '10. Önerilen Yöntem (Brownfield)',
      group: 'ÇÖZÜM ÖNERİSİ',
      desc: 'Brownfield sistem dönüşüm stratejisi, 4 fazlı canlıya geçiş takvimi ve teslimatlar',
      icon: 'map',
      selected: true
    },
    {
      id: 'solution-architecture',
      name: '11. Hedef Mimari (RISE PCE)',
      group: 'ÇÖZÜM ÖNERİSİ',
      desc: 'RISE with SAP PCE 4 katmanlı bulut mimarisi şeması ve 3. parti entegrasyon haritası',
      icon: 'sparkles',
      selected: true
    },
    {
      id: 'solution-methods',
      name: '12. 4 Geçiş Yöntemi & Karşılaştırma',
      group: 'ÇÖZÜM ÖNERİSİ',
      desc: 'Brownfield, Lift & Shift, Selective Data, Greenfield kartları ve Karşılaştırma Matrisi',
      icon: 'sliders',
      selected: true
    },
    {
      id: 'business-case',
      name: '13. Toplam Sahip Olma Maliyeti (TCO)',
      group: 'FİNANSAL ANALİZ',
      desc: '5 yıllık finansal simülasyon, On-Premise vs RISE karşılaştırması ve ROI analizi',
      icon: 'dollar',
      selected: true
    },
    {
      id: 'notes',
      name: '14. Notlar',
      group: 'DEĞERLENDİRME',
      desc: 'Satış, Presales ve müşteri için kaydedilmiş tüm zaman damgalı notlar',
      icon: 'file-text',
      selected: true
    }
  ];

  selectedCount(): number {
    return this.menuItems.filter(m => m.selected).length;
  }

  selectedItems(): ReportMenuItem[] {
    return this.menuItems.filter(m => m.selected);
  }

  isItemIncluded(id: string): boolean {
    return !!this.menuItems.find(m => m.id === id && m.selected);
  }

  selectAll(): void {
    this.menuItems.forEach(m => m.selected = true);
  }

  deselectAll(): void {
    this.menuItems.forEach(m => m.selected = false);
  }

  onSelectionChange(): void {}

  close(): void {
    this.quickToolsService.closePdfExport();
  }

  getPillarColor(colorClass: string): string {
    switch (colorClass) {
      case 'blue': return '#0284c7';
      case 'emerald': return '#059669';
      case 'purple': return '#7c3aed';
      case 'amber': return '#d97706';
      default: return '#0284c7';
    }
  }

  getExecutiveData(): ExecutiveSummaryData {
    const custId = this.customerService.activeCustomer()?.id || 'default';
    const custName = this.customerService.activeCustomer()?.name || '';
    try {
      const raw = localStorage.getItem(`task_force_exec_summary_${custId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return getDefaultExecutiveData(custName);
  }

  getSeverityCount(severity: string): number {
    return this.modullerService.cards().filter(c => c.severity === severity).length;
  }

  getTopModuleCards(limit: number) {
    const cards = this.modullerService.cards();
    return cards.slice(0, limit);
  }

  getCustomCodeItems(): CustomCodeItem[] {
    return DEFAULT_CUSTOM_CODE_ITEMS;
  }

  getAsisImage(): string | null {
    const custId = this.customerService.activeCustomerId();
    return localStorage.getItem(`taskforce_target_arch_asis_img_${custId}`) || null;
  }

  getTobeImage(): string | null {
    const custId = this.customerService.activeCustomerId();
    return localStorage.getItem(`taskforce_target_arch_tobe_img_${custId}`) || null;
  }

  getMethodCards(): MethodCardData[] {
    const custId = this.customerService.activeCustomerId();
    try {
      const saved = localStorage.getItem(`taskforce_method_cards_${custId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return getDefaultMethodCards();
  }

  getRecommendedData(): RecommendedMethodData {
    const custId = this.customerService.activeCustomerId();
    const custName = this.customerService.activeCustomer()?.name || '';
    try {
      const saved = localStorage.getItem(`taskforce_recommended_method_${custId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return getDefaultRecommendedData(custName);
  }

  async generateMultiMenuPdf(): Promise<void> {
    if (this.selectedCount() === 0 || this.isExporting()) return;

    this.isExporting.set(true);
    this.exportProgress.set('Sayfalar hazırlanıyor...');
    this.exportPercent.set(5);

    try {
      // Allow Angular change detection to render the container into DOM
      await new Promise(resolve => setTimeout(resolve, 400));

      const container = this.exportContainer?.nativeElement || document.getElementById('multiMenuPdfContainer');
      if (!container) {
        throw new Error('PDF container not found');
      }

      // Query all page elements: cover + sections
      const sections = container.querySelectorAll('.pdf-page, .pdf-page-section');
      if (sections.length === 0) {
        throw new Error('No printable sections found');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;

      let isFirstPage = true;

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i] as HTMLElement;
        const progressPercent = Math.round(((i + 1) / sections.length) * 100);
        this.exportPercent.set(progressPercent);
        this.exportProgress.set(`Sayfa ${i + 1} / ${sections.length} (${progressPercent}%) taranıyor...`);

        // Small yield to let UI and styles paint
        await new Promise(resolve => setTimeout(resolve, 80));

        const canvas = await html2canvas(sec, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        if (!isFirstPage) {
          pdf.addPage();
        } else {
          isFirstPage = false;
        }

        // Add to PDF page
        if (imgHeight <= pageHeight) {
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight, undefined, 'FAST');
        } else {
          // If section content exceeds single A4 page height, slice into multiple pages
          let heightLeft = imgHeight;
          let position = 0;
          pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;

          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
          }
        }
      }

      this.exportProgress.set('PDF dosyası kaydediliyor...');
      const custName = (this.customerService.activeCustomer()?.name || 'Musteri').replace(/\s+/g, '_');
      pdf.save(`${custName}_SAP_Kapsamli_Donusum_Raporu.pdf`);

      // Wait a moment then close
      await new Promise(resolve => setTimeout(resolve, 500));
      this.close();
    } catch (err) {
      console.error('Multi-menu PDF generation failed:', err);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      this.isExporting.set(false);
      this.exportPercent.set(0);
    }
  }
}
