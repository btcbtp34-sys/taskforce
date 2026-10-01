import { Component, inject, signal, computed, ElementRef, ViewChild, AfterViewInit, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import html2canvas from 'html2canvas';

export type ArchitectureTemplateType = 'as-is' | 'to-be';
export type CardShapeStyle = 'corporate' | 'glass' | 'hexagon' | 'capsule' | 'blueprint';
export type ColorTheme = 'sap-blue' | 'cyber-dark' | 'emerald-clean' | 'royal-purple';
export type LineStyle = 'straight' | 'curved' | 'animated';

export interface ArchitectureNode {
  id: string;
  name: string;
  subtitle?: string;
  isCenter: boolean;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  icon?: string;
}

export interface InterConnection {
  id: string;
  fromId: string;
  toId: string;
  isBidirectional?: boolean;
  isSolid?: boolean;
}

export interface ArchitectureSlideData {
  mode: ArchitectureTemplateType;
  shapeStyle: CardShapeStyle;
  colorTheme: ColorTheme;
  lineStyle: LineStyle;
  categoryBadge: string;
  mainTitle: string;
  subtitle: string;
  customerName: string;
  centerTitle: string;
  centerSubtitle: string;
  nodes: ArchitectureNode[];
  interConnections: InterConnection[];
  pillTags: { text: string; primary?: boolean }[];
  footerNote: string;
  rightNodeTitle?: string;
  rightNodeSubtitle?: string;
}

@Component({
  selector: 'app-architecture-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="gen-page" [class.presentation-mode]="isPresentationMode()">
      <!-- Page Header & Action Bar -->
      <div class="page-top-bar" *ngIf="!isPresentationMode()">
        <div class="title-meta">
          <div class="breadcrumb-tag">
            <span class="badge-accent">HIZLI ARAÇLAR</span>
            <span class="sep">/</span>
            <span>MİMARİ GÖRSEL ÜRETİCİ</span>
          </div>
          <h1 class="main-heading">
            <app-icon name="sparkles" [size]="24" color="#7c3aed"></app-icon>
            Kurumsal Mimari Çizici (AS-IS & TO-BE)
          </h1>
          <p class="sub-heading">
            Her şablonun orijinal promptunu doğrudan görüntüleyin ve düzenleyin. AS-IS ve TO-BE şablonlarını müşteri ihtiyaçlarına göre kişiselleştirip sunuma hazır 16:9 formatta indirin.
          </p>
        </div>

        <div class="top-actions">
          <!-- Active Customer Selector -->
          <div class="cust-selector-box">
            <span class="c-label">Müşteri:</span>
            <select [ngModel]="customerService.activeCustomerId()" (ngModelChange)="onCustomerChange($event)" class="cust-dropdown">
              <option *ngFor="let c of customerService.customers()" [value]="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <!-- Save Button -->
          <button class="btn btn-secondary" (click)="saveForCurrentCustomer()" title="Bu müşteriye özel şemayı tarayıcıya kaydet">
            <app-icon name="check" [size]="15" color="#059669"></app-icon>
            <span>Kaydet</span>
          </button>

          <!-- Reset Button -->
          <button class="btn btn-secondary" (click)="resetTemplate()" title="Geçerli şablonu varsayılana sıfırla">
            <app-icon name="refresh" [size]="15"></app-icon>
            <span>Sıfırla</span>
          </button>

          <!-- Presentation Mode -->
          <button class="btn btn-secondary" (click)="togglePresentationMode()" title="Tam Ekran Sunum Modu">
            <app-icon [name]="isPresentationMode() ? 'minimize' : 'presentation'" [size]="15" color="#7c3aed"></app-icon>
            <span>{{ isPresentationMode() ? 'Sunumdan Çık' : 'Sunum Modu' }}</span>
          </button>

          <!-- High-Res PNG Export -->
          <button class="btn btn-primary" (click)="exportAsPng()" [disabled]="isExporting()" title="PNG Görseli Olarak İndir (Sunum Kalitesinde)">
            <app-icon name="download" [size]="15" color="#ffffff"></app-icon>
            <span>{{ isExporting() ? 'İndiriliyor...' : 'PNG İndir' }}</span>
          </button>
        </div>
      </div>

      <!-- Exit Floating Button in Presentation Mode -->
      <button class="floating-exit-btn" *ngIf="isPresentationMode()" (click)="togglePresentationMode()" title="Sunum Modundan Çık (ESC)">
        <app-icon name="x" [size]="18" color="#ffffff"></app-icon>
        <span>Sunum Modundan Çık</span>
      </button>

      <!-- Main Workspace -->
      <div class="workspace-layout">
        <!-- TOP CONTROL PANEL (Hidden in presentation mode) -->
        <div class="prompt-control-card" *ngIf="!isPresentationMode()">
          <!-- 1. ŞABLON SEÇİMİ VE AÇILIP KAPANIR TEMA MENÜSÜ -->
          <div class="template-selector-bar">
            <div class="selector-header-row">
              <div class="selector-title">
                <span class="st-label">MİMARİ ŞABLON SEÇİMİ:</span>
              </div>

              <!-- AÇILIP KAPANIR TEMA BUTONU -->
              <button 
                class="theme-menu-toggle-btn" 
                [class.open]="isThemePanelOpen()"
                (click)="toggleThemePanel()"
                title="Şekil ve tema seçeneklerini aç / kapat">
                <span class="tmt-icon">🎨</span>
                <span class="tmt-text">Şekil ve Tema Seçenekleri</span>
                <span class="tmt-badge">{{ getShapeStyleLabel() }} • {{ getColorThemeLabel() }}</span>
                <svg class="tmt-chevron" [class.rotated]="isThemePanelOpen()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            <div class="template-toggle-group">
              <button 
                class="tpl-btn" 
                [class.active]="selectedTemplateType() === 'as-is'"
                (click)="switchTemplate('as-is')">
                <span class="tpl-badge as-is-badge">MEVCUT DURUM</span>
                <span class="tpl-title">1. AS-IS Mimari (Klasik Kurumsal / Core ERP Hub)</span>
              </button>

              <button 
                class="tpl-btn" 
                [class.active]="selectedTemplateType() === 'to-be'"
                (click)="switchTemplate('to-be')">
                <span class="tpl-badge to-be-badge">HEDEF DURUM</span>
                <span class="tpl-title">2. TO-BE Mimari (SAP BTP Integration Suite Yatay Akış)</span>
              </button>
            </div>
          </div>

          <!-- AÇILIR/KAPANIR ŞEKİL & GÖRSEL TARZ MENÜSÜ -->
          <div class="style-selector-bar collapsible-panel" *ngIf="isThemePanelOpen()">
            <div class="style-group-item">
              <span class="sg-label">ŞEKİL & KART TARZI:</span>
              <div class="style-chips">
                <button 
                  class="style-chip-btn" 
                  [class.active]="slideData.shapeStyle === 'corporate'"
                  (click)="setShapeStyle('corporate')"
                  title="Klasik SAP Kurumsal Kartlar (Hafif yuvarlatılmış, temiz gölge)">
                  <span class="sc-icon">🏛️</span>
                  <span>Klasik Kurumsal</span>
                </button>

                <button 
                  class="style-chip-btn" 
                  [class.active]="slideData.shapeStyle === 'glass'"
                  (click)="setShapeStyle('glass')"
                  title="Modern Glassmorphism (Buzlu cam, parlak kenarlıklar, 3D derinlik)">
                  <span class="sc-icon">💎</span>
                  <span>Glassmorphism (Cam)</span>
                </button>

                <button 
                  class="style-chip-btn" 
                  [class.active]="slideData.shapeStyle === 'hexagon'"
                  (click)="setShapeStyle('hexagon')"
                  title="Altıgen / Tech Cluster (Modern teknoloji köşe kesimleri ve badge'ler)">
                  <span class="sc-icon">🔷</span>
                  <span>Altıgen & Tech</span>
                </button>

                <button 
                  class="style-chip-btn" 
                  [class.active]="slideData.shapeStyle === 'capsule'"
                  (click)="setShapeStyle('capsule')"
                  title="Modern 3D Kapsül & Oval (Yumuşak SaaS hap formları)">
                  <span class="sc-icon">💊</span>
                  <span>3D Kapsül (Oval)</span>
                </button>

                <button 
                  class="style-chip-btn" 
                  [class.active]="slideData.shapeStyle === 'blueprint'"
                  (click)="setShapeStyle('blueprint')"
                  title="Teknik Blueprint (Mühendislik gridi ve keskin teknik hatlar)">
                  <span class="sc-icon">📐</span>
                  <span>Teknik Blueprint</span>
                </button>
              </div>
            </div>

            <!-- RENK TEMASI SEÇİCİ -->
            <div class="style-group-item">
              <span class="sg-label">RENK TEMASI:</span>
              <div class="color-theme-chips">
                <button 
                  class="ct-chip" 
                  [class.active]="slideData.colorTheme === 'sap-blue'"
                  (click)="setColorTheme('sap-blue')" 
                  title="SAP Klasik Kurumsal Mavi">
                  <span class="color-dot sap-dot"></span>
                  <span>SAP Mavi</span>
                </button>

                <button 
                  class="ct-chip" 
                  [class.active]="slideData.colorTheme === 'cyber-dark'"
                  (click)="setColorTheme('cyber-dark')" 
                  title="Koyu Gece / Dark Mode">
                  <span class="color-dot dark-dot"></span>
                  <span>Dark Gece</span>
                </button>

                <button 
                  class="ct-chip" 
                  [class.active]="slideData.colorTheme === 'emerald-clean'"
                  (click)="setColorTheme('emerald-clean')" 
                  title="Zümrüt Yeşili & Clean Core">
                  <span class="color-dot emerald-dot"></span>
                  <span>Clean Emerald</span>
                </button>

                <button 
                  class="ct-chip" 
                  [class.active]="slideData.colorTheme === 'royal-purple'"
                  (click)="setColorTheme('royal-purple')" 
                  title="Modern AI Mor / Indigo">
                  <span class="color-dot purple-dot"></span>
                  <span>Royal Purple</span>
                </button>
              </div>
            </div>

            <!-- BAĞLANTI HATTI STİLİ -->
            <div class="style-group-item">
              <span class="sg-label">HAT ÇİZGİSİ:</span>
              <div class="line-style-chips">
                <button class="ls-chip" [class.active]="slideData.lineStyle === 'straight'" (click)="setLineStyle('straight')">
                  Düz
                </button>
                <button class="ls-chip" [class.active]="slideData.lineStyle === 'curved'" (click)="setLineStyle('curved')">
                  Kavisli
                </button>
                <button class="ls-chip" [class.active]="slideData.lineStyle === 'animated'" (click)="setLineStyle('animated')">
                  ✨ Canlı Akış
                </button>
              </div>
            </div>
          </div>

          <!-- Prompt Area: Seçili Şablonun Orijinal Promptu ile Başlar -->
          <div class="prompt-section">
            <div class="prompt-header-row">
              <div class="ph-title-box">
                <div class="spark-icon">
                  <app-icon name="sparkles" [size]="16" color="#7c3aed"></app-icon>
                </div>
                <div>
                  <strong class="ph-main">
                    {{ selectedTemplateType() === 'as-is' ? 'AS-IS Mimari Promptu' : 'TO-BE Hedef Mimari Promptu' }}
                  </strong>
                  <span class="ph-sub">Aşağıdaki prompt mevcut çizimi üretir. Dilediğiniz kelimeleri ve sistemleri değiştirerek güncelleyebilirsiniz:</span>
                </div>
              </div>
              
              <!-- Dinamik Hazır Şablon Prompt Butonları -->
              <div class="ph-chips">
                <!-- Şablonun orijinal promptunu geri yükle -->
                <button class="sample-prompt-chip highlight-chip" (click)="restoreCanonicalPrompt()" title="Ekranda görünen diyagramın birebir orijinal promptunu yükle">
                  🔄 Ekranki Şeklin Orijinal Promptu
                </button>

                <!-- AS-IS Alternatifleri -->
                <ng-container *ngIf="selectedTemplateType() === 'as-is'">
                  <button class="sample-prompt-chip" (click)="loadSamplePreset('as-is-retail')" title="Perakende AS-IS Mimarisi (Noktadan noktaya spagetti entegrasyon)">
                    🛒 Perakende AS-IS (CRM, WMS, E-Ticaret)
                  </button>
                  <button class="sample-prompt-chip" (click)="loadSamplePreset('as-is-industry')" title="Üretim & Sanayi AS-IS Mimarisi (MES, SCADA, Dağınık Hatlar)">
                    🏭 Sanayi AS-IS (MES, SCADA, Depo)
                  </button>
                </ng-container>

                <!-- TO-BE Alternatifleri -->
                <ng-container *ngIf="selectedTemplateType() === 'to-be'">
                  <button class="sample-prompt-chip" (click)="loadSamplePreset('to-be-retail')" title="Perakende & E-Ticaret TO-BE BTP Hub Mimarisi">
                    🛒 Perakende TO-BE (Salesforce, Shopify, WMS)
                  </button>
                  <button class="sample-prompt-chip" (click)="loadSamplePreset('to-be-industry')" title="Sanayi & Üretim TO-BE BTP Event Mesh Mimarisi">
                    🏭 Sanayi TO-BE (Siemens MES, SCADA, Event Mesh)
                  </button>
                  <button class="sample-prompt-chip" (click)="loadSamplePreset('to-be-fintech')" title="Finans & Bankacılık TO-BE BTP API Gateway">
                    🏦 Finans TO-BE (Açık Bankacılık, API Gateway)
                  </button>
                </ng-container>
              </div>
            </div>

            <!-- PROMPT FORMAT REHBERİ (İPUCU KUTUSU) -->
            <div class="prompt-quick-guide">
              <div class="pqg-badge-wrap">
                <span class="pqg-badge">💡 PROMPT REHBERİ:</span>
              </div>
              <div class="pqg-text" *ngIf="selectedTemplateType() === 'to-be'">
                Sistemin en doğru çizmesi için 3 sütun ve etiketleri belirtin: 
                <strong>Sol:</strong> <code>Sol tarafta Dış Sistemler (CRM, E-Ticaret, WMS)</code> • 
                <strong>Orta:</strong> <code>Ortada SAP BTP çatısı altında SAP Integration Suite (Tek yönetişim noktası)</code> • 
                <strong>Sağ:</strong> <code>Sağ tarafta CORE ERP (Clean Core)</code> • 
                <strong>Etiketler:</strong> <code>Alt etiketler: Ölçeklenebilir, Yönetilebilir (vurgulu)</code>
              </div>
              <div class="pqg-text" *ngIf="selectedTemplateType() === 'as-is'">
                Mevcut dağınık mimariyi tarif etmek için: 
                <strong>Merkez:</strong> <code>Merkezde CORE ERP</code> • 
                <strong>Konumlar:</strong> <code>Üstte Salesforce CRM, sağda E-Ticaret, solda Siemens MES, altta WMS Depo</code> • 
                <strong>Bağlantı:</strong> <code>Salesforce ile Siemens arasında kesin çizgi olsun</code> • 
                <strong>Etiketler:</strong> <code>Alt etiketler: Point-to-Point, Dağınık</code>
              </div>
            </div>

            <div class="prompt-input-wrapper">
              <textarea 
                [(ngModel)]="promptText" 
                rows="3" 
                class="prompt-textarea"
                placeholder="Mimariyi tarif eden prompt metni...">
              </textarea>
              
              <div class="prompt-action-row">
                <span class="prompt-helper">
                  <app-icon name="info" [size]="13" color="#64748b"></app-icon>
                  Yukarıdaki butonlara tıklayarak hazır örnekleri yükleyebilir veya kendi sistemlerinizi yazıp tek tıkla şemayı oluşturabilirsiniz.
                </span>
                <button class="btn btn-generate" (click)="generateFromPrompt()" [disabled]="isGenerating()">
                  <app-icon name="sparkles" [size]="15" color="#ffffff"></app-icon>
                  <span>{{ isGenerating() ? 'Ayrıştırılıyor...' : '✨ Prompt ile Şemayı Çiz' }}</span>
                </button>
              </div>

              <!-- Instant Feedback Banner -->
              <div class="prompt-feedback-banner" *ngIf="parsedFeedbackMessage()">
                <app-icon name="check" [size]="15" color="#059669"></app-icon>
                <span>{{ parsedFeedbackMessage() }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Edit Accordion Bar -->
          <div class="quick-editor-tabs">
            <button class="q-tab" [class.active]="activeEditorTab === 'visual'" (click)="activeEditorTab = 'visual'">
              <app-icon name="presentation" [size]="13"></app-icon>
              <span>Şema Önizleme</span>
            </button>
            <button class="q-tab" [class.active]="activeEditorTab === 'texts'" (click)="activeEditorTab = 'texts'">
              <app-icon name="edit" [size]="13"></app-icon>
              <span>Metin ve Başlıklar</span>
            </button>
            <button class="q-tab" [class.active]="activeEditorTab === 'systems'" (click)="activeEditorTab = 'systems'">
              <app-icon name="layers" [size]="13"></app-icon>
              <span>Sistemler ({{ slideData.nodes.length }})</span>
            </button>
            <button class="q-tab" [class.active]="activeEditorTab === 'tags'" (click)="activeEditorTab = 'tags'">
              <app-icon name="sliders" [size]="13"></app-icon>
              <span>Alt Etiketler ({{ slideData.pillTags.length }})</span>
            </button>
          </div>

          <!-- Inline Text Editor Subpanel -->
          <div class="editor-subpanel" *ngIf="activeEditorTab === 'texts'">
            <div class="input-grid">
              <div class="ig-item">
                <label>Kategori Üst Başlık</label>
                <input type="text" [(ngModel)]="slideData.categoryBadge" class="form-input" />
              </div>
              <div class="ig-item">
                <label>Ana Başlık</label>
                <input type="text" [(ngModel)]="slideData.mainTitle" class="form-input" />
              </div>
              <div class="ig-item">
                <label>Alt Açıklama</label>
                <input type="text" [(ngModel)]="slideData.subtitle" class="form-input" />
              </div>
              <div class="ig-item">
                <label>Müşteri Adı [Sağ Üst]</label>
                <input type="text" [(ngModel)]="slideData.customerName" class="form-input" />
              </div>
              <div class="ig-item">
                <label>{{ selectedTemplateType() === 'as-is' ? 'Merkez Sistem Başlığı' : 'BTP Entegrasyon Katmanı Başlığı' }}</label>
                <input type="text" [(ngModel)]="slideData.centerTitle" class="form-input" />
              </div>
              <div class="ig-item">
                <label>Merkez Alt Başlığı</label>
                <input type="text" [(ngModel)]="slideData.centerSubtitle" class="form-input" />
              </div>
              <div class="ig-item full-width">
                <label>Alt Not (Footer Summary)</label>
                <input type="text" [(ngModel)]="slideData.footerNote" class="form-input" />
              </div>
            </div>
          </div>

          <!-- Inline Systems Subpanel -->
          <div class="editor-subpanel" *ngIf="activeEditorTab === 'systems'">
            <div class="systems-editor-header">
              <span>Sistem Listesi</span>
              <button class="btn btn-xs btn-outline" (click)="addNode()">+ Sistem Ekle</button>
            </div>
            <div class="systems-grid">
              <div class="system-chip" *ngFor="let n of slideData.nodes; let ni = index">
                <input type="text" [(ngModel)]="n.name" class="sc-input" placeholder="Sistem Adı" />
                <input type="text" [(ngModel)]="n.subtitle" class="sc-sub-input" placeholder="Açıklama (opsiyonel)" />
                <button class="nc-delete-btn" (click)="removeNode(ni)" title="Sil">
                  <app-icon name="trash" [size]="13" color="#ef4444"></app-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Inline Tags Subpanel -->
          <div class="editor-subpanel" *ngIf="activeEditorTab === 'tags'">
            <div class="tags-editor-header">
              <span>Alt Etiketler (Pill Badges)</span>
              <button class="btn btn-xs btn-outline" (click)="addTag()">+ Etiket Ekle</button>
            </div>
            <div class="tags-grid">
              <div class="tag-row" *ngFor="let t of slideData.pillTags; let ti = index">
                <input type="text" [(ngModel)]="t.text" class="tag-input" />
                <label class="tag-primary-check" title="Vurgulu mavi buton yap">
                  <input type="checkbox" [(ngModel)]="t.primary" /> Vurgulu
                </label>
                <button class="nc-delete-btn" (click)="removeTag(ti)" title="Sil">
                  <app-icon name="trash" [size]="13" color="#ef4444"></app-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- FULL-WIDTH SLIDE CANVAS -->
        <div class="slide-canvas-wrapper" [class.full-view]="isPresentationMode()">
          <!-- Canvas Top Notice -->
          <div class="canvas-meta-bar" *ngIf="!isPresentationMode()">
            <div class="cmb-left">
              <span class="live-dot"></span>
              <strong>{{ selectedTemplateType() === 'as-is' ? 'Şablon 1: Klasik AS-IS Mimarisi' : 'Şablon 2: Yatay Hedef TO-BE Mimarisi' }}</strong>
              <span class="cmb-style-tag">Tarz: {{ getShapeStyleLabel() }} • {{ getColorThemeLabel() }}</span>
            </div>
            <div class="cmb-right">
              <span class="res-badge">Ultra Geniş 16:9 Tuval</span>
            </div>
          </div>

          <!-- THE PRESENTATION SLIDE (Full-Width Responsive 16:9 Canvas) -->
          <div 
            #slideCanvas 
            class="presentation-slide shape-{{ slideData.shapeStyle }} theme-{{ slideData.colorTheme }}" 
            [class.to-be-mode]="selectedTemplateType() === 'to-be'" 
            id="architecture-slide-export">

            <!-- Technical Grid Background in Blueprint Style -->
            <div class="blueprint-grid-overlay" *ngIf="slideData.shapeStyle === 'blueprint'"></div>

            <!-- Slide Top Header -->
            <div class="slide-header">
              <div class="header-left">
                <div class="category-tag-title" (click)="quickEditField('categoryBadge')" title="Düzenle">
                  {{ slideData.categoryBadge }}
                </div>
                <h2 class="slide-main-title" (click)="quickEditField('mainTitle')" title="Düzenle">
                  {{ slideData.mainTitle }}
                </h2>
                <div class="slide-subtitle" (click)="quickEditField('subtitle')" title="Düzenle">
                  {{ slideData.subtitle }}
                </div>
              </div>

              <div class="header-right">
                <div class="customer-name-badge" (click)="quickEditField('customerName')" title="Düzenle">
                  [{{ slideData.customerName }}]
                </div>
              </div>
            </div>

            <!-- ============================================== -->
            <!-- 1. TEMPLATE 1: AS-IS RADIAL / HUB-SPOKE VIEW   -->
            <!-- ============================================== -->
            <div class="diagram-field as-is-field" #diagramField *ngIf="selectedTemplateType() === 'as-is'">
              <!-- SVG Layer for Connection Lines using standard 0-100 coordinate space -->
              <svg class="diagram-svg" viewBox="0 0 100 100" preserveAspectRatio="none" #svgCanvas>
                <defs>
                  <marker id="arrow-dashed-grey" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 9 5 L 0 9 z" [attr.fill]="getLineColor()" />
                  </marker>
                  <marker id="arrow-dashed-start-grey" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 9 1 L 0 5 L 9 9 z" [attr.fill]="getLineColor()" />
                  </marker>
                </defs>

                <!-- Solid Hub Lines to Center (Hub to each Satellite) -->
                <line 
                  *ngFor="let node of slideData.nodes" 
                  [attr.x1]="getCenterCoords().x" 
                  [attr.y1]="getCenterCoords().y" 
                  [attr.x2]="node.x" 
                  [attr.y2]="node.y" 
                  class="solid-hub-line"
                  vector-effect="non-scaling-stroke"
                  [attr.stroke]="getLineColor()"
                  [class.animated-line]="slideData.lineStyle === 'animated'" />

                <!-- Inter-Connections between satellites (Dashed or Solid based on prompt/config) -->
                <line 
                  *ngFor="let conn of slideData.interConnections" 
                  [attr.x1]="getNodeCoords(conn.fromId)?.x" 
                  [attr.y1]="getNodeCoords(conn.fromId)?.y" 
                  [attr.x2]="getNodeCoords(conn.toId)?.x" 
                  [attr.y2]="getNodeCoords(conn.toId)?.y" 
                  [class.dashed-inter-line]="!conn.isSolid"
                  [class.solid-inter-line]="conn.isSolid"
                  vector-effect="non-scaling-stroke"
                  [attr.stroke]="getLineColor()"
                  marker-end="url(#arrow-dashed-grey)"
                  [attr.marker-start]="conn.isBidirectional ? 'url(#arrow-dashed-start-grey)' : ''" />
              </svg>

              <!-- Central Node: CORE ERP -->
              <div 
                class="node-card center-core-erp shape-elem"
                [style.left]="getCenterCoords().x + '%'"
                [style.top]="getCenterCoords().y + '%'"
                (mousedown)="startDrag('center', $event)">
                <div class="node-inner-content">
                  <div class="tech-corner-accent" *ngIf="slideData.shapeStyle === 'hexagon' || slideData.shapeStyle === 'blueprint'"></div>
                  <div class="center-title">{{ slideData.centerTitle }}</div>
                  <div class="center-desc">{{ slideData.centerSubtitle }}</div>
                </div>
              </div>

              <!-- Satellite 3rd Party Nodes -->
              <div 
                *ngFor="let node of slideData.nodes" 
                class="node-card satellite-system shape-elem"
                [style.left]="node.x + '%'"
                [style.top]="node.y + '%'"
                (mousedown)="startDrag(node.id, $event)">
                <div class="node-inner-content">
                  <div class="tech-corner-accent" *ngIf="slideData.shapeStyle === 'hexagon' || slideData.shapeStyle === 'blueprint'"></div>
                  <span class="satellite-title">{{ node.name }}</span>
                  <span class="satellite-subtitle" *ngIf="node.subtitle">{{ node.subtitle }}</span>
                </div>
              </div>
            </div>

            <!-- ============================================== -->
            <!-- 2. TEMPLATE 2: TO-BE HORIZONTAL BTP FLOW VIEW  -->
            <!-- ============================================== -->
            <div class="diagram-field to-be-field" *ngIf="selectedTemplateType() === 'to-be'">
              <div class="tobe-horizontal-container">
                <!-- Left Pillar: 3RD PARTY SYSTEMS -->
                <div class="tobe-pillar tobe-left-card shape-elem">
                  <div class="tech-corner-accent" *ngIf="slideData.shapeStyle === 'hexagon' || slideData.shapeStyle === 'blueprint'"></div>
                  <div class="tobe-card-header">
                    <span class="tobe-title">{{ slideData.nodes[0]?.name || '3RD PARTY SYSTEMS' }}</span>
                    <span class="tobe-subtitle">{{ slideData.nodes[0]?.subtitle || 'Dış ekosistem' }}</span>
                  </div>
                  <!-- Mini items list if multiple systems exist -->
                  <div class="tobe-subnodes" *ngIf="slideData.nodes.length > 1">
                    <div class="subnode-item" *ngFor="let sub of slideData.nodes.slice(1)">
                      <span class="subnode-bullet">•</span>
                      <span>{{ sub.name }}</span>
                    </div>
                  </div>
                </div>

                <!-- Double-ended Arrow 1 (Left to BTP) -->
                <div class="tobe-arrow-connector">
                  <svg width="100%" height="36" viewBox="0 0 100 36" preserveAspectRatio="none">
                    <defs>
                      <marker id="arrow-blue-left" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 9 1 L 0 5 L 9 9 z" [attr.fill]="getArrowColor()" />
                      </marker>
                      <marker id="arrow-blue-right" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 1 1 L 10 5 L 1 9 z" [attr.fill]="getArrowColor()" />
                      </marker>
                    </defs>
                    <line x1="8" y1="18" x2="92" y2="18" [attr.stroke]="getArrowColor()" stroke-width="2.8" marker-start="url(#arrow-blue-left)" marker-end="url(#arrow-blue-right)" />
                  </svg>
                </div>

                <!-- Center Pillar: SAP BTP Dashed Container + SAP Integration Suite Card -->
                <div class="tobe-btp-wrapper">
                  <div class="btp-dashed-frame shape-elem">
                    <span class="btp-badge-label">SAP BTP</span>
                    <div class="tobe-integration-suite-card shape-elem">
                      <div class="tech-corner-accent" *ngIf="slideData.shapeStyle === 'hexagon' || slideData.shapeStyle === 'blueprint'"></div>
                      <div class="suite-title">{{ slideData.centerTitle }}</div>
                      <div class="suite-desc">{{ slideData.centerSubtitle }}</div>
                    </div>
                  </div>
                </div>

                <!-- Double-ended Arrow 2 (BTP to Core ERP) -->
                <div class="tobe-arrow-connector">
                  <svg width="100%" height="36" viewBox="0 0 100 36" preserveAspectRatio="none">
                    <line x1="8" y1="18" x2="92" y2="18" [attr.stroke]="getArrowColor()" stroke-width="2.8" marker-start="url(#arrow-blue-left)" marker-end="url(#arrow-blue-right)" />
                  </svg>
                </div>

                <!-- Right Pillar: CORE ERP (Clean Core) -->
                <div class="tobe-pillar tobe-right-card shape-elem">
                  <div class="tech-corner-accent" *ngIf="slideData.shapeStyle === 'hexagon' || slideData.shapeStyle === 'blueprint'"></div>
                  <div class="core-erp-content">
                    <div class="core-title">{{ slideData.rightNodeTitle || 'CORE ERP' }}</div>
                    <div class="core-desc" *ngIf="slideData.rightNodeSubtitle">{{ slideData.rightNodeSubtitle }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Slide Bottom Pill Tags & Footer Note -->
            <div class="slide-bottom-row">
              <div class="pill-tags-list">
                <span 
                  class="pill-tag shape-elem" 
                  *ngFor="let tag of slideData.pillTags"
                  [class.primary-pill]="tag.primary">
                  {{ tag.text }}
                </span>
              </div>
              <div class="slide-footer-note" (click)="quickEditField('footerNote')">
                {{ slideData.footerNote }}
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
      min-height: 100vh;
      background: #f8fafc;
      color: #1e293b;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .gen-page {
      padding: 1.25rem 2rem 3rem;
      width: 100%;
      box-sizing: border-box;

      &.presentation-mode {
        padding: 0;
        background: #0f172a;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    /* Floating Exit Button in Fullscreen */
    .floating-exit-btn {
      position: fixed;
      top: 24px;
      right: 28px;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      padding: 0.65rem 1.35rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
      transition: all 0.2s;

      &:hover {
        background: #ef4444;
        border-color: #ef4444;
      }
    }

    /* Top Page Header */
    .page-top-bar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .title-meta {
      flex: 1;
      min-width: 320px;
    }

    .breadcrumb-tag {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.3rem;

      .badge-accent {
        background: #f5f3ff;
        color: #7c3aed;
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        border: 1px solid #ddd6fe;
      }

      .sep { color: #cbd5e1; }
    }

    .main-heading {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 0 0 0.3rem;
      letter-spacing: -0.02em;
    }

    .sub-heading {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
      max-width: 820px;
      line-height: 1.45;
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .cust-selector-box {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.82rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

      .c-label { font-weight: 600; color: #64748b; }
      .cust-dropdown {
        border: none;
        background: transparent;
        font-weight: 700;
        color: #0f172a;
        font-size: 0.82rem;
        cursor: pointer;
        outline: none;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 0.95rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;

      &.btn-secondary {
        background: #ffffff;
        border-color: #e2e8f0;
        color: #334155;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

        &:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }
      }

      &.btn-primary {
        background: #0284c7;
        color: #ffffff;
        box-shadow: 0 2px 5px rgba(2, 132, 199, 0.25);

        &:hover { background: #0369a1; }
        &:disabled { opacity: 0.65; cursor: not-allowed; }
      }

      &.btn-generate {
        background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
        color: #ffffff;
        padding: 0.55rem 1.35rem;
        font-weight: 700;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);

        &:hover {
          background: linear-gradient(135deg, #6d28d9 0%, #4338ca 100%);
        }
      }

      &.btn-xs { padding: 0.25rem 0.55rem; font-size: 0.75rem; }
      &.btn-outline {
        background: #ffffff;
        border-color: #cbd5e1;
        color: #475569;
        &:hover { background: #f1f5f9; color: #0f172a; }
      }
    }

    /* Workspace Layout */
    .workspace-layout {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      width: 100%;
    }

    /* Control Panel */
    .prompt-control-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }

    /* Template Switcher Bar */
    .template-selector-bar {
      margin-bottom: 1.15rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;

      .selector-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.65rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .selector-title {
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #64748b;
      }

      /* AÇILIP KAPANIR TEMA MENÜ BUTONU */
      .theme-menu-toggle-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 0.35rem 0.75rem;
        font-size: 0.78rem;
        font-weight: 700;
        color: #334155;
        cursor: pointer;
        transition: all 0.2s;

        .tmt-icon { font-size: 0.85rem; }
        .tmt-badge {
          background: #eef2ff;
          color: #6366f1;
          padding: 0.1rem 0.45rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .tmt-chevron {
          transition: transform 0.2s ease;
          color: #64748b;

          &.rotated {
            transform: rotate(180deg);
            color: #7c3aed;
          }
        }

        &:hover, &.open {
          background: #ffffff;
          border-color: #7c3aed;
          color: #7c3aed;
          box-shadow: 0 1px 4px rgba(124, 58, 237, 0.15);
        }
      }

      .template-toggle-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.85rem;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .tpl-btn {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.85rem 1.15rem;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;

        .tpl-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          letter-spacing: 0.05em;

          &.as-is-badge { background: #e2e8f0; color: #334155; }
          &.to-be-badge { background: #dbeafe; color: #1d4ed8; }
        }

        .tpl-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #1e293b;
        }

        &:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }

        &.active {
          border-color: #0284c7;
          background: #f0f9ff;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.15);

          .tpl-title { color: #0284c7; }
        }
      }
    }

    /* Shape & Visual Style Selector - Collapsible */
    .style-selector-bar {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 1rem 1.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 1.15rem;
      animation: expandDown 0.2s ease-out;

      &.collapsible-panel {
        border-left: 3px solid #7c3aed;
      }
    }

    @keyframes expandDown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .style-group-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;

      .sg-label {
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: #64748b;
        min-width: 140px;
      }
    }

    .style-chips, .color-theme-chips, .line-style-chips {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
    }

    .style-chip-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s;

      .sc-icon { font-size: 0.9rem; }

      &:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
      }

      &.active {
        background: #eff6ff;
        border-color: #0284c7;
        color: #0284c7;
        box-shadow: 0 1px 4px rgba(2, 132, 199, 0.2);
      }
    }

    .ct-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.65rem;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;

      .color-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;

        &.sap-dot { background: #0070f3; }
        &.dark-dot { background: #0f172a; border: 1px solid #38bdf8; }
        &.emerald-dot { background: #059669; }
        &.purple-dot { background: #7c3aed; }
      }

      &.active {
        border-color: #0f172a;
        font-weight: 700;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }
    }

    .ls-chip {
      padding: 0.35rem 0.65rem;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;

      &.active {
        border-color: #7c3aed;
        background: #f5f3ff;
        color: #7c3aed;
      }
    }

    /* Prompt Box */
    .prompt-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;

      .ph-title-box {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .spark-icon {
        width: 32px;
        height: 32px;
        background: #f5f3ff;
        border: 1px solid #ddd6fe;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ph-main {
        display: block;
        font-size: 0.92rem;
        font-weight: 700;
        color: #0f172a;
      }

      .ph-sub {
        font-size: 0.78rem;
        color: #64748b;
      }

      .ph-chips {
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
      }

      .sample-prompt-chip {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.4rem 0.75rem;
        font-size: 0.76rem;
        font-weight: 700;
        color: #334155;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: #f5f3ff;
          border-color: #7c3aed;
          color: #7c3aed;
        }

        &.highlight-chip {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;

          &:hover {
            background: #dbeafe;
            border-color: #93c5fd;
          }
        }
      }
    }

    .prompt-quick-guide {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      margin-bottom: 0.75rem;
      font-size: 0.78rem;
      line-height: 1.5;
      color: #475569;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .pqg-badge-wrap {
        display: flex;
        align-items: center;
      }

      .pqg-badge {
        font-weight: 800;
        color: #7c3aed;
        letter-spacing: 0.04em;
        font-size: 0.72rem;
      }

      .pqg-text {
        color: #334155;

        strong {
          color: #0f172a;
          font-weight: 700;
        }

        code {
          background: #e2e8f0;
          color: #1e293b;
          padding: 0.12rem 0.35rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
      }
    }

    .prompt-input-wrapper {
      margin-bottom: 0.85rem;
    }

    .prompt-textarea {
      width: 100%;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      font-size: 0.88rem;
      color: #0f172a;
      font-family: inherit;
      resize: vertical;
      line-height: 1.55;
      background: #fafafa;
      box-sizing: border-box;

      &:focus {
        background: #ffffff;
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        outline: none;
      }
    }

    .prompt-action-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;

      .prompt-helper {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.76rem;
        color: #64748b;
      }
    }

    .prompt-feedback-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      color: #15803d;
      padding: 0.55rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-top: 0.65rem;
      animation: fadeIn 0.25s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Sub Tabs */
    .quick-editor-tabs {
      display: flex;
      gap: 0.35rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.35rem;
      margin-top: 0.85rem;
    }

    .q-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: transparent;
      border: none;
      padding: 0.4rem 0.75rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-radius: 6px;

      &:hover { background: #f1f5f9; color: #0f172a; }
      &.active { background: #f5f3ff; color: #7c3aed; }
    }

    .editor-subpanel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-top: 0.65rem;
    }

    .input-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.75rem;

      .ig-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        &.full-width { grid-column: 1 / -1; }

        label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }

        .form-input {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 0.45rem 0.65rem;
          font-size: 0.82rem;
          background: #ffffff;
        }
      }
    }

    .systems-editor-header, .tags-editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .systems-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.5rem;
    }

    .system-chip {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.35rem 0.55rem;
      border-radius: 6px;

      .sc-input {
        flex: 1;
        border: none;
        font-weight: 700;
        font-size: 0.8rem;
        outline: none;
      }

      .sc-sub-input {
        flex: 1;
        border: none;
        font-size: 0.72rem;
        color: #64748b;
        outline: none;
      }
    }

    .tags-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.35rem 0.65rem;
      border-radius: 9999px;

      .tag-input {
        border: none;
        font-size: 0.78rem;
        font-weight: 600;
        outline: none;
        min-width: 130px;
      }

      .tag-primary-check {
        font-size: 0.7rem;
        font-weight: 600;
        color: #0284c7;
        display: flex;
        align-items: center;
        gap: 0.2rem;
        cursor: pointer;
      }
    }

    .nc-delete-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.15rem;
      &:hover { background: #fee2e2; border-radius: 4px; }
    }

    /* FULL-WIDTH SLIDE CANVAS STYLES */
    .slide-canvas-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;

      &.full-view {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9998;
        background: #0f172a;
        justify-content: center;
        padding: 2.5rem;
        box-sizing: border-box;

        .presentation-slide {
          max-width: 96vw;
          max-height: 94vh;
        }
      }
    }

    .canvas-meta-bar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.45rem 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.78rem;

      .cmb-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #334155;

        .live-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .cmb-style-tag {
          font-weight: 600;
          color: #6366f1;
          background: #eef2ff;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
      }

      .res-badge {
        font-size: 0.7rem;
        font-weight: 700;
        background: #e2e8f0;
        color: #475569;
        padding: 0.15rem 0.55rem;
        border-radius: 4px;
      }
    }

    /* THE PRESENTATION SLIDE - Full Width 16:9 Experience */
    .presentation-slide {
      width: 100%;
      aspect-ratio: 16 / 9;
      min-height: 640px;
      background: #f4f7fb;
      border: 1px solid #d9e2ec;
      border-radius: 14px;
      box-shadow: 0 12px 36px rgba(15, 23, 42, 0.08);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2.5rem 3.5rem 2.25rem;
      overflow: hidden;
      user-select: none;
      box-sizing: border-box;
      transition: all 0.3s;

      &.to-be-mode {
        background: #f5f8fc;
      }

      /* COLOR THEMES */
      &.theme-cyber-dark {
        background: radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%);
        border-color: #334155;
        color: #f8fafc;

        .slide-main-title { color: #f8fafc; }
        .slide-subtitle { color: #94a3b8; }
        .category-tag-title { color: #38bdf8; }
        .customer-name-badge { color: #cbd5e1; }
        .slide-footer-note { color: #94a3b8; }
      }

      &.theme-emerald-clean {
        background: #f0fdf4;
        border-color: #bbf7d0;

        .category-tag-title { color: #047857; }
        .slide-main-title { color: #064e3b; }
      }

      &.theme-royal-purple {
        background: #faf5ff;
        border-color: #e9d5ff;

        .category-tag-title { color: #6b21a8; }
        .slide-main-title { color: #3b0764; }
      }

      /* SHAPE STYLES */
      &.shape-glass {
        background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);

        .shape-elem {
          backdrop-filter: blur(12px) !important;
          background: rgba(255, 255, 255, 0.7) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.8) !important;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08) !important;
        }

        .center-core-erp {
          background: linear-gradient(135deg, rgba(8, 51, 98, 0.9) 0%, rgba(13, 71, 161, 0.95) 100%) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 12px 36px rgba(8, 51, 98, 0.4) !important;
        }

        .tobe-integration-suite-card {
          background: linear-gradient(135deg, rgba(0, 102, 245, 0.95) 0%, rgba(0, 168, 255, 0.9) 100%) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.4) !important;
        }

        .tobe-right-card {
          background: linear-gradient(135deg, rgba(8, 51, 98, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%) !important;
        }
      }

      &.shape-hexagon {
        .shape-elem {
          border-radius: 4px !important;
          clip-path: polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px);
          border: 2px solid #3b82f6 !important;
        }

        .center-core-erp {
          clip-path: polygon(15px 0%, calc(100% - 15px) 0%, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0% calc(100% - 15px), 0% 15px);
          border: 2px solid #60a5fa !important;
        }

        .btp-dashed-frame {
          border-style: solid !important;
          border-width: 2px !important;
          clip-path: polygon(14px 0%, calc(100% - 14px) 0%, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0% calc(100% - 14px), 0% 14px);
        }
      }

      &.shape-capsule {
        .shape-elem {
          border-radius: 9999px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
        }

        .satellite-system {
          padding: 1.25rem 2.4rem !important;
        }

        .btp-dashed-frame {
          border-radius: 40px !important;
        }

        .tobe-left-card, .tobe-right-card {
          border-radius: 35px !important;
        }

        .tobe-integration-suite-card {
          border-radius: 35px !important;
        }
      }

      &.shape-blueprint {
        background: #0d1b2a;
        color: #e0e1dd;

        .blueprint-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(65, 90, 119, 0.25) 1px, transparent 1px),
            linear-gradient(90deg, rgba(65, 90, 119, 0.25) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }

        .slide-main-title { color: #ffffff; font-family: monospace; letter-spacing: 0.05em; }
        .slide-subtitle { color: #778da9; }
        .category-tag-title { color: #00b4d8; font-family: monospace; }
        .customer-name-badge { color: #00b4d8; font-family: monospace; }
        .slide-footer-note { color: #778da9; font-family: monospace; }

        .shape-elem {
          background: rgba(13, 27, 42, 0.9) !important;
          border: 1.5px solid #00b4d8 !important;
          border-radius: 0px !important;
          box-shadow: 0 0 15px rgba(0, 180, 216, 0.15) !important;
          color: #ffffff !important;

          .satellite-title, .tobe-title { color: #ffffff !important; font-family: monospace; }
          .satellite-subtitle, .tobe-subtitle { color: #778da9 !important; font-family: monospace; }
        }

        .center-core-erp, .tobe-integration-suite-card, .tobe-right-card {
          background: #1b263b !important;
          border: 2px solid #00b4d8 !important;
          border-radius: 0px !important;
        }

        .pill-tag {
          border-radius: 0px !important;
          border-color: #00b4d8 !important;
          background: rgba(0, 180, 216, 0.1) !important;
          color: #00b4d8 !important;
          font-family: monospace;
        }
      }
    }

    /* Header */
    .slide-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      position: relative;
      z-index: 10;

      .category-tag-title {
        color: #0b4e8c;
        font-size: 0.85rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 0.35rem;
        cursor: pointer;

        &:hover { text-decoration: underline; }
      }

      .slide-main-title {
        font-size: 2.35rem;
        font-weight: 800;
        color: #0a2540;
        margin: 0 0 0.25rem;
        line-height: 1.15;
        letter-spacing: -0.02em;
        cursor: pointer;

        &:hover { opacity: 0.85; }
      }

      .slide-subtitle {
        font-size: 1.05rem;
        color: #627d98;
        font-weight: 500;
        cursor: pointer;

        &:hover { opacity: 0.85; }
      }

      .customer-name-badge {
        font-size: 1.05rem;
        font-weight: 600;
        color: #486581;
        cursor: pointer;

        &:hover { color: #0284c7; }
      }
    }

    /* 1. AS-IS DIAGRAM FIELD & NODES */
    .as-is-field {
      position: relative;
      flex: 1;
      width: 100%;
      min-height: 380px;
      margin: 1rem 0;
    }

    .diagram-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2;
    }

    .solid-hub-line {
      stroke-width: 2px;
      transition: stroke 0.3s;

      &.animated-line {
        stroke-dasharray: 6 4;
        animation: dashFlow 1s linear infinite;
      }
    }

    .dashed-inter-line {
      stroke-width: 2px;
      stroke-dasharray: 6 5;
    }

    .solid-inter-line {
      stroke-width: 2.2px;
    }

    @keyframes dashFlow {
      from { stroke-dashoffset: 20; }
      to { stroke-dashoffset: 0; }
    }

    .node-card {
      position: absolute;
      transform: translate(-50%, -50%);
      cursor: grab;
      z-index: 5;
      transition: box-shadow 0.15s, transform 0.05s;

      &:active {
        cursor: grabbing;
        transform: translate(-50%, -50%) scale(1.02);
      }
    }

    /* Core ERP Dark Blue Hub Card (AS-IS) */
    .center-core-erp {
      background: #083362;
      color: #ffffff;
      border-radius: 12px;
      padding: 1.5rem 2.8rem;
      min-width: 230px;
      text-align: center;
      box-shadow: 0 14px 28px -4px rgba(8, 51, 98, 0.4), 0 8px 12px -6px rgba(8, 51, 98, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.15);

      .center-title {
        font-size: 1.45rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        line-height: 1.2;
      }

      .center-desc {
        font-size: 0.8rem;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.85);
        margin-top: 0.45rem;
      }
    }

    /* 3rd Party White Satellite Cards (AS-IS) */
    .satellite-system {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 1.25rem 2rem;
      min-width: 190px;
      max-width: 260px;
      text-align: center;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);

      .satellite-title {
        display: block;
        font-size: 0.92rem;
        font-weight: 800;
        color: #1e293b;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        line-height: 1.25;
      }

      .satellite-subtitle {
        display: block;
        font-size: 0.74rem;
        color: #64748b;
        font-weight: 500;
        margin-top: 0.25rem;
      }

      &:hover {
        border-color: #94a3b8;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.1);
      }
    }

    /* 2. TO-BE HORIZONTAL BTP ARCHITECTURE FLOW */
    .to-be-field {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 1.5rem 0;
    }

    .tobe-horizontal-container {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
    }

    .tobe-left-card {
      flex: 1;
      max-width: 310px;
      min-height: 180px;
      background: #edf2f7;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: 1.8rem 1.6rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);

      .tobe-title {
        display: block;
        font-size: 1.15rem;
        font-weight: 800;
        color: #1e293b;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }

      .tobe-subtitle {
        display: block;
        font-size: 0.85rem;
        color: #64748b;
        margin-top: 0.5rem;
        font-weight: 500;
      }

      .tobe-subnodes {
        margin-top: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.78rem;
        color: #475569;
        font-weight: 600;
        text-align: left;
        width: 100%;
        padding-left: 0.75rem;

        .subnode-bullet { color: #0284c7; }
      }
    }

    .tobe-arrow-connector {
      flex: 0 0 110px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tobe-btp-wrapper {
      flex: 1.4;
      max-width: 440px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btp-dashed-frame {
      width: 100%;
      border: 2px dashed #0070f3;
      border-radius: 14px;
      padding: 1.75rem 1.5rem 1.5rem;
      position: relative;
      background: rgba(0, 112, 243, 0.02);
      display: flex;
      align-items: center;
      justify-content: center;

      .btp-badge-label {
        position: absolute;
        top: -12px;
        left: 24px;
        background: #f5f8fc;
        padding: 0 0.5rem;
        color: #005bb5;
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.08em;
      }
    }

    .tobe-integration-suite-card {
      width: 100%;
      background: #0066f5;
      color: #ffffff;
      border-radius: 12px;
      padding: 2.2rem 1.8rem;
      text-align: center;
      box-shadow: 0 12px 28px -4px rgba(0, 102, 245, 0.4), 0 6px 12px -4px rgba(0, 102, 245, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.25);

      .suite-title {
        font-size: 1.45rem;
        font-weight: 800;
        line-height: 1.25;
        letter-spacing: 0.02em;
      }

      .suite-desc {
        font-size: 0.85rem;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.9);
        margin-top: 0.6rem;
      }
    }

    .tobe-right-card {
      flex: 1;
      max-width: 320px;
      min-height: 180px;
      background: #083362;
      border-radius: 12px;
      padding: 1.8rem 1.6rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #ffffff;
      box-shadow: 0 12px 28px -4px rgba(8, 51, 98, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.15);

      .core-title {
        font-size: 1.4rem;
        font-weight: 800;
        letter-spacing: 0.05em;
      }

      .core-desc {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.85);
        margin-top: 0.4rem;
      }
    }

    /* Slide Bottom Row & Tags */
    .slide-bottom-row {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      position: relative;
      z-index: 10;
    }

    .pill-tags-list {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
    }

    .pill-tag {
      background: #e8eff6;
      border: 1px solid #d1dce8;
      border-radius: 9999px;
      padding: 0.5rem 1.4rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: #334e68;
      letter-spacing: 0.01em;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

      &.primary-pill {
        background: #0070f3;
        color: #ffffff;
        border-color: #0070f3;
        box-shadow: 0 3px 10px rgba(0, 112, 243, 0.3);
      }
    }

    .slide-footer-note {
      font-size: 0.85rem;
      color: #627d98;
      font-weight: 500;
      cursor: pointer;

      &:hover { color: #102a43; }
    }

    @media (max-width: 1024px) {
      .presentation-slide {
        padding: 1.75rem;
        min-height: 520px;
      }
      .slide-main-title { font-size: 1.75rem; }
      .tobe-horizontal-container { flex-direction: column; }
      .tobe-arrow-connector { transform: rotate(90deg); margin: 0.5rem 0; }
    }
  `]
})
export class ArchitectureGeneratorComponent implements AfterViewInit {
  customerService = inject(CustomerService);

  @ViewChild('slideCanvas') slideCanvasRef!: ElementRef<HTMLDivElement>;
  @ViewChild('diagramField') diagramFieldRef!: ElementRef<HTMLDivElement>;

  selectedTemplateType = signal<ArchitectureTemplateType>('as-is');
  isThemePanelOpen = signal<boolean>(false);
  
  // Prompt input initialized with the canonical prompt of the active template
  promptText = this.getCanonicalPrompt('as-is');
  
  isGenerating = signal(false);
  isExporting = signal(false);
  isPresentationMode = signal(false);
  parsedFeedbackMessage = signal<string | null>(null);
  activeEditorTab: 'visual' | 'texts' | 'systems' | 'tags' = 'visual';

  // Dragging state for AS-IS
  draggingNodeId: string | null = null;
  centerCoords = { x: 50, y: 50 };

  // Current Slide Data
  slideData: ArchitectureSlideData = this.getDefaultAsIsData();

  constructor() {
    // Keep customer name synced
    effect(() => {
      const activeCust = this.customerService.activeCustomer();
      if (activeCust && (this.slideData.customerName === 'Müşteri Adı' || !this.slideData.customerName)) {
        this.slideData.customerName = activeCust.name;
      }
    });
  }

  ngAfterViewInit(): void {
    this.loadSavedForCurrentCustomer();
  }

  @HostListener('window:keydown.escape')
  handleEscape(): void {
    if (this.isPresentationMode()) {
      this.isPresentationMode.set(false);
    }
  }

  @HostListener('window:mousemove', ['$event'])
  handleMouseMove(event: MouseEvent): void {
    if (!this.draggingNodeId || !this.diagramFieldRef || this.selectedTemplateType() !== 'as-is') return;
    const rect = this.diagramFieldRef.nativeElement.getBoundingClientRect();
    const xPct = Math.max(8, Math.min(92, ((event.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(10, Math.min(90, ((event.clientY - rect.top) / rect.height) * 100));

    if (this.draggingNodeId === 'center') {
      this.centerCoords = { x: Math.round(xPct), y: Math.round(yPct) };
    } else {
      const node = this.slideData.nodes.find(n => n.id === this.draggingNodeId);
      if (node) {
        node.x = Math.round(xPct);
        node.y = Math.round(yPct);
      }
    }
  }

  @HostListener('window:mouseup')
  handleMouseUp(): void {
    this.draggingNodeId = null;
  }

  toggleThemePanel(): void {
    this.isThemePanelOpen.update(v => !v);
  }

  getCenterCoords(): { x: number; y: number } {
    return this.centerCoords;
  }

  getNodeCoords(id: string): { x: number; y: number } | null {
    if (id === 'center') return this.centerCoords;
    const node = this.slideData.nodes.find(n => n.id === id);
    return node ? { x: node.x, y: node.y } : null;
  }

  startDrag(nodeId: string, event: MouseEvent): void {
    event.preventDefault();
    this.draggingNodeId = nodeId;
  }

  /**
   * CANONICAL PROMPTS
   * Returns the exact text describing the current visual template
   */
  getCanonicalPrompt(type: ArchitectureTemplateType): string {
    if (type === 'as-is') {
      return 'Merkezde CORE ERP (Tüm entegrasyonların merkezi) bulunsun. Çevresinde 6 adet 3RD PARTY SYSTEMS yer alsın. Sol üst ile üst merkez arasında ve sağdaki sistemler arasında kesikli doğrudan bağlantılar olsun. Alt etiketler: Point-to-Point Entegrasyonlar, Doğrudan bağlantılar, Yüksek sistem bağımlılığı, Dağınık entegrasyon yapısı. Alt not: ERP, fiili olarak entegrasyon hub\'ı rolünü üstlenmiştir.';
    } else {
      return 'Hedef TO-BE Mimari: Sol tarafta 3RD PARTY SYSTEMS (Dış ekosistem: CRM, E-Ticaret & B2B Portalları, WMS & Lojistik API), ortada SAP BTP çatısı altında SAP Integration Suite (Tek yönetişim noktası), sağ tarafta CORE ERP (Clean Core & Çekirdek İş Süreçleri) yer alsın. Çift yönlü veri akış hatları bulunsun. Alt etiketler: Ölçeklenebilir, Yönetilebilir (vurgulu), Event-Driven Mimari, Merkezi Güvenlik & İzleme. Alt not: Entegrasyon sorumluluğu doğru mimari katmana taşınır.';
    }
  }

  restoreCanonicalPrompt(): void {
    this.promptText = this.getCanonicalPrompt(this.selectedTemplateType());
    this.generateFromPrompt();
  }

  switchTemplate(type: ArchitectureTemplateType): void {
    this.selectedTemplateType.set(type);
    const prevShape = this.slideData.shapeStyle;
    const prevTheme = this.slideData.colorTheme;
    const prevLine = this.slideData.lineStyle;

    if (type === 'as-is') {
      this.slideData = this.getDefaultAsIsData();
    } else {
      this.slideData = this.getDefaultToBeData();
    }
    this.slideData.shapeStyle = prevShape;
    this.slideData.colorTheme = prevTheme;
    this.slideData.lineStyle = prevLine;

    const activeCust = this.customerService.activeCustomer();
    if (activeCust) {
      this.slideData.customerName = activeCust.name;
    }

    // Set the prompt text directly to the canonical prompt for this template
    this.promptText = this.getCanonicalPrompt(type);
    this.parsedFeedbackMessage.set(null);
  }

  setShapeStyle(style: CardShapeStyle): void {
    this.slideData.shapeStyle = style;
  }

  setColorTheme(theme: ColorTheme): void {
    this.slideData.colorTheme = theme;
  }

  setLineStyle(style: LineStyle): void {
    this.slideData.lineStyle = style;
  }

  getShapeStyleLabel(): string {
    switch (this.slideData.shapeStyle) {
      case 'glass': return 'Buzlu Cam';
      case 'hexagon': return 'Altıgen Tech';
      case 'capsule': return '3D Kapsül';
      case 'blueprint': return 'Teknik Blueprint';
      default: return 'Klasik Kurumsal';
    }
  }

  getColorThemeLabel(): string {
    switch (this.slideData.colorTheme) {
      case 'cyber-dark': return 'Dark Gece';
      case 'emerald-clean': return 'Clean Emerald';
      case 'royal-purple': return 'Royal Purple';
      default: return 'SAP Mavi';
    }
  }

  getLineColor(): string {
    if (this.slideData.colorTheme === 'cyber-dark') return '#38bdf8';
    if (this.slideData.colorTheme === 'emerald-clean') return '#059669';
    if (this.slideData.colorTheme === 'royal-purple') return '#7c3aed';
    if (this.slideData.shapeStyle === 'blueprint') return '#00b4d8';
    return '#8ba1b7';
  }

  getArrowColor(): string {
    if (this.slideData.colorTheme === 'cyber-dark') return '#38bdf8';
    if (this.slideData.colorTheme === 'emerald-clean') return '#059669';
    if (this.slideData.colorTheme === 'royal-purple') return '#7c3aed';
    if (this.slideData.shapeStyle === 'blueprint') return '#00b4d8';
    return '#0070f3';
  }

  getDefaultAsIsData(): ArchitectureSlideData {
    return {
      mode: 'as-is',
      shapeStyle: 'corporate',
      colorTheme: 'sap-blue',
      lineStyle: 'straight',
      categoryBadge: 'ALTERNATİF 1 · KLASİK KURUMSAL MİMARİ',
      mainTitle: 'AS-IS Mimari',
      subtitle: 'Mevcut sistem ve entegrasyon yapısı',
      customerName: this.customerService.activeCustomer()?.name || 'Müşteri Adı',
      centerTitle: 'CORE ERP',
      centerSubtitle: 'Tüm entegrasyonların merkezi',
      nodes: [
        { id: 'node-tl', name: '3RD PARTY SYSTEMS', isCenter: false, x: 18, y: 28 },
        { id: 'node-tc', name: '3RD PARTY SYSTEMS', isCenter: false, x: 50, y: 16 },
        { id: 'node-tr', name: '3RD PARTY SYSTEMS', isCenter: false, x: 82, y: 28 },
        { id: 'node-bl', name: '3RD PARTY SYSTEMS', isCenter: false, x: 18, y: 72 },
        { id: 'node-bc', name: '3RD PARTY SYSTEMS', isCenter: false, x: 50, y: 84 },
        { id: 'node-br', name: '3RD PARTY SYSTEMS', isCenter: false, x: 82, y: 72 }
      ],
      interConnections: [
        { id: 'conn-1', fromId: 'node-tl', toId: 'node-tc' },
        { id: 'conn-2', fromId: 'node-tr', toId: 'node-br', isBidirectional: true },
        { id: 'conn-3', fromId: 'node-bl', toId: 'node-bc' }
      ],
      pillTags: [
        { text: 'Point-to-Point Entegrasyonlar' },
        { text: 'Doğrudan bağlantılar' },
        { text: 'Yüksek sistem bağımlılığı' },
        { text: 'Dağınık entegrasyon yapısı' }
      ],
      footerNote: 'ERP, fiili olarak entegrasyon hub\'ı rolünü üstlenmiştir.'
    };
  }

  getDefaultToBeData(): ArchitectureSlideData {
    return {
      mode: 'to-be',
      shapeStyle: 'corporate',
      colorTheme: 'sap-blue',
      lineStyle: 'straight',
      categoryBadge: 'ALTERNATİF 2 · YATAY HEDEF AKIŞ',
      mainTitle: 'TO-BE Mimari',
      subtitle: 'Merkezi entegrasyon katmanı ile hedef mimari',
      customerName: this.customerService.activeCustomer()?.name || 'Müşteri Adı',
      centerTitle: 'SAP Integration Suite',
      centerSubtitle: 'Tek yönetişim noktası',
      rightNodeTitle: 'CORE ERP',
      rightNodeSubtitle: 'Clean Core & Çekirdek İş Süreçleri',
      nodes: [
        { id: 'n1', name: '3RD PARTY SYSTEMS', subtitle: 'Dış ekosistem', isCenter: false, x: 20, y: 50 },
        { id: 'n2', name: 'CRM (Salesforce / HubSpot)', isCenter: false, x: 20, y: 50 },
        { id: 'n3', name: 'E-Ticaret & B2B Portalları', isCenter: false, x: 20, y: 50 },
        { id: 'n4', name: 'WMS & Lojistik API', isCenter: false, x: 20, y: 50 }
      ],
      interConnections: [],
      pillTags: [
        { text: 'Ölçeklenebilir' },
        { text: 'Yönetilebilir', primary: true },
        { text: 'Event-Driven Mimari' },
        { text: 'Merkezi Güvenlik & İzleme' }
      ],
      footerNote: 'Entegrasyon sorumluluğu doğru mimari katmana taşınır.'
    };
  }

  loadSamplePreset(type: 'as-is-retail' | 'as-is-industry' | 'to-be-retail' | 'to-be-industry' | 'to-be-fintech'): void {
    if (type === 'as-is-retail') {
      this.promptText = 'Merkezde SAP ECC 6.0 Core ERP olsun. Üstte Salesforce CRM, sağda B2C E-Ticaret Platformu, solda Manhattan WMS Depo, altta Banka Entegrasyonları yer alsın. Salesforce CRM ile E-Ticaret arasında doğrudan veri akışı olsun. Alt etiketlerde "Point-to-Point Entegrasyonlar", "Yüksek Sistem Bağımlılığı", "Gecikmeli Senkronizasyon" yer alsın. Alt not: ERP, fiili olarak entegrasyon hub\'ı rolünü üstlenmiştir.';
    } else if (type === 'as-is-industry') {
      this.promptText = 'Alternatif 1 Sanayi AS-IS Mimarisi. Merkezde CORE ERP (SAP ECC) bulunsun. Üstte SIEMENS MES, sağda SCADA IOT, solda PTC PLM, altta ARIBA Satınalma yer alsın. MES ile SCADA arasında doğrudan bağlantı olsun. Alt etiketler: Yüksek Donanım Bağımlılığı, Noktadan Noktaya Hatlar, İzleme Güçlüğü. Alt not: Noktadan noktaya bağlantılar operasyonel riski artırmaktadır.';
    } else if (type === 'to-be-retail') {
      this.promptText = 'Hedef TO-BE Mimari: Sol tarafta 3RD PARTY SYSTEMS (Dış ekosistem: Salesforce CRM, Shopify E-Ticaret, Trendyol Pazaryeri, Manhattan WMS). Ortada SAP BTP çatısı altında SAP Integration Suite (Tek Yönetişim ve Çoklu Kanal API Hub). Sağ tarafta SAP S/4HANA Cloud (Clean Core ERP). Alt etiketler: Ölçeklenebilir, Yönetilebilir (vurgulu), API-First Mimari, Sıfır Bakım Eforu. Alt not: Entegrasyon sorumluluğu doğru mimari katmana taşınır.';
    } else if (type === 'to-be-industry') {
      this.promptText = 'Hedef TO-BE Mimari: Sol tarafta Endüstriyel Ekosistem (Siemens MES Üretim, SCADA IoT Sensörleri, PTC PLM Mühendislik, Ariba Tedarik). Ortada SAP BTP çatısı altında SAP Integration Suite (Event Mesh & Gerçek Zamanlı Mesajlaşma). Sağ tarafta SAP S/4HANA (Clean Core & Akıllı Fabrika). Alt etiketler: Gerçek Zamanlı Veri, Yönetilebilir (vurgulu), Sıfır Duruş Süresi, Yüksek Dayanıklılık. Alt not: Tüm entegrasyonlar merkezi BTP üzerinden yönetilerek çekirdek sistem temiz tutulur.';
    } else if (type === 'to-be-fintech') {
      this.promptText = 'Hedef TO-BE Mimari: Sol tarafta Finans Ekosistemi (Açık Bankacılık API, Ödeme Ağ Geçitleri, e-Fatura/e-Defter, Masraf Yönetimi). Ortada SAP BTP çatısı altında SAP Integration Suite (Merkezi Güvenlik, OAuth2 & API Gateway). Sağ tarafta SAP S/4HANA Finance (Clean Core Finansal Süreçler). Alt etiketler: Banka Düzeyinde Güvenlik, Yönetilebilir (vurgulu), Tam Denetim İzi, Uçtan Uca Şifreleme. Alt not: Finansal entegrasyonlar regülasyonlara uygun şekilde BTP üzerinden izlenir.';
    }
    this.generateFromPrompt();
  }

  normalizeSystemName(raw: string): string {
    let clean = raw.trim()
      .replace(/^(ve\s+|bir\s+|tane\s+|adet\s+|\d+\s*adet\s+|\d+\s*tane\s+)/i, '')
      .replace(/(\s+olsun|\s+bulunsun|\s+yer alsın)$/i, '')
      .trim();

    const lower = clean.toLowerCase();
    if (lower.includes('tcaret') || lower.includes('ticaret') || lower.includes('e-comm')) {
      return 'E-TİCARET';
    }
    if (lower.includes('saleforce') || lower.includes('salesforce') || lower.includes('saleforces')) {
      return 'SALESFORCE CRM';
    }
    if (lower.includes('sieme') || lower.includes('siemens') || lower.includes('simens')) {
      return 'SIEMENS';
    }
    if (lower.includes('ariba')) {
      return 'SAP ARIBA';
    }
    // Sadece tam kelime olarak 'ik' veya 'i.k' veya 'workday' ise eşleşsin, 'kesikli' içinde geçince değil!
    if (lower.includes('workday') || /\b(ik|ı̇k|hr)\b/i.test(lower)) {
      return 'İK WORKDAY';
    }
    if (lower.includes('wms') || lower.includes('depo')) {
      return 'WMS DEPO';
    }
    if (lower.includes('banka') || lower.includes('ödem')) {
      return 'BANKA SİSTEMLERİ';
    }
    return clean.toUpperCase();
  }

  findMatchingNode(query: string, nodes: ArchitectureNode[]): ArchitectureNode | null {
    if (!query) return null;
    const q = query.toLowerCase().trim();

    let found = nodes.find(n => n.name.toLowerCase().includes(q) || q.includes(n.name.toLowerCase()));
    if (found) return found;

    const norm = this.normalizeSystemName(query).toLowerCase();
    found = nodes.find(n => n.name.toLowerCase().includes(norm) || norm.includes(n.name.toLowerCase()));
    if (found) return found;

    const sub = q.substring(0, Math.min(q.length, 5));
    if (sub.length >= 4) {
      found = nodes.find(n => n.name.toLowerCase().includes(sub));
      if (found) return found;
    }

    return null;
  }

  generateFromPrompt(): void {
    const text = this.promptText.trim();
    if (!text) return;

    this.isGenerating.set(true);

    setTimeout(() => {
      try {
        const lower = text.toLowerCase();
        const isToBe = lower.includes('to-be') || lower.includes('hedef') || lower.includes('integration suite') || lower.includes('btp');
        
        // 1. Template selection
        if (isToBe) {
          this.selectedTemplateType.set('to-be');
          this.slideData = this.getDefaultToBeData();
        } else {
          this.selectedTemplateType.set('as-is');
          this.slideData = this.getDefaultAsIsData();
        }

        // 2. Shape Detection from prompt
        if (lower.includes('cam') || lower.includes('glass') || lower.includes('glassmorphism')) {
          this.slideData.shapeStyle = 'glass';
        } else if (lower.includes('altıgen') || lower.includes('hexagon') || lower.includes('tech')) {
          this.slideData.shapeStyle = 'hexagon';
        } else if (lower.includes('kapsül') || lower.includes('oval') || lower.includes('pill')) {
          this.slideData.shapeStyle = 'capsule';
        } else if (lower.includes('blueprint') || lower.includes('teknik çizim')) {
          this.slideData.shapeStyle = 'blueprint';
        }

        // 3. Color Theme Detection from prompt
        if (lower.includes('dark') || lower.includes('koyu') || lower.includes('gece') || lower.includes('siyah')) {
          this.slideData.colorTheme = 'cyber-dark';
        } else if (lower.includes('yeşil') || lower.includes('emerald') || lower.includes('zümrüt')) {
          this.slideData.colorTheme = 'emerald-clean';
        } else if (lower.includes('mor') || lower.includes('purple') || lower.includes('indigo')) {
          this.slideData.colorTheme = 'royal-purple';
        }

        // 4. Customer Name detection
        const custMatch = text.match(/müşteri(?:miz)?[:\s]+([^\.\,\n]+)/i) || 
                          text.match(/([A-ZÇĞİÖŞÜa-zçğıöşü0-9\s]+)\s+için/i);
        if (custMatch && custMatch[1].trim().length > 2 && custMatch[1].trim().length < 35) {
          const raw = custMatch[1].trim();
          if (!raw.toLowerCase().includes('alternatif') && !raw.toLowerCase().includes('mimari') && !raw.toLowerCase().includes('merkez')) {
            this.slideData.customerName = raw;
          }
        }

        // 5. TO-BE SPECIFIC EXTRACTIONS (Left Pillar, Middle BTP, Right Core ERP)
        if (isToBe) {
          // A) Sol Pillar (Dış Ekosistem / 3rd Party Sistemleri)
          const leftMatch = text.match(/(?:sol\s*(?:tarafta|kolonda|sütunda|da)?|dış\s*(?:sistemler|ekosistem))[:\s]+([^.\n;]+?)(?=(?:ortada|merkezde|sap\s+btp|btp|sağ|alt\s+etiket|etiket|alt\s+not|$))/i);
          if (leftMatch && leftMatch[1].trim()) {
            const rawLeft = leftMatch[1].trim();
            // Parantez içi var mı? Örn: "3RD PARTY SYSTEMS (Dış ekosistem: Salesforce, Shopify, WMS)"
            const parenMatch = rawLeft.match(/([^(]+)\s*\(([^)]+)\)/);
            if (parenMatch) {
              const header = parenMatch[1].replace(/(?:yer alsın|bulunsun|olsun)/gi, '').trim().toUpperCase();
              let subContent = parenMatch[2].trim();
              let subtitle = 'Dış ekosistem';
              if (subContent.toLowerCase().includes('dış ekosistem:')) {
                const parts = subContent.split(/dış ekosistem:\s*/i);
                subContent = parts[1] || '';
              } else if (subContent.toLowerCase().startsWith('dış ekosistem')) {
                subContent = subContent.replace(/^dış ekosistem\s*[,:]?\s*/i, '');
              }
              
              const subItems = subContent
                .split(/[,;]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);

              this.slideData.nodes = [
                { id: 'n1', name: header || '3RD PARTY SYSTEMS', subtitle: subtitle, isCenter: false, x: 20, y: 50 },
                ...subItems.map((name, i) => ({
                  id: `sub-${i + 1}`,
                  name: name,
                  isCenter: false,
                  x: 20,
                  y: 50
                }))
              ];
            } else {
              // Virgülle ayrılmış sistem listesi veya tek sistem
              const cleanLeft = rawLeft.replace(/(?:yer alsın|bulunsun|olsun)/gi, '').trim();
              const items = cleanLeft.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
              if (items.length > 1) {
                this.slideData.nodes = [
                  { id: 'n1', name: '3RD PARTY SYSTEMS', subtitle: 'Dış ekosistem', isCenter: false, x: 20, y: 50 },
                  ...items.map((name, i) => ({
                    id: `sub-${i + 1}`,
                    name: name,
                    isCenter: false,
                    x: 20,
                    y: 50
                  }))
                ];
              } else if (items.length === 1) {
                this.slideData.nodes = [
                  { id: 'n1', name: items[0].toUpperCase(), subtitle: 'Dış ekosistem', isCenter: false, x: 20, y: 50 }
                ];
              }
            }
          }

          // B) Center BTP Pillar (SAP Integration Suite / Event Mesh)
          const btpMatch = text.match(/(?:ortada|merkezde|orta\s*kolonda|orta\s*sütunda|btp(?:'de|'te|\s+çatısı\s+altında|\s+altında)?\s+)[:\s]*([^.\n;]+?)(?=(?:sağ|sağda|sağ\s*tarafta|alt\s+etiket|etiket|alt\s+not|$))/i);
          if (btpMatch && btpMatch[1].trim()) {
            let btpRaw = btpMatch[1].trim().replace(/(?:yer alsın|bulunsun|olsun)/gi, '').trim();
            const btpParen = btpRaw.match(/([^(]+)\s*\(([^)]+)\)/);
            if (btpParen) {
              this.slideData.centerTitle = btpParen[1].trim();
              this.slideData.centerSubtitle = btpParen[2].trim();
            } else {
              this.slideData.centerTitle = btpRaw;
              this.slideData.centerSubtitle = 'Tek yönetişim noktası';
            }
          }

          // C) Right Core ERP Pillar
          const rightMatch = text.match(/(?:sağ\s*(?:tarafta|kolonda|sütunda|da)?|çekirdek\s*sistem)[:\s]+([^.\n;]+?)(?=(?:alt\s+etiket|etiket|alt\s+not|$))/i);
          if (rightMatch && rightMatch[1].trim()) {
            let rightRaw = rightMatch[1].trim().replace(/(?:yer alsın|bulunsun|olsun)/gi, '').trim();
            const rightParen = rightRaw.match(/([^(]+)\s*\(([^)]+)\)/);
            if (rightParen) {
              this.slideData.rightNodeTitle = rightParen[1].trim().toUpperCase();
              this.slideData.rightNodeSubtitle = rightParen[2].trim();
            } else {
              this.slideData.rightNodeTitle = rightRaw.toUpperCase();
              this.slideData.rightNodeSubtitle = 'Clean Core & Çekirdek İş Süreçleri';
            }
          }
        } else {
          // ==========================================
          // AS-IS ARCHITECTURE PARSER (CORE ERP HUB)
          // ==========================================

          // 1. AS-IS MERKEZ SİSTEMİ TESPİTİ
          // Sadece cümlenin başında veya bağımsız 'Merkezde ...' ifadesi ile eşleşir.
          // Asla 'üst merkez arasında' veya 'bağlantılar olsun' gibi bağlantı cümlelerini merkez sanmaz!
          const centerSentenceMatch = text.match(/(?:^|[.!?\n])\s*(?:merkez(?:de|inde)?|ana\s*sistem)[:\s]+([^.\n;]+?)(?=(?:[.!?\n]|çevresinde|etrafında|alt\s+etiket|etiket|sol|sağ|üst|alt|$))/i);
          if (centerSentenceMatch && centerSentenceMatch[1].trim()) {
            let centerRaw = centerSentenceMatch[1].trim()
              .replace(/(?:\s+bulunsun|\s+olsun|\s+yer alsın)$/i, '')
              .trim();

            const parenMatch = centerRaw.match(/([^(]+)\s*\(([^)]+)\)/);
            if (parenMatch) {
              this.slideData.centerTitle = parenMatch[1].trim().toUpperCase();
              this.slideData.centerSubtitle = parenMatch[2].trim();
            } else {
              this.slideData.centerTitle = centerRaw.toUpperCase();
              this.slideData.centerSubtitle = 'Tüm entegrasyonların merkezi';
            }
          }

          // 2. AS-IS ÇEVREDEKİ SİSTEMLERİN TESPİTİ
          // A) Sayı Belirtilmiş mi? (Örn: "Çevresinde 7 adet 3RD PARTY SYSTEMS yer alsın", "8 adet", vb.)
          const countMatch = text.match(/(?:çevresinde|etrafında)[:\s]+(\d+)\s*(?:adet|tane)\s+([^,.\n;]+?)(?:\s+yer alsın|\s+bulunsun|\s+olsun|[.,;\n]|$)/i);
          
          if (countMatch) {
            const count = parseInt(countMatch[1], 10);
            let baseName = countMatch[2]
              .replace(/(?:yer alsın|bulunsun|olsun)/gi, '')
              .trim()
              .toUpperCase();
            if (!baseName || baseName.length < 2) {
              baseName = '3RD PARTY SYSTEMS';
            }
            const names = Array.from({ length: Math.min(12, Math.max(2, count)) }, () => baseName);
            this.slideData.nodes = this.calculateRadialNodes(names);
          } else {
            // B) Pozisyonel Tanımlamalar (Üstte X, Sağda Y, Solda Z, Altta W...)
            // 'üst merkez arasında' gibi bağlantı cümlelerini filtreleyelim!
            const positionalNodes: ArchitectureNode[] = [];

            const addPosNode = (regex: RegExp, x: number, y: number, id: string) => {
              const m = text.match(regex);
              if (m && m[1].trim()) {
                const val = m[1].trim();
                const lval = val.toLowerCase();
                // Eğer bağlantı kelimeleri içeriyorsa bu bir sistem değildir!
                if (!lval.includes('arasında') && !lval.includes('bağlantı') && !lval.includes('çizgi') && !lval.includes('doğrudan') && !lval.includes('kesikli') && !lval.includes('merkez')) {
                  positionalNodes.push({ id, name: this.normalizeSystemName(val), isCenter: false, x, y });
                }
              }
            };

            addPosNode(/(?:^|[.!?,\n])\s*(?:üstte|yukarıda|tepede|kuzeyde)\s+([^,.\n]+?)(?:\s+olsun|\s+bulunsun|\.|\,|$)/i, 50, 18, 'node-top');
            addPosNode(/(?:^|[.!?,\n])\s*(?:sağında|sağda|sağ\s*tarafta|doğusunda)\s+([^,.\n]+?)(?:\s+olsun|\s+bulunsun|\.|\,|$)/i, 82, 50, 'node-right');
            addPosNode(/(?:^|[.!?,\n])\s*(?:solunda|solda|sol\s*tarafta|batısında)\s+([^,.\n]+?)(?:\s+olsun|\s+bulunsun|\.|\,|$)/i, 18, 50, 'node-left');
            addPosNode(/(?:^|[.!?,\n])\s*(?:altta|altında|aşağıda|güneyinde)\s+([^,.\n]+?)(?:\s+olsun|\s+bulunsun|\.|\,|$)/i, 50, 82, 'node-bottom');
            addPosNode(/(?:^|[.!?,\n])\s*(?:sol\s*üst(?:te)?|sol\s*yukarı(?:da)?)\s+([^,.\n]+?)(?:\s+olsun|\s+bulunsun|\.|\,|$)/i, 18, 26, 'node-tl');
            addPosNode(/(?:^|[.!?,\n])\s*(?:sağ\s*üst(?:te)?|sağ\s*yukarı(?:da)?)\s+([^,.\n]+?)(?:\s+olsun|\s+bulunsun|\.|\,|$)/i, 82, 26, 'node-tr');
            addPosNode(/(?:^|[.!?,\n])\s*(?:sol\s*alt(?:ta)?|sol\s*aşağı(?:da)?)\s+([^,.\n]+?)(?:\s+olsun|\s+bulunsun|\.|\,|$)/i, 18, 74, 'node-bl');
            addPosNode(/(?:^|[.!?,\n])\s*(?:sağ\s*alt(?:ta)?|sağ\s*aşağı(?:da)?)\s+([^,.\n]+?)(?:\s+olsun|\s+bulunsun|\.|\,|$)/i, 82, 74, 'node-br');

            if (positionalNodes.length > 0) {
              this.slideData.nodes = positionalNodes;
            } else {
              // C) Çevresinde virgülle ayrılmış sistem listesi var mı?
              const systemsListMatch = text.match(/(?:çevresinde|etrafında|sistemler|ekosistem)[:\s]+([^.\n;]+?)(?=(?:alt\s*etiket|etiket|alt\s*not|[.!?\n]|$))/i);
              if (systemsListMatch) {
                const rawList = systemsListMatch[1].replace(/(?:yer alsın|bulunsun|olsun)/gi, '').trim();
                const items = rawList
                  .split(/[,;]/)
                  .map(s => this.normalizeSystemName(s))
                  .filter(s => s.length > 1 && !s.includes('ADET') && !s.includes('TANE'));

                if (items.length > 0) {
                  this.slideData.nodes = this.calculateRadialNodes(items);
                }
              }
            }
          }

          // 3. AS-IS SİSTEMLER ARASI BAĞLANTILAR (Inter-connections)
          this.slideData.interConnections = [];

          // A) Özel İsimlendirilmiş Bağlantı (Örn: "Salesforce CRM ile Siemens arasında kesin çizgi olsun")
          const connMatch = text.match(/([^,.\n]+?)\s+(?:ile|ve)\s+([^,.\n]+?)\s+arasında\s+(?:bir\s+)?(?:bağlantı|hat|çizgi|entegrasyon|veri akışı|köprü)(?:\s+olsun)?(?:\s+ve\s+([^,.\n]+?)\s+olsun)?/i);

          if (connMatch) {
            const rawFrom = connMatch[1].trim();
            const rawTo = connMatch[2].trim();
            const styleClause = (connMatch[3] || '').toLowerCase();

            const fromNode = this.findMatchingNode(rawFrom, this.slideData.nodes);
            const toNode = this.findMatchingNode(rawTo, this.slideData.nodes);

            if (fromNode && toNode) {
              const isSolid = styleClause.includes('düz') || styleClause.includes('doğrudan') || (styleClause.includes('kesin') && !styleClause.includes('kesik'));
              this.slideData.interConnections.push({
                id: 'conn-user-1',
                fromId: fromNode.id,
                toId: toNode.id,
                isBidirectional: true,
                isSolid: isSolid
              });
            }
          }

          // B) Genel "kesikli doğrudan bağlantılar" veya "sağdaki sistemler arasında" ifadesi
          // Kullanıcı spesifik iki sistem ismi belirtmediyse ancak kesikli bağlantı istediyse:
          if (this.slideData.interConnections.length === 0 && (lower.includes('kesikli') || lower.includes('doğrudan bağlantılar') || lower.includes('bağlantılar olsun'))) {
            if (this.slideData.nodes.length >= 6) {
              this.slideData.interConnections = [
                { id: 'conn-1', fromId: this.slideData.nodes[0].id, toId: this.slideData.nodes[1].id },
                { id: 'conn-2', fromId: this.slideData.nodes[2].id, toId: this.slideData.nodes[this.slideData.nodes.length - 1].id, isBidirectional: true },
                { id: 'conn-3', fromId: this.slideData.nodes[3].id, toId: this.slideData.nodes[4].id }
              ];
            } else if (this.slideData.nodes.length >= 3) {
              this.slideData.interConnections = [
                { id: 'conn-1', fromId: this.slideData.nodes[0].id, toId: this.slideData.nodes[1].id, isBidirectional: true }
              ];
            }
          }
        }

        // 6. Tags detection
        const tagsMatch = text.match(/(?:etiket(?:ler)?|tags)[:\s]+([^.\n]+)/i);
        if (tagsMatch) {
          const rawTags = tagsMatch[1].split(/[,;]/).map(t => t.replace(/['"]/g, '').trim()).filter(t => t.length > 2);
          if (rawTags.length > 0) {
            this.slideData.pillTags = rawTags.map((tagText, idx) => ({
              text: tagText.replace(/\(vurgulu\)/i, '').trim(),
              primary: tagText.toLowerCase().includes('vurgulu') || (isToBe && (idx === 1 || tagText.toLowerCase().includes('yönetilebilir')))
            }));
          }
        }

        // 7. Footer note
        const noteMatch = text.match(/(?:alt not|not|özet)[:\s]+([^.\n]+)/i);
        if (noteMatch && noteMatch[1].trim().length > 5) {
          this.slideData.footerNote = noteMatch[1].trim();
        }

        // User feedback banner
        if (isToBe) {
          const leftCount = this.slideData.nodes.length;
          this.parsedFeedbackMessage.set(`✨ TO-BE Hedef Akış Çizildi: Sol kolonda ${leftCount} sistem • Ortada ${this.slideData.centerTitle} • Sağda ${this.slideData.rightNodeTitle || 'CORE ERP'} • ${this.slideData.pillTags.length} Etiket`);
        } else {
          this.parsedFeedbackMessage.set(`✨ AS-IS Mimari Çizildi: Merkez [${this.slideData.centerTitle}] • Çevresinde ${this.slideData.nodes.length} Adet Sistem • ${this.slideData.interConnections.length} Bağlantı Hattı • ${this.slideData.pillTags.length} Etiket`);
        }
      } catch (err) {
        console.error('Error generating from prompt', err);
      } finally {
        this.isGenerating.set(false);
      }
    }, 200);
  }

  calculateRadialNodes(systemNames: string[]): ArchitectureNode[] {
    const count = systemNames.length;
    if (count === 6) {
      return [
        { id: 'node-1', name: systemNames[0].toUpperCase(), isCenter: false, x: 18, y: 28 },
        { id: 'node-2', name: systemNames[1].toUpperCase(), isCenter: false, x: 50, y: 16 },
        { id: 'node-3', name: systemNames[2].toUpperCase(), isCenter: false, x: 82, y: 28 },
        { id: 'node-4', name: systemNames[3].toUpperCase(), isCenter: false, x: 18, y: 72 },
        { id: 'node-5', name: systemNames[4].toUpperCase(), isCenter: false, x: 50, y: 84 },
        { id: 'node-6', name: systemNames[5].toUpperCase(), isCenter: false, x: 82, y: 72 }
      ];
    }

    const nodes: ArchitectureNode[] = [];
    const rx = 36;
    const ry = 30;
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / count;
      const x = Math.round(50 + rx * Math.cos(angle));
      const y = Math.round(50 + ry * Math.sin(angle));
      nodes.push({
        id: `node-${i + 1}`,
        name: systemNames[i].toUpperCase(),
        isCenter: false,
        x,
        y
      });
    }
    return nodes;
  }

  addNode(): void {
    const id = `node-${Date.now()}`;
    this.slideData.nodes.push({
      id,
      name: 'YENİ SİSTEM',
      subtitle: 'Entegrasyon',
      isCenter: false,
      x: 50,
      y: 20
    });
  }

  removeNode(index: number): void {
    this.slideData.nodes.splice(index, 1);
  }

  addTag(): void {
    const text = prompt('Yeni etiket adı:');
    if (text && text.trim()) {
      this.slideData.pillTags.push({ text: text.trim() });
    }
  }

  removeTag(index: number): void {
    this.slideData.pillTags.splice(index, 1);
  }

  quickEditField(field: keyof ArchitectureSlideData): void {
    const current = (this.slideData as any)[field];
    if (typeof current === 'string') {
      const newVal = prompt(`Düzenle (${field}):`, current);
      if (newVal !== null && newVal.trim() !== '') {
        (this.slideData as any)[field] = newVal.trim();
      }
    }
  }

  togglePresentationMode(): void {
    this.isPresentationMode.update(v => !v);
  }

  resetTemplate(): void {
    if (confirm('Şablonu varsayılana sıfırlamak istediğinize emin misiniz?')) {
      this.switchTemplate(this.selectedTemplateType());
    }
  }

  onCustomerChange(customerId: string): void {
    this.customerService.selectCustomer(customerId);
    const cust = this.customerService.customers().find(c => c.id === customerId);
    if (cust) {
      this.slideData.customerName = cust.name;
    }
    this.loadSavedForCurrentCustomer();
  }

  loadSavedForCurrentCustomer(): void {
    try {
      const activeId = this.customerService.activeCustomerId();
      const savedKey = `taskforce_prompt_arch_v5_${activeId}_${this.selectedTemplateType()}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        this.slideData = JSON.parse(saved);
        return;
      }
      const activeCust = this.customerService.activeCustomer();
      if (activeCust) {
        this.slideData.customerName = activeCust.name;
      }
    } catch (e) {}
  }

  saveForCurrentCustomer(): void {
    try {
      const activeId = this.customerService.activeCustomerId();
      const savedKey = `taskforce_prompt_arch_v5_${activeId}_${this.selectedTemplateType()}`;
      localStorage.setItem(savedKey, JSON.stringify(this.slideData));
      alert(`"${this.slideData.customerName}" için ${this.selectedTemplateType().toUpperCase()} mimari şeması başarıyla kaydedildi!`);
    } catch (e) {
      console.error('Save failed', e);
    }
  }

  async exportAsPng(): Promise<void> {
    if (!this.slideCanvasRef) return;
    this.isExporting.set(true);

    try {
      const element = this.slideCanvasRef.nativeElement;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: null
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const cleanName = this.slideData.customerName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `${cleanName}_${this.selectedTemplateType().toUpperCase()}_Mimari.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export error', err);
      alert('PNG görseli dışa aktarılırken hata oluştu.');
    } finally {
      this.isExporting.set(false);
    }
  }
}
