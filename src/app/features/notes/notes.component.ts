import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotesService, CustomerNote } from '../../core/services/notes.service';
import { CustomerService } from '../../core/services/customer.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="notes-page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="badge-row">
            <span class="customer-badge">{{ customerService.activeCustomer().name }}</span>
            <span class="section-tag">Hızlı Araçlar</span>
            <span class="type-tag">Zaman Damgalı Not Yöneticisi</span>
          </div>
          <h1 class="page-title">Notlar & Stratejik Yorumlar</h1>
          <p class="page-subtitle">
            Müşteri analiz, satış ve presales süreçlerine dair satır satır tarih ve saat damgalı yorum ve not takibi
          </p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-primary btn-add-note" (click)="openAddModal()">
            <app-icon name="plus" [size]="16" color="#ffffff"></app-icon>
            <span>+ Yeni Not / Yorum Ekle</span>
          </button>

          <a routerLink="/reports" class="btn btn-secondary">
            <app-icon name="file-text" [size]="16" color="#059669"></app-icon>
            <span>Yönetici Özetine Git</span>
          </a>
        </div>
      </div>

      <!-- KPI Summary Row -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-title">Toplam Kayıtlı Not</span>
            <div class="icon-circle bg-blue">
              <app-icon name="file-text" [size]="18" color="#0284c7"></app-icon>
            </div>
          </div>
          <div class="kpi-val text-blue">{{ notesService.currentCustomerNotesCount() }}</div>
          <div class="kpi-sub">{{ customerService.activeCustomer().name }} Müşterisi</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-title">Son Not Zamanı</span>
            <div class="icon-circle bg-emerald">
              <app-icon name="check" [size]="18" color="#059669"></app-icon>
            </div>
          </div>
          <div class="kpi-val text-emerald">{{ latestNoteDate() }}</div>
          <div class="kpi-sub">En son eklenen güncel kayıt</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-title">Entegrasyon Durumu</span>
            <div class="icon-circle bg-purple">
              <app-icon name="sparkles" [size]="18" color="#7e22ce"></app-icon>
            </div>
          </div>
          <div class="kpi-val text-purple">Senkron</div>
          <div class="kpi-sub">Yönetici Özeti ve PDF Çıktısıyla Tam Uyumlu</div>
        </div>
      </div>

      <!-- Main Layout: Full-Width Stream of Notes -->
      <div class="stream-card">
        <div class="stream-header-bar">
          <div class="sh-left">
            <div class="title-with-badge">
              <h3>Kayıtlı Yorum ve Not Akışı</h3>
              <span class="notes-badge">{{ filteredNotes().length }} Not</span>
            </div>
            <span class="sh-sub">Her not kronolojik olarak tarih ve saat damgasıyla listelenir.</span>
          </div>

          <div class="sh-right">
            <!-- Search box -->
            <div class="search-box">
              <app-icon name="search" [size]="14" color="#94a3b8"></app-icon>
              <input 
                type="text" 
                class="search-input" 
                [(ngModel)]="searchQuery" 
                placeholder="Notlarda filtrele / ara..." 
              />
            </div>

            <!-- Quick Add Button -->
            <button type="button" class="btn-quick-add" (click)="openAddModal()">
              <app-icon name="plus" [size]="14" color="#ffffff"></app-icon>
              <span>Yeni Not Ekle</span>
            </button>
          </div>
        </div>

        @if (filteredNotes().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-box">
              <app-icon name="file-text" [size]="36" color="#94a3b8"></app-icon>
            </div>
            <h4>Henüz Eklenmiş Not Bulunmuyor</h4>
            <p>Bu müşteri için sağ üstteki buton veya aşağıdaki buton üzerinden zaman damgalı ilk notunuzu ekleyebilirsiniz.</p>
            <button type="button" class="btn btn-primary btn-empty-add" (click)="openAddModal()">
              <app-icon name="plus" [size]="16" color="#ffffff"></app-icon>
              <span>+ Yeni Not / Yorum Ekle</span>
            </button>
          </div>
        } @else {
          <div class="timeline-container">
            @for (note of filteredNotes(); track note.id) {
              <div class="note-timeline-row">
                <div class="timeline-spine">
                  <div class="spine-dot"></div>
                  <div class="spine-line"></div>
                </div>

                <div class="note-item-card">
                  <!-- Note Meta Bar -->
                  <div class="note-item-header">
                    <div class="item-meta">
                      <span class="time-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {{ note.formattedDate }}
                      </span>
                      <span class="author-tag">
                        <app-icon name="user" [size]="12" color="#64748b"></app-icon>
                        {{ note.author }}
                      </span>
                    </div>

                    <div class="item-actions">
                      @if (editingNoteId === note.id) {
                        <button class="action-btn save" (click)="saveEdit(note.id)" title="Değişikliği Kaydet">
                          <app-icon name="check" [size]="14" color="#059669"></app-icon>
                          <span>Kaydet</span>
                        </button>
                        <button class="action-btn cancel" (click)="cancelEdit()" title="İptal">
                          <app-icon name="x" [size]="14" color="#64748b"></app-icon>
                        </button>
                      } @else {
                        <button class="action-btn edit" (click)="startEdit(note)" title="Düzenle">
                          <app-icon name="edit" [size]="13" color="#64748b"></app-icon>
                          <span>Düzenle</span>
                        </button>
                        <button class="action-btn delete" (click)="deleteNote(note.id)" title="Sil">
                          <app-icon name="trash" [size]="13" color="#ef4444"></app-icon>
                          <span>Sil</span>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Note Body -->
                  @if (editingNoteId === note.id) {
                    <div class="edit-area">
                      <textarea 
                        class="edit-textarea" 
                        rows="3" 
                        [(ngModel)]="editingText"></textarea>
                    </div>
                  } @else {
                    <div class="note-body-text">{{ note.text }}</div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- ADD NOTE POP-UP MODAL -->
      @if (isAddModalOpen()) {
        <div class="modal-backdrop" (click)="closeAddModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-title-box">
                <div class="icon-circle-modal">
                  <app-icon name="plus" [size]="18" color="#0284c7"></app-icon>
                </div>
                <div>
                  <h3>Yeni Not / Stratejik Yorum Ekle</h3>
                  <span class="modal-sub">{{ customerService.activeCustomer().name }} • Satır Satır Zaman Damgalı Kayıt</span>
                </div>
              </div>
              <button class="btn-close-modal" (click)="closeAddModal()" title="Kapat">
                <app-icon name="x" [size]="18"></app-icon>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
              <div class="time-preview-banner">
                <div class="tp-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <span>Kayıt Zamanı (Otomatik Atanır): <strong>{{ currentTimeStr() }}</strong></span>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <app-icon name="user" [size]="13" color="#64748b"></app-icon>
                  <span>Yazan / Ekip Adı:</span>
                </label>
                <input 
                  type="text" 
                  class="form-input" 
                  [(ngModel)]="newAuthor" 
                  placeholder="Örn: Satış & Presales Çözüm Mimarı" 
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <app-icon name="file-text" [size]="13" color="#64748b"></app-icon>
                  <span>Yorum veya Not Metni:</span>
                </label>
                <textarea 
                  class="form-textarea" 
                  rows="4" 
                  [(ngModel)]="newNoteText" 
                  (keydown.ctrl.enter)="saveNewNote()"
                  placeholder="Müşteri görüşmesi, mimari kararlar veya stratejik adımları buraya yazınız... (Örn: Müşteri Brownfield geçişine karar verdi, Q4 cutover provası yapılacak.)"
                ></textarea>
              </div>

              <span class="ctrl-hint">İpucu: Hızlı kaydetmek için <strong>Ctrl + Enter</strong> tuş kombinasyonunu kullanabilirsiniz.</span>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button class="btn btn-cancel" (click)="closeAddModal()">Vazgeç</button>
              <button 
                class="btn btn-primary" 
                [disabled]="!newNoteText.trim()" 
                (click)="saveNewNote()">
                <app-icon name="check" [size]="15" color="#ffffff"></app-icon>
                <span>Notu Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .notes-page-container {
      padding: 1.75rem 2.25rem;
      background: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* HEADER */
    .page-header {
      background: #ffffff;
      padding: 1.35rem 1.65rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;

      .badge-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.35rem;

        .customer-badge {
          padding: 0.2rem 0.6rem;
          background: #e0f2fe;
          color: #0284c7;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 700;
        }

        .section-tag {
          padding: 0.2rem 0.55rem;
          background: #f1f5f9;
          color: #475569;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
        }

        .type-tag {
          padding: 0.2rem 0.55rem;
          background: #ecfdf5;
          color: #059669;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
        }
      }

      .page-title {
        margin: 0 0 0.25rem;
        font-size: 1.45rem;
        font-weight: 800;
        color: #0f172a;
      }

      .page-subtitle {
        margin: 0;
        font-size: 0.84rem;
        color: #64748b;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
    }

    /* GLOBAL BUTTON STYLES */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1.15rem;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;

      &.btn-primary {
        background: #0284c7;
        border: 1px solid #0284c7;
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
        &:hover:not(:disabled) {
          background: #0369a1;
          border-color: #0369a1;
          box-shadow: 0 4px 10px rgba(2, 132, 199, 0.35);
        }
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.btn-secondary {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        color: #334155;
        &:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
        }
      }
    }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1.1rem 1.35rem;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);

        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.4rem;

          .kpi-title {
            font-size: 0.78rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .icon-circle {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;

            &.bg-blue { background: #e0f2fe; }
            &.bg-emerald { background: #ecfdf5; }
            &.bg-purple { background: #f3e8ff; }
          }
        }

        .kpi-val {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          margin-bottom: 0.2rem;

          &.text-blue { color: #0284c7; }
          &.text-emerald { color: #059669; }
          &.text-purple { color: #7e22ce; }
        }

        .kpi-sub {
          font-size: 0.74rem;
          color: #64748b;
        }
      }
    }

    /* STREAM CARD (FULL WIDTH) */
    .stream-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
      padding: 1.35rem 1.65rem;
      min-height: 500px;
      display: flex;
      flex-direction: column;

      .stream-header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        padding-bottom: 1.1rem;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 1.25rem;

        .sh-left {
          .title-with-badge {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            margin-bottom: 0.2rem;

            h3 {
              margin: 0;
              font-size: 1.1rem;
              font-weight: 800;
              color: #0f172a;
            }

            .notes-badge {
              padding: 0.15rem 0.5rem;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              color: #166534;
              border-radius: 9999px;
              font-size: 0.74rem;
              font-weight: 700;
            }
          }

          .sh-sub {
            font-size: 0.76rem;
            color: #64748b;
          }
        }

        .sh-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .search-box {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.35rem 0.65rem;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;

            .search-input {
              border: none;
              background: transparent;
              font-size: 0.8rem;
              color: #1e293b;
              outline: none;
              width: 180px;
            }
          }

          .btn-quick-add {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.4rem 0.85rem;
            background: #0284c7;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s;

            &:hover {
              background: #0369a1;
            }
          }
        }
      }
    }

    /* TIMELINE */
    .timeline-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: calc(100vh - 290px);
      overflow-y: auto;
      padding-right: 8px;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-track {
        background: #f8fafc;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    }

    .note-timeline-row {
      display: flex;
      align-items: flex-start;
      gap: 1.15rem;

      .timeline-spine {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 0.6rem;

        .spine-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #0284c7;
          border: 2px solid #bae6fd;
        }

        .spine-line {
          width: 2px;
          flex: 1;
          min-height: 40px;
          background: #e2e8f0;
          margin-top: 4px;
        }
      }

      .note-item-card {
        flex: 1;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1.1rem 1.35rem;
        transition: all 0.15s;

        &:hover {
          background: #ffffff;
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .note-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;

          .item-meta {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;

            .time-badge {
              display: inline-flex;
              align-items: center;
              gap: 0.35rem;
              padding: 0.2rem 0.6rem;
              background: #e0f2fe;
              color: #0369a1;
              border-radius: 4px;
              font-size: 0.76rem;
              font-weight: 700;
            }

            .author-tag {
              display: inline-flex;
              align-items: center;
              gap: 0.3rem;
              font-size: 0.78rem;
              font-weight: 600;
              color: #475569;
            }
          }

          .item-actions {
            display: flex;
            align-items: center;
            gap: 0.4rem;

            .action-btn {
              display: inline-flex;
              align-items: center;
              gap: 0.25rem;
              background: transparent;
              border: 1px solid transparent;
              padding: 0.3rem 0.55rem;
              border-radius: 5px;
              cursor: pointer;
              font-size: 0.74rem;
              color: #475569;
              transition: all 0.15s;

              &:hover { background: #e2e8f0; }
              &.delete:hover { background: #fee2e2; color: #b91c1c; }
              &.save {
                background: #ecfdf5;
                color: #059669;
                border-color: #a7f3d0;
                font-weight: 700;
              }
            }
          }
        }

        .note-body-text {
          font-size: 0.9rem;
          color: #1e293b;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: break-word;
          max-height: 280px;
          overflow-y: auto;
          padding-right: 6px;

          &::-webkit-scrollbar {
            width: 5px;
          }
          &::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          &::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          &::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        }

        .edit-area {
          .edit-textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 0.65rem;
            border: 1px solid #0284c7;
            border-radius: 6px;
            font-size: 0.88rem;
            font-family: inherit;
            line-height: 1.45;
          }
        }
      }
    }

    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;

      .empty-icon-box {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: #e0f2fe;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.25rem;
      }

      h4 {
        margin: 0 0 0.4rem;
        font-size: 1.15rem;
        font-weight: 800;
        color: #0f172a;
      }

      p {
        margin: 0 0 1.25rem;
        font-size: 0.85rem;
        color: #64748b;
        max-width: 420px;
        line-height: 1.5;
      }

      .btn-empty-add {
        padding: 0.65rem 1.4rem;
        font-size: 0.88rem;
      }
    }

    /* POP-UP MODAL STYLES */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-dialog {
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .modal-title-box {
        display: flex;
        align-items: center;
        gap: 0.85rem;

        .icon-circle-modal {
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

        .modal-sub {
          font-size: 0.78rem;
          color: #64748b;
        }
      }

      .btn-close-modal {
        background: transparent;
        border: none;
        cursor: pointer;
        color: #64748b;
        padding: 0.35rem;
        border-radius: 6px;
        transition: background 0.15s;

        &:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
      }
    }

    .modal-body {
      padding: 1.35rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
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

      .time-preview-banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 0.85rem;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 6px;
        font-size: 0.78rem;
        color: #166534;

        .tp-icon {
          display: flex;
          align-items: center;
        }
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #475569;
        }

        .form-input {
          padding: 0.55rem 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.85rem;
          color: #1e293b;

          &:focus {
            outline: none;
            border-color: #0284c7;
            box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
          }
        }

        .form-textarea {
          padding: 0.7rem 0.8rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.88rem;
          color: #1e293b;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
          min-height: 110px;
          max-height: 250px;
          overflow-y: auto;
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
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
          }
        }
      }

      .ctrl-hint {
        font-size: 0.74rem;
        color: #64748b;
      }
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.55rem 1.25rem;
        border-radius: 6px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;

        &.btn-cancel {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          &:hover { background: #f1f5f9; }
        }

        &.btn-primary {
          background: #0284c7;
          border: 1px solid #0284c7;
          color: #ffffff;
          &:hover:not(:disabled) { background: #0369a1; }
          &:disabled { opacity: 0.5; cursor: not-allowed; }
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
export class NotesComponent {
  notesService = inject(NotesService);
  customerService = inject(CustomerService);

  isAddModalOpen = signal<boolean>(false);

  newNoteText = '';
  newAuthor = 'Satış & Presales Ekibi';

  searchQuery = '';
  editingNoteId: string | null = null;
  editingText = '';

  currentTimeStr = computed(() => {
    return this.notesService.formatDate(new Date());
  });

  latestNoteDate = computed(() => {
    const notes = this.notesService.currentCustomerNotes();
    return notes.length > 0 ? notes[0].formattedDate : 'Henüz Not Yok';
  });

  filteredNotes = computed(() => {
    const list = this.notesService.currentCustomerNotes();
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(n => n.text.toLowerCase().includes(q) || n.author.toLowerCase().includes(q));
  });

  openAddModal(): void {
    this.newNoteText = '';
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  saveNewNote(): void {
    if (!this.newNoteText.trim()) return;
    this.notesService.addNote(this.newNoteText, this.newAuthor);
    this.newNoteText = '';
    this.closeAddModal();
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
