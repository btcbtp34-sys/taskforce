import { Injectable, signal } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class ModullerService {
  private modulesList = signal<ModuleItem[]>([
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
          cards: [
            {
              id: 'gb-c1',
              title: 'Business Partner Dönüşümü',
              severity: 'KRİTİK',
              bullets: [
                "MM ve FI'daki tüm satıcı/müşteri ana veri entegrasyonları (Z programları) S/4HANA'nın zorunlu Business Partner modeline göre yeniden tasarlanmalı."
              ]
            },
            {
              id: 'gb-c2',
              title: 'Ana Veri Kalitesi (CO Ağırlıklı)',
              severity: 'KRİTİK',
              bullets: [
                'Kâr merkezi, masraf çeşidi ve iç sipariş ana verisinde ciddi tutarsızlıklar var; go-live öncesi kapsamlı temizlik gerekiyor.'
              ]
            },
            {
              id: 'gb-c3',
              title: "S/4HANA'da Kaldırılan/Değişen Standartlar",
              severity: 'GELİŞTİRME',
              bullets: [
                "Dönemselleştirme raporu gibi bazı klasik FI raporları S/4HANA'da yok; Malzeme Defteri gibi CO fonksiyonları artık teknik olarak zorunlu."
              ]
            },
            {
              id: 'gb-c4',
              title: 'Özel Kod (Z Program) Gözden Geçirmesi',
              severity: 'GELİŞTİRME',
              bullets: [
                "MM ve FI'daki performans/entegrasyon amaçlı Z programları ile CO'daki 30 adımlık doğrulama yapısı sadeleştirilmeyi bekliyor."
              ]
            }
          ]
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
          cards: [
            {
              id: 'mm-c1',
              title: 'Satıcı Ana Veri — Business Partner Dönüşümü',
              severity: 'KRİTİK',
              bullets: [
                'ZSD_CREATE/CHANGE/BLOKE_VENDOR programları klasik satıcı yapısına göre kurgulanmış.',
                "S/4HANA'da satıcı ana verisi Business Partner (BP) modeline taşınıyor; bu üç program BP mantığına göre yeniden tasarlanmalı."
              ]
            },
            {
              id: 'mm-c2',
              title: 'Malzeme Ana Veri Entegrasyonu',
              severity: 'GELİŞTİRME',
              bullets: [
                'ZMM_CREATE_MATERIAL / ZMM_CHANGE_MATERIAL programları performans için revize edilebilir.'
              ]
            },
            {
              id: 'mm-c3',
              title: 'Satınalma & Fatura Ön Kayıt Entegrasyonu',
              severity: 'GELİŞTİRME',
              bullets: [
                'ZMM_CREATE_SAS ve ZMM_CREATE_PARKED_DOC programları performans amaçlı revize edilecek.',
                'Fatura ön kayıt entegrasyonu canlı sistemde kullanılmıyor; geçiş öncesi gerekliliği teyit edilmeli.'
              ]
            },
            {
              id: 'mm-c4',
              title: 'SAS Onay Workflow',
              severity: 'GELİŞTİRME',
              bullets: [
                "S/4HANA'nın Esnek İş Akışı (Flexible Workflow) yapısıyla revize edilmesi önerilir."
              ]
            }
          ]
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
          slideTag: 'FI MODÜLÜ — 1/2',
          mainTitle: 'Organizasyon Yapısı & Genel Muhasebe',
          cards: [
            {
              id: 'fi-c1',
              title: 'Organizasyon Yapısı & Hesap Planı',
              severity: 'STANDART',
              bullets: [
                'Tek şirket kodu, mevcut hesap planı ve VUK/IFRS defter yapısı doğrudan taşınabilir.',
                'Ana hesap açma yetkilendirmesi (FS00) mevcut haliyle kullanılabilir.'
              ]
            },
            {
              id: 'fi-c2',
              title: 'Paralel Para Birimleri',
              severity: 'FIRSAT',
              bullets: [
                'UPB2/UPB3 para birimleri şu an açık değil; USD ve EUR için eklenmesi düşük efor, yüksek katkı sağlar.',
                'Böylece döviz cinsinden muavin/mizan raporlaması mümkün olur.'
              ]
            },
            {
              id: 'fi-c3',
              title: 'Ön Kayıt Süreci',
              severity: 'FIRSAT',
              bullets: [
                "Ön kayıt bugün kullanılmıyor; ön kayıt + gerçek kayıt akışı S/4HANA standart fonksiyonlarıyla kurgulanabilir."
              ]
            },
            {
              id: 'fi-c4',
              title: 'Dönemselleştirme Raporu',
              severity: 'KRİTİK',
              bullets: [
                "Mevcut standart dönemselleştirme raporları S/4HANA'da kaldırılmış durumda.",
                'Go-live öncesi yeni bir raporun geliştirilmesi zorunlu; 280-180 manuel virman süreci de bu kapsamda gözden geçirilebilir.'
              ]
            }
          ]
        },
        {
          id: 'fi-2',
          slideTag: 'FI MODÜLÜ — 2/2',
          mainTitle: 'Satıcı/Müşteri Muhasebesi, Duran Varlık & Kapanış',
          cards: [
            {
              id: 'fi-c5',
              title: 'Satıcı & Müşteri Muhasebesi Entegrasyonları',
              severity: 'KRİTİK',
              bullets: [
                'Satıcı/müşteri kart yaratma, tahsilat (PO Server) ve alınan çek entegrasyonları Business Partner modeline göre uyarlanmalı.',
                'F110 ödeme ve HTS personel masraf entegrasyonu aynı mantıkla devam edebilir.'
              ]
            },
            {
              id: 'fi-c6',
              title: 'Duran Varlık Muhasebesi',
              severity: 'GELİŞTİRME',
              bullets: [
                '264/277 varlık sınıfları ve amortisman anahtarları (Normal/Azalan/Kıst) standarttır.',
                "Paralel para birimi değerleme alanlarının açılması S/4HANA gereksinimi nedeniyle gerekli."
              ]
            },
            {
              id: 'fi-c7',
              title: 'Ay Sonu Kapanış İşlemleri',
              severity: 'GELİŞTİRME',
              bullets: [
                "Dönemselleştirme, değerleme ve amortisman çalıştırmaları için 'deneme' ve 'gerçek' çalıştırma ayrımı sağlayan yeni bir kapanış kurgusu geliştirilmeli."
              ]
            }
          ]
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
          slideTag: 'CO MODÜLÜ — 1/2',
          mainTitle: 'Organizasyon Yapısı & Ana Veri Kalitesi',
          cards: [
            {
              id: 'co-c1',
              title: 'Kâr Merkezi Ana Verisi',
              severity: 'KRİTİK',
              bullets: [
                "CO kayıtlarının %56'sı yapay veya 999 kâr merkezine düşüyor.",
                'Türetim kuralları hesap tayin nesneleri yerine manuel/otomatik türetmeyle yönetiliyor; geçiş öncesi yeniden tasarım şart.'
              ]
            },
            {
              id: 'co-c2',
              title: 'Masraf Yeri & Masraf Çeşidi Ana Verisi',
              severity: 'KRİTİK',
              bullets: [
                "22.000+ tanımlı masraf çeşidinden yalnızca 2.500'ü aktif; ikincil masraf çeşidi hiç tanımlı değil.",
                "S/4HANA'da masraf çeşidinin GL hesabıyla birleşmesi nedeniyle bu temizlik geçişin ön koşulu niteliğinde."
              ]
            },
            {
              id: 'co-c3',
              title: 'İç Sipariş Ana Verisi',
              severity: 'GELİŞTİRME',
              bullets: [
                "900+ iç siparişin yalnızca 80'inde masraf yükleme kuralı var; masraflar siparişlerde birikip mahsuplaşmıyor.",
                "Sipariş türleri 5-10 türe sadeleştirilmeli, Capex akışı 'yatırım' nesne tipiyle uçtan uca kurgulanmalı."
              ]
            }
          ]
        },
        {
          id: 'co-2',
          slideTag: 'CO MODÜLÜ — 2/2',
          mainTitle: 'Planlama, Doğrulama, Ürün Maliyeti & Dönem Sonu',
          cards: [
            {
              id: 'co-c4',
              title: 'Doğrulama / İkameler',
              severity: 'GELİŞTİRME',
              bullets: [
                '30 adımlık doğrulama yapısı tek bir bakım tablosuna indirgenmeli.',
                'Fiili masraf kayıtları yalnızca iç siparişte oluşmadığından, masraf yerleri için de masraf çeşidi doğrulamaları eklenmeli.'
              ]
            },
            {
              id: 'co-c5',
              title: 'Dağıtım & Dönem Sonu Süreçleri',
              severity: 'FIRSAT',
              bullets: [
                'Masraf dağıtımı ve mahsuplaştırma süreçleri kurulu değil.',
                'Departman bazlı P&L ve tutarlı kâr merkezi raporlaması için dağıtım ve dönem sonu süreçlerinin devreye alınması önerilir.'
              ]
            }
          ]
        }
      ]
    }
  ]);

  modules = this.modulesList.asReadonly();
  activeModuleKey = signal<string>('genel-bulgular');

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
  }
}
