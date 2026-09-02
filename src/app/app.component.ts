import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Task Force – SAP Müşteri Fırsat Analiz Platformu';
  router = inject(Router);
  authService = inject(AuthService);
  sidebarCollapsed = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(val => !val);
  }

  isLoginPage(): boolean {
    return this.router.url.includes('/login') || (!this.authService.isLoggedIn() && this.router.url === '/');
  }
}
