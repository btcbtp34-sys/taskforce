import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';
import { BasisSizingService } from '../../../core/services/basis-sizing.service';
import { DataImportService } from '../../../core/services/data-import.service';
import { ModullerService } from '../../../core/services/moduller.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <header class="header-container">
      <!-- Search & Active Customer Context -->
      <div class="left-section">
        <!-- Customer Context Badge (Interactive Switcher) -->
        <div class="customer-badge-box interactive" (click)="toggleCustomerDropdown($event)" title="Müşteri Değiştirmek İçin Tıklayın">
          <div class="cust-icon-wrap">
            <app-icon name="database" [size]="14" color="#0284c7"></app-icon>
          </div>
          <div class="cust-text-info">
            <span class="cust-label">AKTİF MÜŞTERİ</span>
            <strong class="cust-name-val">{{ customerService.activeCustomer().name }}</strong>
          </div>
          <app-icon name="chevron-down" [size]="11" color="#0284c7"></app-icon>

          <!-- Customer Dropdown Menu -->
          <div class="cust-dropdown-menu" *ngIf="showCustomerDropdown" (click)="$event.stopPropagation()">
            <div class="cd-header">
              <span>Müşteri Seçin</span>
              <a routerLink="/customers" (click)="showCustomerDropdown = false" class="cd-link">Tümü ➔</a>
            </div>
            <div class="cd-list">
              <div 
                class="cd-item" 
                *ngFor="let c of customerService.customers()"
                [class.active]="c.id === customerService.activeCustomerId()"
                (click)="onSelectCustomer(c.id)">
                <div class="cd-main">
                  <strong class="cd-name">{{ c.name }}</strong>
                  <span class="cd-sector" *ngIf="c.sector">{{ c.sector }}</span>
                </div>
                <span class="cd-badge" *ngIf="hasDataForCustomer(c.id)">Excel Yüklü</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Global Search Bar -->
        <div class="search-bar">
          <app-icon name="search" [size]="14" color="#9ca3af"></app-icon>
          <input type="text" placeholder="Müşteri, fırsat, SAP modülü ara..." class="search-input" />
          <span class="search-shortcut">⌘K</span>
        </div>
      </div>

      <!-- Quick Upload Button, Notifications & Profile -->
      <div class="right-section">
        <!-- Hidden File Input for JSON Backup Import -->
        <input 
          type="file" 
          id="taskforce-backup-input" 
          accept=".json" 
          (change)="onBackupFileSelected($event)" 
          style="display: none" />

        <!-- Yedek Al Butonu (Tüm verileri JSON olarak export eder) -->
        <button 
          class="btn-header-action btn-export" 
          (click)="exportFullBackup()" 
          title="Tüm müşterileri, Excel analizlerini ve mimari çizimleri JSON olarak indirin">
          <app-icon name="download" [size]="13" color="#16a34a"></app-icon>
          <span>Yedek Al (JSON)</span>
        </button>

        <!-- Yedek Yükle Butonu (JSON yedeğini içe aktarır) -->
        <button 
          class="btn-header-action btn-import" 
          (click)="triggerImport()" 
          title="Farklı bir bilgisayardan alınan JSON yedeğini sisteme yükleyin">
          <app-icon name="upload" [size]="13" color="#0284c7"></app-icon>
          <span>Yedek Yükle</span>
        </button>

        <!-- Verileri Temizle Butonu (Her zaman üst barda) -->
        <button 
          class="btn-header-action btn-reset" 
          (click)="resetCurrentCustomerData()" 
          [title]="customerService.activeCustomer().name + ' için yüklenen verileri temizle'">
          <app-icon name="trash" [size]="13" color="#dc2626"></app-icon>
          <span>Verileri Temizle</span>
        </button>


        <!-- Notifications Bell -->
        <div class="notification-box">
          <button class="icon-btn" (click)="showNotifications = !showNotifications">
            <app-icon name="bell" [size]="16" color="#4b5563"></app-icon>
            <span class="notification-badge">3</span>
          </button>

          <div class="notification-dropdown" *ngIf="showNotifications">
            <div class="dropdown-header">
              <span>Bildirimler</span>
              <span class="clear-all">Tümünü Okundu İşaretle</span>
            </div>
            <div class="dropdown-list">
              <div class="dropdown-item unread">
                <div class="item-body">
                  <strong>Yeni Fırsat Tespit Edildi</strong>
                  <p>{{ customerService.activeCustomer().name }} için €35.000 Lisans Optimizasyonu</p>
                  <small>10 dakika önce</small>
                </div>
              </div>
              <div class="dropdown-item">
                <div class="item-body">
                  <strong>Veri Yükleme Tamamlandı</strong>
                  <p>Customer_SAP_Usage_Data.xlsx başarıyla işlendi</p>
                  <small>1 saat önce</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Profile -->
        <div class="user-profile">
          <div class="avatar">HCK</div>
          <div class="user-info">
            <span class="user-name">{{ authService.currentUser().name }}</span>
            <span class="user-role">{{ authService.currentUser().role }}</span>
          </div>
          <button class="btn-logout-icon" (click)="authService.logout()" title="Çıkış Yap / Müşteri Portalı">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header-container {
      height: 56px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .left-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
      max-width: 650px;
    }

    .customer-badge-box {
      display: flex;
      align-items: center;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 0.25rem 0.6rem;
      gap: 0.5rem;
      position: relative;

      &.interactive {
        cursor: pointer;
        transition: all 0.15s;
        user-select: none;

        &:hover {
          background: #e0f2fe;
          border-color: #7dd3fc;
        }
      }

      .cust-dropdown-menu {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        min-width: 260px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.12);
        z-index: 1000;
        overflow: hidden;

        .cd-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0.85rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.72rem;
          font-weight: 700;
          color: #475569;

          .cd-link {
            color: #0284c7;
            text-decoration: none;
            font-size: 0.7rem;

            &:hover { text-decoration: underline; }
          }
        }

        .cd-list {
          max-height: 260px;
          overflow-y: auto;
          padding: 0.35rem 0;

          .cd-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 0.85rem;
            cursor: pointer;
            transition: background 0.12s;

            &:hover {
              background: #f1f5f9;
            }

            &.active {
              background: #eff6ff;
              border-left: 3px solid #0284c7;
            }

            .cd-main {
              display: flex;
              flex-direction: column;
              gap: 0.1rem;

              .cd-name {
                font-size: 0.8rem;
                color: #0f172a;
              }

              .cd-sector {
                font-size: 0.68rem;
                color: #64748b;
              }
            }

            .cd-badge {
              font-size: 0.62rem;
              font-weight: 700;
              background: #dcfce7;
              color: #15803d;
              padding: 0.15rem 0.45rem;
              border-radius: 4px;
            }
          }
        }
      }

      .cust-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cust-text-info {
        display: flex;
        flex-direction: column;
        line-height: 1.1;

        .cust-label {
          font-size: 0.58rem;
          font-weight: 700;
          color: #0284c7;
          letter-spacing: 0.05em;
        }

        .cust-name-val {
          font-size: 0.78rem;
          font-weight: 700;
          color: #0c4a6e;
          white-space: nowrap;
        }
      }

      .btn-switch-cust {
        background: #ffffff;
        border: 1px solid #bae6fd;
        border-radius: 4px;
        padding: 0.15rem 0.45rem;
        font-size: 0.68rem;
        font-weight: 700;
        color: #0284c7;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        transition: all 0.15s;

        &:hover {
          background: #0284c7;
          color: #ffffff;
          border-color: #0284c7;
          app-icon { color: #ffffff !important; }
        }
      }
    }

    .search-bar {
      flex: 1;
      display: flex;
      align-items: center;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.35rem 0.65rem;
      gap: 0.5rem;

      .search-input {
        border: none;
        background: transparent;
        width: 100%;
        font-size: 0.8rem;
        outline: none;
        color: #111827;

        &::placeholder { color: #9ca3af; }
      }

      .search-shortcut {
        font-size: 0.65rem;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 0.1rem 0.3rem;
        color: #9ca3af;
        font-weight: 600;
      }
    }

    .right-section {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .upload-quick-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #0284c7;
      color: #ffffff;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.15s;

      &:hover { background: #0369a1; }
    }

    .notification-box {
      position: relative;

      .icon-btn {
        background: transparent;
        border: 1px solid #e5e7eb;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;

        &:hover { background: #f9fafb; }

        .notification-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          background: #ef4444;
          color: #fff;
          font-size: 0.6rem;
          font-weight: 700;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #fff;
        }
      }

      .notification-dropdown {
        position: absolute;
        right: 0;
        top: 40px;
        width: 300px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        overflow: hidden;
        z-index: 120;

        .dropdown-header {
          padding: 0.6rem 0.85rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 700;

          .clear-all { color: #0284c7; font-size: 0.7rem; cursor: pointer; }
        }

        .dropdown-list {
          max-height: 250px;
          overflow-y: auto;

          .dropdown-item {
            padding: 0.65rem 0.85rem;
            border-bottom: 1px solid #f3f4f6;

            &.unread { background: #f0f9ff; }

            .item-body {
              font-size: 0.78rem;
              p { margin: 0.1rem 0; color: #4b5563; font-size: 0.72rem; }
              small { color: #9ca3af; font-size: 0.65rem; }
            }
          }
        }
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .avatar {
        width: 30px;
        height: 30px;
        background: #111827;
        color: #fff;
        font-weight: 700;
        font-size: 0.75rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .user-info {
        display: flex;
        flex-direction: column;

        .user-name { font-size: 0.8rem; font-weight: 600; color: #111827; }
        .user-role { font-size: 0.68rem; color: #6b7280; }
      }

      .btn-logout-icon {
        background: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 5px;
        padding: 0.3rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        margin-left: 0.25rem;
        transition: all 0.15s;

        &:hover {
          background: #fee2e2;
          color: #ef4444;
          border-color: #fecaca;
        }
      }
    }

    .btn-header-action, .btn-header-reset {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.15s;

      &.btn-export {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #16a34a;

        &:hover {
          background: #dcfce7;
          border-color: #86efac;
        }
      }

      &.btn-import {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        color: #0284c7;

        &:hover {
          background: #e0f2fe;
          border-color: #7dd3fc;
        }
      }

      &.btn-reset, &.btn-header-reset {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;

        &:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }
      }
    }
  `]
})
export class HeaderComponent {
  customerService = inject(CustomerService);
  authService = inject(AuthService);
  basisService = inject(BasisSizingService);
  importService = inject(DataImportService);
  modullerService = inject(ModullerService);
  showNotifications = false;
  showCustomerDropdown = false;

  toggleCustomerDropdown(event: Event): void {
    event.stopPropagation();
    this.showCustomerDropdown = !this.showCustomerDropdown;
  }

  onSelectCustomer(id: string): void {
    this.customerService.selectCustomer(id);
    this.showCustomerDropdown = false;
  }

  hasDataForCustomer(id: string): boolean {
    try {
      return !!(localStorage.getItem('taskforce_sizing_pkg_' + id) || localStorage.getItem('taskforce_po_pkg_' + id));
    } catch (e) {
      return false;
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showCustomerDropdown = false;
    this.showNotifications = false;
  }

  resetCurrentCustomerData(): void {
    const custName = this.customerService.activeCustomer().name;
    const confirmed = window.confirm(`${custName} için yüklenen tüm Excel ve modül verilerini temizlemek istediğinize emin misiniz?`);
    if (confirmed) {
      this.basisService.clearUploadedData();
      this.importService.clearUploadedPoData();
      this.modullerService.clearCustomerModules();
      const activeId = this.customerService.activeCustomerId();
      if (activeId) {
        localStorage.removeItem(`taskforce_tco_years_${activeId}`);
        localStorage.removeItem(`taskforce_tco_asis_${activeId}`);
        localStorage.removeItem(`taskforce_tco_rise_${activeId}`);
      }
    }
  }

  exportFullBackup(): void {
    try {
      const backupData: Record<string, string> = {};
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('taskforce_')) {
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

      const activeCust = this.customerService.activeCustomer().name || 'Genel';
      const dateStr = new Date().toISOString().slice(0, 10);
      const payload = {
        appName: 'TaskForce SAP Sizing & Architecture Studio',
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
    } catch (e) {
      console.error('Yedekleme hatası:', e);
      alert('Yedek dosyası oluşturulurken bir hata oluştu.');
    }
  }

  triggerImport(): void {
    const input = document.getElementById('taskforce-backup-input') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  }

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

        const keys = Object.keys(storageObj);
        const validKeys = keys.filter(k => k.startsWith('taskforce_'));

        if (validKeys.length === 0) {
          alert('Yedek dosyasında TaskForce sistemine ait herhangi bir veri bulunamadı.');
          return;
        }

        const confirmed = window.confirm(
          `Yedek dosyasında ${validKeys.length} adet veri kaydı tespit edildi.\n\n` +
          `Mevcut tarayıcı verileriniz bu yedek ile güncellenecektir. Devam etmek istiyor musunuz?`
        );

        if (confirmed) {
          validKeys.forEach(k => {
            localStorage.setItem(k, storageObj[k]);
          });

          alert('Yedek başarıyla içe aktarıldı! Sayfa şimdi yeni verilerle yenileniyor.');
          window.location.reload();
        }
      } catch (err) {
        console.error('İçe aktarma hatası:', err);
        alert('Yedek dosyası okunurken veya ayrıştırılırken bir hata oluştu.');
      }
    };
    reader.readAsText(file);
  }
}

