import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-badge" [ngClass]="badgeClass">
      <span class="badge-dot" *ngIf="showDot"></span>
      {{ text }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 600;
      white-space: nowrap;

      .badge-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
      }

      &.blue {
        background: #f0f9ff;
        color: #0369a1;
        border: 1px solid #e0f2fe;
      }

      &.green {
        background: #ecfdf5;
        color: #047857;
        border: 1px solid #d1fae5;
      }

      &.amber {
        background: #fffbeb;
        color: #b45309;
        border: 1px solid #fef3c7;
      }

      &.red {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fee2e2;
      }

      &.gray {
        background: #f9fafb;
        color: #4b5563;
        border: 1px solid #e5e7eb;
      }
    }
  `]
})
export class StatusBadgeComponent {
  @Input() text = '';
  @Input() type: 'status' | 'priority' | 'stage' | 'category' = 'status';
  @Input() showDot = true;

  get badgeClass(): string {
    const val = this.text.toLowerCase();
    if (val.includes('approved') || val.includes('yüksek') || val.includes('done') || val.includes('active') || val.includes('quick win') || val.includes('closed')) {
      return 'green';
    }
    if (val.includes('under review') || val.includes('in progress') || val.includes('medium') || val.includes('orta') || val.includes('solution design') || val.includes('strategic')) {
      return 'blue';
    }
    if (val.includes('new') || val.includes('düşük') || val.includes('to do') || val.includes('planned') || val.includes('analysis')) {
      return 'amber';
    }
    if (val.includes('rejected') || val.includes('high effort')) {
      return 'red';
    }
    return 'gray';
  }
}
