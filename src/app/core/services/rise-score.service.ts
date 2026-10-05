import { Injectable, signal, computed, effect, inject, untracked } from '@angular/core';
import { CustomerService } from './customer.service';

export interface RiseCriterionOption {
  label: string;
  points: number;
}

export interface RiseCriterion {
  id: string;
  title: string;                 // Excel: Başlık
  type: 'dropdown' | 'radio';    // Excel: Field Type (Dropbox / Radio Button)
  options: RiseCriterionOption[];// Excel: Field & Puan (dropdown seçenekleri)
  selectedOptionLabel: string;   // Seçili dropdown seçeneği
  radioValue: boolean;           // Radio button için evet/aktif durumu
  radioPoints: number;           // Radio button puanı (Excel: Puan)
  category: string;              // Kategori grubu
  highlighted?: boolean;         // Excel'deki yeşil vurgulu satırlar
  description?: string;          // SAP RISE koku açıklaması
}

export const DEFAULT_RISE_CRITERIA: RiseCriterion[] = [
  {
    id: 'gecis_yontemi',
    title: 'Rise Geçiş Yöntemi',
    type: 'dropdown',
    category: 'Geçiş Stratejisi',
    selectedOptionLabel: 'Brownfield',
    radioValue: false,
    radioPoints: 0,
    highlighted: false,
    description: 'SAP S/4HANA geçiş metodolojisi (Brownfield, Greenfield, Lift & Shift veya Selective Data).',
    options: [
      { label: 'Brownfield', points: 10 },
      { label: 'Greenfield', points: 8 },
      { label: 'Lift & Shift', points: 12 },
      { label: 'Selective Data', points: 8 }
    ]
  },
  {
    id: 'fue_sayisi',
    title: 'Lisans FUE Sayısı',
    type: 'dropdown',
    category: 'Kullanıcı & Lisans',
    selectedOptionLabel: '136-499',
    radioValue: false,
    radioPoints: 0,
    highlighted: false,
    description: 'Full Usage Equivalent (FUE) lisans büyüklük dilimi.',
    options: [
      { label: '136', points: 15 },
      { label: '136-499', points: 10 },
      { label: '500-801', points: 8 },
      { label: '801-1001', points: 6 },
      { label: '>1001', points: 6 }
    ]
  },
  {
    id: 'veri_merkezi_yonetimi',
    title: 'Veri Merkezi Yönetimi',
    type: 'dropdown',
    category: 'Altyapı & Barındırma',
    selectedOptionLabel: 'OnPrem',
    radioValue: false,
    radioPoints: 0,
    highlighted: false,
    description: 'Mevcut altyapının kurum içi (OnPrem) veya dış kaynaklı (OutSource) barındırılma modeli.',
    options: [
      { label: 'OnPrem', points: 8 },
      { label: 'OutSource', points: 3 }
    ]
  },
  {
    id: 'guvenlik',
    title: 'Güvenlik',
    type: 'radio',
    category: 'Güvenlik & Uyum',
    selectedOptionLabel: '',
    radioValue: true,
    radioPoints: 14,
    highlighted: true,
    description: 'Yüksek güvenlik, izolasyon, SOC/ISO uyumluluğu ve kurumsal denetim gereksinimleri.',
    options: []
  },
  {
    id: 'arsivleme',
    title: 'Arşivleme',
    type: 'radio',
    category: 'Veri Yönetimi',
    selectedOptionLabel: '',
    radioValue: true,
    radioPoints: 3,
    highlighted: false,
    description: 'Aktif veri hacmi yönetimi ve geçmiş veri arşivleme süreçlerinin mevcudiyeti.',
    options: []
  },
  {
    id: 'veritabani_boyutlandirmasi',
    title: 'Veritabanı Kapasitesi',
    type: 'dropdown',
    category: 'Altyapı & Veritabanı',
    selectedOptionLabel: 'M',
    radioValue: false,
    radioPoints: 0,
    highlighted: false,
    description: 'HANA veritabanı bellek (Memory Sizing) gereksinimi: XS (<256GB), S (256-512GB), M (512GB-1TB), L (>1TB).',
    options: [
      { label: 'XS', points: 5 },
      { label: 'S', points: 4 },
      { label: 'M', points: 3 },
      { label: 'L', points: 2 }
    ]
  },
  {
    id: 'yeni_uygulamalar',
    title: 'Yeni SAP Uygulamalar & Teknolojileri',
    type: 'radio',
    category: 'İnovasyon & Genişleme',
    selectedOptionLabel: '',
    radioValue: true,
    radioPoints: 14,
    highlighted: true,
    description: 'BTP, AI / Machine Learning, Signavio, WalkMe veya ek SaaS bulut çözümlerinin dahil edilmesi.',
    options: []
  },
  {
    id: 'erp_urunu',
    title: 'SAP ERP Ürünü',
    type: 'dropdown',
    category: 'Mevcut Sistem',
    selectedOptionLabel: 'ECC ERP',
    radioValue: false,
    radioPoints: 0,
    highlighted: false,
    description: 'Geçişe kaynak teşkil eden mevcut SAP çekirdek sistemi (ECC 6.0 vs S/4HANA versiyonu).',
    options: [
      { label: 'ECC ERP', points: 7 },
      { label: 'S4 ERP', points: 3 }
    ]
  },
  {
    id: 'ana_veri_karmasikligi',
    title: 'Ana Veri Çeşitliliği ve Hacmi',
    type: 'radio',
    category: 'Veri Kalitesi',
    selectedOptionLabel: '',
    radioValue: true,
    radioPoints: 5,
    highlighted: false,
    description: 'Malzeme, Müşteri/Satıcı (Business Partner), Hesap Planı ve organizasyon yapısındaki karmaşıklık.',
    options: []
  },
  {
    id: 'ozel_gelistirme',
    title: 'Müşteriye Özgü / Özel Geliştirmeler',
    type: 'dropdown',
    category: 'Custom Code (Z/Y)',
    selectedOptionLabel: 'High',
    radioValue: false,
    radioPoints: 0,
    highlighted: false,
    description: 'Mevcut sistemdeki Z/Y kod, user-exit ve BAdI modifikasyon yoğunluğu.',
    options: [
      { label: 'High', points: 5 },
      { label: 'Low', points: 3 }
    ]
  },
  {
    id: 'bakim_sonu_riski',
    title: 'Bakım ve Güncelleme Destekleri',
    type: 'dropdown',
    category: 'Destek & Risk',
    selectedOptionLabel: 'High',
    radioValue: false,
    radioPoints: 0,
    highlighted: false,
    description: 'SAP ECC 2027 standart destek bitişine bağlı operasyonel ve lisans maliyeti riski.',
    options: [
      { label: 'High', points: 7 },
      { label: 'Low', points: 3 }
    ]
  },
  {
    id: 'danismanlik_ihtiyaci',
    title: 'Danışmanlık İhtiyacı',
    type: 'dropdown',
    category: 'Danışmanlık & Hizmet',
    selectedOptionLabel: 'Brownfield',
    radioValue: false,
    radioPoints: 0,
    highlighted: true,
    description: 'Dönüşüm projesindeki harici danışmanlık, süreç tasarımı ve proje yönetim ihtiyacı.',
    options: [
      { label: 'Brownfield', points: 9 },
      { label: 'Greenfield', points: 3 },
      { label: 'Lift & Shift', points: 12 },
      { label: 'Selective Data', points: 8 }
    ]
  },
  {
    id: 'rise_sektor_destegi',
    title: 'Rise Sektör Desteği',
    type: 'radio',
    category: 'Sektör & Çözüm',
    selectedOptionLabel: 'Var',
    radioValue: true,
    radioPoints: 3,
    highlighted: false,
    description: '',
    options: [
      { label: 'Var', points: 3 },
      { label: 'Yok', points: 1 }
    ]
  },
  {
    id: 'entegrasyon_yogunlugu_3rd',
    title: '3RD Entegrasyon Yoğunluğu',
    type: 'radio',
    category: 'Entegrasyon & Mimari',
    selectedOptionLabel: 'Az',
    radioValue: true,
    radioPoints: 3,
    highlighted: false,
    description: '',
    options: [
      { label: 'Az', points: 3 },
      { label: 'Çok', points: 1 }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class RiseScoreService {
  private customerService = inject(CustomerService);

  readonly criteria = signal<RiseCriterion[]>(JSON.parse(JSON.stringify(DEFAULT_RISE_CRITERIA)));

  constructor() {
    // When active customer changes, load customer-specific saved state or default
    effect(() => {
      const id = this.customerService.activeCustomerId();
      untracked(() => {
        this.loadForCustomer(id);
        this.forceUpdateDanismanlikOptions();
      });
    });
  }

  // Force re-sync criteria from definition
  refreshCriteria(): void {
    const custId = this.customerService.activeCustomerId();
    untracked(() => {
      this.loadForCustomer(custId);
      this.forceUpdateDanismanlikOptions();
    });
  }

  forceUpdateDanismanlikOptions(): void {
    untracked(() => {
      const defDanismanlik = DEFAULT_RISE_CRITERIA.find(d => d.id === 'danismanlik_ihtiyaci')!;
      const currentList = this.criteria();
      const gecisItem = currentList.find(c => c.id === 'gecis_yontemi');
      const selectedGecis = gecisItem?.selectedOptionLabel || 'Brownfield';

      const matchingOption = defDanismanlik.options.find(
        (opt: RiseCriterionOption) => opt.label.toLowerCase().replace(/\s+/g, '') === selectedGecis.toLowerCase().replace(/\s+/g, '')
      );
      const targetLabel = matchingOption?.label || defDanismanlik.options[0].label;

      const danismanlikCurrent = currentList.find(c => c.id === 'danismanlik_ihtiyaci');
      if (
        danismanlikCurrent &&
        danismanlikCurrent.selectedOptionLabel === targetLabel &&
        danismanlikCurrent.options?.length === defDanismanlik.options.length
      ) {
        return;
      }

      this.criteria.update(list => {
        return list.map(item => {
          if (item.id === 'danismanlik_ihtiyaci') {
            return {
              ...item,
              title: defDanismanlik.title,
              type: 'dropdown',
              category: defDanismanlik.category,
              options: JSON.parse(JSON.stringify(defDanismanlik.options)),
              selectedOptionLabel: targetLabel
            };
          }
          return item;
        });
      });
    });
  }

  // Calculate current score for a criterion
  getCriterionScore(c: RiseCriterion): number {
    if (c.type === 'radio') {
      if (c.options && c.options.length > 0) {
        const match = c.options.find(opt => opt.label === c.selectedOptionLabel);
        return match ? (Number(match.points) || 0) : 0;
      }
      return c.radioValue ? (Number(c.radioPoints) || 0) : 0;
    } else {
      const match = c.options.find(opt => opt.label === c.selectedOptionLabel);
      return match ? (Number(match.points) || 0) : 0;
    }
  }

  // Total Rise Score
  readonly totalScore = computed(() => {
    return this.criteria().reduce((sum, c) => sum + this.getCriterionScore(c), 0);
  });

  // Maximum possible score based on current configured weights
  readonly maxPossibleScore = computed(() => {
    return this.criteria().reduce((sum, c) => {
      if (c.type === 'radio') {
        if (c.options && c.options.length > 0) {
          return sum + c.options.reduce((m, o) => Math.max(m, Number(o.points) || 0), 0);
        }
        return sum + Math.max(Number(c.radioPoints) || 0, 0);
      } else {
        const maxOpt = c.options.reduce((m, o) => Math.max(m, Number(o.points) || 0), 0);
        return sum + maxOpt;
      }
    }, 0);
  });

  // Minimum possible score based on current configured weights
  readonly minPossibleScore = computed(() => {
    return this.criteria().reduce((sum, c) => {
      if (c.type === 'radio') {
        if (c.options && c.options.length > 0) {
          const minOpt = c.options.reduce((m, o) => Math.min(m, Number(o.points) || 0), Infinity);
          return sum + (minOpt === Infinity ? 0 : minOpt);
        }
        return sum + 0;
      } else {
        const minOpt = c.options.reduce((m, o) => Math.min(m, Number(o.points) || 0), Infinity);
        return sum + (minOpt === Infinity ? 0 : minOpt);
      }
    }, 0);
  });

  // Score percentage relative to max
  readonly scorePercentage = computed(() => {
    const max = this.maxPossibleScore();
    if (max <= 0) return 0;
    return Math.round((this.totalScore() / max) * 100);
  });

  // Interpret score rating and recommendations
  readonly scoreEvaluation = computed(() => {
    const score = this.totalScore();
    if (score >= 75) {
      return {
        level: 'Yüksek Dönüşüm Önceliği',
        levelCode: 'high',
        badgeColor: '#dc2626',
        bgColor: '#fef2f2',
        summary: 'Sistem SAP RISE with S/4HANA Cloud geçişi için son derece yüksek potansiyel ve kritik öncelik taşımaktadır.',
        recommendation: 'Öncelikli olarak SAP RISE Private Cloud ve BTP mimarisi kurgulanmalı, mimari yol haritası hemen hayata geçirilmelidir.',
        statusIcon: 'alert'
      };
    } else if (score >= 50) {
      return {
        level: 'Orta Düzey RISE Uyumluluğu',
        levelCode: 'medium',
        badgeColor: '#d97706',
        bgColor: '#fffbeb',
        summary: 'Sistem dengeli bir RISE dönüşüm adayıdır; optimizasyon adımları ve altyapı sadeleştirmesi önerilir.',
        recommendation: 'Arşivleme (DVM) ve Z kod sadeleştirmesi yapılarak RISE geçiş maliyeti daha da optimize edilebilir.',
        statusIcon: 'info'
      };
    } else {
      return {
        level: 'Hafif / Düşük Karmaşıklık',
        levelCode: 'low',
        badgeColor: '#059669',
        bgColor: '#ecfdf5',
        summary: 'Mevcut sistem hafif ve standart bir yapıdadır; hızlı bir RISE geçişi öngörülmektedir.',
        recommendation: 'Hızlı geçiş (Clean Core) yaklaşımı ile standart S/4HANA geçişi planlanabilir.',
        statusIcon: 'check-circle'
      };
    }
  });

  // Select dropdown option
  selectDropdownOption(criterionId: string, optionLabel: string): void {
    this.criteria.update(list => {
      let syncDanismanlikLabel: string | null = null;
      if (criterionId === 'gecis_yontemi') {
        syncDanismanlikLabel = optionLabel;
      }
      return list.map(item => {
        if (item.id === criterionId) {
          return { ...item, selectedOptionLabel: optionLabel };
        }
        if (syncDanismanlikLabel && item.id === 'danismanlik_ihtiyaci') {
          const match = item.options.find(
            (opt: RiseCriterionOption) => opt.label.toLowerCase().replace(/\s+/g, '') === syncDanismanlikLabel!.toLowerCase().replace(/\s+/g, '')
          );
          if (match) {
            return { ...item, selectedOptionLabel: match.label };
          }
        }
        return item;
      });
    });
    this.saveForCustomer();
  }

  // Set radio value
  setRadioValue(criterionId: string, value: boolean): void {
    this.criteria.update(list => {
      return list.map(item => {
        if (item.id === criterionId) {
          return { ...item, radioValue: value };
        }
        return item;
      });
    });
    this.saveForCustomer();
  }

  // Update points for a dropdown option
  updateOptionPoints(criterionId: string, optionLabel: string, newPoints: number): void {
    this.criteria.update(list => {
      return list.map(item => {
        if (item.id === criterionId) {
          const updatedOptions = item.options.map(opt => {
            if (opt.label === optionLabel) {
              return { ...opt, points: Number(newPoints) || 0 };
            }
            return opt;
          });
          return { ...item, options: updatedOptions };
        }
        return item;
      });
    });
    this.saveForCustomer();
  }

  // Update points for a radio button
  updateRadioPoints(criterionId: string, newPoints: number): void {
    this.criteria.update(list => {
      return list.map(item => {
        if (item.id === criterionId) {
          return { ...item, radioPoints: Number(newPoints) || 0 };
        }
        return item;
      });
    });
    this.saveForCustomer();
  }

  // Update title / label if needed
  updateCriterionTitle(criterionId: string, newTitle: string): void {
    this.criteria.update(list => {
      return list.map(item => {
        if (item.id === criterionId) {
          return { ...item, title: newTitle };
        }
        return item;
      });
    });
    this.saveForCustomer();
  }

  // Reset to default excel configuration
  resetToDefaults(): void {
    this.criteria.set(JSON.parse(JSON.stringify(DEFAULT_RISE_CRITERIA)));
    this.saveForCustomer();
  }

  // Quick Preset: High Score
  applyHighScorePreset(): void {
    this.criteria.update(list => {
      const updated = list.map(c => {
        if (c.type === 'radio') {
          if (c.options && c.options.length > 0) {
            const best = [...c.options].sort((a, b) => b.points - a.points)[0];
            return { ...c, selectedOptionLabel: best?.label || c.selectedOptionLabel };
          }
          return { ...c, radioValue: true };
        } else {
          // pick highest point option
          const best = [...c.options].sort((a, b) => b.points - a.points)[0];
          return { ...c, selectedOptionLabel: best?.label || c.selectedOptionLabel };
        }
      });
      // Synchronize danismanlik_ihtiyaci with gecis_yontemi
      const gecis = updated.find(it => it.id === 'gecis_yontemi');
      const danismanlik = updated.find(it => it.id === 'danismanlik_ihtiyaci');
      if (gecis && danismanlik) {
        const match = danismanlik.options.find(
          (opt: RiseCriterionOption) => opt.label.toLowerCase().replace(/\s+/g, '') === gecis.selectedOptionLabel.toLowerCase().replace(/\s+/g, '')
        );
        if (match) {
          danismanlik.selectedOptionLabel = match.label;
        }
      }
      return updated;
    });
    this.saveForCustomer();
  }

  // Quick Preset: Low Score
  applyLowScorePreset(): void {
    this.criteria.update(list => {
      const updated = list.map(c => {
        if (c.type === 'radio') {
          if (c.options && c.options.length > 0) {
            const lowest = [...c.options].sort((a, b) => a.points - b.points)[0];
            return { ...c, selectedOptionLabel: lowest?.label || c.selectedOptionLabel };
          }
          return { ...c, radioValue: false };
        } else {
          // pick lowest point option
          const lowest = [...c.options].sort((a, b) => a.points - b.points)[0];
          return { ...c, selectedOptionLabel: lowest?.label || c.selectedOptionLabel };
        }
      });
      // Synchronize danismanlik_ihtiyaci with gecis_yontemi
      const gecis = updated.find(it => it.id === 'gecis_yontemi');
      const danismanlik = updated.find(it => it.id === 'danismanlik_ihtiyaci');
      if (gecis && danismanlik) {
        const match = danismanlik.options.find(
          (opt: RiseCriterionOption) => opt.label.toLowerCase().replace(/\s+/g, '') === gecis.selectedOptionLabel.toLowerCase().replace(/\s+/g, '')
        );
        if (match) {
          danismanlik.selectedOptionLabel = match.label;
        }
      }
      return updated;
    });
    this.saveForCustomer();
  }

  // Match Score for Executive Summary (0 - 100)
  readonly matchScoreForExec = computed(() => {
    const raw = this.totalScore();
    return Math.min(100, Math.max(0, Math.round(raw)));
  });

  syncToExecutiveSummary(): void {
    try {
      const custId = this.customerService.activeCustomerId() || 'default';
      const key = `task_force_exec_summary_${custId}`;
      const raw = localStorage.getItem(key);
      const score = this.matchScoreForExec();
      const activeCust = this.customerService.activeCustomer();
      let custName = activeCust?.name || 'Müşteri';
      if (activeCust?.id === 'cust-sigorta' || /k\*\*/i.test(custName)) {
        custName = 'Kale Endüstri Holding';
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.heroScore) {
          parsed.heroScore.matchScore = score;
          parsed.heroScore.matchLabel = 'RISE SKORU';
          if (parsed.heroScore.title && (parsed.heroScore.title.includes('**') || parsed.heroScore.title.includes('K**'))) {
            parsed.heroScore.title = `${custName} RISE Readiness & Bulut Uyum Analizi`;
          }
          if (parsed.objectiveSubtitle && (parsed.objectiveSubtitle.includes('**') || parsed.objectiveSubtitle.includes('K**'))) {
            parsed.objectiveSubtitle = `${custName} için RISE with SAP dönüşümü; mevcut ERP omurgasını modern bulut standartlarına taşıyarak işletmeye yüksek çeviklik, güvenlik ve esneklik kazandırmayı hedeflemektedir.`;
          }
          if (parsed.recommendedMethod) {
            if (parsed.recommendedMethod.description && (parsed.recommendedMethod.description.includes('**') || parsed.recommendedMethod.description.includes('K**'))) {
              parsed.recommendedMethod.description = `${custName} için geçmiş işlem verisi ve mevzuat denetim sürekliliği zorunlu olduğu için saf Greenfield elenmiştir. MM/FI çekirdeğinin doğrudan taşındığı, yüksek boyutlu atıl verilerin go-live öncesi arşivlendiği ve CO/BP temizliğinin yapıldığı Brownfield yaklaşımı en düşük maliyet ve en yüksek başarı oranını sunmaktadır.`;
            }
            if (parsed.recommendedMethod.title && (parsed.recommendedMethod.title.includes('**') || parsed.recommendedMethod.title.includes('K**'))) {
              parsed.recommendedMethod.title = 'Brownfield (System Conversion) + DVM / Arşivleme';
            }
          }
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      } else {
        const initial = {
          heroScore: {
            matchScore: score,
            matchLabel: 'RISE SKORU',
            badgeText: 'RISE WITH SAP GEÇİŞİNE YÜKSEK DERECEDE UYGUN',
            title: `${custName} RISE Readiness & Bulut Uyum Analizi`,
            description: `Mevcut SAP altyapısı, aktif kullanıcı profili, veritabanı boyutlandırması ve entegrasyon envanteri incelendiğinde; şirketiniz %${score} genel bulut uyum skoru ile RISE with SAP Private Cloud dönüşümüne tam hazır durumdadır.`,
            pillars: [
              { id: 'infra', icon: 'database', name: 'Altyapı Konsolidasyonu', score: 91, colorClass: 'blue', desc: 'Sistem sadeleştirme ve bulut altyapı uyumu' },
              { id: 'clean-core', icon: 'sparkles', name: 'Clean Core Uyumu', score: 86, colorClass: 'emerald', desc: 'Standart dışı ABAP geliştirmelerinin BTP ortamına taşınabilirliği' },
              { id: 'license', icon: 'bolt', name: 'Lisans Verimliliği', score: 78, colorClass: 'purple', desc: 'FUE dönüşümü ile lisans optimizasyon potansiyeli' },
              { id: 'tco', icon: 'chart', name: 'TCO & Operasyonel Değer', score: 82, colorClass: 'amber', desc: '5 yıllık toplam sahip olma maliyeti ve bulut ROI değeri' }
            ]
          }
        };
        localStorage.setItem(key, JSON.stringify(initial));
      }
    } catch (e) {
      console.warn('Could not sync rise score to executive summary:', e);
    }
  }

  private getStorageKey(custId?: string): string {
    const id = custId || this.customerService.activeCustomerId() || 'default';
    return `taskforce_rise_score_${id}`;
  }

  private saveForCustomer(): void {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(this.criteria()));
      this.syncToExecutiveSummary();
    } catch (e) {
      console.warn('Could not save rise score to localStorage:', e);
    }
  }

  private loadForCustomer(custId: string): void {
    try {
      const key = this.getStorageKey(custId);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultMap = new Map(DEFAULT_RISE_CRITERIA.map(d => [d.id, d]));
          const updated = parsed.map((item: RiseCriterion) => {
            const def = defaultMap.get(item.id);
            if (def) {
              // Ensure options match the canonical system options for this criterion
              const optionsMatch = Array.isArray(item.options) &&
                item.options.length === def.options.length &&
                item.options.every((opt: RiseCriterionOption, idx: number) => opt.label === def.options[idx]?.label);

              const resolvedOptions = optionsMatch ? item.options : JSON.parse(JSON.stringify(def.options));
              const isValidSelection = resolvedOptions.some((o: RiseCriterionOption) => o.label === item.selectedOptionLabel);
              const resolvedSelected = isValidSelection ? item.selectedOptionLabel : def.selectedOptionLabel;

              return { 
                ...item, 
                title: def.title, 
                type: def.type,
                category: def.category,
                options: resolvedOptions,
                selectedOptionLabel: resolvedSelected
              };
            }
            return item;
          });
          const existingIds = new Set(updated.map((item: RiseCriterion) => item.id));
          const missing = DEFAULT_RISE_CRITERIA.filter(d => !existingIds.has(d.id));
          const finalCriteria = missing.length > 0
            ? [...updated, ...JSON.parse(JSON.stringify(missing))]
            : updated;

          // Always ensure danismanlik_ihtiyaci is synced with gecis_yontemi on load
          const gecisItem = finalCriteria.find((it: RiseCriterion) => it.id === 'gecis_yontemi');
          const danismanlikItem = finalCriteria.find((it: RiseCriterion) => it.id === 'danismanlik_ihtiyaci');
          if (gecisItem && danismanlikItem) {
            const match = danismanlikItem.options.find(
              (opt: RiseCriterionOption) => opt.label.toLowerCase().replace(/\s+/g, '') === gecisItem.selectedOptionLabel.toLowerCase().replace(/\s+/g, '')
            );
            if (match) {
              danismanlikItem.selectedOptionLabel = match.label;
            }
          }

          this.criteria.set(finalCriteria);
          this.saveForCustomer();
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load rise score from localStorage:', e);
    }
    // Fallback to default
    this.criteria.set(JSON.parse(JSON.stringify(DEFAULT_RISE_CRITERIA)));
  }
}
