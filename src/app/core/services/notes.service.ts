import { Injectable, inject, signal, computed } from '@angular/core';
import { CustomerService } from './customer.service';

export interface CustomerNote {
  id: string;
  customerId: string;
  author: string;
  text: string;
  createdAt: string; // ISO date string
  formattedDate: string; // e.g. "01.10.2026 14:30"
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private customerService = inject(CustomerService);
  private notesMapSignal = signal<Record<string, CustomerNote[]>>(this.loadNotesFromStorage());

  readonly currentCustomerNotes = computed(() => {
    const custId = this.customerService.activeCustomer()?.id || 'default';
    const list = this.notesMapSignal()[custId] || [];
    // Sort descending by date (newest first)
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  readonly currentCustomerNotesCount = computed(() => {
    return this.currentCustomerNotes().length;
  });

  private getStorageKey(): string {
    return 'taskforce_customer_notes_all';
  }

  private loadNotesFromStorage(): Record<string, CustomerNote[]> {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read customer notes from storage:', e);
    }
    return this.getInitialNotes();
  }

  private getInitialNotes(): Record<string, CustomerNote[]> {
    const now = new Date();
    const dStr = this.formatDate(now);
    return {
      'cust-1': [
        {
          id: 'note-1',
          customerId: 'cust-1',
          author: 'Presales Çözüm Mimarı',
          text: 'Müşteri mevcut ECC sisteminden RISE with SAP Private Cloud ortamına Brownfield yaklaşımı ile geçişe sıcak bakıyor. DVM analizi tamamlandıktan sonra cutover provası yapılacak.',
          createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
          formattedDate: this.formatDate(new Date(now.getTime() - 86400000 * 2))
        },
        {
          id: 'note-2',
          customerId: 'cust-1',
          author: 'Satış Yöneticisi',
          text: 'FUE lisans tasarruf simülasyonu CFO ve CIO ile paylaşıldı. 5 yıllık toplam TCO avantajında %24 tasarruf öngörüsü onaylandı.',
          createdAt: new Date(now.getTime() - 86400000).toISOString(),
          formattedDate: this.formatDate(new Date(now.getTime() - 86400000))
        },
        {
          id: 'note-3',
          customerId: 'cust-1',
          author: 'Teknik Danışman',
          text: 'Z-tablo ve custom kod envanterinde 42 adet program Clean Core prensipleri gereğince BTP üzerinde side-by-side genişletmeye aday gösterildi.',
          createdAt: now.toISOString(),
          formattedDate: dStr
        }
      ]
    };
  }

  private saveToStorage(data: Record<string, CustomerNote[]>): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
      this.notesMapSignal.set({ ...data });
    } catch (e) {
      console.warn('Could not save customer notes to storage:', e);
    }
  }

  formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  addNote(text: string, author?: string): CustomerNote {
    const custId = this.customerService.activeCustomer()?.id || 'default';
    const now = new Date();
    const newNote: CustomerNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      customerId: custId,
      author: (author && author.trim()) ? author.trim() : 'Satış & Presales Ekibi',
      text: text.trim(),
      createdAt: now.toISOString(),
      formattedDate: this.formatDate(now)
    };

    const currentMap = { ...this.notesMapSignal() };
    const custNotes = currentMap[custId] ? [...currentMap[custId]] : [];
    custNotes.unshift(newNote);
    currentMap[custId] = custNotes;

    this.saveToStorage(currentMap);
    return newNote;
  }

  deleteNote(id: string): void {
    const custId = this.customerService.activeCustomer()?.id || 'default';
    const currentMap = { ...this.notesMapSignal() };
    if (!currentMap[custId]) return;

    currentMap[custId] = currentMap[custId].filter(n => n.id !== id);
    this.saveToStorage(currentMap);
  }

  updateNote(id: string, newText: string, author?: string): void {
    const custId = this.customerService.activeCustomer()?.id || 'default';
    const currentMap = { ...this.notesMapSignal() };
    if (!currentMap[custId]) return;

    const index = currentMap[custId].findIndex(n => n.id === id);
    if (index !== -1) {
      const existing = currentMap[custId][index];
      currentMap[custId][index] = {
        ...existing,
        text: newText.trim(),
        author: author !== undefined ? author.trim() : existing.author
      };
      this.saveToStorage(currentMap);
    }
  }
}
