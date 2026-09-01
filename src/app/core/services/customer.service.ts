import { Injectable, signal, computed } from '@angular/core';
import { Customer } from '../models/customer.model';
import { MOCK_CUSTOMERS } from '../data/mock-customers';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customersSignal = signal<Customer[]>(MOCK_CUSTOMERS);
  private activeCustomerIdSignal = signal<string>('cust-1');

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

  selectCustomer(id: string): void {
    if (this.customersSignal().some(c => c.id === id)) {
      this.activeCustomerIdSignal.set(id);
    }
  }

  updateCustomerStatus(id: string, status: Customer['taskForceStatus'], progress: number): void {
    this.customersSignal.update(list => 
      list.map(c => c.id === id ? { ...c, taskForceStatus: status, progressPercentage: progress } : c)
    );
  }

  addCustomer(customer: Customer): void {
    this.customersSignal.update(list => [customer, ...list]);
    this.activeCustomerIdSignal.set(customer.id);
  }
}
