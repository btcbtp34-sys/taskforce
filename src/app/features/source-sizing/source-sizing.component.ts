import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
import { DataImportService } from '../../core/services/data-import.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SizingMatrixRowOverride, SizingPageOverrides, SourceTargetMatrixItem } from '../../core/models/basis-sizing.model';

@Component({
  selector: 'app-source-sizing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="source-page">
      
      <!-- Live Upload Indicator Banner -->
      <div class="uploaded-live-banner" *ngIf="basisService.hasUploadedData()">
        <div class="banner-left">
          <span class="live-dot"></span>
          <span class="banner-text">
            <strong>Canlı Sizing Raporu Yüklendi:</strong> {{ basisService.basisPackage()?.fileName }} 
            • SID: <strong>{{ basisService.systemInfo()?.sid }}</strong> 
            • Veritabanı: <strong>{{ basisService.systemInfo()?.dbType }}</strong>
            • Tahmini RAM: <strong>{{ basisService.memoryDetails()?.anticipatedInitialMemoryGiB | number:'1.0-1' }} GiB</strong>
          </span>
        </div>
        <div class="banner-right">
          <button class="btn-banner-reset" (click)="basisService.clearUploadedData()">
            Varsayılan Görünüme Dön
          </button>
        </div>
      </div>

      <!-- 1. PAGE HEADER -->
      <div class="page-top-header">
        <div class="title-area">
          <div class="customer-tag">
            <app-icon name="customers" [size]="13" color="#0284c7"></app-icon>
            <span>{{ customerService.activeCustomer().name }}</span>
          </div>
          <h1 class="page-title">Mevcut / Hedef Sistem Altyapı & Boyutlandırma</h1>
          <p class="page-subtitle">SAP HANA Cockpit sistem durumu, /SDF/HDB_SIZING raporu ve Hedef S/4HANA boyutlandırma matrisi</p>
        </div>

        <!-- Cockpit Quick Status Pills -->
        <div class="cockpit-status-bar">
          <div class="status-pill" [ngClass]="basisService.hasUploadedData() ? 'green' : 'amber'">
            <span class="pulse-dot"></span>
            <span>{{ basisService.hasUploadedData() ? (ov().operationalState || 'Rapor Yüklendi') : 'Veri Yüklenmesi Bekleniyor' }}</span>
          </div>
          <div class="status-pill blue">
            <app-icon name="database" [size]="13" color="#0284c7"></app-icon>
            <span>SID: {{ basisService.systemInfo()?.sid || '—' }} ({{ basisService.hasUploadedData() ? 'Yüklenen Rapor' : 'Tanımsız' }})</span>
          </div>
          <div class="status-pill" [ngClass]="basisService.hasUploadedData() ? 'blue' : 'amber'">
            <app-icon name="alert" [size]="13" [color]="basisService.hasUploadedData() ? '#0284c7' : '#d97706'"></app-icon>
            <span>{{ basisService.hasUploadedData() ? 'Boyutlandırma Aktif' : '0 Veri' }}</span>
          </div>
        </div>
      </div>

      <!-- MANUEL DÜZENLEME ARAÇ ÇUBUĞU -->
      @if (basisService.hasUploadedData()) {
        <div class="edit-toolbar" [class.active]="editMode()">
          <span class="et-info">
            <app-icon [name]="editMode() ? 'edit' : 'info'" [size]="14" [color]="editMode() ? '#d97706' : '#64748b'"></app-icon>
            @if (editMode()) {
              Düzenleme modu: sarı kutulardaki değerleri değiştirip kaydedin. Boş bırakılan alanlar Excel verisine döner.
            } @else if (isCustomized()) {
              Bu müşteri için manuel girilmiş değerler gösteriliyor.
            } @else {
              Tüm değerler yüklenen Excel'den geliyor. Excel'de olmayan alanlar "—" olarak gösterilir.
            }
          </span>
          <div class="et-actions">
            @if (!editMode()) {
              <button type="button" class="btn-rec btn-rec-edit" (click)="startEdit()">
                <app-icon name="edit" [size]="14" color="#0284c7"></app-icon>
                <span>Değerleri Düzenle</span>
              </button>
              @if (isCustomized()) {
                <button type="button" class="btn-rec btn-rec-reset" (click)="resetOverrides()" title="Manuel girişleri sil, Excel verisine dön">
                  <app-icon name="refresh" [size]="14" color="#64748b"></app-icon>
                  <span>Excel Verisine Dön</span>
                </button>
              }
            } @else {
              <button type="button" class="btn-rec btn-rec-cancel" (click)="cancelEdit()">
                <app-icon name="x" [size]="14" color="#475569"></app-icon>
                <span>İptal</span>
              </button>
              <button type="button" class="btn-rec btn-rec-save" (click)="saveEdit()">
                <app-icon name="check" [size]="14" color="#ffffff"></app-icon>
                <span>Değişiklikleri Kaydet</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- EMPTY STATE WHEN NO EXCEL HAS BEEN UPLOADED -->
      <div class="empty-upload-card" *ngIf="!basisService.hasUploadedData()">
        <div class="empty-icon-wrap" style="background: #f1f5f9;">
          <app-icon name="database" [size]="32" color="#64748b"></app-icon>
        </div>
        <h3 style="color: #334155;">Veri Yok</h3>
        <p style="color: #64748b;">S/4HANA boyutlandırma matrisi ve donanım analizi için henüz veri bulunmamaktadır.</p>
      </div>

      <!-- MAIN SIZING & COCKPIT CONTENT (Only rendered when an Excel is uploaded!) -->
      <ng-container *ngIf="basisService.hasUploadedData()">

      <!-- MÜŞTERİ ALTYAPI ÖZETİ (CUSTOMER SUMMARY) KPI KARTLARI -->
      <div class="kpi-grid">
        <div class="kpi-card" routerLink="/architecture-map" [queryParams]="{ mode: 'asis' }">
          <div class="kpi-top">
            <span class="kpi-title">Mevcut Sunucu Envanteri</span>
            <div class="kpi-icon-box bg-blue"><app-icon name="database" [size]="18" color="#0284c7"></app-icon></div>
          </div>
          @if (editMode()) {
            <div class="edit-stack" (click)="$event.stopPropagation()">
              <label>Sunucu Sayısı
                <input type="number" min="0" class="inline-edit" [ngModel]="ov().serverCount" (ngModelChange)="setNum('serverCount', $event)" [placeholder]="autoServerCount() ?? '—'">
              </label>
              <label>Hedef
                <input type="text" class="inline-edit" [ngModel]="ov().targetConsolidation" (ngModelChange)="setOv('targetConsolidation', $event)" placeholder="örn. 1 Konsolide Private Cloud DB">
              </label>
              <label>Konsolidasyon Etiketi
                <input type="text" class="inline-edit" [ngModel]="ov().consolidationPill" (ngModelChange)="setOv('consolidationPill', $event)" placeholder="örn. %91 Konsolidasyon">
              </label>
            </div>
          } @else {
            <div class="kpi-val">{{ serverInventoryVal() }}</div>
            <div class="kpi-sub">Hedef: {{ ov().targetConsolidation || '—' }}</div>
            <div class="kpi-tag-row">
              <span class="tag-pill red" *ngIf="serverInventoryVal() !== '—'">{{ serverInventoryVal() }} On-Prem</span>
              <span class="tag-pill green" *ngIf="ov().consolidationPill">{{ ov().consolidationPill }}</span>
              <span class="tag-pill gray" *ngIf="serverInventoryVal() === '—'">Mimari Çizim Bekleniyor</span>
            </div>
          }
        </div>

        <div class="kpi-card" routerLink="/analytics">
          <div class="kpi-top">
            <span class="kpi-title">FUE Lisans İhtiyacı</span>
            <div class="kpi-icon-box bg-emerald"><app-icon name="users" [size]="18" color="#059669"></app-icon></div>
          </div>
          <div class="kpi-val text-emerald">{{ fueDisplayValue() }}</div>
          <div class="kpi-sub">{{ fueUserSubtitle() }}</div>
          <div class="kpi-tag-row">
            <span class="tag-pill green" *ngIf="basisService.fueSummary()">Net Formül: HB+HC/5+HD/30</span>
            <span class="tag-pill blue" *ngIf="basisService.fueSummary()">Optimum Paket</span>
            <span class="tag-pill gray" *ngIf="!basisService.fueSummary()">Veri Bekleniyor</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-title">HANA DB Sizing</span>
            <div class="kpi-icon-box bg-cyan"><app-icon name="database" [size]="18" color="#0891b2"></app-icon></div>
          </div>
          <div class="kpi-val">{{ sizingDisplayValue() }}</div>
          <div class="kpi-sub">{{ sizingSubtitle() }}</div>
          <div class="kpi-tag-row">
            <span class="tag-pill blue" *ngIf="basisService.memoryDetails()">Sizing Raporu</span>
            <span class="tag-pill gray" *ngIf="!basisService.memoryDetails()">Veri Bekleniyor</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/largest-tables">
          <div class="kpi-top">
            <span class="kpi-title">En Büyük Tablolar (DVM)</span>
            <div class="kpi-icon-box bg-amber"><app-icon name="layers" [size]="18" color="#d97706"></app-icon></div>
          </div>
          <div class="kpi-val text-amber">{{ tablesDisplayValue() }}</div>
          <div class="kpi-sub">{{ tablesSubtitle() }}</div>
          <div class="kpi-tag-row">
            <span class="tag-pill amber" *ngIf="basisService.largestTables().length > 0">DVM Analizi</span>
            <span class="tag-pill gray" *ngIf="basisService.largestTables().length > 0">Housekeeping</span>
            <span class="tag-pill gray" *ngIf="basisService.largestTables().length === 0">Veri Bekleniyor</span>
          </div>
        </div>
      </div>

      <!-- 2. GÖRSEL 3: PRODUCT / CURRENT ➔ TARGET SIZING MATRİSİ -->
      <div class="card-box highlight-card">
        <div class="card-header">
          <div class="c-title-group">
            <div class="icon-circle bg-blue">
              <app-icon name="layers" [size]="16" color="#0284c7"></app-icon>
            </div>
            <div>
              <h3>S/4HANA Boyutlandırma & Hedef Bulut Kapasite Matrisi</h3>
              <span class="c-sub">Mevcut on-premise HANA ve uygulama sunucularının RISE with SAP hedef mimarisine eşlenmesi</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-growth" (click)="showGrowthModal.set(true)" [disabled]="!growth()"
                    [title]="growth() ? 'Son yıl aylık büyüme ve RISE sonrası yıllık RAM ihtiyacı' : 'Yüklenen Excel dosyasında Aylık Büyüme sayfası bulunamadı'">
              <app-icon name="chart" [size]="13" [color]="growth() ? '#ffffff' : '#94a3b8'"></app-icon>
              <span>Aylık Büyüme</span>
            </button>
            <span class="badge-target-spec">RISE Sizing Spec</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="saas-table sizing-matrix-table">
            <thead>
              <tr>
                <th class="col-product">Bileşen / Ürün (Product)</th>
                <th class="col-current text-center">Mevcut Kapasite (Current)</th>
                <th class="col-target text-center">Hedef Bulut Mimarisi (Target)</th>
                <th class="col-5y text-center">5. Yıl Sonu İhtiyaç</th>
                <th>Avantaj & Açıklama</th>
              </tr>
            </thead>
            <tbody>
              @for (row of sizingMatrix(); track row.product) {
                <tr [class.db-row]="row.isDb">
                  <td class="product-cell">
                    <span class="p-dot" [class.db]="row.isDb" [class.app]="!row.isDb"></span>
                    <strong>{{ row.product }}</strong>
                  </td>
                  @if (editMode()) {
                    <td class="text-center">
                      <input type="text" class="inline-edit sm" [ngModel]="rowOv(row.product).current ?? row.current" (ngModelChange)="setRow(row.product, 'current', $event)">
                    </td>
                    <td class="text-center">
                      <input type="text" class="inline-edit sm" [ngModel]="rowOv(row.product).target ?? row.target" (ngModelChange)="setRow(row.product, 'target', $event)">
                    </td>
                    <td class="text-center">
                      <input type="text" class="inline-edit sm" [ngModel]="rowOv(row.product).fiveYear" (ngModelChange)="setRow(row.product, 'fiveYear', $event)"
                             [placeholder]="autoFiveYearNeed(row) ? (autoFiveYearNeed(row) + ' GB') : '—'">
                    </td>
                    <td>
                      <input type="text" class="inline-edit" [ngModel]="rowOv(row.product).description ?? row.description" (ngModelChange)="setRow(row.product, 'description', $event)">
                    </td>
                  } @else {
                    <td class="text-center">
                      <span class="spec-badge cur">{{ row.current }}</span>
                    </td>
                    <td class="text-center">
                      <span class="spec-badge target">{{ row.target }}</span>
                    </td>
                    <td class="text-center">
                      @if (fiveYearNeed(row); as need) {
                        <span class="spec-badge future" [title]="'5. yıl sonu RAM ihtiyacı (≈ ' + formatTB(need) + ')'">{{ need | number:'1.0-0' }} GB</span>
                      } @else {
                        <span class="text-muted" title="Büyüme projeksiyonu yalnızca Prod (ve Prod kopyası) sistemler için hesaplanır. Düzenle ile manuel girilebilir.">—</span>
                      }
                    </td>
                    <td class="text-muted">{{ row.description || '—' }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="matrix-footer-summary">
          <div class="summary-item">
            <span class="s-label">Toplam Mevcut HANA RAM:</span>
            <strong class="s-val text-blue">{{ totalDbRam() }}</strong>
          </div>
          <div class="summary-item">
            <span class="s-label">Toplam Uygulama RAM:</span>
            <strong class="s-val text-blue">{{ totalAppRam() }}</strong>
          </div>
          <div class="summary-item">
            <span class="s-label">Hedef Konsolidasyon:</span>
            <strong class="s-val text-emerald">{{ ov().targetConsolidation || '—' }}</strong>
          </div>
        </div>
      </div>

      <!-- 3. DANIŞMAN ALTYAPI & BOYUTLANDIRMA ÖNERİLERİ -->
      <div class="card-box recommendations-card">
        <div class="card-header">
          <div class="c-title-group">
            <div class="icon-circle bg-amber">
              <app-icon name="sparkles" [size]="16" color="#d97706"></app-icon>
            </div>
            <div>
              <h3>Danışman Altyapı & Boyutlandırma Önerileri</h3>
              <span class="c-sub">Yüklenen /SDF/HDB_SIZING verisi ve aşağıdaki optimizasyon oranlarına göre hesaplanan öneriler</span>
            </div>
          </div>
          <span class="badge-recom-count">4 Teknik Tavsiye</span>
        </div>

        @if (editMode()) {
          <div class="assumption-edit">
            <label>RAM optimizasyon oranı (%)
              <input type="number" min="0" max="100" class="inline-edit sm" [ngModel]="ov().memOptimizationPct" (ngModelChange)="setNum('memOptimizationPct', $event)" [placeholder]="defaults.memOptimizationPct">
            </label>
            <label>Disk arşivleme tasarrufu (%)
              <input type="number" min="0" max="100" class="inline-edit sm" [ngModel]="ov().diskArchivingPct" (ngModelChange)="setNum('diskArchivingPct', $event)" [placeholder]="defaults.diskArchivingPct">
            </label>
            <label>Log & Cache oranı (%)
              <input type="number" min="0" max="100" class="inline-edit sm" [ngModel]="ov().logCachePct" (ngModelChange)="setNum('logCachePct', $event)" [placeholder]="defaults.logCachePct">
            </label>
            <label>SAPS seviyesi
              <input type="text" class="inline-edit sm" [ngModel]="ov().saps" (ngModelChange)="setOv('saps', $event)" placeholder="örn. XS">
            </label>
          </div>
        }

        <div class="recommendations-grid">

          <!-- Öneri 1: RAM & Sizing Optimizasyonu -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-blue-light text-blue">RAM & Boyutlandırma</span>
              <span class="recom-impact text-amber">%{{ memOptPct() }} Optimizasyon</span>
            </div>
            <h4 class="recom-title">{{ anticipatedMemory() | number:'1.0-0' }} GiB Başlangıç RAM İhtiyacı</h4>
            <p class="recom-text">
              Sizing raporuna göre başlangıç bellek ihtiyacı <strong>{{ anticipatedMemory() | number:'1.0-1' }} GiB</strong> seviyesindedir. DVM ve veri arşivleme aksiyonları ile bellek hacmi <strong>{{ optimizedMemory() | number:'1.0-0' }} GiB</strong> seviyesine çekilebilir.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Optimum bulut paketi sınırlarında kalma, ek RAM maliyetinden kaçınma</span>
            </div>
          </div>

          <!-- Öneri 2: Disk Alanı & Arşivleme Tasarrufu -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-emerald-light text-emerald">Disk & Arşivleme</span>
              <span class="recom-impact text-emerald">%{{ diskArchPct() }} Tasarruf</span>
            </div>
            <h4 class="recom-title">{{ netDisk() - optimizedDisk() | number:'1.0-0' }} GiB Disk Alanı Optimizasyonu</h4>
            <p class="recom-text">
              Sizing raporundaki net veri hacmi <strong>{{ netDisk() | number:'1.0-1' }} GiB</strong> ölçülmüştür. Geçiş öncesi teknik log tabloları temizlenerek ve arşivleme uygulanarak veri hacmi <strong>{{ optimizedDisk() | number:'1.0-0' }} GiB</strong> seviyesine düşürülebilir.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Geçiş (Downtime) süresinde hızlanma ve disk depolama maliyeti düşüşü</span>
            </div>
          </div>

          <!-- Öneri 3: CPU & SAPS Kapasitesi -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-purple-light text-purple">İşlemci & SAPS</span>
              <span class="recom-impact text-blue">SAPS: {{ ov().saps || '—' }}</span>
            </div>
            <h4 class="recom-title">{{ ov().saps ? 'SAPS "' + ov().saps + '" Seviyesi' : 'SAPS Seviyesi Girilmedi' }}</h4>
            <p class="recom-text">
              Analiz edilen sistemde (SID: <strong>{{ basisService.systemInfo()?.sid || '—' }}</strong>) toplam <strong>{{ basisService.systemInfo()?.tablesAnalyzed | number }}</strong> tablo analiz edilmiştir.
              @if (ov().saps) {
                SAPS gereksinimi <strong>{{ ov().saps }}</strong> olarak belirlenmiştir.
              } @else {
                SAPS seviyesi henüz girilmedi; "Değerleri Düzenle" ile ekleyebilirsiniz.
              }
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Optimum bulut bütçesi, gereksiz compute kapasitesi maliyetinden kaçınma</span>
            </div>
          </div>

          <!-- Öneri 4: Bulut Konsolidasyonu -->
          <div class="recom-item">
            <div class="recom-top">
              <span class="recom-category bg-amber-light text-amber">Bulut Konsolidasyonu</span>
              <span class="recom-impact text-emerald">{{ sizingMatrix().length }} Bileşen</span>
            </div>
            <h4 class="recom-title">{{ sizingMatrix().length }} Bileşenden Konsolide Bulut Mimarisine</h4>
            <p class="recom-text">
              Raporlanan <strong>{{ sizingMatrix().length }} adet bileşen ve veritabanı</strong>, RISE with SAP kapsamında konsolide edilerek tek bir merkezi mimaride yönetilebilir. Eski ve bakım süresi dolan bileşenler tasfiye edilmelidir.
            </p>
            <div class="recom-benefit">
              <app-icon name="check" [size]="13" color="#059669"></app-icon>
              <span>Fayda: Konsolide altyapı yönetimi ve %100 SAP bulut SLA güvencesi</span>
            </div>
          </div>

        </div>
      </div>

      <!-- 4. TWO-COLUMN LAYOUT: (GÖRSEL 1: HANA COCKPIT CANLI DURUMU) & (GÖRSEL 2: /SDF/HDB_SIZING SİSTEM RAPORU) -->
      <div class="two-col-grid">

        <!-- GÖRSEL 1: SAP HANA DATABASE & HOST COCKPIT -->
        <div class="card-box">
          <div class="card-header">
            <div class="c-title-group">
              <div class="icon-circle bg-emerald">
                <app-icon name="database" [size]="16" color="#059669"></app-icon>
              </div>
              <div>
                <h3>SAP HANA Database & Host Cockpit</h3>
                <span class="c-sub">SID: {{ basisService.systemInfo()?.sid || '—' }} • Veritabanı ve Donanım Metrikleri</span>
              </div>
            </div>
            <span class="source-tag">HANA Cockpit</span>
          </div>

          <!-- System General Meta Grid -->
          <div class="hana-general-meta">
            <div class="meta-row">
              <span class="m-lbl">Operational State:</span>
              @if (editMode()) {
                <input type="text" class="inline-edit sm wide" [ngModel]="ov().operationalState" (ngModelChange)="setOv('operationalState', $event)" placeholder="örn. All services are started">
              } @else {
                <strong class="m-val text-green">{{ ov().operationalState || '—' }}</strong>
              }
            </div>
            <div class="meta-row">
              <span class="m-lbl">System Usage / ID:</span>
              <strong class="m-val">Analiz Edilen Sistem (SID = {{ basisService.systemInfo()?.sid || '—' }})</strong>
            </div>
            <div class="meta-row">
              <span class="m-lbl">HANA / DB Sürümü:</span>
              <strong class="m-val">{{ basisService.systemInfo()?.dbType || '—' }} ({{ basisService.systemInfo()?.dbVersion || '—' }})</strong>
            </div>
            <div class="meta-row">
              <span class="m-lbl">Platform / OS:</span>
              <strong class="m-val">{{ basisService.systemInfo()?.operatingSystem || '—' }}</strong>
            </div>
          </div>

          <!-- Progress Bars & Usage Metrics -->
          <div class="usage-gauges-list">
            <h4 class="section-sub-title">Database Memory & CPU Usage</h4>

            <!-- Memory Used -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Column + Row Store / Total Memory</span>
                <strong class="g-val">{{ columnRowMemory() | number:'1.1-1' }} GiB / {{ anticipatedMemory() | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar amber" [style.width.%]="pctOf(columnRowMemory(), anticipatedMemory())"></div>
              </div>
            </div>

            <!-- CPU Usage -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">CPU Status ({{ ov().cpuCount ?? '—' }} Available CPUs)</span>
                @if (editMode()) {
                  <span class="g-edit">
                    <input type="number" min="0" class="inline-edit xs" [ngModel]="ov().cpuCount" (ngModelChange)="setNum('cpuCount', $event)" placeholder="CPU">
                    <input type="number" min="0" max="100" class="inline-edit xs" [ngModel]="ov().cpuUsagePct" (ngModelChange)="setNum('cpuUsagePct', $event)" placeholder="Kullanım %">
                  </span>
                } @else {
                  <strong class="g-val">{{ ov().cpuCount ?? '—' }} CPUs
                    @if (ov().cpuUsagePct != null) { <span class="pct">(%{{ ov().cpuUsagePct }} Kullanım)</span> }
                  </strong>
                }
              </div>
              <div class="progress-track">
                <div class="progress-bar blue" [style.width.%]="ov().cpuUsagePct ?? 0"></div>
              </div>
            </div>

            <h4 class="section-sub-title mt-3">Database Disk Usage (SID: {{ basisService.systemInfo()?.sid || '—' }})</h4>

            <!-- Data Volume Size -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Net Data Volume / Mevcut Disk (GiB)</span>
                <strong class="g-val">{{ netDisk() | number:'1.1-1' }} / {{ basisService.systemInfo()?.diskSizeGiB | number:'1.0-0' }} GiB</strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar blue" [style.width.%]="pctOf(netDisk(), basisService.systemInfo()?.diskSizeGiB || 0)"></div>
              </div>
            </div>

            <!-- Log Volume Size -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Tahmini Log & Cache Hacmi (%{{ logPct() }})</span>
                <strong class="g-val">{{ netDisk() * logPct() / 100 | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="progress-track">
                <div class="progress-bar teal" [style.width.%]="logPct()"></div>
              </div>
            </div>

            <!-- Trace Files -->
            <div class="gauge-item">
              <div class="gauge-header">
                <span class="g-title">Trace & Log Files</span>
                @if (editMode()) {
                  <input type="number" min="0" step="0.1" class="inline-edit xs" [ngModel]="ov().traceGB" (ngModelChange)="setNum('traceGB', $event)" placeholder="GB">
                } @else {
                  <strong class="g-val">{{ ov().traceGB != null ? (ov().traceGB | number:'1.2-2') + ' GB' : '—' }}</strong>
                }
              </div>
              <div class="progress-track">
                <div class="progress-bar green" [style.width.%]="pctOf(ov().traceGB || 0, netDisk())"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- GÖRSEL 2: /SDF/HDB_SIZING RAPORU DETAYLARI -->
        <div class="card-box">
          <div class="card-header">
            <div class="c-title-group">
              <div class="icon-circle bg-purple">
                <app-icon name="cpu" [size]="16" color="#7e22ce"></app-icon>
              </div>
              <div>
                <h3>/SDF/HDB_SIZING Sizing Raporu (GiB)</h3>
                <span class="c-sub">S/4HANA Geçişi İçin Öngörülen Maksimum Bellek ve Disk Gereksinimleri</span>
              </div>
            </div>
            <span class="source-tag">Rapor Sürümü: {{ basisService.systemInfo()?.version || '—' }}</span>
          </div>

          <!-- Key Sizing Numbers Highlight Grid -->
          <div class="sizing-kpi-grid">
            <div class="s-kpi-card">
              <span class="sk-lbl">Initial Memory Requirement</span>
              <strong class="sk-val text-blue">{{ anticipatedMemory() | number:'1.1-1' }} GiB</strong>
              <span class="sk-sub">Maksimum Başlangıç RAM</span>
            </div>

            <div class="s-kpi-card">
              <span class="sk-lbl">Memory After Optimization</span>
              <strong class="sk-val text-emerald">{{ optimizedMemory() | number:'1.1-1' }} GiB</strong>
              <span class="sk-sub">%{{ memOptPct() }} Optimizasyon Sonrası RAM</span>
            </div>

            <div class="s-kpi-card">
              <span class="sk-lbl">Net Data Volume (Disk)</span>
              <strong class="sk-val text-purple">{{ netDisk() | number:'1.1-1' }} GiB</strong>
              <span class="sk-sub">Disk Net Veri Hacmi</span>
            </div>

            <div class="s-kpi-card">
              <span class="sk-lbl">Disk After Optimization</span>
              <strong class="sk-val text-teal">{{ optimizedDisk() | number:'1.1-1' }} GiB</strong>
              <span class="sk-sub">%{{ diskArchPct() }} Arşivleme Tasarrufu</span>
            </div>
          </div>

          <!-- Memory Sizing Calculation Tree Table -->
          <div class="sizing-calc-tree">
            <h4 class="section-sub-title">Memory Sizing Calculation Details (HANA Size in GiB)</h4>

            <div class="calc-tree-list">
              <div class="tree-row">
                <span class="t-name">Column loadable data</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.columnLoadable | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Row Store data</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.rowStore | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row subtotal">
                <span class="t-name">= Memory requirement for initial loadable data</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.initialLoadable | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Hybrid LOB cache (10% of size on disk)</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.hybridLobCache | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Work space (100% Column + 50% Row Store)</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.workSpace | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row">
                <span class="t-name">+ Fixed size for code, stack and other services</span>
                <strong class="t-val">{{ basisService.memoryDetails()?.fixedSize | number:'1.1-1' }} GiB</strong>
              </div>
              <div class="tree-row grand-total">
                <span class="t-name"><strong>= Anticipated initial memory requirement</strong></span>
                <strong class="t-val text-blue font-bold">{{ anticipatedMemory() | number:'1.1-1' }} GiB</strong>
              </div>
            </div>
          </div>

          <!-- Technical Metadata Footer -->
          <div class="report-meta-footer">
            <span>SAPS: <strong>{{ ov().saps || '—' }}</strong></span>
            <span>Analiz Edilen Tablo: <strong>{{ basisService.systemInfo()?.tablesAnalyzed | number }}</strong> (Hata: {{ basisService.systemInfo()?.tablesWithError }})</span>
            <span>Kernel: <strong>{{ basisService.systemInfo()?.kernelVersion || '—' }} ({{ basisService.systemInfo()?.nwRelease || '—' }})</strong></span>
          </div>
        </div>

      </div>

      <!-- AYLIK BÜYÜME POP-UP -->
      @if (showGrowthModal() && growth(); as g) {
        <div class="growth-backdrop" (click)="showGrowthModal.set(false)">
          <div class="growth-modal" (click)="$event.stopPropagation()">
            <div class="gm-header">
              <div class="c-title-group">
                <div class="icon-circle bg-blue">
                  <app-icon name="chart" [size]="16" color="#0284c7"></app-icon>
                </div>
                <div>
                  <h3>Aylık Büyüme & RISE Sonrası RAM İhtiyacı</h3>
                  <span class="c-sub">SID: {{ basisService.systemInfo()?.sid || '—' }} • Son yıl HANA bellek / disk büyümesi ve 5 yıllık projeksiyon</span>
                </div>
              </div>
              <button class="gm-close" (click)="showGrowthModal.set(false)" title="Kapat">
                <app-icon name="x" [size]="16" color="#64748b"></app-icon>
              </button>
            </div>

            <div class="gm-body">
              <div class="gm-kpis">
                <div class="gm-kpi">
                  <span class="lbl">Aylık Ortalama Büyüme</span>
                  <strong class="text-blue">{{ g.avgMonthlyGrowthGB | number:'1.0-0' }} GB</strong>
                </div>
                <div class="gm-kpi">
                  <span class="lbl">Yıllık Büyüme</span>
                  <strong class="text-blue">{{ g.yearlyGrowthGB | number:'1.0-0' }} GB</strong>
                </div>
                <div class="gm-kpi">
                  <span class="lbl">Yıllık Büyüme (Yuvarlanmış)</span>
                  <strong class="text-emerald">{{ g.roundedYearlyGrowthGB | number:'1.0-0' }} GB</strong>
                </div>
                <div class="gm-kpi highlight">
                  <span class="lbl">5. Yıl Sonu RAM İhtiyacı</span>
                  <strong class="text-amber">{{ formatTB(projections()[4]?.requiredGB || 0) }}</strong>
                </div>
              </div>

              <div class="gm-grid">
                <div class="gm-section">
                  <h4 class="section-sub-title">Son Yıl Aylık Büyüme (GB)</h4>
                  <table class="saas-table">
                    <thead>
                      <tr>
                        <th>Dönem</th>
                        <th class="text-right">Memory</th>
                        <th class="text-right">Δ Aylık</th>
                        <th class="text-right">Disk Data</th>
                        <th class="text-right">Disk Log</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (r of g.records; track r.year + '-' + r.month; let i = $index) {
                        <tr>
                          <td><strong>{{ monthName(r.month) }} {{ r.year }}</strong></td>
                          <td class="text-right mono">{{ r.memoryGB | number:'1.0-2' }}</td>
                          <td class="text-right mono">
                            @if (i > 0) {
                              <span [class.pos]="r.memoryGB - g.records[i - 1].memoryGB >= 0"
                                    [class.neg]="r.memoryGB - g.records[i - 1].memoryGB < 0">
                                {{ r.memoryGB - g.records[i - 1].memoryGB >= 0 ? '+' : '' }}{{ r.memoryGB - g.records[i - 1].memoryGB | number:'1.0-1' }}
                              </span>
                            } @else {
                              <span class="text-muted">—</span>
                            }
                          </td>
                          <td class="text-right mono">{{ r.diskDataGB | number:'1.0-2' }}</td>
                          <td class="text-right mono">{{ r.diskLogGB | number:'1.0-2' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <div class="gm-section">
                  <h4 class="section-sub-title">RISE Geçiş Sonrası Yıllık RAM İhtiyacı</h4>
                  <table class="saas-table">
                    <thead>
                      <tr>
                        <th>Yıl</th>
                        <th class="text-right">RAM İhtiyacı</th>
                        <th class="text-right">TB</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="base-row">
                        <td><strong>Geçiş (Hedef Prod)</strong></td>
                        <td class="text-right mono">{{ prodTargetGB() | number:'1.0-0' }} GB</td>
                        <td class="text-right mono">{{ formatTB(prodTargetGB()) }}</td>
                      </tr>
                      @for (p of projections(); track p.year) {
                        <tr [class.final-row]="p.year === 5">
                          <td><strong>{{ p.year }}. Yılın Sonunda</strong></td>
                          <td class="text-right mono">{{ p.requiredGB | number:'1.0-0' }} GB</td>
                          <td class="text-right mono">{{ formatTB(p.requiredGB) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                  <p class="gm-note">
                    Hedef Prod HANA boyutuna her yıl yuvarlanmış yıllık büyüme
                    (<strong>{{ g.roundedYearlyGrowthGB | number:'1.0-0' }} GB</strong>) eklenerek hesaplanır.
                    Excel'deki "Aylık Büyüme" sayfasında yıl sonu değerleri girilmişse bu değerler kullanılır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      </ng-container>

    </div>
  `,
  styles: [`
    .source-page {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
    }

    /* 1. TOP HEADER */
    .page-top-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;

      .title-area {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;

        .customer-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: #0284c7;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          width: fit-content;
        }

        .page-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
        }
      }

      .cockpit-status-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;

        .status-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.65rem;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;

          &.green {
            background: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;

            .pulse-dot {
              width: 6px;
              height: 6px;
              background: #10b981;
              border-radius: 50%;
              box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
            }
          }

          &.blue {
            background: #f0f9ff;
            color: #0284c7;
            border: 1px solid #bae6fd;
          }

          &.amber {
            background: #fffbeb;
            color: #d97706;
            border: 1px solid #fde68a;
          }
        }
      }
    }

    /* 2. CARD BOX */
    .card-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      &.highlight-card {
        border-color: #cbd5e1;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .c-title-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;

          .icon-circle {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;

            &.bg-blue { background: #f0f9ff; border: 1px solid #bae6fd; }
            &.bg-emerald { background: #ecfdf5; border: 1px solid #a7f3d0; }
            &.bg-purple { background: #fdf4ff; border: 1px solid #f5d0fe; }
          }

          h3 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 800;
            color: #0f172a;
          }

          .c-sub {
            font-size: 0.72rem;
            color: #64748b;
          }
        }

        .badge-target-spec {
          font-size: 0.68rem;
          font-weight: 800;
          color: #0284c7;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 0.18rem 0.55rem;
          border-radius: 4px;
        }

        .source-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-growth {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 800;
          color: #ffffff;
          background: #0284c7;
          border: 1px solid #0284c7;
          padding: 0.3rem 0.7rem;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.15s;

          &:hover:not(:disabled) { background: #0369a1; }

          &:disabled {
            background: #f1f5f9;
            border-color: #e2e8f0;
            color: #94a3b8;
            cursor: not-allowed;
          }
        }
      }
    }

    /* MANUEL DÜZENLEME */
    .edit-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.55rem 0.85rem;

      &.active {
        background: #fffbeb;
        border-color: #fde68a;
      }

      .et-info {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.74rem;
        color: #475569;
      }

      .et-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .btn-rec {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.8rem;
      border-radius: 7px;
      font-size: 0.74rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      &.btn-rec-edit {
        background: #eff6ff;
        color: #0284c7;
        border: 1px solid #bae6fd;
        &:hover { background: #e0f2fe; border-color: #7dd3fc; }
      }

      &.btn-rec-reset {
        background: #f8fafc;
        color: #64748b;
        border: 1px solid #cbd5e1;
        &:hover { background: #f1f5f9; color: #334155; }
      }

      &.btn-rec-cancel {
        background: #ffffff;
        color: #475569;
        border: 1px solid #cbd5e1;
        &:hover { background: #f8fafc; }
      }

      &.btn-rec-save {
        background: #16a34a;
        color: #ffffff;
        border: 1px solid #16a34a;
        box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
        &:hover { background: #15803d; }
      }
    }

    .inline-edit {
      width: 100%;
      box-sizing: border-box;
      font: inherit;
      font-size: 0.76rem;
      font-weight: 600;
      color: #0f172a;
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 5px;
      padding: 0.25rem 0.45rem;

      &:focus {
        outline: none;
        border-color: #d97706;
        box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.15);
      }

      &::placeholder { color: #a8a29e; font-weight: 500; }
      &.sm { max-width: 140px; text-align: center; }
      &.xs { width: 84px; }
      &.wide { max-width: 240px; text-align: left; }
    }

    .edit-stack {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      cursor: default;

      label {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        font-size: 0.66rem;
        font-weight: 700;
        color: #64748b;
      }
    }

    .assumption-edit {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      background: #fffbeb;
      border: 1px dashed #fcd34d;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;

      label {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.68rem;
        font-weight: 700;
        color: #92400e;
      }
    }

    .g-edit {
      display: flex;
      gap: 0.35rem;
    }

    /* AYLIK BÜYÜME MODAL */
    .growth-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.5rem;
    }

    .growth-modal {
      background: #ffffff;
      border-radius: 12px;
      width: min(1100px, 100%);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
      overflow: hidden;

      .gm-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #e2e8f0;

        .c-title-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;

          .icon-circle {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            &.bg-blue { background: #f0f9ff; border: 1px solid #bae6fd; }
          }

          h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #0f172a; }
          .c-sub { font-size: 0.72rem; color: #64748b; }
        }

        .gm-close {
          background: none;
          border: 1px solid transparent;
          border-radius: 6px;
          padding: 0.3rem;
          cursor: pointer;
          display: flex;
          &:hover { background: #f1f5f9; border-color: #e2e8f0; }
        }
      }

      .gm-body {
        padding: 1.25rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .gm-kpis {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.65rem;

        .gm-kpi {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.65rem 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;

          &.highlight { background: #fffbeb; border-color: #fde68a; }

          .lbl { font-size: 0.68rem; color: #64748b; font-weight: 600; }
          strong { font-size: 1.15rem; font-weight: 900; }
        }
      }

      .gm-grid {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 1.25rem;
        align-items: start;
      }

      .gm-section {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.75rem;
      }

      .saas-table {
        th.text-right, td.text-right { text-align: right; }
        td.mono { font-family: monospace; font-weight: 700; color: #0f172a; }
        .pos { color: #059669; }
        .neg { color: #dc2626; }
        .text-muted { color: #94a3b8; }
        tr.base-row { background: #f0f9ff; }
        tr.final-row { background: #fffbeb; td { color: #b45309; } }
      }

      .gm-note {
        margin: 0.65rem 0 0;
        font-size: 0.7rem;
        line-height: 1.45;
        color: #64748b;
      }

      .text-blue { color: #0284c7; }
      .text-emerald { color: #059669; }
      .text-amber { color: #d97706; }
    }

    /* 3. TABLE STYLES */
    .table-responsive {
      overflow-x: auto;
    }

    .saas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;

      thead th {
        background: #f8fafc;
        color: #334155;
        font-weight: 800;
        padding: 0.6rem 0.85rem;
        text-align: left;
        border-bottom: 2px solid #e2e8f0;

        &.text-center { text-align: center; }
      }

      tbody tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.1s;

        &:hover { background: #f8fafc; }

        td {
          padding: 0.55rem 0.85rem;
          vertical-align: middle;

          &.text-center { text-align: center; }
          &.text-muted { color: #64748b; font-size: 0.74rem; }
        }

        &.db-row {
          background: #fafcff;
        }
      }
    }

    .sizing-matrix-table {
      .product-cell {
        display: flex;
        align-items: center;
        gap: 0.45rem;

        .p-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          &.db { background: #0284c7; }
          &.app { background: #8b5cf6; }
        }

        strong {
          color: #0f172a;
          font-size: 0.82rem;
        }
      }

      .spec-badge {
        display: inline-block;
        padding: 0.15rem 0.55rem;
        border-radius: 4px;
        font-weight: 800;
        font-size: 0.75rem;

        &.cur {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }

        &.target {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        &.future {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
      }
    }

    .matrix-footer-summary {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;

      .summary-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;

        .s-label { color: #64748b; font-weight: 500; }
        .s-val { font-weight: 800; }
        .text-blue { color: #0284c7; }
        .text-emerald { color: #059669; }
      }
    }

    /* 4. RECOMMENDATIONS SECTION STYLING */
    .recommendations-card {
      border-color: #fde68a;
      background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);

      .badge-recom-count {
        font-size: 0.68rem;
        font-weight: 800;
        color: #b45309;
        background: #fef3c7;
        border: 1px solid #fde68a;
        padding: 0.18rem 0.55rem;
        border-radius: 4px;
      }
    }

    .recommendations-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .recom-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      transition: box-shadow 0.15s, border-color 0.15s;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
      }

      .recom-top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .recom-category {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.12rem 0.45rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;

          &.bg-blue-light { background: #f0f9ff; }
          &.bg-emerald-light { background: #ecfdf5; }
          &.bg-purple-light { background: #fdf4ff; }
          &.bg-amber-light { background: #fffbeb; }
        }

        .recom-impact {
          font-size: 0.68rem;
          font-weight: 800;
        }
      }

      .recom-title {
        margin: 0;
        font-size: 0.88rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.25;
      }

      .recom-text {
        margin: 0;
        font-size: 0.78rem;
        line-height: 1.45;
        color: #334155;

        strong {
          color: #0f172a;
        }
      }

      .recom-benefit {
        margin-top: 0.2rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.35rem 0.55rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.72rem;
        color: #047857;
        font-weight: 600;
      }
    }

    /* 4. TWO-COLUMN GRID */
    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    /* HANA COCKPIT METRICS */
    .hana-general-meta {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      .meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.74rem;

        .m-lbl { color: #64748b; font-weight: 500; }
        .m-val { color: #1e293b; font-weight: 700; }
        .text-green { color: #059669; }
      }
    }

    .section-sub-title {
      margin: 0.25rem 0 0.5rem;
      font-size: 0.78rem;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .mt-3 { margin-top: 0.85rem; }

    .usage-gauges-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;

      .gauge-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .gauge-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.74rem;

          .g-title { color: #475569; font-weight: 600; }
          .g-val { color: #0f172a; font-weight: 700; font-family: monospace; }
          .pct { color: #0284c7; font-weight: 800; font-family: sans-serif; }
        }

        .progress-track {
          height: 7px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;

          .progress-bar {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;

            &.blue { background: #0284c7; }
            &.amber { background: #d97706; }
            &.teal { background: #0d9488; }
            &.green { background: #10b981; }
          }
        }
      }
    }

    /* SIZING S/4HANA REPORT SECTION */
    .sizing-kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;

      .s-kpi-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.65rem 0.85rem;
        display: flex;
        flex-direction: column;

        .sk-lbl { font-size: 0.68rem; color: #64748b; font-weight: 600; }
        .sk-val { font-size: 1.15rem; font-weight: 900; margin: 0.1rem 0; }
        .sk-sub { font-size: 0.65rem; color: #94a3b8; }

        .text-blue { color: #0284c7; }
        .text-emerald { color: #059669; }
        .text-purple { color: #7e22ce; }
        .text-teal { color: #0d9488; }
      }
    }

    .sizing-calc-tree {
      display: flex;
      flex-direction: column;

      .calc-tree-list {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;

        .tree-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.45rem 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.74rem;

          .t-name { color: #334155; }
          .t-val { font-family: monospace; font-weight: 700; color: #0f172a; }

          &.subtotal {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 700;
          }

          &.grand-total {
            background: #f0f9ff;
            border-top: 2px solid #bae6fd;
            border-bottom: none;
            padding: 0.6rem 0.75rem;
            font-size: 0.78rem;
          }
        }
      }
    }

    .report-meta-footer {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.45rem 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.7rem;
      color: #64748b;

      strong { color: #1e293b; }
    }

    .uploaded-live-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      box-shadow: 0 1px 4px rgba(5, 150, 105, 0.08);

      .banner-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .live-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
          animation: pulse 2s infinite;
        }

        .banner-text {
          font-size: 0.78rem;
          color: #166534;
        }
      }

      .btn-banner-reset {
        background: #ffffff;
        border: 1px solid #86efac;
        color: #15803d;
        font-weight: 700;
        font-size: 0.72rem;
        padding: 0.3rem 0.65rem;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: #dcfce7;
        }
      }
    }

    /* KPI GRID (CUSTOMER SUMMARY DATA) */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
      margin-bottom: 0.5rem;

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.15rem;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        cursor: pointer;
        text-decoration: none;
        transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
          border-color: #0284c7;
        }

        &.highlight {
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
          border-color: #a7f3d0;
        }

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .kpi-title {
            font-size: 0.76rem;
            font-weight: 700;
            color: #64748b;
          }

          .kpi-icon-box {
            width: 34px;
            height: 34px;
            border-radius: 8px;
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

        .kpi-val {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }

        .kpi-sub {
          font-size: 0.72rem;
          color: #64748b;
        }

        .kpi-tag-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
          margin-top: 0.2rem;

          .tag-pill {
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.15rem 0.45rem;
            border-radius: 4px;

            &.blue { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
            &.green { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
            &.purple { background: #fdf4ff; color: #7e22ce; border: 1px solid #f0abfc; }
            &.amber { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
            &.red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
            &.gray { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
          }
        }
      }
    }
  `]
})
export class SourceSizingComponent {
  customerService = inject(CustomerService);
  basisService = inject(BasisSizingService);
  importService = inject(DataImportService);

  growth = this.basisService.monthlyGrowth;
  showGrowthModal = signal(false);

  // Optimization assumptions used when no manual value has been entered
  readonly defaults = { memOptimizationPct: 15, diskArchivingPct: 30, logCachePct: 25 };

  // ── Manual edit state (per customer, persisted in BasisSizingService) ──
  editMode = signal(false);
  private draft = signal<SizingPageOverrides>({});
  ov = computed<SizingPageOverrides>(() => this.editMode() ? this.draft() : this.basisService.sizingOverrides());
  isCustomized = computed(() => Object.keys(this.basisService.sizingOverrides()).length > 0);

  startEdit(): void {
    this.draft.set(JSON.parse(JSON.stringify(this.basisService.sizingOverrides())));
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
  }

  saveEdit(): void {
    this.basisService.setSizingOverrides(this.cleanOverrides(this.draft()));
    this.editMode.set(false);
  }

  resetOverrides(): void {
    this.basisService.setSizingOverrides({});
  }

  setOv(key: keyof SizingPageOverrides, value: any): void {
    this.draft.update(d => ({ ...d, [key]: value }));
  }

  setNum(key: keyof SizingPageOverrides, value: any): void {
    const num = value === '' || value === null || value === undefined ? null : Number(value);
    this.setOv(key, num === null || isNaN(num) ? null : num);
  }

  rowOv(product: string): SizingMatrixRowOverride {
    return this.ov().matrix?.[product] || {};
  }

  setRow(product: string, field: keyof SizingMatrixRowOverride, value: string): void {
    this.draft.update(d => ({
      ...d,
      matrix: { ...(d.matrix || {}), [product]: { ...(d.matrix?.[product] || {}), [field]: value } }
    }));
  }

  // Drops empty values and matrix entries equal to the Excel value, so cleared fields fall back to Excel
  private cleanOverrides(ov: SizingPageOverrides): SizingPageOverrides {
    const out: any = {};
    for (const [k, v] of Object.entries(ov)) {
      if (k === 'matrix' || v === null || v === undefined || (typeof v === 'string' && !v.trim())) continue;
      out[k] = typeof v === 'string' ? v.trim() : v;
    }
    const matrix: Record<string, SizingMatrixRowOverride> = {};
    for (const row of this.basisService.sizingMatrix()) {
      const r = ov.matrix?.[row.product];
      if (!r) continue;
      const cleaned: SizingMatrixRowOverride = {};
      for (const f of ['current', 'target', 'fiveYear', 'description'] as const) {
        const val = r[f]?.trim();
        if (val && val !== ((row as any)[f] ?? '')) cleaned[f] = val;
      }
      if (Object.keys(cleaned).length > 0) matrix[row.product] = cleaned;
    }
    if (Object.keys(matrix).length > 0) out.matrix = matrix;
    return out;
  }

  // ── Excel matrix merged with manual entries ──
  sizingMatrix = computed<SourceTargetMatrixItem[]>(() => {
    const overrides = this.basisService.sizingOverrides().matrix || {};
    return this.basisService.sizingMatrix().map(row => ({
      ...row,
      current: overrides[row.product]?.current || row.current,
      target: overrides[row.product]?.target || row.target,
      description: overrides[row.product]?.description || row.description
    }));
  });

  private readonly monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  prodTargetGB = computed(() => {
    const matrix = this.sizingMatrix();
    const prodRow = matrix.find(r => r.isDb && r.product.toLowerCase().includes('prod')) || matrix.find(r => r.isDb);
    return prodRow ? this.basisService.parseSizeGB(prodRow.target) : 0;
  });

  // Year-end values from Excel are kept; calculated ones follow the (possibly edited) Prod target
  projections = computed(() => {
    const g = this.growth();
    if (!g) return [];
    const base = this.prodTargetGB();
    return g.yearEndProjections.map(p => (p.fromExcel || !base) ? p : {
      ...p,
      requiredGB: this.basisService.projectYearEndGB(base, g.roundedYearlyGrowthGB, p.year)
    });
  });

  // 5-year need applies to Prod DB and systems sized as a Prod copy (same target, e.g. QA)
  autoFiveYearNeed(row: SourceTargetMatrixItem): number | null {
    const prodGB = this.prodTargetGB();
    if (!this.growth() || !row.isDb || !prodGB) return null;
    const isProdSized = row.product.toLowerCase().includes('prod') || this.basisService.parseSizeGB(row.target) === prodGB;
    return isProdSized ? this.projections()[4]?.requiredGB ?? null : null;
  }

  fiveYearNeed(row: SourceTargetMatrixItem): number | null {
    const manual = this.basisService.sizingOverrides().matrix?.[row.product]?.fiveYear;
    if (manual) return this.basisService.parseSizeGB(manual) || null;
    return this.autoFiveYearNeed(row);
  }

  monthName(month: number): string {
    return this.monthNames[month - 1] || String(month);
  }

  formatTB(gb: number): string {
    return `${(gb / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TB`;
  }

  pctOf(value: number, total: number): number {
    return total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
  }

  // ── Sizing figures (Excel) and optimization ratios (manual or default) ──
  anticipatedMemory = computed(() => this.basisService.memoryDetails()?.anticipatedInitialMemoryGiB || 0);
  columnRowMemory = computed(() => (this.basisService.memoryDetails()?.columnLoadable || 0) + (this.basisService.memoryDetails()?.rowStore || 0));
  netDisk = computed(() => this.basisService.diskDetails()?.initialNetDiskGiB || 0);
  memOptPct = computed(() => this.ov().memOptimizationPct ?? this.defaults.memOptimizationPct);
  diskArchPct = computed(() => this.ov().diskArchivingPct ?? this.defaults.diskArchivingPct);
  logPct = computed(() => this.ov().logCachePct ?? this.defaults.logCachePct);
  optimizedMemory = computed(() => this.anticipatedMemory() * (1 - this.memOptPct() / 100));
  optimizedDisk = computed(() => this.netDisk() * (1 - this.diskArchPct() / 100));

  totalDbRam = computed(() => {
    const matrix = this.sizingMatrix();
    if (!this.basisService.hasUploadedData() || !matrix || matrix.length === 0) return '—';
    const dbRow = matrix.find(r => r.isDb && (r.product.toLowerCase().includes('prod') || r.product.toLowerCase().includes('product')));
    return dbRow ? dbRow.target : (matrix.find(r => r.isDb)?.target || '—');
  });

  totalAppRam = computed(() => {
    const matrix = this.sizingMatrix();
    if (!this.basisService.hasUploadedData() || !matrix || matrix.length === 0) return '—';
    const appRows = matrix.filter(r => !r.isDb);
    return appRows.length > 0 ? appRows.map(r => r.target).join(' • ') : '—';
  });

  // Server count: architecture map drawing → Source_Target row count
  autoServerCount = computed<number | null>(() => {
    const custId = this.customerService.activeCustomerId();
    const saved = localStorage.getItem(`taskforce_custom_arch_${custId}_asis`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          return parsed.nodes.reduce((sum: number, n: any) => sum + (n.instanceCount || 1), 0);
        }
      } catch (e) {}
    }
    const count = this.basisService.sizingMatrix().length;
    return this.basisService.hasUploadedData() && count > 0 ? count : null;
  });

  serverInventoryVal = computed(() => {
    const count = this.ov().serverCount ?? this.autoServerCount();
    return count !== null && count !== undefined ? `${count} Sunucu` : '—';
  });

  fueDisplayValue = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return `${Math.round(this.basisService.fueSummary()!.calculatedFUE)} FUE`;
    }
    return '—';
  });

  fueUserSubtitle = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return `${this.basisService.fueSummary()!.totalUsers} Fiili Kullanıcı Kapsamda`;
    }
    return 'Fiili Kullanıcı Kapsamda';
  });

  sizingDisplayValue = computed(() => {
    const mem = this.anticipatedMemory();
    return mem > 0 ? `${Math.round(mem)} GiB` : '—';
  });

  sizingSubtitle = computed(() => {
    const disk = this.netDisk();
    return disk > 0 ? `${Math.round(disk - this.optimizedDisk())} GiB Disk Alanı Kazanımı` : 'S/4HANA Boyutlandırma';
  });

  tablesDisplayValue = computed(() => {
    const tables = this.basisService.largestTables();
    if (this.basisService.hasUploadedData() && tables.length > 0) {
      return `${tables.length} Tablo`;
    }
    return '—';
  });

  tablesSubtitle = computed(() => {
    const tables = this.basisService.largestTables();
    if (this.basisService.hasUploadedData() && tables.length > 0) {
      return `${tables[0].name} (${tables[0].sizeGiB.toFixed(1)} GiB)`;
    }
    return 'Veri Bekleniyor';
  });
}
