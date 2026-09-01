import { Injectable, signal } from '@angular/core';
import { PresentationSlide } from '../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class PresentationService {
  readonly slides: PresentationSlide[] = [
    {
      id: 1,
      slideNumber: 1,
      section: 'MÜŞTERİ GENEL BAKIŞ',
      title: 'ABC Holding - Müşteri Profili & SAP Genel Görünümü',
      subtitle: 'Müşteri SAP Dijital Dönüşüm & Fırsat Analiz Sunumu',
      bulletPoints: [
        'Sektör: Manufacturing (Üretim & Sanayi)',
        'Toplam SAP Kullanıcı Sayısı: 1.250 Aktif Lisans',
        'Mevcut Yıllık Lisans Maliyeti: €450.000 / Yıl',
        'Analiz Edilen İşlem Sayısı: 25.000+ Aylık Kayıt',
        'Task Force Ekip Çalışması Durumu: Solution Design Fazı'
      ],
      metricBox: { label: 'Toplam SAP Kullanıcısı', value: '1.250', subtext: '1.120 Aktif | 130 Düşük Kullanımlı' }
    },
    {
      id: 2,
      slideNumber: 2,
      section: 'MEVCUT SAP LANDSCAPE',
      title: 'Müşteri SAP Ürün & Sistem Mimarisi',
      subtitle: 'Kullanımdaki SAP Modül ve Platform Haritası',
      bulletPoints: [
        'ERP Core: SAP S/4HANA (850 Kullanıcı - FI, CO, MM, SD, PP)',
        'İnsan Kaynakları: SAP SuccessFactors (1.250 Tüm Çalışanlar)',
        'Satınalma: SAP Ariba (150 Lisans - Tedarikçi Portalı)',
        'Bulut Entegrasyon: SAP BTP (50 Lisans - Integration Suite)',
        'Analitik (Planlanan): SAP Analytics Cloud (30 Lisans)'
      ],
      chartType: 'landscape'
    },
    {
      id: 3,
      slideNumber: 3,
      section: 'VERİ ANALİZİ',
      title: 'SAP Kullanım & Lisans Veri Analiz Çıktıları',
      subtitle: 'Yüklenen Müşteri Excel Kullanım Verilerinin Analizi',
      bulletPoints: [
        '130 Kullanıcı Professional lisans hakkına sahip olup düşük kullanım gösteriyor.',
        'Finance ve Procurement departmanlarında yıllık 2.400 saat manuel çalışma var.',
        'Aylık ortalama 400+ manuel fatura ve sipariş onay süreci yürütülüyor.',
        'Lisans tiplerinin %12\'si atıl veya over-licensed durumdadır.'
      ],
      metricBox: { label: 'Veri Kalitesi Skoru', value: '%96', subtext: '1.250 Kayıt | 12 Kolon Eşleşti' }
    },
    {
      id: 4,
      slideNumber: 4,
      section: 'MEVCUT PROBLEMLER',
      title: 'Kök Neden & Mevcut Süreç Problemleri',
      subtitle: 'Operasyonel ve Finansal Darboğazlar',
      bulletPoints: [
        'Yüksek Lisans Maliyeti: Gereksiz Professional lisans atamaları (€35.000 atıl maliyet)',
        'Manuel İş Süreçleri: Fatura ve sipariş girişlerinde yüksek insan gücü harcanması',
        'Tekrarlayan İşlemler: Farklı lokasyonlarda mükerrer manuel onay adımları',
        'Raporlama Yavaşlığı: Yöneticilerin anlık karar alma süreçlerinde yaşanan gecikmeler'
      ]
    },
    {
      id: 5,
      slideNumber: 5,
      section: 'TESPİT EDİLEN FIRSATLAR',
      title: 'Task Force Fırsat Tespit Motoru Çıktıları',
      subtitle: 'Kategorize Edilmiş Potansiyel İyileştirme Alanları',
      bulletPoints: [
        '1. Lisans Optimizasyonu (Quick Win - €35.000/Yıl Tasarruf)',
        '2. SAP BTP Process Automation (Strategic - 1.200 Saat/Yıl Zaman Kazancı)',
        '3. Süreç Optimizasyonu (Merkezi Depo & Tedarik Otomasyonu - %20 Verimlilik)',
        '4. SAP Joule AI Assistant Entegrasyonu (Karar Destek Raporlaması)'
      ],
      chartType: 'opportunities'
    },
    {
      id: 6,
      slideNumber: 6,
      section: 'ÖNERİLEN ÇÖZÜMLER',
      title: 'Task Force Çözüm Senaryoları & Stratejisi',
      subtitle: 'Adım Adım Değer Yaratma Modeli',
      bulletPoints: [
        'Yetkilendirme Revizyonu: 15 Professional lisansın Limited pakete dönüştürülmesi',
        'Süreç Otomasyonu: SAP BTP botları ile fatura doğrulamanın otomatikleştirilmesi',
        'Merkezi Yönetim: Lokasyon bazlı onayların S/4HANA üzerinde standartlaştırılması',
        'GenAI Karar Destek: SAP Joule ile doğal dilde anlık raporlama altyapısı'
      ]
    },
    {
      id: 7,
      slideNumber: 7,
      section: 'SAP BTP / SAP ÇÖZÜM ÖNERİLERİ',
      title: 'SAP BTP Build Process Automation Mimarisi',
      subtitle: 'Akıllı Otomasyon ve AI Bot Teknolojisi',
      bulletPoints: [
        'SAP BTP Build Process Automation entegrasyonu',
        'AI Document Information Extraction (Fatura & İrsaliye Okuma)',
        'S/4HANA Cloud OData connector ile sıfır kod entegrasyonu',
        '%85 Daha hızlı belge işleme ve %0 veri hatası garantisi'
      ]
    },
    {
      id: 8,
      slideNumber: 8,
      section: 'BUSINESS VALUE',
      title: 'Tahmini Business Value & Tasarruf Dağılımı',
      subtitle: 'Yıllık ve Çok Yıllı Katma Değer Analizi',
      bulletPoints: [
        'Tahmini Toplam Business Value: €160.000 / Yıl',
        'Doğrudan Lisans Tasarrufu: €35.000 / Yıl',
        'Verimlilik & Zaman Kazanım Değeri: €40.000 / Yıl (1.200 Saat)',
        'Süreç Optimizasyonu İyileştirme Değeri: €45.000 / Yıl'
      ],
      metricBox: { label: 'Tahmini Business Value', value: '€160.000', subtext: 'Yıllık Sürekli Katma Değer' }
    },
    {
      id: 9,
      slideNumber: 9,
      section: 'FİNANSAL ETKİ',
      title: 'Finansal Etki & Maliyet Tablosu',
      subtitle: 'Yatırım vs Dönüş Karşılaştırması',
      bulletPoints: [
        'Tek Seferlik Uygulama (Implementation) Maliyeti: €30.000',
        'Yıllık İşletim / Lisans Maliyeti: €10.000',
        'Net Yıllık Fayda: €60.000',
        '3 Yıllık Kumulatif Net Değer: €150.000+'
      ],
      chartType: 'financial'
    },
    {
      id: 10,
      slideNumber: 10,
      section: 'ROI ANALİZİ',
      title: 'Yatırımın Geri Dönüşü (ROI) & Payback Analizi',
      subtitle: 'Finansal Karlılık KPI Göstergeleri',
      bulletPoints: [
        'ROI (Yatırım Getirisi Oranı): %133 - %200+',
        'Geri Ödeme Süresi (Payback Period): 6 Ay',
        'Net Present Value (NPV @ %10): ~€135.000',
        'Düşük Riskli & Hızlı Geri Dönüşlü İyileştirme Paketi'
      ],
      metricBox: { label: 'ROI Oranı', value: '%133', subtext: 'Payback Süresi: 6 Ay' }
    },
    {
      id: 11,
      slideNumber: 11,
      section: 'IMPLEMENTATION ROADMAP',
      title: 'Uygulama Yol Haritası & Zaman Çizelgesi',
      subtitle: 'Proje Fazları ve Canlıya Geçiş',
      bulletPoints: [
        'Faz 1 (Hafta 1-2): Lisans Yetki Revizyonu & Quick Win Uygulaması',
        'Faz 2 (Hafta 3-6): SAP BTP Process Automation Kurulumu & Bot Testleri',
        'Faz 3 (Hafta 7-10): Süreç Konsolidasyonu & S/4HANA Konfigürasyonu',
        'Faz 4 (Hafta 11-12): SAP Joule GenAI Entegrasyonu & Canlıya Geçiş'
      ],
      chartType: 'roadmap'
    },
    {
      id: 12,
      slideNumber: 12,
      section: 'NEXT STEPS',
      title: 'Sonraki Adımlar & Aksiyon Kararları',
      subtitle: 'Proje Başlangıç & Onay Süreci',
      bulletPoints: [
        '1. Business Case ve Finansal Model Yönetim Onayı',
        '2. Task Force Ekip Görev Atamalarının Kesinleştirilmesi',
        '3. SAP BTP PoC (Proof of Concept) Çalışmasının Başlatılması',
        '4. Proje Başlangıç Toplantısı (Kick-off) Organizasyonu'
      ]
    }
  ];

  private currentSlideIndexSignal = signal<number>(0);

  readonly currentSlideIndex = this.currentSlideIndexSignal.asReadonly();

  nextSlide(): void {
    if (this.currentSlideIndexSignal() < this.slides.length - 1) {
      this.currentSlideIndexSignal.update(i => i + 1);
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndexSignal() > 0) {
      this.currentSlideIndexSignal.update(i => i - 1);
    }
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlideIndexSignal.set(index);
    }
  }
}
