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

export const DEFAULT_MODULE_CARDS: ModuleCard[] = [
  {
    id: 'def-mm-1',
    category: 'MM Modülü',
    title: 'Satıcı & Malzeme Ana Veri Entegrasyonu',
    severity: 'Kritik',
    status: 'Geliştirme',
    bullets: [
      'ZMM_CREATE_VENDOR programı revize edilmeli, Business Partner (BP) dönüşümü sağlanmalı',
      'Malzeme ana verilerinde tekilleştirme ve arşivleme uygulanmalı'
    ],
    footerNote: 'Öncelikli Eylem (Tahmini Süre: 2 Ay)'
  },
  {
    id: 'def-fi-1',
    category: 'FI Modülü',
    title: 'Paralel Para Birimleri & New G/L',
    severity: 'Yüksek',
    status: 'Standart',
    bullets: [
      'USD ve EUR için paralel para birimi yapılandırması yapılmalı',
      'Universal Journal (ACDOCA) defter entegrasyonu tamamlanmalı'
    ],
    footerNote: 'S/4HANA Hazır'
  },
  {
    id: 'def-co-1',
    category: 'CO Modülü',
    title: 'Kâr Merkezi & Masraf Dağıtım Mimarisi',
    severity: 'Kritik',
    status: 'Uygun Değil',
    bullets: [
      'Kâr merkezi türetim kuralları gözden geçirilmeli',
      'Yapay kâr merkezleri temizlenmeli ve CO-PA uyarlanmalı'
    ],
    footerNote: 'Öncelikli Eylem'
  },
  {
    id: 'def-sd-1',
    category: 'SD Modülü',
    title: 'Sipariş & Fiyatlandırma Şemaları',
    severity: 'Orta',
    status: 'Fırsat',
    bullets: [
      'Vistex / standart fiyatlandırma koşulları S/4HANA ile uyumlu hale getirilmeli',
      'Gelişmiş kullanılabilirlik kontrolü (aATP) aktive edilmeli'
    ],
    footerNote: 'İyileştirme Fırsatı'
  },
  {
    id: 'def-pp-1',
    category: 'PP Modülü',
    title: 'Üretim Planlama & MRP Live Entegrasyonu',
    severity: 'Yüksek',
    status: 'Geliştirme',
    bullets: [
      'Klasik MRP mantığından In-Memory MRP Live mimarisine geçiş planlanmalı',
      'Kapasite planlama darboğazları giderilmeli'
    ],
    footerNote: 'Dönüşüm Avantajı'
  },
  {
    id: 'def-qm-1',
    category: 'QM Modülü',
    title: 'Kalite Güvence & Denetim Lotları',
    severity: 'Orta',
    status: 'Standart',
    bullets: [
      'Giriş kalite kontrol ve numune alma süreçleri standartlaştırılmalı',
      'Kalite sertifika entegrasyonları dijitalleştirilmeli'
    ],
    footerNote: 'Standart Süreç'
  },
  {
    id: 'def-pm-1',
    category: 'PM Modülü',
    title: 'Koruyucu Bakım & Varlık Yönetimi',
    severity: 'Düşük',
    status: 'Önerilen',
    bullets: [
      'Arıza bildirimleri ve kestirimci bakım iş akışları aktive edilmeli'
    ],
    footerNote: 'S/4HANA Uyumlu'
  },
  {
    id: 'def-basis-1',
    category: 'SAP Basis & Mimari',
    title: 'HANA Bellek & Altyapı Optimizasyonu',
    severity: 'Kritik',
    status: 'Uygun Değil',
    bullets: [
      'Atıl veri arşivleme (DVM) ile HANA bellek ihtiyacı %40 düşürülmeli',
      'NetWeaver sürümü S/4HANA Private Cloud Edition seviyesine yükseltilmeli'
    ],
    footerNote: 'Kritik Eylem'
  },
  {
    id: 'def-po-1',
    category: 'Entegrasyon (PO/CPI)',
    title: 'Legacy Arayüzlerin BTP Suite Taşınması',
    severity: 'Yüksek',
    status: 'Geliştirme',
    bullets: [
      'SAP PO 7.5 servisleri 2027 EoS öncesi BTP Integration Suite üzerine taşınmalı'
    ],
    footerNote: '2027 Öncesi Tamamlanmalı'
  },
  {
    id: 'def-hr-1',
    category: 'HR / SuccessFactors',
    title: 'Bordro & Çalışan Self-Servis Portali',
    severity: 'Orta',
    status: 'Fırsat',
    bullets: [
      'Fiori tabanlı izin ve masraf onay akışları devreye alınmalı'
    ],
    footerNote: 'Kullanıcı Deneyimi'
  }
];

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
      if (saved === null) {
        // Fallback to legacy key
        saved = localStorage.getItem('taskforce_modules_' + custId);
      }
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeStoredCards(parsed);
        this.cardsList.set(normalized);
        return;
      }
    } catch (e) {
      console.warn('Failed to load modules from storage', e);
    }
    // Only the demo customer (cust-sigorta) gets default cards if none are saved; all other customers start empty
    if (custId === 'cust-sigorta') {
      this.cardsList.set(DEFAULT_MODULE_CARDS);
    } else {
      this.cardsList.set([]);
    }
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
        localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify([]));
        localStorage.removeItem('taskforce_modules_' + id);
      } catch (e) {}
    }
    this.cardsList.set([]);
  }
}
