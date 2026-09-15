import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataImportService, ExcelImportCategory } from '../../core/services/data-import.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
import { CustomerService } from '../../core/services/customer.service';
import { ModullerService, downloadModulesTemplate } from '../../core/services/moduller.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-data-import',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, IconComponent],
  template: `
    <div class="import-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="upload" [size]="24" color="#0284c7"></app-icon>
            Excel / CSV Veri Yükleme & Otomatik Harita Oluşturma
          </h1>
          <p class="page-subtitle">Seçili Müşteri: <strong style="color: #0284c7; font-weight: 700;">{{ customerService.activeCustomer().name }}</strong> • Bu müşteriye ait Excel kategorisini seçip dosyanızı yükleyin</p>
        </div>
      </div>

      <!-- 2 Ana Yükleme Kategorisi: Basis & Sizing ve Integration -->
      <div class="category-cards-grid">
        <!-- 1. Kategori: SAP Basis & Sizing -->
        <div 
          class="cat-card primary-card" 
          [class.selected]="selectedCategory() === 'basis'"
          (click)="selectedCategory.set('basis')">
          <div class="cat-header-badge">1. ANA ALAN</div>
          <div class="cat-card-body">
            <div class="cat-icon-box purple"><app-icon name="cpu" [size]="22" color="#7e22ce"></app-icon></div>
            <div class="cat-text">
              <strong class="cat-title">1. SAP Basis & Sizing Analiz Excel'i</strong>
              <p class="cat-desc">S/4HANA Boyutlandırma (QuickSizer), En Büyük 30 Tablo (DVM), FUE Lisans Analizi ve Sözleşme Envanteri</p>
              <div class="cat-screens-pill">
                <span>Beslediği Ekranlar:</span>
                <strong>Customer Summary • Sizing (Current/Target) • Largest Tables (DVM) • FUE / License • Executive Summary</strong>
              </div>
            </div>
          </div>
          <div class="cat-status-indicator" *ngIf="basisService.hasUploadedData()">
            <span class="dot-active"></span>
            <span>Veri Yüklü ({{ basisService.basisPackage()?.fileName || 'Aktif' }})</span>
          </div>
        </div>

        <!-- 2. Kategori: SAP Integration / PO Entegrasyon Listesi -->
        <div 
          class="cat-card primary-card" 
          [class.selected]="selectedCategory() === 'po'"
          (click)="selectedCategory.set('po')">
          <div class="cat-header-badge badge-blue">2. ANA ALAN</div>
          <div class="cat-card-body">
            <div class="cat-icon-box blue"><app-icon name="bolt" [size]="22" color="#0284c7"></app-icon></div>
            <div class="cat-text">
              <strong class="cat-title">2. SAP Integration / PO Entegrasyon Listesi</strong>
              <p class="cat-desc">Canlı Arayüzler (Interfaces), Gönderen & Alıcı Dış Sistemler, SOAP / JDBC / RFC / REST Protokolleri</p>
              <div class="cat-screens-pill">
                <span>Beslediği Ekranlar:</span>
                <strong>Alt Yapı > Integration (Dinamik Ağ Mimarisi Şeması & Canlı Servisler Tablosu)</strong>
              </div>
            </div>
          </div>
          <div class="cat-status-indicator" *ngIf="importService.hasUploadedPoData()">
            <span class="dot-active"></span>
            <span>Veri Yüklü ({{ importService.uploadedFileName() }} • {{ importService.poInterfaces().length }} Servis)</span>
          </div>
        </div>

        <!-- 3. Kategori: SAP Uygulamaları & Modül Değerlendirmeleri -->
        <div 
          class="cat-card primary-card" 
          [class.selected]="selectedCategory() === 'modules'"
          (click)="selectedCategory.set('modules')">
          <div class="cat-header-badge badge-emerald">3. ANA ALAN</div>
          <div class="cat-card-body">
            <div class="cat-icon-box emerald"><app-icon name="layers" [size]="22" color="#059669"></app-icon></div>
            <div class="cat-text">
              <strong class="cat-title">3. SAP Uygulamaları & Modül Değerlendirmeleri</strong>
              <p class="cat-desc">Genel Bulgular, MM, FI, CO, SD vb. modül değerlendirme maddeleri, önem derecesi ve durumları</p>
              <div class="cat-screens-pill">
                <span>Beslediği Ekranlar:</span>
                <strong>SAP Uygulamaları (Modüller) • Sunum & Raporlama</strong>
              </div>
            </div>
          </div>
          <div class="cat-status-indicator" *ngIf="modullerService.hasUploadedData()">
            <span class="dot-active"></span>
            <span>Veri Yüklü ({{ modullerService.totalCardsCount() }} Değerlendirme Kartı)</span>
          </div>
        </div>
      </div>

      <!-- Drag & Drop Upload Zone -->
      <div 
        class="dropzone" 
        [class.dragging]="isDragging"
        [class.processing]="isProcessing()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="!isProcessing() && fileInput.click()">
        
        <input #fileInput type="file" (change)="onFileSelected($event)" accept=".xlsx, .csv" style="display: none;" />
        
        <!-- NORMAL STATE -->
        <ng-container *ngIf="!isProcessing()">
          <div class="dropzone-icon">
            <app-icon name="upload" [size]="24" color="#0284c7"></app-icon>
          </div>
          
          <h3 class="drop-title">
            {{ selectedCategory() === 'basis' ? '1. SAP Basis & Sizing Analiz Excel Dosyanızı Buraya Sürükleyin' : (selectedCategory() === 'po' ? '2. SAP Integration / PO Canlı Entegrasyon Excel Dosyanızı Buraya Sürükleyin' : '3. SAP Uygulamaları & Modül Değerlendirme Excel Dosyanızı Buraya Sürükleyin') }}
          </h3>
          <p class="drop-sub">
            {{ selectedCategory() === 'basis' ? 'Desteklenen Formatlar: .xlsx, .csv — S/4HANA Sizing matrisi, En Büyük Tablolar ve FUE sayfaları' : (selectedCategory() === 'po' ? 'Desteklenen Formatlar: .xlsx, .csv — Canlı arayüzler, gönderen/alıcı sistemler ve protokol kolonları' : 'Format: Kategori • Başlık • Önem Derecesi • Durum • Madde ve Detaylar • Dipnot / Tahmini Süre') }}
          </p>
          <div class="dropzone-actions" (click)="$event.stopPropagation()" style="display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap; margin-top: 14px;">
            <button class="btn btn-primary" (click)="fileInput.click()">
              <app-icon name="upload" [size]="15" color="#ffffff"></app-icon>
              <span>{{ selectedCategory() === 'basis' ? 'Basis Excel Dosyası Seç & Analiz Et' : (selectedCategory() === 'po' ? 'Entegrasyon Excel Dosyası Seç & Haritayı Çiz' : 'Modül Excel Dosyası Seç & Kartları Aktar') }}</span>
            </button>

            <!-- Sadece SAP Uygulamaları & Modüller seçiliyken görünen Format İndir & Örnek Veri -->
            <button *ngIf="selectedCategory() === 'modules'" class="btn btn-sample" (click)="downloadTemplate()" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;" title="SAP Modülleri Excel format şablonunu indirin">
              <app-icon name="download" [size]="15" color="#047857"></app-icon>
              <span>Format / Şablon İndir (.xlsx)</span>
            </button>

            <button *ngIf="selectedCategory() === 'modules'" class="btn btn-sample" (click)="loadSampleData()" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;" title="Örnek 6 değerlendirme kartı yükle">
              <app-icon name="file-spreadsheet" [size]="15" color="#166534"></app-icon>
              <span>Örnek Modül Verisi Yükle</span>
            </button>

            <!-- Sadece Basis seçiliyken görünen Örnek Veri -->
            <button *ngIf="selectedCategory() === 'basis'" class="btn btn-sample" (click)="loadSampleData()">
              <app-icon name="file-spreadsheet" [size]="15" color="#0284c7"></app-icon>
              <span>Örnek SAP Basis Verisi Yükle</span>
            </button>

            <!-- Sadece PO seçiliyken görünen Örnek Veri -->
            <button *ngIf="selectedCategory() === 'po'" class="btn btn-sample" (click)="loadSampleData()">
              <app-icon name="file-spreadsheet" [size]="15" color="#0284c7"></app-icon>
              <span>Örnek PO Entegrasyon Verisi Yükle</span>
            </button>
          </div>
        </ng-container>

        <!-- BEAUTIFUL PROCESSING LOADER STATE -->
        <div class="dropzone-loader" *ngIf="isProcessing()" (click)="$event.stopPropagation()">
          <div class="loader-pulse-ring">
            <div class="spinner-circle"></div>
            <div class="loader-inner-icon">
              <app-icon name="file-spreadsheet" [size]="28" color="#0284c7"></app-icon>
            </div>
          </div>
          <h3 class="loader-title">Excel Dosyası Çözümleniyor...</h3>
          <p class="loader-sub">
            <strong>{{ processingFileName() }}</strong> verileri işleniyor, entegrasyon arayüzleri ve mimari harita oluşturuluyor.
          </p>
          <div class="loader-progress-track">
            <div class="loader-progress-bar" [style.width.%]="processingProgress()"></div>
          </div>
          <span class="loader-status-text">Analiz ediliyor... %{{ processingProgress() }}</span>
        </div>
      </div>

      <!-- File Summary Metrics Banner & Map Shortcut -->
      <div class="file-summary-card" *ngIf="importService.summary() as sum">
        <div class="summary-item">
          <span class="icon-box"><app-icon name="file-text" [size]="16"></app-icon></span>
          <div class="info">
            <span class="label">Yüklenen Dosya</span>
            <strong class="val">{{ sum.fileName }}</strong>
          </div>
        </div>

        <div class="summary-item">
          <span class="icon-box"><app-icon name="database" [size]="16"></app-icon></span>
          <div class="info">
            <span class="label">Dosya Boyutu</span>
            <strong class="val">{{ sum.fileSize }}</strong>
          </div>
        </div>

        <div class="summary-item">
          <span class="icon-box"><app-icon name="chart" [size]="16"></app-icon></span>
          <div class="info">
            <span class="label">İşlenen Kayıt Sayısı</span>
            <strong class="val">{{ sum.totalRows | number }} Kayıt</strong>
          </div>
        </div>

        <div class="summary-item highlight">
          <span class="icon-box green"><app-icon name="sparkles" [size]="16" color="#047857"></app-icon></span>
          <div class="info">
            <span class="label">Veri Kalitesi Skoru</span>
            <strong class="val score">%{{ sum.dataQualityScore }} (Yüksek)</strong>
          </div>
        </div>

        <div class="map-shortcut-box" *ngIf="importService.importCategory() === 'basis'">
          <button class="btn btn-primary" (click)="router.navigate(['/source-sizing'])" style="margin-right: 0.5rem;">
            <app-icon name="cpu" [size]="16" color="#ffffff"></app-icon>
            <span>S/4HANA Sizing Ekranı ➔</span>
          </button>
          <button class="btn btn-sample" (click)="router.navigate(['/largest-tables'])">
            <app-icon name="database" [size]="16" color="#0284c7"></app-icon>
            <span>En Büyük Tablolar ➔</span>
          </button>
        </div>

        <div class="map-shortcut-box po-btn-group" *ngIf="importService.importCategory() === 'po'">
          <button class="btn btn-draw-map" (click)="goToArchitectureMap()" title="Dinamik Entegrasyon Haritasını Çiz">
            <app-icon name="map" [size]="15" color="#ffffff"></app-icon>
            <span>Entegrasyon Haritası Çiz ➔</span>
          </button>
          <button class="btn btn-services-pill" (click)="activeTab.set('preview')" title="Canlı Servis Listesini Görüntüle">
            <app-icon name="bolt" [size]="15" color="#0284c7"></app-icon>
            <span>Servisler ({{ importService.poInterfaces().length }})</span>
          </button>
        </div>

        <div class="map-shortcut-box" *ngIf="importService.importCategory() === 'modules'">
          <button class="btn btn-primary" (click)="router.navigate(['/modules'])" style="background: #059669; border-color: #059669;">
            <app-icon name="layers" [size]="16" color="#ffffff"></app-icon>
            <span>SAP Uygulamaları (Modüller) Ekranına Git ➔</span>
          </button>
        </div>

        <div class="map-shortcut-box" *ngIf="importService.importCategory() !== 'basis' && importService.importCategory() !== 'po' && importService.importCategory() !== 'modules'">
          <button class="btn btn-map" (click)="goToArchitectureMap()">
            <app-icon name="map" [size]="16" color="#ffffff"></app-icon>
            <span>Şirket Haritasını Çiz ➔</span>
          </button>
        </div>
      </div>

      <!-- Step Tabs (Kolon Eşleştirme vs Veri Önizleme) -->
      <div class="step-nav">
        <button class="tab-btn" [class.active]="activeTab() === 'mapping'" (click)="activeTab.set('mapping')">
          <span>1. Kolon Eşleştirme (Field Mapping)</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'preview'" (click)="activeTab.set('preview')">
          <span>2. Veri Önizleme (Raw Records)</span>
        </button>
      </div>

      <!-- Tab 1: Column Mapping Interface -->
      <div class="mapping-container" *ngIf="activeTab() === 'mapping'">
        <div class="card-box">
          <div class="card-header">
            <div>
              <h3>Excel Kolonlarını Sistem Alanları ile Eşleştirin</h3>
              <p class="sub">Yüklenen dosyadaki kolonlar otomatik algılanmış ve güven skoru hesaplanmıştır.</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary" (click)="importService.autoMatchColumns()">
                <app-icon name="bolt" [size]="14"></app-icon>
                <span>Otomatik Eşleştir</span>
              </button>
            </div>
          </div>

          <div class="mapping-list">
            @for (map of importService.columnMappings(); track map.excelColumn) {
              <div class="mapping-row">
                <div class="excel-col-box">
                  <span class="col-icon"><app-icon name="file-text" [size]="16" color="#4b5563"></app-icon></span>
                  <div class="col-info">
                    <span class="type">Excel Kolonu</span>
                    <strong class="name">{{ map.excelColumn }}</strong>
                  </div>
                </div>

                <div class="arrow-icon">
                  <app-icon name="arrow-right" [size]="15" color="#9ca3af"></app-icon>
                </div>

                <div class="system-field-box">
                  <span class="type">Önerilen Sistem Alanı</span>
                  <select 
                    [value]="map.systemField" 
                    (change)="onMappingChange(map.excelColumn, $event)"
                    class="field-select">
                    <option value="">-- Alan Seçilmedi --</option>
                    @for (sysOption of importService.systemFields; track sysOption.key) {
                      <option [value]="sysOption.key">{{ sysOption.label }}</option>
                    }
                  </select>
                </div>

                <div class="confidence-box">
                  <span class="conf-label">Güven Skoru</span>
                  <div class="conf-pill" [class.high]="map.confidenceScore >= 90">
                    %{{ map.confidenceScore }}
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="card-footer">
            <button class="btn btn-run" (click)="runAnalysis()">
              <span>Analiz Et & Fırsatları Belirle</span>
              <app-icon name="arrow-right" [size]="15" color="#ffffff"></app-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: Raw Records Data Preview Table -->
      <div class="preview-container" *ngIf="activeTab() === 'preview'">
        <!-- CASE 1: PO Live Integration Data -->
        <div class="table-card" *ngIf="selectedCategory() === 'po' && importService.hasUploadedPoData()">
          <div class="card-header">
            <div>
              <h3>Yüklenen Canlı Entegrasyon Servisleri ({{ importService.poInterfaces().length }} Arayüz)</h3>
              <p class="sub">Tüm arayüzler, gönderen/alıcı sistemler ve iletişim protokolleri başarıyla çözümlendi.</p>
            </div>
            <button class="btn btn-primary" (click)="goToArchitectureMap()">
              <app-icon name="bolt" [size]="15" color="#ffffff"></app-icon>
              <span>Entegrasyon Haritasını Aç ➔</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Arayüz / Servis Adı</th>
                  <th>Gönderen (Sender)</th>
                  <th>Alıcı (Receiver)</th>
                  <th>Protokol</th>
                  <th>İletişim Türü</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                @for (item of importService.poInterfaces(); track item.id) {
                  <tr>
                    <td>{{ item.id }}</td>
                    <td><strong>{{ item.name }}</strong></td>
                    <td><span class="badge-sys">{{ item.sender }}</span></td>
                    <td><span class="badge-sys">{{ item.receiver }}</span></td>
                    <td><code>{{ item.protocol }}</code></td>
                    <td><span class="badge-type" [class.sync]="item.type === 'Synchronous'">{{ item.type }}</span></td>
                    <td>
                      <span class="role-badge" [class.out]="item.role === 'outbound'" [class.in]="item.role === 'inbound'">
                        {{ item.roleLabel }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- CASE 2: SAP Basis & Sizing Data -->
        <div class="table-card" *ngIf="selectedCategory() === 'basis' && basisService.hasUploadedData()">
          <div class="card-header">
            <div>
              <h3>SAP Basis & Sizing En Büyük Tablolar ({{ basisService.largestTables().length }} Tablo)</h3>
              <p class="sub">Bellek tüketimi, satır hacimleri ve DVM tasarruf potansiyeli çözümlendi.</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-primary" (click)="router.navigate(['/source-sizing'])">
                <app-icon name="cpu" [size]="15" color="#ffffff"></app-icon>
                <span>Sizing Kokpiti ➔</span>
              </button>
              <button class="btn btn-sample" (click)="router.navigate(['/largest-tables'])">
                <app-icon name="database" [size]="15" color="#0284c7"></app-icon>
                <span>En Büyük Tablolar ➔</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tablo Adı</th>
                  <th>Açıklama / Modül</th>
                  <th>Boyut (GiB)</th>
                  <th>Kayıt Sayısı</th>
                  <th>DVM Aksiyonu</th>
                </tr>
              </thead>
              <tbody>
                @for (tbl of basisService.largestTables(); track tbl.name; let i = $index) {
                  <tr>
                    <td>{{ i + 1 }}</td>
                    <td><strong>{{ tbl.name }}</strong></td>
                    <td>{{ tbl.desc }} <small class="text-muted" *ngIf="tbl.module">· {{ tbl.module }}</small></td>
                    <td><strong class="text-blue">{{ tbl.sizeGiB | number:'1.1-1' }} GiB</strong></td>
                    <td>{{ tbl.records | number }}</td>
                    <td><span class="badge-dvm">{{ tbl.archivingPotential }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- CASE 3: SAP Uygulamaları & Modül Değerlendirmeleri -->
        <div class="table-card" *ngIf="selectedCategory() === 'modules' && modullerService.hasUploadedData()">
          <div class="card-header">
            <div>
              <h3>Yüklenen Modül Değerlendirme Kartları ({{ modullerService.totalCardsCount() }} Kart)</h3>
              <p class="sub">Kategori, başlık, önem derecesi ve durum verileri başarıyla aktarıldı.</p>
            </div>
            <button class="btn btn-primary" (click)="router.navigate(['/modules'])" style="background: #059669; border-color: #059669;">
              <app-icon name="layers" [size]="15" color="#ffffff"></app-icon>
              <span>SAP Uygulamaları Ekranına Git ➔</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Modül / Kategori</th>
                  <th>Kart Başlığı</th>
                  <th>Önem Derecesi</th>
                  <th>Durum</th>
                  <th>Detay Maddeleri</th>
                  <th>Dipnot</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let mod of modullerService.modules()">
                  <ng-container *ngFor="let s of mod.slides">
                    <tr *ngFor="let c of s.cards; let i = index">
                      <td>{{ i + 1 }}</td>
                      <td><strong>{{ mod.name }}</strong></td>
                      <td>{{ c.title }}</td>
                      <td>
                        <span class="badge-pill" [style.background]="c.severity === 'Kritik' ? '#fee2e2' : (c.severity === 'Yüksek' ? '#ffedd5' : '#eff6ff')" [style.color]="c.severity === 'Kritik' ? '#b91c1c' : (c.severity === 'Yüksek' ? '#c2410c' : '#1d4ed8')">
                          {{ c.severity }}
                        </span>
                      </td>
                      <td>
                        <span class="badge-pill" [style.background]="c.status === 'Standart' ? '#dcfce7' : (c.status === 'Geliştirme' ? '#fef3c7' : '#e0e7ff')" [style.color]="c.status === 'Standart' ? '#15803d' : (c.status === 'Geliştirme' ? '#b45309' : '#4338ca')">
                          {{ c.status }}
                        </span>
                      </td>
                      <td>{{ c.bullets.length }} madde</td>
                      <td><small>{{ c.footerNote || '—' }}</small></td>
                    </tr>
                  </ng-container>
                </ng-container>
              </tbody>
            </table>
          </div>
        </div>

        <!-- CASE 3: General Usage Records / Fallback -->
        <div class="table-card" *ngIf="selectedCategory() !== 'po' && !basisService.hasUploadedData() && importService.records().length > 0">
          <div class="card-header">
            <h3>Yüklenen SAP Kayıtları Önizleme</h3>
            <span class="record-badge">{{ importService.records().length }} Kayıt Listeleniyor</span>
          </div>

          <div class="table-responsive">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>Kullanıcı Adı</th>
                  <th>Departman</th>
                  <th>SAP Modülü</th>
                  <th>Lisans Tipi</th>
                  <th>Aylık İşlem Sayısı</th>
                  <th>Yıllık Lisans Maliyeti</th>
                  <th>Manuel Çalışma Saati</th>
                  <th>Durum Tespiti</th>
                </tr>
              </thead>
              <tbody>
                @for (rec of importService.records(); track rec.id) {
                  <tr>
                    <td><strong>{{ rec.userName }}</strong></td>
                    <td>{{ rec.department }}</td>
                    <td><span class="module-tag">{{ rec.sapModule }}</span></td>
                    <td><span class="license-tag" [class.pro]="rec.licenseType === 'Professional'">{{ rec.licenseType }}</span></td>
                    <td><strong [class.text-danger]="rec.monthlyTransactions < 100 && rec.licenseType === 'Professional'">{{ rec.monthlyTransactions | number }}</strong></td>
                    <td>€{{ rec.annualLicenseCost | number }}</td>
                    <td>{{ rec.manualWorkHours }} Saat</td>
                    <td>
                      <app-status-badge [text]="rec.status" type="status"></app-status-badge>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- CASE 4: No Data Yet in Preview -->
        <div class="empty-preview-card" *ngIf="!importService.hasUploadedPoData() && !basisService.hasUploadedData() && importService.records().length === 0" style="padding: 3rem 1.5rem; text-align: center; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 10px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;">
            <app-icon name="file-text" [size]="24" color="#64748b"></app-icon>
          </div>
          <h4 style="color: #334155; margin: 0 0 0.35rem 0; font-size: 1rem;">Henüz Önizlenecek Veri Bulunmamaktadır</h4>
          <p style="color: #64748b; font-size: 0.82rem; margin: 0;">Lütfen yukarıdaki alandan bir Excel dosyası seçin veya örnek veri butonunu kullanın.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .import-page {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
      .page-subtitle { margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #6b7280; }
    }

    .btn-sample {
      background: #f0f9ff;
      color: #0284c7;
      border: 1px solid #bae6fd;
      padding: 0.5rem 0.85rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.78rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;

      &:hover { background: #0284c7; color: #fff; }
    }

    .category-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 1.25rem;

      @media (max-width: 860px) {
        grid-template-columns: 1fr;
      }

      .cat-card {
        background: #ffffff;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease-in-out;

        &:hover, &.selected {
          border-color: #0284c7;
          background: #f0f9ff;
          box-shadow: 0 4px 20px rgba(2, 132, 199, 0.12);
        }

        &.selected {
          border-color: #0284c7;
          border-width: 2px;
        }

        .cat-header-badge {
          align-self: flex-start;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          background: #f3e8ff;
          color: #7e22ce;
          margin-bottom: 0.75rem;

          &.badge-blue {
            background: #e0f2fe;
            color: #0284c7;
          }
        }

        .cat-card-body {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .cat-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          flex-shrink: 0;

          &.purple { background: #faf5ff; border: 1px solid #e9d5ff; }
          &.blue { background: #f0f9ff; border: 1px solid #bae6fd; }
          &.emerald { background: #ecfdf5; border: 1px solid #a7f3d0; }
        }

        .cat-text {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;

          .cat-title { font-size: 1rem; color: #0f172a; font-weight: 800; }
          .cat-desc { font-size: 0.8rem; color: #64748b; line-height: 1.4; margin: 0; }
          .cat-screens-pill {
            margin-top: 0.5rem;
            padding: 0.4rem 0.65rem;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 0.72rem;
            color: #475569;
            line-height: 1.4;
            span { font-weight: 600; color: #94a3b8; display: block; margin-bottom: 0.1rem; }
            strong { font-weight: 700; color: #334155; }
          }
        }

        .cat-status-indicator {
          margin-top: 0.85rem;
          padding-top: 0.65rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #059669;

          .dot-active {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 3px #d1fae5;
          }
        }
      }
    }

    .dropzone {
      background: #ffffff;
      border: 2px dashed #0284c7;
      border-radius: 10px;
      padding: 2.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover, &.dragging { border-color: #0369a1; background: #f0f9ff; }

      &.processing {
        border-style: solid;
        border-color: #38bdf8;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        cursor: default;
      }

      .dropzone-icon {
        width: 48px;
        height: 48px;
        background: #f0f9ff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.85rem;
      }

      .drop-title { font-size: 1.05rem; font-weight: 800; color: #111827; margin: 0; text-align: center; }
      .drop-sub { font-size: 0.8rem; color: #6b7280; margin: 0.35rem 0 1rem 0; }

      .btn-primary {
        background: #0284c7;
        color: #ffffff;
        border: none;
        padding: 0.55rem 1.2rem;
        border-radius: 6px;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        &:hover { background: #0369a1; }
      }

      .dropzone-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.2rem 1rem;
        text-align: center;

        .loader-pulse-ring {
          position: relative;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;

          .spinner-circle {
            position: absolute;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: 3px solid #bae6fd;
            border-top-color: #0284c7;
            border-right-color: #0284c7;
            animation: spin 0.85s linear infinite;
          }

          .loader-inner-icon {
            animation: pulse 1.6s ease-in-out infinite;
          }
        }

        .loader-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0369a1;
          margin: 0 0 0.4rem 0;
        }

        .loader-sub {
          font-size: 0.84rem;
          color: #64748b;
          margin: 0 0 1.2rem 0;
          max-width: 480px;
          line-height: 1.45;

          strong {
            color: #0f172a;
          }
        }

        .loader-progress-track {
          width: 320px;
          max-width: 90%;
          height: 8px;
          background: #bae6fd;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 0.5rem;

          .loader-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #0284c7, #38bdf8);
            border-radius: 999px;
            transition: width 0.15s ease-out;
          }
        }

        .loader-status-text {
          font-size: 0.76rem;
          font-weight: 700;
          color: #0284c7;
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.75; }
    }

    .file-summary-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;

      .summary-item {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .icon-box {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;

          &.green { background: #ecfdf5; }
        }

        .info {
          display: flex;
          flex-direction: column;
          .label { font-size: 0.68rem; color: #6b7280; font-weight: 600; }
          .val { font-size: 0.85rem; color: #111827; font-weight: 800; }
        }

        &.highlight {
          background: #ecfdf5;
          padding: 0.4rem 0.65rem;
          border-radius: 6px;
          .val.score { color: #047857; }
        }
      }

      .map-shortcut-box {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 0.6rem;

        .btn-draw-map {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          border: none;
          padding: 0.52rem 1.05rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.28);
          transition: all 0.2s ease;

          &:hover {
            background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.38);
          }
        }

        .btn-services-pill {
          background: #f0f9ff;
          color: #0369a1;
          border: 1px solid #bae6fd;
          padding: 0.52rem 0.95rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          transition: all 0.2s ease;

          &:hover {
            background: #e0f2fe;
            border-color: #7dd3fc;
            color: #0284c7;
            transform: translateY(-1px);
          }
        }

        .btn-map {
          background: #0284c7;
          color: #ffffff;
          border: none;
          padding: 0.5rem 0.95rem;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;

          &:hover { background: #0369a1; }
        }
      }
    }

    .step-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid #e5e7eb;

      .tab-btn {
        background: transparent;
        border: none;
        padding: 0.65rem 1rem;
        font-size: 0.82rem;
        font-weight: 700;
        color: #6b7280;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;

        &.active {
          color: #0284c7;
          border-bottom-color: #0284c7;
        }
      }
    }

    .card-box {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #111827; }
        .sub { margin: 0.15rem 0 0 0; font-size: 0.78rem; color: #6b7280; }
      }
    }

    .btn-secondary {
      background: #f9fafb;
      border: 1px solid #d1d5db;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .mapping-list {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;

      .mapping-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: #f9fafb;
        border: 1px solid #f3f4f6;
        border-radius: 6px;
        padding: 0.55rem 0.85rem;

        .excel-col-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .col-info {
            display: flex;
            flex-direction: column;
            .type { font-size: 0.65rem; color: #6b7280; }
            .name { font-size: 0.82rem; color: #111827; }
          }
        }

        .system-field-box {
          flex: 1.2;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;

          .type { font-size: 0.65rem; color: #6b7280; }
          .field-select {
            padding: 0.35rem;
            border-radius: 4px;
            border: 1px solid #d1d5db;
            font-size: 0.78rem;
            font-weight: 600;
            background: #fff;
          }
        }

        .confidence-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;

          .conf-label { font-size: 0.65rem; color: #6b7280; }
          .conf-pill {
            background: #f0f9ff;
            color: #0284c7;
            font-weight: 700;
            font-size: 0.75rem;
            padding: 0.15rem 0.5rem;
            border-radius: 10px;

            &.high { background: #ecfdf5; color: #047857; }
          }
        }
      }
    }

    .card-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.85rem;
      border-top: 1px solid #f3f4f6;

      .btn-run {
        background: #0284c7;
        color: #ffffff;
        border: none;
        padding: 0.55rem 1.1rem;
        border-radius: 6px;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.4rem;

        &:hover { background: #0369a1; }
      }
    }

    .table-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.1rem;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.85rem;
        h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #111827; }
        .record-badge { font-size: 0.72rem; font-weight: 600; color: #0284c7; background: #f0f9ff; padding: 0.15rem 0.5rem; border-radius: 10px; }
      }
    }

    .table-responsive { overflow-x: auto; }

    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;

      th {
        background: #f9fafb;
        padding: 0.65rem 0.75rem;
        text-align: left;
        font-weight: 700;
        color: #4b5563;
        border-bottom: 2px solid #e2e8f0;
        &.text-right { text-align: right; }
      }

      tbody tr {
        border-bottom: 1px solid #f1f5f9;
        &:hover { background: #f8fafc; }

        td {
          padding: 0.55rem 0.85rem;
          vertical-align: middle;
          &.text-right { text-align: right; }
          &.font-mono { font-family: monospace; font-weight: 600; }
        }
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      .u-avatar {
        width: 24px;
        height: 24px;
        background: #e0f2fe;
        color: #0284c7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 800;
      }
      strong { color: #0f172a; }
    }

    .module-badge {
      background: #f1f5f9;
      color: #374151;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .license-tag {
      font-weight: 600;
      color: #6b7280;

      &.pro { color: #0284c7; font-weight: 700; }
    }

    .badge-sys {
      background: #f1f5f9;
      color: #334155;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.72rem;
    }

    .badge-type {
      background: #f8fafc;
      color: #64748b;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 600;
      &.sync { background: #faf5ff; color: #7e22ce; }
    }

    .role-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      &.out { background: #ecfdf5; color: #047857; }
      &.in { background: #eff6ff; color: #0284c7; }
    }

    .badge-dvm {
      background: #fef3c7;
      color: #b45309;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .text-danger { color: #dc2626; }
  `]
})
export class DataImportComponent {
  importService = inject(DataImportService);
  basisService = inject(BasisSizingService);
  customerService = inject(CustomerService);
  modullerService = inject(ModullerService);
  router = inject(Router);

  activeTab = signal<'mapping' | 'preview'>('preview');
  selectedCategory = signal<ExcelImportCategory>('basis');
  isDragging = false;
  isProcessing = signal<boolean>(false);
  processingProgress = signal<number>(0);
  processingFileName = signal<string>('');

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.isDragging = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleFile(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.isProcessing.set(true);
    this.processingFileName.set(file.name);
    this.processingProgress.set(20);

    const progressTimer = setInterval(() => {
      this.processingProgress.update(p => (p < 85 ? p + 15 : p));
    }, 100);

    setTimeout(() => {
      try {
        this.importService.parseExcelFile(file, this.selectedCategory());
        this.processingProgress.set(100);
      } finally {
        clearInterval(progressTimer);
        setTimeout(() => {
          this.isProcessing.set(false);
          this.activeTab.set('preview');
        }, 350);
      }
    }, 450);
  }

  loadSampleData(): void { 
    this.importService.importCategory.set(this.selectedCategory());
    this.importService.loadSampleData();
    this.activeTab.set('preview');
  }

  onMappingChange(excelCol: string, event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.importService.updateMapping(excelCol, val);
  }

  runAnalysis(): void { this.router.navigate(['/analytics']); }
  downloadTemplate(): void { downloadModulesTemplate(); }
  goToArchitectureMap(): void {
    if (this.importService.importCategory() === 'po') {
      this.router.navigate(['/architecture-map'], { queryParams: { mode: 'po' } });
    } else if (this.importService.importCategory() === 'modules') {
      this.router.navigate(['/modules']);
    } else {
      this.router.navigate(['/architecture-map']);
    }
  }
}
