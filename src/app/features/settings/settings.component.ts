import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
import { DataImportService } from '../../core/services/data-import.service';
import { ModullerService } from '../../core/services/moduller.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="settings-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-box">
            <app-icon name="settings" [size]="24" color="#0284c7"></app-icon>
          </div>
          <div>
            <div class="badge-title-row">
              <h1>Sistem Ayarları & Veri Yönetimi</h1>
              <span class="version-badge">v2.4 Enterprise</span>
            </div>
            <p class="subtitle">JSON veri yedekleme, sistem geri yükleme ve müşteri verilerini sıfırlama işlemleri.</p>
          </div>
        </div>

        <div class="active-customer-pill">
          <app-icon name="database" [size]="14" color="#0284c7"></app-icon>
          <div class="cust-info-text">
            <span class="cust-label">AKTİF MÜŞTERİ</span>
            <strong class="cust-name">{{ customerService.activeCustomer().name }}</strong>
          </div>
        </div>
      </div>

      <!-- Toast Feedback Message -->
      <div class="toast-bar" *ngIf="statusMessage()">
        <app-icon name="check-circle" [size]="16" color="#16a34a"></app-icon>
        <span>{{ statusMessage() }}</span>
      </div>

      <!-- Settings Grid -->
      <div class="settings-grid">
        <!-- 1. KART: YEDEK AL (DIŞA AKTAR) -->
        <div class="settings-card export-card">
          <div class="card-header">
            <div class="ch-icon export">
              <app-icon name="download" [size]="20" color="#16a34a"></app-icon>
            </div>
            <div>
              <h3>Yedek Al (Dışa Aktar)</h3>
              <p>Analizleri, modül puanlarını, mimari diyagramları ve boyutlandırma verilerini JSON olarak indirin.</p>
            </div>
          </div>

          <div class="card-body">
            <!-- Seçili Müşteri Yedeği -->
            <div class="action-row">
              <div class="action-info">
                <strong>Seçili Müşteri Yedeği ({{ customerService.activeCustomer().name }})</strong>
                <p>Yalnızca aktif seçili müşteriye ait tüm analiz, mimari çizim, Excel veri paketleri ve TCO hesaplarını içerir.</p>
                <div class="meta-tags">
                  <span class="tag-pill tag-green">Müşteri Bazlı</span>
                  <span class="tag-pill">JSON Format</span>
                </div>
              </div>
              <button class="btn-action btn-green" (click)="exportCustomerBackup()">
                <app-icon name="download" [size]="15" color="#ffffff"></app-icon>
                <span>Müşteri Yedeği İndir</span>
              </button>
            </div>

            <div class="divider"></div>

            <!-- Tam Sistem Yedeği -->
            <div class="action-row">
              <div class="action-info">
                <strong>Tüm Sistem Yedeği (Full Backup)</strong>
                <p>Platformdaki tüm müşterilerin ({{ customerService.customers().length }} Müşteri) analiz ve sistem verilerini tek bir JSON dosyasında arşivler.</p>
                <div class="meta-tags">
                  <span class="tag-pill tag-blue">Tüm Veriler</span>
                  <span class="tag-pill">Tam Arşiv</span>
                </div>
              </div>
              <button class="btn-action btn-outline-green" (click)="exportFullBackup()">
                <app-icon name="download" [size]="15" color="#16a34a"></app-icon>
                <span>Tam Sistem Yedeği Al</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. KART: YEDEK YÜKLE (İÇE AKTAR) -->
        <div class="settings-card import-card">
          <div class="card-header">
            <div class="ch-icon import">
              <app-icon name="upload" [size]="20" color="#0284c7"></app-icon>
            </div>
            <div>
              <h3>Yedek Yükle (İçe Aktar)</h3>
              <p>Daha önce alınmış geçerli bir TaskForce JSON yedek dosyasını sisteme geri yükleyin.</p>
            </div>
          </div>

          <div class="card-body">
            <!-- Hidden File Input -->
            <input 
              type="file" 
              #settingsFileInput 
              accept=".json" 
              (change)="onBackupFileSelected($event)" 
              style="display: none" />

            <div class="upload-drop-area" (click)="settingsFileInput.click()">
              <div class="drop-circle">
                <app-icon name="upload" [size]="26" color="#0284c7"></app-icon>
              </div>
              <h4>JSON Yedek Dosyası Seçin</h4>
              <p>Bilgisayarınızdaki <code>TaskForce_*.json</code> dosyasını seçerek yükleyin.</p>
              <button type="button" class="btn-action btn-blue" (click)="$event.stopPropagation(); settingsFileInput.click()">
                <app-icon name="file-text" [size]="15" color="#ffffff"></app-icon>
                <span>Dosya Seç & Yükle</span>
              </button>
            </div>

            <div class="import-notice">
              <app-icon name="info" [size]="14" color="#0284c7"></app-icon>
              <span>Müşteri yedeği yüklendiğinde, seçili aktif müşterinin ({{ customerService.activeCustomer().name }}) verileri güncellenir.</span>
            </div>
          </div>
        </div>

        <!-- 3. KART: TEHLİKELİ BÖLGE (VERİLERİ TEMİZLE) -->
        <div class="settings-card danger-card">
          <div class="card-header">
            <div class="ch-icon danger">
              <app-icon name="trash" [size]="20" color="#dc2626"></app-icon>
            </div>
            <div>
              <h3>Tehlikeli Bölge (Verileri Temizle)</h3>
              <p>Yüklenen Excel tablolarını, analizleri ve özel mimari çizimlerini kalıcı olarak sıfırlayın.</p>
            </div>
          </div>

          <div class="card-body">
            <!-- Seçili Müşteri Verilerini Sıfırla -->
            <div class="action-row">
              <div class="action-info">
                <strong>{{ customerService.activeCustomer().name }} Verilerini Sıfırla</strong>
                <p>Aktif müşteriye ait tüm yüklenmiş Excel verilerini, mimari görselleri, modül puanlarını ve TCO hesaplarını temizler.</p>
                <div class="meta-tags">
                  <span class="tag-pill tag-red">Geri Alınamaz</span>
                  <span class="tag-pill">Aktif Müşteri</span>
                </div>
              </div>
              <button class="btn-action btn-danger" (click)="resetCurrentCustomerData()">
                <app-icon name="trash" [size]="15" color="#ffffff"></app-icon>
                <span>Verileri Temizle</span>
              </button>
            </div>

            <div class="divider"></div>

            <!-- Tüm LocalStorage Sıfırla -->
            <div class="action-row">
              <div class="action-info">
                <strong>Tüm Sistem Önbelleğini Sıfırla</strong>
                <p>Tarayıcıda depolanan tüm TaskForce müşterilerini ve analiz verilerini fabrika ayarlarına döndürür.</p>
                <div class="meta-tags">
                  <span class="tag-pill tag-red">Tüm Sistem</span>
                </div>
              </div>
              <button class="btn-action btn-outline-danger" (click)="resetAllSystemData()">
                <app-icon name="alert" [size]="15" color="#dc2626"></app-icon>
                <span>Tüm Sistemi Sıfırla</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4. KART: SİSTEM & DEPOLAMA BİLGİSİ -->
        <div class="settings-card info-card">
          <div class="card-header">
            <div class="ch-icon info">
              <app-icon name="server" [size]="20" color="#475569"></app-icon>
            </div>
            <div>
              <h3>Depolama & Sistem Durumu</h3>
              <p>Tarayıcı yerel depolama alanı ve sistem yapılandırma metrikleri.</p>
            </div>
          </div>

          <div class="card-body">
            <div class="status-metrics-grid">
              <div class="metric-box">
                <span class="m-label">Tarayıcı Depolama (LocalStorage)</span>
                <strong class="m-val">{{ storageUsage() }}</strong>
                <span class="m-sub">{{ storageKeyCount() }} Veri Anahtarı</span>
              </div>

              <div class="metric-box">
                <span class="m-label">Kayıtlı Müşteri Sayısı</span>
                <strong class="m-val">{{ customerService.customers().length }}</strong>
                <span class="m-sub">Aktif: {{ customerService.activeCustomer().name }}</span>
              </div>

              <div class="metric-box">
                <span class="m-label">Mimari Görselleri</span>
                <strong class="m-val">{{ hasArchImages() ? 'Mevcut' : 'Yüklenmedi' }}</strong>
                <span class="m-sub">AS-IS & TO-BE</span>
              </div>

              <div class="metric-box">
                <span class="m-label">Platform Motoru</span>
                <strong class="m-val">v2.4</strong>
                <span class="m-sub">SAP RISE Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 1.5rem 2rem 3rem;
      width: 100%;
      box-sizing: border-box;
      min-height: calc(100vh - 68px);
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1.5rem;
      flex-wrap: wrap;

      .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;

        .header-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.12);
        }

        .badge-title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;

          h1 {
            font-size: 1.45rem;
            font-weight: 850;
            color: #0f172a;
            margin: 0;
            letter-spacing: -0.02em;
          }

          .version-badge {
            background: #e0f2fe;
            color: #0369a1;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.15rem 0.5rem;
            border-radius: 6px;
            letter-spacing: 0.04em;
          }
        }

        .subtitle {
          font-size: 0.82rem;
          color: #64748b;
          margin: 0.2rem 0 0;
        }
      }

      .active-customer-pill {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.45rem 0.85rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);

        .cust-info-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;

          .cust-label {
            font-size: 0.58rem;
            font-weight: 700;
            color: #94a3b8;
            letter-spacing: 0.06em;
          }

          .cust-name {
            font-size: 0.84rem;
            font-weight: 800;
            color: #0f172a;
          }
        }
      }
    }

    .toast-bar {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      color: #166534;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      animation: fadeIn 0.2s ease;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .settings-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .card-header {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f1f5f9;
        background: #fbfcfe;

        .ch-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.export { background: #dcfce7; border: 1px solid #bbf7d0; }
          &.import { background: #e0f2fe; border: 1px solid #bae6fd; }
          &.danger { background: #fee2e2; border: 1px solid #fecaca; }
          &.info   { background: #f1f5f9; border: 1px solid #e2e8f0; }
        }

        h3 {
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        p {
          font-size: 0.74rem;
          color: #64748b;
          margin: 0.15rem 0 0;
        }
      }

      .card-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        flex: 1;
      }
    }

    .action-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;

      @media (max-width: 640px) {
        flex-direction: column;
        align-items: flex-start;
      }

      .action-info {
        flex: 1;

        strong {
          font-size: 0.88rem;
          font-weight: 750;
          color: #1e293b;
          display: block;
          margin-bottom: 0.2rem;
        }

        p {
          font-size: 0.74rem;
          color: #64748b;
          margin: 0 0 0.5rem;
          line-height: 1.45;
        }

        .meta-tags {
          display: flex;
          align-items: center;
          gap: 0.35rem;

          .tag-pill {
            font-size: 0.62rem;
            font-weight: 700;
            padding: 0.15rem 0.45rem;
            border-radius: 4px;
            background: #f1f5f9;
            color: #475569;

            &.tag-green { background: #dcfce7; color: #166534; }
            &.tag-blue  { background: #e0f2fe; color: #0369a1; }
            &.tag-red   { background: #fee2e2; color: #991b1b; }
          }
        }
      }
    }

    .divider {
      height: 1px;
      background: #f1f5f9;
      margin: 0.2rem 0;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1rem;
      border-radius: 7px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
      flex-shrink: 0;

      &.btn-green {
        background: #16a34a;
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
        &:hover { background: #15803d; transform: translateY(-1px); }
      }

      &.btn-outline-green {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #15803d;
        &:hover { background: #dcfce7; border-color: #86efac; }
      }

      &.btn-blue {
        background: #0284c7;
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
        &:hover { background: #0369a1; transform: translateY(-1px); }
      }

      &.btn-danger {
        background: #dc2626;
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);
        &:hover { background: #b91c1c; transform: translateY(-1px); }
      }

      &.btn-outline-danger {
        background: #fef2f2;
        border-color: #fecaca;
        color: #dc2626;
        &:hover { background: #fee2e2; border-color: #fca5a5; }
      }
    }

    .upload-drop-area {
      border: 2px dashed #bae6fd;
      background: #f0f9ff;
      border-radius: 10px;
      padding: 2rem 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #e0f2fe;
        border-color: #38bdf8;
      }

      .drop-circle {
        width: 48px;
        height: 48px;
        background: #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.75rem;
        box-shadow: 0 2px 8px rgba(2, 132, 199, 0.15);
      }

      h4 {
        font-size: 0.95rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 0.25rem;
      }

      p {
        font-size: 0.76rem;
        color: #64748b;
        margin: 0 0 1rem;

        code {
          background: #e2e8f0;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          font-family: monospace;
          color: #0f172a;
        }
      }
    }

    .import-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.65rem 0.85rem;
      border-radius: 6px;
      font-size: 0.72rem;
      color: #64748b;
      line-height: 1.4;
    }

    .status-metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;

      .metric-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;

        .m-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.35rem;
        }

        .m-val {
          font-size: 1.35rem;
          font-weight: 850;
          color: #0f172a;
          line-height: 1.2;
        }

        .m-sub {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SettingsComponent implements OnInit {
  customerService = inject(CustomerService);
  authService = inject(AuthService);
  basisService = inject(BasisSizingService);
  importService = inject(DataImportService);
  modullerService = inject(ModullerService);

  statusMessage = signal<string>('');
  storageUsage = signal<string>('Hesaplanıyor...');
  storageKeyCount = signal<number>(0);

  ngOnInit() {
    this.calcStorageUsage();
  }

  calcStorageUsage(): void {
    try {
      let totalBytes = 0;
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('taskforce_') || k.startsWith('task_force_'))) {
          const val = localStorage.getItem(k) || '';
          totalBytes += k.length + val.length;
          count++;
        }
      }
      this.storageKeyCount.set(count);
      if (totalBytes < 1024) {
        this.storageUsage.set(`${totalBytes} B`);
      } else if (totalBytes < 1024 * 1024) {
        this.storageUsage.set(`${(totalBytes / 1024).toFixed(1)} KB`);
      } else {
        this.storageUsage.set(`${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
      }
    } catch (e) {
      this.storageUsage.set('0 KB');
    }
  }

  hasArchImages(): boolean {
    const id = this.customerService.activeCustomerId();
    return !!(
      localStorage.getItem(`taskforce_target_arch_asis_img_${id}`) ||
      localStorage.getItem(`taskforce_target_arch_tobe_img_${id}`) ||
      localStorage.getItem(`taskforce_custom_arch_${id}_asis`) ||
      localStorage.getItem(`taskforce_custom_arch_${id}_tobe`)
    );
  }

  showToast(msg: string) {
    this.statusMessage.set(msg);
    setTimeout(() => this.statusMessage.set(''), 4000);
  }

  /**
   * Aktif müşteri verilerini JSON olarak indirir
   */
  exportCustomerBackup(): void {
    try {
      const activeCust = this.customerService.activeCustomer();
      const activeId = this.customerService.activeCustomerId();
      if (!activeCust || !activeId) {
        alert('Lütfen önce bir müşteri seçin.');
        return;
      }

      const backupData: Record<string, string> = {};
      let count = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || (!key.startsWith('taskforce_') && !key.startsWith('task_force_'))) continue;

        const isCustomerKey = key.endsWith(`_${activeId}`) ||
                              key.includes(`_${activeId}_`) ||
                              key === `taskforce_modules_${activeId}` ||
                              key === `taskforce_modules_cards_${activeId}` ||
                              key === `taskforce_sizing_pkg_${activeId}` ||
                              key === `taskforce_po_pkg_${activeId}` ||
                              key === `task_force_exec_summary_${activeId}`;

        if (isCustomerKey) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            backupData[key] = val;
            count++;
          }
        }
      }

      if (!backupData[`taskforce_custom_arch_${activeId}_asis`]) {
        const fallbackAsis = localStorage.getItem('taskforce_custom_arch_asis');
        if (fallbackAsis) {
          backupData[`taskforce_custom_arch_${activeId}_asis`] = fallbackAsis;
          count++;
        }
      }
      if (!backupData[`taskforce_custom_arch_${activeId}_tobe`]) {
        const fallbackTobe = localStorage.getItem('taskforce_custom_arch_tobe');
        if (fallbackTobe) {
          backupData[`taskforce_custom_arch_${activeId}_tobe`] = fallbackTobe;
          count++;
        }
      }

      const customerProfile = this.customerService.customers().find(c => c.id === activeId) || activeCust;
      const dateStr = new Date().toISOString().slice(0, 10);
      const safeCustomerName = activeCust.name
        .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_ -]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      const payload = {
        appName: 'TaskForce SAP Sizing & Architecture Studio',
        backupType: 'customer',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        customerId: activeId,
        customerName: activeCust.name,
        customerCode: activeCust.code,
        customerProfile: customerProfile,
        itemCount: count,
        storage: backupData
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `TaskForce_${safeCustomerName}_Yedek_${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(link.href);

      this.showToast(`"${activeCust.name}" yedeği başarıyla oluşturuldu ve indirildi.`);
    } catch (e) {
      console.error('Müşteri yedeği hatası:', e);
      alert('Müşteri yedeği dosyası oluşturulurken bir hata oluştu.');
    }
  }

  /**
   * Tüm sistem verilerini JSON olarak indirir
   */
  exportFullBackup(): void {
    try {
      const backupData: Record<string, string> = {};
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('taskforce_') || key.startsWith('task_force_'))) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            backupData[key] = val;
            count++;
          }
        }
      }

      if (count === 0) {
        alert('Yedeklenecek herhangi bir TaskForce verisi bulunamadı.');
        return;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const payload = {
        appName: 'TaskForce SAP Sizing & Architecture Studio',
        backupType: 'full',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        itemCount: count,
        storage: backupData
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `TaskForce_Tum_Veriler_Yedek_${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(link.href);

      this.showToast('Tüm sistem verileri başarıyla yedeklendi.');
    } catch (e) {
      console.error('Yedekleme hatası:', e);
      alert('Yedek dosyası oluşturulurken bir hata oluştu.');
    }
  }

  /**
   * JSON yedek dosyasını içe aktarır
   */
  onBackupFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        const storageObj = parsed.storage || parsed.data;
        if (!storageObj || typeof storageObj !== 'object') {
          alert('Geçersiz dosya formatı! Lütfen TaskForce tarafından üretilmiş geçerli bir JSON yedek dosyası seçin.');
          return;
        }

        const isCustomerBackup = parsed.backupType === 'customer' || !!parsed.customerId || !!parsed.customerProfile;
        const activeCustomer = this.customerService.activeCustomer();
        const activeId = this.customerService.activeCustomerId();

        if (isCustomerBackup) {
          const sourceCustomerName = parsed.customerName || parsed.customerProfile?.name || 'Müşteri';
          const sourceCustomerId = parsed.customerId;

          const confirmed = window.confirm(
            `"${sourceCustomerName}" müşterisine ait yedek dosyası tespit edildi.\n\n` +
            `Bu veriler şu anda seçili olan "${activeCustomer.name}" müşterisine aktarılacaktır.\n\n` +
            `"${activeCustomer.name}" için mevcut analiz ve çizim verilerinin üzerine yazılsın mı?`
          );

          if (!confirmed) return;

          Object.entries(storageObj).forEach(([key, val]) => {
            if (typeof val !== 'string') return;
            let targetKey = key;
            if (sourceCustomerId && key.includes(sourceCustomerId)) {
              targetKey = key.split(sourceCustomerId).join(activeId);
            } else if (!key.includes(activeId)) {
              if (key.startsWith('taskforce_sizing_pkg_')) {
                targetKey = `taskforce_sizing_pkg_${activeId}`;
              } else if (key.startsWith('taskforce_po_pkg_')) {
                targetKey = `taskforce_po_pkg_${activeId}`;
              } else if (key.startsWith('taskforce_modules_cards_')) {
                targetKey = `taskforce_modules_cards_${activeId}`;
              } else if (key.startsWith('taskforce_modules_')) {
                targetKey = `taskforce_modules_${activeId}`;
              } else if (key.startsWith('taskforce_custom_arch_') && key.endsWith('_asis')) {
                targetKey = `taskforce_custom_arch_${activeId}_asis`;
              } else if (key.startsWith('taskforce_custom_arch_') && key.endsWith('_tobe')) {
                targetKey = `taskforce_custom_arch_${activeId}_tobe`;
              } else if (key.startsWith('taskforce_tco_years_')) {
                targetKey = `taskforce_tco_years_${activeId}`;
              } else if (key.startsWith('taskforce_tco_asis_')) {
                targetKey = `taskforce_tco_asis_${activeId}`;
              } else if (key.startsWith('taskforce_tco_rise_')) {
                targetKey = `taskforce_tco_rise_${activeId}`;
              } else if (key.startsWith('taskforce_recommended_method_')) {
                targetKey = `taskforce_recommended_method_${activeId}`;
              } else if (key.startsWith('taskforce_custom_code_')) {
                targetKey = `taskforce_custom_code_${activeId}`;
              } else if (key.startsWith('taskforce_methods_cards_')) {
                targetKey = `taskforce_methods_cards_${activeId}`;
              } else if (key.startsWith('task_force_exec_summary_')) {
                targetKey = `task_force_exec_summary_${activeId}`;
              }
            }

            localStorage.setItem(targetKey, val);
          });

          if (parsed.customerProfile) {
            this.customerService.mergeCustomerData(activeId, parsed.customerProfile);
          }

          try {
            localStorage.removeItem('taskforce_cleared_' + activeId);
          } catch (e) {}

          alert(`"${activeCustomer.name}" müşterisine ait yedek başarıyla yüklendi! Sayfa yeni verilerle yenileniyor.`);
          window.location.reload();
        } else {
          // Sistem geneli tam yedek
          const keys = Object.keys(storageObj);
          const validKeys = keys.filter(k => k.startsWith('taskforce_') || k.startsWith('task_force_'));

          if (validKeys.length === 0) {
            alert('Yedek dosyasında geçerli TaskForce verisi bulunamadı.');
            return;
          }

          const confirmed = window.confirm(
            `Bu dosya ${validKeys.length} adet sistem ve müşteri veri kaydı içeriyor.\n\n` +
            `Tüm sistem verilerinin üzerine yazılacaktır. Devam etmek istiyor musunuz?`
          );

          if (!confirmed) return;

          validKeys.forEach(k => {
            const v = storageObj[k];
            if (typeof v === 'string') {
              localStorage.setItem(k, v);
            }
          });

          alert('Tam sistem yedeği başarıyla yüklendi! Sistem yenileniyor.');
          window.location.reload();
        }
      } catch (err) {
        console.error('Yedek okuma hatası:', err);
        alert('Yedek dosyası okunurken hata oluştu! Geçerli bir JSON dosyası olduğundan emin olun.');
      }
    };
    reader.readAsText(file);
  }

  /**
   * Aktif müşteri verilerini sıfırlar
   */
  resetCurrentCustomerData(): void {
    const custName = this.customerService.activeCustomer().name;
    const activeId = this.customerService.activeCustomerId();
    const confirmed = window.confirm(`${custName} için yüklenen tüm Excel, modül, mimari ve analiz verilerini tamamen temizlemek istediğinize emin misiniz?`);
    if (confirmed && activeId) {
      this.basisService.clearUploadedData();
      this.importService.clearUploadedPoData();
      this.modullerService.clearCustomerModules(activeId);
      this.customerService.resetCustomerData(activeId);

      const specificKeys = [
        `taskforce_sizing_pkg_${activeId}`,
        `taskforce_po_pkg_${activeId}`,
        `taskforce_modules_cards_${activeId}`,
        `taskforce_modules_${activeId}`,
        `taskforce_tco_years_${activeId}`,
        `taskforce_tco_asis_${activeId}`,
        `taskforce_tco_rise_${activeId}`,
        `taskforce_recommended_method_${activeId}`,
        `taskforce_custom_code_${activeId}`,
        `taskforce_methods_cards_${activeId}`,
        `task_force_exec_summary_${activeId}`,
        `taskforce_custom_arch_${activeId}_asis`,
        `taskforce_custom_arch_${activeId}_po`,
        `taskforce_custom_arch_${activeId}_rise`,
        `taskforce_target_arch_asis_img_${activeId}`,
        `taskforce_target_arch_tobe_img_${activeId}`,
        `taskforce_arch_ss_asis_${activeId}`,
        `taskforce_arch_ss_rise_${activeId}`,
        `taskforce_arch_ss_po_${activeId}`
      ];
      specificKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.endsWith(`_${activeId}`) || k.includes(`_${activeId}_`))) {
          try { localStorage.removeItem(k); } catch (e) {}
        }
      }

      try {
        localStorage.setItem('taskforce_cleared_' + activeId, 'true');
      } catch (e) {}

      window.alert(`${custName} için tüm veriler sıfırlandı.`);
      window.location.reload();
    }
  }

  /**
   * Tüm sistem verilerini sıfırlar
   */
  resetAllSystemData(): void {
    const confirmed = window.confirm('DİKKAT: Sistemdeki TÜM müşterilerin verileri ve analizleri sıfırlanacaktır!\n\nBu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?');
    if (confirmed) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('taskforce_') || k.startsWith('task_force_'))) {
          try { localStorage.removeItem(k); } catch (e) {}
        }
      }
      window.alert('Tüm sistem verileri başarıyla sıfırlandı.');
      window.location.reload();
    }
  }
}
