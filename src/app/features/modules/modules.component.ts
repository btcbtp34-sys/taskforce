import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="modules-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="sliders" [size]="24" color="#0284c7"></app-icon>
            Modules
          </h1>
          <p class="page-subtitle">SAP Modül Analiz ve Değerlendirme</p>
        </div>
      </div>

      <!-- Blank Clean Canvas Container -->
      <div class="blank-container">
        <!-- Content intentionally cleared as requested -->
      </div>
    </div>
  `,
  styles: [`
    .modules-page {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);

      .page-title {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1.45rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }

      .page-subtitle {
        margin: 0.25rem 0 0 0;
        font-size: 0.82rem;
        color: #64748b;
      }
    }

    .blank-container {
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      min-height: 520px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class ModulesComponent {}
