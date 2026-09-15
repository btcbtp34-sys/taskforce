import { Injectable, signal, inject, effect, computed } from '@angular/core';
import { CustomerService } from './customer.service';
import * as XLSX from 'xlsx';

export type CardSeverity = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';

export type CardStatus = 
  | 'Geliştirme' 
  | 'Standart' 
  | 'Fırsat' 
  | 'Uygun Değil' 
  | 'Kısmen Uygun' 
  | 'Önerilen';

export interface ModuleCard {
  id: string;
  category: string; // e.g. "MM Modülü", "FI Modülü", "Genel Bulgular", "SD Modülü" etc.
  title: string;
  severity: CardSeverity;
  status: CardStatus;
  bullets: string[];
  footerNote?: string;
  isFullWidth?: boolean;
}

const STORAGE_PREFIX = 'taskforce_modules_cards_';

export const VALID_SEVERITIES: CardSeverity[] = ['Düşük', 'Orta', 'Yüksek', 'Kritik'];
export const VALID_STATUSES: CardStatus[] = ['Geliştirme', 'Standart', 'Fırsat', 'Uygun Değil', 'Kısmen Uygun', 'Önerilen'];

export const COMMON_CATEGORIES: string[] = [
  'Genel Bulgular',
  'MM Modülü',
  'FI Modülü',
  'CO Modülü',
  'SD Modülü',
  'PP Modülü',
  'QM Modülü',
  'PM Modülü',
  'HR / SuccessFactors',
  'SAP Basis & Mimari',
  'Entegrasyon (PO/CPI)'
];

export function normalizeCardSeverity(val: any): CardSeverity {
  const str = String(val || '').trim();
  const lower = str.toLowerCase();
  if (lower.includes('kritik') || lower.includes('critical')) return 'Kritik';
  if (lower.includes('yüksek') || lower.includes('yuksek') || lower.includes('high')) return 'Yüksek';
  if (lower.includes('orta') || lower.includes('medium') || lower.includes('mid')) return 'Orta';
  if (lower.includes('düşük') || lower.includes('dusuk') || lower.includes('low')) return 'Düşük';
  return 'Orta';
}

export function normalizeCardStatus(val: any): CardStatus {
  const str = String(val || '').trim();
  const lower = str.toLowerCase();
  if (lower.includes('uygun değil') || lower.includes('uygun degil') || lower.includes('incompatible')) return 'Uygun Değil';
  if (lower.includes('kısmen') || lower.includes('kismen') || lower.includes('partial')) return 'Kısmen Uygun';
  if (lower.includes('önerilen') || lower.includes('onerilen') || lower.includes('recommended')) return 'Önerilen';
  if (lower.includes('fırsat') || lower.includes('firsat') || lower.includes('opportunity')) return 'Fırsat';
  if (lower.includes('geliştirme') || lower.includes('gelistirme') || lower.includes('development') || lower.includes('custom')) return 'Geliştirme';
  if (lower.includes('standart') || lower.includes('standard')) return 'Standart';
  return 'Standart';
}

export function normalizeCard(c: any): ModuleCard {
  return {
    id: c.id || ('card-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
    category: (c.category || c.kategori || 'Genel Bulgular').trim(),
    title: (c.title || c.baslik || '').trim(),
    severity: normalizeCardSeverity(c.severity || c.onem),
    status: normalizeCardStatus(c.status || c.durum || c.severity),
    bullets: Array.isArray(c.bullets) 
      ? c.bullets 
      : (c.bullets ? String(c.bullets).split(/\r?\n|•|;/).map(b => b.trim()).filter(Boolean) : []),
    footerNote: c.footerNote || c.dipnot,
    isFullWidth: !!c.isFullWidth
  };
}

function normalizeStoredCards(data: any): ModuleCard[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    // If old format with module slides
    if (data.length > 0 && 'slides' in data[0]) {
      const flat: ModuleCard[] = [];
      for (const m of data) {
        const catName = m.name || m.key || 'Genel Bulgular';
        for (const s of (m.slides || [])) {
          for (const c of (s.cards || [])) {
            flat.push({
              ...normalizeCard(c),
              category: c.category || catName
            });
          }
        }
      }
      return flat;
    }
    // Flat ModuleCard array
    return data.map(c => normalizeCard(c));
  }
  return [];
}

export function downloadModulesTemplate(): void {
  const wb = XLSX.utils.book_new();
  const headers = [
    'Kategori',
    'Başlık',
    'Önem Derecesi',
    'Durum',
    'Madde ve Detaylar (Her satır bir madde)',
    'Dipnot / Tahmini Süre (Opsiyonel)'
  ];

  const sampleRows = [
    headers,
    [
      'Genel Bulgular',
      'Business Partner Dönüşümü',
      'Kritik',
      'Standart',
      'MM ve FI satıcı/müşteri ana veri entegrasyonları BP modeline taşınmalı\nZ programları yeni mimariye uyarlanmalı',
      'Tahmini Süre: 4 Ay'
    ],
    [
      'MM Modülü',
      'Satıcı Ana Veri Entegrasyonu',
      'Yüksek',
      'Geliştirme',
      'ZMM_CREATE_VENDOR programı revize edilecek\nPerformans optimizasyonu sağlanacak',
      'Tahmini Süre: 2 Ay'
    ],
    [
      'FI Modülü',
      'Paralel Para Birimleri',
      'Orta',
      'Fırsat',
      'USD ve EUR için paralel para birimi yapılandırması yapılmalı\nDövizli mizan raporlaması devreye alınmalı',
      'Düşük Efor'
    ],
    [
      'CO Modülü',
      'Kâr Merkezi Ana Veri Kalitesi',
      'Kritik',
      'Uygun Değil',
      'Kâr merkezi türetim kuralları gözden geçirilmeli\nYapay kâr merkezleri temizlenmeli',
      'Öncelikli'
    ],
    [
      'SD Modülü',
      'Fiyatlandırma Şemaları & Koşul Teknikleri',
      'Düşük',
      'Önerilen',
      'Vistex / standart fiyatlandırma koşulları S/4HANA ile uyumlu hale getirilmeli',
      'Opsiyonel'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 32 },
    { wch: 16 },
    { wch: 16 },
    { wch: 50 },
    { wch: 26 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'SAP_Modul_Degerlendirme');
  XLSX.writeFile(wb, 'SAP_Uygulamalari_Sablonu.xlsx');
}

@Injectable({
  providedIn: 'root'
})
export class ModullerService {
  private customerService = inject(CustomerService);

  private cardsList = signal<ModuleCard[]>([]);
  readonly cards = this.cardsList.asReadonly();

  readonly totalCardsCount = computed(() => this.cardsList().length);
  readonly hasUploadedData = computed(() => this.cardsList().length > 0);

  // Distinct categories present in active customer's cards
  readonly existingCategories = computed(() => {
    const cats = new Set<string>();
    for (const c of this.cardsList()) {
      const trimmed = (c.category || '').trim();
      if (trimmed) cats.add(trimmed);
    }
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'tr'));
  });

  constructor() {
    effect(() => {
      const custId = this.customerService.activeCustomerId();
      this.loadForCustomer(custId);
    });
  }

  private loadForCustomer(custId: string): void {
    if (!custId) {
      this.cardsList.set([]);
      return;
    }
    try {
      // First check new storage key
      let saved = localStorage.getItem(STORAGE_PREFIX + custId);
      if (!saved) {
        // Fallback to legacy key
        saved = localStorage.getItem('taskforce_modules_' + custId);
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeStoredCards(parsed);
        this.cardsList.set(normalized);
        return;
      }
    } catch (e) {
      console.warn('Failed to load modules from storage', e);
    }
    this.cardsList.set([]);
  }

  private saveCurrentCustomerData(): void {
    try {
      const custId = this.customerService.activeCustomerId();
      if (custId) {
        localStorage.setItem(STORAGE_PREFIX + custId, JSON.stringify(this.cardsList()));
      }
    } catch (e) {
      console.warn('Failed to save modules to storage', e);
    }
  }

  addCard(card: ModuleCard): void {
    this.cardsList.update(list => [...list, card]);
    this.saveCurrentCustomerData();
  }

  updateCard(updatedCard: ModuleCard): void {
    this.cardsList.update(list =>
      list.map(c => c.id === updatedCard.id ? updatedCard : c)
    );
    this.saveCurrentCustomerData();
  }

  deleteCard(cardId: string): void {
    this.cardsList.update(list => list.filter(c => c.id !== cardId));
    this.saveCurrentCustomerData();
  }

  importCardsFromExcel(cards: ModuleCard[]): number {
    if (!cards || cards.length === 0) return 0;
    this.cardsList.update(current => {
      return [...current, ...cards];
    });
    this.saveCurrentCustomerData();
    return cards.length;
  }

  clearCustomerModules(custId?: string): void {
    const id = custId || this.customerService.activeCustomerId();
    if (id) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + id);
        localStorage.removeItem('taskforce_modules_' + id);
      } catch (e) {}
    }
    this.cardsList.set([]);
  }
}
