import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, IconComponent],
  template: `
    <div class="customers-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="customers" [size]="24" color="#0284c7"></app-icon>
            Müşteriler
          </h1>
          <p class="page-subtitle">SAP Danışmanlık Portföyü ve Customer 360 Görünümü</p>
        </div>
        <button class="btn btn-primary" (click)="showAddModal.set(true)">
          <app-icon name="plus" [size]="16"></app-icon>
          <span>Yeni Müşteri Ekle</span>
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="toolbar">
        <div class="search-field">
          <app-icon name="search" [size]="15" color="#9ca3af"></app-icon>
          <input 
            type="text" 
            placeholder="Müşteri adı veya sektör ara..." 
            [value]="searchQuery()" 
            (input)="onSearchInput($event)" />
        </div>

        <div class="filter-pills">
          <button class="pill-btn" [class.active]="selectedSector() === 'All'" (click)="selectedSector.set('All')">Tüm Sektörler</button>
          <button class="pill-btn" [class.active]="selectedSector() === 'Manufacturing'" (click)="selectedSector.set('Manufacturing')">Manufacturing</button>
          <button class="pill-btn" [class.active]="selectedSector() === 'Logistics & Retail'" (click)="selectedSector.set('Logistics & Retail')">Logistics</button>
          <button class="pill-btn" [class.active]="selectedSector() === 'Chemicals & Energy'" (click)="selectedSector.set('Chemicals & Energy')">Chemicals</button>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th><app-icon name="user" [size]="14"></app-icon> Müşteri Adı</th>
              <th><app-icon name="layers" [size]="14"></app-icon> Sektör</th>
              <th><app-icon name="users" [size]="14"></app-icon> SAP Kullanıcı</th>
              <th><app-icon name="database" [size]="14"></app-icon> Kullanılan SAP Ürünleri</th>
              <th><app-icon name="opportunities" [size]="14"></app-icon> Aktif Fırsat</th>
              <th><app-icon name="dollar" [size]="14"></app-icon> Opportunity Value</th>
              <th><app-icon name="shield" [size]="14"></app-icon> Task Force Durumu</th>
              <th class="text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            @for (cust of filteredCustomers(); track cust.id) {
              <tr class="table-row" (click)="viewCustomer360(cust.id)">
                <td>
                  <div class="customer-cell">
                    <div class="logo-box">
                      <app-icon name="database" [size]="16" color="#0284c7"></app-icon>
                    </div>
                    <div class="name-info">
                      <strong class="cust-name">{{ cust.name }}</strong>
                      <span class="cust-code">{{ cust.code }} • {{ cust.contactPerson }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="sector-tag">{{ cust.sector }}</span>
                </td>
                <td>
                  <div class="users-info">
                    <strong>{{ cust.sapUserCount | number }}</strong>
                    <small>{{ cust.lowUsageUserCount }} düşük kullanım</small>
                  </div>
                </td>
                <td>
                  <div class="products-flex">
                    @for (prod of cust.sapProducts; track prod.id) {
                      <span class="prod-badge">{{ prod.name }}</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="opp-count-badge">{{ cust.activeOpportunityCount }} Fırsat</span>
                </td>
                <td>
                  <strong class="value-text">€{{ cust.estimatedOpportunityValue | number }}</strong>
                </td>
                <td>
                  <app-status-badge [text]="cust.taskForceStatus" type="stage"></app-status-badge>
                </td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <div class="action-buttons">
                    <button class="btn-icon" (click)="viewCustomer360(cust.id)" title="Customer 360">
                      <app-icon name="search" [size]="14"></app-icon>
                    </button>
                    <button class="btn-icon primary" (click)="uploadForCustomer(cust.id)" title="Excel Yükle">
                      <app-icon name="upload" [size]="14" color="#0284c7"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Add New Customer Modal Form -->
      <div class="modal-overlay" *ngIf="showAddModal()" (click)="showAddModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>+ Yeni SAP Müşterisi Ekle</h3>
            <button class="close-btn" (click)="showAddModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Müşteri / Şirket Adı</label>
              <input type="text" #cName placeholder="Örn: GHI Lojistik A.Ş." class="form-input" />
            </div>
            <div class="form-group">
              <label>Sektör</label>
              <select #cSector class="form-select">
                <option value="Manufacturing">Manufacturing</option>
                <option value="Logistics & Retail">Logistics & Retail</option>
                <option value="Chemicals & Energy">Chemicals & Energy</option>
                <option value="Food & FMCG">Food & FMCG</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group flex-1">
                <label>SAP Toplam Kullanıcı Sayısı</label>
                <input type="number" #cUsers value="500" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label>İletişim Personeli</label>
                <input type="text" #cContact placeholder="Örn: Mehmet Yılmaz" class="form-input" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAddModal.set(false)">İptal</button>
            <button class="btn btn-primary" (click)="saveNewCustomer(cName.value, cSector.value, cUsers.value, cContact.value)">Kaydet & Ekle</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .customers-page {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .page-title {
        font-size: 1.4rem;
        font-weight: 800;
        color: #111827;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .page-subtitle {
        margin: 0.2rem 0 0 0;
        font-size: 0.82rem;
        color: #6b7280;
      }
    }

    .btn-primary {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 0.5rem 0.9rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;

      &:hover { background: #0369a1; }
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
      padding: 0.5rem 0.9rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: #ffffff;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      .search-field {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        width: 300px;

        input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.8rem;
        }
      }

      .filter-pills {
        display: flex;
        gap: 0.35rem;

        .pill-btn {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 0.3rem 0.65rem;
          border-radius: 14px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #4b5563;
          cursor: pointer;

          &.active {
            background: #0284c7;
            color: #ffffff;
            border-color: #0284c7;
          }
        }
      }
    }

    .table-container {
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;

      th {
        background: #f9fafb;
        padding: 0.75rem 0.85rem;
        text-align: left;
        font-weight: 700;
        color: #4b5563;
        font-size: 0.75rem;
        border-bottom: 1px solid #e5e7eb;

        app-icon { vertical-align: middle; margin-right: 0.2rem; }
      }

      .table-row {
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        &:hover { background: #f0f9ff; }
        td { padding: 0.75rem 0.85rem; vertical-align: middle; }
      }
    }

    .customer-cell {
      display: flex;
      align-items: center;
      gap: 0.65rem;

      .logo-box {
        width: 32px;
        height: 32px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .name-info {
        display: flex;
        flex-direction: column;
        .cust-name { font-size: 0.85rem; color: #111827; }
        .cust-code { font-size: 0.7rem; color: #6b7280; }
      }
    }

    .sector-tag {
      background: #f9fafb;
      color: #374151;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 600;
      border: 1px solid #e5e7eb;
    }

    .users-info {
      display: flex;
      flex-direction: column;
      strong { color: #111827; }
      small { color: #dc2626; font-size: 0.68rem; font-weight: 600; }
    }

    .products-flex {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;

      .prod-badge {
        font-size: 0.65rem;
        background: #f3f4f6;
        color: #374151;
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
        font-weight: 600;
      }
    }

    .opp-count-badge {
      background: #ecfdf5;
      color: #047857;
      font-weight: 700;
      font-size: 0.72rem;
      padding: 0.15rem 0.45rem;
      border-radius: 10px;
    }

    .value-text { color: #111827; font-weight: 800; }
    .text-right { text-align: right; }

    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.35rem;

      .btn-icon {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        &:hover { background: #f9fafb; }
        &.primary { background: #f0f9ff; border-color: #bae6fd; }
      }
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.4);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 8px;
      width: 480px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .modal-header {
        padding: 1rem 1.25rem;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
        h3 { margin: 0; font-size: 1rem; font-weight: 800; color: #111827; }
        .close-btn { background: transparent; border: none; font-size: 1rem; cursor: pointer; color: #6b7280; }
      }

      .modal-body {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          label { font-size: 0.75rem; font-weight: 700; color: #374151; }
          .form-input, .form-select {
            padding: 0.45rem;
            border-radius: 6px;
            border: 1px solid #d1d5db;
            font-size: 0.8rem;
            outline: none;
          }
        }

        .form-row { display: flex; gap: 0.75rem; }
        .flex-1 { flex: 1; }
      }

      .modal-footer {
        padding: 0.85rem 1.25rem;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
    }
  `]
})
export class CustomerListComponent {
  customerService = inject(CustomerService);
  router = inject(Router);

  searchQuery = signal<string>('');
  selectedSector = signal<string>('All');
  showAddModal = signal<boolean>(false);

  readonly filteredCustomers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const sec = this.selectedSector();

    return this.customerService.customers().filter(c => {
      const matchQuery = c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q);
      const matchSector = sec === 'All' || c.sector === sec;
      return matchQuery && matchSector;
    });
  });

  onSearchInput(e: Event): void { this.searchQuery.set((e.target as HTMLInputElement).value); }
  viewCustomer360(id: string): void { this.customerService.selectCustomer(id); this.router.navigate(['/customers', id]); }
  uploadForCustomer(id: string): void { this.customerService.selectCustomer(id); this.router.navigate(['/data-import']); }

  saveNewCustomer(name: string, sector: string, usersStr: string, contact: string): void {
    if (!name) return;
    const users = Number(usersStr) || 500;
    const newCust = {
      id: `cust-${Date.now()}`,
      name,
      code: `SAP-${Math.floor(Math.random() * 8000) + 1000}`,
      sector,
      contactPerson: contact || 'Mehmet Danışman',
      email: 'info@company.com',
      phone: '+90 212 555 0000',
      sapUserCount: users,
      activeUserCount: Math.floor(users * 0.85),
      lowUsageUserCount: Math.floor(users * 0.15),
      totalLicenseCost: users * 400,
      estimatedOpportunityValue: users * 150,
      activeOpportunityCount: 3,
      taskForceStatus: 'Discovery' as any,
      progressPercentage: 35,
      logo: 'building',
      lastAnalysisDate: new Date().toLocaleDateString('tr-TR'),
      coreProblems: ['Lisans verimsizliği', 'Manuel süreç yükü'],
      sapProducts: [
        { id: '1', name: 'SAP S/4HANA Core', category: 'ERP Core' as any, licenseCount: users, monthlyCost: users * 25, status: 'Active' as any, icon: 'database' },
        { id: '2', name: 'SAP BTP Integration', category: 'Automation' as any, licenseCount: 50, monthlyCost: 2500, status: 'Active' as any, icon: 'layers' }
      ]
    };

    this.customerService.addCustomer(newCust);
    this.showAddModal.set(false);
  }
}
