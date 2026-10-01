import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuickToolsService } from '../../../core/services/quick-tools.service';
import { CustomerService } from '../../../core/services/customer.service';
import { BasisSizingService } from '../../../core/services/basis-sizing.service';
import { NotesService } from '../../../core/services/notes.service';
import { IconComponent } from '../icon/icon.component';
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
                <h3>Rapor İndir (PDF) - Menü Seçimi</h3>
                <span class="sub-text">
                  <strong>{{ customerService.activeCustomer().name }}</strong> için PDF'e dahil edilecek menüleri seçiniz.
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
              <span class="badge-count">{{ selectedCount() }} / {{ menuItems.length }} Menü Seçildi</span>
              <span class="sub-lead">Tüm sistem raporları, mimari çizimler ve geçiş yöntemleri eksiksiz tek bir PDF'te birleştirilir.</span>
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
                Mimari şemalar, geçiş yöntemleri, zaman damgalı notlar ve tablolar yüksek çözünürlüklü A4 formatında derlenir.
              </span>
            </div>

            <div class="footer-actions">
              <button class="btn-cancel" (click)="close()" [disabled]="isExporting()">Vazgeç</button>
              <button 
                class="btn-export" 
                [disabled]="selectedCount() === 0 || isExporting()" 
                (click)="generateMultiMenuPdf()">
                @if (isExporting()) {
                  <app-icon name="refresh" [size]="16" color="#ffffff"></app-icon>
                  <span>PDF Hazırlanıyor ({{ exportProgress() }})...</span>
                } @else {
                  <app-icon name="download" [size]="16" color="#ffffff"></app-icon>
                  <span>Seçilen Raporları PDF Olarak İndir ({{ selectedCount() }})</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- HIDDEN EXPORT TEMPLATE FOR HIGH-RES HTML2CANVAS CONVERSION -->
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
            <div class="report-badge">KAPSAMLI DÖNÜŞÜM & ANALİZ RAPORU</div>
            <h1 class="cover-title">{{ customerService.activeCustomer().name }}</h1>
            <h2 class="cover-sub">RISE with SAP S/4HANA Hazırlık, Mimari ve Maliyet Değerlendirmesi</h2>

            <div class="cover-meta-grid">
              <div class="meta-item">
                <span class="m-lbl">Sektör / İş Alanı:</span>
                <strong class="m-val">{{ customerService.activeCustomer().sector || 'Kurumsal Üretim & Sanayi' }}</strong>
              </div>
              <div class="meta-item">
                <span class="m-lbl">SAP Kullanıcı Sayısı:</span>
                <strong class="m-val">{{ customerService.activeCustomer().sapUserCount }} Kullanıcı</strong>
              </div>
              <div class="meta-item">
                <span class="m-lbl">Mevcut Veri Tabanı:</span>
                <strong class="m-val">{{ basisService.systemInfo()?.dbType || 'Oracle / MS SQL' }} ({{ basisService.systemInfo()?.diskSizeGiB || 1250 }} GB)</strong>
              </div>
              <div class="meta-item">
                <span class="m-lbl">Dönüşüm Modeli:</span>
                <strong class="m-val">RISE with SAP Private Cloud Edition (PCE)</strong>
              </div>
            </div>

            <!-- Table of Contents of selected items -->
            <div class="toc-box">
              <div class="toc-title">RAPOR KAPSAMI VE SEÇİLEN BÖLÜMLER</div>
              <div class="toc-items">
                @for (item of selectedItems(); track item.id; let idx = $index) {
                  <div class="toc-line">
                    <span class="toc-num">{{ idx + 1 }}.</span>
                    <span class="toc-name">{{ item.name }} ({{ item.group }})</span>
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
        <!-- SECTION 1: YÖNETİCİ ÖZETİ                                                  -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('reports')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">1. YÖNETİCİ ÖZETİ & DÖNÜŞÜM VİZYONU</div>
              <div class="sb-meta">RISE with SAP Uyumu & Stratejik Değerlendirme</div>
            </div>

            <div class="section-content-box">
              <div class="exec-summary-banner">
                <div class="es-badge-circle">%84</div>
                <div class="es-text">
                  <h3>RISE with SAP Dönüşüm Hazırlık Skoru</h3>
                  <p>Mevcut ERP altyapısı ve iş süreçleri incelendiğinde; Clean Core prensiplerine geçiş, bulut ölçeklenebilirliği ve toplam sahip olma maliyetinde öngörülebilir nakit akışı avantajı sağlamaktadır.</p>
                </div>
              </div>

              <div class="kpi-mini-grid">
                <div class="kpi-box">
                  <span class="k-label">Bulut Mimarisi Uyumu</span>
                  <strong class="k-val text-blue">%90</strong>
                  <span class="k-sub">S/4HANA Private Cloud DB</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Lisans Optimizasyonu</span>
                  <strong class="k-val text-emerald">%85</strong>
                  <span class="k-sub">FUE ile Atıl Lisans Sıfırlanır</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Entegrasyon BTP Uyumu</span>
                  <strong class="k-val text-purple">%82</strong>
                  <span class="k-sub">PO / AIF Integration Suite Hazır</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">DVM & Arşivleme</span>
                  <strong class="k-val text-amber">%78</strong>
                  <span class="k-sub">HANA Bellek Tasarrufu</span>
                </div>
              </div>

              <!-- Notes summary -->
              <div class="notes-summary-box" *ngIf="notesService.currentCustomerNotes().length > 0">
                <h4>Presales ve Satış Değerlendirme Notları (Zaman Damgalı Satır Satır Kayıtlar):</h4>
                @for (note of notesService.currentCustomerNotes(); track note.id) {
                  <div class="note-bullet-line">
                    <span class="n-date">[{{ note.formattedDate }}]</span>
                    <span class="n-author">{{ note.author }}:</span>
                    <span class="n-text">{{ note.text }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- SECTION 2: SAP UYGULAMALARI - BULGULARIMIZ                                -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('modules-summary')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">2. SAP UYGULAMALARI - BULGULARIMIZ</div>
              <div class="sb-meta">Modül Kullanım Analizi ve Süreç İyileştirmeleri</div>
            </div>

            <div class="section-content-box">
              <div class="analysis-card">
                <h3>Genel Modül Durumu & Bulgular</h3>
                <p>Aktif SAP ERP sistemindeki işlem hacimleri ve kullanıcı rolleri incelendiğinde; Finans (FI/CO), Satış (SD) ve Satınalma/Stok (MM) operasyon omurgasını oluşturmaktadır. Clean Core prensipleri ile iş süreçlerinin standartlaştırılması hedeflenmektedir.</p>
                <div class="module-stat-row">
                  <div class="m-pill"><strong>FI/CO:</strong> %94 Kullanım Oranı • Standarda Uyumlu</div>
                  <div class="m-pill"><strong>SD:</strong> %88 Kullanım Oranı • Entegrasyon Yoğun</div>
                  <div class="m-pill"><strong>MM/PP:</strong> %82 Kullanım Oranı • MRP Live ile Hızlanacak</div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- SECTION 3: SAP UYGULAMALARI - DETAYLI ANALİZ                               -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('modules-detail')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">3. SAP UYGULAMALARI - DETAYLI MODÜLER ANALİZ</div>
              <div class="sb-meta">Süreç Kırılımları ve İyileştirme Fırsatları</div>
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
                      <td><strong>FI - Mali İşler</strong></td>
                      <td>120 Kullanıcı</td>
                      <td>45.000 Kayıt</td>
                      <td>Dönem sonu kapanışlarında manuel mutabakat yükü</td>
                      <td>Universal Journal (ACDOCA) & Otomatik Kapanış</td>
                    </tr>
                    <tr>
                      <td><strong>CO - Kontroling</strong></td>
                      <td>45 Kullanıcı</td>
                      <td>28.000 Kayıt</td>
                      <td>Maliyet dağıtımı hesaplamalarında gecikmeler</td>
                      <td>HANA Gerçek Zamanlı Karlılık Analizi (CO-PA)</td>
                    </tr>
                    <tr>
                      <td><strong>MM - Malzeme Yönetimi</strong></td>
                      <td>160 Kullanıcı</td>
                      <td>85.000 Kayıt</td>
                      <td>Stok devir hızı ve sipariş onay darboğazı</td>
                      <td>MRP Live & Otomatik Satınalma Sipariş Yönetimi</td>
                    </tr>
                    <tr>
                      <td><strong>SD - Satış Dağıtım</strong></td>
                      <td>190 Kullanıcı</td>
                      <td>110.000 Kayıt</td>
                      <td>B2B entegrasyonlarında batch gecikmeleri</td>
                      <td>API Tabanlı Sipariş Karşılama & Gelişmiş ATP</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- SECTION 4: GELİŞTİRMELER (CUSTOM CODE)                                    -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('development')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">4. SAP GELİŞTİRMELERİ & CLEAN CORE UYUMU</div>
              <div class="sb-meta">Z-Programlar, Custom Tablolar ve Uyarlama Eforları</div>
            </div>

            <div class="section-content-box">
              <div class="kpi-mini-grid">
                <div class="kpi-box">
                  <span class="k-label">Toplam Z/Y Nesnesi</span>
                  <strong class="k-val">1.240</strong>
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

              <!-- Z-Objects breakdown table -->
              <div class="table-wrap" style="margin-top: 15px;">
                <table class="report-data-table">
                  <thead>
                    <tr>
                      <th>Nesne Tipi</th>
                      <th>Mevcut Adet</th>
                      <th>Standarda Dönüşüm</th>
                      <th>BTP Side-by-Side</th>
                      <th>Clean Core Stratejisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Custom Programlar (Z Reports)</strong></td>
                      <td>480</td>
                      <td>180 Adet</td>
                      <td>65 BTP App</td>
                      <td>Clean Core standardı ile Fiori uygulamalarına dönüştürülecek</td>
                    </tr>
                    <tr>
                      <td><strong>Veritabanı Tabloları (Z Tables)</strong></td>
                      <td>220</td>
                      <td>90 Adet</td>
                      <td>Standart CDS View</td>
                      <td>S/4HANA genişletme tabloları ile sadeleştirilecek</td>
                    </tr>
                    <tr>
                      <td><strong>Modül Havuzları & Dynpro</strong></td>
                      <td>140</td>
                      <td>85 Standart Fiori</td>
                      <td>25 SAP Build</td>
                      <td>Dynpro ekranları kaldırılıp Fiori Launchpad'e taşınacak</td>
                    </tr>
                    <tr>
                      <td><strong>User-Exit & CMOD Geliştirmeleri</strong></td>
                      <td>160</td>
                      <td>90 BAdI / Clean Core</td>
                      <td>30 BTP Cloud BAdI</td>
                      <td>Core değişiklikleri temizlenip Cloud BAdI'ye geçirilecek</td>
                    </tr>
                    <tr>
                      <td><strong>Fonksiyon Modülleri (RFC / BAPI)</strong></td>
                      <td>240</td>
                      <td>110 OData API</td>
                      <td>50 BTP Integration</td>
                      <td>Standart OData API'leri ile modernize edilecek</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- SECTION 5: ENTEGRASYON MİMARİSİ (PO / BTP INTEGRATION SUITE)               -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('architecture-po')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">5. ENTEGRASYON MİMARİSİ (SAP PO & BTP INTEGRATION SUITE)</div>
              <div class="sb-meta">Entegrasyon Topolojisi, Canlı Arayüzler ve Bulut Dönüşümü</div>
            </div>

            <div class="section-content-box">
              <div class="analysis-card">
                <h3>SAP Process Orchestration (PO) ➔ Integration Suite Geçişi</h3>
                <p>SAP PO desteğinin sonlanması ile birlikte mevcut canlı entegrasyonlar modernize edilmektedir. Migration Assessment aracı ile arayüzler analiz edilmiş ve SAP Integration Suite (BTP) taşıma haritası oluşturulmuştur.</p>
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
                  <span>SAP PO / BTP Entegrasyon Akış Topolojisi Çizimi</span>
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
                    <span class="proto-tag">RFC / SFTP / IDoc</span>
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
        <!-- SECTION 6: LİSANS VE BULUT (FUE)                                          -->
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
                  <strong class="k-val">{{ customerService.activeCustomer().sapUserCount }}</strong>
                  <span class="k-sub">Professional + Limited</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Gereken RISE FUE</span>
                  <strong class="k-val text-blue">142 FUE</strong>
                  <span class="k-sub">Optimize Edilmiş Model</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Düşük Kullanımlı Kullanıcı</span>
                  <strong class="k-val text-amber">{{ customerService.activeCustomer().lowUsageUserCount }}</strong>
                  <span class="k-sub">Self-Service / Core Adayı</span>
                </div>
                <div class="kpi-box">
                  <span class="k-label">Tahmini Lisans Tasarrufu</span>
                  <strong class="k-val text-emerald">€{{ customerService.activeCustomer().estimatedOpportunityValue | number }}</strong>
                  <span class="k-sub">Yıllık Lisans Avantajı</span>
                </div>
              </div>
              <p class="section-p">FUE (Full User Equivalent) modeli sayesinde; 1 FUE = 1 Advanced User veya 5 Core User veya 30 Self-Service User oranında dinamik dağıtılarak atıl lisans maliyetleri ve aşım cezaları kalıcı olarak engellenir.</p>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- SECTION 7: TEKNİK ALTYAPI - SIZING                                        -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('source-sizing')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">7. TEKNİK ALTYAPI - MEVCUT / HEDEF SİSTEM BOYUTLANDIRMASI</div>
              <div class="sb-meta">Donanım, Veritabanı ve HANA Kapasite Planı</div>
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
                      <td>18.000 SAPS (Eski Nesil CPU)</td>
                      <td>24.000 SAPS (Modern Hyperscaler Compute)</td>
                    </tr>
                    <tr>
                      <td><strong>Yedeklilik & SLA</strong></td>
                      <td>Lokal Veri Merkezi / Manuel Failover</td>
                      <td>%99.7 - %99.9 Bulut SLA + 7/24 Proaktif SAP Yönetimi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- SECTION 8: SİSTEM ORTAMI & MEVCUT AS-IS MİMARİSİ                           -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('architecture-asis')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">8. SİSTEM ORTAMI & MEVCUT AS-IS MİMARİSİ (2027 EoS)</div>
              <div class="sb-meta">Mevcut Mimari Şeması, Sürüm Uyumluluğu ve Risk Takvimi</div>
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
                    <span>SAP ECC 6.0 ana akım desteği 2027 yılı sonunda sona erecektir. Bu tarihten sonra güvenlik yamaları, e-Fatura/e-Defter yasal regülasyon uyarlamaları ve teknik destek ek maliyetlere tabi olacak ve operasyonel risk oluşturacaktır.</span>
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
        <!-- SECTION 9: EN BÜYÜK TABLOLAR (DVM)                                        -->
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
                  <span class="k-label">Toplam Veri Tabanı</span>
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
        <!-- SECTION 10.1: ÇÖZÜM ÖNERİSİ - ÖNERİLEN YÖNTEM & YOL HARİTASI             -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('solution-proposal')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">10.1 ÇÖZÜM ÖNERİSİ: ÖNERİLEN GEÇİŞ YÖNTEMİ & YOL HARİTASI</div>
              <div class="sb-meta">Brownfield (System Conversion) Stratejisi ve 4 Fazlı Canlıya Geçiş Takvimi</div>
            </div>

            <div class="section-content-box">
              <!-- Hero Card for Recommended Method -->
              <div class="hero-recommendation-card-pdf">
                <div class="hr-left">
                  <span class="hr-pill">{{ getRecommendedData().badge }}</span>
                  <h2>{{ getRecommendedData().title }}</h2>
                  <p>{{ getRecommendedData().description }}</p>
                </div>
                <div class="hr-stats">
                  <div class="stat-box-pdf">
                    <span class="sb-val text-emerald">{{ getRecommendedData().stat1Value }}</span>
                    <span class="sb-lbl">{{ getRecommendedData().stat1Label }}</span>
                  </div>
                  <div class="stat-box-pdf">
                    <span class="sb-val text-blue">{{ getRecommendedData().stat2Value }}</span>
                    <span class="sb-lbl">{{ getRecommendedData().stat2Label }}</span>
                  </div>
                  <div class="stat-box-pdf">
                    <span class="sb-val text-purple">{{ getRecommendedData().stat3Value }}</span>
                    <span class="sb-lbl">{{ getRecommendedData().stat3Label }}</span>
                  </div>
                </div>
              </div>

              <!-- 4-Phase Transformation Roadmap -->
              <div class="roadmap-container-pdf" style="margin-top: 20px;">
                <div class="roadmap-header-pdf">
                  <app-icon name="sparkles" [size]="14" color="#0284c7"></app-icon>
                  <span>{{ getRecommendedData().roadmapTitle }}</span>
                </div>

                <div class="roadmap-steps-grid">
                  @for (phase of getRecommendedData().phases; track phase.id; let last = $last) {
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

          <!-- ======================================================================= -->
          <!-- SECTION 10.2: ÇÖZÜM ÖNERİSİ - HEDEF MİMARİ (RISE WITH SAP BULUT TOPOLOJİSİ) -->
          <!-- ======================================================================= -->
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">10.2 ÇÖZÜM ÖNERİSİ: HEDEF MİMARİ (RISE WITH SAP PCE)</div>
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

          <!-- ======================================================================= -->
          <!-- SECTION 10.3: ÇÖZÜM ÖNERİSİ - 4 GEÇİŞ YÖNTEMİ & KARŞILAŞTIRMA MATRİSİ   -->
          <!-- ======================================================================= -->
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">10.3 ÇÖZÜM ÖNERİSİ: 4 GEÇİŞ YÖNTEMİ & KARŞILAŞTIRMA MATRİSİ</div>
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
        <!-- SECTION 11: TOPLAM SAHİP OLMA MALİYETİ (TCO)                              -->
        <!-- ========================================================================= -->
        @if (isItemIncluded('business-case')) {
          <div class="pdf-page-section">
            <div class="section-badge-header">
              <div class="sb-title">11. TOPLAM SAHİP OLMA MALİYETİ (TCO & ROI)</div>
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
              <p class="section-p">Donanım yenileme (CapEx), veri merkezi elektrik/iklimlendirme ve bakım sözleşmelerinin sonlandırılması ile bütçe öngörülebilirliği sağlanmakta, kaynaklar inovasyona yönlendirilebilmektedir.</p>
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
      background: rgba(15, 23, 42, 0.6);
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
      max-width: 780px;
      max-height: 90vh;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
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
        gap: 0.5rem;

        .btn-quick {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: background 0.15s;

          &:hover {
            background: #e2e8f0;
          }
        }
      }
    }

    .menu-list-container {
      padding: 1.25rem 1.5rem;
      overflow-y: auto;
      flex: 1;
      background: #f8fafc;
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;

      .footer-left {
        .footer-tip {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.74rem;
          color: #64748b;
        }
      }

      .footer-actions {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .btn-cancel {
          padding: 0.5rem 1rem;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;

          &:hover:not(:disabled) {
            background: #e2e8f0;
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

    /* HIDDEN HIGH-RES A4 REPORT CONTAINER STYLES */
    .hidden-pdf-document-wrapper {
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 1000px;
      background: #ffffff;
      z-index: -10;
    }

    .pdf-export-container {
      width: 820px;
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
          padding: 40px 0;

          .report-badge {
            display: inline-block;
            background: #0284c7;
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            margin-bottom: 15px;
          }

          .cover-title {
            font-size: 34px;
            font-weight: 900;
            color: #0f172a;
            margin: 0 0 10px 0;
            line-height: 1.2;
          }

          .cover-sub {
            font-size: 16px;
            color: #475569;
            font-weight: 500;
            margin: 0 0 30px 0;
            line-height: 1.4;
          }

          .cover-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 35px;

            .meta-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
              .m-lbl { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
              .m-val { font-size: 14px; color: #0f172a; font-weight: 700; }
            }
          }

          .toc-box {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 20px;

            .toc-title {
              font-size: 12px;
              font-weight: 800;
              color: #334155;
              letter-spacing: 0.05em;
              margin-bottom: 12px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 8px;
            }

            .toc-items {
              display: flex;
              flex-direction: column;
              gap: 8px;

              .toc-line {
                display: flex;
                align-items: center;
                font-size: 12px;

                .toc-num { width: 22px; font-weight: 700; color: #0284c7; }
                .toc-name { font-weight: 600; color: #1e293b; }
                .toc-dots { flex: 1; color: #cbd5e1; overflow: hidden; white-space: nowrap; margin: 0 8px; }
                .toc-badge { font-size: 10px; font-weight: 700; color: #059669; }
              }
            }
          }
        }

        .cover-footer {
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          text-align: center;
        }
      }

      .pdf-page-section {
        padding: 35px 45px;
        page-break-after: always;
        border-bottom: 1px solid #e2e8f0;
        background: #ffffff;

        .section-badge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 2px solid #0f172a;
          margin-bottom: 20px;

          .sb-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.04em;
          }

          .sb-meta {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
          }
        }

        .exec-summary-banner {
          display: flex;
          align-items: center;
          gap: 20px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 20px;

          .es-badge-circle {
            width: 60px;
            height: 60px;
            background: #166534;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
          }

          .es-text {
            flex: 1;
            h3 { margin: 0 0 6px; font-size: 15px; font-weight: 700; color: #14532d; }
            p { margin: 0; font-size: 12px; line-height: 1.5; color: #166534; }
          }
        }

        .kpi-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 15px;

          .kpi-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            display: flex;
            flex-direction: column;

            .k-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
            .k-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
            .k-sub { font-size: 10px; color: #475569; }

            .text-blue { color: #0284c7; }
            .text-emerald { color: #059669; }
            .text-purple { color: #7e22ce; }
            .text-amber { color: #d97706; }
          }
        }

        .notes-summary-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 14px;
          margin-top: 15px;

          h4 { margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #334155; }
          .note-bullet-line {
            font-size: 11px;
            line-height: 1.45;
            margin-bottom: 6px;
            color: #1e293b;

            .n-date { font-weight: 700; color: #0284c7; margin-right: 5px; }
            .n-author { font-weight: 600; color: #475569; margin-right: 5px; }
          }
        }

        .analysis-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;

          h3 { margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #0f172a; }
          p { margin: 0 0 12px; font-size: 12px; line-height: 1.5; color: #475569; }

          .module-stat-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;

            .m-pill {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              padding: 5px 10px;
              border-radius: 6px;
              font-size: 11px;
              color: #334155;
            }
          }
        }

        .section-p {
          font-size: 12px;
          line-height: 1.5;
          color: #475569;
          margin-top: 10px;
        }

        .report-data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-top: 10px;

          th {
            background: #f1f5f9;
            padding: 8px 10px;
            text-align: left;
            font-weight: 700;
            color: #334155;
            border-bottom: 2px solid #cbd5e1;
          }

          td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
          }
        }

        /* ARCHITECTURE SCHEMATICS & DIAGRAMS */
        .arch-uploaded-container {
          margin-bottom: 15px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px;
          background: #0f172a;

          .auc-header {
            font-size: 11px;
            font-weight: 700;
            color: #94a3b8;
            margin-bottom: 8px;
          }

          .pdf-custom-arch-img {
            width: 100%;
            max-height: 280px;
            object-fit: contain;
            display: block;
          }
        }

        .arch-schematic-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 15px;

          .schematic-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #f1f5f9;
          }
        }

        /* PO Topology Flow */
        .integration-topology-flow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;

          .flow-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;

            .col-head {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              text-align: center;
              margin-bottom: 2px;
            }

            .flow-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 5px;
              padding: 6px 8px;
              font-size: 10px;
              font-weight: 600;
              color: #1e293b;
              text-align: center;

              &.core-box {
                background: #f0fdf4;
                border-color: #86efac;
                color: #166534;
                font-weight: 700;
              }
            }
          }

          .flow-arrow-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;

            .proto-tag {
              font-size: 8px;
              font-weight: 700;
              color: #0284c7;
              background: #eff6ff;
              padding: 1px 4px;
              border-radius: 3px;
              white-space: nowrap;
            }

            .arr-icon {
              font-size: 14px;
              color: #94a3b8;
              font-weight: 800;
            }
          }

          .hub-col {
            flex: 1.4;

            .hub-main-box {
              background: #eff6ff;
              border: 2px solid #0284c7;
              border-radius: 8px;
              padding: 10px;
              text-align: center;

              .hub-title { font-size: 11px; font-weight: 800; color: #0369a1; }
              .hub-sub { font-size: 9px; color: #64748b; margin-top: 2px; }
              .hub-mig-badge {
                display: inline-block;
                background: #0284c7;
                color: #ffffff;
                font-size: 9px;
                font-weight: 700;
                padding: 2px 6px;
                border-radius: 4px;
                margin: 6px 0;
              }
              .hub-desc { font-size: 9px; color: #0284c7; line-height: 1.3; }
            }
          }
        }

        /* AS-IS Topology Flow */
        .asis-topology-flow {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .asis-tier-card {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 8px 12px;

            &.db-card {
              background: #f8fafc;
              border-color: #cbd5e1;
            }

            .tier-tag { font-size: 9px; font-weight: 700; color: #b45309; text-transform: uppercase; }
            .tier-title { font-size: 12px; font-weight: 800; color: #0f172a; margin: 2px 0; }
            .tier-detail { font-size: 10px; color: #475569; }
          }

          .asis-arrow-down {
            font-size: 10px;
            font-weight: 700;
            color: #d97706;
            text-align: center;
          }
        }

        .eos-callout-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 10px 14px;
          margin-top: 10px;

          .eos-badge {
            background: #dc2626;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 4px;
            white-space: nowrap;
          }

          .eos-body {
            font-size: 10.5px;
            color: #991b1b;
            line-height: 1.4;
            strong { display: block; font-weight: 700; margin-bottom: 2px; }
          }
        }

        /* TO-BE Target Architecture Diagram */
        .tobe-architecture-diagram {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .tobe-tier-row {
            border-radius: 6px;
            padding: 8px 12px;
            border: 1px solid #e2e8f0;

            .tier-label {
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              margin-bottom: 6px;
            }

            &.tier-presentation {
              background: #f8fafc;
              .tier-label { color: #0284c7; }
            }

            &.tier-core {
              background: #f0fdf4;
              border-color: #86efac;
              .tier-label { color: #15803d; }

              .core-highlight-box {
                .ch-title { font-size: 13px; font-weight: 800; color: #14532d; }
                .ch-specs { font-size: 10px; color: #166534; margin-top: 3px; }
              }
            }

            &.tier-btp {
              background: #faf5ff;
              border-color: #e9d5ff;
              .tier-label { color: #7e22ce; }
            }

            &.tier-infra {
              background: #f1f5f9;
              .tier-label { color: #334155; }
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
                font-size: 9.5px;
                color: #1e293b;
              }
            }

            .infra-flex-row {
              display: flex;
              gap: 8px;

              .infra-badge {
                flex: 1;
                background: #ffffff;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                padding: 5px;
                text-align: center;
                font-size: 9.5px;
                font-weight: 600;
                color: #334155;

                &.green {
                  border-color: #86efac;
                  background: #f0fdf4;
                  color: #166534;
                  font-weight: 700;
                }
              }
            }
          }

          .tobe-flow-divider {
            font-size: 9px;
            font-weight: 700;
            color: #059669;
            text-align: center;
          }
        }

        /* Recommended Hero Card PDF */
        .hero-recommendation-card-pdf {
          display: flex;
          align-items: center;
          gap: 20px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 16px;

          .hr-left {
            flex: 1;
            .hr-pill {
              font-size: 9px;
              font-weight: 800;
              color: #059669;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }
            h2 {
              margin: 4px 0 6px;
              font-size: 16px;
              font-weight: 800;
              color: #14532d;
            }
            p {
              margin: 0;
              font-size: 11px;
              line-height: 1.45;
              color: #166534;
            }
          }

          .hr-stats {
            display: flex;
            gap: 10px;

            .stat-box-pdf {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 12px;
              text-align: center;
              min-width: 80px;

              .sb-val { font-size: 15px; font-weight: 800; display: block; margin-bottom: 2px; }
              .sb-lbl { font-size: 9px; color: #64748b; font-weight: 600; }
              .text-emerald { color: #059669; }
              .text-blue { color: #0284c7; }
              .text-purple { color: #7e22ce; }
            }
          }
        }

        /* Roadmap Grid PDF */
        .roadmap-container-pdf {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px;

          .roadmap-header-pdf {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 12px;
          }

          .roadmap-steps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;

            .roadmap-step-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px;

              &.highlight {
                background: #f0fdf4;
                border-color: #86efac;
              }

              .step-top-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;

                .step-num { font-size: 14px; font-weight: 900; color: #94a3b8; }
                .step-badge {
                  font-size: 8px;
                  font-weight: 700;
                  color: #0284c7;
                  background: #eff6ff;
                  padding: 1px 4px;
                  border-radius: 3px;

                  &.green { background: #dcfce7; color: #059669; }
                }
              }

              h4 {
                font-size: 11px;
                font-weight: 800;
                color: #0f172a;
                margin: 0 0 6px 0;
              }

              ul {
                margin: 0;
                padding-left: 14px;
                li {
                  font-size: 9.5px;
                  color: #475569;
                  line-height: 1.35;
                  margin-bottom: 3px;
                }
              }
            }
          }
        }

        /* Method Cards Grid PDF */
        .methods-cards-grid-pdf {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;

          .method-card-pdf {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            &.recommended { border-top: 3px solid #059669; }
            &.lift-shift { border-top: 3px solid #0284c7; }
            &.partial { border-top: 3px solid #d97706; }
            &.not-suitable { border-top: 3px solid #dc2626; }

            .mc-head {
              .mc-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;

                .mc-badge {
                  font-size: 8px;
                  font-weight: 800;
                  padding: 1px 4px;
                  border-radius: 3px;

                  &.recommended { background: #dcfce7; color: #15803d; }
                  &.lift-shift { background: #e0f2fe; color: #0369a1; }
                  &.partial { background: #fef3c7; color: #b45309; }
                  &.not-suitable { background: #fee2e2; color: #b91c1c; }
                }

                .mc-duration { font-size: 9px; font-weight: 700; color: #64748b; }
              }

              h3 { font-size: 11px; font-weight: 800; color: #0f172a; margin: 2px 0; }
              .mc-sub { font-size: 8.5px; color: #64748b; margin: 0 0 6px; }
            }

            .mc-bullets {
              display: flex;
              flex-direction: column;
              gap: 4px;
              margin: 6px 0;

              .mc-bullet-item {
                display: flex;
                align-items: flex-start;
                gap: 4px;

                .bullet-dot {
                  width: 5px;
                  height: 5px;
                  border-radius: 50%;
                  margin-top: 4px;
                  flex-shrink: 0;

                  &.green { background: #059669; }
                  &.blue { background: #0284c7; }
                  &.amber { background: #d97706; }
                  &.red { background: #dc2626; }
                }

                .bullet-text {
                  font-size: 9px;
                  line-height: 1.3;
                  color: #334155;
                  strong { font-weight: 700; color: #0f172a; margin-right: 2px; }
                }
              }
            }

            .mc-foot {
              font-size: 8.5px;
              font-weight: 600;
              color: #64748b;
              border-top: 1px solid #f1f5f9;
              padding-top: 5px;
              margin-top: auto;
            }
          }
        }

        /* Matrix Table PDF */
        .matrix-table {
          th.th-rec {
            background: #dcfce7;
            color: #15803d;
            border-bottom-color: #86efac;
          }
          td.td-rec {
            background: #f0fdf4;
            color: #14532d;
            font-weight: 600;
          }
        }

        .risk-pill {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;

          &.red { background: #fee2e2; color: #dc2626; }
          &.amber { background: #fef3c7; color: #b45309; }
          &.blue { background: #e0f2fe; color: #0284c7; }
          &.green { background: #dcfce7; color: #15803d; }
        }
      }
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

  @ViewChild('exportContainer') exportContainer?: ElementRef<HTMLElement>;

  isExporting = signal<boolean>(false);
  exportProgress = signal<string>('0%');

  currentDateStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  menuItems: ReportMenuItem[] = [
    {
      id: 'reports',
      name: 'Yönetici Özeti',
      group: 'ÖZET',
      desc: 'RISE Match Skoru, Bulut Uyumu, Stratejik Hedefler ve Zaman Damgalı Notlar',
      icon: 'file-text',
      selected: true
    },
    {
      id: 'modules-summary',
      name: 'Bulgularımız',
      group: 'SAP UYGULAMALARI',
      desc: 'Modül kullanım oranları, tespit edilen darboğazlar ve süreç kazanımları',
      icon: 'sliders',
      selected: true
    },
    {
      id: 'modules-detail',
      name: 'Detaylı Analiz',
      group: 'SAP UYGULAMALARI',
      desc: 'FI, CO, SD, MM, PP vb. derinlemesine süreç analizi',
      icon: 'layers',
      selected: true
    },
    {
      id: 'development',
      name: 'Geliştirmeler (Custom Code)',
      group: 'SAP UYGULAMALARI',
      desc: 'Z-Kod envanteri, atıl kodlar ve Clean Core uyarlama hedefleri',
      icon: 'cpu',
      selected: true
    },
    {
      id: 'architecture-po',
      name: 'Entegrasyon Haritası',
      group: 'SAP UYGULAMALARI',
      desc: 'PO/AIF servisleri, SAP Integration Suite (BTP) geçiş değerlendirmesi ve topoloji çizimi',
      icon: 'bolt',
      selected: true
    },
    {
      id: 'analytics',
      name: 'FUE Lisans Analizi',
      group: 'LİSANS & BULUT',
      desc: 'Mevcut lisanslar, FUE dönüşümü ve atıl lisans tasarrufu',
      icon: 'bolt',
      selected: true
    },
    {
      id: 'source-sizing',
      name: 'Mevcut / Hedef Sistem',
      group: 'TEKNİK ALTYAPI',
      desc: 'CPU, RAM, Disk boyutlandırması ve S/4HANA Private Cloud mimarisi',
      icon: 'database',
      selected: true
    },
    {
      id: 'architecture-asis',
      name: 'Sistem Ortamı & Destek Bitişi',
      group: 'TEKNİK ALTYAPI',
      desc: 'Sistem mimarisi akış çizimi, SAP/OS/DB sürümleri ve 2027 EoS risk takvimi',
      icon: 'shield',
      selected: true
    },
    {
      id: 'largest-tables',
      name: 'En Büyük Tablolar (DVM)',
      group: 'TEKNİK ALTYAPI',
      desc: 'Data Volume Management analizi, arşivleme ve HANA bellek tasarrufu',
      icon: 'layers',
      selected: true
    },
    {
      id: 'solution-proposal',
      name: 'Çözüm Önerisi & Yol Haritası',
      group: 'ÇÖZÜM ÖNERİSİ',
      desc: 'Brownfield geçiş yöntemi, 4 fazlı yol haritası, hedef mimari çizimi ve 4 yöntemin karşılaştırma matrisi',
      icon: 'map',
      selected: true
    },
    {
      id: 'business-case',
      name: 'Toplam Sahip Olma Maliyeti (TCO)',
      group: 'FİNANSAL ANALİZ',
      desc: '5 yıllık TCO karşılaştırması, OpEx dönüşümü ve ROI analizi',
      icon: 'dollar',
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

  onSelectionChange(): void {
    // triggered by checkbox
  }

  close(): void {
    this.quickToolsService.closePdfExport();
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
    this.exportProgress.set('Başlatılıyor...');

    try {
      // Allow Angular change detection to render the hidden container
      await new Promise(resolve => setTimeout(resolve, 300));

      const container = this.exportContainer?.nativeElement || document.getElementById('multiMenuPdfContainer');
      if (!container) {
        throw new Error('PDF container not found');
      }

      this.exportProgress.set('Sayfalar taranıyor...');

      // Find all sections or pages
      const sections = container.querySelectorAll('.pdf-page, .pdf-page-section');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;

      let isFirstPage = true;

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i] as HTMLElement;
        const progressPercent = Math.round(((i + 1) / sections.length) * 100);
        this.exportProgress.set(`Sayfa ${i + 1} / ${sections.length} (${progressPercent}%)`);

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

        // Fit image nicely into A4 page
        if (imgHeight <= pageHeight) {
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight, undefined, 'FAST');
        } else {
          // If a section is taller than single A4 page, slice it
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

      const custName = this.customerService.activeCustomer().name.replace(/\s+/g, '_');
      pdf.save(`${custName}_SAP_Kapsamli_Donusum_Raporu.pdf`);

      this.close();
    } catch (err) {
      console.error('Multi-menu PDF generation failed:', err);
      alert('PDF oluşturulurken bir hata oluştu. Tarayıcı yazdırma ekranına yönlendiriliyorsunuz.');
      window.print();
    } finally {
      this.isExporting.set(false);
      this.exportProgress.set('0%');
    }
  }
}
