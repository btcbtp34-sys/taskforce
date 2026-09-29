import { Component, inject, signal, ElementRef, ViewChild, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export interface ExecutiveSummaryData {
  objectiveTitle: string;
  objectiveSubtitle: string;
  objectivePillars: ObjectivePillar[];
  howTitle: string;
  howSubtitle: string;
  howPillars: HowPillar[];
  salesNotes: string;
  preparedBy: string;
}

export function getDefaultExecutiveData(customerName: string): ExecutiveSummaryData {
  return {
    objectiveTitle: '1. Amaç: RISE with SAP ile Yeni Nesil Kurumsal Dönüşüm',
    objectiveSubtitle: `${customerName} için RISE with SAP dönüşümü; mevcut ERP omurgasını modern bulut standartlarına taşıyarak işletmeye yüksek çeviklik, güvenlik ve esneklik kazandırmayı hedeflemektedir.`,
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
    howSubtitle: 'Dönüşümün güvenle ve en düşük operasyonel risk ile tamamlanması için planlanan 3 temel sacayağı:',
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
        <!-- SİSTEMDEN OTOMATİK GELEN BÖLÜM: SADECE RISE READINESS / MATCH SKORU      -->
        <!-- ========================================================================= -->
        <div class="hero-score-card">
          <div class="score-ring-section">
            <div class="circular-score-badge">
              <div class="score-number">{{ matchScoreText() }}</div>
              <div class="score-label">MATCH SKORU</div>
            </div>

            <div class="score-ring-text">
              <div class="status-pill-green">
                <app-icon name="check" [size]="13" color="#059669"></app-icon>
                <span>RISE WITH SAP GEÇİŞİNE YÜKSEK DERECEDE UYGUN</span>
              </div>
              <h3>{{ activeCustomerName() }} RISE Readiness & Bulut Uyum Analizi</h3>
              <p>
                Mevcut SAP altyapısı, aktif kullanıcı profili, veritabanı boyutlandırması ve entegrasyon envanteri incelendiğinde; 
                şirketiniz <strong>{{ matchScoreText() }} genel bulut uyum skoru</strong> ile RISE with SAP Private Cloud dönüşümüne tam hazır durumdadır.
              </p>
            </div>
          </div>

          <!-- Pillar Match Breakdown Progress Bars -->
          <div class="pillar-breakdown-grid">
            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="database" [size]="14" color="#0284c7"></app-icon> Altyapı Konsolidasyonu</span>
                <strong class="p-score text-blue">%91</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-blue" style="width: 91%"></div></div>
              <span class="p-desc">Dağınık Sunucular ➔ 1 S/4HANA Private Cloud DB</span>
            </div>

            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="users" [size]="14" color="#059669"></app-icon> Lisans Optimizasyonu</span>
                <strong class="p-score text-emerald">%85</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-emerald" style="width: 85%"></div></div>
              <span class="p-desc">FUE Lisanslama ile Atıl Lisans ve Aşım Riski Sıfırlanır</span>
            </div>

            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="bolt" [size]="14" color="#7e22ce"></app-icon> Entegrasyon BTP Uyumu</span>
                <strong class="p-score text-purple">%82</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-purple" style="width: 82%"></div></div>
              <span class="p-desc">PO / AIF Servisleri SAP Integration Suite Uyumlu</span>
            </div>

            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="layers" [size]="14" color="#d97706"></app-icon> DVM & Bellek Tasarrufu</span>
                <strong class="p-score text-amber">%78</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-amber" style="width: 78%"></div></div>
              <span class="p-desc">Veri Arşivleme ile HANA Bellek İhtiyacı Optimize Edilir</span>
            </div>

            <div class="pillar-item">
              <div class="p-head">
                <span class="p-name"><app-icon name="shield" [size]="14" color="#059669"></app-icon> Destek & Güvenlik Riski</span>
                <strong class="p-score text-emerald">%100</strong>
              </div>
              <div class="progress-bar"><div class="progress-fill bg-emerald" style="width: 100%"></div></div>
              <span class="p-desc">Eski Sürümler ve EoS Destek Sonu Riskleri Ortadan Kalkar</span>
            </div>
          </div>
        </div>

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

                <p class="sec-subtitle" *ngIf="!isEditMode()">{{ content.objectiveSubtitle }}</p>
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

          <!-- 3 Ana Kırılım: Geçiş Yöntemi, Takvim, Sabit -> Değişken Maliyet -->
          <div class="how-pillars-grid">
            <div class="how-card" *ngFor="let item of content.howPillars; let idx = index">
              <div class="how-card-top">
                <div class="badge-tag">{{ item.badge }}</div>
                <div class="how-icon">
                  <app-icon [name]="item.icon || 'layers'" [size]="16" color="#0284c7"></app-icon>
                </div>
              </div>

              <h3 *ngIf="!isEditMode()">{{ item.title }}</h3>
              <input 
                type="text" 
                class="edit-input-how-title" 
                *ngIf="isEditMode()" 
                [(ngModel)]="item.title" />

              <ul class="how-bullets-list" *ngIf="!isEditMode()">
                <li *ngFor="let bullet of item.bullets">
                  <span class="bullet-dot">•</span>
                  <span>{{ bullet }}</span>
                </li>
              </ul>

              <div class="how-bullets-edit" *ngIf="isEditMode()">
                <label class="edit-label">Maddeler (Her satır bir madde):</label>
                <textarea 
                  class="edit-textarea-bullets" 
                  rows="4" 
                  [ngModel]="item.bullets.join('\n')" 
                  (ngModelChange)="updateBullets(item, $event)"></textarea>
              </div>

              <div class="how-footer-note" *ngIf="!isEditMode()">
                <app-icon name="check" [size]="13" color="#059669"></app-icon>
                <span>{{ item.note }}</span>
              </div>
              <input 
                type="text" 
                class="edit-input-note" 
                *ngIf="isEditMode()" 
                [(ngModel)]="item.note" 
                placeholder="Alt vurgu notu" />
            </div>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- PRESALES & SATIŞ MÜŞTERİYE ÖZEL NOTLAR VE İMZA                         -->
        <!-- ========================================================================= -->
        <div class="section-card notes-section">
          <div class="notes-header">
            <div class="nh-left">
              <app-icon name="file-text" [size]="16" color="#475569"></app-icon>
              <h4>Satış & Presales Değerlendirme Notu</h4>
            </div>
            <span class="nh-meta">Hazırlayan: {{ content.preparedBy }}</span>
          </div>

          <p class="notes-text" *ngIf="!isEditMode()">{{ content.salesNotes }}</p>
          <textarea 
            class="edit-textarea-notes" 
            rows="3" 
            *ngIf="isEditMode()" 
            [(ngModel)]="content.salesNotes" 
            placeholder="Presales ve Satış ekipleri müşteriye özel notlarını buraya girebilir..."></textarea>

          <div class="edit-meta-row" *ngIf="isEditMode()">
            <label class="edit-label">Hazırlayan Ekip:</label>
            <input type="text" class="edit-input-author" [(ngModel)]="content.preparedBy" />
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

    /* COLOR UTILITIES */
    .text-blue { color: #0284c7; }
    .text-emerald { color: #059669; }
    .text-purple { color: #7e22ce; }
    .text-amber { color: #d97706; }
    .bg-blue { background: #0284c7; }
    .bg-emerald { background: #10b981; }
    .bg-purple { background: #7e22ce; }
    .bg-amber { background: #f59e0b; }

    /* HIGH RESOLUTION PRINT STYLES */
    @media print {
      body { background: #ffffff !important; }
      .no-print, .sidebar, app-sidebar, .header-actions { display: none !important; }
      .executive-report-page { padding: 0 !important; background: #ffffff !important; max-width: 100% !important; }
      .hero-score-card { break-inside: avoid; background: #ffffff !important; border: 2px solid #0284c7 !important; }
      .section-card { break-inside: avoid; box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
      .purpose-card, .how-card { break-inside: avoid; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  customerService = inject(CustomerService);
  basisService = inject(BasisSizingService);

  isExporting = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  isSaved = signal<boolean>(false);

  content: ExecutiveSummaryData = getDefaultExecutiveData('Müşteri');

  activeCustomerName = computed(() => this.customerService.activeCustomer()?.name || 'Müşteri');

  matchScoreText = computed(() => {
    return '%84';
  });

  @ViewChild('reportContainer') reportContainer!: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.loadSavedContent();
  }

  toggleEditMode(): void {
    this.isEditMode.update(v => !v);
  }

  updateBullets(item: HowPillar, rawText: string): void {
    item.bullets = rawText.split('\n').filter(line => line.trim().length > 0);
  }

  saveContent(): void {
    try {
      const custId = this.customerService.activeCustomer()?.id || 'default';
      localStorage.setItem(`task_force_exec_summary_${custId}`, JSON.stringify(this.content));
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
      } else {
        this.content = getDefaultExecutiveData(custName);
      }
    } catch (e) {
      this.content = getDefaultExecutiveData(this.activeCustomerName());
    }
  }

  async exportToPDF(): Promise<void> {
    if (this.isExporting()) return;
    this.isExporting.set(true);

    try {
      const element = this.reportContainer?.nativeElement || document.getElementById('reportContainer');
      if (!element) {
        window.print();
        this.isExporting.set(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const custName = this.activeCustomerName().replace(/\s+/g, '_');
      pdf.save(`${custName}_Yonetici_Ozeti_Raporu.pdf`);
    } catch (error) {
      console.error('PDF export failed, fallback to print:', error);
      window.print();
    } finally {
      this.isExporting.set(false);
    }
  }
}
