import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

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

      <!-- Navigation Tabs (2 Ana Kırılım) -->
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
        </div>
      </div>

      <!-- ================= TAB 1: SAP GEÇİŞ YÖNTEMLERİ ================= -->
      <div class="tab-content" *ngIf="activeTab() === 'methods'">
        <!-- Hero Recommendation Banner -->
        <div class="hero-recommendation-card">
          <div class="hero-left">
            <div class="hero-icon-box">
              <app-icon name="check" [size]="28" color="#059669"></app-icon>
            </div>
            <div>
              <span class="hero-pill">ÖNERİLEN GEÇİŞ YÖNTEMİ</span>
              <h2>Brownfield (System Conversion) + DVM / Arşivleme</h2>
              <p>
                {{ customerService.activeCustomer().name }} için geçmiş işlem verisi ve mevzuat denetim sürekliliği zorunlu olduğu için saf 
                <strong>Greenfield elenmiştir</strong>. MM/FI çekirdeğinin doğrudan taşındığı, yüksek boyutlu atıl verilerin go-live öncesi arşivlendiği ve CO/BP 
                temizliğinin yapıldığı Brownfield yaklaşımı en düşük maliyet ve en yüksek başarı oranını sunmaktadır.
              </p>
            </div>
          </div>
          <div class="hero-stats">
            <div class="stat-box">
              <span class="stat-val text-emerald">6 Ay</span>
              <span class="stat-lbl">Tahmini Proje Süresi</span>
            </div>
            <div class="stat-box">
              <span class="stat-val text-blue">%100</span>
              <span class="stat-lbl">Geçmiş Veri Korunumu</span>
            </div>
            <div class="stat-box">
              <span class="stat-val text-purple">Optimum</span>
              <span class="stat-lbl">Bütçe / ROI Dengesi</span>
            </div>
          </div>
        </div>

        <!-- 3 Comparison Method Cards -->
        <div class="methods-grid">
          <!-- Method 1: Brownfield -->
          <div class="method-card recommended">
            <div class="card-header">
              <div class="header-top">
                <span class="badge-severity recommended">ÖNERİLEN ÇÖZÜM</span>
                <span class="time-badge">6 Ay</span>
              </div>
              <h3>Brownfield (System Conversion)</h3>
              <p class="method-sub">Teknik Dönüşüm & In-Place Migration</p>
            </div>

            <div class="card-body">
              <div class="feature-item">
                <div class="dot green"></div>
                <div>
                  <strong>Geçmiş Veri Bütünlüğü:</strong>
                  <span>Tüm finansal ve operasyonel geçmiş işlem verisi otomatik olarak S/4HANA'ya taşınır.</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="dot green"></div>
                <div>
                  <strong>Sadeleştirme & Z Kod Temizliği:</strong>
                  <span>SAP Readiness Check ile uyumsuz Z programları elenir; zorunlu Simplification Item'lar uyarlanır.</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="dot green"></div>
                <div>
                  <strong>DVM & Arşivleme Entegrasyonu:</strong>
                  <span>REGUP, ACDOCA gibi yüksek boyutlu tablolar geçiş öncesi arşivlenerek HANA bellek maliyeti minimize edilir.</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="dot green"></div>
                <div>
                  <strong>LShift ile RISE'a Taşınma:</strong>
                  <span>Temizlenen ve dönüştürülen sistem tek adımda RISE with SAP Bulut altyapısına transfer edilir.</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <span class="footer-note">En düşük risk ve en hızlı canlıya geçiş modeli</span>
            </div>
          </div>

          <!-- Method 2: Selective Data Transition -->
          <div class="method-card partial">
            <div class="card-header">
              <div class="header-top">
                <span class="badge-severity partial">KISMEN UYGUN</span>
                <span class="time-badge">12 Ay</span>
              </div>
              <h3>Selective Data Transition</h3>
              <p class="method-sub">Shell Conversion & Seçici Veri Göçü</p>
            </div>

            <div class="card-body">
              <div class="feature-item">
                <div class="dot amber"></div>
                <div>
                  <strong>Kabuk (Shell) Sistem Oluşturma:</strong>
                  <span>Teknik altyapı ve konfigürasyon kopyalanarak veri olmadan yükseltilir.</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="dot amber"></div>
                <div>
                  <strong>Hibrit Yaklaşım:</strong>
                  <span>CO ana verisi ve BP temiz kurulurken, MM/FI çekirdeği geçmiş hareketleriyle göç ettirilir.</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="dot amber"></div>
                <div>
                  <strong>Özel Partner Araçları:</strong>
                  <span>SNP, cbs veya Natuvion gibi lisanslı toollar gerektirir; danışmanlık eforu yüksektir.</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="dot amber"></div>
                <div>
                  <strong>Maliyet & Süre Dezavantajı:</strong>
                  <span>Proje süresi 12 aya uzar ve ek tool maliyeti bütçeyi artırır.</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <span class="footer-note">Yalnızca radikal süreç dönüşümü istenirse alternatif</span>
            </div>
          </div>

          <!-- Method 3: Greenfield -->
          <div class="method-card not-suitable">
            <div class="card-header">
              <div class="header-top">
                <span class="badge-severity not-suitable">UYGUN DEĞİL</span>
                <span class="time-badge">12 - 18 Ay</span>
              </div>
              <h3>Greenfield (Yeniden Kurulum)</h3>
              <p class="method-sub">Sıfırdan Temiz Sayfa Kurulumu</p>
            </div>

            <div class="card-body">
              <div class="feature-item">
                <div class="dot red"></div>
                <div>
                  <strong>Geçmiş Veri Kaybı:</strong>
                  <span>Sadece açılış bakiyeleri taşınır; geçmiş hareketler yeni sistemde raporlanamaz.</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="dot red"></div>
                <div>
                  <strong>Müşteri Önceliğiyle Çelişki:</strong>
                  <span>{{ customerService.activeCustomer().name }} geçmiş verinin erişilebilirliğini şart koştuğu için elenmiştir.</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="dot red"></div>
                <div>
                  <strong>Yüksek İş Eforu & Risk:</strong>
                  <span>Tüm iş birimlerinin süreçleri yeniden tasarlaması gerekir; değişim yönetimi kritik risk taşır.</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="dot red"></div>
                <div>
                  <strong>Maksimum Bütçe Yükü:</strong>
                  <span>En yüksek danışmanlık bütçesi ve en uzun canlıya geçiş takvimi.</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <span class="footer-note">Süreklilik gereksinimi nedeniyle önerilmemektedir</span>
            </div>
          </div>
        </div>

        <!-- Conversion Roadmap Timeline Steps -->
        <div class="timeline-section-card">
          <div class="section-heading">
            <app-icon name="sparkles" [size]="18" color="#0284c7"></app-icon>
            <h3>Önerilen Brownfield 4 Fazlı Dönüşüm Yol Haritası</h3>
          </div>

          <div class="steps-row">
            <div class="step-box">
              <div class="step-num">01</div>
              <div class="step-badge">1. - 2. Ay</div>
              <h4>Hazırlık & DVM</h4>
              <ul>
                <li>SAP Readiness Check 2.0</li>
                <li>DVM Arşivleme Projesi (REGUP/ACDOCA)</li>
                <li>HANA Sizing Optimizasyonu</li>
              </ul>
            </div>

            <div class="step-arrow">➔</div>

            <div class="step-box">
              <div class="step-num">02</div>
              <div class="step-badge">2. - 3. Ay</div>
              <h4>Sadeleştirme & Kod</h4>
              <ul>
                <li>Business Partner (BP) Ön Dönüşümü</li>
                <li>Malzeme Defteri Aktivasyonu</li>
                <li>Z Kod ABAP S/4HANA Uyarlaması</li>
              </ul>
            </div>

            <div class="step-arrow">➔</div>

            <div class="step-box">
              <div class="step-num">03</div>
              <div class="step-badge">4. - 5. Ay</div>
              <h4>System Conversion</h4>
              <ul>
                <li>SUM (Software Update Manager) ile Geçiş</li>
                <li>Sandbox & QA Dönüşüm Provaları</li>
                <li>Finansal Veri Mutabakat Testleri</li>
              </ul>
            </div>

            <div class="step-arrow">➔</div>

            <div class="step-box highlight">
              <div class="step-num">04</div>
              <div class="step-badge green">6. Ay</div>
              <h4>RISE Canlıya Geçiş</h4>
              <ul>
                <li>Cutover & Go-Live Operasyonu</li>
                <li>LShift ile RISE Cloud DB Geçişi</li>
                <li>Hypercare Destek & Optimizasyon</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TAB 2: HEDEF MİMARİ & 3RD PARTİLER ================= -->
      <div class="tab-content" *ngIf="activeTab() === 'target-architecture'">
        <!-- Split View: Sol Mevcut Mimari vs Sağ Hedef Mimari -->
        <div class="split-architecture-grid">
          <!-- SOL PANEL: MEVCUT MİMARİ (AS-IS) -->
          <div class="arch-panel as-is-panel">
            <div class="panel-header">
              <div class="p-title-group">
                <span class="panel-tag tag-warning">MEVCUT MİMARİ (AS-IS)</span>
                <h3>On-Premise & Dağınık Altyapı</h3>
              </div>
              <span class="metric-pill red">11 Ayrı Sunucu</span>
            </div>

            <div class="arch-card-list">
              <div class="arch-card">
                <div class="card-icon-area bg-amber">
                  <app-icon name="database" [size]="18" color="#d97706"></app-icon>
                </div>
                <div class="card-info">
                  <strong>ERP Çekirdeği: SAP ECC 6.0 EHP7</strong>
                  <p>Klasik AnyDB / Oracle veritabanı. S/4HANA standart tabloları ve Clean Core mimarisi eksik.</p>
                  <span class="status-risk">EoS (Destek Sonu) Yaklaşıyor</span>
                </div>
              </div>

              <div class="arch-card">
                <div class="card-icon-area bg-amber">
                  <app-icon name="server" [size]="18" color="#d97706"></app-icon>
                </div>
                <div class="card-info">
                  <strong>11 Dağınık Sunucu Mimarisi</strong>
                  <p>Dev, Test, Canlı, PO, BI, Arşiv, Fiori ve Web sunucuları ayrı donanımlarda barınıyor.</p>
                  <span class="status-risk">Yüksek Donanım & Lisans Bakım Maliyeti</span>
                </div>
              </div>

              <div class="arch-card">
                <div class="card-icon-area bg-amber">
                  <app-icon name="link" [size]="18" color="#d97706"></app-icon>
                </div>
                <div class="card-info">
                  <strong>SAP PO 7.5 & Noktadan Noktaya Entegrasyonlar</strong>
                  <p>109 canlı servis (83 Verici, 26 Alıcı). Çoğunluğu klasik RFC, SOAP ve dosya transferi (FTP) tabanlı.</p>
                  <span class="status-risk">2027 PO Destek Sonu Riski</span>
                </div>
              </div>

              <div class="arch-card">
                <div class="card-icon-area bg-amber">
                  <app-icon name="cpu" [size]="18" color="#d97706"></app-icon>
                </div>
                <div class="card-info">
                  <strong>Yoğun Z Geliştirmeleri & Kirlilik</strong>
                  <p>Klasik satıcı/müşteri yapısına bağlı ZSD programları ve 22.000+ tanımlı atıl masraf çeşidi.</p>
                  <span class="status-risk">Business Partner Uyumsuzluğu</span>
                </div>
              </div>
            </div>
          </div>

          <!-- SAĞ PANEL: HEDEF MİMARİ (TO-BE / RISE WITH SAP) -->
          <div class="arch-panel to-be-panel">
            <div class="panel-header">
              <div class="p-title-group">
                <span class="panel-tag tag-success">HEDEF MİMARİ (TO-BE)</span>
                <h3>RISE with SAP S/4HANA Cloud</h3>
              </div>
              <span class="metric-pill green">1 Konsolide Bulut DB</span>
            </div>

            <div class="arch-card-list">
              <div class="arch-card highlight-rise">
                <div class="card-icon-area bg-emerald">
                  <app-icon name="sparkles" [size]="18" color="#059669"></app-icon>
                </div>
                <div class="card-info">
                  <strong>ERP Çekirdeği: S/4HANA Private Cloud Edition</strong>
                  <p>En güncel sürüm, yerleşik Yapay Zekâ (Joule), Fiori modern kullanıcı arayüzü ve Clean Core standardı.</p>
                  <span class="status-success">Tam SLA & Otomatik Güncelleme</span>
                </div>
              </div>

              <div class="arch-card highlight-rise">
                <div class="card-icon-area bg-emerald">
                  <app-icon name="database" [size]="18" color="#059669"></app-icon>
                </div>
                <div class="card-info">
                  <strong>Konsolide HANA 2.0 In-Memory DB</strong>
                  <p>11 dağınık sunucudan tek bir güvenli, yüksek hızlı kurumsal bulut veritabanına geçiş (%91 konsolidasyon).</p>
                  <span class="status-success">1.311 GiB RAM Optimize Boyut</span>
                </div>
              </div>

              <div class="arch-card highlight-rise">
                <div class="card-icon-area bg-emerald">
                  <app-icon name="bolt" [size]="18" color="#059669"></app-icon>
                </div>
                <div class="card-info">
                  <strong>SAP BTP Integration Suite</strong>
                  <p>Cloud Integration, Open Connectors ve Event Mesh ile tüm dış dünya ve 3rd partilerle gerçek zamanlı REST API haberleşmesi.</p>
                  <span class="status-success">Modern API Gateway & Güvenlik</span>
                </div>
              </div>

              <div class="arch-card highlight-rise">
                <div class="card-icon-area bg-emerald">
                  <app-icon name="users" [size]="18" color="#059669"></app-icon>
                </div>
                <div class="card-info">
                  <strong>Business Partner & Optimize FUE Lisanslama</strong>
                  <p>Tekleştirilmiş müşteri/satıcı ana verisi. 83 aktif kullanıcı ➔ 70 FUE paketi ile optimum lisanslama maliyeti.</p>
                  <span class="status-success">Clean Core & Düşük TCO</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= ALPEREN'İN TABLOSU: 3RD PARTİLER ================= -->
        <div class="third-party-table-card">
          <div class="table-header-box">
            <div>
              <div class="tb-badge-row">
                <span class="tb-badge">MÜŞTERİ BAZLI ENTEGRASYON MATRİSİ</span>
                <span class="count-pill">{{ filteredSystems().length }} Entegre 3rd Parti Sistem</span>
              </div>
              <h2 class="table-title">3rd Party Sistemler ve Hedef Mimari Geçiş Haritası</h2>
              <p class="table-subtitle">
                {{ customerService.activeCustomer().name }} bünyesindeki aktif 3. parti sistemlerin protokolleri, hedef BTP dönüşüm stratejileri ve kritiklik düzeyleri
              </p>
            </div>

            <!-- Table Actions / Filter Toolbar -->
            <div class="table-controls">
              <div class="search-box">
                <app-icon name="search" [size]="14" color="#9ca3af"></app-icon>
                <input 
                  type="text" 
                  placeholder="3rd party sistem veya protokol ara..." 
                  [(ngModel)]="searchQuery" />
              </div>

              <div class="filter-pills">
                <button 
                  class="f-pill" 
                  [class.active]="selectedCategory() === 'TÜMÜ'" 
                  (click)="selectedCategory.set('TÜMÜ')">
                  Tümü ({{ thirdPartyList.length }})
                </button>
                <button 
                  class="f-pill" 
                  [class.active]="selectedCategory() === 'Finans & Banka'" 
                  (click)="selectedCategory.set('Finans & Banka')">
                  Finans & Banka
                </button>
                <button 
                  class="f-pill" 
                  [class.active]="selectedCategory() === 'Yasal & e-Dönüşüm'" 
                  (click)="selectedCategory.set('Yasal & e-Dönüşüm')">
                  Yasal & Uyum
                </button>
                <button 
                  class="f-pill" 
                  [class.active]="selectedCategory() === 'Satış & CRM'" 
                  (click)="selectedCategory.set('Satış & CRM')">
                  Satış & CRM
                </button>
                <button 
                  class="f-pill" 
                  [class.active]="selectedCategory() === 'Lojistik & WMS'" 
                  (click)="selectedCategory.set('Lojistik & WMS')">
                  Lojistik
                </button>
              </div>
            </div>
          </div>

          <!-- Data Table -->
          <div class="table-responsive">
            <table class="systems-table">
              <thead>
                <tr>
                  <th>3. PARTİ SİSTEM / SERVİS</th>
                  <th>KATEGORİ</th>
                  <th>ENTEGRASYON AMACI & İŞ SÜRECİ</th>
                  <th>MEVCUT PROTOKOL (AS-IS)</th>
                  <th>HEDEF BULUT PROTOKOLÜ (TO-BE)</th>
                  <th>DÖNÜŞÜM STRATEJİSİ</th>
                  <th>KRİTİKLİK</th>
                  <th>DURUM</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of filteredSystems()">
                  <!-- 1. System Name -->
                  <td>
                    <div class="sys-name-cell">
                      <span class="sys-icon-box">
                        <app-icon name="server" [size]="14" color="#0284c7"></app-icon>
                      </span>
                      <div>
                        <strong>{{ item.name }}</strong>
                        <span class="sys-note-sub">{{ item.notes }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- 2. Category -->
                  <td>
                    <span class="cat-pill">{{ item.category }}</span>
                  </td>

                  <!-- 3. Purpose -->
                  <td>
                    <span class="purpose-text">{{ item.purpose }}</span>
                  </td>

                  <!-- 4. Current Protocol -->
                  <td>
                    <div class="proto-cell as-is">
                      <span class="proto-tag red">{{ item.currentProtocol }}</span>
                    </div>
                  </td>

                  <!-- 5. Target Protocol -->
                  <td>
                    <div class="proto-cell to-be">
                      <span class="proto-tag green">{{ item.targetProtocol }}</span>
                    </div>
                  </td>

                  <!-- 6. Strategy -->
                  <td>
                    <span class="strategy-badge" [ngClass]="getStrategyClass(item.strategy)">
                      {{ item.strategy }}
                    </span>
                  </td>

                  <!-- 7. Criticality -->
                  <td>
                    <span class="crit-badge" [ngClass]="item.criticality.toLowerCase()">
                      {{ item.criticality }}
                    </span>
                  </td>

                  <!-- 8. Status -->
                  <td>
                    <span class="status-pill" [ngClass]="getStatusClass(item.status)">
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-footer-info">
            <div class="tf-left">
              <span class="dot-live"></span>
              <span>Tüm 3rd party entegrasyonlar SAP Clean Core ilkelerine uygun BTP Cloud Integration üzerinden yönetilecektir.</span>
            </div>
            <div class="tf-right">
              <span>* Alperen entegrasyon veri matrisi referansı ile eşlenmiştir</span>
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
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
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

    /* 3 Methods Grid */
    .methods-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
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

    /* Timeline Section Card */
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

      .arch-card-list {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }

      .arch-card {
        display: flex;
        align-items: flex-start;
        gap: 0.85rem;
        padding: 0.95rem;
        border-radius: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;

        &.highlight-rise {
          background: #ffffff;
          border-color: #bbf7d0;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.04);
        }

        .card-icon-area {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          &.bg-amber { background: #fef3c7; }
          &.bg-emerald { background: #dcfce7; }
        }

        .card-info {
          flex: 1;

          strong {
            font-size: 0.84rem;
            color: #0f172a;
            display: block;
            margin-bottom: 0.2rem;
          }

          p {
            font-size: 0.74rem;
            color: #64748b;
            margin: 0 0 0.35rem 0;
            line-height: 1.4;
          }

          .status-risk {
            font-size: 0.67rem;
            color: #dc2626;
            font-weight: 700;
            background: #fee2e2;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
          }

          .status-success {
            font-size: 0.67rem;
            color: #059669;
            font-weight: 700;
            background: #dcfce7;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
          }
        }
      }
    }

    /* Third Party Integration Table Card (Alperen'in Tablosu) */
    .third-party-table-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);

      .table-header-box {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1.5rem;
        margin-bottom: 1.25rem;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid #f1f5f9;

        .tb-badge-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.35rem;

          .tb-badge {
            font-size: 0.67rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            color: #0284c7;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 0.1rem 0.5rem;
            border-radius: 4px;
          }

          .count-pill {
            font-size: 0.68rem;
            color: #475569;
            background: #f1f5f9;
            padding: 0.1rem 0.5rem;
            border-radius: 999px;
            font-weight: 600;
          }
        }

        .table-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .table-subtitle {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        .table-controls {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          align-items: flex-end;

          .search-box {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            width: 260px;

            input {
              border: none;
              background: transparent;
              outline: none;
              font-size: 0.78rem;
              color: #1e293b;
              width: 100%;
            }
          }

          .filter-pills {
            display: flex;
            gap: 0.35rem;

            .f-pill {
              background: #f1f5f9;
              border: 1px solid transparent;
              color: #64748b;
              font-size: 0.68rem;
              font-weight: 600;
              padding: 0.2rem 0.55rem;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.15s ease;

              &:hover { background: #e2e8f0; color: #1e293b; }
              &.active { background: #0284c7; color: #ffffff; }
            }
          }
        }
      }

      .table-responsive {
        overflow-x: auto;
      }

      .systems-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.76rem;

        th {
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
          padding: 0.7rem 0.85rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        td {
          padding: 0.75rem 0.85rem;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }

        tr:hover td {
          background: #f8fafc;
        }
      }

      .sys-name-cell {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .sys-icon-box {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        strong { font-size: 0.82rem; color: #0f172a; display: block; }
        .sys-note-sub { font-size: 0.68rem; color: #64748b; }
      }

      .cat-pill {
        background: #f1f5f9;
        color: #475569;
        font-size: 0.68rem;
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        white-space: nowrap;
      }

      .purpose-text {
        font-size: 0.73rem;
        color: #475569;
        max-width: 220px;
        display: block;
        line-height: 1.35;
      }

      .proto-tag {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
        white-space: nowrap;

        &.red { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        &.green { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
      }

      .strategy-badge {
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        white-space: nowrap;

        &.strat-modernize { background: #eff6ff; color: #1d4ed8; }
        &.strat-wrapper { background: #f5f3ff; color: #6d28d9; }
        &.strat-rehost { background: #f0fdf4; color: #15803d; }
        &.strat-standard { background: #fefce8; color: #a16207; }
        &.strat-retire { background: #fef2f2; color: #b91c1c; }
      }

      .crit-badge {
        font-size: 0.66rem;
        font-weight: 800;
        padding: 0.12rem 0.45rem;
        border-radius: 999px;

        &.kritik { background: #fee2e2; color: #b91c1c; }
        &.yüksek { background: #fef3c7; color: #b45309; }
        &.orta { background: #f1f5f9; color: #475569; }
      }

      .status-pill {
        font-size: 0.68rem;
        font-weight: 600;
        padding: 0.12rem 0.45rem;
        border-radius: 4px;

        &.st-ready { background: #dcfce7; color: #15803d; }
        &.st-designed { background: #eff6ff; color: #1d4ed8; }
        &.st-analyzed { background: #fef9c3; color: #854d0e; }
        &.st-pending { background: #f1f5f9; color: #475569; }
      }

      .table-footer-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid #f1f5f9;
        font-size: 0.72rem;
        color: #64748b;

        .tf-left {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          .dot-live { width: 7px; height: 7px; border-radius: 50%; background: #059669; }
        }
      }
    }
  `]
})
export class SolutionProposalComponent implements OnInit {
  customerService = inject(CustomerService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  activeTab = signal<'methods' | 'target-architecture'>('methods');
  searchQuery = '';
  selectedCategory = signal<string>('TÜMÜ');

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
      } else if (tab === 'methods' || tab === 'gecis-yontemleri') {
        this.activeTab.set('methods');
      }
    });
  }

  selectTab(tab: 'methods' | 'target-architecture') {
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
