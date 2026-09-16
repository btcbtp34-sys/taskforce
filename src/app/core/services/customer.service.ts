import { Injectable, signal, computed } from '@angular/core';
import { Customer } from '../models/customer.model';
import { MOCK_CUSTOMERS } from '../data/mock-customers';

const CUSTOMERS_STORAGE_KEY = 'taskforce_customers_list';
const ACTIVE_CUSTOMER_KEY = 'taskforce_active_customer';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customersSignal = signal<Customer[]>(this.getInitialCustomers());
  private activeCustomerIdSignal = signal<string>(this.getInitialActiveCustomerId());

  readonly customers = this.customersSignal.asReadonly();
  readonly activeCustomerId = this.activeCustomerIdSignal.asReadonly();

  readonly activeCustomer = computed(() => {
    return this.customersSignal().find(c => c.id === this.activeCustomerIdSignal()) || this.customersSignal()[0];
  });

  readonly totalCustomerCount = computed(() => this.customersSignal().length);
  
  readonly activeAnalysisCount = computed(() => 
    this.customersSignal().filter(c => c.taskForceStatus !== 'Closed').length
  );

  readonly totalOpportunityValue = computed(() => 
    this.customersSignal().reduce((sum, c) => sum + c.estimatedOpportunityValue, 0)
  );

  readonly totalIdentifiedOpportunities = computed(() => 
    this.customersSignal().reduce((sum, c) => sum + c.activeOpportunityCount, 0)
  );

  constructor() {
    try {
      // Eski global ortak mimari çizim anahtarlarını temizle ve müşterileri birbirinden tamamen izole et
      ['taskforce_custom_arch_asis', 'taskforce_custom_arch_tobe', 'taskforce_custom_arch_rise'].forEach(k => {
        const val = localStorage.getItem(k);
        if (val) {
          // Eğer cust-1'in henüz özel kaydı yoksa bu çizimi sadece cust-1'e ata
          if (!localStorage.getItem('taskforce_custom_arch_cust-1_asis') && k === 'taskforce_custom_arch_asis') {
            localStorage.setItem('taskforce_custom_arch_cust-1_asis', val);
          }
          localStorage.removeItem(k);
        }
      });
    } catch (e) {}
  }

  private getInitialCustomers(): Customer[] {
    try {
      const saved = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Customer[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sync any mock customer updates while preserving user-added customers
          const mockMap = new Map(MOCK_CUSTOMERS.map(c => [c.id, c]));
          const merged = parsed.map(c => {
            const mock = mockMap.get(c.id);
            if (mock) {
              return {
                ...mock,
                ...c,
                name: mock.name,
                sector: mock.sector,
                code: mock.code,
                contactPerson: mock.contactPerson,
                email: mock.email,
                phone: mock.phone,
                logo: mock.logo,
                sapProducts: (c.sapProducts && c.sapProducts.length > 0) ? c.sapProducts : mock.sapProducts,
                coreProblems: (c.coreProblems && c.coreProblems.length > 0) ? c.coreProblems : mock.coreProblems
              };
            }
            return c;
          });
          // Ensure all mock customers exist
          MOCK_CUSTOMERS.forEach(m => {
            if (!merged.some(c => c.id === m.id)) {
              merged.push(m);
            }
          });
          this.saveCustomers(merged);
          return merged;
        }
      }
    } catch (e) {
      console.error('Failed to load customers from storage', e);
    }
    return MOCK_CUSTOMERS;
  }

  private getInitialActiveCustomerId(): string {
    try {
      const savedId = localStorage.getItem(ACTIVE_CUSTOMER_KEY);
      if (savedId) {
        return savedId;
      }
    } catch (e) {}
    return 'cust-2';
  }

  private saveCustomers(list: Customer[]): void {
    try {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save customers to storage', e);
    }
  }

  selectCustomer(id: string): void {
    if (this.customersSignal().some(c => c.id === id)) {
      this.activeCustomerIdSignal.set(id);
      try {
        localStorage.setItem(ACTIVE_CUSTOMER_KEY, id);
      } catch (e) {}
    }
  }

  updateCustomerDataFromBasis(basisUserCount: number, fueValue: number, products: any[]): void {
    this.customersSignal.update(list => {
      const updated = list.map(c => {
        if (c.id === this.activeCustomerIdSignal()) {
          return {
            ...c,
            sapUserCount: basisUserCount,
            activeUserCount: basisUserCount,
            totalLicenseCost: Math.round(fueValue * 2200),
            taskForceStatus: 'Analysis' as const,
            progressPercentage: 50,
            lastAnalysisDate: new Date().toLocaleDateString('tr-TR')
          };
        }
        return c;
      });
      this.saveCustomers(updated);
      return updated;
    });
  }

  updateCustomerStatus(id: string, status: Customer['taskForceStatus'], progress: number): void {
    this.customersSignal.update(list => {
      const updated = list.map(c => c.id === id ? { ...c, taskForceStatus: status, progressPercentage: progress } : c);
      this.saveCustomers(updated);
      return updated;
    });
  }

  addCustomer(customer: Customer): void {
    this.customersSignal.update(list => {
      const updated = [customer, ...list];
      this.saveCustomers(updated);
      return updated;
    });
    this.selectCustomer(customer.id);
  }

  mergeCustomerData(targetId: string, partial: Partial<Customer>): void {
    this.customersSignal.update(list => {
      const updated = list.map(c => {
        if (c.id === targetId) {
          const { id, name, ...rest } = partial;
          return {
            ...c,
            ...rest
          };
        }
        return c;
      });
      this.saveCustomers(updated);
      return updated;
    });
  }
}
