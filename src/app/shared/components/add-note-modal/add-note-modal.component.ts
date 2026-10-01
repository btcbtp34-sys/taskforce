import { Component, inject, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuickToolsService } from '../../../core/services/quick-tools.service';
import { CustomerService } from '../../../core/services/customer.service';
import { NotesService } from '../../../core/services/notes.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-add-note-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    @if (quickToolsService.isAddNoteOpen()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-left">
              <div class="icon-circle">
                <app-icon name="plus" [size]="20" color="#0284c7"></app-icon>
              </div>
              <div>
                <div class="modal-badge-row">
                  <span class="customer-tag">{{ customerService.activeCustomer().name }}</span>
                  <span class="type-tag">Zaman Damgalı Not</span>
                </div>
                <h3>Yeni Not Ekle</h3>
              </div>
            </div>
            <button class="btn-close" (click)="close()" title="Kapat">
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Time preview banner -->
            <div class="time-banner">
              <div class="time-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div class="time-info">
                <span class="lbl">Kayıt Zamanı (Otomatik Atanır):</span>
                <strong class="val">{{ currentTimestampStr() }}</strong>
              </div>
            </div>

            <!-- Author Field -->
            <div class="form-group">
              <label class="form-label">
                <app-icon name="user" [size]="13" color="#64748b"></app-icon>
                <span>Yazan / Ekip Adı:</span>
              </label>
              <input 
                type="text" 
                class="form-input" 
                [(ngModel)]="author" 
                placeholder="Örn: SAP Satış & Presales Çözüm Mimarı" 
              />
            </div>

            <!-- Note Text Field -->
            <div class="form-group">
              <label class="form-label">
                <app-icon name="file-text" [size]="13" color="#64748b"></app-icon>
                <span>Yorum veya Not Metni:</span>
              </label>
              <textarea 
                #noteTextarea
                class="form-textarea" 
                rows="4" 
                [(ngModel)]="noteText" 
                (keydown.ctrl.enter)="save()"
                placeholder="Müşteri görüşmesi, mimari kararlar, bütçe mutabakatı veya teknik adımları buraya yazınız... (Örn: Müşteri ile Brownfield modelinde mutabık kalındı, Q4 cutover provası için hazırlık başlatılıyor.)"
              ></textarea>
            </div>

            <div class="hint-row">
              <span class="ctrl-hint">İpucu: Hızlı kaydetmek için <strong>Ctrl + Enter</strong> tuşlarına basabilirsiniz.</span>
              <span class="char-count" [class.has-text]="noteText.trim().length > 0">{{ noteText.trim().length }} karakter</span>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close()">Vazgeç</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              [disabled]="!noteText.trim()"
              (click)="save()">
              <app-icon name="check" [size]="15" color="#ffffff"></app-icon>
              <span>Notu Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 580px;
      box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.85rem;

        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #e0f2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-badge-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.15rem;

          .customer-tag {
            font-size: 0.68rem;
            font-weight: 700;
            background: #e0f2fe;
            color: #0369a1;
            padding: 0.1rem 0.45rem;
            border-radius: 4px;
          }

          .type-tag {
            font-size: 0.65rem;
            font-weight: 600;
            color: #64748b;
          }
        }

        h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
      }

      .btn-close {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.4rem;
        border-radius: 6px;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;

        &:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
      max-height: 70vh;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 5px;
      }
      &::-webkit-scrollbar-track {
        background: #f1f5f9;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }

      .time-banner {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 0.65rem 0.9rem;

        .time-icon {
          color: #16a34a;
          display: flex;
          align-items: center;
        }

        .time-info {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;

          .lbl {
            color: #166534;
          }

          .val {
            color: #15803d;
            font-weight: 700;
          }
        }
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #334155;
        }

        .form-input {
          padding: 0.65rem 0.85rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.84rem;
          color: #0f172a;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          background: #ffffff;

          &:focus {
            outline: none;
            border-color: #0284c7;
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
          }
        }

        .form-textarea {
          padding: 0.75rem 0.85rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.86rem;
          color: #0f172a;
          line-height: 1.5;
          resize: vertical;
          min-height: 110px;
          max-height: 250px;
          overflow-y: auto;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          background: #ffffff;

          &::-webkit-scrollbar {
            width: 5px;
          }
          &::-webkit-scrollbar-track {
            background: #f8fafc;
          }
          &::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }

          &:focus {
            outline: none;
            border-color: #0284c7;
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
          }
        }
      }

      .hint-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.72rem;
        color: #94a3b8;

        .ctrl-hint strong {
          color: #64748b;
        }

        .char-count.has-text {
          color: #0284c7;
          font-weight: 600;
        }
      }
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.6rem 1.15rem;
        border-radius: 8px;
        font-size: 0.84rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;

        &.btn-secondary {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;

          &:hover {
            background: #f1f5f9;
            color: #0f172a;
          }
        }

        &.btn-primary {
          background: #0284c7;
          border: 1px solid #0284c7;
          color: #ffffff;
          box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2);

          &:hover:not(:disabled) {
            background: #0369a1;
            border-color: #0369a1;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class AddNoteModalComponent {
  quickToolsService = inject(QuickToolsService);
  customerService = inject(CustomerService);
  notesService = inject(NotesService);

  @ViewChild('noteTextarea') noteTextarea?: ElementRef<HTMLTextAreaElement>;

  author = 'Presales & Satış Çözüm Mimarı';
  noteText = '';
  currentTimestampStr = signal<string>('');

  constructor() {
    effect(() => {
      if (this.quickToolsService.isAddNoteOpen()) {
        this.updateTimestamp();
        this.noteText = '';
        setTimeout(() => {
          this.noteTextarea?.nativeElement?.focus();
        }, 120);
      }
    });
  }

  updateTimestamp(): void {
    const now = new Date();
    const str = now.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    this.currentTimestampStr.set(str);
  }

  close(): void {
    this.quickToolsService.closeAddNote();
  }

  save(): void {
    if (!this.noteText.trim()) return;

    this.notesService.addNote(this.noteText.trim(), this.author.trim() || 'Presales & Satış');
    this.noteText = '';
    this.close();
  }
}
