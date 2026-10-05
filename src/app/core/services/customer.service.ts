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
    const cust = this.customersSignal().find(c => c.id === this.activeCustomerIdSignal()) || this.customersSignal()[0];
    if (cust && (cust.id === 'cust-sigorta' || (cust.name && /k\*\*/i.test(cust.name)))) {
      return {
        ...cust,
        name: 'Kale Endüstri Holding',
        code: 'KEH'
      };
    }
    return cust;
  });

  getActiveCustomerCleanName(): string {
    const cust = this.activeCustomer();
    const name = cust?.name || '';
    if (cust?.id === 'cust-sigorta' || /k\*\*/i.test(name)) {
      return 'Kale Endüstri Holding';
    }
    return name || 'Müşteri';
  }

  cleanCustomerText(text?: string, fallbackName?: string): string {
    if (!text) return '';
    const cleanName = fallbackName || this.getActiveCustomerCleanName();
    const cust = this.activeCustomer();
    if (cust?.id === 'cust-sigorta' || /kale/i.test(cleanName)) {
      return text
        .replace(/K\*\*\s*E\*\*\s*H\*\*/gi, cleanName)
        .replace(/K\*\*\s*E\*\*/gi, cleanName)
        .replace(/K\*\*/gi, cleanName);
    }
    return text;
  }

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
      const list = this.customersSignal();
      let changed = false;
      const mockMap = new Map(MOCK_CUSTOMERS.map(c => [c.id, c]));
      const sanitizedList = list.map(c => {
        const mock = mockMap.get(c.id);
        if (mock && c.id !== 'cust-sigorta') {
          if (c.name !== mock.name || c.code !== mock.code) {
            changed = true;
            return { ...c, name: mock.name, code: mock.code };
          }
        } else if (c.id === 'cust-sigorta') {
          if (c.name !== 'Kale Endüstri Holding' || c.code !== 'KEH') {
            changed = true;
            return { ...c, name: 'Kale Endüstri Holding', code: 'KEH' };
          }
        }
        return c;
      });
      if (changed) {
        this.customersSignal.set(sanitizedList);
        this.saveCustomers(sanitizedList);
      }
    } catch (e) {}

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
                name: (c.id === 'cust-sigorta' || mock.id === 'cust-sigorta') ? 'Kale Endüstri Holding' : mock.name,
                sector: mock.sector || c.sector,
                code: (c.id === 'cust-sigorta' || mock.id === 'cust-sigorta') ? 'KEH' : mock.code,
                contactPerson: mock.contactPerson || c.contactPerson,
                email: mock.email || c.email,
                phone: mock.phone || c.phone,
                logo: mock.logo || c.logo,
                sapProducts: (c.sapProducts && c.sapProducts.length > 0) ? c.sapProducts : mock.sapProducts,
                coreProblems: (c.coreProblems && c.coreProblems.length > 0) ? c.coreProblems : mock.coreProblems
              };
            }
            if (c.id === 'cust-sigorta' || (c.name && /k\*\*/i.test(c.name))) {
              return { ...c, name: 'Kale Endüstri Holding', code: 'KEH' };
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
    const activeId = this.activeCustomerIdSignal();
    try {
      localStorage.removeItem('taskforce_cleared_' + activeId);
    } catch (e) {}
    this.customersSignal.update(list => {
      const updated = list.map(c => {
        if (c.id === activeId) {
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

  hasDataForCustomer(id: string): boolean {
    try {
      // 1. Explicitly cleared by user
      if (localStorage.getItem('taskforce_cleared_' + id) === 'true') {
        return false;
      }

      // 2. Basis Sizing Excel or PO Integration Excel package exists
      if (localStorage.getItem('taskforce_sizing_pkg_' + id) || localStorage.getItem('taskforce_po_pkg_' + id)) {
        return true;
      }

      // 3. Module Cards uploaded from Excel exist
      const modStr = localStorage.getItem('taskforce_modules_cards_' + id);
      if (modStr) {
        try {
          const arr = JSON.parse(modStr);
          if (Array.isArray(arr) && arr.length > 0) {
            return true;
          }
        } catch (e) {}
      }

      // 4. Check active customer record in state
      const cust = this.customersSignal().find(c => c.id === id);
      if (cust) {
        if (cust.sapUserCount > 0 && cust.lastAnalysisDate && cust.lastAnalysisDate !== 'Veri Yüklenmesi Bekleniyor') {
          return true;
        }
      }

      // 5. Default initial customers with preloaded Excel analysis
      if (['cust-sigorta', 'cust-1', 'cust-3', 'cust-test'].includes(id)) {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
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

  resetCustomerData(id: string): void {
    try {
      localStorage.setItem('taskforce_cleared_' + id, 'true');
    } catch (e) {}
    this.customersSignal.update(list => {
      const updated = list.map(c => {
        if (c.id === id) {
          return {
            ...c,
            sapUserCount: 0,
            activeUserCount: 0,
            lowUsageUserCount: 0,
            totalLicenseCost: 0,
            estimatedOpportunityValue: 0,
            activeOpportunityCount: 0,
            taskForceStatus: 'Data Collection' as const,
            progressPercentage: 10,
            sapProducts: [],
            coreProblems: [],
            lastAnalysisDate: 'Veri Yüklenmesi Bekleniyor'
          };
        }
        return c;
      });
      this.saveCustomers(updated);
      return updated;
    });
  }
}
