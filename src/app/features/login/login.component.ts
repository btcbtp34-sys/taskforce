import { Component, inject, signal, computed, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <!-- Logo & Header -->
        <div class="login-header">
          <div class="logo-box">
            <app-icon name="layers" [size]="26" color="#0284c7"></app-icon>
          </div>
          <h1 class="brand-title">TASK FORCE</h1>
          <p class="brand-sub">SAP Fırsat & Mimari Analiz Platformu</p>
        </div>

        <!-- Form Fields -->
        <form class="login-form" (ngSubmit)="onLogin()">
          <!-- 1. Kullanıcı Adı -->
          <div class="form-field">
            <label class="field-label">Kullanıcı Adı</label>
            <div class="input-wrap">
              <app-icon name="user" [size]="15" color="#94a3b8"></app-icon>
              <input 
                type="text" 
                [(ngModel)]="username" 
                name="username" 
                required 
                placeholder="admin" 
                class="form-input" />
            </div>
          </div>

          <!-- 2. Şifre -->
          <div class="form-field">
            <label class="field-label">Şifre</label>
            <div class="input-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                type="password" 
                [(ngModel)]="password" 
                name="password" 
                required 
                placeholder="123" 
                class="form-input" />
            </div>
          </div>

          <!-- 3. Aranabilir Müşteri Seç Dropdown -->
          <div class="form-field dropdown-field-container">
            <label class="field-label">Müşteri Seç</label>
            
            <!-- Custom Dropdown Trigger Button -->
            <div 
              class="input-wrap custom-select-trigger" 
              [class.open]="isDropdownOpen()"
              [class.has-selection]="selectedCustomerId()"
              (click)="toggleDropdown($event)">
              
              <app-icon name="database" [size]="15" [color]="selectedCustomerId() ? '#0284c7' : '#94a3b8'"></app-icon>
              
              <span class="selected-text" [class.placeholder]="!selectedCustomerId()">
                {{ getSelectedCustomerLabel() }}
              </span>

              <div class="chevron-arrow" [class.rotated]="isDropdownOpen()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <!-- Custom Searchable Dropdown Menu -->
            <div class="custom-dropdown-panel" *ngIf="isDropdownOpen()" (click)="$event.stopPropagation()">
              <!-- Search Bar inside dropdown -->
              <div class="dropdown-search-box">
                <app-icon name="search" [size]="14" color="#94a3b8"></app-icon>
                <input 
                  #searchInput
                  type="text" 
                  [ngModel]="searchQuery()" 
                  (ngModelChange)="searchQuery.set($event)"
                  name="searchQuery" 
                  placeholder="Müşteri adı veya sektör ara..." 
                  class="dropdown-search-input" />
              </div>

              <!-- Options List -->
              <div class="dropdown-options-list">
                @for (cust of filteredCustomers(); track cust.id) {
                  <div 
                    class="dropdown-opt-item" 
                    [class.active]="selectedCustomerId() === cust.id"
                    (click)="selectCustomer(cust.id)">
                    <div class="opt-main">
                      <strong class="opt-name">{{ cust.name }}</strong>
                      <span class="opt-sector">{{ cust.sector }}</span>
                    </div>
                    <span class="opt-badge">{{ cust.code }}</span>
                  </div>
                } @empty {
                  <div class="no-results">
                    Eşleşen müşteri bulunamadı.
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Error validation message if not selected -->
          <div class="validation-error" *ngIf="errorMessage()">
            <app-icon name="alert" [size]="14" color="#ef4444"></app-icon>
            <span>{{ errorMessage() }}</span>
          </div>

          <!-- Giriş Yap Butonu -->
          <button type="submit" class="btn-submit">
            <span>Giriş Yap</span>
            <app-icon name="arrow-right" [size]="15" color="#ffffff"></app-icon>
          </button>
        </form>

        <div class="card-footer">
          <span>Task Force Engine • Kurumsal SAP Danışman Portalı</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      width: 100%;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .login-card {
      width: 100%;
      max-width: 410px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 2.2rem 2rem 1.8rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 4px 10px -2px rgba(0, 0, 0, 0.02);
      position: relative;
    }

    .login-header {
      text-align: center;
      margin-bottom: 1.8rem;

      .logo-box {
        width: 48px;
        height: 48px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.6rem;
      }

      .brand-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: 0.04em;
        margin: 0;
      }

      .brand-sub {
        font-size: 0.78rem;
        color: #0284c7;
        font-weight: 600;
        margin: 0.2rem 0 0;
      }
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      .field-label {
        font-size: 0.76rem;
        font-weight: 700;
        color: #334155;
      }

      .input-wrap {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        height: 42px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 7px;
        padding: 0 0.75rem;
        transition: border-color 0.15s, box-shadow 0.15s;

        &:focus-within {
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
        }

        .form-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.82rem;
          color: #0f172a;
          outline: none;
          width: 100%;

          &::placeholder {
            color: #94a3b8;
          }
        }
      }
    }

    /* Custom Searchable Dropdown Styling */
    .dropdown-field-container {
      position: relative;
    }

    .custom-select-trigger {
      cursor: pointer;
      user-select: none;

      &.open {
        border-color: #0284c7;
        box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
      }

      .selected-text {
        flex: 1;
        font-size: 0.82rem;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.placeholder {
          color: #94a3b8;
          font-weight: 500;
        }
      }

      .chevron-arrow {
        display: flex;
        align-items: center;
        transition: transform 0.2s ease;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .custom-dropdown-panel {
      position: absolute;
      top: 68px;
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 100;
      overflow: hidden;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dropdown-search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;

      .dropdown-search-input {
        border: none;
        background: transparent;
        font-size: 0.8rem;
        color: #0f172a;
        outline: none;
        width: 100%;

        &::placeholder {
          color: #94a3b8;
        }
      }
    }

    .dropdown-options-list {
      max-height: 190px;
      overflow-y: auto;
      padding: 0.35rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .dropdown-opt-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.12s;

      .opt-main {
        display: flex;
        flex-direction: column;
        line-height: 1.2;

        .opt-name {
          font-size: 0.82rem;
          color: #1e293b;
          font-weight: 700;
        }

        .opt-sector {
          font-size: 0.7rem;
          color: #64748b;
        }
      }

      .opt-badge {
        font-size: 0.68rem;
        font-weight: 600;
        color: #0284c7;
        background: #f0f9ff;
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
        border: 1px solid #bae6fd;
      }

      &:hover {
        background: #f1f5f9;
        .opt-name { color: #0284c7; }
      }

      &.active {
        background: #e0f2fe;
        .opt-name { color: #0369a1; font-weight: 800; }
      }
    }

    .no-results {
      padding: 1rem;
      text-align: center;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .validation-error {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: #ef4444;
      font-weight: 600;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
    }

    .btn-submit {
      margin-top: 0.4rem;
      height: 44px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 7px;
      font-size: 0.88rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      box-shadow: 0 2px 5px rgba(2, 132, 199, 0.25);

      &:hover {
        background: #0369a1;
      }

      &:active {
        transform: scale(0.99);
      }
    }

    .card-footer {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.68rem;
      color: #94a3b8;
    }
  `]
})
export class LoginComponent {
  customerService = inject(CustomerService);
  authService = inject(AuthService);
  router = inject(Router);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  // Dummy credentials requested by user
  username = 'admin';
  password = '123';

  // Initially unselected, showing "Müşteri Seçiniz..."
  selectedCustomerId = signal<string>('');
  isDropdownOpen = signal<boolean>(false);
  searchQuery = signal<string>('');
  errorMessage = signal<string>('');

  filteredCustomers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.customerService.customers();
    if (!q) return list;
    return list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.sector.toLowerCase().includes(q) || 
      c.code.toLowerCase().includes(q)
    );
  });

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
    if (this.isDropdownOpen()) {
      this.errorMessage.set('');
      setTimeout(() => {
        this.searchInputRef?.nativeElement.focus();
      }, 50);
    }
  }

  selectCustomer(id: string): void {
    this.selectedCustomerId.set(id);
    this.isDropdownOpen.set(false);
    this.errorMessage.set('');
    this.searchQuery.set('');
  }

  getSelectedCustomerLabel(): string {
    const id = this.selectedCustomerId();
    if (!id) {
      return 'Müşteri Seçiniz...';
    }
    const found = this.customerService.customers().find(c => c.id === id);
    return found ? `${found.name} (${found.sector})` : 'Müşteri Seçiniz...';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isDropdownOpen()) {
      this.isDropdownOpen.set(false);
    }
  }

  onLogin(): void {
    const id = this.selectedCustomerId();
    if (!id) {
      this.errorMessage.set('Lütfen giriş yapmak için bir müşteri seçiniz.');
      this.isDropdownOpen.set(true);
      return;
    }

    this.authService.login(id, {
      name: this.username === 'admin' ? 'Hasan Cavit Koçak' : this.username,
      role: 'SAP Lead Architect',
      email: `${this.username}@taskforce.com`
    });
  }
}
