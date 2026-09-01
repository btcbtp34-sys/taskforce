import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskForceService } from '../../core/services/task-force.service';
import { CustomerService } from '../../core/services/customer.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, IconComponent],
  template: `
    <div class="workspace-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Task Force Workspace & İş Birliği Ekranı</h1>
          <p class="page-subtitle">Takım Çalışması, Aksiyon Takibi ve Müşteri Durum Akışı (Stepper)</p>
        </div>
      </div>

      <!-- TASK FORCE DURUM AKIŞI (PROGRESS STEPPER) -->
      <div class="card-box">
        <div class="card-header">
          <h3><app-icon name="layers" [size]="18"></app-icon> Task Force Müşteri Çalışması Aşamaları (Progress Stepper)</h3>
          <span class="step-badge">Mevcut Aşama: <strong>{{ tfService.currentStage().label }}</strong> (%65 Tamamlandı)</span>
        </div>

        <div class="stepper-container">
          @for (st of tfService.stages; track st.index) {
            <div 
              class="step-item" 
              [class.completed]="st.index < tfService.currentStageIndex()"
              [class.active]="st.index === tfService.currentStageIndex()"
              (click)="tfService.setStage(st.index)">
              
              <div class="step-circle">
                @if (st.index < tfService.currentStageIndex()) {
                  <app-icon name="check" [size]="14"></app-icon>
                } @else {
                  {{ st.index }}
                }
              </div>
              <span class="step-label">{{ st.label }}</span>
            </div>
            
            <div class="step-line" *ngIf="st.index < tfService.stages.length" [class.completed]="st.index < tfService.currentStageIndex()"></div>
          }
        </div>
      </div>

      <!-- Workspace Dual Column Layout -->
      <div class="workspace-grid">
        <!-- Column 1: Action Items Board -->
        <div class="card-box">
          <div class="card-header">
            <h3><app-icon name="file-text" [size]="18"></app-icon> Aksiyon Listesi & Görev Atamaları</h3>
            <button class="btn btn-sm btn-secondary" (click)="showNewTaskForm = !showNewTaskForm">+ Görev Ekle</button>
          </div>

          <!-- Quick New Task Form -->
          <div class="task-form-box" *ngIf="showNewTaskForm">
            <input type="text" placeholder="Görev başlığı..." #taskTitleInput class="form-input" />
            <div class="form-row">
              <select #memberSelect class="form-select">
                @for (m of tfService.teamMembers; track m.id) {
                  <option [value]="m.name">{{ m.name }} ({{ m.role }})</option>
                }
              </select>
              <button class="btn btn-primary btn-sm" (click)="addNewTask(taskTitleInput.value, memberSelect.value)">Ekle</button>
            </div>
          </div>

          <div class="action-list">
            @for (act of tfService.actions(); track act.id) {
              <div class="action-item" [class.done]="act.status === 'Done'">
                <button class="check-btn" (click)="tfService.toggleActionStatus(act.id)">
                  <app-icon name="check" [size]="14" *ngIf="act.status === 'Done'"></app-icon>
                </button>
                <div class="action-details">
                  <strong class="action-title">{{ act.title }}</strong>
                  <p class="action-sub">{{ act.description }}</p>
                  <div class="action-meta">
                    <span class="assignee">Atanan: {{ act.assignedTo.name }} ({{ act.assignedTo.role }})</span>
                    <span class="due">Son Tarih: {{ act.dueDate }}</span>
                  </div>
                </div>
                <app-status-badge [text]="act.status" type="status"></app-status-badge>
              </div>
            }
          </div>
        </div>

        <!-- Column 2: Team Members & Notes -->
        <div class="side-column">
          <!-- Team Members Box -->
          <div class="card-box">
            <div class="card-header">
              <h3><app-icon name="users" [size]="18"></app-icon> Task Force Ekip Üyeleri</h3>
            </div>
            <div class="team-list">
              @for (m of tfService.teamMembers; track m.id) {
                <div class="member-item">
                  <div class="avatar">{{ m.avatar }}</div>
                  <div class="member-info">
                    <strong>{{ m.name }}</strong>
                    <span class="role">{{ m.role }}</span>
                  </div>
                  <span class="online-dot" title="Aktif"></span>
                </div>
              }
            </div>
          </div>

          <!-- Collaboration Notes -->
          <div class="card-box">
            <div class="card-header">
              <h3><app-icon name="message" [size]="18"></app-icon> Takım Notları & Tartışmalar</h3>
            </div>
            <div class="notes-list">
              @for (n of tfService.notes(); track n.id) {
                <div class="note-item">
                  <div class="note-header">
                    <strong>{{ n.author }}</strong>
                    <small>{{ n.timestamp }}</small>
                  </div>
                  <p class="note-content">{{ n.content }}</p>
                </div>
              }
            </div>

            <div class="note-input-box">
              <input type="text" placeholder="Not ekleyin..." #noteInput (keyup.enter)="addNote(noteInput.value); noteInput.value = ''" class="form-input" />
              <button class="btn btn-sm btn-primary" (click)="addNote(noteInput.value); noteInput.value = ''">Gönder</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workspace-page {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
      .page-subtitle { margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #64748b; }
    }

    .btn-primary {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary { background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 6px; }

    .card-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.4rem; }
        .step-badge { font-size: 0.78rem; color: #0284c7; }
      }
    }

    .stepper-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;

      .step-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;

        .step-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #f1f5f9;
          border: 2px solid #cbd5e1;
          color: #64748b;
          font-weight: 800;
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .step-label { font-size: 0.72rem; font-weight: 700; color: #64748b; text-align: center; }

        &.completed {
          .step-circle { background: #10b981; border-color: #10b981; color: #fff; }
          .step-label { color: #059669; }
        }

        &.active {
          .step-circle { background: #0284c7; border-color: #0284c7; color: #fff; }
          .step-label { color: #0284c7; font-weight: 800; }
        }
      }

      .step-line {
        flex: 1;
        height: 2px;
        background: #e2e8f0;
        margin: 0 0.4rem;
        &.completed { background: #10b981; }
      }
    }

    .workspace-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 1.25rem;
    }

    .side-column { display: flex; flex-direction: column; gap: 1.25rem; }

    .task-form-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .form-input { padding: 0.4rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.8rem; }
      .form-row { display: flex; gap: 0.5rem; }
      .form-select { flex: 1; padding: 0.4rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.8rem; }
    }

    .action-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;

      .action-item {
        display: flex;
        align-items: flex-start;
        gap: 0.85rem;
        padding: 0.75rem;
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 8px;

        &.done {
          opacity: 0.6;
          .action-title { text-decoration: line-through; }
        }

        .check-btn {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid #cbd5e1;
          background: #fff;
          cursor: pointer;
          font-weight: 800;
          color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          .action-title { font-size: 0.82rem; color: #0f172a; }
          .action-sub { margin: 0.15rem 0 0.35rem 0; font-size: 0.75rem; color: #64748b; }
          .action-meta { display: flex; gap: 0.85rem; font-size: 0.7rem; color: #94a3b8; }
        }
      }
    }

    .team-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;

      .member-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        border-radius: 6px;
        &:hover { background: #f8fafc; }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0284c7;
          color: #fff;
          font-weight: 800;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .member-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          strong { font-size: 0.82rem; color: #0f172a; }
          .role { font-size: 0.7rem; color: #64748b; }
        }

        .online-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
      }
    }

    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-height: 200px;
      overflow-y: auto;

      .note-item {
        background: #f8fafc;
        border-radius: 8px;
        padding: 0.6rem;
        font-size: 0.78rem;

        .note-header { display: flex; justify-content: space-between; margin-bottom: 0.2rem; strong { color: #0284c7; } small { color: #94a3b8; } }
        .note-content { margin: 0; color: #334155; }
      }
    }

    .note-input-box {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      .form-input { flex: 1; padding: 0.4rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.8rem; }
    }
  `]
})
export class WorkspaceComponent {
  tfService = inject(TaskForceService);
  customerService = inject(CustomerService);

  showNewTaskForm = false;

  addNewTask(title: string, assignedToName: string): void {
    if (!title) return;
    const member = this.tfService.teamMembers.find(m => m.name === assignedToName) || this.tfService.teamMembers[0];
    this.tfService.addAction({
      customerId: this.customerService.activeCustomerId(),
      title,
      description: 'Task Force aksiyon maddesi',
      assignedTo: member,
      dueDate: new Date().toLocaleDateString('tr-TR'),
      status: 'In Progress',
      priority: 'High'
    });
    this.showNewTaskForm = false;
  }

  addNote(text: string): void {
    if (!text) return;
    this.tfService.addNote(text, 'Hakan Koçak', 'Lead Architect');
  }
}
