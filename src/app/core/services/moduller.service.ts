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
  title: string;
  severity: CardSeverity;
  status: CardStatus;
  bullets: string[];
  footerNote?: string;
  isFullWidth?: boolean;
}

export interface ModuleSlide {
  id: string;
  slideTag: string; // e.g. "FI MODÜLÜ — 1/2", "MM MODÜLÜ"
  mainTitle: string; // e.g. "Organizasyon Yapısı & Genel Muhasebe"
  cards: ModuleCard[];
}

export interface ModuleItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  slides: ModuleSlide[];
}

const STORAGE_PREFIX = 'taskforce_modules_';

export const VALID_SEVERITIES: CardSeverity[] = ['Düşük', 'Orta', 'Yüksek', 'Kritik'];
export const VALID_STATUSES: CardStatus[] = ['Geliştirme', 'Standart', 'Fırsat', 'Uygun Değil', 'Kısmen Uygun', 'Önerilen'];

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
    title: c.title || '',
    severity: normalizeCardSeverity(c.severity),
    status: normalizeCardStatus(c.status || c.severity),
    bullets: Array.isArray(c.bullets) ? c.bullets : (c.bullets ? [String(c.bullets)] : []),
    footerNote: c.footerNote,
    isFullWidth: !!c.isFullWidth
  };
}

const DEFAULT_EMPTY_MODULES: ModuleItem[] = [
  {
    id: 'genel-bulgular',
    key: 'genel-bulgular',
    name: 'Genel Bulgular',
    description: 'S/4HANA geçiş değerlendirmesi genel bulguları ve kritik öncelikler',
    icon: 'sparkles',
    slides: [
      {
        id: 'gb-1',
        slideTag: 'GENEL BULGULAR',
        mainTitle: 'Genel Bulgular',
        cards: []
      }
    ]
  },
  {
    id: 'mm-modulu',
    key: 'mm-modulu',
    name: 'MM Modülü',
    description: 'Satınalma & Malzeme Yönetimi geçiş değerlendirmesi ve program analizleri',
    icon: 'box',
    slides: [
      {
        id: 'mm-1',
        slideTag: 'MM MODÜLÜ',
        mainTitle: 'Satınalma & Malzeme Yönetimi — Geçiş Değerlendirmesi',
        cards: []
      }
    ]
  },
  {
    id: 'fi-modulu',
    key: 'fi-modulu',
    name: 'FI Modülü',
    description: 'Finansal Muhasebe, organizasyon yapısı, satıcı/müşteri muhasebesi ve kapanış',
    icon: 'coins',
    slides: [
      {
        id: 'fi-1',
        slideTag: 'FI MODÜLÜ',
        mainTitle: 'Organizasyon Yapısı & Genel Muhasebe',
        cards: []
      }
    ]
  },
  {
    id: 'co-modulu',
    key: 'co-modulu',
    name: 'CO Modülü',
    description: 'Maliyet Muhasebesi, kâr merkezi ve masraf yerleri ana veri kalitesi',
    icon: 'pie-chart',
    slides: [
      {
        id: 'co-1',
        slideTag: 'CO MODÜLÜ',
        mainTitle: 'Organizasyon Yapısı & Ana Veri Kalitesi',
        cards: []
      }
    ]
  }
];

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

  private modulesList = signal<ModuleItem[]>(this.getCleanModulesTemplate());
  readonly modules = this.modulesList.asReadonly();
  readonly activeModuleKey = signal<string>('genel-bulgular');

  readonly totalCardsCount = computed(() => {
    let count = 0;
    for (const m of this.modulesList()) {
      for (const s of m.slides) {
        count += (s.cards?.length || 0);
      }
    }
    return count;
  });

  readonly hasUploadedData = computed(() => this.totalCardsCount() > 0);

  constructor() {
    // Automatically load customer-specific cards when active customer changes
    effect(() => {
      const custId = this.customerService.activeCustomerId();
      this.loadForCustomer(custId);
    });
  }

  private getCleanModulesTemplate(): ModuleItem[] {
    return JSON.parse(JSON.stringify(DEFAULT_EMPTY_MODULES));
  }

  private loadForCustomer(custId: string) {
    if (!custId) {
      this.modulesList.set(this.getCleanModulesTemplate());
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + custId);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map((m: ModuleItem) => ({
            ...m,
            slides: (m.slides || []).map(s => ({
              ...s,
              cards: (s.cards || []).map(normalizeCard)
            }))
          }));
          this.modulesList.set(normalized);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load modules from storage', e);
    }
    this.modulesList.set(this.getCleanModulesTemplate());
  }

  private saveCurrentCustomerData(): void {
    try {
      const custId = this.customerService.activeCustomerId();
      if (custId) {
        localStorage.setItem(STORAGE_PREFIX + custId, JSON.stringify(this.modulesList()));
      }
    } catch (e) {
      console.warn('Failed to save modules to storage', e);
    }
  }

  selectModule(key: string) {
    this.activeModuleKey.set(key);
  }

  getModuleByKey(key: string): ModuleItem | undefined {
    return this.modulesList().find(m => m.key === key || m.id === key);
  }

  addSlide(moduleKey: string, slide: ModuleSlide) {
    this.modulesList.update(list =>
      list.map(m => {
        if (m.key === moduleKey) {
          return { ...m, slides: [...m.slides, slide] };
        }
        return m;
      })
    );
    this.saveCurrentCustomerData();
  }

  addCard(moduleKey: string, slideId: string, card: ModuleCard) {
    this.modulesList.update(list =>
      list.map(m => {
        if (m.key === moduleKey) {
          return {
            ...m,
            slides: m.slides.map(s => {
              if (s.id === slideId) {
                return { ...s, cards: [...s.cards, card] };
              }
              return s;
            })
          };
        }
        return m;
      })
    );
    this.saveCurrentCustomerData();
  }

  updateCard(moduleKey: string, slideId: string, updatedCard: ModuleCard) {
    this.modulesList.update(list =>
      list.map(m => {
        if (m.key === moduleKey) {
          return {
            ...m,
            slides: m.slides.map(s => {
              if (s.id === slideId) {
                return {
                  ...s,
                  cards: s.cards.map(c => c.id === updatedCard.id ? updatedCard : c)
                };
              }
              return s;
            })
          };
        }
        return m;
      })
    );
    this.saveCurrentCustomerData();
  }

  deleteCard(moduleKey: string, slideId: string, cardId: string) {
    this.modulesList.update(list =>
      list.map(m => {
        if (m.key === moduleKey) {
          return {
            ...m,
            slides: m.slides.map(s => {
              if (s.id === slideId) {
                return {
                  ...s,
                  cards: s.cards.filter(c => c.id !== cardId)
                };
              }
              return s;
            })
          };
        }
        return m;
      })
    );
    this.saveCurrentCustomerData();
  }

  clearCustomerModules(custId?: string) {
    const id = custId || this.customerService.activeCustomerId();
    if (id) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + id);
      } catch (e) {}
    }
    this.modulesList.set(this.getCleanModulesTemplate());
  }

  importCardsFromExcel(cardsWithCategory: { category: string; card: ModuleCard }[]): number {
    if (!cardsWithCategory || cardsWithCategory.length === 0) return 0;

    let currentModules = [...this.modulesList()];

    for (const item of cardsWithCategory) {
      const rawCat = (item.category || '').trim();
      const lower = rawCat.toLowerCase();
      
      let targetKey = 'genel-bulgular';
      let targetName = 'Genel Bulgular';
      let targetIcon = 'sparkles';

      if (lower.includes('genel') || !rawCat) {
        targetKey = 'genel-bulgular';
        targetName = 'Genel Bulgular';
        targetIcon = 'sparkles';
      } else if (lower.includes('mm') || lower.includes('satınalma') || lower.includes('malzeme')) {
        targetKey = 'mm-modulu';
        targetName = 'MM Modülü';
        targetIcon = 'box';
      } else if (lower.includes('fi') || lower.includes('finans') || lower.includes('muhasebe')) {
        targetKey = 'fi-modulu';
        targetName = 'FI Modülü';
        targetIcon = 'coins';
      } else if (lower.includes('co') || lower.includes('maliyet') || lower.includes('kontrol')) {
        targetKey = 'co-modulu';
        targetName = 'CO Modülü';
        targetIcon = 'pie-chart';
      } else if (lower.includes('sd') || lower.includes('satış') || lower.includes('satis')) {
        targetKey = 'sd-modulu';
        targetName = 'SD Modülü';
        targetIcon = 'shopping-cart';
      } else {
        targetKey = rawCat.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-modulu';
        targetName = rawCat.endsWith('Modülü') || rawCat.endsWith('modülü') ? rawCat : `${rawCat} Modülü`;
        targetIcon = 'layers';
      }

      let mod = currentModules.find(m => m.key === targetKey || m.name.toLowerCase() === targetName.toLowerCase());
      if (!mod) {
        mod = {
          id: targetKey,
          key: targetKey,
          name: targetName,
          description: `${targetName} geçiş değerlendirmesi ve bulguları`,
          icon: targetIcon,
          slides: [
            {
              id: `${targetKey}-1`,
              slideTag: targetName.toUpperCase(),
              mainTitle: `${targetName} Değerlendirmesi`,
              cards: []
            }
          ]
        };
        currentModules.push(mod);
      }

      if (!mod.slides || mod.slides.length === 0) {
        mod.slides = [
          {
            id: `${targetKey}-1`,
            slideTag: targetName.toUpperCase(),
            mainTitle: `${targetName} Değerlendirmesi`,
            cards: []
          }
        ];
      }

      // Add to first slide
      mod.slides[0].cards.push(item.card);
    }

    this.modulesList.set(currentModules);
    this.saveCurrentCustomerData();
    return cardsWithCategory.length;
  }
}
