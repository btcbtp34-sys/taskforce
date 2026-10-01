import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuickToolsService } from '../../../core/services/quick-tools.service';
import { NotesService, CustomerNote } from '../../../core/services/notes.service';
import { CustomerService } from '../../../core/services/customer.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-quick-notes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    @if (quickToolsService.isNotesOpen()) {
      <div class="modal-backdrop" (click)="close()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-title-box">
              <div class="icon-circle">
                <app-icon name="file-text" [size]="18" color="#0284c7"></app-icon>
              </div>
              <div>
                <h3>Yönetici ve Presales Notları</h3>
                <span class="customer-tag">
                  {{ customerService.activeCustomer().name }} • Satır Satır Yorum & Aksiyon Takibi
                </span>
              </div>
            </div>
            <button class="close-btn" (click)="close()" title="Kapat">
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <!-- Add Note Form Box -->
          <div class="add-note-box">
            <div class="author-row">
              <label class="author-label">
                <app-icon name="user" [size]="13" color="#64748b"></app-icon>
                <span>Yazan / Ekip:</span>
              </label>
              <input 
                type="text" 
                class="author-input" 
                [(ngModel)]="newAuthor" 
                placeholder="Presales Çözüm Mimarı" />
            </div>

            <div class="input-row">
              <textarea 
                class="note-textarea" 
                [(ngModel)]="newNoteText" 
                placeholder="Yeni bir not veya stratejik yorum yazın... (Örn: Müşteri Brownfield geçişine onay verdi, cutover tarihi planlanıyor.)"
                rows="3"
                (keydown.ctrl.enter)="saveNewNote()"
              ></textarea>
            </div>

            <div class="action-row">
              <span class="hint-text">İpucu: <strong>Ctrl + Enter</strong> ile hızlı ekleyebilirsiniz. Her not anlık tarih ve saatle etiketlenir.</span>
              <button 
                class="btn-add" 
                [disabled]="!newNoteText.trim()" 
                (click)="saveNewNote()">
                <app-icon name="plus" [size]="15" color="#ffffff"></app-icon>
                <span>Not Ekle</span>
              </button>
            </div>
          </div>

          <!-- Notes Stream / List -->
          <div class="notes-stream-container">
            <div class="stream-header">
              <span class="stream-title">Kayıtlı Yorum ve Notlar ({{ notesService.currentCustomerNotesCount() }})</span>
            </div>

            @if (notesService.currentCustomerNotes().length === 0) {
              <div class="empty-state">
                <app-icon name="file-text" [size]="32" color="#94a3b8"></app-icon>
                <p class="empty-title">Henüz eklenmiş bir not bulunmuyor</p>
                <p class="empty-desc">Bu müşteri için yukarıdaki alandan tarih ve saat damgalı ilk notunuzu ekleyebilirsiniz.</p>
              </div>
            } @else {
              <div class="notes-list">
                @for (note of notesService.currentCustomerNotes(); track note.id) {
                  <div class="note-card">
                    <!-- Note Header: Meta (Date & Author) -->
                    <div class="note-card-header">
                      <div class="meta-left">
                        <span class="timestamp-badge">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {{ note.formattedDate }}
                        </span>
                        <span class="author-badge">
                          <app-icon name="user" [size]="11" color="#475569"></app-icon>
                          {{ note.author }}
                        </span>
                      </div>

                      <div class="note-actions">
                        @if (editingNoteId === note.id) {
                          <button class="btn-icon-action save" (click)="saveEdit(note.id)" title="Kaydet">
                            <app-icon name="check" [size]="14" color="#059669"></app-icon>
                          </button>
                          <button class="btn-icon-action cancel" (click)="cancelEdit()" title="İptal">
                            <app-icon name="x" [size]="14" color="#64748b"></app-icon>
                          </button>
                        } @else {
                          <button class="btn-icon-action edit" (click)="startEdit(note)" title="Düzenle">
                            <app-icon name="edit" [size]="13" color="#64748b"></app-icon>
                          </button>
                          <button class="btn-icon-action delete" (click)="deleteNote(note.id)" title="Sil">
                            <app-icon name="trash" [size]="13" color="#ef4444"></app-icon>
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Note Body -->
                    @if (editingNoteId === note.id) {
                      <div class="edit-box">
                        <textarea 
                          class="edit-textarea" 
                          [(ngModel)]="editingText" 
                          rows="3"></textarea>
                      </div>
                    } @else {
                      <div class="note-text">{{ note.text }}</div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <span class="footer-info">Notlar tarayıcıda otomatik saklanır ve Yönetici Özeti ile tam senkron çalışır.</span>
            <button class="btn-close-footer" (click)="close()">Kapat</button>
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
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      z-index: 1050;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-panel {
      width: 100%;
      max-width: 580px;
      height: 100%;
      background: #ffffff;
      box-shadow: -8px 0 28px rgba(0, 0, 0, 0.16);
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;

      .header-title-box {
        display: flex;
        align-items: center;
        gap: 0.85rem;

        .icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #e0f2fe;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        h3 {
          margin: 0;
          font-size: 1.08rem;
          font-weight: 700;
          color: #0f172a;
        }

        .customer-tag {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 500;
        }
      }

      .close-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: #64748b;
        padding: 0.4rem;
        border-radius: 6px;
        transition: background 0.15s;

        &:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      }
    }

    .add-note-box {
      padding: 1.2rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .author-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .author-label {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: #475569;
        }

        .author-input {
          flex: 1;
          padding: 0.35rem 0.65rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.82rem;
          color: #1e293b;
          transition: border-color 0.15s;

          &:focus {
            outline: none;
            border-color: #0284c7;
            box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
          }
        }
      }

      .note-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 0.65rem 0.85rem;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.86rem;
        color: #1e293b;
        resize: vertical;
        font-family: inherit;
        line-height: 1.45;
        transition: border-color 0.15s;

        &:focus {
          outline: none;
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }
      }

      .action-row {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .hint-text {
          font-size: 0.72rem;
          color: #64748b;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: #0284c7;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;

          &:hover:not(:disabled) {
            background: #0369a1;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }

    .notes-stream-container {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem 1.5rem;
      background: #f8fafc;

      .stream-header {
        margin-bottom: 0.85rem;
        .stream-title {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #64748b;
        }
      }
    }

    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;

      .empty-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #334155;
        margin: 0.85rem 0 0.35rem;
      }

      .empty-desc {
        font-size: 0.8rem;
        color: #64748b;
        max-width: 320px;
        margin: 0;
      }
    }

    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .note-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.95rem 1.1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.15s;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      }

      .note-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.6rem;

        .meta-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;

          .timestamp-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.2rem 0.5rem;
            background: #f1f5f9;
            color: #334155;
            border-radius: 4px;
            font-size: 0.74rem;
            font-weight: 600;
          }

          .author-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.74rem;
            color: #64748b;
            font-weight: 500;
          }
        }

        .note-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;

          .btn-icon-action {
            background: transparent;
            border: none;
            padding: 0.25rem;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s;

            &:hover {
              background: #f1f5f9;
            }

            &.delete:hover {
              background: #fee2e2;
            }
          }
        }
      }

      .note-text {
        font-size: 0.86rem;
        line-height: 1.5;
        color: #1e293b;
        white-space: pre-wrap;
      }

      .edit-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 0.5rem;
        border: 1px solid #0284c7;
        border-radius: 6px;
        font-size: 0.85rem;
        font-family: inherit;
        line-height: 1.45;
      }
    }

    .modal-footer {
      padding: 0.85rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .footer-info {
        font-size: 0.74rem;
        color: #64748b;
      }

      .btn-close-footer {
        padding: 0.45rem 1rem;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.82rem;
        font-weight: 600;
        color: #334155;
        cursor: pointer;

        &:hover {
          background: #e2e8f0;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `]
})
export class QuickNotesModalComponent {
  quickToolsService = inject(QuickToolsService);
  notesService = inject(NotesService);
  customerService = inject(CustomerService);

  newNoteText = '';
  newAuthor = 'Satış & Presales Ekibi';

  editingNoteId: string | null = null;
  editingText = '';

  close(): void {
    this.quickToolsService.closeNotes();
    this.cancelEdit();
  }

  saveNewNote(): void {
    if (!this.newNoteText.trim()) return;
    this.notesService.addNote(this.newNoteText, this.newAuthor);
    this.newNoteText = '';
  }

  deleteNote(id: string): void {
    if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
      this.notesService.deleteNote(id);
    }
  }

  startEdit(note: CustomerNote): void {
    this.editingNoteId = note.id;
    this.editingText = note.text;
  }

  cancelEdit(): void {
    this.editingNoteId = null;
    this.editingText = '';
  }

  saveEdit(id: string): void {
    if (this.editingText.trim()) {
      this.notesService.updateNote(id, this.editingText);
    }
    this.cancelEdit();
  }
}
