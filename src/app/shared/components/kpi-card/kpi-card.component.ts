import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-card">
      <div class="kpi-top">
        <span class="kpi-label">{{ label }}</span>
        <div class="kpi-icon-wrapper">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>
      
      <div class="kpi-value-area">
        <span class="kpi-value">{{ value ?? '' }}</span>
        <span class="kpi-unit" *ngIf="unit">{{ unit }}</span>
      </div>

      <div class="kpi-footer" *ngIf="trendText || subtext">
        <span class="kpi-trend" [class.positive]="trendPositive" [class.neutral]="!trendPositive" *ngIf="trendText">
          {{ trendText }}
        </span>
        <span class="kpi-subtext" *ngIf="subtext">{{ subtext }}</span>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.1rem 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.15s ease;

      &:hover {
        border-color: #9ca3af;
      }
    }

    .kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .kpi-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        letter-spacing: 0.02em;
      }

      .kpi-icon-wrapper {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: #f9fafb;
        border: 1px solid #f3f4f6;
        color: #374151;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .kpi-value-area {
      margin: 0.6rem 0 0.4rem 0;
      display: flex;
      align-items: baseline;
      gap: 0.3rem;

      .kpi-value {
        font-size: 1.6rem;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.02em;
        line-height: 1.1;
      }

      .kpi-unit {
        font-size: 0.82rem;
        font-weight: 500;
        color: #6b7280;
      }
    }

    .kpi-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.72rem;

      .kpi-trend {
        font-weight: 600;
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
        background: #f3f4f6;
        color: #374151;

        &.positive {
          background: #ecfdf5;
          color: #047857;
        }

        &.neutral {
          background: #f3f4f6;
          color: #4b5563;
        }
      }

      .kpi-subtext {
        color: #9ca3af;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `]
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number | null = '';
  @Input() unit = '';
  @Input() trendText = '';
  @Input() trendPositive = true;
  @Input() subtext = '';
  @Input() theme: 'primary' | 'emerald' | 'amber' | 'indigo' = 'primary';
}
