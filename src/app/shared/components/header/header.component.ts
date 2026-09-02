import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <header class="header-container">
      <!-- Search & Active Customer Context -->
      <div class="left-section">
        <!-- Customer Context Badge (Static, no switcher) -->
        <div class="customer-badge-box">
          <div class="cust-icon-wrap">
            <app-icon name="database" [size]="14" color="#0284c7"></app-icon>
          </div>
          <div class="cust-text-info">
            <span class="cust-label">MÜŞTERİ</span>
            <strong class="cust-name-val">{{ customerService.activeCustomer().name }}</strong>
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
        <!-- Prominent Quick Data Upload Button -->
        <a routerLink="/data-import" class="upload-quick-btn" title="Yeni Excel/CSV Verisi Yükle">
          <app-icon name="upload" [size]="14" color="#ffffff"></app-icon>
          <span>Excel / CSV Yükle</span>
        </a>

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
  `]
})
export class HeaderComponent {
  customerService = inject(CustomerService);
  authService = inject(AuthService);
  showNotifications = false;
}

