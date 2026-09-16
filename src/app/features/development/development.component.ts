import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

export interface CustomCodeItem {
  id: string;
  name: string;
  count: number;
  level: 'Yüksek' | 'Orta' | 'Düşük';
  category: 'Genişletme & Exit' | 'Entegrasyon & Bağlantı' | 'Çekirdek Z-Geliştirme';
  description: string;
  s4Recommendation: string;
  tag: string;
}

export const DEFAULT_CUSTOM_CODE_ITEMS: CustomCodeItem[] = [
  {
    id: 'custom-package',
    name: 'Custom Package',
    count: 119,
    level: 'Yüksek',
    category: 'Çekirdek Z-Geliştirme',
    description: 'Müşteriye özel Z/Y ana geliştirme paketleri ve paket hiyerarşisi',
    s4Recommendation: 'Clean Core uyumlu paket yapısına dönüştürülmeli ve gereksiz paketler elenmeli',
    tag: 'Paket / Hiyerarşi'
  },
  {
    id: 'consumer-service',
    name: 'Consumer-Service',
    count: 131,
    level: 'Yüksek',
    category: 'Entegrasyon & Bağlantı',
    description: 'Dış sistemlerden SAP içerisine çağrılan web servisleri ve proxy entegrasyonları',
    s4Recommendation: 'SAP BTP Cloud Integration ve modern OData / REST API standartlarına taşınmalı',
    tag: 'Web Servis / API'
  },
  {
    id: 'service-definition',
    name: 'Service-Definition',
    count: 231,
    level: 'Düşük',
    category: 'Entegrasyon & Bağlantı',
    description: 'SAP SOAP/WSDL ve standart dışa açılan servis konfigürasyon tanımları',
    s4Recommendation: 'S/4HANA ile doğrudan uyumludur, minimum eforla taşınabilir',
    tag: 'Servis Tanımı'
  },
  {
    id: 'db-connection',
    name: 'DBConnection',
    count: 3,
    level: 'Orta',
    category: 'Entegrasyon & Bağlantı',
    description: 'Harici veritabanlarına doğrudan Native SQL / DBCON bağlantıları',
    s4Recommendation: 'HANA CDS Views veya BTP Data Provisioning üzerinden güvenli erişime dönüştürülmeli',
    tag: 'Doğrudan DB Erişimi'
  },
  {
    id: 'rfc-list',
    name: 'RFC-List',
    count: 163,
    level: 'Yüksek',
    category: 'Entegrasyon & Bağlantı',
    description: 'Remote Function Call (RFC) ve BAPI fonksiyon modülü bağlantıları',
    s4Recommendation: 'Point-to-point RFC yerine BTP Event Mesh ve OData V4 entegrasyonuna geçilmeli',
    tag: 'RFC / BAPI'
  },
  {
    id: 'user-exit',
    name: 'User-Exit',
    count: 198,
    level: 'Yüksek',
    category: 'Genişletme & Exit',
    description: 'Klasik modifikasyon ve subrutin bazlı eski nesil User-Exit kod blokları',
    s4Recommendation: 'Kritik Clean Core riski taşır; BAdI veya Key User Extensibility ile yeniden tasarlanmalı',
    tag: 'Eski Modifikasyon'
  },
  {
    id: 'enhancement',
    name: 'Enhancement',
    count: 364,
    level: 'Düşük',
    category: 'Genişletme & Exit',
    description: 'Explicit / Implicit Enhancement noktaları ve kaynak kod genişletmeleri',
    s4Recommendation: 'Readiness Check Simplification Item kontrolü sonrası büyük oranda otomatik uyarlanır',
    tag: 'Kaynak Kod Genişletme'
  },
  {
    id: 'badi',
    name: 'Badi',
    count: 178,
    level: 'Orta',
    category: 'Genişletme & Exit',
    description: 'Klasik ve yeni nesil Business Add-In (BAdI) genişletme uygulamaları',
    s4Recommendation: 'S/4HANA Cloud BAdI ve Developer Extensibility standartlarına taşınmalı',
    tag: 'Nesne Yönelimli Exit'
  },
  {
    id: 'bte',
    name: 'BTE',
    count: 12,
    level: 'Yüksek',
    category: 'Genişletme & Exit',
    description: 'Business Transaction Events (Finans ve Muhasebe süreç tetikleyicileri)',
    s4Recommendation: 'S/4HANA Universal Journal (ACDOCA) uyumluluğu kontrol edilerek modernize edilmeli',
    tag: 'Finansal Olay Exit'
  },
  {
    id: 'repair',
    name: 'Repair',
    count: 15,
    level: 'Yüksek',
    category: 'Genişletme & Exit',
    description: 'SAP standart kaynak kodlarına yapılmış doğrudan onarım/modifikasyonlar (SSCR)',
    s4Recommendation: 'En yüksek risk sınıfındadır; standart SAP fonksiyonlarına dönülerek tamamen emekli edilmeli',
    tag: 'Doğrudan Standart Modifiye'
  },
  {
    id: 'transaction',
    name: 'Transaction',
    count: 872,
    level: 'Düşük',
    category: 'Çekirdek Z-Geliştirme',
    description: 'Müşteriye özel Z işlem kodları (TCode) ve menü bağlantıları',
    s4Recommendation: 'Fiori Launchpad kataloglarına eşleştirilmeli ve kullanılmayan Z TCode\'lar temizlenmeli',
    tag: 'İşlem Kodu (TCode)'
  },
  {
    id: 'program',
    name: 'Program',
    count: 816,
    level: 'Orta',
    category: 'Çekirdek Z-Geliştirme',
    description: 'Z raporları, batch iş programları ve modül havuzu (dialog) programları',
    s4Recommendation: 'ABAP Test Cockpit (ATC) ile Clean Core syntax hataları giderilmeli ve Fiori App\'e aktarılmalı',
    tag: 'Z Rapor / Program'
  },
  {
    id: 'fonksiyon',
    name: 'Fonksiyon',
    count: 700,
    level: 'Yüksek',
    category: 'Çekirdek Z-Geliştirme',
    description: 'Z fonksiyon grupları ve modülleri (iş mantığı ve hesaplama algoritmaları)',
    s4Recommendation: 'Fonksiyon modülleri REST/OData servislerine ve RAP / CAP iş nesnelerine dönüştürülmeli',
    tag: 'Fonksiyon Modülü'
  }
];

@Component({
  selector: 'app-development',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="development-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="badge-row">
            <span class="company-badge">{{ customerService.activeCustomer().name }}</span>
            <span class="module-tag">Clean Core & Kod Analizi</span>
          </div>
          <h1 class="page-title">
            <app-icon name="cpu" [size]="24" color="#0284c7"></app-icon>
            SAP Customization (Özel Geliştirme Envanteri)
          </h1>
          <p class="page-subtitle">
            Müşteri Sistemindeki Z/Y Özel Uyarlamalar, Modifikasyonlar, Entegrasyon Servisleri ve Clean Core Risk Matrisi
          </p>
        </div>

        <div class="header-actions">
          <button *ngIf="!isEditing()" class="btn btn-outline" (click)="startEdit()">
            <app-icon name="edit" [size]="15" color="#0284c7"></app-icon>
            <span>Değerleri Düzenle</span>
          </button>

          <button *ngIf="!isEditing() && isCustomized()" class="btn btn-subtle" (click)="resetToDefault()" title="Varsayılan değerlere sıfırla">
            <app-icon name="refresh" [size]="14" color="#64748b"></app-icon>
            <span>Varsayılana Sıfırla</span>
          </button>

          <button *ngIf="isEditing()" class="btn btn-secondary" (click)="cancelEdit()">
            <app-icon name="x" [size]="15" color="#475569"></app-icon>
            <span>İptal</span>
          </button>

          <button *ngIf="isEditing()" class="btn btn-success" (click)="saveEdit()">
            <app-icon name="check" [size]="15" color="#ffffff"></app-icon>
            <span>Kaydet</span>
          </button>
        </div>
      </div>

      <!-- Notification Toast -->
      <div *ngIf="saveSuccessMessage()" class="save-toast-banner">
        <app-icon name="check" [size]="16" color="#15803d"></app-icon>
        <span>{{ saveSuccessMessage() }}</span>
      </div>

      <!-- Executive KPI Summary Cards -->
      <div class="kpi-summary-grid">
        <!-- Card 1: Toplam Obje -->
        <div class="kpi-card total-card">
          <div class="kpi-top">
            <span class="kpi-title">Toplam Özel Obje</span>
            <span class="kpi-pill">13 Obje Tipi</span>
          </div>
          <div class="kpi-value">{{ totalObjectsCount().toLocaleString('tr-TR') }}</div>
          <div class="kpi-sub">
            <span>S/4HANA Dönüşüm Envanteri</span>
          </div>
          <div class="distribution-bar-wrapper">
            <div class="distribution-bar">
              <div class="d-segment high" [style.width.%]="highPercent()" [title]="'Yüksek: %' + highPercent()"></div>
              <div class="d-segment medium" [style.width.%]="mediumPercent()" [title]="'Orta: %' + mediumPercent()"></div>
              <div class="d-segment low" [style.width.%]="lowPercent()" [title]="'Düşük: %' + lowPercent()"></div>
            </div>
          </div>
        </div>

        <!-- Card 2: Yüksek Kritiklik -->
        <div class="kpi-card high-card">
          <div class="kpi-top">
            <span class="kpi-title">Yüksek Kritiklik</span>
            <span class="kpi-status-dot red"></span>
          </div>
          <div class="kpi-value text-red">{{ highCount().toLocaleString('tr-TR') }}</div>
          <div class="kpi-sub">
            <strong class="text-red">%{{ highPercent() }}</strong> pay (User-Exit, Repair, BTE, RFC, Fonksiyon)
          </div>
          <span class="risk-badge red">Öncelikli Clean Core Riski</span>
        </div>

        <!-- Card 3: Orta Seviye Efor -->
        <div class="kpi-card medium-card">
          <div class="kpi-top">
            <span class="kpi-title">Orta Seviye Efor</span>
            <span class="kpi-status-dot amber"></span>
          </div>
          <div class="kpi-value text-amber">{{ mediumCount().toLocaleString('tr-TR') }}</div>
          <div class="kpi-sub">
            <strong class="text-amber">%{{ mediumPercent() }}</strong> pay (BAdI, Program, DBConnection)
          </div>
          <span class="risk-badge amber">Adaptasyon & Uyarlama Gerekli</span>
        </div>

        <!-- Card 4: Düşük / Standart -->
        <div class="kpi-card low-card">
          <div class="kpi-top">
            <span class="kpi-title">Düşük / Hızlı Geçiş</span>
            <span class="kpi-status-dot green"></span>
          </div>
          <div class="kpi-value text-green">{{ lowCount().toLocaleString('tr-TR') }}</div>
          <div class="kpi-sub">
            <strong class="text-green">%{{ lowPercent() }}</strong> pay (Transaction, Enhancement, Servis)
          </div>
          <span class="risk-badge green">Otomatik / Minimum Efor</span>
        </div>
      </div>



      <!-- Toolbar: Filters, Search & View Switcher -->
      <div class="toolbar-card">
        <div class="toolbar-left">
          <!-- Search Box -->
          <div class="search-box">
            <app-icon name="search" [size]="15" color="#94a3b8"></app-icon>
            <input 
              type="text" 
              placeholder="Obje adına veya açıklamaya göre ara..." 
              [(ngModel)]="searchQuery" 
              class="search-input" />
            <button *ngIf="searchQuery" class="btn-clear-search" (click)="searchQuery = ''">✕</button>
          </div>

          <!-- Level Filter Chips -->
          <div class="filter-chips">
            <button 
              type="button" 
              class="chip-btn" 
              [class.active]="selectedLevel() === 'TÜMÜ'"
              (click)="selectedLevel.set('TÜMÜ')">
              Tümü ({{ items().length }})
            </button>
            <button 
              type="button" 
              class="chip-btn chip-red" 
              [class.active]="selectedLevel() === 'Yüksek'"
              (click)="selectedLevel.set('Yüksek')">
              <span class="chip-dot red"></span>
              Yüksek ({{ getCountByLevel('Yüksek') }})
            </button>
            <button 
              type="button" 
              class="chip-btn chip-amber" 
              [class.active]="selectedLevel() === 'Orta'"
              (click)="selectedLevel.set('Orta')">
              <span class="chip-dot amber"></span>
              Orta ({{ getCountByLevel('Orta') }})
            </button>
            <button 
              type="button" 
              class="chip-btn chip-green" 
              [class.active]="selectedLevel() === 'Düşük'"
              (click)="selectedLevel.set('Düşük')">
              <span class="chip-dot green"></span>
              Düşük ({{ getCountByLevel('Düşük') }})
            </button>
          </div>
        </div>

        <div class="toolbar-right">
          <!-- Category Select -->
          <select [(ngModel)]="selectedCategory" class="category-select">
            <option value="TÜMÜ">Tüm Kategoriler</option>
            <option value="Genişletme & Exit">Genişletme & Exit</option>
            <option value="Entegrasyon & Bağlantı">Entegrasyon & Bağlantı</option>
            <option value="Çekirdek Z-Geliştirme">Çekirdek Z-Geliştirme</option>
          </select>

          <!-- View Mode Toggle -->
          <div class="view-toggle">
            <button 
              type="button" 
              class="toggle-btn" 
              [class.active]="viewMode() === 'grid'" 
              (click)="viewMode.set('grid')"
              title="Kart Görünümü">
              <app-icon name="dashboard" [size]="15"></app-icon>
              <span>Kartlar</span>
            </button>
            <button 
              type="button" 
              class="toggle-btn" 
              [class.active]="viewMode() === 'table'" 
              (click)="viewMode.set('table')"
              title="Tablo Görünümü">
              <app-icon name="file-text" [size]="15"></app-icon>
              <span>Tablo</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================= VIEW 1: GRID VIEW ================= -->
      <div *ngIf="viewMode() === 'grid'" class="custom-code-grid">
        <div 
          *ngFor="let item of filteredItems(); let idx = index" 
          class="object-card"
          [class.card-high]="item.level === 'Yüksek'"
          [class.card-medium]="item.level === 'Orta'"
          [class.card-low]="item.level === 'Düşük'">
          
          <div class="card-header">
            <div class="ch-left">
              <div class="obj-icon-box" [ngClass]="item.level.toLowerCase()">
                <app-icon [name]="getObjIcon(item.name)" [size]="14"></app-icon>
              </div>
              <div>
                <h3 class="obj-name">{{ item.name }}</h3>
                <span class="obj-tag">{{ item.tag }}</span>
              </div>
            </div>

            <!-- Level Badge / Editor in edit mode -->
            <div class="ch-right">
              <div *ngIf="!isEditing()" class="level-badge" [ngClass]="getLevelClass(item.level)">
                <span class="l-dot"></span>
                <span>{{ item.level }}</span>
              </div>
              <select *ngIf="isEditing()" [(ngModel)]="getEditableItem(item.id).level" class="level-select">
                <option value="Yüksek">Yüksek</option>
                <option value="Orta">Orta</option>
                <option value="Düşük">Düşük</option>
              </select>
            </div>
          </div>

          <div class="card-body">
            <div class="count-display-row">
              <div *ngIf="!isEditing()" class="count-val" [ngClass]="getLevelClass(item.level)">
                {{ item.count.toLocaleString('tr-TR') }}
                <span class="unit-lbl">Adet</span>
              </div>
              <div *ngIf="isEditing()" class="count-edit-wrap">
                <input 
                  type="number" 
                  min="0"
                  [(ngModel)]="getEditableItem(item.id).count" 
                  class="count-edit-input" />
                <span class="unit-lbl">Adet</span>
              </div>

              <div class="share-info">
                <span class="share-percent">%{{ getShareOfTotal(item.count) }}</span>
                <span class="share-label">Pay</span>
              </div>
            </div>

            <!-- Share Mini Progress Bar -->
            <div class="card-progress-bar">
              <div 
                class="progress-fill" 
                [ngClass]="getLevelClass(item.level)" 
                [style.width.%]="getProgressWidth(item.count)">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= VIEW 2: TABLE VIEW ================= -->
      <div *ngIf="viewMode() === 'table'" class="table-container-card">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 45px;">#</th>
              <th>Obje Adı & Tip</th>
              <th>Kategori</th>
              <th style="width: 140px; text-align: right;">Sayı (Adet)</th>
              <th style="width: 90px; text-align: right;">Genel Pay</th>
              <th style="width: 130px; text-align: center;">Kritiklik / Seviye</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems(); let idx = index">
              <td class="td-num">{{ idx + 1 }}</td>
              <td>
                <div class="tbl-obj-name-group">
                  <strong>{{ item.name }}</strong>
                  <span class="tbl-tag">{{ item.tag }}</span>
                </div>
              </td>
              <td>
                <span class="cat-pill">{{ item.category }}</span>
              </td>
              <td class="td-count" style="text-align: right;">
                <span *ngIf="!isEditing()" class="tbl-count-val" [ngClass]="getLevelClass(item.level)">
                  {{ item.count.toLocaleString('tr-TR') }}
                </span>
                <input 
                  *ngIf="isEditing()" 
                  type="number" 
                  min="0"
                  [(ngModel)]="getEditableItem(item.id).count" 
                  class="tbl-count-input" />
              </td>
              <td style="text-align: right;" class="td-share">
                %{{ getShareOfTotal(item.count) }}
              </td>
              <td style="text-align: center;">
                <span *ngIf="!isEditing()" class="level-badge" [ngClass]="getLevelClass(item.level)">
                  <span class="l-dot"></span>
                  <span>{{ item.level }}</span>
                </span>
                <select *ngIf="isEditing()" [(ngModel)]="getEditableItem(item.id).level" class="level-select">
                  <option value="Yüksek">Yüksek</option>
                  <option value="Orta">Orta</option>
                  <option value="Düşük">Düşük</option>
                </select>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="tfoot-total-row">
              <td colspan="3"><strong>TOPLAM ENVANTER</strong></td>
              <td style="text-align: right;"><strong>{{ totalObjectsCount().toLocaleString('tr-TR') }}</strong></td>
              <td style="text-align: right;"><strong>%100</strong></td>
              <td colspan="1">
                <span class="tfoot-breakdown">
                  Yüksek: <strong>{{ highCount() }}</strong> | Orta: <strong>{{ mediumCount() }}</strong> | Düşük: <strong>{{ lowCount() }}</strong>
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  `,
  styles: [`
    .development-page {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 1.25rem 1.75rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);

      .badge-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.35rem;

        .company-badge {
          background: #eff6ff;
          color: #0284c7;
          border: 1px solid #bfdbfe;
          padding: 0.15rem 0.6rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .module-tag {
          background: #f1f5f9;
          color: #475569;
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
        }
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1.45rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }

      .page-subtitle {
        margin: 0.25rem 0 0 0;
        font-size: 0.82rem;
        color: #64748b;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }
    }

    /* Common Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1.05rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;

      &.btn-outline {
        background: #ffffff;
        color: #0284c7;
        border: 1px solid #bae6fd;
        &:hover { background: #f0f9ff; border-color: #7dd3fc; }
      }

      &.btn-subtle {
        background: #f8fafc;
        color: #64748b;
        border: 1px solid #e2e8f0;
        &:hover { background: #f1f5f9; color: #334155; }
      }

      &.btn-secondary {
        background: #ffffff;
        color: #475569;
        border: 1px solid #cbd5e1;
        &:hover { background: #f8fafc; }
      }

      &.btn-success {
        background: #16a34a;
        color: #ffffff;
        border: 1px solid #16a34a;
        box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
        &:hover { background: #15803d; }
      }
    }

    /* Save Banner */
    .save-toast-banner {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #166534;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      animation: fadeIn 0.25s ease-in;
    }

    /* KPI Summary Grid */
    .kpi-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
        transition: transform 0.15s ease, box-shadow 0.15s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
        }

        &.total-card {
          border-left: 4px solid #0284c7;
        }

        &.high-card {
          border-left: 4px solid #dc2626;
          background: linear-gradient(180deg, #ffffff 0%, #fef2f2 100%);
        }

        &.medium-card {
          border-left: 4px solid #d97706;
          background: linear-gradient(180deg, #ffffff 0%, #fffbeb 100%);
        }

        &.low-card {
          border-left: 4px solid #16a34a;
          background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
        }

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .kpi-title {
            font-size: 0.78rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .kpi-pill {
            background: #f1f5f9;
            color: #475569;
            font-size: 0.68rem;
            font-weight: 700;
            padding: 0.15rem 0.5rem;
            border-radius: 4px;
          }

          .kpi-status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            &.red { background: #dc2626; box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2); }
            &.amber { background: #d97706; box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2); }
            &.green { background: #16a34a; box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2); }
          }
        }

        .kpi-value {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;

          &.text-red { color: #dc2626; }
          &.text-amber { color: #d97706; }
          &.text-green { color: #16a34a; }
        }

        .kpi-sub {
          font-size: 0.76rem;
          color: #64748b;
          margin-top: 0.1rem;
        }

        .risk-badge {
          margin-top: 0.4rem;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          width: fit-content;

          &.red { background: #fee2e2; color: #991b1b; }
          &.amber { background: #fef3c7; color: #92400e; }
          &.green { background: #dcfce7; color: #166534; }
        }

        .distribution-bar-wrapper {
          margin-top: 0.6rem;
          .distribution-bar {
            height: 7px;
            background: #e2e8f0;
            border-radius: 999px;
            display: flex;
            overflow: hidden;

            .d-segment {
              height: 100%;
              transition: width 0.3s ease;
              &.high { background: #dc2626; }
              &.medium { background: #d97706; }
              &.low { background: #16a34a; }
            }
          }
        }
      }
    }

    /* Clean Core Strategy Callout */
    .clean-core-callout {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 1.15rem 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1.1rem;

      .callout-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: #ffffff;
        border: 1px solid #bfdbfe;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.1);
      }

      .callout-content {
        h4 {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0369a1;
          margin: 0 0 0.3rem 0;
        }

        p {
          font-size: 0.8rem;
          color: #334155;
          line-height: 1.5;
          margin: 0;
        }
      }
    }

    /* Toolbar */
    .toolbar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);

      @media (max-width: 900px) {
        flex-direction: column;
        align-items: stretch;
      }

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;

        @media (max-width: 650px) {
          flex-direction: column;
          align-items: stretch;
        }
      }

      .search-box {
        position: relative;
        display: flex;
        align-items: center;
        min-width: 250px;

        app-icon {
          position: absolute;
          left: 0.75rem;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.45rem 1.8rem 0.45rem 2.2rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.78rem;
          color: #1e293b;
          background: #f8fafc;
          transition: all 0.15s;

          &:focus {
            outline: none;
            background: #ffffff;
            border-color: #0284c7;
            box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.12);
          }
        }

        .btn-clear-search {
          position: absolute;
          right: 0.5rem;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.75rem;
          padding: 0.2rem;
          &:hover { color: #334155; }
        }
      }

      .filter-chips {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: wrap;

        .chip-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.73rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.15s;

          &:hover {
            background: #f1f5f9;
            color: #1e293b;
          }

          &.active {
            background: #0284c7;
            color: #ffffff;
            border-color: #0284c7;
          }

          &.chip-red.active {
            background: #dc2626;
            border-color: #dc2626;
          }

          &.chip-amber.active {
            background: #d97706;
            border-color: #d97706;
          }

          &.chip-green.active {
            background: #16a34a;
            border-color: #16a34a;
          }

          .chip-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            &.red { background: #dc2626; }
            &.amber { background: #d97706; }
            &.green { background: #16a34a; }
          }
        }
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .category-select {
          padding: 0.42rem 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.78rem;
          color: #334155;
          background: #ffffff;
          cursor: pointer;
          &:focus { outline: none; border-color: #0284c7; }
        }

        .view-toggle {
          display: flex;
          background: #f1f5f9;
          padding: 0.2rem;
          border-radius: 6px;

          .toggle-btn {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.32rem 0.65rem;
            border: none;
            background: transparent;
            color: #64748b;
            font-size: 0.74rem;
            font-weight: 600;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s;

            &.active {
              background: #ffffff;
              color: #0284c7;
              box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
          }
        }
      }
    }

    /* Grid View Cards */
    .custom-code-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.85rem;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (max-width: 800px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 500px) {
        grid-template-columns: 1fr;
      }
    }

    .object-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem 0.9rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
      transition: all 0.18s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      }

      &.card-high {
        border-top: 3px solid #dc2626;
      }

      &.card-medium {
        border-top: 3px solid #d97706;
      }

      &.card-low {
        border-top: 3px solid #16a34a;
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;

        .ch-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .obj-icon-box {
            width: 30px;
            height: 30px;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            &.yüksek { background: #fee2e2; color: #dc2626; }
            &.orta { background: #fef3c7; color: #d97706; }
            &.düşük { background: #dcfce7; color: #16a34a; }
          }

          .obj-name {
            font-size: 0.82rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }

          .obj-tag {
            font-size: 0.63rem;
            color: #64748b;
            font-weight: 600;
          }
        }
      }

      .card-body {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        .count-display-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;

          .count-val {
            font-size: 1.45rem;
            font-weight: 800;
            line-height: 1;

            &.level-high { color: #dc2626; }
            &.level-medium { color: #d97706; }
            &.level-low { color: #16a34a; }

            .unit-lbl {
              font-size: 0.67rem;
              color: #94a3b8;
              font-weight: 600;
              margin-left: 0.15rem;
            }
          }

          .count-edit-wrap {
            display: flex;
            align-items: baseline;
            gap: 0.35rem;

            .count-edit-input {
              width: 90px;
              padding: 0.3rem 0.5rem;
              font-size: 1.25rem;
              font-weight: 800;
              border: 1px solid #0284c7;
              border-radius: 6px;
              color: #0f172a;
              text-align: right;
              &:focus { outline: none; }
            }
          }

          .share-info {
            display: flex;
            flex-direction: column;
            align-items: flex-end;

            .share-percent {
              font-size: 0.95rem;
              font-weight: 700;
              color: #475569;
            }

            .share-label {
              font-size: 0.65rem;
              color: #94a3b8;
              text-transform: uppercase;
            }
          }
        }

        .card-progress-bar {
          height: 5px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;

          .progress-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 0.3s ease;

            &.level-high { background: #dc2626; }
            &.level-medium { background: #d97706; }
            &.level-low { background: #16a34a; }
          }
        }
      }
    }

    /* Badges & Pills */
    .level-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.68rem;
      font-weight: 700;
      white-space: nowrap;

      .l-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      &.level-high {
        background: #fee2e2;
        color: #991b1b;
        .l-dot { background: #dc2626; }
      }

      &.level-medium {
        background: #fef3c7;
        color: #92400e;
        .l-dot { background: #d97706; }
      }

      &.level-low {
        background: #dcfce7;
        color: #166534;
        .l-dot { background: #16a34a; }
      }
    }

    .level-select {
      padding: 0.2rem 0.45rem;
      font-size: 0.72rem;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      &:focus { outline: none; border-color: #0284c7; }
    }

    /* Table View Card */
    .table-container-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);

      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.78rem;

        thead {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;

          th {
            padding: 0.75rem 1rem;
            text-align: left;
            font-weight: 700;
            color: #475569;
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.12s;

            &:hover {
              background: #f8fafc;
            }

            td {
              padding: 0.75rem 1rem;
              vertical-align: middle;
            }

            .td-num {
              color: #94a3b8;
              font-weight: 600;
            }

            .tbl-obj-name-group {
              display: flex;
              flex-direction: column;
              gap: 0.1rem;
              strong { color: #0f172a; font-size: 0.85rem; }
              .tbl-tag { font-size: 0.68rem; color: #64748b; }
            }

            .cat-pill {
              background: #f1f5f9;
              color: #475569;
              padding: 0.15rem 0.5rem;
              border-radius: 4px;
              font-size: 0.68rem;
              font-weight: 600;
              white-space: nowrap;
            }

            .tbl-count-val {
              font-size: 0.95rem;
              font-weight: 800;
              &.level-high { color: #dc2626; }
              &.level-medium { color: #d97706; }
              &.level-low { color: #16a34a; }
            }

            .tbl-count-input {
              width: 80px;
              padding: 0.25rem 0.4rem;
              border: 1px solid #0284c7;
              border-radius: 4px;
              font-size: 0.85rem;
              font-weight: 700;
              text-align: right;
            }

            .td-share {
              font-weight: 700;
              color: #475569;
            }

            .tbl-desc-group {
              display: flex;
              flex-direction: column;
              gap: 0.2rem;
              .desc-main { color: #334155; }
              .rec-sub { font-size: 0.7rem; color: #0284c7; }
            }
          }
        }

        tfoot {
          background: #f8fafc;
          border-top: 2px solid #e2e8f0;
          font-weight: 700;

          td {
            padding: 0.85rem 1rem;
          }

          .tfoot-breakdown {
            font-size: 0.72rem;
            color: #475569;
            strong { color: #0f172a; }
          }
        }
      }
    }
  `]
})
export class DevelopmentComponent {
  customerService = inject(CustomerService);

  items = signal<CustomCodeItem[]>(DEFAULT_CUSTOM_CODE_ITEMS);
  editableItems: CustomCodeItem[] = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_CODE_ITEMS));

  searchQuery = '';
  selectedLevel = signal<string>('TÜMÜ');
  selectedCategory = 'TÜMÜ';
  viewMode = signal<'grid' | 'table'>('grid');
  isEditing = signal<boolean>(false);
  isCustomized = signal<boolean>(false);
  saveSuccessMessage = signal<string>('');

  constructor() {
    effect(() => {
      const custId = this.customerService.activeCustomerId();
      if (custId) {
        this.loadCustomerData(custId);
      }
    });
  }

  loadCustomerData(custId: string) {
    try {
      const saved = localStorage.getItem(`taskforce_custom_code_${custId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.items.set(parsed);
          this.editableItems = JSON.parse(JSON.stringify(parsed));
          this.isCustomized.set(true);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading custom code items:', e);
    }
    this.items.set(DEFAULT_CUSTOM_CODE_ITEMS);
    this.editableItems = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_CODE_ITEMS));
    this.isCustomized.set(false);
  }

  // Calculated totals
  totalObjectsCount = computed(() => {
    return this.items().reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  });

  highCount = computed(() => {
    return this.items()
      .filter(item => item.level === 'Yüksek')
      .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  });

  highPercent = computed(() => {
    const total = this.totalObjectsCount();
    if (!total) return 0;
    return Math.round((this.highCount() / total) * 1000) / 10;
  });

  mediumCount = computed(() => {
    return this.items()
      .filter(item => item.level === 'Orta')
      .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  });

  mediumPercent = computed(() => {
    const total = this.totalObjectsCount();
    if (!total) return 0;
    return Math.round((this.mediumCount() / total) * 1000) / 10;
  });

  lowCount = computed(() => {
    return this.items()
      .filter(item => item.level === 'Düşük')
      .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  });

  lowPercent = computed(() => {
    const total = this.totalObjectsCount();
    if (!total) return 0;
    return Math.round((this.lowCount() / total) * 1000) / 10;
  });

  // Filtered Items
  filteredItems = computed(() => {
    let list = this.items();
    const lvl = this.selectedLevel();
    if (lvl !== 'TÜMÜ') {
      list = list.filter(item => item.level === lvl);
    }
    const cat = this.selectedCategory;
    if (cat !== 'TÜMÜ') {
      list = list.filter(item => item.category === cat);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        item.s4Recommendation.toLowerCase().includes(q)
      );
    }
    return list;
  });

  getCountByLevel(level: 'Yüksek' | 'Orta' | 'Düşük'): number {
    return this.items().filter(item => item.level === level).length;
  }

  getShareOfTotal(count: number): number {
    const total = this.totalObjectsCount();
    if (!total) return 0;
    return Math.round((count / total) * 1000) / 10;
  }

  getProgressWidth(count: number): number {
    // Relative to highest single item (872) so the bars look proportionate
    const maxVal = 872;
    return Math.min(100, Math.max(8, Math.round((count / maxVal) * 100)));
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'Yüksek': return 'level-high';
      case 'Orta': return 'level-medium';
      case 'Düşük': return 'level-low';
      default: return '';
    }
  }

  getObjIcon(name: string): string {
    switch (name) {
      case 'Custom Package': return 'layers';
      case 'Consumer-Service': return 'link';
      case 'Service-Definition': return 'file-text';
      case 'DBConnection': return 'database';
      case 'RFC-List': return 'shuffle';
      case 'User-Exit': return 'alert';
      case 'Enhancement': return 'sparkles';
      case 'Badi': return 'cpu';
      case 'BTE': return 'bolt';
      case 'Repair': return 'alert';
      case 'Transaction': return 'sliders';
      case 'Program': return 'file-text';
      case 'Fonksiyon': return 'cpu';
      default: return 'cpu';
    }
  }

  getEditableItem(id: string): CustomCodeItem {
    let match = this.editableItems.find(i => i.id === id);
    if (!match) {
      match = this.items().find(i => i.id === id);
      if (match) {
        this.editableItems.push(JSON.parse(JSON.stringify(match)));
      }
    }
    return match || this.editableItems[0];
  }

  startEdit() {
    this.editableItems = JSON.parse(JSON.stringify(this.items()));
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  saveEdit() {
    const custId = this.customerService.activeCustomerId();
    const updated = JSON.parse(JSON.stringify(this.editableItems));
    this.items.set(updated);
    if (custId) {
      localStorage.setItem(`taskforce_custom_code_${custId}`, JSON.stringify(updated));
      this.isCustomized.set(true);
    }
    this.isEditing.set(false);
    this.saveSuccessMessage.set('Özel geliştirme envanteri başarıyla kaydedildi!');
    setTimeout(() => this.saveSuccessMessage.set(''), 3500);
  }

  resetToDefault() {
    const cust = this.customerService.activeCustomer();
    const custId = this.customerService.activeCustomerId();
    const confirmed = window.confirm(`"${cust.name}" için özel geliştirme envanteri varsayılan değerlere döndürülsün mü?`);
    if (confirmed && custId) {
      localStorage.removeItem(`taskforce_custom_code_${custId}`);
      this.items.set(DEFAULT_CUSTOM_CODE_ITEMS);
      this.editableItems = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_CODE_ITEMS));
      this.isCustomized.set(false);
      this.isEditing.set(false);
      this.saveSuccessMessage.set('Varsayılan envantere sıfırlandı.');
      setTimeout(() => this.saveSuccessMessage.set(''), 3500);
    }
  }
}
