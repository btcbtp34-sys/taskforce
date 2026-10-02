import { Component, inject, signal, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuickToolsService } from '../../../core/services/quick-tools.service';
import { CustomerService } from '../../../core/services/customer.service';
import { BasisSizingService } from '../../../core/services/basis-sizing.service';
import { NotesService } from '../../../core/services/notes.service';
import { ModullerService, ModuleCard } from '../../../core/services/moduller.service';
import { DataImportService } from '../../../core/services/data-import.service';
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
import { BTC_LOGO_BASE64 } from './btc-logo-base64';

const DEFAULT_ASIS_ITEMS: { id: string; name: string; values: number[] }[] = [
  { id: 'a1', name: 'Existing Maintenance', values: [80000, 80000, 80000, 80000, 80000] },
  { id: 'a2', name: 'Additional License (S/4 Transformation)', values: [0, 10000, 0, 0, 0] },
  { id: 'a3', name: 'Additional Maintenance', values: [0, 0, 0, 0, 0] },
  { id: 'a4', name: 'Infra/Hosting', values: [36000, 36000, 36000, 36000, 36000] },
  { id: 'a5', name: 'Infra Extensions', values: [0, 0, 0, 0, 0] },
  { id: 'a6', name: 'Disaster Recovery', values: [10000, 10000, 10000, 10000, 10000] },
  { id: 'a7', name: 'Security', values: [2000, 2000, 2000, 2000, 2000] },
  { id: 'a8', name: 'Basis/Upgrade', values: [36000, 136000, 36000, 36000, 36000] },
  { id: 'a9', name: 'Innovation Cost (AI, Sustainability etc.)', values: [50000, 50000, 50000, 50000, 50000] }
];

const DEFAULT_RISE_ITEMS: { id: string; name: string; values: number[] }[] = [
  { id: 'r1', name: 'RISE Fee', values: [500000, 400000, 400000, 400000, 400000] },
  { id: 'r2', name: 'RISE Fund', values: [0, 0, 0, 0, 0] },
  { id: 'r3', name: 'Project / Implementation', values: [200000, 0, 0, 0, 0] }
];

export interface ReportMenuItem {
  id: string;
  name: string;
  group: string;
  desc: string;
  icon: string;
  selected: boolean;
  hasDrawing?: boolean;
  captureScreenshot?: boolean;
  drawingLabel?: string;
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
                  <strong>{{ getActiveCustomerCleanName() }}</strong> için PDF dokümanına dahil edilecek tüm menü ve sayfaları seçiniz.
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
                <div class="menu-checkbox-card" [class.checked]="item.selected">
                  <label class="card-main-row">
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

                  @if (item.hasDrawing) {
                    <div class="drawing-sub-option" [class.disabled]="!item.selected">
                      <label class="drawing-sub-label" (click)="$event.stopPropagation()">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="item.captureScreenshot" 
                          [disabled]="!item.selected"
                        />
                        <div class="sub-badge-content">
                          <span class="sub-camera-badge">📸 Ekran Görüntüsü Al (SS)</span>
                          <span class="sub-badge-desc">{{ item.drawingLabel }}</span>
                        </div>
                      </label>
                    </div>
                  }
                </div>
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
                    <div class="score-label">{{ getExecutiveData().heroScore?.matchLabel || 'RISE SKORU' }}</div>
                  </div>
                  <div class="score-text-pdf">
                    <div class="status-pill-green-pdf">✓ {{ getExecutiveData().heroScore?.badgeText || 'RISE WITH SAP GEÇİŞİNE YÜKSEK DERECEDE UYGUN' }}</div>
                    <h3>{{ cleanCustomerText(getExecutiveData().heroScore?.title) || (getActiveCustomerCleanName() + ' RISE Readiness & Bulut Uyum Analizi') }}</h3>
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
              <p class="section-p">{{ cleanCustomerText(getExecutiveData().objectiveSubtitle) }}</p>

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

              <!-- 2. Önerilen Geçiş Yöntemi Hero Kartı -->
              <div class="hero-recommendation-card-pdf" style="margin-top: 15px;">
                <div class="hr-left">
                  <span class="hr-pill">{{ getExecutiveData().recommendedMethod?.badge || getRecommendedData().badge }}</span>
                  <h2>{{ cleanCustomerText(getExecutiveData().recommendedMethod?.title || getRecommendedData().title) }}</h2>
                  <p>{{ cleanCustomerText(getExecutiveData().recommendedMethod?.description || getRecommendedData().description) }}</p>
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
                <h3>Sistem Modül Bulguları & Süreç Dağılımı</h3>
                <p>{{ getActiveCustomerCleanName() }} SAP sistemine ait modüler süreç analizinde toplam <strong>{{ modullerService.cards().length }} adet</strong> operasyonel bulgu ve iyileştirme alanı tespit edilmiştir.</p>
              </div>

              <!-- Severity Breakdown (5 KPIs matching UI) -->
              <div class="kpi-mini-grid" style="margin-top: 10px;">
                <div class="kpi-box">
                  <span class="k-label">Genel Toplam</span>
                  <strong class="k-val">{{ modullerService.cards().length }} Adet</strong>
                  <span class="k-sub">Değerlendirme Maddesi</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Kritik</span>
                  <strong class="k-val text-red">{{ getSeverityCount('Kritik') }} Adet</strong>
                  <span class="k-sub">Öncelikli Eylem</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Yüksek</span>
                  <strong class="k-val text-amber">{{ getSeverityCount('Yüksek') }} Adet</strong>
                  <span class="k-sub">İyileştirme Fırsatı</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Orta</span>
                  <strong class="k-val text-blue">{{ getSeverityCount('Orta') }} Adet</strong>
                  <span class="k-sub">Standart Süreç</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Düşük</span>
                  <strong class="k-val text-emerald">{{ getSeverityCount('Düşük') }} Adet</strong>
                  <span class="k-sub">S/4HANA Hazır</span>
                </div>
              </div>

              <!-- Modül Bazlı Dağılım Matrisi -->
              <div class="sub-block-title" style="margin-top: 10px; margin-bottom: 2px;">
                <app-icon name="layers" [size]="14" color="#0284c7"></app-icon>
                <span>Başlık & Modül Bazlı Dağılım Matrisi</span>
              </div>
              <div class="module-distribution-pdf-grid">
                @for (cat of getModuleCategoryBreakdown(); track cat.name) {
                  <div class="mod-dist-card-pdf">
                    <div class="mdc-head">
                      <strong>{{ cat.name }}</strong>
                      <span class="mdc-total">{{ cat.total }} Bulgu</span>
                    </div>
                    <div class="mdc-pills">
                      <span class="m-chip chip-k" *ngIf="cat.kritik > 0">🔴 {{ cat.kritik }} Kritik</span>
                      <span class="m-chip chip-y" *ngIf="cat.yuksek > 0">🟠 {{ cat.yuksek }} Yüksek</span>
                      <span class="m-chip chip-o" *ngIf="cat.orta > 0">🟡 {{ cat.orta }} Orta</span>
                      <span class="m-chip chip-d" *ngIf="cat.dusuk > 0">🔵 {{ cat.dusuk }} Düşük</span>
                    </div>
                  </div>
                }
              </div>

              <!-- Module Categories Full Breakdown Table -->
              <div class="sub-block-title" style="margin-top: 10px; margin-bottom: 2px;">
                <app-icon name="sliders" [size]="14" color="#059669"></app-icon>
                <span>Modüler Değerlendirme Bulguları ve Süreç Kazanımları (Modül Dağılımı)</span>
              </div>
              <div class="table-wrap">
                <table class="report-data-table compact-pdf-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Modül / Süreç Alanı</th>
                      <th style="width: 15%;">Toplam Bulgu</th>
                      <th style="width: 15%;">Kritik Seviye</th>
                      <th style="width: 15%;">Yüksek Seviye</th>
                      <th style="width: 15%;">Standart / Uyumlu</th>
                      <th style="width: 15%;">Dönüşüm Durumu</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (cat of getModuleCategoryBreakdown(); track cat.name) {
                      <tr>
                        <td><strong>{{ cat.name }}</strong></td>
                        <td><strong>{{ cat.total }} Bulgu</strong></td>
                        <td><span class="risk-pill red">{{ cat.kritik }} Kritik</span></td>
                        <td><span class="risk-pill amber">{{ cat.yuksek }} Yüksek</span></td>
                        <td><span class="risk-pill green">{{ cat.orta + cat.dusuk }} Uyumlu</span></td>
                        <td><span class="text-emerald" style="font-weight: 700;">✓ S/4HANA Hazır</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 3. SAP UYGULAMALARI - DETAYLI MODÜLER SÜREÇ ANALİZİ (TÜM BULGULAR)         -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('modules-detail')) {
          @for (page of getPaginatedDetailedCards(20); track $index) {
            <div class="pdf-page-section">
              <div class="section-badge-header">
                <div class="sb-title">3. SAP UYGULAMALARI - DETAYLI MODÜLER SÜREÇ ANALİZİ (Sayfa {{ $index + 1 }} / {{ getPaginatedDetailedCards(20).length }})</div>
                <div class="sb-meta">Tüm {{ modullerService.cards().length }} Süreç Bulgusu, Öncelik Seviyeleri ve S/4HANA Dönüşüm Notları</div>
              </div>

              <div class="section-content-box">
                @if ($index === 0) {
                  <div class="analysis-card" style="margin-bottom: 6px;">
                    <h3>Detaylı Süreç Değerlendirme & S/4HANA Dönüşüm Çözümleri</h3>
                    <p>{{ getActiveCustomerCleanName() }} operasyonel süreçlerine yönelik tespit edilen <strong>tüm {{ modullerService.cards().length }} adet</strong> bulgunun eksiksiz dökümü:</p>
                  </div>
                }

                <div class="table-wrap">
                  <table class="report-data-table compact-pdf-table">
                    <thead>
                      <tr>
                        <th style="width: 17%;">Modül / Kategori</th>
                        <th style="width: 25%;">Süreç / Bulgu Başlığı</th>
                        <th style="width: 12%;">Önem</th>
                        <th style="width: 13%;">Durum</th>
                        <th style="width: 33%;">Süreç Bulguları & Çözüm Notları</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (card of page; track card.id) {
                        <tr>
                          <td><strong>{{ card.category }}</strong></td>
                          <td>{{ card.title }}</td>
                          <td>
                            <span class="risk-pill" [ngClass]="card.severity === 'Kritik' ? 'red' : card.severity === 'Yüksek' ? 'amber' : 'blue'">
                              {{ card.severity }}
                            </span>
                          </td>
                          <td>{{ card.status }}</td>
                          <td>
                            @if (card.bullets && card.bullets.length > 0) {
                              <ul class="table-bullet-list">
                                @for (b of card.bullets.slice(0, 2); track b) {
                                  <li>{{ b }}</li>
                                }
                              </ul>
                            } @else {
                              {{ card.footerNote || '—' }}
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }
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
                  <strong class="k-val">{{ getCustomCodeStats().total.toLocaleString('tr-TR') }} Adet</strong>
                  <span class="k-sub">Aktif Custom Kod</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Atıl / Kullanılmayan Kod</span>
                  <strong class="k-val text-emerald">%{{ getCustomCodeStats().retiredPercent }}</strong>
                  <span class="k-sub">Doğrudan Temizlenebilir</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Standarda Dönüştürülebilir</span>
                  <strong class="k-val text-blue">{{ getCustomCodeStats().standardConvertible.toLocaleString('tr-TR') }} Adet</strong>
                  <span class="k-sub">S/4HANA Standart Süreci</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">BTP Clean Core Adayı</span>
                  <strong class="k-val text-purple">{{ getCustomCodeStats().btpCandidates.toLocaleString('tr-TR') }} Adet</strong>
                  <span class="k-sub">Side-by-Side Genişletme</span>
                </div>
              </div>

              <!-- Custom Code Objects Table -->
              @if (getCustomCodeItems().length > 0) {
                <div class="table-wrap" style="margin-top: 15px;">
                  <table class="report-data-table">
                    <thead>
                      <tr>
                        <th>Nesne Tipi</th>
                        <th>Kategori</th>
                        <th>Mevcut Adet</th>
                        <th>Risk Seviyesi</th>
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
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div class="empty-state-pdf" style="margin-top: 15px;">
                  <app-icon name="info" [size]="20" color="#64748b"></app-icon>
                  <span>Sistemde kayıtlı özel geliştirme (custom code) verisi bulunmamaktadır.</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 5. ENTEGRASYON MİMARİSİ (PO / BTP INTEGRATION SUITE)                       -->
        <!-- ========================================================================= -->
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
              @if (getPoDrawing()) {
                <div class="arch-uploaded-container">
                  <div class="auc-header">SAP PO / BTP Entegrasyon Mimari Akış Çizimi:</div>
                  <img [src]="getPoDrawing()" class="pdf-custom-arch-img" alt="PO / BTP Entegrasyon Mimari Çizimi" />
                </div>
              } @else {
                <div class="empty-state-pdf">
                  <app-icon name="info" [size]="20" color="#64748b"></app-icon>
                  <span>Sistemde SAP PO / BTP entegrasyon akış çizimi bulunmamaktadır.</span>
                </div>
              }
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
              @if (basisService.hasUploadedData()) {
                <div class="kpi-mini-grid">
                  <div class="kpi-box">
                    <span class="k-label">Mevcut Toplam Kullanıcı</span>
                    <strong class="k-val">{{ basisService.fueSummary()?.totalUsers || customerService.activeCustomer().sapUserCount }} Kullanıcı</strong>
                    <span class="k-sub">Sistem Kullanıcı Envanteri</span>
                  </div>
                  <div class="kpi-box">
                    <span class="k-label">Gereken RISE FUE</span>
                    <strong class="k-val text-blue">{{ basisService.fueSummary()?.calculatedFUE || 0 }} FUE</strong>
                    <span class="k-sub">Optimize Edilmiş Model</span>
                  </div>
                  <div class="kpi-box">
                    <span class="k-label">Professional (Advanced)</span>
                    <strong class="k-val text-amber">{{ basisService.fueSummary()?.hbCount || 0 }} Kullanıcı</strong>
                    <span class="k-sub">{{ basisService.fueSummary()?.hbCount || 0 }} FUE (1:1)</span>
                  </div>
                  <div class="kpi-box">
                    <span class="k-label">Core / Functional</span>
                    <strong class="k-val text-emerald">{{ (basisService.fueSummary()?.hcCount || 0) + (basisService.fueSummary()?.hdCount || 0) }} Kullanıcı</strong>
                    <span class="k-sub">Dönüşüm Avantajı</span>
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
                        <td><strong>Advanced / Professional User</strong></td>
                        <td>{{ basisService.fueSummary()?.hbCount || 0 }} Kullanıcı</td>
                        <td>1 : 1</td>
                        <td>{{ basisService.fueSummary()?.hbCount || 0 }} FUE</td>
                        <td>Finans, satınalma ve sistem yöneticileri (Tüm ERP yetkisi)</td>
                      </tr>
                      <tr>
                        <td><strong>Core / Functional User</strong></td>
                        <td>{{ basisService.fueSummary()?.hcCount || 0 }} Kullanıcı</td>
                        <td>5 : 1 (0.2 FUE)</td>
                        <td>{{ ((basisService.fueSummary()?.hcCount || 0) / 5) | number:'1.1-1' }} FUE</td>
                        <td>Satış temsilcileri, depo ve operasyon ekipleri</td>
                      </tr>
                      <tr>
                        <td><strong>Self-Service / Productivity User</strong></td>
                        <td>{{ basisService.fueSummary()?.hdCount || 0 }} Kullanıcı</td>
                        <td>30 : 1 (0.033 FUE)</td>
                        <td>{{ ((basisService.fueSummary()?.hdCount || 0) / 30) | number:'1.1-1' }} FUE</td>
                        <td>İzin, talep onayları, masraf girişi ve rapor izleme</td>
                      </tr>
                      <tr class="highlight-total-row">
                        <td><strong>TOPLAM FUE GEREKSİNİMİ</strong></td>
                        <td><strong>{{ basisService.fueSummary()?.totalUsers || 0 }} Kullanıcı</strong></td>
                        <td><strong>Dinamik Havuz</strong></td>
                        <td><strong class="text-blue">{{ basisService.fueSummary()?.calculatedFUE || 0 }} FUE</strong></td>
                        <td><strong>Atıl lisans maliyetleri ve aşım riski kalıcı olarak sıfırlanır</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              } @else {
                <div class="empty-state-pdf">
                  <app-icon name="info" [size]="20" color="#64748b"></app-icon>
                  <span>FUE & Lisans analizi için henüz sisteme yüklenmiş veri bulunmamaktadır.</span>
                </div>
              }
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
              @if (basisService.hasUploadedData()) {
                <div class="table-wrap">
                  <table class="report-data-table">
                    <thead>
                      <tr>
                        <th>Metrik / Bileşen</th>
                        <th>Mevcut On-Premise Sistem</th>
                        <th>RISE with SAP Hedef Sistem (Private Cloud)</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (basisService.sizingMatrix().length > 0) {
                        @for (row of basisService.sizingMatrix(); track row.product) {
                          <tr>
                            <td><strong>{{ row.product }}</strong></td>
                            <td>{{ row.current }}</td>
                            <td>{{ row.target }}</td>
                          </tr>
                        }
                      } @else {
                        @if (basisService.systemInfo()?.dbType) {
                          <tr>
                            <td><strong>Veritabanı Motoru</strong></td>
                            <td>{{ basisService.systemInfo()?.dbType }}</td>
                            <td>SAP HANA 2.0 In-Memory DB</td>
                          </tr>
                        }
                        @if (basisService.systemInfo()?.diskSizeGiB) {
                          <tr>
                            <td><strong>Disk / Veri Boyutu</strong></td>
                            <td>{{ basisService.systemInfo()?.diskSizeGiB }} GB</td>
                            <td>{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB || 'Optimize' }} GB HANA Bellek</td>
                          </tr>
                        }
                        @if (basisService.systemInfo()?.operatingSystem) {
                          <tr>
                            <td><strong>İşletim Sistemi</strong></td>
                            <td>{{ basisService.systemInfo()?.operatingSystem }}</td>
                            <td>SUSE Linux Enterprise Server for SAP (SLES)</td>
                          </tr>
                        }
                        @if (basisService.systemInfo()?.nwRelease) {
                          <tr>
                            <td><strong>SAP NetWeaver Sürümü</strong></td>
                            <td>{{ basisService.systemInfo()?.nwRelease }}</td>
                            <td>SAP S/4HANA Private Cloud Edition</td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div class="empty-state-pdf">
                  <app-icon name="info" [size]="20" color="#64748b"></app-icon>
                  <span>Teknik altyapı ve sistem boyutlandırması (Sizing) için sisteme yüklenmiş veri bulunmamaktadır.</span>
                </div>
              }
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
              <div class="sb-meta">Mevcut Mimari Şeması, Sürüm Uyumluluğu ve RISE with SAP Hedef Topolojisi</div>
            </div>

            <div class="section-content-box">
              @if (getAsisDrawing() && getRiseStudioDrawing()) {
                <div class="split-arch-pdf-grid">
                  <div class="arch-uploaded-container">
                    <div class="auc-header">Mevcut Durum (AS-IS) Mimari Akış Şeması / Çizimi:</div>
                    <img [src]="getAsisDrawing()" class="pdf-custom-arch-img-split" alt="AS-IS Mimari Çizimi" />
                  </div>
                  <div class="arch-uploaded-container">
                    <div class="auc-header">RISE with SAP Sistem Ortamı Mimari Çizimi:</div>
                    <img [src]="getRiseStudioDrawing()" class="pdf-custom-arch-img-split" alt="RISE with SAP Mimari Çizimi" />
                  </div>
                </div>
              } @else if (getAsisDrawing()) {
                <div class="arch-uploaded-container">
                  <div class="auc-header">Mevcut Durum (AS-IS) Mimari Akış Şeması / Çizimi:</div>
                  <img [src]="getAsisDrawing()" class="pdf-custom-arch-img" alt="AS-IS Mimari Çizimi" />
                </div>
              } @else if (getRiseStudioDrawing()) {
                <div class="arch-uploaded-container">
                  <div class="auc-header">RISE with SAP Sistem Ortamı Mimari Çizimi:</div>
                  <img [src]="getRiseStudioDrawing()" class="pdf-custom-arch-img" alt="RISE with SAP Mimari Çizimi" />
                </div>
              } @else {
                <div class="empty-state-pdf">
                  <app-icon name="info" [size]="20" color="#64748b"></app-icon>
                  <span>Mevcut durum (AS-IS) veya RISE with SAP mimari akış şeması / çizimi bulunmamaktadır.</span>
                </div>
              }
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
              @if (basisService.hasUploadedData() && basisService.largestTables().length > 0) {
                <div class="kpi-mini-grid">
                  <div class="kpi-box">
                    <span class="k-label">Toplam Tablo Hacmi</span>
                    <strong class="k-val">{{ getLargestTablesTotalVolume() }} GB</strong>
                    <span class="k-sub">İncelenen Tablolar</span>
                  </div>
                  <div class="kpi-box">
                    <span class="k-label">İncelenen Tablo Sayısı</span>
                    <strong class="k-val text-blue">{{ basisService.largestTables().length }} Adet</strong>
                    <span class="k-sub">DVM Kapsamı</span>
                  </div>
                  <div class="kpi-box">
                    <span class="k-label">En Büyük Tablo</span>
                    <strong class="k-val text-amber">{{ basisService.largestTables()[0].name }}</strong>
                    <span class="k-sub">{{ basisService.largestTables()[0].sizeGiB }} GB</span>
                  </div>
                  <div class="kpi-box">
                    <span class="k-label">Arşivleme Potansiyeli</span>
                    <strong class="k-val text-emerald">{{ basisService.largestTables()[0].archivingPotential || '%40 - %50' }}</strong>
                    <span class="k-sub">Soğuk Veri / DVM</span>
                  </div>
                </div>

                <!-- Tables Table -->
                <div class="table-wrap" style="margin-top: 15px;">
                  <table class="report-data-table">
                    <thead>
                      <tr>
                        <th>Tablo Adı</th>
                        <th>Modül & Tanım</th>
                        <th>Mevcut Boyut</th>
                        <th>Arşivleme / DVM Stratejisi</th>
                        <th>Tasarruf Potansiyeli</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (table of basisService.largestTables().slice(0, 10); track table.name) {
                        <tr>
                          <td><strong>{{ table.name }}</strong></td>
                          <td>{{ table.module ? (table.module + ' - ' + (table.desc || '')) : (table.desc || '—') }}</td>
                          <td><strong>{{ table.sizeGiB }} GB</strong></td>
                          <td>{{ table.recommendation || 'DVM arşivleme stratejisi uygulanmalı' }}</td>
                          <td>
                            <span class="risk-pill green">{{ table.archivingPotential || '%40 - %50 Arşivleme' }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div class="empty-state-pdf">
                  <app-icon name="info" [size]="20" color="#64748b"></app-icon>
                  <span>Veritabanı en büyük tablolar ve DVM (Veri Hacmi Yönetimi) analizi için henüz sisteme yüklenmiş veri bulunmamaktadır.</span>
                </div>
              }
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
              <div class="sb-meta">Mevcut Altyapı Topolojisi vs Bulut Hedef Mimarisi Karşılaştırması</div>
            </div>

            <div class="section-content-box">
              @if (getSolutionTobeImage() && getSolutionAsisImage()) {
                <div class="split-arch-pdf-grid">
                  <div class="arch-uploaded-container">
                    <div class="auc-header">Çözüm Önerisi - Mevcut Altyapı (AS-IS) Görseli:</div>
                    <img [src]="getSolutionAsisImage()" class="pdf-custom-arch-img-split" alt="Mevcut Mimari Görseli" />
                  </div>
                  <div class="arch-uploaded-container">
                    <div class="auc-header">RISE with SAP PCE Bulut Hedef Mimarisi Görseli:</div>
                    <img [src]="getSolutionTobeImage()" class="pdf-custom-arch-img-split" alt="Hedef Mimari Görseli" />
                  </div>
                </div>
              } @else if (getSolutionTobeImage()) {
                <div class="arch-uploaded-container">
                  <div class="auc-header">RISE with SAP PCE Bulut Hedef Mimarisi Görseli:</div>
                  <img [src]="getSolutionTobeImage()" class="pdf-custom-arch-img" alt="Hedef Mimari Görseli" />
                </div>
              } @else if (getSolutionAsisImage()) {
                <div class="arch-uploaded-container">
                  <div class="auc-header">Çözüm Önerisi - Mevcut Altyapı (AS-IS) Görseli:</div>
                  <img [src]="getSolutionAsisImage()" class="pdf-custom-arch-img" alt="Mevcut Mimari Görseli" />
                </div>
              } @else {
                <div class="empty-state-pdf">
                  <app-icon name="info" [size]="20" color="#64748b"></app-icon>
                  <span>Çözüm Önerisi hedef veya mevcut mimari için sisteme yüklenmiş görsel bulunmamaktadır.</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 12. ÇÖZÜM ÖNERİSİ: 3. 4 GEÇİŞ YÖNTEMİ                                      -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('solution-methods')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">12. ÇÖZÜM ÖNERİSİ: 3. 4 GEÇİŞ YÖNTEMİ ANALİZİ</div>
              <div class="sb-meta">Brownfield, Lift & Shift, Selective Data Transition ve Greenfield Stratejisi</div>
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
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- 13. TOPLAM SAHİP OLMA MALİYETİ (TCO & ROI)                                -->
        <!-- ========================================================================= -->
        <!-- ========================================================================= -->
        <!-- 13. TOPLAM SAHİP OLMA MALİYETİ (TCO & ROI)                                -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('business-case')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">13. TOPLAM SAHİP OLMA MALİYETİ (TCO & ROI SİMÜLASYONU)</div>
              <div class="sb-meta">{{ hasTcoData() ? getTcoData().years.length + ' Yıllık Karşılaştırmalı Finansal Model ve Yatırım Getirisi' : '5 Yıllık Karşılaştırmalı Finansal Model ve Yatırım Getirisi' }}</div>
            </div>

            <div class="section-content-box">
              @if (hasTcoData()) {
                @if (getTcoImage()) {
                  <div class="tco-image-box-pdf">
                    <div class="auc-header">TCO / Finansal Simülasyon Ekran Görüntüsü:</div>
                    <img [src]="getTcoImage()" class="pdf-tco-img" alt="TCO Simülasyonu" />
                  </div>
                }

                <div class="kpi-mini-grid">
                  <div class="kpi-box">
                    <span class="k-label">{{ getTcoData().years.length }} Yıllık AS-IS Toplamı</span>
                    <strong class="k-val text-amber">€{{ getTcoData().asisTotal | number:'1.2-2' }}</strong>
                    <span class="k-sub">On-Premise Giderleri</span>
                  </div>
                  <div class="kpi-box">
                    <span class="k-label">{{ getTcoData().years.length }} Yıllık RISE Toplamı</span>
                    <strong class="k-val text-blue">€{{ getTcoData().riseTotal | number:'1.2-2' }}</strong>
                    <span class="k-sub">Bulut Abonelik & Proje</span>
                  </div>
                  <div class="kpi-box">
                    <span class="k-label">Net Finansal Fark</span>
                    <strong class="k-val text-purple">€{{ getTcoData().diff | number:'1.2-2' }}</strong>
                    <span class="k-sub">AS-IS vs RISE Farkı</span>
                  </div>
                  <div class="kpi-box">
                    <span class="k-label">Finansman Modeli</span>
                    <strong class="k-val text-emerald">OpEx Tabanlı</strong>
                    <span class="k-sub">Öngörülebilir Yıllık Model</span>
                  </div>
                </div>

                <!-- N-Year Simulation Table from System -->
                <div class="table-wrap" style="margin-top: 10px;">
                  <table class="report-data-table compact-pdf-table">
                    <thead>
                      <tr>
                        <th>Finansal Kalem (EUR)</th>
                        @for (yr of getTcoData().years; track yr) {
                          <th>{{ yr }}</th>
                        }
                        <th>Toplam ({{ getTcoData().years.length }} Yıl)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>AS-IS On-Premise (Mevcut Durum Giderleri)</strong></td>
                        @for (sum of getTcoData().asisYearSums; track $index) {
                          <td>€{{ sum | number:'1.2-2' }}</td>
                        }
                        <td><strong class="text-amber">€{{ getTcoData().asisTotal | number:'1.2-2' }}</strong></td>
                      </tr>
                      <tr>
                        <td><strong>RISE with SAP (Bulut Abonelik & Dönüşüm)</strong></td>
                        @for (sum of getTcoData().riseYearSums; track $index) {
                          <td>€{{ sum | number:'1.2-2' }}</td>
                        }
                        <td><strong class="text-blue">€{{ getTcoData().riseTotal | number:'1.2-2' }}</strong></td>
                      </tr>
                      <tr class="highlight-total-row">
                        <td><strong>NET STRATEJİK FAYDA / TCO KAZANIMI</strong></td>
                        <td [attr.colspan]="getTcoData().years.length">Donanım yenileme amortismanı sıfırlanır, operasyonel efor inovasyona kayar</td>
                        <td><strong class="text-emerald">Öngörülebilir Nakit Akışı</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              } @else {
                <div class="empty-state-pdf">
                  <app-icon name="info" [size]="20" color="#64748b"></app-icon>
                  <span>Bu müşteri için henüz sisteme kaydedilmiş TCO (Toplam Sahip Olma Maliyeti) finansal simülasyon verisi bulunmamaktadır.</span>
                </div>
              }
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
      flex-direction: column;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;
      transition: all 0.15s ease;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      }

      &.checked {
        border-color: #0284c7;
        background: #f0f9ff;
      }

      .card-main-row {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        cursor: pointer;
        width: 100%;
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

      .drawing-sub-option {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px dashed #cbd5e1;
        width: 100%;

        &.disabled {
          opacity: 0.45;
          pointer-events: none;
        }

        .drawing-sub-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          background: #ffffff;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #7dd3fc;
          box-shadow: 0 1px 3px rgba(2, 132, 199, 0.05);
          transition: all 0.15s ease;

          &:hover {
            border-color: #0284c7;
            background: #e0f2fe;
          }

          input[type="checkbox"] {
            width: 15px;
            height: 15px;
            accent-color: #0284c7;
            cursor: pointer;
            flex-shrink: 0;
          }

          .sub-badge-content {
            display: flex;
            flex-direction: column;
            gap: 1px;

            .sub-camera-badge {
              font-size: 0.73rem;
              font-weight: 700;
              color: #0369a1;
            }

            .sub-badge-desc {
              font-size: 0.67rem;
              color: #475569;
              line-height: 1.25;
            }
          }
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
      position: absolute;
      left: 0;
      top: 0;
      width: 860px;
      background: #ffffff;
      z-index: 100;
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

      /* GENERAL PDF PAGE SECTION - EXACT A4 RATIO (840 x 1188) */
      .pdf-page-section {
        width: 840px;
        min-height: 1188px;
        max-height: 1188px;
        padding: 28px 36px;
        box-sizing: border-box;
        page-break-after: always;
        overflow: hidden;
        background: #ffffff;
        border-bottom: 1px dashed #cbd5e1;

        .section-badge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 2px solid #0284c7;
          margin-bottom: 16px;
          padding-right: 110px;

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
          gap: 10px;
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

      .split-arch-pdf-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;

        .arch-uploaded-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px;
          width: 100%;

          .auc-header {
            font-size: 11px;
            font-weight: 800;
            color: #1e293b;
          }
        }

        .pdf-custom-arch-img-split {
          width: 100%;
          height: 440px;
          max-height: 440px;
          object-fit: contain;
          background: #ffffff;
          border-radius: 6px;
        }
      }

      .module-distribution-pdf-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        width: 100%;

        .mod-dist-card-pdf {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;

          .mdc-head {
            display: flex;
            justify-content: space-between;
            align-items: center;

            strong {
              font-size: 10.5px;
              color: #0f172a;
              font-weight: 800;
            }

            .mdc-total {
              font-size: 9.5px;
              color: #0284c7;
              font-weight: 700;
              background: #e0f2fe;
              padding: 1px 5px;
              border-radius: 8px;
            }
          }

          .mdc-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;

            .m-chip {
              font-size: 8.5px;
              font-weight: 700;
              padding: 1px 4px;
              border-radius: 3px;

              &.chip-k { background: #fee2e2; color: #b91c1c; }
              &.chip-y { background: #fef3c7; color: #b45309; }
              &.chip-o { background: #fef9c3; color: #854d0e; }
              &.chip-d { background: #e0f2fe; color: #0369a1; }
            }
          }
        }
      }

      .tco-image-box-pdf {
        width: 100%;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px;
        margin-bottom: 6px;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .auc-header {
          font-size: 11px;
          font-weight: 800;
          color: #1e293b;
        }

        .pdf-tco-img {
          width: 100%;
          max-height: 220px;
          object-fit: contain;
          border-radius: 4px;
        }
      }

      .compact-pdf-table {
        font-size: 10.5px;
        th {
          padding: 6px 8px;
          font-size: 11px;
        }
        td {
          padding: 5px 8px;
          font-size: 10.5px;
          line-height: 1.3;
        }
        .table-bullet-list {
          margin: 0;
          padding-left: 12px;
          li {
            font-size: 10px;
            line-height: 1.25;
          }
        }
      }

      .table-note-footer {
        font-size: 10px;
        font-style: italic;
        color: #64748b;
        margin-top: 4px;
        text-align: right;
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
          max-height: 440px;
          object-fit: contain;
          border-radius: 6px;
          background: #ffffff;
          image-rendering: -webkit-optimize-contrast;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
        }
      }

      .empty-state-pdf {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 24px 16px;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        color: #64748b;
        font-size: 10.5px;
        font-weight: 600;
        text-align: center;
        margin-top: 10px;
        margin-bottom: 10px;
      }

      .table-bullet-list {
        margin: 0;
        padding-left: 14px;
        font-size: 9px;
        color: #475569;
        line-height: 1.35;
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
  importService = inject(DataImportService);

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
      desc: 'RISE Skoru, Bulut Uyumu, 1. Amaç (8 Sütun), 2. Nasıl Yapıyoruz (4 Aşama) ve Notlar',
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
      selected: true,
      hasDrawing: true,
      captureScreenshot: true,
      drawingLabel: 'PO Entegrasyon Akış Çiziminin Ekran Görüntüsünü (SS) Dahil Et'
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
      selected: true,
      hasDrawing: true,
      captureScreenshot: true,
      drawingLabel: 'Sistem Ortamı Mimari Çizimini (AS-IS / RISE) Dahil Et'
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
      desc: 'RISE with SAP PCE 4 katmanlı bulut mimarisi şeması ve müşteri görseli',
      icon: 'sparkles',
      selected: true,
      hasDrawing: true,
      captureScreenshot: true,
      drawingLabel: 'Çözüm Önerisi Mimari Görsellerini (AS-IS / RISE) Dahil Et'
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

  getActiveCustomerCleanName(): string {
    const cust = this.customerService.activeCustomer();
    const name = cust?.name || '';
    if (name.includes('*') || cust?.id === 'cust-sigorta' || !name) {
      return 'Kale Endüstri Holding';
    }
    return name;
  }

  cleanCustomerText(text?: string): string {
    return this.customerService.cleanCustomerText(text, this.getActiveCustomerCleanName());
  }

  getExecutiveData(): ExecutiveSummaryData {
    const cust = this.customerService.activeCustomer();
    const custId = cust?.id || 'default';
    const custName = this.getActiveCustomerCleanName();
    try {
      const raw = localStorage.getItem(`task_force_exec_summary_${custId}`);
      if (raw) {
        const data = JSON.parse(raw);
        const cleanStr = (s?: string) => {
          if (!s) return s;
          return this.cleanCustomerText(s);
        };
        if (data.heroScore?.title) {
          data.heroScore.title = cleanStr(data.heroScore.title);
          if (data.heroScore.title.includes('**')) {
            data.heroScore.title = `${custName} RISE Readiness & Bulut Uyum Analizi`;
          }
        }
        if (data.objectiveSubtitle) {
          data.objectiveSubtitle = cleanStr(data.objectiveSubtitle);
          if (data.objectiveSubtitle.includes('**')) {
            data.objectiveSubtitle = `${custName} için RISE with SAP dönüşümü; mevcut ERP omurgasını modern bulut standartlarına taşıyarak işletmeye yüksek çeviklik, güvenlik ve esneklik kazandırmayı hedeflemektedir.`;
          }
        }
        if (data.heroScore?.description) {
          data.heroScore.description = cleanStr(data.heroScore.description);
        }
        if (data.recommendedMethod) {
          if (data.recommendedMethod.title) {
            data.recommendedMethod.title = cleanStr(data.recommendedMethod.title);
          }
          if (data.recommendedMethod.description) {
            data.recommendedMethod.description = cleanStr(data.recommendedMethod.description);
            if (data.recommendedMethod.description.includes('**')) {
              data.recommendedMethod.description = `${custName} için geçmiş işlem verisi ve mevzuat denetim sürekliliği zorunlu olduğu için saf Greenfield elenmiştir. MM/FI çekirdeğinin doğrudan taşındığı, yüksek boyutlu atıl verilerin go-live öncesi arşivlendiği ve CO/BP temizliğinin yapıldığı Brownfield yaklaşımı en düşük maliyet ve en yüksek başarı oranını sunmaktadır.`;
            }
          }
        }
        return data;
      }
    } catch (e) {}
    return getDefaultExecutiveData(custName);
  }

  getDetailedModuleCards(): ModuleCard[] {
    const cards = this.modullerService.cards();
    if (!cards || cards.length === 0) return [];
    const severityOrder: Record<string, number> = { 'Kritik': 0, 'Yüksek': 1, 'Orta': 2, 'Düşük': 3 };
    const sorted = [...cards].sort((a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99));
    return sorted;
  }

  getPaginatedDetailedCards(pageSize = 20): ModuleCard[][] {
    const cards = this.getDetailedModuleCards();
    if (!cards || cards.length === 0) return [];
    const chunks: ModuleCard[][] = [];
    for (let i = 0; i < cards.length; i += pageSize) {
      chunks.push(cards.slice(i, i + pageSize));
    }
    return chunks;
  }


  getSeverityCount(severity: string): number {
    return this.modullerService.cards().filter(c => c.severity === severity).length;
  }

  getTopModuleCards(limit: number) {
    const cards = this.modullerService.cards();
    return cards.slice(0, limit);
  }

  getModuleCategoryBreakdown() {
    const cards = this.modullerService.cards();
    const map = new Map<string, {
      name: string;
      total: number;
      kritik: number;
      yuksek: number;
      orta: number;
      dusuk: number;
    }>();

    for (const c of cards) {
      const cat = (c.category || 'Genel').trim();
      if (!map.has(cat)) {
        map.set(cat, { name: cat, total: 0, kritik: 0, yuksek: 0, orta: 0, dusuk: 0 });
      }
      const entry = map.get(cat)!;
      entry.total++;
      if (c.severity === 'Kritik') entry.kritik++;
      else if (c.severity === 'Yüksek') entry.yuksek++;
      else if (c.severity === 'Orta') entry.orta++;
      else entry.dusuk++;
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  getCustomCodeItems(): CustomCodeItem[] {
    const custId = this.customerService.activeCustomerId();
    try {
      const raw = localStorage.getItem(`taskforce_custom_code_${custId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_CUSTOM_CODE_ITEMS;
  }

  getCustomCodeStats() {
    const items = this.getCustomCodeItems();
    const total = items.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const standardConvertible = Math.round(total * 0.33) || 410;
    const btpCandidates = Math.round(
      items.filter(i => i.category === 'Entegrasyon & Bağlantı').reduce((sum, i) => sum + (Number(i.count) || 0), 0) * 0.25
    ) || 125;
    return {
      total,
      retiredPercent: 38,
      standardConvertible,
      btpCandidates
    };
  }

  getAsisImage(): string | null {
    const custId = this.customerService.activeCustomerId();
    return localStorage.getItem(`taskforce_target_arch_asis_img_${custId}`) || null;
  }

  getTobeImage(): string | null {
    const custId = this.customerService.activeCustomerId();
    return localStorage.getItem(`taskforce_target_arch_tobe_img_${custId}`) || null;
  }

  getAsisDiagramNodes(): any[] {
    const custId = this.customerService.activeCustomerId();
    try {
      const raw = localStorage.getItem(`taskforce_custom_arch_${custId}_asis`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.nodes || [];
      }
    } catch (e) {}
    return [];
  }

  getRiseDiagramNodes(): any[] {
    const custId = this.customerService.activeCustomerId();
    try {
      const raw = localStorage.getItem(`taskforce_custom_arch_${custId}_rise`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.nodes || [];
      }
    } catch (e) {}
    return [];
  }

  getPoDiagramNodes(): any[] {
    const custId = this.customerService.activeCustomerId();
    try {
      const raw = localStorage.getItem(`taskforce_custom_arch_${custId}_po`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.nodes || [];
      }
    } catch (e) {}
    return this.importService.poDiagramNodes();
  }

  getPoImage(): string | null {
    const custId = this.customerService.activeCustomerId();
    return localStorage.getItem(`taskforce_target_arch_po_img_${custId}`) || null;
  }

  renderDiagramToDataUrl(mode: 'asis' | 'po' | 'rise'): string | null {
    const custId = this.customerService.activeCustomerId();
    let nodes: any[] = [];
    let edges: any[] = [];
    try {
      const raw = localStorage.getItem(`taskforce_custom_arch_${custId}_${mode}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        nodes = parsed.nodes || [];
        edges = parsed.edges || [];
      }
    } catch (e) {}

    if (nodes.length === 0 && mode === 'po') {
      nodes = this.importService.poDiagramNodes();
      edges = this.importService.poDiagramEdges();
    } else if (nodes.length === 0 && mode === 'rise') {
      nodes = [
        { id: 'node-s4p', name: 'S/4HANA Private Cloud', category: 'Core', userCount: 380, instanceCount: 1, dbInfo: 'HANA 2.0 In-Memory', status: 'Active', x: 480, y: 160, role: 'core', protocol: 'S/4HANA Enterprise Management' },
        { id: 'node-cs', name: 'BTP Document Management', category: 'Cloud App', userCount: 50, instanceCount: 1, dbInfo: 'BTP Object Storage', status: 'Active', x: 200, y: 380, role: 'inbound', protocol: 'SAP BTP Document Service' },
        { id: 'node-webdisp', name: 'SAP Cloud Connector', category: 'Integration', userCount: 2, instanceCount: 1, dbInfo: 'Secure Tunnel', status: 'Active', x: 480, y: 380, role: 'sync', protocol: 'SAP BTP Reverse Proxy' },
        { id: 'node-ci', name: 'SAP Integration Suite', category: 'Integration', userCount: 50, instanceCount: 1, dbInfo: 'BTP Cloud Integration', status: 'Active', x: 760, y: 380, role: 'outbound', protocol: 'SAP BTP Cloud Integration (iFlows)' }
      ];
      edges = [
        { id: 're-cs', fromId: 'node-cs', toId: 'node-s4p', label: 'BTP Storage ➔' },
        { id: 're-webdisp', fromId: 'node-webdisp', toId: 'node-s4p', label: 'Web Traffic ➔' },
        { id: 're-ci', fromId: 'node-ci', toId: 'node-s4p', label: 'Cloud iFlows ➔' }
      ];
    } else if (nodes.length === 0 && mode === 'asis') {
      nodes = [
        { id: 'node-core', name: 'SAP ERP EHP 7 (Sybase)', category: 'Core', userCount: 380, instanceCount: 1, dbInfo: 'Sybase ASE Database', status: 'Active', x: 480, y: 160, role: 'core', protocol: 'RFC / RFC Gateway' },
        { id: 'node-po', name: 'SAP PO 7.5 Dual Stack', category: 'Integration', userCount: 10, instanceCount: 1, dbInfo: 'MaxDB Orchestration', status: 'Active', x: 200, y: 380, role: 'sync', protocol: 'SOAP / REST / JDBC', isEosRisk: true },
        { id: 'node-fes', name: 'SAP Fiori S4H 1511 (FES)', category: 'User Experience', userCount: 200, instanceCount: 1, dbInfo: 'SAP NetWeaver 7.5', status: 'Active', x: 480, y: 380, role: 'inbound', protocol: 'HTTPS OData', isEosRisk: true },
        { id: 'node-cs', name: 'SAP Content Server 6.5', category: 'Storage', userCount: 50, instanceCount: 1, dbInfo: 'MaxDB 7.9', status: 'Active', x: 760, y: 380, role: 'outbound', protocol: 'HTTP ArchiveLink', isEosRisk: true }
      ];
      edges = [
        { id: 'ae-po', fromId: 'node-po', toId: 'node-core', label: 'PO Entegrasyon ➔', isEosRisk: true },
        { id: 'ae-fes', fromId: 'node-fes', toId: 'node-core', label: 'Fiori Web Traffic ➔', isEosRisk: true },
        { id: 'ae-cs', fromId: 'node-cs', toId: 'node-core', label: 'Arşiv Doküman ➔', isEosRisk: true }
      ];
    }

    if (!nodes || nodes.length === 0) return null;

    const minX = Math.min(...nodes.map(n => n.x)) - 140;
    const maxX = Math.max(...nodes.map(n => n.x)) + 140;
    const minY = Math.min(...nodes.map(n => n.y)) - 80;
    const maxY = Math.max(...nodes.map(n => n.y)) + 80;

    const width = Math.max(980, maxX - minX);
    const height = Math.max(560, maxY - minY);

    // Ultra-sharp 2.5x resolution for razor-sharp typography and crisp cards
    const scale = 2.5;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scale, scale);

    // Modern light studio background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Subtle modern grid dots
    ctx.fillStyle = '#cbd5e1';
    for (let x = 16; x < width; x += 22) {
      for (let y = 16; y < height; y += 22) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    const offsetX = -minX + 40;
    const offsetY = -minY + 40;

    // Helper: draw arrow with directional marker
    const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string) => {
      const headlen = 12;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };

    // Draw connection edges
    edges.forEach(edge => {
      const from = nodes.find(n => n.id === edge.fromId);
      const to = nodes.find(n => n.id === edge.toId);
      if (from && to) {
        const fx = from.x + offsetX;
        const fy = from.y + offsetY;
        const tx = to.x + offsetX;
        const ty = to.y + offsetY;
        const color = edge.isEosRisk ? '#dc2626' : '#0284c7';

        const angle = Math.atan2(ty - fy, tx - fx);
        const startX = fx + Math.cos(angle) * 110;
        const startY = fy + Math.sin(angle) * 35;
        const endX = tx - Math.cos(angle) * 110;
        const endY = ty - Math.sin(angle) * 35;

        drawArrow(startX, startY, endX, endY, color);

        if (edge.label) {
          const mx = (startX + endX) / 2;
          const my = (startY + endY) / 2;
          ctx.font = 'bold 11px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const textWidth = ctx.measureText(edge.label).width;
          const pillW = textWidth + 20;
          const pillH = 22;

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(mx - pillW / 2, my - pillH / 2, pillW, pillH, 11);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = edge.isEosRisk ? '#b91c1c' : '#0369a1';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(edge.label, mx, my);
          ctx.textAlign = 'start';
          ctx.textBaseline = 'alphabetic';
        }
      }
    });

    // Draw node cards with rich, highly readable styles matching the screen
    nodes.forEach(node => {
      const nx = node.x + offsetX;
      const ny = node.y + offsetY;
      const isCore = node.id === 'node-core' || node.category === 'Core';
      const nw = isCore ? 260 : 235;
      const nh = isCore ? 78 : 70;
      const cardX = nx - nw / 2;
      const cardY = ny - nh / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      if (isCore) {
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#0369a1';
      } else if (node.isEosRisk) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = node.role === 'outbound' ? '#059669' : (node.role === 'inbound' ? '#0284c7' : '#7e22ce');
      }

      ctx.lineWidth = isCore ? 2 : 1.8;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, nw, nh, 8);
      ctx.fill();
      ctx.restore();
      ctx.stroke();

      // Top Role Pill Badge
      if (!isCore) {
        let roleBg = '#e0f2fe';
        let roleColor = '#0369a1';
        let roleText = 'Bileşen';

        if (node.role === 'outbound') {
          roleBg = '#ecfdf5';
          roleColor = '#047857';
          roleText = '▲ VERİCİ (Outbound)';
        } else if (node.role === 'inbound') {
          roleBg = '#eff6ff';
          roleColor = '#1d4ed8';
          roleText = '▼ ALICI (Inbound)';
        } else if (node.role === 'sync') {
          roleBg = '#faf5ff';
          roleColor = '#7e22ce';
          roleText = '⇄ SENKRON';
        } else if (node.isEosRisk) {
          roleBg = '#fef2f2';
          roleColor = '#dc2626';
          roleText = '⚠️ 2027 EoS Riski';
        }

        ctx.fillStyle = roleBg;
        ctx.beginPath();
        ctx.roundRect(cardX + 10, cardY + 8, 118, 18, 4);
        ctx.fill();

        ctx.fillStyle = roleColor;
        ctx.font = 'bold 10px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(roleText, cardX + 16, cardY + 21);

        // Server count pill on the right
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(cardX + nw - 75, cardY + 8, 65, 18, 4);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 10px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`🏢 ${node.instanceCount || 1} Sunucu`, cardX + nw - 70, cardY + 21);
      }

      // Main Node Name (Large, bold, high-contrast)
      ctx.fillStyle = isCore ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 13.5px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const nameY = isCore ? (cardY + 34) : (cardY + 44);
      ctx.fillText(node.name || 'Bileşen', cardX + 12, nameY);

      // Sub-text / Specs
      ctx.fillStyle = isCore ? '#e0f2fe' : '#475569';
      ctx.font = '11px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const subY = isCore ? (cardY + 56) : (cardY + 61);
      const subText = isCore 
        ? `${node.instanceCount || 3}x Sunucu • 10M Kullanıcı • Merkezi Hub`
        : (node.protocol ? `${node.protocol} • ${node.userCount || 0} Kullanıcı` : `${node.instanceCount || 1}x Sunucu`);
      ctx.fillText(subText, cardX + 12, subY);
    });

    return canvas.toDataURL('image/png');
  }

  getAsisDrawing(): string | null {
    const item = this.menuItems.find(m => m.id === 'architecture-asis');
    if (item && item.captureScreenshot === false) return null;
    const custId = this.customerService.activeCustomerId();
    
    const riseSS = localStorage.getItem(`taskforce_arch_ss_rise_${custId}`)
                || localStorage.getItem(`taskforce_arch_ss_rise_cust-sigorta`);
    let asisSS = localStorage.getItem(`taskforce_arch_ss_asis_${custId}`)
              || localStorage.getItem(`taskforce_arch_ss_asis_cust-sigorta`);

    // If asisSS is identical to riseSS, then asisSS was mistakenly overwritten with RISE drawing
    if (asisSS && riseSS && asisSS === riseSS) {
      asisSS = null;
    }

    if (asisSS) return asisSS;

    // Check if customer has specific AS-IS custom layout nodes saved
    const customAsis = localStorage.getItem(`taskforce_custom_arch_${custId}_asis`);
    if (customAsis) {
      try {
        const parsed = JSON.parse(customAsis);
        if (parsed.nodes && parsed.nodes.length > 0) {
          return this.renderDiagramToDataUrl('asis');
        }
      } catch (e) {}
    }

    // Fallback: render clean, official AS-IS architecture diagram
    return this.renderDiagramToDataUrl('asis');
  }

  getRiseStudioDrawing(): string | null {
    const item = this.menuItems.find(m => m.id === 'architecture-asis');
    if (item && item.captureScreenshot === false) return null;
    const custId = this.customerService.activeCustomerId();
    const savedSS = localStorage.getItem(`taskforce_arch_ss_rise_${custId}`)
                 || localStorage.getItem(`taskforce_arch_ss_rise_cust-sigorta`)
                 || localStorage.getItem(`taskforce_arch_ss_rise`);
    if (savedSS) return savedSS;
    return this.renderDiagramToDataUrl('rise');
  }

  getPoDrawing(): string | null {
    const item = this.menuItems.find(m => m.id === 'architecture-po');
    if (item && item.captureScreenshot === false) return null;
    const custId = this.customerService.activeCustomerId();
    const savedSS = localStorage.getItem(`taskforce_arch_ss_po_${custId}`)
                 || localStorage.getItem(`taskforce_arch_ss_po_cust-sigorta`)
                 || localStorage.getItem(`taskforce_arch_ss_po_cust-1`)
                 || localStorage.getItem(`taskforce_arch_ss_po`);
    if (savedSS) return savedSS;
    return this.renderDiagramToDataUrl('po');
  }

  getSolutionAsisImage(): string | null {
    const item = this.menuItems.find(m => m.id === 'solution-architecture');
    if (item && item.captureScreenshot === false) return null;
    const custId = this.customerService.activeCustomerId();
    return localStorage.getItem(`taskforce_target_arch_asis_img_${custId}`) || null;
  }

  getSolutionTobeImage(): string | null {
    const item = this.menuItems.find(m => m.id === 'solution-architecture');
    if (item && item.captureScreenshot === false) return null;
    const custId = this.customerService.activeCustomerId();
    return localStorage.getItem(`taskforce_target_arch_tobe_img_${custId}`) || null;
  }

  getTobeDrawing(): string | null {
    return this.getSolutionTobeImage();
  }

  hasPoData(): boolean {
    return this.importService.hasUploadedPoData() || 
           this.importService.poInterfaces().length > 0 || 
           this.getPoDiagramNodes().length > 0 ||
           !!this.getPoDrawing();
  }

  getLargestTablesTotalVolume(): number {
    const tables = this.basisService.largestTables();
    return Math.round(tables.reduce((sum, t) => sum + (Number(t.sizeGiB) || 0), 0));
  }

  hasTcoData(): boolean {
    const custId = this.customerService.activeCustomerId();
    return !!localStorage.getItem(`taskforce_tco_asis_${custId}`) || 
           !!localStorage.getItem(`taskforce_tco_rise_${custId}`) ||
           !!localStorage.getItem(`taskforce_tco_img_${custId}`);
  }

  getTcoImage(): string | null {
    const custId = this.customerService.activeCustomerId();
    return localStorage.getItem(`taskforce_tco_img_${custId}`) || null;
  }

  getTcoData() {
    const custId = this.customerService.activeCustomerId();
    let years = ['2022', '2023', '2024', '2025', '2026'];
    let asisItems: any[] = DEFAULT_ASIS_ITEMS;
    let riseItems: any[] = DEFAULT_RISE_ITEMS;

    try {
      const rawYears = localStorage.getItem(`taskforce_tco_years_${custId}`);
      if (rawYears) years = JSON.parse(rawYears);
    } catch (e) {}

    try {
      const rawAsis = localStorage.getItem(`taskforce_tco_asis_${custId}`);
      if (rawAsis) asisItems = JSON.parse(rawAsis);
    } catch (e) {}

    try {
      const rawRise = localStorage.getItem(`taskforce_tco_rise_${custId}`);
      if (rawRise) riseItems = JSON.parse(rawRise);
    } catch (e) {}

    const asisYearSums = years.map((_, yIdx) => {
      return asisItems.reduce((acc, item) => acc + (Number(item.values?.[yIdx]) || 0), 0);
    });

    const riseYearSums = years.map((_, yIdx) => {
      return riseItems.reduce((acc, item) => acc + (Number(item.values?.[yIdx]) || 0), 0);
    });

    const asisTotal = asisYearSums.reduce((s, v) => s + v, 0);
    const riseTotal = riseYearSums.reduce((s, v) => s + v, 0);
    const diff = asisTotal - riseTotal;
    const savingPercent = asisTotal > 0 ? Math.round((diff / asisTotal) * 1000) / 10 : 0;

    return {
      years,
      asisItems,
      riseItems,
      asisYearSums,
      riseYearSums,
      asisTotal,
      riseTotal,
      diff,
      savingPercent
    };
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
    const custName = this.getActiveCustomerCleanName();
    try {
      const saved = localStorage.getItem(`taskforce_recommended_method_${custId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.description) {
          parsed.description = this.cleanCustomerText(parsed.description);
          if (parsed.description.includes('**')) {
            parsed.description = `${custName} için geçmiş işlem verisi ve mevzuat denetim sürekliliği zorunlu olduğu için saf Greenfield elenmiştir. MM/FI çekirdeğinin doğrudan taşındığı, yüksek boyutlu atıl verilerin go-live öncesi arşivlendiği ve CO/BP temizliğinin yapıldığı Brownfield yaklaşımı en düşük maliyet ve en yüksek başarı oranını sunmaktadır.`;
          }
        }
        if (parsed.title) {
          parsed.title = this.cleanCustomerText(parsed.title);
        }
        if (parsed.roadmapTitle) {
          parsed.roadmapTitle = this.cleanCustomerText(parsed.roadmapTitle);
        }
        return parsed;
      }
    } catch (e) {}
    return getDefaultRecommendedData(custName);
  }

  async generateMultiMenuPdf(): Promise<void> {
    if (this.selectedCount() === 0 || this.isExporting()) return;

    this.isExporting.set(true);
    this.exportProgress.set('Rapor sayfaları hazırlanıyor...');
    this.exportPercent.set(5);

    try {
      // Give Angular time to fully render all sections
      await new Promise(resolve => setTimeout(resolve, 150));

      const container = this.exportContainer?.nativeElement || document.getElementById('multiMenuPdfContainer');
      if (!container) throw new Error('PDF container not found');

      const sections = Array.from(container.querySelectorAll('.pdf-page-section')) as HTMLElement[];
      if (sections.length === 0) throw new Error('No printable sections found');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pageWidth = 210;
      const pageHeight = 297;
      let isFirstPage = true;

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];

        // Yield to browser between sections (60ms) to let Chrome update UI, reset watchdog and avoid "unresponsive" dialog
        await new Promise(resolve => setTimeout(resolve, 60));

        const pct = Math.round(5 + ((i + 1) / sections.length) * 90);
        this.exportPercent.set(pct);
        this.exportProgress.set(`Sayfa ${i + 1} / ${sections.length} işleniyor...`);

        // Capture this section independently — fast, crisp, no horizontal cuts
        const secCanvas = await html2canvas(sec, {
          scale: 1.25,
          useCORS: false,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 840,
          scrollX: 0,
          scrollY: 0
        });

        const imgData = secCanvas.toDataURL('image/jpeg', 0.82);
        const imgHeight = (secCanvas.height * pageWidth) / secCanvas.width;

        if (!isFirstPage) {
          pdf.addPage();
        } else {
          isFirstPage = false;
        }

        // Her bölüm tam 1 A4 sayfasına (210 x 297 mm) oturur — kesilme veya satır bölünmesi kesinlikle olmaz
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

        // BTC Logo - Tüm PDF sayfalarının en üst sağ tarafına ekle
        if (BTC_LOGO_BASE64) {
          const logoW = 25;
          const logoH = 10.15; // 1252:508 oranına tam uygun
          const logoX = pageWidth - logoW - 9;
          const logoY = 4.5;
          // Temiz beyaz arka plan ile metin/çizgilerin arkada kalmasını sağla
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(logoX - 1.5, logoY - 1, logoW + 3, logoH + 2, 1, 1, 'F');
          pdf.addImage(BTC_LOGO_BASE64, 'PNG', logoX, logoY, logoW, logoH, undefined, 'FAST');
        }
      }

      this.exportProgress.set('PDF indiriliyor...');
      this.exportPercent.set(100);

      const custName = this.getActiveCustomerCleanName().replace(/\s+/g, '_');
      pdf.save(`${custName}_SAP_Kapsamli_Donusum_Raporu.pdf`);

      await new Promise(resolve => setTimeout(resolve, 80));
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
