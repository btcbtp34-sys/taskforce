import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

export interface MethodBullet {
  dotColor: 'green' | 'blue' | 'amber' | 'red';
  label: string;
  text: string;
}

export interface MethodCardData {
  id: string;
  badgeClass: 'recommended' | 'lift-shift' | 'partial' | 'not-suitable';
  badgeText: string;
  duration: string;
  title: string;
  subtitle: string;
  bullets: MethodBullet[];
  footerNote: string;
}

export function getDefaultMethodCards(): MethodCardData[] {
  return [
    {
      id: 'brownfield',
      badgeClass: 'recommended',
      badgeText: 'ÖNERİLEN ÇÖZÜM',
      duration: '6 Ay',
      title: 'Brownfield (System Conversion)',
      subtitle: 'Teknik Dönüşüm & In-Place Migration',
      bullets: [
        { dotColor: 'green', label: 'Geçmiş Veri Bütünlüğü:', text: 'Tüm finansal ve operasyonel geçmiş işlem verisi otomatik olarak S/4HANA\'ya taşınır.' },
        { dotColor: 'green', label: 'Sadeleştirme & Z Kod Temizliği:', text: 'SAP Readiness Check ile uyumsuz Z programları elenir; zorunlu Simplification Item\'lar uyarlanır.' },
        { dotColor: 'green', label: 'DVM & Arşivleme Entegrasyonu:', text: 'REGUP, ACDOCA gibi yüksek boyutlu tablolar geçiş öncesi arşivlenerek HANA bellek maliyeti minimize edilir.' },
        { dotColor: 'green', label: 'LShift ile RISE\'a Taşınma:', text: 'Temizlenen ve dönüştürülen sistem tek adımda RISE with SAP Bulut altyapısına transfer edilir.' }
      ],
      footerNote: 'En düşük risk ve en hızlı canlıya geçiş modeli'
    },
    {
      id: 'lift-shift',
      badgeClass: 'lift-shift',
      badgeText: 'ALTERNATİF',
      duration: '3 - 6 Ay',
      title: 'Lift & Shift (Cloud Migration)',
      subtitle: 'Mevcut ECC Sistemi Buluta Taşıma',
      bullets: [
        { dotColor: 'blue', label: 'Hızlı Bulut Geçişi:', text: 'Mevcut SAP ECC sistemi hiçbir değişiklik yapılmadan Azure / AWS / GCP altyapısına taşınır.' },
        { dotColor: 'blue', label: 'Sıfır Uygulama Değişikliği:', text: 'Z kodları, konfigürasyonlar ve süreçler aynen korunur; kullanıcıları doğrudan etkilemez.' },
        { dotColor: 'amber', label: 'S/4HANA Geçişi Ertelenir:', text: 'ECC on-premise lisans süresi uzatılır; ancak S/4HANA dönüşümü ayrı bir proje olarak sonraya bırakılır.' },
        { dotColor: 'amber', label: 'Kısa Vadeli Çözüm:', text: 'Altyapı maliyetlerini düşürür, esneklik kazandırır; ancak uzun vadede tekrar geçiş yatırımı gerekir.' }
      ],
      footerNote: 'Hızlı bulut kazanımı ama S/4HANA dönüşümü ertelenir'
    },
    {
      id: 'selective',
      badgeClass: 'partial',
      badgeText: 'KISMEN UYGUN',
      duration: '12 Ay',
      title: 'Selective Data Transition',
      subtitle: 'Shell Conversion & Seçici Veri Göçü',
      bullets: [
        { dotColor: 'amber', label: 'Kabuk (Shell) Sistem Oluşturma:', text: 'Teknik altyapı ve konfigürasyon kopyalanarak veri olmadan yükseltilir.' },
        { dotColor: 'amber', label: 'Hibrit Yaklaşım:', text: 'CO ana verisi ve BP temiz kurulurken, MM/FI çekirdeği geçmiş hareketleriyle göç ettirilir.' },
        { dotColor: 'amber', label: 'Özel Partner Araçları:', text: 'SNP, cbs veya Natuvion gibi lisanslı toollar gerektirir; danışmanlık eforu yüksektir.' },
        { dotColor: 'amber', label: 'Maliyet & Süre Dezavantajı:', text: 'Proje süresi 12 aya uzar ve ek tool maliyeti bütçeyi artırır.' }
      ],
      footerNote: 'Yalnızca radikal süreç dönüşümü istenirse alternatif'
    },
    {
      id: 'greenfield',
      badgeClass: 'not-suitable',
      badgeText: 'UYGUN DEĞİL',
      duration: '12 - 18 Ay',
      title: 'Greenfield (Yeniden Kurulum)',
      subtitle: 'Sıfırdan Temiz Sayfa Kurulumu',
      bullets: [
        { dotColor: 'red', label: 'Geçmiş Veri Kaybı:', text: 'Sadece açılış bakiyeleri taşınır; geçmiş hareketler yeni sistemde raporlanamaz.' },
        { dotColor: 'red', label: 'Müşteri Önceliğiyle Çelişki:', text: 'Geçmiş verinin erişilebilirliğini şart koştuğu için elenmiştir.' },
        { dotColor: 'red', label: 'Yüksek İş Eforu & Risk:', text: 'Tüm iş birimlerinin süreçleri yeniden tasarlaması gerekir; değişim yönetimi kritik risk taşır.' },
        { dotColor: 'red', label: 'Maksimum Bütçe Yükü:', text: 'En yüksek danışmanlık bütçesi ve en uzun canlıya geçiş takvimi.' }
      ],
      footerNote: 'Süreklilik gereksinimi nedeniyle önerilmemektedir'
    }
  ];
}

export interface PhaseStep {
  id: string;
  stepNumber: string;
  badge: string;
  title: string;
  items: string[];
  isHighlight?: boolean;
}

export interface RecommendedMethodData {
  badge: string;
  title: string;
  description: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  roadmapTitle: string;
  phases: PhaseStep[];
}

export function getDefaultRecommendedData(customerName: string): RecommendedMethodData {
  const name = customerName || 'Müşteri';
  return {
    badge: 'ÖNERİLEN GEÇİŞ YÖNTEMİ',
    title: 'Brownfield (System Conversion) + DVM / Arşivleme',
    description: `${name} için geçmiş işlem verisi ve mevzuat denetim sürekliliği zorunlu olduğu için saf Greenfield elenmiştir. MM/FI çekirdeğinin doğrudan taşındığı, yüksek boyutlu atıl verilerin go-live öncesi arşivlendiği ve CO/BP temizliğinin yapıldığı Brownfield yaklaşımı en düşük maliyet ve en yüksek başarı oranını sunmaktadır.`,
    stat1Value: '6 Ay',
    stat1Label: 'Tahmini Proje Süresi',
    stat2Value: '%100',
    stat2Label: 'Geçmiş Veri Korunumu',
    stat3Value: 'Optimum',
    stat3Label: 'Bütçe / ROI Dengesi',
    roadmapTitle: 'Önerilen Brownfield 4 Fazlı Dönüşüm Yol Haritası',
    phases: [
      {
        id: 'phase-1',
        stepNumber: '01',
        badge: '1. - 2. Ay',
        title: 'Hazırlık & DVM',
        items: [
          'SAP Readiness Check 2.0',
          'DVM Arşivleme Projesi (REGUP/ACDOCA)',
          'HANA Sizing Optimizasyonu'
        ],
        isHighlight: false
      },
      {
        id: 'phase-2',
        stepNumber: '02',
        badge: '2. - 3. Ay',
        title: 'Sadeleştirme & Kod',
        items: [
          'Business Partner (BP) Ön Dönüşümü',
          'Malzeme Defteri Aktivasyonu',
          'Z Kod ABAP S/4HANA Uyarlaması'
        ],
        isHighlight: false
      },
      {
        id: 'phase-3',
        stepNumber: '03',
        badge: '4. - 5. Ay',
        title: 'System Conversion',
        items: [
          'SUM (Software Update Manager) ile Geçiş',
          'Sandbox & QA Dönüşüm Provaları',
          'Finansal Veri Mutabakat Testleri'
        ],
        isHighlight: false
      },
      {
        id: 'phase-4',
        stepNumber: '04',
        badge: '6. Ay',
        title: 'RISE Canlıya Geçiş',
        items: [
          'Cutover & Go-Live Operasyonu',
          'LShift ile RISE Cloud DB Geçişi',
          'Hypercare Destek & Optimizasyon'
        ],
        isHighlight: true
      }
    ]
  };
}

export interface ThirdPartySystem {
  id: string;
  name: string;
  category: 'Satış & CRM' | 'Finans & Banka' | 'Yasal & e-Dönüşüm' | 'Lojistik & WMS' | 'İK & Masraf' | 'Analitik & BI' | 'İletişim';
  purpose: string;
  currentProtocol: string;
  targetProtocol: string;
  strategy: 'Modernize' | 'BTP Wrapper' | 'Direct Re-host' | 'Standart Değişim' | 'Emekli Etme';
  criticality: 'KRİTİK' | 'YÜKSEK' | 'ORTA';
  status: 'Hazır' | 'Tasarlandı' | 'Analiz Edildi' | 'Geliştirme Bekliyor';
  notes: string;
}

// Solution Proposal Component
@Component({
  selector: 'app-solution-proposal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="solution-page">
      <!-- Top Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="badge-row">
            <span class="company-badge">{{ customerService.activeCustomer().name }}</span>
            <span class="solution-tag">Stratejik Çözüm Konsolu</span>
          </div>
          <h1 class="page-title">
            <app-icon name="map" [size]="22" color="#7c3aed"></app-icon>
            Çözüm Önerisi
          </h1>
          <p class="page-subtitle">
            SAP S/4HANA Dönüşüm Metodolojisi, Hedef Bulut Mimarisi ve Müşteri Bazlı 3. Parti Entegrasyon Haritası
          </p>
        </div>

        <div class="header-actions">
          <button class="btn btn-outline" routerLink="/architecture-map" [queryParams]="{ mode: 'rise' }">
            <app-icon name="sparkles" [size]="15" color="#059669"></app-icon>
            <span>Canlı Mimari Şeması</span>
          </button>
          <button class="btn btn-primary" routerLink="/business-case">
            <app-icon name="dollar" [size]="15" color="#ffffff"></app-icon>
            <span>TCO & Finansal Model</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs (3 Ana Kırılım) -->
      <div class="tab-navigation-card">
        <div class="nav-tabs-bar">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'methods'"
            (click)="selectTab('methods')">
            <app-icon name="shuffle" [size]="16" [color]="activeTab() === 'methods' ? '#0284c7' : '#64748b'"></app-icon>
            <div class="tab-label-group">
              <span class="tab-title">SAP Geçiş Yöntemleri</span>
              <span class="tab-desc">Brownfield, Selective Data Transition & Strateji</span>
            </div>
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'target-architecture'"
            (click)="selectTab('target-architecture')">
            <app-icon name="layers" [size]="16" [color]="activeTab() === 'target-architecture' ? '#0284c7' : '#64748b'"></app-icon>
            <div class="tab-label-group">
              <span class="tab-title">Hedef Mimari & 3rd Partiler</span>
              <span class="tab-desc">Mevcut (Solda) vs Hedef (Sağda) + Müşteri Entegrasyon Tablosu</span>
            </div>
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'recommended'"
            (click)="selectTab('recommended')">
            <app-icon name="sparkles" [size]="16" [color]="activeTab() === 'recommended' ? '#0284c7' : '#64748b'"></app-icon>
            <div class="tab-label-group">
              <span class="tab-title">Önerilen Geçiş Yöntemi</span>
              <span class="tab-desc">Brownfield Yol Haritası, Fazlar & Süreç Modeli</span>
            </div>
          </button>
        </div>
      </div>

      <!-- ================= TAB 1: SAP GEÇİŞ YÖNTEMLERİ ================= -->
      <div class="tab-content" *ngIf="activeTab() === 'methods'">

        <!-- Toolbar -->
        <div class="recommended-toolbar" style="margin-bottom: 1.25rem;">
          <div class="toolbar-left">
            <span class="status-indicator-badge" [class.customized]="methodsCustomized()">
              <app-icon [name]="methodsCustomized() ? 'edit' : 'check-circle'" [size]="14"
                [color]="methodsCustomized() ? '#b45309' : '#15803d'"></app-icon>
              <span>{{ methodsCustomized() ? 'Özelleştirilmiş Kart İçerikleri' : 'Varsayılan Kart İçerikleri' }}</span>
            </span>
            <span *ngIf="methodsSaveMessage()" class="save-toast-pill">
              <app-icon name="check" [size]="14" color="#15803d"></app-icon>
              {{ methodsSaveMessage() }}
            </span>
          </div>
          <div class="toolbar-actions">
            <button *ngIf="!isEditingMethods()" type="button" class="btn-rec btn-rec-edit" (click)="startEditMethods()">
              <app-icon name="edit" [size]="14" color="#0284c7"></app-icon>
              <span>Kartları Düzenle</span>
            </button>
            <button *ngIf="!isEditingMethods() && methodsCustomized()" type="button" class="btn-rec btn-rec-reset" (click)="resetMethodCards()">
              <app-icon name="refresh" [size]="14" color="#64748b"></app-icon>
              <span>Varsayılana Sıfırla</span>
            </button>
            <button *ngIf="isEditingMethods()" type="button" class="btn-rec btn-rec-cancel" (click)="cancelEditMethods()">
              <app-icon name="x" [size]="14" color="#475569"></app-icon>
              <span>İptal</span>
            </button>
            <button *ngIf="isEditingMethods()" type="button" class="btn-rec btn-rec-save" (click)="saveMethodCards()">
              <app-icon name="check" [size]="14" color="#ffffff"></app-icon>
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </div>

        <!-- VIEW MODE: Dynamic Cards -->
        <div *ngIf="!isEditingMethods()" class="methods-grid methods-grid-4">
          <div *ngFor="let card of methodCards()"
            class="method-card"
            [ngClass]="card.badgeClass">
            <div class="card-header">
              <div class="header-top">
                <span class="badge-severity" [ngClass]="card.badgeClass">{{ card.badgeText }}</span>
                <span class="time-badge">{{ card.duration }}</span>
              </div>
              <h3>{{ card.title }}</h3>
              <p class="method-sub">{{ card.subtitle }}</p>
            </div>
            <div class="card-body">
              <div *ngFor="let b of card.bullets" class="feature-item">
                <div class="dot" [ngClass]="b.dotColor"></div>
                <div>
                  <strong>{{ b.label }}</strong>
                  <span>{{ b.text }}</span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <span class="footer-note">{{ card.footerNote }}</span>
            </div>
          </div>
        </div>

        <!-- EDIT MODE: Card Edit Forms -->
        <div *ngIf="isEditingMethods()" class="methods-edit-grid">
          <div *ngFor="let card of editMethodCards; let ci = index" class="method-edit-card" [ngClass]="card.badgeClass">
            <div class="mec-header">
              <span class="badge-severity" [ngClass]="card.badgeClass">{{ card.badgeText }}</span>
              <h4>{{ card.title }}</h4>
            </div>
            <div class="mec-body">
              <div class="mec-field-row">
                <div class="mec-field">
                  <label>Badge Metni</label>
                  <input type="text" [(ngModel)]="card.badgeText" class="mec-input" placeholder="Örn: ÖNERİLEN ÇÖZÜM" />
                </div>
                <div class="mec-field">
                  <label>Süre</label>
                  <input type="text" [(ngModel)]="card.duration" class="mec-input" placeholder="Örn: 6 Ay" />
                </div>
              </div>
              <div class="mec-field">
                <label>Başlık</label>
                <input type="text" [(ngModel)]="card.title" class="mec-input" placeholder="Kart başlığı..." />
              </div>
              <div class="mec-field">
                <label>Alt Başlık</label>
                <input type="text" [(ngModel)]="card.subtitle" class="mec-input" placeholder="Kısa açıklama..." />
              </div>
              <div class="mec-bullets-section">
                <label class="mec-section-lbl">Maddeler (4 adet)</label>
                <div *ngFor="let b of card.bullets; let bi = index" class="mec-bullet-row">
                  <div class="mec-bullet-dot" [ngClass]="'dot-' + b.dotColor"></div>
                  <div class="mec-bullet-fields">
                    <input type="text" [(ngModel)]="b.label" class="mec-input mec-label-input" placeholder="Başlık (örn: Geçmiş Veri:)" />
                    <input type="text" [(ngModel)]="b.text" class="mec-input" placeholder="Açıklama metni..." />
                  </div>
                </div>
              </div>
              <div class="mec-field">
                <label>Footer Notu</label>
                <input type="text" [(ngModel)]="card.footerNote" class="mec-input" placeholder="Alt not..." />
              </div>
            </div>
          </div>
        </div>

      </div>


      <!-- ================= TAB 2: HEDEF MİMARİ & 3RD PARTİLER ================= -->
      <!-- ================= TAB 2: HEDEF MİMARİ GÖRSEL YÜKLEME ALANI ================= -->
      <div class="tab-content" *ngIf="activeTab() === 'target-architecture'">
        <!-- Toast Notification -->
        <div class="img-toast-bar" *ngIf="imageToastMessage()">
          <app-icon name="check-circle" [size]="16" color="#16a34a"></app-icon>
          <span>{{ imageToastMessage() }}</span>
        </div>

        <!-- 2 Sütunlu Mimari Görsel Yükleme Grid -->
        <div class="split-architecture-grid">
          <!-- 1. SOL PANEL: MEVCUT MİMARİ (AS-IS) GÖRSELİ -->
          <div class="arch-panel as-is-panel">
            <div class="panel-header">
              <div class="p-title-group">
                <span class="panel-tag tag-warning">MEVCUT MİMARİ (AS-IS)</span>
                <h3>Mevcut Altyapı & Mimari Diyagramı</h3>
              </div>
              <div class="header-actions-right" *ngIf="asisArchImage()">
                <button type="button" class="btn-img-action" (click)="openLightbox(asisArchImage()!, 'Mevcut Mimari (AS-IS)')" title="Tam Ekran İncele">
                  <app-icon name="search" [size]="13"></app-icon>
                  <span>Büyüt</span>
                </button>
                <button type="button" class="btn-img-action" (click)="asisFileInput.click()" title="Görseli Değiştir">
                  <app-icon name="edit" [size]="13"></app-icon>
                  <span>Değiştir</span>
                </button>
                <button type="button" class="btn-img-action danger" (click)="removeArchImage('asis')" title="Görseli Kaldır">
                  <app-icon name="trash" [size]="13" color="#dc2626"></app-icon>
                  <span>Kaldır</span>
                </button>
              </div>
            </div>

            <!-- Upload Area / Image Container -->
            <div class="arch-image-card">
              <input 
                type="file" 
                #asisFileInput 
                (change)="onImageSelected($event, 'asis')" 
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml" 
                style="display: none;" />

              <!-- Uploading / Processing Spinner Overlay -->
              <div *ngIf="isUploadingAsis()" class="upload-loading-overlay asis">
                <div class="spinner-ring asis"></div>
                <strong class="loading-title">Görsel İşleniyor...</strong>
                <span class="loading-sub">Çözünürlük optimize ediliyor ve sisteme kaydediliyor</span>
              </div>

              <div *ngIf="!asisArchImage() && !isUploadingAsis()" class="upload-dropzone asis" (click)="asisFileInput.click()">
                <div class="dropzone-inner">
                  <div class="upload-icon-circle asis">
                    <app-icon name="cloud" [size]="28" color="#d97706"></app-icon>
                  </div>
                  <h4>Mevcut Mimari (AS-IS) Görseli Yükleyin</h4>
                  <p class="dropzone-hint">PNG, JPG, SVG veya WebP formatında mimari şeması, sunucu topolojisi veya ekran görüntüsü yükleyebilirsiniz.</p>
                  <button type="button" class="btn-upload-trigger asis">
                    <app-icon name="file-text" [size]="14"></app-icon>
                    <span>Bilgisayardan Görsel Seç</span>
                  </button>
                </div>
              </div>

              <div *ngIf="asisArchImage() && !isUploadingAsis()" class="image-preview-wrapper" (click)="openLightbox(asisArchImage()!, 'Mevcut Mimari (AS-IS)')">
                <img [src]="asisArchImage()" alt="Mevcut Mimari (AS-IS)" class="arch-preview-img" />
                <div class="preview-overlay">
                  <span class="overlay-badge">🔍 Büyütmek için tıklayın</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. SAĞ PANEL: HEDEF MİMARİ (TO-BE) GÖRSELİ -->
          <div class="arch-panel to-be-panel">
            <div class="panel-header">
              <div class="p-title-group">
                <span class="panel-tag tag-success">HEDEF MİMARİ (TO-BE)</span>
                <h3>RISE with SAP & Bulut Hedef Mimarisi</h3>
              </div>
              <div class="header-actions-right" *ngIf="tobeArchImage()">
                <button type="button" class="btn-img-action" (click)="openLightbox(tobeArchImage()!, 'Hedef Mimari (TO-BE)')" title="Tam Ekran İncele">
                  <app-icon name="search" [size]="13"></app-icon>
                  <span>Büyüt</span>
                </button>
                <button type="button" class="btn-img-action" (click)="tobeFileInput.click()" title="Görseli Değiştir">
                  <app-icon name="edit" [size]="13"></app-icon>
                  <span>Değiştir</span>
                </button>
                <button type="button" class="btn-img-action danger" (click)="removeArchImage('tobe')" title="Görseli Kaldır">
                  <app-icon name="trash" [size]="13" color="#dc2626"></app-icon>
                  <span>Kaldır</span>
                </button>
              </div>
            </div>

            <!-- Upload Area / Image Container -->
            <div class="arch-image-card">
              <input 
                type="file" 
                #tobeFileInput 
                (change)="onImageSelected($event, 'tobe')" 
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml" 
                style="display: none;" />

              <!-- Uploading / Processing Spinner Overlay -->
              <div *ngIf="isUploadingTobe()" class="upload-loading-overlay tobe">
                <div class="spinner-ring tobe"></div>
                <strong class="loading-title">Görsel İşleniyor...</strong>
                <span class="loading-sub">Çözünürlük optimize ediliyor ve sisteme kaydediliyor</span>
              </div>

              <div *ngIf="!tobeArchImage() && !isUploadingTobe()" class="upload-dropzone tobe" (click)="tobeFileInput.click()">
                <div class="dropzone-inner">
                  <div class="upload-icon-circle tobe">
                    <app-icon name="sparkles" [size]="28" color="#059669"></app-icon>
                  </div>
                  <h4>Hedef Mimari (TO-BE) Görseli Yükleyin</h4>
                  <p class="dropzone-hint">S/4HANA Private Cloud, BTP Integration Suite ve hedef bulut topolojisi şemanızı yükleyin.</p>
                  <button type="button" class="btn-upload-trigger tobe">
                    <app-icon name="sparkles" [size]="14"></app-icon>
                    <span>Bilgisayardan Görsel Seç</span>
                  </button>
                </div>
              </div>

              <div *ngIf="tobeArchImage() && !isUploadingTobe()" class="image-preview-wrapper" (click)="openLightbox(tobeArchImage()!, 'Hedef Mimari (TO-BE)')">
                <img [src]="tobeArchImage()" alt="Hedef Mimari (TO-BE)" class="arch-preview-img" />
                <div class="preview-overlay">
                  <span class="overlay-badge green">🔍 Büyütmek için tıklayın</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lightbox Modal (Full Screen Image Viewer) -->
      <div class="img-lightbox-backdrop" *ngIf="lightboxImage() as lb" (click)="closeLightbox()">
        <div class="lightbox-dialog" (click)="$event.stopPropagation()">
          <div class="lightbox-header">
            <div class="lb-title">
              <app-icon name="image" [size]="16" color="#0284c7"></app-icon>
              <span>{{ lb.title }} — {{ customerService.activeCustomer().name }}</span>
            </div>
            <button type="button" class="lb-close-btn" (click)="closeLightbox()">✕ Kapat</button>
          </div>
          <div class="lightbox-body">
            <img [src]="lb.url" [alt]="lb.title" class="lightbox-full-img" />
          </div>
        </div>
      </div>

      <!-- ================= TAB 3: ÖNERİLEN GEÇİŞ YÖNTEMİ ================= -->
      <div class="tab-content" *ngIf="activeTab() === 'recommended'">
        <!-- Action Toolbar -->
        <div class="recommended-toolbar">
          <div class="toolbar-left">
            <span class="status-indicator-badge" [class.customized]="isCustomized()">
              <app-icon [name]="isCustomized() ? 'edit' : 'check-circle'" [size]="14" [color]="isCustomized() ? '#b45309' : '#15803d'"></app-icon>
              <span>{{ isCustomized() ? customerService.activeCustomer().name + ' İçin Özelleştirilmiş Geçiş Stratejisi' : 'Varsayılan Önerilen Geçiş Metodolojisi' }}</span>
            </span>
            <span *ngIf="saveSuccessMessage()" class="save-toast-pill">
              <app-icon name="check" [size]="14" color="#15803d"></app-icon>
              {{ saveSuccessMessage() }}
            </span>
          </div>

          <div class="toolbar-actions">
            <button *ngIf="!isEditingRecommended()" type="button" class="btn-rec btn-rec-edit" (click)="startEditRecommended()">
              <app-icon name="edit" [size]="14" color="#0284c7"></app-icon>
              <span>Metodoloji & Yol Haritasını Düzenle</span>
            </button>

            <button *ngIf="!isEditingRecommended() && isCustomized()" type="button" class="btn-rec btn-rec-reset" (click)="resetRecommendedToDefault()" title="Varsayılan metinlere dön">
              <app-icon name="refresh" [size]="14" color="#64748b"></app-icon>
              <span>Varsayılana Sıfırla</span>
            </button>

            <button *ngIf="isEditingRecommended()" type="button" class="btn-rec btn-rec-cancel" (click)="cancelEditRecommended()">
              <app-icon name="x" [size]="14" color="#475569"></app-icon>
              <span>İptal</span>
            </button>

            <button *ngIf="isEditingRecommended()" type="button" class="btn-rec btn-rec-save" (click)="saveRecommended()">
              <app-icon name="check" [size]="14" color="#ffffff"></app-icon>
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </div>

        <!-- VIEW MODE: Hero Recommendation Card -->
        <div *ngIf="!isEditingRecommended()" class="hero-recommendation-card">
          <div class="hero-left">
            <div class="hero-icon-box">
              <app-icon name="check" [size]="28" color="#059669"></app-icon>
            </div>
            <div>
              <span class="hero-pill">{{ recommendedData().badge }}</span>
              <h2>{{ recommendedData().title }}</h2>
              <p>{{ recommendedData().description }}</p>
            </div>
          </div>
          <div class="hero-stats">
            <div class="stat-box">
              <span class="stat-val text-emerald">{{ recommendedData().stat1Value }}</span>
              <span class="stat-lbl">{{ recommendedData().stat1Label }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-val text-blue">{{ recommendedData().stat2Value }}</span>
              <span class="stat-lbl">{{ recommendedData().stat2Label }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-val text-purple">{{ recommendedData().stat3Value }}</span>
              <span class="stat-lbl">{{ recommendedData().stat3Label }}</span>
            </div>
          </div>
        </div>

        <!-- EDIT MODE: Hero Edit Form Card -->
        <div *ngIf="isEditingRecommended()" class="hero-edit-card">
          <div class="card-edit-header">
            <div class="ce-left">
              <app-icon name="edit" [size]="18" color="#0284c7"></app-icon>
              <h3>Önerilen Yöntem & KPI Metrikleri Düzenleme</h3>
            </div>
            <span class="edit-pill">Düzenleme Modu</span>
          </div>

          <div class="form-grid-hero">
            <div class="form-group span-2">
              <label>Rozet Metni (Pill)</label>
              <input type="text" [(ngModel)]="editRecommendedModel.badge" placeholder="Örn: ÖNERİLEN GEÇİŞ YÖNTEMİ" class="form-input" />
            </div>

            <div class="form-group span-2">
              <label>Yöntem Ana Başlığı</label>
              <input type="text" [(ngModel)]="editRecommendedModel.title" placeholder="Örn: Brownfield (System Conversion)..." class="form-input" />
            </div>

            <div class="form-group span-full">
              <label>Açıklama & Karar Gerekçesi</label>
              <textarea [(ngModel)]="editRecommendedModel.description" rows="3" class="form-textarea" placeholder="Müşteri için önerilen geçiş yaklaşımının detaylı gerekçesi..."></textarea>
            </div>

            <div class="form-group kpi-input-box">
              <span class="kpi-box-title">1. KPI Metriği</span>
              <label>Değer (Süre)</label>
              <input type="text" [(ngModel)]="editRecommendedModel.stat1Value" placeholder="6 Ay" class="form-input" />
              <label class="sub-label">Açıklama Etiketi</label>
              <input type="text" [(ngModel)]="editRecommendedModel.stat1Label" placeholder="Tahmini Proje Süresi" class="form-input" />
            </div>

            <div class="form-group kpi-input-box">
              <span class="kpi-box-title">2. KPI Metriği</span>
              <label>Değer (Veri)</label>
              <input type="text" [(ngModel)]="editRecommendedModel.stat2Value" placeholder="%100" class="form-input" />
              <label class="sub-label">Açıklama Etiketi</label>
              <input type="text" [(ngModel)]="editRecommendedModel.stat2Label" placeholder="Geçmiş Veri Korunumu" class="form-input" />
            </div>

            <div class="form-group kpi-input-box">
              <span class="kpi-box-title">3. KPI Metriği</span>
              <label>Değer (Bütçe)</label>
              <input type="text" [(ngModel)]="editRecommendedModel.stat3Value" placeholder="Optimum" class="form-input" />
              <label class="sub-label">Açıklama Etiketi</label>
              <input type="text" [(ngModel)]="editRecommendedModel.stat3Label" placeholder="Bütçe / ROI Dengesi" class="form-input" />
            </div>
          </div>
        </div>

        <!-- VIEW MODE: 4-Phase Transformation Roadmap -->
        <div *ngIf="!isEditingRecommended()" class="timeline-section-card">
          <div class="section-heading">
            <app-icon name="sparkles" [size]="18" color="#0284c7"></app-icon>
            <h3>{{ recommendedData().roadmapTitle }}</h3>
          </div>

          <div class="steps-row">
            <ng-container *ngFor="let phase of recommendedData().phases; let idx = index; let last = last">
              <div class="step-box" [class.highlight]="phase.isHighlight">
                <div class="step-num">{{ phase.stepNumber }}</div>
                <div class="step-badge" [class.green]="phase.isHighlight">{{ phase.badge }}</div>
                <h4>{{ phase.title }}</h4>
                <ul>
                  <li *ngFor="let item of phase.items">{{ item }}</li>
                </ul>
              </div>
              <div *ngIf="!last" class="step-arrow">➔</div>
            </ng-container>
          </div>
        </div>

        <!-- EDIT MODE: 4-Phase Roadmap Edit Cards -->
        <div *ngIf="isEditingRecommended()" class="roadmap-edit-card">
          <div class="card-edit-header">
            <div class="ce-left">
              <app-icon name="layers" [size]="18" color="#0284c7"></app-icon>
              <h3>4 Fazlı Dönüşüm Yol Haritası Kartları Düzenleme</h3>
            </div>
            <span class="edit-pill">Adım Detayları</span>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label>Yol Haritası Genel Başlığı</label>
            <input type="text" [(ngModel)]="editRecommendedModel.roadmapTitle" class="form-input" placeholder="Örn: Önerilen Brownfield 4 Fazlı Dönüşüm Yol Haritası" />
          </div>

          <div class="phase-edit-grid">
            <div *ngFor="let phase of editRecommendedModel.phases; let idx = index" class="phase-edit-box" [class.highlight-box]="phase.isHighlight">
              <div class="phase-box-header">
                <div class="phase-num-badge" [class.green-badge]="phase.isHighlight">{{ phase.stepNumber }}</div>
                <span class="phase-header-title">Adım {{ idx + 1 }}</span>
              </div>

              <div class="form-group">
                <label>Adım No</label>
                <input type="text" [(ngModel)]="phase.stepNumber" class="form-input" placeholder="01" />
              </div>

              <div class="form-group">
                <label>Zaman Dilimi / Süre</label>
                <input type="text" [(ngModel)]="phase.badge" class="form-input" placeholder="1. - 2. Ay" />
              </div>

              <div class="form-group">
                <label>Adım Başlığı</label>
                <input type="text" [(ngModel)]="phase.title" class="form-input" placeholder="Adım Başlığı" />
              </div>

              <div class="form-group">
                <label>Maddeler (Her satıra bir madde)</label>
                <textarea [(ngModel)]="editPhaseItemsText[idx]" rows="5" class="form-textarea" placeholder="Madde 1&#10;Madde 2&#10;Madde 3"></textarea>
              </div>

              <div class="form-group-checkbox">
                <label>
                  <input type="checkbox" [(ngModel)]="phase.isHighlight" />
                  <span>Yeşil Vurgulu Kart (Canlıya Geçiş / Hedef)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .solution-page {
      padding: 1.5rem 2rem;
      background: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 1.25rem 1.75rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);

      .badge-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.35rem;

        .company-badge {
          background: #eff6ff;
          color: #0284c7;
          border: 1px solid #bfdbfe;
          padding: 0.15rem 0.6rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .solution-tag {
          background: #f1f5f9;
          color: #475569;
          padding: 0.15rem 0.55rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
        }
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        font-size: 1.45rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
      }

      .page-subtitle {
        margin: 0.25rem 0 0 0;
        font-size: 0.82rem;
        color: #64748b;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1.1rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;

      &.btn-outline {
        background: #ffffff;
        color: #334155;
        border: 1px solid #cbd5e1;
        &:hover { background: #f8fafc; border-color: #94a3b8; }
      }

      &.btn-primary {
        background: #0284c7;
        color: #ffffff;
        border: 1px solid #0284c7;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
        &:hover { background: #0369a1; }
      }
    }

    /* Tabs Navigation Card */
    .tab-navigation-card {
      background: #ffffff;
      padding: 0.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);

      .nav-tabs-bar {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;

        @media (max-width: 992px) {
          grid-template-columns: 1fr;
        }
      }

      .tab-btn {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.85rem 1.25rem;
        border-radius: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;

        .tab-label-group {
          display: flex;
          flex-direction: column;
          .tab-title { font-size: 0.92rem; font-weight: 700; color: #334155; }
          .tab-desc { font-size: 0.72rem; color: #64748b; margin-top: 0.1rem; }
        }

        &:hover {
          background: #f1f5f9;
        }

        &.active {
          background: #eff6ff;
          border-color: #93c5fd;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);

          .tab-title { color: #0284c7; }
        }
      }
    }

    /* Tab Content Wrapper */
    .tab-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Hero Recommendation Card */
    .hero-recommendation-card {
      background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 1.5rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.05);

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
          .text-purple { color: #7e22ce; }
        }
      }
    }

    /* Methods Grid */
    .methods-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;

      &.methods-grid-4 {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .method-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
      }

      &.recommended {
        border: 2px solid #059669;
        .card-header { background: #f0fdf4; border-bottom: 1px solid #dcfce7; }
      }

      &.lift-shift {
        border-top: 3px solid #2563eb;
        .card-header { background: #eff6ff; border-bottom: 1px solid #dbeafe; }
      }

      &.partial {
        border-top: 3px solid #d97706;
      }

      &.not-suitable {
        border-top: 3px solid #dc2626;
        opacity: 0.85;
      }

      .card-header {
        padding: 1.15rem 1.25rem;
        border-bottom: 1px solid #f1f5f9;

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        h3 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.2rem 0;
        }

        .method-sub {
          font-size: 0.74rem;
          color: #64748b;
          margin: 0;
        }
      }

      .card-body {
        padding: 1.25rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;

        .feature-item {
          display: flex;
          gap: 0.65rem;
          align-items: flex-start;

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-top: 5px;
            flex-shrink: 0;
            &.green { background: #059669; }
            &.amber { background: #d97706; }
            &.red { background: #dc2626; }
            &.blue { background: #2563eb; }
          }

          strong {
            display: block;
            font-size: 0.78rem;
            color: #1e293b;
          }

          span {
            font-size: 0.73rem;
            color: #64748b;
            line-height: 1.4;
          }
        }
      }

      .card-footer {
        padding: 0.75rem 1.25rem;
        background: #f8fafc;
        border-top: 1px solid #f1f5f9;
        font-size: 0.72rem;
        color: #64748b;
        font-weight: 600;
      }
    }

    .badge-severity {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;

      &.recommended { background: #dcfce7; color: #059669; }
      &.lift-shift { background: #dbeafe; color: #1d4ed8; }
      &.partial { background: #fef3c7; color: #d97706; }
      &.not-suitable { background: #fee2e2; color: #dc2626; }
    }

    .time-badge {
      font-size: 0.72rem;
      font-weight: 700;
      color: #475569;
      background: #f1f5f9;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    /* ---- Method Cards Edit Mode ---- */
    .methods-edit-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;

      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .method-edit-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(15,23,42,0.04);

      &.recommended { border-top: 3px solid #059669; }
      &.lift-shift   { border-top: 3px solid #2563eb; }
      &.partial      { border-top: 3px solid #d97706; }
      &.not-suitable { border-top: 3px solid #dc2626; }

      .mec-header {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.85rem 1.1rem;
        background: #f8fafc;
        border-bottom: 1px solid #f1f5f9;

        h4 { font-size: 0.88rem; font-weight: 800; color: #0f172a; margin: 0; }
      }

      .mec-body {
        padding: 1rem 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }

      .mec-field-row {
        display: grid;
        grid-template-columns: 1fr 120px;
        gap: 0.5rem;
      }

      .mec-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      }

      .mec-input {
        width: 100%;
        padding: 0.4rem 0.6rem;
        font-size: 0.78rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        color: #0f172a;
        background: #ffffff;
        box-sizing: border-box;
        transition: border-color 0.15s;
        &:focus { outline: none; border-color: #0284c7; box-shadow: 0 0 0 2px rgba(2,132,199,0.12); }
      }

      .mec-label-input { font-weight: 700; }

      .mec-bullets-section {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;

        .mec-section-lbl {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      }

      .mec-bullet-row {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;

        .mec-bullet-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 7px;
          flex-shrink: 0;
          &.dot-green  { background: #059669; }
          &.dot-blue   { background: #2563eb; }
          &.dot-amber  { background: #d97706; }
          &.dot-red    { background: #dc2626; }
        }

        .mec-bullet-fields {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
      }
    }

    .timeline-section-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.5rem 1.75rem;

      .section-heading {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin-bottom: 1.5rem;
        h3 { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0; }
      }

      .steps-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .step-box {
        flex: 1;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1.15rem;
        position: relative;

        &.highlight {
          background: #f0fdf4;
          border-color: #86efac;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.08);
        }

        .step-num {
          font-size: 1.4rem;
          font-weight: 900;
          color: #cbd5e1;
          line-height: 1;
          margin-bottom: 0.4rem;
        }

        .step-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          color: #0284c7;
          background: #eff6ff;
          padding: 0.1rem 0.45rem;
          border-radius: 4px;
          margin-bottom: 0.4rem;

          &.green { background: #dcfce7; color: #059669; }
        }

        h4 {
          font-size: 0.88rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }

        ul {
          margin: 0;
          padding-left: 1rem;
          li { font-size: 0.72rem; color: #64748b; margin-bottom: 0.25rem; }
        }
      }

      .step-arrow {
        color: #94a3b8;
        font-weight: 800;
        font-size: 1.1rem;
      }
    }

    /* Split Architecture Grid (Solda Mevcut, Sağda Hedef) */
    .split-architecture-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .arch-panel {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);

      &.as-is-panel {
        border-left: 4px solid #d97706;
      }

      &.to-be-panel {
        border-left: 4px solid #059669;
        background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid #f1f5f9;

        .p-title-group {
          .panel-tag {
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            display: block;
            margin-bottom: 0.2rem;

            &.tag-warning { color: #d97706; }
            &.tag-success { color: #059669; }
          }

          h3 {
            font-size: 1.15rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
        }

        .metric-pill {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;

          &.red { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
          &.green { background: #dcfce7; color: #059669; border: 1px solid #bbf7d0; }
        }
      }

      .header-actions-right {
        display: flex;
        align-items: center;
        gap: 0.45rem;

        .btn-img-action {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.65rem;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;

          &:hover {
            background: #f1f5f9;
            color: #0f172a;
          }

          &.danger {
            color: #dc2626;
            border-color: #fecaca;
            background: #fef2f2;
            &:hover {
              background: #fee2e2;
            }
          }
        }
      }

      .arch-image-card {
        min-height: 380px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .upload-dropzone {
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        background: #f8fafc;
        padding: 2.5rem 1.5rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 360px;

        &:hover {
          border-color: #d97706;
          background: #fffbeb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.08);
        }

        &.tobe {
          &:hover {
            border-color: #059669;
            background: #f0fdf4;
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.08);
          }
        }

        .dropzone-inner {
          max-width: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
        }

        .upload-icon-circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.4rem;

          &.asis {
            background: #fef3c7;
            border: 2px solid #fde68a;
          }
          &.tobe {
            background: #dcfce7;
            border: 2px solid #bbf7d0;
          }
        }

        h4 {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .dropzone-hint {
          font-size: 0.74rem;
          color: #64748b;
          line-height: 1.45;
          margin: 0;
        }

        .btn-upload-trigger {
          margin-top: 0.6rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 1.15rem;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s ease;

          &.asis {
            background: #f59e0b;
            color: #ffffff;
            &:hover { background: #d97706; }
          }

          &.tobe {
            background: #059669;
            color: #ffffff;
            &:hover { background: #047857; }
          }
        }
      }

      .upload-loading-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 360px;
        background: #f8fafc;
        border: 2px dashed #94a3b8;
        border-radius: 12px;
        padding: 2.5rem 1.5rem;
        gap: 0.75rem;
        text-align: center;
        animation: fadeIn 0.2s ease;

        &.asis {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        &.tobe {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .spinner-ring {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 4px solid #e2e8f0;
          border-top-color: #0284c7;
          animation: spin 0.8s linear infinite;

          &.asis {
            border-top-color: #d97706;
          }
          &.tobe {
            border-top-color: #059669;
          }
        }

        .loading-title {
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
        }

        .loading-sub {
          font-size: 0.74rem;
          color: #64748b;
        }
      }

      .image-preview-wrapper {
        position: relative;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        background: #0f172a;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 360px;
        max-height: 540px;

        .arch-preview-img {
          width: 100%;
          height: 100%;
          max-height: 520px;
          object-fit: contain;
          display: block;
          transition: transform 0.2s ease;
        }

        &:hover .arch-preview-img {
          transform: scale(1.015);
        }

        .preview-overlay {
          position: absolute;
          bottom: 12px;
          right: 12px;
          opacity: 0.9;
          transition: opacity 0.15s ease;

          .overlay-badge {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.35rem 0.7rem;
            border-radius: 6px;
            background: rgba(15, 23, 42, 0.85);
            color: #ffffff;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.15);

            &.green {
              background: rgba(5, 150, 105, 0.88);
            }
          }
        }
      }
    }

    /* Toast Notification Bar */
    .img-toast-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      color: #166534;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    /* Lightbox Modal */
    .img-lightbox-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;

      .lightbox-dialog {
        background: #ffffff;
        border-radius: 14px;
        width: 95vw;
        max-width: 1400px;
        max-height: 92vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

        .lightbox-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.25rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;

          .lb-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.88rem;
            font-weight: 800;
            color: #0f172a;
          }

          .lb-close-btn {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #475569;
            cursor: pointer;
            transition: all 0.15s ease;

            &:hover {
              background: #fee2e2;
              border-color: #fca5a5;
              color: #dc2626;
            }
          }
        }

        .lightbox-body {
          flex: 1;
          background: #090d16;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;

          .lightbox-full-img {
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
            border-radius: 6px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          }
        }
      }
    }

    /* Recommended Toolbar */
    .recommended-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.85rem 1.25rem;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .status-indicator-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 0.74rem;
          font-weight: 700;

          &.customized {
            background: #fffbeb;
            border-color: #fde68a;
            color: #b45309;
          }
        }

        .save-toast-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.65rem;
          border-radius: 6px;
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #166534;
          font-size: 0.74rem;
          font-weight: 600;
        }
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 0.6rem;

        .btn-rec {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.95rem;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;

          &.btn-rec-edit {
            background: #eff6ff;
            color: #0284c7;
            border: 1px solid #bae6fd;
            &:hover { background: #e0f2fe; border-color: #7dd3fc; }
          }

          &.btn-rec-reset {
            background: #f8fafc;
            color: #64748b;
            border: 1px solid #cbd5e1;
            &:hover { background: #f1f5f9; color: #334155; }
          }

          &.btn-rec-cancel {
            background: #ffffff;
            color: #475569;
            border: 1px solid #cbd5e1;
            &:hover { background: #f8fafc; }
          }

          &.btn-rec-save {
            background: #16a34a;
            color: #ffffff;
            border: 1px solid #16a34a;
            box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
            &:hover { background: #15803d; }
          }
        }
      }
    }

    /* Edit Form Cards */
    .hero-edit-card, .roadmap-edit-card {
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
          background: #eff6ff;
          color: #0284c7;
          border: 1px solid #bfdbfe;
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

      .span-2 {
        grid-column: span 1;
        @media (min-width: 900px) {
          &:first-child { grid-column: span 1; }
          &:nth-child(2) { grid-column: span 2; }
        }
      }

      .span-full {
        grid-column: 1 / -1;
      }

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
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;

      label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #475569;
      }

      .sub-label {
        margin-top: 0.4rem;
      }

      .form-input {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.82rem;
        color: #1e293b;
        background: #ffffff;
        box-sizing: border-box;
        transition: border-color 0.15s ease;

        &:focus {
          outline: none;
          border-color: #0284c7;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.12);
        }
      }

      .form-textarea {
        width: 100%;
        padding: 0.55rem 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.82rem;
        color: #1e293b;
        background: #ffffff;
        box-sizing: border-box;
        font-family: inherit;
        resize: vertical;
        line-height: 1.45;
        transition: border-color 0.15s ease;

        &:focus {
          outline: none;
          border-color: #0284c7;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.12);
        }
      }
    }

    .phase-edit-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;

      @media (max-width: 1100px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 650px) {
        grid-template-columns: 1fr;
      }

      .phase-edit-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        &.highlight-box {
          border-color: #86efac;
          background: #f0fdf4;
        }

        .phase-box-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid #e2e8f0;

          .phase-num-badge {
            background: #e0f2fe;
            color: #0369a1;
            font-weight: 800;
            font-size: 0.75rem;
            padding: 0.15rem 0.45rem;
            border-radius: 4px;

            &.green-badge {
              background: #dcfce7;
              color: #15803d;
            }
          }

          .phase-header-title {
            font-size: 0.8rem;
            font-weight: 700;
            color: #334155;
          }
        }

        .form-group-checkbox {
          label {
            display: flex;
            align-items: center;
            gap: 0.45rem;
            cursor: pointer;
            font-size: 0.74rem;
            font-weight: 600;
            color: #166534;
            user-select: none;
          }
        }
      }
    }
  `]
})
export class SolutionProposalComponent implements OnInit {
  customerService = inject(CustomerService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  activeTab = signal<'methods' | 'target-architecture' | 'recommended'>('methods');
  searchQuery = '';
  selectedCategory = signal<string>('TÜMÜ');

  // Önerilen Geçiş Yöntemi & Yol Haritası State
  recommendedData = signal<RecommendedMethodData>(getDefaultRecommendedData(''));
  isEditingRecommended = signal<boolean>(false);
  editRecommendedModel: RecommendedMethodData = getDefaultRecommendedData('');
  editPhaseItemsText: string[] = ['', '', '', ''];
  isCustomized = signal<boolean>(false);
  saveSuccessMessage = signal<string>('');

  // SAP Geçiş Yöntemleri Cards State
  methodCards = signal<MethodCardData[]>(getDefaultMethodCards());
  isEditingMethods = signal<boolean>(false);
  editMethodCards: MethodCardData[] = [];
  methodsCustomized = signal<boolean>(false);
  methodsSaveMessage = signal<string>('');

  // Target Architecture Visual Upload State
  asisArchImage = signal<string | null>(null);
  tobeArchImage = signal<string | null>(null);
  isUploadingAsis = signal<boolean>(false);
  isUploadingTobe = signal<boolean>(false);
  lightboxImage = signal<{ url: string; title: string } | null>(null);
  imageToastMessage = signal<string>('');

  constructor() {
    effect(() => {
      const custId = this.customerService.activeCustomerId();
      const cust = this.customerService.activeCustomer();
      if (custId) {
        this.loadRecommendedData(custId, cust?.name || '');
        this.loadMethodCards(custId);
        this.loadArchImages(custId);
      }
    });
  }

  loadArchImages(custId: string) {
    try {
      const asisImg = localStorage.getItem(`taskforce_target_arch_asis_img_${custId}`);
      this.asisArchImage.set(asisImg || null);
      const tobeImg = localStorage.getItem(`taskforce_target_arch_tobe_img_${custId}`);
      this.tobeArchImage.set(tobeImg || null);
    } catch (e) {
      console.error('Error loading architecture images:', e);
    }
  }

  onImageSelected(event: Event, type: 'asis' | 'tobe') {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (type === 'asis') {
      this.isUploadingAsis.set(true);
    } else {
      this.isUploadingTobe.set(true);
    }
    // Small timeout to allow UI spinner to render smoothly
    setTimeout(() => {
      this.compressAndSaveImage(file, type);
      input.value = '';
    }, 60);
  }

  compressAndSaveImage(file: File, type: 'asis' | 'tobe') {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1920;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            const custId = this.customerService.activeCustomerId();
            if (type === 'asis') {
              this.asisArchImage.set(dataUrl);
              if (custId) localStorage.setItem(`taskforce_target_arch_asis_img_${custId}`, dataUrl);
            } else {
              this.tobeArchImage.set(dataUrl);
              if (custId) localStorage.setItem(`taskforce_target_arch_tobe_img_${custId}`, dataUrl);
            }
            this.imageToastMessage.set(type === 'asis' ? 'Mevcut mimari (AS-IS) görseli başarıyla yüklendi!' : 'Hedef mimari (TO-BE) görseli başarıyla yüklendi!');
            setTimeout(() => this.imageToastMessage.set(''), 3000);
          }
        } finally {
          if (type === 'asis') this.isUploadingAsis.set(false);
          else this.isUploadingTobe.set(false);
        }
      };
      img.onerror = () => {
        if (type === 'asis') this.isUploadingAsis.set(false);
        else this.isUploadingTobe.set(false);
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      if (type === 'asis') this.isUploadingAsis.set(false);
      else this.isUploadingTobe.set(false);
    };
    reader.readAsDataURL(file);
  }

  removeArchImage(type: 'asis' | 'tobe') {
    const custId = this.customerService.activeCustomerId();
    if (type === 'asis') {
      this.asisArchImage.set(null);
      if (custId) localStorage.removeItem(`taskforce_target_arch_asis_img_${custId}`);
    } else {
      this.tobeArchImage.set(null);
      if (custId) localStorage.removeItem(`taskforce_target_arch_tobe_img_${custId}`);
    }
    this.imageToastMessage.set(type === 'asis' ? 'Mevcut mimari görseli kaldırıldı.' : 'Hedef mimari görseli kaldırıldı.');
    setTimeout(() => this.imageToastMessage.set(''), 3000);
  }

  openLightbox(url: string, title: string) {
    this.lightboxImage.set({ url, title });
  }

  closeLightbox() {
    this.lightboxImage.set(null);
  }

  loadMethodCards(custId: string) {
    try {
      const saved = localStorage.getItem(`taskforce_methods_cards_${custId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.methodCards.set(parsed);
        this.methodsCustomized.set(true);
        return;
      }
    } catch (e) {
      console.error('Error loading method cards:', e);
    }
    this.methodCards.set(getDefaultMethodCards());
    this.methodsCustomized.set(false);
  }

  startEditMethods() {
    this.editMethodCards = JSON.parse(JSON.stringify(this.methodCards()));
    this.isEditingMethods.set(true);
  }

  cancelEditMethods() {
    this.isEditingMethods.set(false);
  }

  saveMethodCards() {
    const custId = this.customerService.activeCustomerId();
    const data = JSON.parse(JSON.stringify(this.editMethodCards));
    this.methodCards.set(data);
    if (custId) {
      localStorage.setItem(`taskforce_methods_cards_${custId}`, JSON.stringify(data));
      this.methodsCustomized.set(true);
    }
    this.isEditingMethods.set(false);
    this.methodsSaveMessage.set('Kartlar başarıyla kaydedildi!');
    setTimeout(() => this.methodsSaveMessage.set(''), 3500);
  }

  resetMethodCards() {
    const cust = this.customerService.activeCustomer();
    const custId = this.customerService.activeCustomerId();
    const confirmed = window.confirm(`"${cust.name}" için geçiş yöntemi kartları varsayılan içeriklere döndürülsün mü?`);
    if (confirmed && custId) {
      localStorage.removeItem(`taskforce_methods_cards_${custId}`);
      this.methodCards.set(getDefaultMethodCards());
      this.methodsCustomized.set(false);
      this.isEditingMethods.set(false);
      this.methodsSaveMessage.set('Varsayılana sıfırlandı.');
      setTimeout(() => this.methodsSaveMessage.set(''), 3500);
    }
  }

  loadRecommendedData(custId: string, custName: string) {
    try {
      const saved = localStorage.getItem(`taskforce_recommended_method_${custId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.recommendedData.set(parsed);
        this.isCustomized.set(true);
        return;
      }
    } catch (e) {
      console.error('Error loading recommended method:', e);
    }
    this.recommendedData.set(getDefaultRecommendedData(custName));
    this.isCustomized.set(false);
  }

  startEditRecommended() {
    const current = JSON.parse(JSON.stringify(this.recommendedData()));
    this.editRecommendedModel = current;
    this.editPhaseItemsText = (current.phases || []).map((p: PhaseStep) => (p.items || []).join('\n'));
    this.isEditingRecommended.set(true);
  }

  cancelEditRecommended() {
    this.isEditingRecommended.set(false);
  }

  saveRecommended() {
    const custId = this.customerService.activeCustomerId();
    const model: RecommendedMethodData = JSON.parse(JSON.stringify(this.editRecommendedModel));
    
    // Convert textarea lines to items array
    if (model.phases && Array.isArray(model.phases)) {
      model.phases.forEach((p: PhaseStep, idx: number) => {
        const text = this.editPhaseItemsText[idx] || '';
        p.items = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      });
    }

    this.recommendedData.set(model);
    if (custId) {
      localStorage.setItem(`taskforce_recommended_method_${custId}`, JSON.stringify(model));
      this.isCustomized.set(true);
    }
    this.isEditingRecommended.set(false);
    this.saveSuccessMessage.set('Değişiklikler başarıyla kaydedildi!');
    setTimeout(() => this.saveSuccessMessage.set(''), 3500);
  }

  resetRecommendedToDefault() {
    const cust = this.customerService.activeCustomer();
    const custId = this.customerService.activeCustomerId();
    const confirmed = window.confirm(`"${cust.name}" için önerilen geçiş yöntemi ve yol haritası varsayılan ayarlara döndürülsün mü?`);
    if (confirmed && custId) {
      localStorage.removeItem(`taskforce_recommended_method_${custId}`);
      const def = getDefaultRecommendedData(cust.name);
      this.recommendedData.set(def);
      this.isCustomized.set(false);
      this.isEditingRecommended.set(false);
      this.saveSuccessMessage.set('Varsayılan ayarlara sıfırlandı.');
      setTimeout(() => this.saveSuccessMessage.set(''), 3500);
    }
  }

  readonly thirdPartyList: ThirdPartySystem[] = [
    {
      id: 'sys-1',
      name: 'Acente & Müşteri Portali',
      category: 'Satış & CRM',
      purpose: 'Poliçe teklif alma, müşteri tahsilat ve acente komisyon mutabakatı',
      currentProtocol: 'SAP PO 7.5 (SOAP / RFC)',
      targetProtocol: 'SAP BTP Cloud Integration (REST/OData API)',
      strategy: 'Modernize',
      criticality: 'KRİTİK',
      status: 'Hazır',
      notes: 'BTP API Gateway arkasına alınacak'
    },
    {
      id: 'sys-2',
      name: 'Banka & Sanal POS Entegrasyonları',
      category: 'Finans & Banka',
      purpose: 'Online prim tahsilatları, otomatik havale/EFT mutabakatı ve MT940',
      currentProtocol: 'PO Web Service & SFTP Batch',
      targetProtocol: 'SAP Multi-Bank Connectivity (MBC) / BTP',
      strategy: 'Standart Değişim',
      criticality: 'KRİTİK',
      status: 'Analiz Edildi',
      notes: 'SAP Standart MBC paketine geçiş'
    },
    {
      id: 'sys-3',
      name: 'Gelir İdaresi (GİB) Özel Entegratörü',
      category: 'Yasal & e-Dönüşüm',
      purpose: 'E-Fatura, E-İrsaliye, E-Defter ve E-Arşiv yasal beyan entegrasyonu',
      currentProtocol: 'Özel Entegratör PO Adapter',
      targetProtocol: 'SAP Document and Reporting Compliance (DRC)',
      strategy: 'Modernize',
      criticality: 'KRİTİK',
      status: 'Hazır',
      notes: 'S/4HANA DRC modülü ile doğrudan uyumlu'
    },
    {
      id: 'sys-4',
      name: 'CRM / Müşteri Yönetim Sistemi (Salesforce)',
      category: 'Satış & CRM',
      purpose: 'Müşteri 360, potansiyel fırsat yönetimi ve satış pipeline takibi',
      currentProtocol: 'Gecelik Toplu RFC / Batch Job',
      targetProtocol: 'BTP Event Mesh + REST Real-Time Webhook',
      strategy: 'Modernize',
      criticality: 'YÜKSEK',
      status: 'Tasarlandı',
      notes: 'Gerçek zamanlı iki yönlü senkronizasyon'
    },
    {
      id: 'sys-5',
      name: 'Dış Depo & Lojistik (WMS)',
      category: 'Lojistik & WMS',
      purpose: 'Malzeme giriş-çıkış, barkod okuma ve konsinye stok takibi',
      currentProtocol: 'IDoc (WMMBXY / DESADV) Dosya Transferi',
      targetProtocol: 'S/4HANA Cloud OData API & BTP Open Connectors',
      strategy: 'BTP Wrapper',
      criticality: 'YÜKSEK',
      status: 'Geliştirme Bekliyor',
      notes: 'IDoc yerine modern REST endpoint'
    },
    {
      id: 'sys-6',
      name: 'İK & Bordro (HTS Masraf Entegrasyonu)',
      category: 'İK & Masraf',
      purpose: 'Personel masraf formları, avans ve aylık bordro muhasebeleştirme',
      currentProtocol: 'Z BAPI & PO 7.5 Arayüzü',
      targetProtocol: 'SAP SuccessFactors / BTP Cloud Connector',
      strategy: 'Direct Re-host',
      criticality: 'ORTA',
      status: 'Hazır',
      notes: 'Mevcut muhasebe hesap tayini korunacak'
    },
    {
      id: 'sys-7',
      name: 'Kurumsal BI & Veri Ambarı (DWH)',
      category: 'Analitik & BI',
      purpose: 'Yönetim raporlaması, bütçe fiili analizleri ve KPI takibi',
      currentProtocol: 'Doğrudan Oracle/DB Read Scriptleri',
      targetProtocol: 'SAP Datasphere & S/4HANA CDS Views',
      strategy: 'Modernize',
      criticality: 'ORTA',
      status: 'Analiz Edildi',
      notes: 'AnyDB doğrudan okuma engellenip CDS view açılacak'
    },
    {
      id: 'sys-8',
      name: 'SMS & E-Posta Bildirim Gateway',
      category: 'İletişim',
      purpose: 'Müşteri bilgilendirme, OTP doğrulama ve poliçe bildirimleri',
      currentProtocol: 'PO REST Adapter',
      targetProtocol: 'BTP Integration Suite Mail/SMS Adapter',
      strategy: 'Direct Re-host',
      criticality: 'ORTA',
      status: 'Hazır',
      notes: 'Doğrudan bulut adapterına aktarılacak'
    }
  ];

  filteredSystems = computed(() => {
    let list = this.thirdPartyList;
    const cat = this.selectedCategory();
    if (cat !== 'TÜMÜ') {
      list = list.filter(item => item.category === cat);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.purpose.toLowerCase().includes(q) ||
        item.currentProtocol.toLowerCase().includes(q) ||
        item.targetProtocol.toLowerCase().includes(q) ||
        item.strategy.toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'target-architecture' || tab === 'hedef-mimari') {
        this.activeTab.set('target-architecture');
      } else if (tab === 'recommended' || tab === 'onerilen' || tab === 'onerilen-yontem') {
        this.activeTab.set('recommended');
      } else if (tab === 'methods' || tab === 'gecis-yontemleri') {
        this.activeTab.set('methods');
      }
    });
  }

  selectTab(tab: 'methods' | 'target-architecture' | 'recommended') {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  getStrategyClass(strategy: string): string {
    switch (strategy) {
      case 'Modernize': return 'strat-modernize';
      case 'BTP Wrapper': return 'strat-wrapper';
      case 'Direct Re-host': return 'strat-rehost';
      case 'Standart Değişim': return 'strat-standard';
      case 'Emekli Etme': return 'strat-retire';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Hazır': return 'st-ready';
      case 'Tasarlandı': return 'st-designed';
      case 'Analiz Edildi': return 'st-analyzed';
      case 'Geliştirme Bekliyor': return 'st-pending';
      default: return '';
    }
  }
}
