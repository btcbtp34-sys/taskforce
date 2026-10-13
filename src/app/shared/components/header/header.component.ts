import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
      <!-- Active Customer Context -->
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
      </div>

      <!-- Right Section: BTC Logo & User Profile -->
      <div class="right-section">
        <!-- BTC Bilişim Hizmetleri Corporate Logo (Static, Non-clickable) -->
        <div class="btc-logo-box" aria-label="BTC Logo">
          <img src="https://www.btc-ag.com.tr/wp-content/uploads/2026/01/btc-logo.svg" 
               alt="BTC Logo" 
               class="btc-header-logo" 
               (error)="$any($event.target).src='/btc-logo.svg'" />
        </div>

        <div class="header-divider"></div>

        <!-- User Profile -->
        <div class="user-profile">
          <div class="avatar">SY</div>
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
      height: 68px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      padding: 0 1.75rem;
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
              white-space: nowrap;
              flex-shrink: 0;
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

    .right-section {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .btc-logo-box {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 0.25rem 0.5rem;
      user-select: none;
      pointer-events: none;

      .btc-header-logo {
        height: 28px;
        width: auto;
        object-fit: contain;
        display: block;
      }
    }

    .header-divider {
      width: 1px;
      height: 28px;
      background: #e5e7eb;
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
      gap: 0.4rem;
      font-size: 0.74rem;
      font-weight: 600;
      height: 32px;
      padding: 0 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      border: 1px solid transparent;
      outline: none;
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

      &.btn-export {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #15803d;

        &:hover {
          background: #dcfce7;
          border-color: #86efac;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.12);
        }
      }

      &.btn-import {
        background: #f0f9ff;
        border-color: #bae6fd;
        color: #0284c7;

        &:hover {
          background: #e0f2fe;
          border-color: #7dd3fc;
          box-shadow: 0 2px 4px rgba(2, 132, 199, 0.12);
        }
      }

      &.btn-reset, &.btn-header-reset {
        background: #fef2f2;
        border-color: #fecaca;
        color: #dc2626;

        &:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.12);
        }
      }
    }

    .backup-dropdown-container {
      position: relative;
      display: inline-flex;
      align-items: center;

      .btn-export {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        border-right: none;

        .backup-badge-name {
          background: rgba(22, 163, 74, 0.12);
          color: #15803d;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          max-width: 85px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-left: 0.15rem;
        }
      }

      .btn-export-toggle {
        height: 32px;
        padding: 0 0.45rem;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-left: 1px solid rgba(22, 163, 74, 0.2);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
        transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

        &:hover {
          background: #dcfce7;
          border-color: #86efac;
          border-left-color: rgba(22, 163, 74, 0.3);
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.12);
        }
      }

      .backup-menu-dropdown {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        width: 270px;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
        border: 1px solid #e5e7eb;
        padding: 0.4rem;
        z-index: 1000;

        .backup-menu-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.65rem;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;

          &:hover {
            background: #f3f4f6;
          }

          .menu-item-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: #f3f4f6;
            flex-shrink: 0;

            &.active-icon {
              background: #ecfdf5;
            }
          }

          .menu-item-text {
            display: flex;
            flex-direction: column;
            text-align: left;

            strong {
              font-size: 0.76rem;
              color: #1f2937;
            }

            span {
              font-size: 0.68rem;
              color: #6b7280;
              max-width: 190px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
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
  router = inject(Router);
  showNotifications = false;
  showCustomerDropdown = false;
  showBackupMenu = false;

  toggleCustomerDropdown(event: Event): void {
    event.stopPropagation();
    this.showCustomerDropdown = !this.showCustomerDropdown;
    this.showBackupMenu = false;
  }

  toggleBackupMenu(event: Event): void {
    event.stopPropagation();
    this.showBackupMenu = !this.showBackupMenu;
    this.showCustomerDropdown = false;
  }

  onSelectCustomer(id: string): void {
    this.customerService.selectCustomer(id);
    this.showCustomerDropdown = false;
    if (this.router.url.startsWith('/customers/')) {
      this.router.navigate(['/customers', id]);
    }
  }

  hasDataForCustomer(id: string): boolean {
    return this.customerService.hasDataForCustomer(id);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showCustomerDropdown = false;
    this.showNotifications = false;
    this.showBackupMenu = false;
  }

  resetCurrentCustomerData(): void {
    const custName = this.customerService.activeCustomer().name;
    const activeId = this.customerService.activeCustomerId();
    const confirmed = window.confirm(`${custName} için yüklenen tüm Excel, modül ve analiz verilerini tamamen temizlemek istediğinize emin misiniz?`);
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
   * Aktif olarak seçili olan müşterinin tüm analizlerini, mimari çizimlerini
   * ve profil verilerini JSON olarak yedekler.
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

      // 1. Bu müşteriye ait tüm localStorage anahtarlarını topla
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

      // 2. Müşteriye ait çizim yoksa ama fallback çizim varsa onu da ekle
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
    } catch (e) {
      console.error('Müşteri yedeği hatası:', e);
      alert('Müşteri yedeği dosyası oluşturulurken bir hata oluştu.');
    }
  }

  /**
   * Tüm müşterilerin ve sistem verilerinin tam yedeğini alır.
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

          // Kaynak müşteri ID'sini o an seçili aktif müşterinin ID'sine eşleştir
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

          // Profil metriklerini güncelle
          if (parsed.customerProfile) {
            this.customerService.mergeCustomerData(activeId, parsed.customerProfile);
          }

          try {
            localStorage.removeItem('taskforce_cleared_' + activeId);
          } catch (e) {}

          alert(`"${activeCustomer.name}" müşterisine ait yedek başarıyla yüklendi! Sayfa yeni verilerle yenileniyor.`);
          window.location.reload();
        } else {
          // Sistem geneli tam yedek (tüm müşteriler)
          const keys = Object.keys(storageObj);
          const validKeys = keys.filter(k => k.startsWith('taskforce_') || k.startsWith('task_force_'));

          if (validKeys.length === 0) {
            alert('Yedek dosyasında TaskForce sistemine ait herhangi bir veri bulunamadı.');
            return;
          }

          const confirmed = window.confirm(
            `Bu dosya TÜM MÜŞTERİLERİN sistem yedeğini içermektedir (${validKeys.length} adet veri kaydı).\n\n` +
            `Tüm sistem verileriniz bu yedek ile güncellenecektir. Devam etmek istiyor musunuz?`
          );

          if (confirmed) {
            validKeys.forEach(k => {
              localStorage.setItem(k, storageObj[k]);
            });

            alert('Tüm sistem verileri başarıyla içe aktarıldı! Sayfa şimdi yeni verilerle yenileniyor.');
            window.location.reload();
          }
        }
      } catch (err) {
        console.error('İçe aktarma hatası:', err);
        alert('Yedek dosyası okunurken veya ayrıştırılırken bir hata oluştu.');
      }
    };
    reader.readAsText(file);
  }
}

