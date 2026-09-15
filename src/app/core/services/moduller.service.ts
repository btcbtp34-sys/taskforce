import { Injectable, signal, inject, effect } from '@angular/core';
import { CustomerService } from './customer.service';

export type CardSeverity = 
  | 'KRİTİK' 
  | 'GELİŞTİRME' 
  | 'STANDART' 
  | 'FIRSAT' 
  | 'UYGUN DEĞİL' 
  | 'KISMEN UYGUN' 
  | 'ÖNERİLEN';

export interface ModuleCard {
  id: string;
  title: string;
  severity: CardSeverity;
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

@Injectable({
  providedIn: 'root'
})
export class ModullerService {
  private customerService = inject(CustomerService);

  private modulesList = signal<ModuleItem[]>(this.getCleanModulesTemplate());
  readonly modules = this.modulesList.asReadonly();
  readonly activeModuleKey = signal<string>('genel-bulgular');

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
          this.modulesList.set(parsed);
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
}
