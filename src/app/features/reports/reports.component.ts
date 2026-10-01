import { Component, inject, signal, ElementRef, ViewChild, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
import { NotesService } from '../../core/services/notes.service';
import { QuickToolsService } from '../../core/services/quick-tools.service';
import { RiseScoreService } from '../../core/services/rise-score.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface HeroPillarItem {
  id: string;
  icon: string;
  name: string;
  score: number;
  colorClass: string;
  desc: string;
}

export interface HeroScoreData {
  matchScore: number;
  matchLabel: string;
  badgeText: string;
  title: string;
  description: string;
  pillars: HeroPillarItem[];
}

export interface ObjectivePillar {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

export interface HowPillar {
  id: string;
  icon: string;
  badge: string;
  title: string;
  bullets: string[];
  note: string;
}

export interface RecommendedMethodHeroData {
  badge: string;
  title: string;
  description: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
}

export interface ExecutiveSummaryData {
  heroScore?: HeroScoreData;
  objectiveTitle: string;
  objectiveSubtitle: string;
  objectivePillars: ObjectivePillar[];
  howTitle: string;
  howSubtitle: string;
  howPillars: HowPillar[];
  recommendedMethod?: RecommendedMethodHeroData;
  salesNotes: string;
  preparedBy: string;
}

export function getDefaultHeroScore(customerName: string): HeroScoreData {
  let custName = customerName?.trim() || '';
  if (!custName || custName === 'Müşteri' || custName.includes('*') || /k\*\*/i.test(custName)) {
    custName = 'Kale Endüstri Holding';
  }
  return {
    matchScore: 84,
    matchLabel: 'RISE SKORU',
    badgeText: 'RISE WITH SAP GEÇİŞİNE YÜKSEK DERECEDE UYGUN',
    title: `${custName} RISE Readiness & Bulut Uyum Analizi`,
    description: `Mevcut SAP altyapısı, aktif kullanıcı profili, veritabanı boyutlandırması ve entegrasyon envanteri incelendiğinde; şirketiniz %84 genel bulut uyum skoru ile RISE with SAP Private Cloud dönüşümüne tam hazır durumdadır.`,
    pillars: [
      {
        id: 'infra',
        icon: 'database',
        name: 'Altyapı Konsolidasyonu',
        score: 91,
        colorClass: 'blue',
        desc: 'Dağınık Sunucular ➔ 1 S/4HANA Private Cloud DB'
      },
      {
        id: 'license',
        icon: 'users',
        name: 'Lisans Optimizasyonu',
        score: 85,
        colorClass: 'emerald',
        desc: 'FUE Lisanslama ile Atıl Lisans ve Aşım Riski Sıfırlanır'
      },
      {
        id: 'integration',
        icon: 'bolt',
        name: 'Entegrasyon BTP Uyumu',
        score: 82,
        colorClass: 'purple',
        desc: 'PO / AIF Servisleri SAP Integration Suite Uyumlu'
      },
      {
        id: 'dvm',
        icon: 'layers',
        name: 'DVM & Bellek Tasarrufu',
        score: 78,
        colorClass: 'amber',
        desc: 'Veri Arşivleme ile HANA Bellek İhtiyacı Optimize Edilir'
      },
      {
        id: 'security',
        icon: 'shield',
        name: 'Destek & Güvenlik Riski',
        score: 100,
        colorClass: 'emerald',
        desc: 'Eski Sürümler ve EoS Destek Sonu Riskleri Ortadan Kalkar'
      }
    ]
  };
}

export function getDefaultExecutiveData(customerName: string): ExecutiveSummaryData {
  let custName = customerName?.trim() || '';
  if (!custName || custName === 'Müşteri' || custName.includes('*') || /k\*\*/i.test(custName)) {
    custName = 'Kale Endüstri Holding';
  }
  return {
    heroScore: getDefaultHeroScore(custName),
    objectiveTitle: '1. Amaç: RISE with SAP ile Yeni Nesil Kurumsal Dönüşüm',
    objectiveSubtitle: `${custName} için RISE with SAP dönüşümü; mevcut ERP omurgasını modern bulut standartlarına taşıyarak işletmeye yüksek çeviklik, güvenlik ve esneklik kazandırmayı hedeflemektedir.`,
    objectivePillars: [
      {
        id: 'ai',
        icon: 'sparkles',
        title: 'AI Tabanlı Mimari',
        desc: 'SAP Business AI ve Joule destekli akıllı karar alma mekanizmaları ve öngörülü analitik kabiliyetler.'
      },
      {
        id: 'flexible',
        icon: 'layers',
        title: 'Esnek Altyapı',
        desc: 'Değişen pazar koşullarına ve kurumsal stratejilere hızla entegre olabilen modüler yapı.'
      },
      {
        id: 'agile',
        icon: 'bolt',
        title: 'Çevik Operasyon',
        desc: 'İş süreçlerinin hızlanması, yeni özelliklerin ve sürümlerin anında devreye alınabilmesi.'
      },
      {
        id: 'scalable',
        icon: 'sliders',
        title: 'Ölçeklenebilirlik',
        desc: 'Hacim artışlarına, yeni şirket entegrasyonlarına ve global büyümeye anında uyum sağlayan bulut kapasitesi.'
      },
      {
        id: 'security',
        icon: 'shield',
        title: 'Güçlendirilmiş Siber Güvenlik',
        desc: 'SAP garantisinde 7/24 SOC izleme, proaktif yama yönetimi ve sıfır gün tehdit koruması.'
      },
      {
        id: 'self-sufficient',
        icon: 'users',
        title: 'Kendi Kendine Yetme Yetkinliği',
        desc: 'Zaman içerisinde kurum içi ekiplerin yetkinliklerinin artışı ve dış müdahalelere bağımsız yönetim gücü.'
      },
      {
        id: 'independence',
        icon: 'database',
        title: 'Dış Dünyaya Bağımlılığın Azalması',
        desc: 'Clean Core yaklaşımı ile özel kod ve karmaşık katman yükünden arınmış, standartlaştırılmış çekirdek.'
      },
      {
        id: 'autonomous',
        icon: 'cpu',
        title: 'Daha Otonom Süreçler',
        desc: 'Rutin operasyonların otomatikleştiği, kendi kendini denetleyen ve iyileştiren akıllı kurumsal omurga.'
      }
    ],
    howTitle: '2. Nasıl? Dönüşüm Metodolojisi, Takvim ve Finansal Model',
    howSubtitle: 'Dönüşümün güvenle ve en düşük operasyonel risk ile tamamlanması için planlanan stratejik geçiş yaklaşımı ve temel metrikler:',
    howPillars: [
      {
        id: 'method',
        icon: 'map',
        badge: 'GEÇİŞ YÖNTEMİ',
        title: 'Brownfield (System Conversion) + DVM / Arşivleme',
        bullets: [
          'Finansal ve operasyonel geçmiş işlem verilerinin %100 bütünlükle yeni sisteme aktarımı',
          'SAP Readiness Check bulgularına göre Z kodların Clean Core prensipleriyle sadeleştirilmesi',
          'Yüksek boyutlu tabloların go-live öncesi arşivlenerek HANA bellek maliyetinin optimize edilmesi',
          'Kesinti süresini minimize eden SUM (Software Update Manager) ile kanıtlanmış teknik geçiş'
        ],
        note: 'Geçmiş veri sürekliliği ve minimum iş kesintisi sağlayan en güvenli geçiş modeli'
      },
      {
        id: 'timeline',
        icon: 'calendar',
        badge: 'TAKİVM',
        title: '6 Aylık Kademeli Canlıya Geçiş Yol Haritası',
        bullets: [
          '1. - 2. Ay: Hazırlık, SAP Readiness Check ve DVM Arşivleme Projesi',
          '2. - 3. Ay: Z-Kod Sadeleştirme, Clean Core ve Business Partner (BP) Ön Dönüşümü',
          '4. - 5. Ay: System Conversion, Sandbox / Test Provaları ve Kullanıcı Kabul Testleri',
          '6. Ay: Cutover, Canlıya Geçiş (Go-Live) ve Hypercare Destek Süreci'
        ],
        note: 'Riskleri minimize eden provalı ve aşamalı canlıya geçiş takvimi'
      },
      {
        id: 'cost-transformation',
        icon: 'dollar',
        badge: 'MALİYET DÖNÜŞÜMÜ',
        title: 'Sabit Maliyetlerden Kontrol Edilebilir Değişken Maliyetlere Dönüş',
        bullets: [
          'Donanım, sunucu yenileme ve veri merkezi gibi yüksek sabit CapEx maliyetlerinin sonlandırılması',
          'İhtiyaç duyulan kapasite kadar ödeme (Pay-as-you-grow) esnekliği ve tahmin edilebilir bütçeleme',
          'Altyapı, işletim sistemi, SAP lisansı ve 7/24 SLA garantisinin tek bir OpEx bulut aboneliğinde toplanması',
          'Beklenmedik felaket kurtarma ve bakım harcamalarından arınmış, ölçülebilir finansal yapı'
        ],
        note: 'Toplam Sahip Olma Maliyetinde %20-30 oranında nakit akışı ve öngörülebilirlik avantajı'
      }
    ],
    recommendedMethod: {
      badge: 'ÖNERİLEN GEÇİŞ YÖNTEMİ',
      title: 'Brownfield (System Conversion) + DVM / Arşivleme',
      description: `${customerName} için geçmiş işlem verisi ve mevzuat denetim sürekliliği zorunlu olduğu için saf Greenfield elenmiştir. MM/FI çekirdeğinin doğrudan taşındığı, yüksek boyutlu atıl verilerin go-live öncesi arşivlendiği ve CO/BP temizliğinin yapıldığı Brownfield yaklaşımı en düşük maliyet ve en yüksek başarı oranını sunmaktadır.`,
      stat1Value: '6 Ay',
      stat1Label: 'Tahmini Proje Süresi',
      stat2Value: '%100',
      stat2Label: 'Geçmiş Veri Korunumu',
      stat3Value: 'Optimum',
      stat3Label: 'Bütçe / ROI Dengesi'
    },
    salesNotes: 'Müşterimizin büyüme vizyonuna tam uyumlu, veri kaybı riski taşımayan ve operasyonel sürekliliği güvenceye alan özel RISE with SAP teklif paketimiz hazırlanmıştır.',
    preparedBy: 'SAP Satış & Satış Öncesi (Presales) Çözüm Mimarlığı Ekibi'
  };
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="executive-report-page">
      <!-- Header Banner & Print Actions -->
      <div class="dashboard-header no-print">
        <div class="header-left">
          <div class="badge-row">
            <span class="company-badge">{{ activeCustomerName() }}</span>
            <span class="report-type-tag">Yönetici Özeti & Dönüşüm Raporu</span>
            <span class="date-tag">Eylül 2026</span>
          </div>
          <h1 class="main-title">Yönetici Özeti</h1>
          <p class="sub-title">RISE with SAP Stratejik Vizyon, Amaç ve Dönüşüm Metodolojisi</p>
        </div>

        <div class="header-actions">
          <!-- Edit Mode Toggle -->
          <button 
            type="button" 
            class="btn" 
            [class.btn-edit-active]="isEditMode()" 
            [class.btn-secondary]="!isEditMode()"
            (click)="toggleEditMode()">
            <app-icon [name]="isEditMode() ? 'check' : 'sliders'" [size]="16" [color]="isEditMode() ? '#ffffff' : '#475569'"></app-icon>
            <span>{{ isEditMode() ? 'Düzenleme Modundan Çık' : 'Yönetici Özetini Düzenle' }}</span>
          </button>

          <!-- Save Button (Only in edit mode) -->
          <button 
            type="button" 
            class="btn btn-save" 
            *ngIf="isEditMode()"
            (click)="saveContent()">
            <app-icon name="check" [size]="16" color="#ffffff"></app-icon>
            <span>{{ isSaved() ? 'Kaydedildi ✓' : 'Değişiklikleri Kaydet' }}</span>
          </button>

          <!-- Reset Button (Only in edit mode) -->
          <button 
            type="button" 
            class="btn btn-outline-danger" 
            *ngIf="isEditMode()"
            (click)="resetToDefault()">
            <app-icon name="refresh" [size]="15" color="#dc2626"></app-icon>
            <span>Varsayılana Sıfırla</span>
          </button>

          <!-- PDF Export -->
          <button 
            type="button" 
            class="btn btn-primary btn-pdf-export" 
            (click)="exportToPDF()"
            [disabled]="isExporting()">
            <app-icon [name]="isExporting() ? 'refresh' : 'download'" [size]="16" color="#ffffff"></app-icon>
            <span>{{ isExporting() ? 'PDF Üretiliyor...' : 'Raporu İndir (PDF)' }}</span>
          </button>
        </div>
      </div>

      <!-- EDIT MODE ACTIVE NOTIFICATION BANNER -->
      <div class="edit-mode-banner no-print" *ngIf="isEditMode()">
        <div class="banner-content">
          <app-icon name="sliders" [size]="18" color="#0284c7"></app-icon>
          <span>
            <strong>Düzenleme Modu Aktif:</strong> Satış ve Presales ekipleri metinleri müşteriye özel olarak düzenleyebilir. Değişiklikler tarayıcıda saklanır ve PDF çıktısına aynen yansır.
          </span>
        </div>
        <button class="btn btn-xs btn-primary" (click)="saveContent()">Kaydet</button>
      </div>

      <!-- MAIN REPORT CONTAINER (Printable & Exportable) -->
      <div class="report-content-container" #reportContainer id="reportContainer">
        
        <!-- ========================================================================= -->
        <!-- SİSTEMDEN GELEN BÖLÜM: RISE READINESS / RISE SKORU (DÜZENLENEBİLİR)      -->
        <!-- ========================================================================= -->
        @if (!isEditMode()) {
          <div class="hero-score-card">
            <div class="score-ring-section">
              <div class="circular-score-badge">
                <div class="score-number">%{{ content.heroScore?.matchScore || 84 }}</div>
                <div class="score-label">{{ content.heroScore?.matchLabel || 'RISE SKORU' }}</div>
              </div>

              <div class="score-ring-text">
                <div class="status-pill-green">
                  <app-icon name="check" [size]="13" color="#059669"></app-icon>
                  <span>{{ content.heroScore?.badgeText || 'RISE WITH SAP GEÇİŞİNE YÜKSEK DERECEDE UYGUN' }}</span>
                </div>
                <h3>{{ content.heroScore?.title || (activeCustomerName() + ' RISE Readiness & Bulut Uyum Analizi') }}</h3>
                <p>{{ content.heroScore?.description }}</p>
              </div>
            </div>

            <!-- Pillar Match Breakdown Progress Bars -->
            <div class="pillar-breakdown-grid">
              @for (pillar of content.heroScore?.pillars; track pillar.id) {
                <div class="pillar-item">
                  <div class="p-head">
                    <span class="p-name">
                      <app-icon [name]="pillar.icon" [size]="14" [color]="getPillarColor(pillar.colorClass)"></app-icon>
                      {{ pillar.name }}
                    </span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [ngClass]="'bg-' + pillar.colorClass" [style.width.%]="pillar.score"></div>
                  </div>
                  <span class="p-desc">{{ pillar.desc }}</span>
                </div>
              }
            </div>
          </div>
        } @else {
          <!-- EDIT MODE ACTIVE: HERO SCORE CARD CAN BE EDITED -->
          <div class="hero-score-card edit-active-hero">
            <div class="score-ring-section">
              <div class="circular-score-badge edit-badge-box">
                <div class="edit-badge-input-group">
                  <span class="pct">%</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    class="edit-hero-score-input" 
                    [(ngModel)]="content.heroScore!.matchScore" 
                    title="Rise Skoru"
                  />
                </div>
                <input 
                  type="text" 
                  class="edit-hero-label-input" 
                  [(ngModel)]="content.heroScore!.matchLabel" 
                  placeholder="RISE SKORU"
                />
              </div>

              <div class="score-ring-text edit-ring-text">
                <div class="edit-field-group">
                  <label class="edit-field-lbl">Durum Rozeti:</label>
                  <input 
                    type="text" 
                    class="edit-input-hero-badge" 
                    [(ngModel)]="content.heroScore!.badgeText" 
                    placeholder="RISE WITH SAP GEÇİŞİNE YÜKSEK DERECEDE UYGUN" 
                  />
                </div>
                
                <div class="edit-field-group">
                  <label class="edit-field-lbl">Ana Rapor Başlığı:</label>
                  <input 
                    type="text" 
                    class="edit-input-hero-title" 
                    [(ngModel)]="content.heroScore!.title" 
                    placeholder="Başlık giriniz..." 
                  />
                </div>

                <div class="edit-field-group">
                  <label class="edit-field-lbl">Bulut Uyum Özeti / Açıklama:</label>
                  <textarea 
                    class="edit-textarea-hero-desc" 
                    rows="2" 
                    [(ngModel)]="content.heroScore!.description" 
                    placeholder="Mevcut SAP altyapısı incelendiğinde..."></textarea>
                </div>
              </div>
            </div>

            <!-- Editable Pillar Breakdown Grid -->
            <div class="pillar-breakdown-grid edit-pillar-grid">
              @for (pillar of content.heroScore?.pillars; track pillar.id) {
                <div class="pillar-item edit-pillar-item">
                  <div class="p-head-edit">
                    <input 
                      type="text" 
                      class="edit-pillar-name-input" 
                      [(ngModel)]="pillar.name" 
                      placeholder="Metrik Adı" 
                    />
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [ngClass]="'bg-' + pillar.colorClass" [style.width.%]="pillar.score"></div>
                  </div>
                  <input 
                    type="text" 
                    class="edit-pillar-desc-input" 
                    [(ngModel)]="pillar.desc" 
                    placeholder="Açıklama / Alt Metin" 
                  />
                </div>
              }
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- SATIŞ & PRESALES DÜZENLENEBİLİR İÇERİK: 1. AMAÇ                         -->
        <!-- ========================================================================= -->
        <div class="section-card purpose-section">
          <div class="section-header">
            <div class="sec-title-group">
              <div class="icon-circle bg-emerald">
                <app-icon name="sparkles" [size]="18" color="#059669"></app-icon>
              </div>
              <div>
                <h2 class="sec-title" *ngIf="!isEditMode()">{{ content.objectiveTitle }}</h2>
                <input 
                  type="text" 
                  class="edit-input-title" 
                  *ngIf="isEditMode()" 
                  [(ngModel)]="content.objectiveTitle" />

                <p class="sec-subtitle" *ngIf="!isEditMode()">{{ cleanCustomerText(content.objectiveSubtitle) }}</p>
                <textarea 
                  class="edit-textarea-subtitle" 
                  rows="2" 
                  *ngIf="isEditMode()" 
                  [(ngModel)]="content.objectiveSubtitle"></textarea>
              </div>
            </div>
            <span class="pillar-badge emerald">Temel Vizyon</span>
          </div>

          <!-- 8 Temel Değer Taşı Grid -->
          <div class="pillars-grid-8">
            <div class="purpose-card" *ngFor="let pillar of content.objectivePillars; let idx = index">
              <div class="p-icon-box">
                <app-icon [name]="pillar.icon || 'check'" [size]="17" color="#0284c7"></app-icon>
              </div>
              <div class="p-text-body">
                <h4 *ngIf="!isEditMode()">{{ pillar.title }}</h4>
                <input 
                  type="text" 
                  class="edit-input-card-title" 
                  *ngIf="isEditMode()" 
                  [(ngModel)]="pillar.title" />

                <p *ngIf="!isEditMode()">{{ pillar.desc }}</p>
                <textarea 
                  class="edit-textarea-card-desc" 
                  rows="2" 
                  *ngIf="isEditMode()" 
                  [(ngModel)]="pillar.desc"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- SATIŞ & PRESALES DÜZENLENEBİLİR İÇERİK: 2. NASIL?                        -->
        <!-- ========================================================================= -->
        <div class="section-card how-section">
          <div class="section-header">
            <div class="sec-title-group">
              <div class="icon-circle bg-blue">
                <app-icon name="map" [size]="18" color="#0284c7"></app-icon>
              </div>
              <div>
                <h2 class="sec-title" *ngIf="!isEditMode()">{{ content.howTitle }}</h2>
                <input 
                  type="text" 
                  class="edit-input-title" 
                  *ngIf="isEditMode()" 
                  [(ngModel)]="content.howTitle" />

                <p class="sec-subtitle" *ngIf="!isEditMode()">{{ content.howSubtitle }}</p>
                <textarea 
                  class="edit-textarea-subtitle" 
                  rows="2" 
                  *ngIf="isEditMode()" 
                  [(ngModel)]="content.howSubtitle"></textarea>
              </div>
            </div>
            <span class="pillar-badge blue">Uygulama Stratejisi</span>
          </div>

          <!-- Önerilen Geçiş Yöntemi Hero Kartı (2. Görseldeki Yapı) -->
          <div class="rec-method-card-wrapper" *ngIf="content.recommendedMethod">
            <!-- VIEW MODE -->
            <div *ngIf="!isEditMode()" class="hero-recommendation-card">
              <div class="hero-left">
                <div class="hero-icon-box">
                  <app-icon name="check" [size]="28" color="#059669"></app-icon>
                </div>
                <div>
                  <span class="hero-pill">{{ content.recommendedMethod.badge }}</span>
                  <h2>{{ cleanCustomerText(content.recommendedMethod.title) }}</h2>
                  <p>{{ cleanCustomerText(content.recommendedMethod.description) }}</p>
                </div>
              </div>
              <div class="hero-stats">
                <div class="stat-box">
                  <span class="stat-val text-emerald">{{ content.recommendedMethod.stat1Value }}</span>
                  <span class="stat-lbl">{{ content.recommendedMethod.stat1Label }}</span>
                </div>
                <div class="stat-box">
                  <span class="stat-val text-blue">{{ content.recommendedMethod.stat2Value }}</span>
                  <span class="stat-lbl">{{ content.recommendedMethod.stat2Label }}</span>
                </div>
                <div class="stat-box">
                  <span class="stat-val text-purple">{{ content.recommendedMethod.stat3Value }}</span>
                  <span class="stat-lbl">{{ content.recommendedMethod.stat3Label }}</span>
                </div>
              </div>
            </div>

            <!-- EDIT MODE -->
            <div *ngIf="isEditMode()" class="hero-edit-card">
              <div class="card-edit-header">
                <div class="ce-left">
                  <app-icon name="sliders" [size]="18" color="#059669"></app-icon>
                  <h3>Önerilen Geçiş Yöntemi & KPI Metrikleri Düzenleme</h3>
                </div>
                <span class="edit-pill">Düzenleme Modu</span>
              </div>

              <div class="form-grid-hero">
                <div class="form-group span-1">
                  <label class="form-lbl">Rozet Metni (Pill)</label>
                  <input type="text" [(ngModel)]="content.recommendedMethod.badge" placeholder="Örn: ÖNERİLEN GEÇİŞ YÖNTEMİ" class="form-input" />
                </div>

                <div class="form-group span-2">
                  <label class="form-lbl">Yöntem Ana Başlığı</label>
                  <input type="text" [(ngModel)]="content.recommendedMethod.title" placeholder="Örn: Brownfield (System Conversion)..." class="form-input" />
                </div>

                <div class="form-group span-full">
                  <label class="form-lbl">Açıklama & Karar Gerekçesi</label>
                  <textarea [(ngModel)]="content.recommendedMethod.description" rows="3" class="form-textarea" placeholder="Müşteri için önerilen geçiş yaklaşımının detaylı gerekçesi..."></textarea>
                </div>

                <div class="form-group kpi-input-box">
                  <span class="kpi-box-title">1. KPI Metriği</span>
                  <label class="form-lbl">Değer</label>
                  <input type="text" [(ngModel)]="content.recommendedMethod.stat1Value" placeholder="6 Ay" class="form-input" />
                  <label class="sub-label">Etiket</label>
                  <input type="text" [(ngModel)]="content.recommendedMethod.stat1Label" placeholder="Tahmini Proje Süresi" class="form-input" />
                </div>

                <div class="form-group kpi-input-box">
                  <span class="kpi-box-title">2. KPI Metriği</span>
                  <label class="form-lbl">Değer</label>
                  <input type="text" [(ngModel)]="content.recommendedMethod.stat2Value" placeholder="%100" class="form-input" />
                  <label class="sub-label">Etiket</label>
                  <input type="text" [(ngModel)]="content.recommendedMethod.stat2Label" placeholder="Geçmiş Veri Korunumu" class="form-input" />
                </div>

                <div class="form-group kpi-input-box">
                  <span class="kpi-box-title">3. KPI Metriği</span>
                  <label class="form-lbl">Değer</label>
                  <input type="text" [(ngModel)]="content.recommendedMethod.stat3Value" placeholder="Optimum" class="form-input" />
                  <label class="sub-label">Etiket</label>
                  <input type="text" [(ngModel)]="content.recommendedMethod.stat3Label" placeholder="Bütçe / ROI Dengesi" class="form-input" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: 100vh;
      color: #1e293b;
      width: 100%;
      box-sizing: border-box;
    }

    .executive-report-page {
      padding: 1.5rem 1.75rem 3rem;
      width: 100%;
      max-width: 100%;
      margin: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* BUTTONS */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-secondary {
      background: #ffffff;
      color: #334155;
      border-color: #cbd5e1;
      &:hover { background: #f1f5f9; border-color: #94a3b8; }
    }

    .btn-edit-active {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
      &:hover { background: #0369a1; }
    }

    .btn-save {
      background: #059669;
      color: #ffffff;
      border-color: #059669;
      box-shadow: 0 3px 10px rgba(5, 150, 105, 0.3);
      &:hover { background: #047857; }
    }

    .btn-outline-danger {
      background: #fff;
      color: #dc2626;
      border-color: #fca5a5;
      &:hover { background: #fef2f2; }
    }

    .btn-pdf-export {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff;
      box-shadow: 0 3px 10px rgba(5, 150, 105, 0.28);
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #047857 0%, #065f46 100%);
        transform: translateY(-1px);
      }
    }

    .btn-xs {
      padding: 0.3rem 0.75rem;
      font-size: 0.75rem;
      border-radius: 6px;
    }

    /* HEADER */
    .dashboard-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.25rem;
      background: #ffffff;
      padding: 1.35rem 1.65rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);

      .header-left {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        .badge-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .company-badge {
            background: #0284c7;
            color: #ffffff;
            font-size: 0.72rem;
            font-weight: 800;
            padding: 0.18rem 0.55rem;
            border-radius: 4px;
            letter-spacing: 0.02em;
          }

          .report-type-tag {
            background: #f0f9ff;
            color: #0369a1;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.18rem 0.55rem;
            border-radius: 4px;
            border: 1px solid #bae6fd;
          }

          .date-tag {
            font-size: 0.7rem;
            color: #64748b;
            font-weight: 600;
          }
        }

        .main-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .sub-title {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
    }

    /* EDIT BANNER */
    .edit-mode-banner {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 0.75rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      color: #0369a1;
      font-size: 0.82rem;

      .banner-content {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
    }

    /* REPORT CONTENT CONTAINER */
    .report-content-container {
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* 1. HERO SCORE CARD (AUTOMATIC SYSTEM METRICS) */
    .hero-score-card {
      width: 100%;
      box-sizing: border-box;
      background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
      border: 1.5px solid #bae6fd;
      border-radius: 14px;
      padding: 1.75rem;
      box-shadow: 0 8px 24px rgba(2, 132, 199, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      .score-ring-section {
        display: flex;
        align-items: center;
        gap: 2rem;
        flex-wrap: wrap;

        .circular-score-badge {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: #ffffff;
          border: 6px solid #059669;
          box-shadow: 0 4px 15px rgba(5, 150, 105, 0.22);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          .score-number {
            font-size: 1.75rem;
            font-weight: 900;
            color: #059669;
            line-height: 1;
          }

          .score-label {
            font-size: 0.62rem;
            font-weight: 800;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-top: 0.25rem;
          }
        }

        .score-ring-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;

          .status-pill-green {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
            padding: 0.2rem 0.6rem;
            border-radius: 20px;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.03em;
            align-self: flex-start;
          }

          h3 {
            margin: 0;
            font-size: 1.2rem;
            font-weight: 800;
            color: #0f172a;
          }

          p {
            margin: 0;
            font-size: 0.84rem;
            color: #475569;
            line-height: 1.5;
          }
        }
      }

      .pillar-breakdown-grid {
        width: 100%;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
        gap: 1rem;
        background: #ffffff;
        padding: 1.2rem 1.4rem;
        border-radius: 10px;
        border: 1px solid #e2e8f0;

        .pillar-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;

          .p-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.75rem;

            .p-name {
              display: flex;
              align-items: center;
              gap: 0.35rem;
              font-weight: 700;
              color: #334155;
            }

            .p-score { font-weight: 800; font-size: 0.85rem; }
          }

          .progress-bar {
            height: 6px;
            background: #f1f5f9;
            border-radius: 3px;
            overflow: hidden;

            .progress-fill {
              height: 100%;
              border-radius: 3px;
              transition: width 0.6s ease;
            }
          }

          .p-desc {
            font-size: 0.68rem;
            color: #64748b;
            line-height: 1.3;
          }
        }
      }
    }

    /* SECTION CARDS */
    .section-card {
      width: 100%;
      box-sizing: border-box;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.75rem;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1.35rem;

      .section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;

        .sec-title-group {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          flex: 1;

          .icon-circle {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            &.bg-emerald { background: #ecfdf5; }
            &.bg-blue { background: #f0f9ff; }
          }

          .sec-title {
            margin: 0 0 0.3rem 0;
            font-size: 1.2rem;
            font-weight: 800;
            color: #0f172a;
          }

          .sec-subtitle {
            margin: 0;
            font-size: 0.84rem;
            color: #64748b;
            line-height: 1.45;
          }
        }

        .pillar-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.25rem 0.65rem;
          border-radius: 20px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          &.emerald { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
          &.blue { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
        }
      }
    }

    /* 8 PILLARS GRID (AMAÇ) */
    .pillars-grid-8 {
      width: 100%;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
      gap: 1rem;

      .purpose-card {
        min-width: 0;
        box-sizing: border-box;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1.1rem;
        display: flex;
        gap: 0.85rem;
        align-items: flex-start;
        transition: all 0.2s ease;

        &:hover {
          background: #ffffff;
          border-color: #bae6fd;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.07);
          transform: translateY(-1px);
        }

        .p-icon-box {
          width: 34px;
          height: 34px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .p-text-body {
          flex: 1;

          h4 {
            margin: 0 0 0.35rem;
            font-size: 0.88rem;
            font-weight: 700;
            color: #0f172a;
          }

          p {
            margin: 0;
            font-size: 0.78rem;
            color: #64748b;
            line-height: 1.45;
          }
        }
      }
    }

    /* HOW PILLARS GRID (NASIL?) */
    .how-pillars-grid {
      width: 100%;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
      gap: 1.25rem;

      .how-card {
        min-width: 0;
        box-sizing: border-box;
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.35rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        box-shadow: 0 3px 10px rgba(15, 23, 42, 0.03);
        transition: all 0.2s ease;

        &:hover {
          border-color: #0284c7;
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.08);
        }

        .how-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .badge-tag {
            font-size: 0.65rem;
            font-weight: 800;
            padding: 0.2rem 0.55rem;
            border-radius: 4px;
            background: #f0f9ff;
            color: #0284c7;
            border: 1px solid #bae6fd;
            letter-spacing: 0.04em;
          }

          .how-icon {
            width: 32px;
            height: 32px;
            background: #f8fafc;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
        }

        .how-bullets-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;

          li {
            display: flex;
            align-items: flex-start;
            gap: 0.45rem;
            font-size: 0.8rem;
            color: #334155;
            line-height: 1.4;

            .bullet-dot {
              color: #0284c7;
              font-weight: 800;
              line-height: 1;
            }
          }
        }

        .how-footer-note {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 0.75rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          font-size: 0.74rem;
          font-weight: 700;
          color: #047857;
          margin-top: auto;
        }
      }
    }

    /* NOTES SECTION */
    .notes-section {
      background: #f8fafc;
      border: 1px solid #cbd5e1;

      .notes-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e2e8f0;

        .nh-left {
          display: flex;
          align-items: center;
          gap: 0.45rem;

          h4 {
            margin: 0;
            font-size: 0.92rem;
            font-weight: 800;
            color: #0f172a;
          }
        }

        .nh-meta {
          font-size: 0.74rem;
          color: #64748b;
          font-weight: 600;
        }
      }

      .notes-text {
        margin: 0;
        font-size: 0.85rem;
        color: #334155;
        line-height: 1.6;
        font-style: italic;
      }
    }

    /* EDIT CONTROLS */
    .edit-input-title {
      width: 100%;
      box-sizing: border-box;
      max-width: 100%;
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      padding: 0.4rem 0.6rem;
      border: 1px solid #0284c7;
      border-radius: 6px;
      margin-bottom: 0.4rem;
    }

    .edit-textarea-subtitle {
      width: 100%;
      box-sizing: border-box;
      max-width: 100%;
      font-size: 0.84rem;
      color: #334155;
      padding: 0.4rem 0.6rem;
      border: 1px solid #94a3b8;
      border-radius: 6px;
      resize: vertical;
    }

    .edit-input-card-title {
      width: 100%;
      box-sizing: border-box;
      max-width: 100%;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.25rem 0.45rem;
      border: 1px solid #0284c7;
      border-radius: 4px;
      margin-bottom: 0.3rem;
    }

    .edit-textarea-card-desc {
      width: 100%;
      box-sizing: border-box;
      max-width: 100%;
      font-size: 0.78rem;
      padding: 0.25rem 0.45rem;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      resize: vertical;
    }

    .edit-input-how-title {
      width: 100%;
      box-sizing: border-box;
      max-width: 100%;
      font-size: 0.95rem;
      font-weight: 800;
      padding: 0.35rem 0.55rem;
      border: 1px solid #0284c7;
      border-radius: 6px;
    }

    .edit-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.25rem;
      text-transform: uppercase;
    }

    .edit-textarea-bullets {
      width: 100%;
      box-sizing: border-box;
      max-width: 100%;
      font-size: 0.78rem;
      padding: 0.4rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      line-height: 1.4;
      resize: vertical;
    }

    .edit-input-note {
      width: 100%;
      box-sizing: border-box;
      max-width: 100%;
      font-size: 0.75rem;
      padding: 0.3rem 0.5rem;
      border: 1px solid #a7f3d0;
      border-radius: 4px;
      background: #f0fdf4;
    }

    .edit-textarea-notes {
      width: 100%;
      box-sizing: border-box;
      max-width: 100%;
      font-size: 0.85rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid #0284c7;
      border-radius: 6px;
      resize: vertical;
    }

    .edit-meta-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;

      .edit-input-author {
        flex: 1;
        box-sizing: border-box;
        max-width: 100%;
        font-size: 0.8rem;
        padding: 0.3rem 0.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
      }
    }

    /* EDITABLE HERO SCORE CARD STYLES */
    .edit-active-hero {
      border: 2px dashed #0284c7 !important;
      background: #f0fdf4 !important;

      .edit-badge-box {
        border-color: #0284c7 !important;
        background: #f8fafc !important;
      }

      .edit-badge-input-group {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;

        .pct {
          font-size: 1.3rem;
          font-weight: 800;
          color: #059669;
        }

        .edit-hero-score-input {
          width: 58px;
          border: 1px solid #10b981;
          border-radius: 6px;
          padding: 2px 4px;
          font-size: 1.45rem;
          font-weight: 900;
          color: #059669;
          text-align: center;
          background: #ffffff;
        }
      }

      .edit-hero-label-input {
        width: 84px;
        margin-top: 4px;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 2px;
        font-size: 0.6rem;
        font-weight: 800;
        text-align: center;
        color: #475569;
      }

      .edit-ring-text {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;

        .edit-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;

          .edit-field-lbl {
            font-size: 0.68rem;
            font-weight: 700;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .edit-input-hero-badge {
            padding: 0.3rem 0.6rem;
            border: 1px solid #a7f3d0;
            background: #ffffff;
            border-radius: 6px;
            font-size: 0.76rem;
            font-weight: 700;
            color: #059669;
          }

          .edit-input-hero-title {
            padding: 0.35rem 0.6rem;
            border: 1px solid #bae6fd;
            background: #ffffff;
            border-radius: 6px;
            font-size: 0.98rem;
            font-weight: 700;
            color: #0f172a;
          }

          .edit-textarea-hero-desc {
            padding: 0.4rem 0.6rem;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            border-radius: 6px;
            font-size: 0.8rem;
            color: #334155;
            font-family: inherit;
            line-height: 1.45;
          }
        }
      }

      .edit-pillar-grid {
        border-color: #bae6fd !important;
        background: #ffffff !important;
      }

      .edit-pillar-item {
        gap: 0.4rem;

        .p-head-edit {
          display: flex;
          align-items: center;
          gap: 0.4rem;

          .edit-pillar-name-input {
            flex: 1;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 2px 4px;
            font-size: 0.72rem;
            font-weight: 700;
            color: #0f172a;
          }

          .edit-score-wrapper {
            display: flex;
            align-items: center;
            gap: 1px;
            font-size: 0.75rem;
            font-weight: 800;
            color: #0284c7;

            .edit-pillar-score-input {
              width: 36px;
              border: 1px solid #0284c7;
              border-radius: 4px;
              padding: 2px 3px;
              font-size: 0.72rem;
              font-weight: 800;
              text-align: right;
            }
          }
        }

        .edit-pillar-desc-input {
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.66rem;
          color: #475569;
        }
      }
    }

    /* NOTES STREAM & TIMELINE STYLES */
    .notes-count-pill {
      padding: 0.15rem 0.5rem;
      background: #e0f2fe;
      color: #0284c7;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 9999px;
    }

    .nh-right {
      display: flex;
      align-items: center;
      gap: 0.65rem;

      .btn-popup-add-note {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        background: #0284c7;
        border: 1px solid #0284c7;
        border-radius: 6px;
        color: #ffffff;
        font-size: 0.76rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: #0369a1;
          border-color: #0369a1;
        }
      }

      .btn-quick-tool-link {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.32rem 0.65rem;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 6px;
        color: #0284c7;
        font-size: 0.74rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;

        &:hover {
          background: #e0f2fe;
        }
      }
    }

    .notes-stream-exec {
      margin: 1rem 0;

      .empty-notes-prompt {
        padding: 1.5rem;
        text-align: center;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;

        p {
          font-size: 0.84rem;
          color: #64748b;
          margin-bottom: 0.75rem;
        }

        .btn-add-first-note {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 1rem;
          background: #0284c7;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;

          &:hover {
            background: #0369a1;
          }
        }
      }

      .notes-timeline-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        .note-timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

          .tl-bullet {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #0284c7;
            margin-top: 6px;
            flex-shrink: 0;
          }

          .tl-content {
            flex: 1;

            .tl-meta {
              display: flex;
              align-items: center;
              gap: 0.65rem;
              margin-bottom: 0.35rem;

              .tl-date {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                padding: 0.15rem 0.45rem;
                background: #e0f2fe;
                color: #0369a1;
                font-size: 0.72rem;
                font-weight: 700;
                border-radius: 4px;
              }

              .tl-author {
                font-size: 0.74rem;
                color: #475569;
                font-weight: 600;
              }

              .btn-del-note {
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 2px;
                margin-left: auto;
                border-radius: 4px;

                &:hover {
                  background: #fee2e2;
                }
              }
            }

            .tl-text {
              font-size: 0.84rem;
              color: #1e293b;
              line-height: 1.45;
              white-space: pre-wrap;
            }
          }
        }
      }
    }

    .exec-add-note-box {
      margin-top: 1rem;
      padding: 1rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;

      .add-note-inline-title {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.78rem;
        font-weight: 700;
        color: #166534;
      }

      .add-note-inline-inputs {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .author-inline-input {
          padding: 0.35rem 0.65rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.8rem;
          max-width: 280px;
        }

        .note-textarea-wrap {
          display: flex;
          gap: 0.6rem;
          align-items: flex-end;

          .btn-inline-add {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.5rem 1rem;
            background: #059669;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;

            &:hover:not(:disabled) {
              background: #047857;
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }
    }

    /* COLOR UTILITIES */
    .text-blue { color: #0284c7; }
    .text-emerald { color: #059669; }
    .text-purple { color: #7e22ce; }
    .text-amber { color: #d97706; }
    .bg-blue { background: #0284c7; }
    .bg-emerald { background: #10b981; }
    .bg-purple { background: #7e22ce; }
    .bg-amber { background: #f59e0b; }

    /* RECOMMENDED METHOD HERO CARD (UNDER NASIL YAPİYORUZ) */
    .rec-method-card-wrapper {
      width: 100%;
      box-sizing: border-box;
    }

    .hero-recommendation-card {
      background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
      border: 1px solid #bbf7d0;
      border-radius: 14px;
      padding: 1.5rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.06);

      .hero-left {
        display: flex;
        gap: 1.25rem;
        align-items: flex-start;
        max-width: 65%;

        .hero-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hero-pill {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #059669;
          text-transform: uppercase;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0.2rem 0 0.4rem 0;
        }

        p {
          font-size: 0.82rem;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }
      }

      .hero-stats {
        display: flex;
        gap: 1.25rem;

        .stat-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 0.85rem 1.15rem;
          border-radius: 10px;
          text-align: center;
          min-width: 105px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);

          .stat-val { font-size: 1.35rem; font-weight: 800; display: block; }
          .stat-lbl { font-size: 0.68rem; color: #64748b; font-weight: 600; }
          .text-emerald { color: #059669; }
          .text-blue { color: #0284c7; }
          .text-purple { color: #7c3aed; }
        }
      }
    }

    .hero-edit-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);

      .card-edit-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid #f1f5f9;

        .ce-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;

          h3 {
            font-size: 1.05rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
        }

        .edit-pill {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }
      }
    }

    .form-grid-hero {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;

      .span-1 { grid-column: span 1; }
      .span-2 { grid-column: span 2; }
      .span-full { grid-column: 1 / -1; }

      .kpi-input-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        .kpi-box-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #0284c7;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.2rem;
        }

        .sub-label {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 600;
          margin-top: 0.2rem;
        }
      }

      .form-lbl {
        font-size: 0.74rem;
        font-weight: 700;
        color: #334155;
      }

      .form-input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        font-size: 0.82rem;
        color: #0f172a;
        background: #ffffff;
        &:focus { outline: none; border-color: #0284c7; }
      }

      .form-textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        font-size: 0.82rem;
        color: #0f172a;
        background: #ffffff;
        resize: vertical;
        line-height: 1.5;
        &:focus { outline: none; border-color: #0284c7; }
      }
    }

    /* HIGH RESOLUTION PRINT STYLES */
    @media print {
      body { background: #ffffff !important; }
      .no-print, .sidebar, app-sidebar, .header-actions { display: none !important; }
      .executive-report-page { padding: 0 !important; background: #ffffff !important; max-width: 100% !important; }
      .hero-score-card { break-inside: avoid; background: #ffffff !important; border: 2px solid #0284c7 !important; }
      .section-card { break-inside: avoid; box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
      .purpose-card, .how-card, .hero-recommendation-card { break-inside: avoid; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  customerService = inject(CustomerService);
  basisService = inject(BasisSizingService);
  notesService = inject(NotesService);
  quickToolsService = inject(QuickToolsService);
  riseScoreService = inject(RiseScoreService);

  isExporting = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  isSaved = signal<boolean>(false);

  content: ExecutiveSummaryData = getDefaultExecutiveData('Müşteri');

  activeCustomerName = computed(() => {
    const cust = this.customerService.activeCustomer();
    const name = cust?.name || '';
    if (name.includes('*') || cust?.id === 'cust-sigorta' || !name) {
      return 'Kale Endüstri Holding';
    }
    return name;
  });

  matchScoreText = computed(() => {
    return '%' + (this.content?.heroScore?.matchScore ?? 84);
  });

  inlineNoteText = '';
  inlineNoteAuthor = 'Satış & Presales Ekibi';

  @ViewChild('reportContainer') reportContainer!: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.loadSavedContent();
  }

  toggleEditMode(): void {
    this.isEditMode.update(v => !v);
  }

  getPillarColor(colorClass: string): string {
    switch (colorClass) {
      case 'blue': return '#0284c7';
      case 'emerald': return '#059669';
      case 'purple': return '#7e22ce';
      case 'amber': return '#d97706';
      default: return '#0284c7';
    }
  }

  addInlineNote(): void {
    if (!this.inlineNoteText.trim()) return;
    this.notesService.addNote(this.inlineNoteText, this.inlineNoteAuthor);
    this.inlineNoteText = '';
  }

  deleteNote(id: string): void {
    if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
      this.notesService.deleteNote(id);
    }
  }

  updateBullets(item: HowPillar, rawText: string): void {
    item.bullets = rawText.split('\n').filter(line => line.trim().length > 0);
  }

  cleanCustomerText(text?: string): string {
    return this.customerService.cleanCustomerText(text, this.activeCustomerName());
  }

  saveContent(): void {
    try {
      const custId = this.customerService.activeCustomer()?.id || 'default';
      const custName = this.activeCustomerName();
      if (this.content.heroScore?.title) {
        this.content.heroScore.title = this.cleanCustomerText(this.content.heroScore.title);
      }
      if (this.content.objectiveSubtitle) {
        this.content.objectiveSubtitle = this.cleanCustomerText(this.content.objectiveSubtitle);
      }
      if (this.content.recommendedMethod) {
        if (this.content.recommendedMethod.title) {
          this.content.recommendedMethod.title = this.cleanCustomerText(this.content.recommendedMethod.title);
        }
        if (this.content.recommendedMethod.description) {
          this.content.recommendedMethod.description = this.cleanCustomerText(this.content.recommendedMethod.description);
        }
      }
      localStorage.setItem(`task_force_exec_summary_${custId}`, JSON.stringify(this.content));
      if (this.content.recommendedMethod) {
        try {
          const solSaved = localStorage.getItem(`taskforce_recommended_method_${custId}`);
          let sol = solSaved ? JSON.parse(solSaved) : null;
          if (sol) {
            sol.badge = this.content.recommendedMethod.badge;
            sol.title = this.cleanCustomerText(this.content.recommendedMethod.title);
            sol.description = this.cleanCustomerText(this.content.recommendedMethod.description);
            sol.stat1Value = this.content.recommendedMethod.stat1Value;
            sol.stat1Label = this.content.recommendedMethod.stat1Label;
            sol.stat2Value = this.content.recommendedMethod.stat2Value;
            sol.stat2Label = this.content.recommendedMethod.stat2Label;
            sol.stat3Value = this.content.recommendedMethod.stat3Value;
            sol.stat3Label = this.content.recommendedMethod.stat3Label;
            localStorage.setItem(`taskforce_recommended_method_${custId}`, JSON.stringify(sol));
          }
        } catch (e) {}
      }
      this.isSaved.set(true);
      setTimeout(() => this.isSaved.set(false), 2500);
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  resetToDefault(): void {
    const custName = this.activeCustomerName();
    this.content = getDefaultExecutiveData(custName);
    this.saveContent();
  }

  private loadSavedContent(): void {
    try {
      const custId = this.customerService.activeCustomer()?.id || 'default';
      const custName = this.activeCustomerName();
      const raw = localStorage.getItem(`task_force_exec_summary_${custId}`);
      if (raw) {
        this.content = JSON.parse(raw);
        if (!this.content.heroScore || !this.content.heroScore.pillars || this.content.heroScore.pillars.length === 0) {
          this.content.heroScore = getDefaultHeroScore(custName);
        }
        if (this.content.heroScore && (!this.content.heroScore.matchLabel || this.content.heroScore.matchLabel === 'MATCH SKORU')) {
          this.content.heroScore.matchLabel = 'RISE SKORU';
        }
        if (this.content.heroScore?.title) {
          this.content.heroScore.title = this.cleanCustomerText(this.content.heroScore.title);
          if (this.content.heroScore.title.includes('**')) {
            this.content.heroScore.title = `${custName} RISE Readiness & Bulut Uyum Analizi`;
          }
        }
        if (this.content.objectiveSubtitle) {
          this.content.objectiveSubtitle = this.cleanCustomerText(this.content.objectiveSubtitle);
          if (this.content.objectiveSubtitle.includes('**')) {
            this.content.objectiveSubtitle = `${custName} için RISE with SAP dönüşümü; mevcut ERP omurgasını modern bulut standartlarına taşıyarak işletmeye yüksek çeviklik, güvenlik ve esneklik kazandırmayı hedeflemektedir.`;
          }
        }
        if (this.content.howSubtitle && this.content.howSubtitle.includes('3 temel sacayağı')) {
          this.content.howSubtitle = 'Dönüşümün güvenle ve en düşük operasyonel risk ile tamamlanması için planlanan stratejik geçiş yaklaşımı ve temel metrikler:';
        }
        if (!this.content.recommendedMethod) {
          try {
            const solSaved = localStorage.getItem(`taskforce_recommended_method_${custId}`);
            if (solSaved) {
              const sol = JSON.parse(solSaved);
              this.content.recommendedMethod = {
                badge: sol.badge,
                title: this.cleanCustomerText(sol.title),
                description: this.cleanCustomerText(sol.description),
                stat1Value: sol.stat1Value,
                stat1Label: sol.stat1Label,
                stat2Value: sol.stat2Value,
                stat2Label: sol.stat2Label,
                stat3Value: sol.stat3Value,
                stat3Label: sol.stat3Label
              };
            } else {
              this.content.recommendedMethod = getDefaultExecutiveData(custName).recommendedMethod;
            }
          } catch (e) {
            this.content.recommendedMethod = getDefaultExecutiveData(custName).recommendedMethod;
          }
        }
        if (this.content.recommendedMethod) {
          if (this.content.recommendedMethod.description) {
            this.content.recommendedMethod.description = this.cleanCustomerText(this.content.recommendedMethod.description);
            if (this.content.recommendedMethod.description.includes('**')) {
              this.content.recommendedMethod.description = `${custName} için geçmiş işlem verisi ve mevzuat denetim sürekliliği zorunlu olduğu için saf Greenfield elenmiştir. MM/FI çekirdeğinin doğrudan taşındığı, yüksek boyutlu atıl verilerin go-live öncesi arşivlendiği ve CO/BP temizliğinin yapıldığı Brownfield yaklaşımı en düşük maliyet ve en yüksek başarı oranını sunmaktadır.`;
            }
          }
          if (this.content.recommendedMethod.title) {
            this.content.recommendedMethod.title = this.cleanCustomerText(this.content.recommendedMethod.title);
          }
        }
      } else {
        this.content = getDefaultExecutiveData(custName);
      }
    } catch (e) {
      this.content = getDefaultExecutiveData(this.activeCustomerName());
    }
  }

  exportToPDF(): void {
    this.quickToolsService.openPdfExport();
  }
}
