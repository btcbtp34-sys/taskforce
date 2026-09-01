import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataImportService, ExcelImportCategory } from '../../core/services/data-import.service';
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
          <p class="page-subtitle">Yüklemek İstediğiniz Excel Kategorisini Seçin ve Anında Mimari Haritayı Çizin</p>
        </div>
        <button class="btn btn-sample" (click)="loadSampleData()">
          <app-icon name="file-spreadsheet" [size]="16" color="#0284c7"></app-icon>
          <span>Örnek SAP Verisi Yükle (ABC Holding)</span>
        </button>
      </div>

      <!-- Excel Import Category Selector Cards -->
      <div class="category-cards-grid">
        <div 
          class="cat-card" 
          [class.selected]="selectedCategory() === 'asis'"
          (click)="selectedCategory.set('asis')">
          <div class="cat-icon-box orange"><app-icon name="layers" [size]="20" color="#d97706"></app-icon></div>
          <div class="cat-text">
            <strong>Mevcut Durum Mimari Excel'i (AS-IS)</strong>
            <span>Sunucu adetleri (3x ERP, 2x Fiori vb.), DB, OS ve Destek Sonu (EoS) verilerini yükleyin (örn: ABC_Holding_Mevcut_Durum.xlsx)</span>
          </div>
        </div>

        <div 
          class="cat-card" 
          [class.selected]="selectedCategory() === 'po'"
          (click)="selectedCategory.set('po')">
          <div class="cat-icon-box blue"><app-icon name="bolt" [size]="20" color="#0284c7"></app-icon></div>
          <div class="cat-text">
            <strong>PO Canlı Entegrasyon Listesi</strong>
            <span>SOAP, JDBC, RFC canlı entegrasyon listesini görsel mimari haritaya çevirin (örn: PO Entegrasyon Listesi.xlsx)</span>
          </div>
        </div>

        <div 
          class="cat-card" 
          [class.selected]="selectedCategory() === 'usage'"
          (click)="selectedCategory.set('usage')">
          <div class="cat-icon-box green"><app-icon name="chart" [size]="20" color="#059669"></app-icon></div>
          <div class="cat-text">
            <strong>SAP Kullanım & Lisans Verileri</strong>
            <span>SAP kullanıcı modül işlemlerini, lisans maliyetlerini ve manuel çalışma saatlerini yükleyip analiz edin</span>
          </div>
        </div>
      </div>

      <!-- Drag & Drop Upload Zone -->
      <div 
        class="dropzone" 
        [class.dragging]="isDragging"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">
        
        <input #fileInput type="file" (change)="onFileSelected($event)" accept=".xlsx, .csv" style="display: none;" />
        
        <div class="dropzone-icon">
          <app-icon name="upload" [size]="24" color="#0284c7"></app-icon>
        </div>
        
        <h3 class="drop-title">
          {{ selectedCategory() === 'asis' ? 'Mevcut Durum Mimari Excel Dosyanızı Buraya Sürükleyin' : (selectedCategory() === 'po' ? 'PO Canlı Entegrasyon Listesi Excel Dosyanızı Buraya Sürükleyin' : 'SAP Kullanım & Lisans Excel Dosyanızı Buraya Sürükleyin') }}
        </h3>
        <p class="drop-sub">Desteklenen Formatlar: <strong>.xlsx, .csv</strong> (Maksimum 50 MB)</p>
        <button class="btn btn-primary" (click)="$event.stopPropagation(); fileInput.click()">
          <app-icon name="upload" [size]="15" color="#ffffff"></app-icon>
          <span>Excel Dosyası Seç & Çiz</span>
        </button>
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

        <div class="map-shortcut-box">
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
        <div class="table-card">
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
      grid-template-columns: repeat(3, 1fr);
      gap: 1.1rem;

      .cat-card {
        background: #ffffff;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        padding: 1rem;
        display: flex;
        align-items: flex-start;
        gap: 0.85rem;
        cursor: pointer;
        transition: all 0.15s ease-in-out;

        &:hover, &.selected {
          border-color: #0284c7;
          background: #f0f9ff;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.15);
        }

        .cat-icon-box {
          font-size: 1.4rem;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .cat-text {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          strong { font-size: 0.88rem; color: #0f172a; font-weight: 800; }
          span { font-size: 0.72rem; color: #64748b; line-height: 1.35; }
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
        border-bottom: 1px solid #e5e7eb;
      }

      td {
        padding: 0.65rem 0.75rem;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: middle;
      }
    }

    .module-tag {
      background: #f3f4f6;
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

    .text-danger { color: #dc2626; }
  `]
})
export class DataImportComponent {
  importService = inject(DataImportService);
  router = inject(Router);

  activeTab = signal<'mapping' | 'preview'>('mapping');
  selectedCategory = signal<ExcelImportCategory>('asis');
  isDragging = false;

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.isDragging = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.importService.parseExcelFile(e.dataTransfer.files[0], this.selectedCategory());
      this.goToArchitectureMap();
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importService.parseExcelFile(input.files[0], this.selectedCategory());
      this.goToArchitectureMap();
    }
  }

  loadSampleData(): void { 
    this.importService.loadSampleData();
    this.goToArchitectureMap();
  }

  onMappingChange(excelCol: string, event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.importService.updateMapping(excelCol, val);
  }

  runAnalysis(): void { this.router.navigate(['/analytics']); }
  goToArchitectureMap(): void { this.router.navigate(['/architecture-map']); }
}
