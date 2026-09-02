import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from './customer.service';

export interface UserSession {
  name: string;
  role: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private customerService = inject(CustomerService);

  readonly currentUser = signal<UserSession>({
    name: 'Hasan Cavit Koçak',
    role: 'SAP Lead Architect',
    email: 'hasan.kocak@taskforce.com'
  });

  // Session state: checked from localStorage or defaults to false on fresh entry
  readonly isLoggedIn = signal<boolean>(localStorage.getItem('taskforce_logged_in') === 'true');

  login(customerId: string, user?: Partial<UserSession>): void {
    if (user) {
      this.currentUser.update(curr => ({ ...curr, ...user }));
    }
    this.customerService.selectCustomer(customerId);
    this.isLoggedIn.set(true);
    localStorage.setItem('taskforce_logged_in', 'true');
    localStorage.setItem('taskforce_active_customer', customerId);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.isLoggedIn.set(false);
    localStorage.removeItem('taskforce_logged_in');
    this.router.navigate(['/login']);
  }
}
