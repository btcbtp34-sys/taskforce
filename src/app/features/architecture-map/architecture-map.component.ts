import { Component, inject, signal, computed, ElementRef, ViewChild, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { DataImportService } from '../../core/services/data-import.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PO_INTERFACES_DATA } from '../../core/data/mock-po-interfaces';

export interface ArchitectureNode {
  id: string;
  name: string;
  category: 'Core' | 'Integration' | 'Cloud App' | 'Automation' | 'Analytics' | 'Legacy';
  userCount: number;
  instanceCount?: number; // Red Badge Number on Slide: 3, 3, 2, 2, 1
  dbInfo?: string;
  osInfo?: string;
  status: 'Active' | 'Optimization Candidate' | 'Planned' | 'Under Review';
  x: number;
  y: number;
  iconName: any;
  color: string;
  protocol?: string;
  role?: 'outbound' | 'inbound' | 'sync' | 'hub';
  roleLabel?: string;
  serverCountLabel?: string;
  isEosRisk?: boolean;
  eosDate?: string;
}

export interface ArchitectureEdge {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  isEosRisk?: boolean;
}

@Component({
  selector: 'app-architecture-map',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent],
  template: `
    <div class="map-page">
      <!-- Page Header (Clean & Spacious Title) -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon [name]="architectureMode() === 'po' ? 'bolt' : 'map'" [size]="24" [color]="architectureMode() === 'po' ? '#0284c7' : '#0284c7'"></app-icon>
            {{ architectureMode() === 'po' ? 'SAP PO 7.5 Canlı Entegrasyon Haritası' : 'Mimari Şema & Bulut Dönüşüm Konsolu' }}
          </h1>
          <p class="page-subtitle">
            {{ architectureMode() === 'po' ? 'ABC_Sigorta_PO_Entegrasyon_Listesi.xlsx (109 Canlı Servis & 16 Entegre Sunucu Mimarisi)' : 'Mevcut AS-IS Altyapı, PO Entegrasyon Haritası ve RISE with SAP Bulut Hedef Mimarisi' }}
          </p>
        </div>
      </div>

      <!-- Mode Toggle Toolbar (Only shown when not strictly in PO Integration subpage, or cleanly scoped) -->
      <div class="mode-toolbar-card" *ngIf="architectureMode() !== 'po'">
        <div class="view-mode-toggle-lg">
          <button class="mode-btn" [class.active-asis]="architectureMode() === 'asis'" (click)="setArchitectureMode('asis')">
            <app-icon name="alert" [size]="15" [color]="architectureMode() === 'asis' ? '#ffffff' : '#d97706'"></app-icon>
            <span>Mevcut Durum (AS-IS 11 Sunucu)</span>
          </button>

          <button class="mode-btn" [class.active-rise]="architectureMode() === 'rise'" (click)="setArchitectureMode('rise')">
            <app-icon name="sparkles" [size]="15" [color]="architectureMode() === 'rise' ? '#ffffff' : '#059669'"></app-icon>
            <span>RISE with SAP Hedef Mimari</span>
          </button>
        </div>

        <div class="toolbar-right-actions studio-actions">
          <button class="btn btn-studio-add" (click)="openCreateNodeModal()" title="Yeni Sunucu / Bileşen Ekle">
            <app-icon name="plus" [size]="14" color="#ffffff"></app-icon>
            <span>+ Bileşen Ekle</span>
          </button>

          <button 
            class="btn" 
            [ngClass]="isConnectingMode() ? 'btn-studio-connect-active' : 'btn-secondary'" 
            (click)="toggleConnectingMode()" 
            title="İki sunucu arasında bağlantı oku çek">
            <app-icon name="link" [size]="14" [color]="isConnectingMode() ? '#ffffff' : '#0284c7'"></app-icon>
            <span>{{ isConnectingMode() ? (connectSourceNode() ? '2. Hedefe Tıkla' : '1. Kaynağa Tıkla') : 'Bağlantı Kur' }}</span>
          </button>

          <button class="btn btn-secondary" (click)="openManageEdgesModal()" title="Mevcut kabloları listele ve sil">
            <app-icon name="link" [size]="14" color="#dc2626"></app-icon>
            <span>Kabloları Sil ({{ currentEdges().length }})</span>
          </button>

          <button class="btn btn-studio-save" (click)="saveCustomLayout()" title="Mimari çizimi tarayıcıya kaydet">
            <app-icon name="check" [size]="14" color="#ffffff"></app-icon>
            <span>Çizimi Kaydet</span>
          </button>

          <button class="btn btn-secondary" (click)="clearCanvas()" title="Tüm bileşenleri temizle ve sıfırdan çiz">
            <app-icon name="trash" [size]="14" color="#dc2626"></app-icon>
            <span>Haritayı Temizle</span>
          </button>

          <button class="btn btn-secondary" (click)="resetDiagram()" title="Orijinal şablona geri dön">
            <app-icon name="refresh" [size]="14"></app-icon>
            <span>Şablona Sıfırla</span>
          </button>

          <button class="btn btn-primary" (click)="exportDiagram()" title="Çizimi PNG Görseli Olarak İndir">
            <app-icon name="download" [size]="14"></app-icon>
            <span>PNG İndir</span>
          </button>
        </div>
      </div>

      <!-- PO Specific Quick Action Bar -->
      <div class="mode-toolbar-card po-toolbar" *ngIf="architectureMode() === 'po'">
        <div class="po-toolbar-badge-group">
          <span class="po-main-tag">ABC Sigorta PO Entegrasyon Mimarisi</span>
          <span class="po-stat-pill green">83 Verici (Outbound)</span>
          <span class="po-stat-pill blue">26 Alıcı (Inbound)</span>
          <span class="po-stat-pill purple">72 Senkron</span>
          <span class="po-stat-pill gray">37 Asenkron</span>
          <span class="po-stat-pill dark">16 Entegre Sunucu</span>
        </div>

        <div class="toolbar-right-actions">
          <button class="btn btn-secondary" (click)="resetDiagram()" title="Düğümleri İlk Konumuna Getir">
            <app-icon name="refresh" [size]="15"></app-icon>
            <span>Haritayı Sıfırla</span>
          </button>

          <button class="btn btn-primary" (click)="exportDiagram()" title="Entegrasyon Haritasını PNG Olarak İndir">
            <app-icon name="download" [size]="15"></app-icon>
            <span>Haritayı İndir (PNG)</span>
          </button>
        </div>
      </div>

      <!-- Transformation Insight Banner -->
      <div class="transformation-banner" [class.rise-mode]="architectureMode() === 'rise'" [class.po-mode]="architectureMode() === 'po'">
        @if (excelImportSuccess()) {
          <div class="banner-content excel-success">
            <app-icon name="file-spreadsheet" [size]="18" color="#047857"></app-icon>
            <div class="b-text">
              <strong>Excel Yüklemesi Başarılı:</strong> <code>{{ importService.uploadedFileName() }}</code> verileri analiz edildi, Mevcut AS-IS altyapısı ve RISE with SAP hedef bulut haritası dinamik güncellendi!
            </div>
          </div>
        } @else if (architectureMode() === 'asis') {
          <div class="banner-content warning">
            <app-icon name="alert" [size]="18" color="#b45309"></app-icon>
            <div class="b-text">
              <strong>Mevcut AS-IS Altyapı Akış Analizi (11 Sunucu/Instance):</strong> PO 7.5 ve CS 6.5 doğrudan ERP EHP7'ye; WebDisp ise hem ERP EHP7 hem de Fiori S4H 1511'e (EoS 2020) bağlanmaktadır. Kartlara tıklayarak detaylı altyapı raporunu inceleyebilirsiniz.
            </div>
          </div>
        } @else if (architectureMode() === 'po') {
          <div class="banner-content po-info">
            <app-icon name="bolt" [size]="18" color="#0284c7"></app-icon>
            <div class="b-text">
              <strong>ABC Sigorta PO Canlı Entegrasyon Haritası:</strong> <code>ABC_Sigorta_PO_Entegrasyon_Listesi.xlsx</code> dosyasındaki <strong>109 canlı servis</strong>, alıcı/verici (Inbound/Outbound) akış yönleri ve 16 sunucu altyapısıyla haritalandırılmıştır.
            </div>
          </div>
        } @else {
          <div class="banner-content success">
            <app-icon name="sparkles" [size]="18" color="#047857"></app-icon>
            <div class="b-text">
              <strong>RISE with SAP Bulut Dönüşüm Analizi:</strong> Mevcut 11 parçalı dağınık sunucu altyapısı ve PO canlı entegrasyonları analiz edilerek tek bir S/4HANA Private Cloud veritabanı ve SAP BTP Integration Suite mimarisinde birleştirilmiştir.
            </div>
          </div>
        }
      </div>

      <!-- Main Map Grid -->
      <div class="map-grid">
        <!-- Sidebar Controls & Configurator -->
        <div class="card-box config-panel">
          <div class="card-header">
            <h3><app-icon name="layers" [size]="16"></app-icon> {{ architectureMode() === 'po' ? 'Entegrasyon Düğümleri' : 'Sistem Bileşenleri' }}</h3>
            <span class="sub-text">{{ architectureMode() === 'po' ? '109 Canlı Servis' : (totalServerCount() + ' Sunucu / Instance') }}</span>
          </div>

          <!-- Sidebar Tabs: Sunucular vs Bağlantı Kabloları -->
          <div class="sidebar-tab-pills">
            <button class="s-tab-pill" [class.active]="activeSidebarTab() === 'nodes'" (click)="activeSidebarTab.set('nodes')">
              <app-icon name="layers" [size]="13"></app-icon>
              <span>Sunucular ({{ nodes().length }})</span>
            </button>
            <button class="s-tab-pill" [class.active]="activeSidebarTab() === 'edges'" (click)="activeSidebarTab.set('edges')">
              <app-icon name="link" [size]="13"></app-icon>
              <span>Kablolar ({{ currentEdges().length }})</span>
            </button>
          </div>

          <!-- Tab 1: System Nodes List -->
          <div class="node-config-list" *ngIf="activeSidebarTab() === 'nodes'">
            @for (node of nodes(); track node.id) {
              <div 
                class="node-item" 
                [class.selected]="selectedNode()?.id === node.id"
                [class.eos-item]="node.isEosRisk"
                (click)="selectNode(node)">
                
                <div class="node-header-row">
                  <strong class="node-name">{{ node.name }}</strong>
                  <span class="instance-pill-badge" *ngIf="architectureMode() !== 'po'" title="Sunucu / Instance Adedi">{{ node.instanceCount || 1 }}x</span>
                  <span class="eos-badge" *ngIf="node.isEosRisk">EoS 2020</span>
                </div>

                <div class="node-footer-row">
                  <span class="meta">{{ node.dbInfo || node.category }} • {{ node.userCount }} Kullanıcı</span>
                  <button class="btn-detail-sm" (click)="$event.stopPropagation(); openDetailModal(node)">Detay ➔</button>
                </div>
              </div>
            }
          </div>

          <!-- Tab 2: Active Connection Cables List with Direct Delete Buttons -->
          <div class="edges-config-list" *ngIf="activeSidebarTab() === 'edges'">
            @if (currentEdges().length === 0) {
              <div class="empty-edges-msg">
                <p>Henüz çekilmiş bir bağlantı kablosu bulunmuyor.</p>
                <button class="btn btn-sm btn-studio-connect" (click)="toggleConnectingMode()">
                  <app-icon name="link" [size]="13"></app-icon>
                  <span>Bağlantı Kur</span>
                </button>
              </div>
            } @else {
              @for (edge of currentEdges(); track edge.id) {
                <div class="edge-list-card">
                  <div class="edge-info-top">
                    <span class="edge-route">{{ getNodeName(edge.fromId) }} ➔ {{ getNodeName(edge.toId) }}</span>
                    <button class="btn-delete-edge" (click)="deleteEdge(edge, $event)" title="Bu kabloyu sil">
                      <app-icon name="trash" [size]="12" color="#dc2626"></app-icon>
                      <span>Sil</span>
                    </button>
                  </div>
                  <div class="edge-meta-row">
                    <span class="edge-label-tag">{{ edge.label || 'Akış Oku' }}</span>
                    <span class="edge-risk-tag" *ngIf="edge.isEosRisk">⚠️ Riskli</span>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Quick ROI & Transformation Summary Box -->
          <div class="roi-summary-box">
            <h4><app-icon name="chart" [size]="15" color="#0284c7"></app-icon> {{ architectureMode() === 'po' ? 'PO Entegrasyon Metrikleri' : (architectureMode() === 'rise' ? 'RISE Bulut Kıyaslama Raporu' : 'Altyapı Özeti') }}</h4>
            
            <div class="summary-stat">
              <span class="s-label">{{ architectureMode() === 'po' ? 'Toplam Entegrasyon' : 'Sunucu Altyapı Adedi' }}</span>
              <strong class="s-val" [class.red]="architectureMode() === 'asis'" [class.green]="architectureMode() === 'rise' || architectureMode() === 'po'">
                {{ architectureMode() === 'asis' ? '11 Sunucu (Dağınık)' : (architectureMode() === 'po' ? '109 Canlı Arayüz' : '1 Bulut DB (Konsolide)') }}
              </strong>
            </div>

            <div class="summary-stat">
              <span class="s-label">{{ architectureMode() === 'po' ? 'Verici (Outbound)' : 'Entegrasyon Mimarisi' }}</span>
              <strong class="s-val green">
                {{ architectureMode() === 'po' ? '83 Servis (%76.1)' : (architectureMode() === 'rise' ? 'SAP BTP Integration Suite' : 'PO 7.5 On-Premise') }}
              </strong>
            </div>

            <div class="summary-stat">
              <span class="s-label">{{ architectureMode() === 'po' ? 'Alıcı (Inbound)' : 'Hedef Lisans Paketi' }}</span>
              <strong class="s-val" [class.text-blue]="architectureMode() === 'po'" [class.green]="architectureMode() !== 'po'">
                {{ architectureMode() === 'po' ? '26 Servis (%23.9)' : '70 FUE (Optimize Bulut)' }}
              </strong>
            </div>

            <div class="summary-stat">
              <span class="s-label">{{ architectureMode() === 'po' ? 'Senkron / Anlık' : 'Tahmini Yıllık Tasarruf' }}</span>
              <strong class="s-val green">
                {{ architectureMode() === 'po' ? '72 Canlı Servis' : '€140.000 / Yıl Net TCO' }}
              </strong>
            </div>

            <div class="summary-stat">
              <span class="s-label">{{ architectureMode() === 'po' ? 'Toplam Sunucu Adedi' : 'Destek Sonu (EoS) Riski' }}</span>
              <strong class="s-val" [class.red]="architectureMode() === 'asis'" [class.green]="architectureMode() === 'rise' || architectureMode() === 'po'">
                {{ architectureMode() === 'po' ? '16 Sunucu / Instance' : (architectureMode() === 'asis' ? 'Fiori 1511 & CS (2 Kritik)' : '0 Risk (%100 SAP Bulut)') }}
              </strong>
            </div>
          </div>
        </div>

        <!-- FULL HEIGHT Interactive Visual Diagram Canvas Container -->
        <div class="card-box canvas-container">
          <div class="canvas-header">
            <div class="active-customer-tag">
              <app-icon name="customers" [size]="15" color="#0284c7"></app-icon>
              <span>{{ customerService.activeCustomer().name }} — {{ architectureMode() === 'asis' ? 'Mevcut AS-IS Mimari Akış Şeması' : (architectureMode() === 'po' ? 'Excel PO Canlı Entegrasyon Haritası (10 Servis)' : 'RISE with SAP Hedef Mimari') }}</span>
            </div>

            <div class="map-legend">
              <span class="legend-dot core">ERP Core</span>
              <span class="legend-dot btp">PO / BTP Entegrasyon</span>
              <span class="legend-dot instance">Red Badge: Instance</span>
              <span class="legend-dot eos">Destek Sonu (EoS)</span>
            </div>
          </div>

          <!-- Interactive SVG Drawing Canvas spreading downwards full screen -->
          <div 
            class="visual-canvas" 
            #canvasRef>

            <!-- Floating Connecting Mode Banner -->
            <div class="canvas-floating-banner connecting-banner" *ngIf="isConnectingMode()">
              <div class="banner-inner">
                <app-icon name="link" [size]="16" color="#ffffff"></app-icon>
                <span class="banner-prompt">
                  @if (connectSourceNode()) {
                    <span><strong>1. Kaynak:</strong> {{ connectSourceNode()?.name }} ➔ Şimdi lütfen <strong>2. Hedef Bileşene</strong> tıklayın.</span>
                  } @else {
                    <span><strong>Bağlantı Kurma Modu:</strong> Lütfen akışın başlayacağı <strong>1. Kaynak Düğümü</strong> seçin.</span>
                  }
                </span>
                <button class="btn-banner-cancel" (click)="cancelConnectingMode()">✕ İptal Et</button>
              </div>
            </div>

            <!-- Floating Studio Toast Notification -->
            <div class="canvas-floating-toast" *ngIf="studioToastMessage()">
              <app-icon name="check" [size]="15" color="#ffffff"></app-icon>
              <span>{{ studioToastMessage() }}</span>
            </div>
            
            <!-- SVG Connection Lines with Directional Arrow Markers & Animated Data Flow -->
            <svg class="connections-svg" width="100%" height="100%">
              <defs>
                <!-- Blue Directional Arrowhead Marker -->
                <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
                </marker>

                <!-- Red Directional Arrowhead Marker for EoS Risk Lines -->
                <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>

                <!-- Teal Directional Arrowhead Marker for RISE Cloud -->
                <marker id="arrow-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669" />
                </marker>
              </defs>

              @for (edge of currentEdges(); track edge.id) {
                @if (getNodePosition(edge.fromId) && getNodePosition(edge.toId)) {
                  <g class="connection-group" (click)="deleteEdge(edge, $event)" title="Kabloyu silmek için tıklayın">
                    <!-- Invisible Fat Hit Area for Easy Clicking on Cable -->
                    <line 
                      class="connection-hitarea"
                      [attr.x1]="getNodePosition(edge.fromId)!.x" 
                      [attr.y1]="getNodePosition(edge.fromId)!.y" 
                      [attr.x2]="getNodePosition(edge.toId)!.x" 
                      [attr.y2]="getNodePosition(edge.toId)!.y" 
                      stroke="transparent" 
                      stroke-width="24"
                      (click)="deleteEdge(edge, $event)" />

                    <!-- Visible Main Line -->
                    <line 
                      class="connection-line"
                      [attr.x1]="getNodePosition(edge.fromId)!.x" 
                      [attr.y1]="getNodePosition(edge.fromId)!.y" 
                      [attr.x2]="getNodePosition(edge.toId)!.x" 
                      [attr.y2]="getNodePosition(edge.toId)!.y" 
                      [attr.stroke]="edge.isEosRisk ? '#ef4444' : (architectureMode() === 'asis' ? '#0284c7' : '#059669')" 
                      stroke-width="2.5" 
                      [attr.marker-end]="edge.isEosRisk ? 'url(#arrow-red)' : (architectureMode() === 'asis' ? 'url(#arrow-blue)' : 'url(#arrow-teal)')"
                      (click)="deleteEdge(edge, $event)" />
                    
                    <!-- Animated Pulsing Dot along line -->
                    <circle 
                      [attr.cx]="(getNodePosition(edge.fromId)!.x + getNodePosition(edge.toId)!.x) / 2" 
                      [attr.cy]="(getNodePosition(edge.fromId)!.y + getNodePosition(edge.toId)!.y) / 2" 
                      r="4" 
                      [attr.fill]="edge.isEosRisk ? '#ef4444' : (architectureMode() === 'asis' ? '#0284c7' : '#059669')"
                      class="pulse-dot">
                      <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                    </circle>

                    <!-- Text Outline Halo -->
                    <text 
                      [attr.x]="(getNodePosition(edge.fromId)!.x + getNodePosition(edge.toId)!.x) / 2" 
                      [attr.y]="(getNodePosition(edge.fromId)!.y + getNodePosition(edge.toId)!.y) / 2 - 14"
                      font-size="11"
                      font-weight="800"
                      stroke="#ffffff"
                      stroke-width="4"
                      stroke-linejoin="round"
                      text-anchor="middle"
                      style="pointer-events: none;">
                      {{ edge.label }}
                    </text>

                    <!-- Text Label Main Fill -->
                    <text 
                      [attr.x]="(getNodePosition(edge.fromId)!.x + getNodePosition(edge.toId)!.x) / 2" 
                      [attr.y]="(getNodePosition(edge.fromId)!.y + getNodePosition(edge.toId)!.y) / 2 - 14"
                      font-size="11"
                      font-weight="800"
                      [attr.fill]="edge.isEosRisk ? '#dc2626' : '#0369a1'"
                      text-anchor="middle"
                      style="pointer-events: all; cursor: pointer;"
                      (click)="deleteEdge(edge, $event)">
                      {{ edge.label }}
                    </text>
                  </g>
                }
              }
            </svg>

            <!-- Rendered System Nodes on Canvas matching Slide Layout -->
            @for (node of nodes(); track node.id) {
              @if (architectureMode() === 'rise' && node.id === 'node-s4p') {
                <!-- Flagship RISE with SAP S4P Center Node with SaaS Card & Aura -->
                <div 
                  class="rise-s4p-card" 
                  [style.left.px]="node.x - 110" 
                  [style.top.px]="node.y - 75"
                  [class.is-dragging]="draggingNodeId === node.id"
                  [class.connecting-selectable]="isConnectingMode()"
                  [class.connecting-source]="connectSourceNode()?.id === node.id"
                  (mousedown)="startDrag(node, $event)"
                  (click)="onNodeClicked(node, $event)">

                  <!-- Quick Hover Tools -->
                  <div class="node-quick-actions" (mousedown)="$event.stopPropagation()">
                    <button class="qa-btn edit" (click)="openEditNodeModal(node, $event)" title="Değerleri Düzenle">✏️</button>
                    <button class="qa-btn link" (click)="startConnectingFromNode(node, $event)" title="Buradan Bağlantı Kur">🔗</button>
                    <button class="qa-btn delete" (click)="confirmRemoveNode(node, $event)" title="Bileşeni Sil">✕</button>
                  </div>

                  <!-- Flagship Card Header -->
                  <div class="s4p-top-header">
                    <div class="s4p-badge-icon">
                      <app-icon name="database" [size]="15" color="#0284c7"></app-icon>
                    </div>
                    <div class="s4p-title-wrap">
                      <strong class="s4p-main-title">{{ node.name }}</strong>
                      <span class="s4p-edition-tag">S/4HANA Private Cloud</span>
                    </div>
                    <button class="node-info-trigger-btn" (click)="openDetailModal(node); $event.stopPropagation()" title="Detaylı Sistem Raporu">ℹ</button>
                  </div>

                  <!-- S4/HANA & Fiori Core Layer Box -->
                  <div class="s4p-core-box">
                    <span class="core-layer">S4/HANA Core</span>
                    <span class="fiori-layer">Embedded Fiori</span>
                  </div>

                  <!-- RISE with SAP Brand Badge -->
                  <div class="rise-brand-pill">
                    <div class="rise-pill-left">
                      <app-icon name="sparkles" [size]="13" color="#38bdf8"></app-icon>
                      <span class="rise-txt">RISE with SAP</span>
                    </div>
                    <span class="rise-status">Target Cloud</span>
                  </div>

                  <!-- SLES OS & DB Specs Pill -->
                  <div class="s4p-os-box">
                    <span class="os-text">{{ node.osInfo || 'SLES for SAP Applications' }}</span>
                    <span class="db-spec">{{ node.dbInfo || 'HANA 2.0 In-Memory' }}</span>
                  </div>
                </div>
              } @else if (architectureMode() === 'rise') {
                <!-- Sleek RISE Service Node (CS / WebDisp / CI) with BTP integration -->
                <div 
                  class="rise-service-card" 
                  [style.left.px]="node.x - 70" 
                  [style.top.px]="node.y - 50"
                  [class.is-dragging]="draggingNodeId === node.id"
                  [class.connecting-selectable]="isConnectingMode()"
                  [class.connecting-source]="connectSourceNode()?.id === node.id"
                  (mousedown)="startDrag(node, $event)"
                  (click)="onNodeClicked(node, $event)">

                  <!-- Quick Hover Tools -->
                  <div class="node-quick-actions" (mousedown)="$event.stopPropagation()">
                    <button class="qa-btn edit" (click)="openEditNodeModal(node, $event)" title="Değerleri Düzenle">✏️</button>
                    <button class="qa-btn link" (click)="startConnectingFromNode(node, $event)" title="Buradan Bağlantı Kur">🔗</button>
                    <button class="qa-btn delete" (click)="confirmRemoveNode(node, $event)" title="Bileşeni Sil">✕</button>
                  </div>
                  
                  <div class="service-top-row">
                    <div class="svc-icon-box">
                      <app-icon [name]="node.iconName" [size]="14" color="#0284c7"></app-icon>
                    </div>
                    <strong class="service-name">{{ node.name }}</strong>
                    <button class="node-info-trigger-btn mini" (click)="openDetailModal(node); $event.stopPropagation()" title="Detay">ℹ</button>
                  </div>

                  <div class="service-role-text">
                    {{ node.dbInfo || (node.name === 'CS' ? 'Document Mgmt' : (node.name === 'WebDisp' ? 'Reverse Proxy' : 'Integration Suite')) }}
                  </div>

                  <div class="service-btp-badge">
                    <span class="btp-dot"></span>
                    <span>{{ node.protocol || 'SAP BTP' }}</span>
                  </div>
                </div>
              } @else if (architectureMode() === 'po') {
                <!-- PO Integration Service Card with Explicit Sender / Receiver Roles & Server Counts -->
                <div 
                  class="po-node-card" 
                  [class.po-hub-card]="node.id === 'node-core'"
                  [class.po-outbound-card]="node.role === 'outbound'"
                  [class.po-inbound-card]="node.role === 'inbound'"
                  [class.po-sync-card]="node.role === 'sync'"
                  [style.left.px]="node.x - (node.id === 'node-core' ? 125 : 110)" 
                  [style.top.px]="node.y - 48"
                  [class.is-dragging]="draggingNodeId === node.id"
                  [class.connecting-selectable]="isConnectingMode()"
                  [class.connecting-source]="connectSourceNode()?.id === node.id"
                  (mousedown)="startDrag(node, $event)"
                  (click)="onNodeClicked(node, $event)">

                  <!-- Quick Hover Tools -->
                  <div class="node-quick-actions" (mousedown)="$event.stopPropagation()">
                    <button class="qa-btn edit" (click)="openEditNodeModal(node, $event)" title="Değerleri Düzenle">✏️</button>
                    <button class="qa-btn link" (click)="startConnectingFromNode(node, $event)" title="Buradan Bağlantı Kur">🔗</button>
                    <button class="qa-btn delete" (click)="confirmRemoveNode(node, $event)" title="Bileşeni Sil">✕</button>
                  </div>
                  
                  <!-- Top Role & Server Count Badge Row -->
                  <div class="po-badge-top-row">
                    <span class="po-role-pill" [ngClass]="node.role">
                      {{ node.role === 'hub' ? '★ MERKEZİ HUB' : (node.role === 'outbound' ? '▲ VERİCİ (Outbound)' : (node.role === 'inbound' ? '▼ ALICI (Inbound)' : '⇄ SENKRON')) }}
                    </span>
                    <div class="right-badge-group">
                      <span class="po-server-count-pill" title="Sunucu / Instance Adedi">
                        🏢 {{ node.instanceCount || 1 }} Sunucu
                      </span>
                      <button class="node-info-trigger-btn mini" (click)="openDetailModal(node); $event.stopPropagation()" title="Detaylı Rapor">ℹ</button>
                    </div>
                  </div>

                  <div class="po-card-content">
                    <div class="po-title-line">
                      <app-icon [name]="node.iconName" [size]="14" [color]="node.role === 'outbound' ? '#059669' : (node.role === 'inbound' ? '#0284c7' : '#7e22ce')"></app-icon>
                      <strong class="po-name-text">{{ node.name }}</strong>
                    </div>

                    <div class="po-proto-pill">
                      <code>{{ node.protocol }}</code>
                    </div>

                    <div class="po-role-hint-row">
                      <span class="hint-txt">
                        {{ node.role === 'hub' ? 'Sybase ASE 16 • Win Server 2019' : (node.role === 'outbound' ? 'Burada VERİCİ konumdasınız (SAP ➔ Dış)' : (node.role === 'inbound' ? 'Burada ALICI konumdasınız (Dış ➔ SAP)' : 'Çift Yönlü Canlı RFC / API Sorgusu')) }}
                      </span>
                    </div>
                  </div>
                </div>
              } @else {
                <!-- Standard AS-IS Node Cards -->
                <div 
                  class="canvas-node" 
                  [style.left.px]="node.x - (node.id === 'node-core' ? 125 : 110)" 
                  [style.top.px]="node.y - 45"
                  [class.core-node]="node.id === 'node-core'"
                  [class.asis-node]="architectureMode() === 'asis' && node.id !== 'node-core'"
                  [class.eos-node]="node.isEosRisk"
                  [class.active-selected]="selectedNode()?.id === node.id"
                  [class.is-dragging]="draggingNodeId === node.id"
                  [class.connecting-selectable]="isConnectingMode()"
                  [class.connecting-source]="connectSourceNode()?.id === node.id"
                  (mousedown)="startDrag(node, $event)"
                  (click)="onNodeClicked(node, $event)">

                  <!-- Quick Hover Tools -->
                  <div class="node-quick-actions" (mousedown)="$event.stopPropagation()">
                    <button class="qa-btn edit" (click)="openEditNodeModal(node, $event)" title="Değerleri Düzenle">✏️</button>
                    <button class="qa-btn link" (click)="startConnectingFromNode(node, $event)" title="Buradan Bağlantı Kur">🔗</button>
                    <button class="qa-btn delete" (click)="confirmRemoveNode(node, $event)" title="Bileşeni Sil">✕</button>
                  </div>

                  <!-- Red Square Instance Badge -->
                  <div class="red-instance-badge" *ngIf="architectureMode() !== 'po'" title="Instance / Sunucu Adedi: {{ node.instanceCount || 1 }}">
                    {{ node.instanceCount || 1 }}
                  </div>

                  <div class="c-node-card-body">
                    <div class="c-header-row">
                      <strong class="c-name">{{ node.name }}</strong>
                      <div class="header-right-tools">
                        <span class="sap-brand-pill">SAP</span>
                        <button class="node-info-trigger-btn mini" (click)="openDetailModal(node); $event.stopPropagation()" title="Detay">ℹ</button>
                      </div>
                    </div>

                    <div class="c-sub-info-pill">
                      {{ node.dbInfo || node.category }}
                    </div>

                    <div class="c-footer-meta">
                      <span class="user-meta">{{ node.userCount }} Kullanıcı</span>
                      <span class="eos-sub-tag" *ngIf="node.isEosRisk">EoS 2020</span>
                    </div>
                  </div>
                </div>
              }
            }

            <!-- RISE with SAP Sizing & Capacity Card Widget on Right Side -->
            <div class="rise-side-table-panel" *ngIf="architectureMode() === 'rise'">
              <div class="panel-header">
                <div class="panel-title-area">
                  <div class="panel-icon">
                    <app-icon name="database" [size]="15" color="#0284c7"></app-icon>
                  </div>
                  <div>
                    <h4 class="panel-title">S/4HANA Boyutlandırma & Kapasite</h4>
                    <span class="panel-sub">HANA DB & Uygulama Sunucu Özeti</span>
                  </div>
                </div>
                <span class="spec-tag">RISE Spec</span>
              </div>

              <div class="table-container">
                <table class="sizing-table">
                  <thead>
                    <tr>
                      <th>Bileşen / Ürün</th>
                      <th>Mevcut (Current)</th>
                      <th>Hedef (Target)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="prod-cell">
                        <span class="p-dot db"></span>
                        <strong>S4 HANA DB Prod</strong>
                      </td>
                      <td><span class="spec-badge cur">1 TB</span></td>
                      <td><span class="spec-badge target">1 TB HANA Cloud</span></td>
                    </tr>
                    <tr>
                      <td class="prod-cell">
                        <span class="p-dot db"></span>
                        <strong>S4 HANA DB QA</strong>
                      </td>
                      <td><span class="spec-badge cur">768 GB</span></td>
                      <td><span class="spec-badge target">768 GB HANA Cloud</span></td>
                    </tr>
                    <tr>
                      <td class="prod-cell">
                        <span class="p-dot db"></span>
                        <strong>S4 HANA DB Dev</strong>
                      </td>
                      <td><span class="spec-badge cur">256 GB</span></td>
                      <td><span class="spec-badge target">256 GB HANA Cloud</span></td>
                    </tr>
                    <tr>
                      <td class="prod-cell">
                        <span class="p-dot app"></span>
                        <strong>S4 App Prod</strong>
                      </td>
                      <td><span class="spec-badge cur">2x64 GB</span></td>
                      <td><span class="spec-badge target">2x64 GB App Server</span></td>
                    </tr>
                    <tr>
                      <td class="prod-cell">
                        <span class="p-dot app"></span>
                        <strong>S4 App Qa</strong>
                      </td>
                      <td><span class="spec-badge cur">32 GB</span></td>
                      <td><span class="spec-badge target">32 GB App Server</span></td>
                    </tr>
                    <tr>
                      <td class="prod-cell">
                        <span class="p-dot app"></span>
                        <strong>S4 App Dev</strong>
                      </td>
                      <td><span class="spec-badge cur">32 GB</span></td>
                      <td><span class="spec-badge target">32 GB App Server</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="panel-footer">
                <div class="stat-summary">
                  <span class="f-label">Toplam HANA Memory:</span>
                  <strong class="f-val">2.02 TB</strong>
                </div>
                <div class="stat-summary">
                  <span class="f-label">Uygulama RAM:</span>
                  <strong class="f-val">192 GB</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Node Details Drawer Bar -->
          <div class="node-detail-bar" *ngIf="selectedNode() as sn">
            <div class="d-info">
              <strong>Bileşen Detayı: {{ sn.name }} ({{ sn.instanceCount || 1 }} Instance / Sunucu)</strong>
              <span>Veritabanı / Entegrasyon: {{ sn.dbInfo || 'Sybase / SLES / Windows 2019' }} • Protokol: {{ sn.protocol || 'SAP BTP OData / RFC' }}</span>
              <span *ngIf="sn.isEosRisk" class="eos-warning-text">UYARI: Bu bileşenin üretici desteği (End of Support: {{ sn.eosDate }}) dolmıştır. RISE with SAP dönüşümünde bulut servislerine taşınacaktır.</span>
            </div>
            <div class="d-actions">
              <button class="btn btn-sm btn-studio-edit" (click)="openEditNodeModal(sn, $event)">✏️ Değerleri Düzenle</button>
              <button class="btn btn-sm btn-studio-connect" (click)="startConnectingFromNode(sn, $event)">🔗 Buradan Bağla</button>
              <button class="btn btn-sm btn-danger" (click)="confirmRemoveNode(sn, $event)">🗑️ Sil</button>
              <button class="btn btn-sm btn-primary" (click)="openDetailModal(sn)">Tam Rapor ➔</button>
              <button class="btn btn-sm btn-secondary" (click)="selectedNode.set(null)">Kapat</button>
            </div>
          </div>
        </div>
      </div>

      <!-- RISE with SAP Transformation Comparison Table (AS-IS ➔ RISE 1-to-1 Mapping) -->
      <div class="card-box rise-comparison-table-card" *ngIf="architectureMode() === 'rise'">
        <div class="card-header">
          <h3>
            <app-icon name="sparkles" [size]="16" color="#047857"></app-icon>
            RISE with SAP Bulut Dönüşüm Tablosu (Birebir Sistem Karşılaştırması)
          </h3>
          <span class="sub-text">11 Sunuculu Dağınık Altyapı ➔ Tek Konsolide Private Cloud DB</span>
        </div>

        <div class="table-responsive">
          <table class="rise-compare-table">
            <thead>
              <tr>
                <th>Mevcut Durum Bileşeni (AS-IS 11 Sunucu)</th>
                <th>Sunucu / Instance</th>
                <th>EoS Riski</th>
                <th>RISE with SAP Bulut Karşılığı (Target)</th>
                <th>Elde Edilen Bulut Avantajı</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ERP EHP7 (SAP 1503 SFinancials)</strong></td>
                <td><span class="badge-red">3 Sunucu</span></td>
                <td>—</td>
                <td><strong class="text-teal">SAP S/4HANA Private Cloud Edition</strong></td>
                <td>1 Konsolide HANA 2.0 In-Memory DB, %40 performans artışı</td>
              </tr>
              <tr>
                <td><strong>PO 7.5 (Process Orchestration)</strong></td>
                <td><span class="badge-red">3 Sunucu</span></td>
                <td>—</td>
                <td><strong class="text-teal">SAP BTP Integration Suite (Cloud iFlows)</strong></td>
                <td>10+ Canlı PO entegrasyonu BTP bulutuna taşındı, 0 sunucu bakımı</td>
              </tr>
              <tr>
                <td><strong>Fiori S4H 1511 (FES 200 Front-End)</strong></td>
                <td><span class="badge-red">2 Sunucu</span></td>
                <td><span class="badge-eos">EoS 2020</span></td>
                <td><strong class="text-teal">Embedded Fiori Launchpad S/4HANA</strong></td>
                <td>Ayrı Front-End sunucusu kaldırıldı, %100 SAP bulut güvencesi (0 EoS Risk)</td>
              </tr>
              <tr>
                <td><strong>CS 6.5 (Content Server)</strong></td>
                <td><span class="badge-red">1 Sunucu</span></td>
                <td><span class="badge-eos">EoS 2020</span></td>
                <td><strong class="text-teal">SAP Document Management Service (BTP)</strong></td>
                <td>MaxDB sunucusu kapatıldı, sınırsız BTP Object Storage arşivleme</td>
              </tr>
              <tr>
                <td><strong>WebDisp (Web Dispatcher)</strong></td>
                <td><span class="badge-red">2 Sunucu</span></td>
                <td>—</td>
                <td><strong class="text-teal">SAP Cloud Connector & BTP Gateway</strong></td>
                <td>Güvenli TLS 1.3 tünelleme, 0 Donanım/OS lisans maliyeti</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PO LIVE INTEGRATION INTERFACES TABLE & SERVER COUNTS (ABC_Sigorta_PO_Entegrasyon_Listesi.xlsx) -->
      <div class="card-box po-integration-table-card" *ngIf="architectureMode() === 'po'">
        <div class="card-header">
          <div class="po-table-title-group">
            <div class="icon-circle bg-blue">
              <app-icon name="bolt" [size]="16" color="#0284c7"></app-icon>
            </div>
            <div>
              <h3>ABC Sigorta PO Canlı Entegrasyon Listesi (109 Arayüz & Sunucu Dağılımı)</h3>
              <span class="c-sub">ABC_Sigorta_PO_Entegrasyon_Listesi.xlsx dosyasındaki 109 canlı servis, alıcı/verici rolleri ve sunucu adetleri</span>
            </div>
          </div>
          <span class="badge-source-file">Excel: ABC_Sigorta_PO_Entegrasyon_Listesi.xlsx (109 Servis)</span>
        </div>

        <!-- Sunucu Adetleri Özet Barı -->
        <div class="po-server-summary-bar">
          <div class="ps-item">
            <span class="ps-lbl">Merkezi PO 7.5:</span>
            <strong class="ps-val text-blue">3 Sunucu (Dev / QA / Prod)</strong>
          </div>
          <div class="ps-item">
            <span class="ps-lbl">SAP ERP Backend:</span>
            <strong class="ps-val text-blue">3 Sunucu (ECC/S4)</strong>
          </div>
          <div class="ps-item">
            <span class="ps-lbl">Banka & Kurum Gatewayleri:</span>
            <strong class="ps-val text-emerald">6 Sunucu</strong>
          </div>
          <div class="ps-item">
            <span class="ps-lbl">Sigorta & Entegrasyon Sunucuları:</span>
            <strong class="ps-val text-purple">4 Sunucu</strong>
          </div>
          <div class="ps-item highlight">
            <span class="ps-lbl">TOPLAM ENTEGRASYON SUNUCUSU:</span>
            <strong class="ps-val text-dark">16 Sunucu / Instance</strong>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="po-filter-toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="14" color="#64748b"></app-icon>
            <input 
              type="text" 
              [(ngModel)]="poSearchQuery" 
              placeholder="Arayüz adı, servis, sistem veya protokol ara (Örn: ZFI, KUR, JDBC, WINSURE...)" 
              class="search-input" />
            <button *ngIf="poSearchQuery" class="clear-btn" (click)="poSearchQuery = ''">✕</button>
          </div>

          <div class="filter-pills-row">
            <button class="f-pill" [class.active]="poFilter() === 'ALL'" (click)="poFilter.set('ALL')">
              Tümü ({{ poIntegrationInterfaces.length }})
            </button>
            <button class="f-pill pill-green" [class.active]="poFilter() === 'OUTBOUND'" (click)="poFilter.set('OUTBOUND')">
              ▲ Verici / Outbound (83)
            </button>
            <button class="f-pill pill-blue" [class.active]="poFilter() === 'INBOUND'" (click)="poFilter.set('INBOUND')">
              ▼ Alıcı / Inbound (26)
            </button>
            <button class="f-pill pill-purple" [class.active]="poFilter() === 'SYNC'" (click)="poFilter.set('SYNC')">
              ⚡ Senkron (72)
            </button>
            <button class="f-pill" [class.active]="poFilter() === 'ASYNC'" (click)="poFilter.set('ASYNC')">
              ⏳ Asenkron (37)
            </button>
            <button class="f-pill" [class.active]="poFilter() === 'JDBC'" (click)="poFilter.set('JDBC')">
              JDBC (43)
            </button>
            <button class="f-pill" [class.active]="poFilter() === 'SOAP'" (click)="poFilter.set('SOAP')">
              SOAP (28)
            </button>
            <button class="f-pill" [class.active]="poFilter() === 'RFC'" (click)="poFilter.set('RFC')">
              RFC (18)
            </button>
            <button class="f-pill" [class.active]="poFilter() === 'REST'" (click)="poFilter.set('REST')">
              REST (10)
            </button>
          </div>
        </div>

        <div class="table-responsive max-height-table">
          <table class="saas-table po-excel-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Arayüz Adı (Interface Name)</th>
                <th class="text-center">Rolünüz (Role)</th>
                <th>Kaynak (Sender) ➔ Hedef (Receiver)</th>
                <th>Protokol & Adaptör</th>
                <th class="text-center">Tür</th>
                <th>Operation Mapping / Senaryo</th>
              </tr>
            </thead>
            <tbody>
              @for (iface of filteredPoInterfaces(); track iface.id; let idx = $index) {
                <tr [class.row-outbound]="iface.role === 'outbound'" [class.row-inbound]="iface.role === 'inbound'">
                  <td class="text-muted font-bold">{{ iface.id }}</td>
                  
                  <td>
                    <strong class="iface-code">{{ iface.name }}</strong>
                  </td>

                  <td class="text-center">
                    <span class="role-badge" [ngClass]="iface.role">
                      {{ iface.roleLabel }}
                    </span>
                  </td>

                  <td>
                    <span class="flow-path">{{ iface.sender }} ➔ <strong>{{ iface.receiver }}</strong></span>
                  </td>

                  <td>
                    <span class="proto-tag">{{ iface.protocol }}</span>
                  </td>

                  <td class="text-center">
                    <span class="type-pill" [class.sync]="iface.type === 'Synchronous'">{{ iface.type }}</span>
                  </td>

                  <td>
                    <span class="om-tag">{{ iface.operationMapping }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="po-table-footer">
          <span>Toplam <strong>109</strong> servisten <strong>{{ filteredPoInterfaces().length }}</strong> servis listeleniyor.</span>
          <span class="text-emerald font-bold">✓ RISE with SAP BTP Migration Hazır</span>
        </div>
      </div>

      <!-- Rich System Details Modal Popup -->
      <div class="modal-backdrop" *ngIf="detailModalNode() as node" (click)="detailModalNode.set(null)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="m-title-area">
              <span class="m-category-badge">{{ node.category }}</span>
              <h2 class="m-name">{{ node.name }}</h2>
              <span class="sap-brand-lg">SAP System Architecture</span>
            </div>
            <button class="modal-close-btn" (click)="detailModalNode.set(null)">✕</button>
          </div>

          <div class="modal-body">
            <!-- High Priority Risk/Benefit Alert -->
            <div class="eos-alert-box" *ngIf="node.isEosRisk">
              <app-icon name="alert" [size]="20" color="#dc2626"></app-icon>
              <div class="eos-alert-text">
                <strong>KRİTİK DESTEK SONU (End-of-Support: {{ node.eosDate }}) UYARISI:</strong>
                <p>Bu sistemin üretici (SAP/Vendor) resmi desteği sona ermiştir. Yeni güvenlik yama ve güncellemeleri yayınlanmamaktadır.</p>
                <div class="action-tag">RISE with SAP Dönüşüm Aksiyonu: S/4HANA Private Cloud & BTP Document Storage bulut altyapısına taşınacaktır.</div>
              </div>
            </div>

            <div class="rise-benefit-box" *ngIf="architectureMode() === 'rise'">
              <app-icon name="sparkles" [size]="20" color="#047857"></app-icon>
              <div class="rise-alert-text">
                <strong>RISE with SAP Bulut Konsolidasyon Avantajı:</strong>
                <p>11 Parçalı dağınık sunucu altyapıları tek bir yüksek performanslı S/4HANA Private Cloud veritabanında birleştirilmiş, sıfır destek riski ve %100 bulut yönetimi sağlanmıştır.</p>
              </div>
            </div>

            <!-- Technical Specs Grid -->
            <div class="specs-grid">
              <div class="spec-card">
                <span class="s-label">Sunucu / Instance Adedi</span>
                <strong class="s-value highlight-red">{{ node.instanceCount || 1 }} Sunucu (Prod, QA, Dev)</strong>
              </div>

              <div class="spec-card">
                <span class="s-label">Aktif Kullanıcı Sayısı</span>
                <strong class="s-value">{{ node.userCount }} Kayıtlı Kullanıcı</strong>
              </div>

              <div class="spec-card">
                <span class="s-label">Veritabanı / Altyapı Motoru</span>
                <strong class="s-value">{{ node.dbInfo || 'Sybase 16 / SLES 15 SP7' }}</strong>
              </div>

              <div class="spec-card">
                <span class="s-label">Entegrasyon Protokolü</span>
                <strong class="s-value">{{ node.protocol || 'SAP BTP OData / RFC / JDBC' }}</strong>
              </div>

              <div class="spec-card">
                <span class="s-label">Sistem Durumu</span>
                <strong class="s-value">
                  <app-status-badge [text]="node.status" type="status"></app-status-badge>
                </strong>
              </div>

              <div class="spec-card">
                <span class="s-label">Sorumlu Müşteri & Tesis</span>
                <strong class="s-value">{{ customerService.activeCustomer().name }}</strong>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" (click)="detailModalNode.set(null)">Tamam / Kapat</button>
          </div>
        </div>
      </div>

      <!-- Studio Node Modal (Create & Edit Component Properties) -->
      <div class="studio-modal-backdrop" *ngIf="showStudioNodeModal()" (click)="closeStudioNodeModal()">
        <div class="studio-modal-card" (click)="$event.stopPropagation()">
          <div class="studio-modal-header">
            <div class="header-titles">
              <span class="badge-studio-mode" [class.edit-mode]="editingNodeId">{{ editingNodeId ? 'DÜZENLEME MODU' : 'YENİ SUNUCU / BİLEŞEN' }}</span>
              <h3>{{ editingNodeId ? 'Sistem Bileşenini / Değerlerini Düzenle' : 'Yeni Mimari Sunucu / Bileşen Ekle' }}</h3>
              <p class="modal-sub">Sunucu adı, instance sayısı, veri tabanı, OS ve EoS risk bilgilerini giriniz.</p>
            </div>
            <button class="modal-close-btn" (click)="closeStudioNodeModal()">✕</button>
          </div>

          <!-- Quick SAP Landscape Presets (Only displayed when adding new node) -->
          <div class="presets-section" *ngIf="!editingNodeId">
            <span class="presets-label">⚡ Hızlı SAP Şablonu Seçin:</span>
            <div class="preset-chips">
              <button type="button" class="preset-chip" (click)="applyPreset('erp')">🏢 SAP ERP / S4HANA</button>
              <button type="button" class="preset-chip" (click)="applyPreset('hana')">💾 HANA 2.0 DB</button>
              <button type="button" class="preset-chip" (click)="applyPreset('po')">⚡ SAP PO 7.5</button>
              <button type="button" class="preset-chip" (click)="applyPreset('fiori')">📱 Fiori Gateway</button>
              <button type="button" class="preset-chip" (click)="applyPreset('btp')">☁️ SAP BTP Suite</button>
              <button type="button" class="preset-chip" (click)="applyPreset('webdisp')">🌐 Web Dispatcher</button>
              <button type="button" class="preset-chip" (click)="applyPreset('cs')">📁 Content Server</button>
            </div>
          </div>

          <form class="studio-form" (ngSubmit)="saveNodeForm()">
            <div class="form-row">
              <div class="form-group flex-2">
                <label>Bileşen / Sunucu Adı <span class="req">*</span></label>
                <input type="text" [(ngModel)]="nodeForm.name" name="name" required placeholder="Örn: SAP ERP EHP7, S4HANA Private Cloud, PO 7.5" class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label>Sunucu / Instance Adedi</label>
                <input type="number" [(ngModel)]="nodeForm.instanceCount" name="instanceCount" min="1" max="50" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Kategori</label>
                <select [(ngModel)]="nodeForm.category" name="category" class="form-control">
                  <option value="Core">Core (ERP / S4)</option>
                  <option value="Integration">Integration (PO / BTP / Gateway)</option>
                  <option value="Cloud App">Cloud App (SaaS / Private Cloud)</option>
                  <option value="Analytics">Analytics (BW / SAC)</option>
                  <option value="Automation">Automation</option>
                  <option value="Legacy">Legacy (Destek Sonu / Eski)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Aktif Kullanıcı Sayısı</label>
                <input type="number" [(ngModel)]="nodeForm.userCount" name="userCount" min="0" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Veritabanı / Altyapı Motoru</label>
                <input type="text" [(ngModel)]="nodeForm.dbInfo" name="dbInfo" placeholder="Örn: HANA 2.0 In-Memory / Sybase ASE 16 / Oracle 19c" class="form-control" />
              </div>
              <div class="form-group">
                <label>İşletim Sistemi / Platform</label>
                <input type="text" [(ngModel)]="nodeForm.osInfo" name="osInfo" placeholder="Örn: SLES 15 SP7 for SAP / Windows Server 2022" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Protokol / Entegrasyon Türü</label>
                <input type="text" [(ngModel)]="nodeForm.protocol" name="protocol" placeholder="Örn: SAP BTP OData / RFC / HTTPS / JDBC" class="form-control" />
              </div>
              <div class="form-group">
                <label>Sistem Durumu</label>
                <select [(ngModel)]="nodeForm.status" name="status" class="form-control">
                  <option value="Active">Active (Aktif Canlı)</option>
                  <option value="Optimization Candidate">Optimization Candidate</option>
                  <option value="Planned">Planned (Planlandı)</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>
            </div>

            <div class="eos-check-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="nodeForm.isEosRisk" name="isEosRisk" />
                <span class="cb-text">⚠️ Destek Sonu (End of Support / EoS) Riski Var mı?</span>
              </label>
              <div class="eos-date-input" *ngIf="nodeForm.isEosRisk">
                <label>EoS Tarihi:</label>
                <input type="text" [(ngModel)]="nodeForm.eosDate" name="eosDate" placeholder="Örn: 31.12.2025" class="form-control" />
              </div>
            </div>

            <div class="studio-modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeStudioNodeModal()">Vazgeç</button>
              <button type="submit" class="btn btn-primary" [disabled]="!nodeForm.name">
                {{ editingNodeId ? 'Değişiklikleri Kaydet' : 'Bileşeni Haritaya Ekle' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Studio Edge Modal (Create Connection) -->
      <div class="studio-modal-backdrop" *ngIf="showEdgeModal()" (click)="cancelEdgeModal()">
        <div class="studio-modal-card sm" (click)="$event.stopPropagation()">
          <div class="studio-modal-header">
            <div class="header-titles">
              <span class="badge-studio-mode">BAĞLANTI OLUŞTUR</span>
              <h3>İki Sunucu Arasında Akış / Bağlantı Kur</h3>
              <p class="modal-sub">Akış etiketini belirleyerek yönlendirme okunu haritaya ekleyin.</p>
            </div>
            <button class="modal-close-btn" (click)="cancelEdgeModal()">✕</button>
          </div>

          <div class="edge-nodes-preview" *ngIf="connectSourceNode() && pendingTargetNode()">
            <div class="edge-node-badge source">{{ connectSourceNode()?.name }}</div>
            <div class="edge-arrow">➔</div>
            <div class="edge-node-badge target">{{ pendingTargetNode()?.name }}</div>
          </div>

          <form class="studio-form" (ngSubmit)="confirmCreateEdge()">
            <div class="form-group">
              <label>Bağlantı / Akış Etiketi</label>
              <input type="text" [(ngModel)]="edgeForm.label" name="edgeLabel" placeholder="Örn: RFC Akışı ➔, BTP Entegrasyonu ➔, OData ➔" class="form-control" />
            </div>

            <div class="eos-check-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="edgeForm.isEosRisk" name="edgeIsEosRisk" />
                <span class="cb-text">Kritik / Riskli Bağlantı (Kırmızı Uyarı Oku)</span>
              </label>
            </div>

            <div class="studio-modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cancelEdgeModal()">Vazgeç</button>
              <button type="submit" class="btn btn-primary">Bağlantıyı Oluştur</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Studio Manage Edges Modal (List & Delete All Connections) -->
      <div class="studio-modal-backdrop" *ngIf="showManageEdgesModal()" (click)="closeManageEdgesModal()">
        <div class="studio-modal-card sm" (click)="$event.stopPropagation()">
          <div class="studio-modal-header">
            <div class="header-titles">
              <span class="badge-studio-mode">KABLOLARI YÖNET & SİL</span>
              <h3>Bağlantı Kabloları ({{ currentEdges().length }})</h3>
              <p class="modal-sub">İstediğiniz kabloyu silmek için yanındaki kırmızı 'Sil' butonuna tıklayınız.</p>
            </div>
            <button class="modal-close-btn" (click)="closeManageEdgesModal()">✕</button>
          </div>

          <div class="modal-edges-container">
            @if (currentEdges().length === 0) {
              <div class="empty-edges-msg">
                <p>Haritada çizili bağlantı kablosu kalmadı.</p>
              </div>
            } @else {
              <div class="modal-edges-list">
                @for (edge of currentEdges(); track edge.id) {
                  <div class="modal-edge-item">
                    <div class="edge-item-text">
                      <strong class="edge-path">{{ getNodeName(edge.fromId) }} ➔ {{ getNodeName(edge.toId) }}</strong>
                      <span class="edge-sub-tag">{{ edge.label || 'Akış Oku' }}</span>
                      <span class="edge-risk-tag" *ngIf="edge.isEosRisk">⚠️ Riskli</span>
                    </div>
                    <button class="btn btn-sm btn-danger" (click)="deleteEdge(edge, $event)">
                      <app-icon name="trash" [size]="12" color="#dc2626"></app-icon>
                      <span>Sil</span>
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <div class="studio-modal-footer">
            <button type="button" class="btn btn-primary" (click)="closeManageEdgesModal()">Kapat</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-page {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      min-height: calc(100vh - 65px);
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .page-title { font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
      .page-subtitle { margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #6b7280; }
    }

    .mode-toolbar-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);

      .view-mode-toggle-lg {
        display: flex;
        background: #f1f5f9;
        padding: 0.3rem;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        gap: 0.35rem;

        .mode-btn {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 1.1rem;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 800;
          border: none;
          background: transparent;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;

          &.active-asis {
            background: #d97706;
            color: #ffffff;
            box-shadow: 0 3px 10px rgba(217, 119, 6, 0.35);
          }

          &.active-po {
            background: #0284c7;
            color: #ffffff;
            box-shadow: 0 3px 10px rgba(2, 132, 199, 0.35);
          }

          &.active-rise {
            background: #059669;
            color: #ffffff;
            box-shadow: 0 3px 10px rgba(5, 150, 105, 0.35);
          }
        }
      }

      .toolbar-right-actions {
        display: flex;
        align-items: center;
        gap: 0.65rem;
      }
    }

    .transformation-banner {
      border-radius: 8px;
      padding: 0.75rem 1rem;
      background: #fffbe6;
      border: 1px solid #fef08a;

      &.po-mode {
        background: #f0f9ff;
        border-color: #bae6fd;
      }

      &.rise-mode {
        background: #ecfdf5;
        border-color: #a7f3d0;
      }

      .banner-content {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        font-size: 0.82rem;
        line-height: 1.45;

        &.warning { color: #92400e; }
        &.po-info { color: #0369a1; }
        &.excel-success { color: #065f46; background: #ecfdf5; border-color: #a7f3d0; }
        &.success { color: #065f46; }
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      border: none;

      &.btn-secondary { background: #ffffff; color: #374151; border: 1px solid #e5e7eb; }
      &.btn-primary { background: #0284c7; color: #fff; }
      &.btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
      &.btn-sm { padding: 0.3rem 0.6rem; font-size: 0.72rem; }
      &.btn-studio-add {
        background: #0284c7;
        color: #ffffff;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
        &:hover { background: #0369a1; }
      }
      &.btn-studio-save {
        background: #059669;
        color: #ffffff;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
        &:hover { background: #047857; }
      }
      &.btn-studio-connect-active {
        background: #d97706;
        color: #ffffff;
        font-weight: 700;
        animation: pulseOrange 1.5s infinite;
      }
      &.btn-studio-edit {
        background: #e0f2fe;
        color: #0369a1;
        border: 1px solid #bae6fd;
        font-weight: 700;
        &:hover { background: #bae6fd; }
      }
      &.btn-studio-connect {
        background: #fef3c7;
        color: #b45309;
        border: 1px solid #fde68a;
        font-weight: 700;
        &:hover { background: #fde68a; }
      }
    }

    .map-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 1.25rem;
      flex: 1;
    }

    .card-box {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        h3 { margin: 0; font-size: 0.9rem; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 0.35rem; }
        .sub-text { font-size: 0.7rem; color: #6b7280; }
      }
    }

    .sidebar-tab-pills {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      gap: 4px;
      margin-bottom: 0.75rem;

      .s-tab-pill {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        padding: 0.4rem 0.6rem;
        border-radius: 6px;
        border: none;
        background: transparent;
        font-size: 0.74rem;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s ease-in-out;

        &.active {
          background: #ffffff;
          color: #0284c7;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }
      }
    }

    .edges-config-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-height: 480px;
      overflow-y: auto;
      padding-right: 0.2rem;
      margin-bottom: 0.75rem;

      .empty-edges-msg {
        text-align: center;
        padding: 1.5rem 1rem;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;

        p {
          font-size: 0.76rem;
          color: #64748b;
          margin: 0 0 0.65rem 0;
        }
      }

      .edge-list-card {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 0.6rem 0.75rem;
        border-radius: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        transition: all 0.15s;

        &:hover {
          background: #f0f9ff;
          border-color: #bae6fd;
        }

        .edge-info-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;

          .edge-route {
            font-size: 0.78rem;
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .btn-delete-edge {
            background: #fee2e2;
            border: 1px solid #fecdd3;
            color: #dc2626;
            padding: 0.25rem 0.55rem;
            border-radius: 6px;
            font-size: 0.72rem;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            transition: all 0.15s;

            &:hover {
              background: #ef4444;
              border-color: #ef4444;
              color: #ffffff;
            }
          }
        }

        .edge-meta-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;

          .edge-label-tag {
            font-size: 0.7rem;
            color: #0369a1;
            background: #e0f2fe;
            padding: 0.15rem 0.45rem;
            border-radius: 4px;
            font-weight: 600;
          }

          .edge-risk-tag {
            font-size: 0.68rem;
            color: #dc2626;
            background: #fef2f2;
            padding: 0.15rem 0.45rem;
            border-radius: 4px;
            font-weight: 700;
          }
        }
      }
    }

    .node-config-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-height: 480px;
      overflow-y: auto;
      padding-right: 0.2rem;

      .node-item {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        padding: 0.65rem 0.75rem;
        border-radius: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        transition: all 0.15s ease-in-out;

        &.eos-item {
          border-color: #fecdd3;
          background: #fff1f2;
        }

        &:hover, &.selected {
          border-color: #0284c7;
          background: #f0f9ff;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.12);
        }

        .node-header-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .node-name {
            font-size: 0.8rem;
            font-weight: 700;
            color: #0f172a;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .instance-pill-badge {
            font-size: 0.65rem;
            font-weight: 800;
            background: #dc2626;
            color: #ffffff;
            padding: 0.08rem 0.35rem;
            border-radius: 4px;
            flex-shrink: 0;
          }

          .eos-badge {
            font-size: 0.62rem;
            font-weight: 800;
            background: #ef4444;
            color: #ffffff;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
            flex-shrink: 0;
          }
        }

        .node-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.2rem;

          .meta {
            font-size: 0.68rem;
            color: #64748b;
            font-weight: 500;
          }

          .btn-detail-sm {
            font-size: 0.65rem;
            font-weight: 700;
            color: #0284c7;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 4px;
            padding: 0.15rem 0.4rem;
            cursor: pointer;
            &:hover { background: #0284c7; color: #ffffff; }
          }
        }
      }
    }

    .roi-summary-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;

      h4 { margin: 0; font-size: 0.82rem; font-weight: 800; color: #0369a1; display: flex; align-items: center; gap: 0.35rem; }

      .summary-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;

        .s-label { color: #075985; font-weight: 500; }
        .s-val {
          font-weight: 800;
          color: #0f172a;
          &.green { color: #059669; }
          &.red { color: #dc2626; }
        }
      }
    }

    /* FULL HEIGHT CANVAS CONTAINER EXPANDING DOWNWARDS */
    .canvas-container {
      position: relative;
      min-height: 1060px;
      display: flex;
      flex-direction: column;
      flex: 1;

      .canvas-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #f3f4f6;
        padding-bottom: 0.65rem;

        .active-customer-tag {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 700;
          font-size: 0.82rem;
          color: #0284c7;
        }

        .map-legend {
          display: flex;
          gap: 0.75rem;
          font-size: 0.68rem;
          font-weight: 600;

          .legend-dot {
            display: flex;
            align-items: center;
            gap: 0.25rem;

            &::before {
              content: '';
              width: 7px;
              height: 7px;
              border-radius: 50%;
              display: inline-block;
            }

            &.core::before { background: #0284c7; }
            &.btp::before { background: #0284c7; }
            &.instance::before { background: #dc2626; }
            &.eos::before { background: #ef4444; }
          }
        }
      }
    }

    .visual-canvas {
      flex: 1;
      position: relative;
      background: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
      background-size: 22px 22px;
      border-radius: 8px;
      overflow: hidden;
      min-height: 1040px;
      height: 1040px;
      user-select: none;
    }

    .connections-svg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .connection-group {
      cursor: pointer;
      pointer-events: all;

      &:hover {
        .connection-line {
          stroke: #dc2626 !important;
        }
      }
    }

    .connection-hitarea {
      pointer-events: stroke;
      cursor: pointer;
    }

    .connection-line {
      pointer-events: stroke;
      cursor: pointer;
    }

    /* Info Trigger Button for Modal */
    .node-info-trigger-btn {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      color: #0284c7;
      font-size: 0.7rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: all 0.15s;

      &:hover {
        background: #0284c7;
        color: #ffffff;
        border-color: #0284c7;
        transform: scale(1.1);
      }

      &.mini {
        width: 17px;
        height: 17px;
        font-size: 0.62rem;
      }
    }

    .right-badge-group, .header-right-tools {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    /* CLEAN CORPORATE SAP NODE CARD (NO ICON BOX CLUTTER) */
    .canvas-node {
      position: absolute;
      z-index: 10;
      width: 220px;
      background: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.75rem 0.85rem;
      cursor: grab;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
      transition: box-shadow 0.15s, border-color 0.15s;

      &:active, &.is-dragging {
        cursor: grabbing !important;
        box-shadow: 0 12px 30px rgba(2, 132, 199, 0.35) !important;
        border-color: #0284c7 !important;
        z-index: 50 !important;
      }

      &:hover, &.active-selected {
        border-color: #0284c7;
        box-shadow: 0 8px 24px rgba(2, 132, 199, 0.25);
      }

      .c-node-card-body {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        .c-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .c-name {
            font-size: 0.86rem;
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .sap-brand-pill {
            font-size: 0.62rem;
            font-weight: 900;
            background: #0284c7;
            color: #ffffff;
            padding: 0.08rem 0.35rem;
            border-radius: 3px;
            letter-spacing: 0.5px;
          }
        }

        .c-sub-info-pill {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          padding: 0.25rem 0.45rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .c-footer-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.1rem;

          .user-meta { font-size: 0.68rem; font-weight: 600; color: #64748b; }
          .eos-sub-tag {
            font-size: 0.64rem;
            color: #ffffff;
            font-weight: 800;
            background: #dc2626;
            padding: 0.08rem 0.35rem;
            border-radius: 4px;
          }
        }
      }

      /* AS-IS REGULAR NODES: CLEAN WHITE CARD WITH SAP BLUE BORDER */
      &.asis-node {
        background: #ffffff;
        border: 2px solid #0284c7;

        .c-sub-info-pill { background: #f0f9ff; border-color: #bae6fd; color: #0369a1; }
      }

      /* EOS RISK NODES: LIGHT ROSE CARD WITH CRISP RED BORDER */
      &.eos-node {
        border: 2px solid #ef4444;
        background: #fff1f2;

        .c-name { color: #9f1239 !important; }
        .c-sub-info-pill { background: #fef2f2; border-color: #fecdd3; color: #9f1239; }
      }

      /* FLAGSHIP SAP PRIMARY BLUE CORE ERP NODE (250px WIDE) */
      &.core-node {
        width: 250px;
        background: linear-gradient(135deg, #0284c7, #0369a1);
        color: #ffffff;
        border: 2.5px solid #0284c7;
        box-shadow: 0 10px 28px rgba(2, 132, 199, 0.4);

        .c-name { color: #ffffff !important; }
        .sap-brand-pill { background: #ffffff; color: #0284c7; }
        .c-sub-info-pill { background: rgba(255, 255, 255, 0.2); border-color: rgba(255, 255, 255, 0.3); color: #ffffff; }
        .user-meta { color: #e0f2fe !important; }
      }

      /* RED SQUARE INSTANCE BADGE ON BOTTOM-RIGHT MATCHING PPT SLIDE */
      .red-instance-badge {
        position: absolute;
        bottom: -7px;
        right: -7px;
        background: #dc2626;
        color: #ffffff;
        font-weight: 800;
        font-size: 0.72rem;
        width: 22px;
        height: 22px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);
        border: 2px solid #ffffff;
        z-index: 10;
      }
    }

    /* FLAGSHIP RISE WITH SAP S4P CORE CARD (TASK FORCE SAAS DESIGN) */
    .rise-s4p-card {
      position: absolute;
      width: 220px;
      background: #ffffff;
      border: 2px solid #0284c7;
      border-radius: 10px;
      padding: 0.75rem 0.85rem;
      box-shadow: 0 10px 30px rgba(2, 132, 199, 0.18), 0 0 45px rgba(56, 189, 248, 0.28);
      cursor: grab;
      user-select: none;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      z-index: 35;
      transition: transform 0.15s, box-shadow 0.15s;

      &:active, &.is-dragging {
        cursor: grabbing !important;
        transform: scale(1.03);
        box-shadow: 0 14px 36px rgba(2, 132, 199, 0.35) !important;
        z-index: 50 !important;
      }

      .s4p-top-header {
        display: flex;
        align-items: center;
        gap: 0.45rem;

        .s4p-badge-icon {
          width: 28px;
          height: 28px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .s4p-title-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          line-height: 1.15;

          .s4p-main-title {
            font-size: 0.95rem;
            font-weight: 800;
            color: #0f172a;
          }

          .s4p-edition-tag {
            font-size: 0.65rem;
            color: #0284c7;
            font-weight: 700;
          }
        }

        .s4p-pulse-indicator {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
        }
      }

      .s4p-core-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.35rem 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;

        .core-layer {
          font-size: 0.75rem;
          font-weight: 800;
          color: #1e293b;
        }

        .fiori-layer {
          font-size: 0.68rem;
          font-weight: 600;
          color: #64748b;
        }
      }

      .rise-brand-pill {
        background: #0f172a;
        color: #ffffff;
        border-radius: 6px;
        padding: 0.35rem 0.55rem;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .rise-pill-left {
          display: flex;
          align-items: center;
          gap: 0.35rem;

          .rise-txt {
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.02em;
          }
        }

        .rise-status {
          font-size: 0.62rem;
          background: rgba(56, 189, 248, 0.2);
          color: #38bdf8;
          padding: 0.08rem 0.35rem;
          border-radius: 4px;
          font-weight: 700;
        }
      }

      .s4p-os-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.66rem;
        color: #475569;
        font-weight: 600;
        padding: 0 0.15rem;

        .db-spec {
          color: #0284c7;
          font-weight: 700;
        }
      }
    }

    /* MODERN RISE SERVICE CARDS (CS, WebDisp, CI) */
    .rise-service-card {
      position: absolute;
      width: 140px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.65rem 0.75rem;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
      cursor: grab;
      user-select: none;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      z-index: 25;
      transition: all 0.15s;

      &:hover {
        border-color: #0284c7;
        box-shadow: 0 6px 18px rgba(2, 132, 199, 0.18);
      }

      &:active, &.is-dragging {
        cursor: grabbing !important;
        transform: scale(1.05);
        border-color: #0284c7;
        box-shadow: 0 10px 25px rgba(2, 132, 199, 0.3) !important;
        z-index: 50 !important;
      }

      .service-top-row {
        display: flex;
        align-items: center;
        gap: 0.35rem;

        .svc-icon-box {
          width: 22px;
          height: 22px;
          background: #f0f9ff;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-name {
          font-size: 0.84rem;
          font-weight: 800;
          color: #0f172a;
          flex: 1;
        }

        .sap-mini-tag {
          font-size: 0.58rem;
          font-weight: 900;
          background: #0284c7;
          color: #ffffff;
          padding: 0.06rem 0.25rem;
          border-radius: 3px;
        }
      }

      .service-role-text {
        font-size: 0.68rem;
        color: #64748b;
        font-weight: 600;
        line-height: 1.2;
      }

      .service-btp-badge {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 4px;
        padding: 0.2rem 0.4rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.66rem;
        font-weight: 700;
        color: #0369a1;

        .btp-dot {
          width: 5px;
          height: 5px;
          background: #0284c7;
          border-radius: 50%;
        }
      }
    }

    /* BEAUTIFIED TASK FORCE SAAS SIZING & CAPACITY PANEL (RIGHT SIDE) */
    .rise-side-table-panel {
      position: absolute;
      top: 25px;
      right: 25px;
      width: 440px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      overflow: hidden;
      z-index: 40;
      display: flex;
      flex-direction: column;

      .panel-header {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .panel-title-area {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .panel-icon {
            width: 30px;
            height: 30px;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .panel-title {
            margin: 0;
            font-size: 0.84rem;
            font-weight: 800;
            color: #0f172a;
          }

          .panel-sub {
            font-size: 0.68rem;
            color: #64748b;
            font-weight: 500;
          }
        }

        .spec-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: #0284c7;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }
      }

      .table-container {
        padding: 0;
        max-height: 280px;
        overflow-y: auto;

        .sizing-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.74rem;

          thead th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            padding: 0.5rem 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          tbody tr {
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.1s;

            &:hover {
              background: #f8fafc;
            }

            td {
              padding: 0.45rem 0.75rem;
              vertical-align: middle;
            }

            .prod-cell {
              display: flex;
              align-items: center;
              gap: 0.35rem;

              .p-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;

                &.db { background: #0284c7; }
                &.app { background: #8b5cf6; }
              }

              strong {
                color: #1e293b;
                font-size: 0.75rem;
              }
            }

            .spec-badge {
              display: inline-block;
              padding: 0.12rem 0.4rem;
              border-radius: 4px;
              font-weight: 700;
              font-size: 0.7rem;

              &.cur {
                background: #f1f5f9;
                color: #475569;
                border: 1px solid #cbd5e1;
              }

              &.target {
                background: #ecfdf5;
                color: #047857;
                border: 1px solid #a7f3d0;
              }
            }
          }
        }
      }

      .panel-footer {
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        padding: 0.55rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .stat-summary {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.7rem;

          .f-label { color: #64748b; }
          .f-val { color: #0284c7; font-weight: 800; }
        }
      }
    }

    .node-detail-bar {
      margin-top: 0.65rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 0.55rem 0.85rem;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .d-info {
        display: flex;
        flex-direction: column;
        strong { font-size: 0.78rem; color: #0369a1; }
        span { font-size: 0.7rem; color: #075985; }
        .eos-warning-text { color: #dc2626; font-weight: 700; font-size: 0.72rem; margin-top: 0.15rem; }
      }

      .d-actions { display: flex; gap: 0.35rem; }
    }

    /* RISE COMPARISON TABLE STYLING */
    .rise-comparison-table-card {
      margin-top: 1rem;
      border-color: #a7f3d0;
      background: #ecfdf5;

      .card-header h3 { color: #047857; }
    }

    .table-responsive { overflow-x: auto; }

    .rise-compare-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;

      th {
        background: #f8fafc;
        padding: 0.65rem 0.85rem;
        text-align: left;
        font-weight: 800;
        color: #334155;
        border-bottom: 2px solid #e2e8f0;
      }

      td {
        padding: 0.65rem 0.85rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      .badge-red { background: #fee2e2; color: #dc2626; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.7rem; }
      .badge-eos { background: #ef4444; color: #ffffff; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.68rem; }
      .text-teal { color: #047857; font-weight: 800; }
    }

    /* PO INTEGRATION NODE CARDS (CANVAS) */
    .po-toolbar {
      background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
      border: 1.5px solid #bae6fd;
      padding: 0.75rem 1.25rem;

      .po-toolbar-badge-group {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.45rem;

        .po-main-tag {
          font-weight: 800;
          font-size: 0.82rem;
          color: #0369a1;
          margin-right: 0.35rem;
        }

        .po-stat-pill {
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;

          &.green { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
          &.blue { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
          &.purple { background: #fdf4ff; color: #7e22ce; border: 1px solid #f5d0fe; }
          &.gray { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
          &.dark { background: #0f172a; color: #ffffff; }
        }
      }
    }

    .po-node-card {
      position: absolute;
      width: 235px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.75rem 0.85rem;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
      cursor: grab;
      user-select: none;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      z-index: 25;
      transition: all 0.15s;

      &:hover {
        border-color: #0284c7;
        box-shadow: 0 6px 18px rgba(2, 132, 199, 0.18);
      }

      &:active, &.is-dragging {
        cursor: grabbing !important;
        transform: scale(1.05);
        border-color: #0284c7;
        box-shadow: 0 10px 25px rgba(2, 132, 199, 0.3) !important;
        z-index: 50 !important;
      }

      &.po-hub-card {
        width: 250px;
        border: 2px solid #0284c7;
        background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
        box-shadow: 0 6px 20px rgba(2, 132, 199, 0.15);
      }

      &.po-outbound-card {
        border-left: 4px solid #059669;
      }

      &.po-inbound-card {
        border-left: 4px solid #0284c7;
      }

      &.po-sync-card {
        border-left: 4px solid #7e22ce;
      }

      .po-badge-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.3rem;

        .po-role-pill {
          font-size: 0.62rem;
          font-weight: 800;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.02em;

          &.outbound { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
          &.inbound { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
          &.sync { background: #fdf4ff; color: #7e22ce; border: 1px solid #f5d0fe; }
          &.hub { background: #0284c7; color: #ffffff; }
        }

        .po-server-count-pill {
          font-size: 0.62rem;
          font-weight: 800;
          color: #334155;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 0.08rem 0.35rem;
          border-radius: 4px;
        }
      }

      .po-card-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .po-title-line {
          display: flex;
          align-items: center;
          gap: 0.35rem;

          .po-name-text {
            font-size: 0.78rem;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.25;
          }
        }

        .po-proto-pill {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 0.15rem 0.35rem;
          overflow: hidden;

          code {
            font-size: 0.62rem;
            color: #475569;
            font-family: monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
          }
        }

        .po-role-hint-row {
          .hint-txt {
            font-size: 0.64rem;
            color: #64748b;
            font-weight: 600;
          }
        }
      }
    }

    /* PO INTEGRATION TABLE & SERVER SUMMARY */
    .po-integration-table-card {
      margin-top: 1rem;
      border-color: #cbd5e1;

      .po-table-title-group {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
        }

        h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
        }

        .c-sub {
          font-size: 0.72rem;
          color: #64748b;
        }
      }

      .badge-source-file {
        font-size: 0.68rem;
        font-weight: 700;
        color: #0284c7;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        padding: 0.18rem 0.55rem;
        border-radius: 4px;
      }
    }

    .po-server-summary-bar {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;

      .ps-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.74rem;

        .ps-lbl { color: #64748b; font-weight: 500; }
        .ps-val { font-weight: 800; }
        .text-blue { color: #0284c7; }
        .text-emerald { color: #059669; }
        .text-purple { color: #7e22ce; }
        .text-dark { color: #0f172a; font-size: 0.84rem; }

        &.highlight {
          background: #f0fdf4;
          border: 1px solid #a7f3d0;
          padding: 0.25rem 0.65rem;
          border-radius: 6px;
        }
      }
    }

    .po-excel-table {
      .iface-code {
        font-family: monospace;
        font-size: 0.74rem;
        color: #0f172a;
      }

      .iface-desc {
        font-size: 0.74rem;
        color: #1e293b;
        font-weight: 500;
      }

      .role-badge {
        display: inline-block;
        font-size: 0.68rem;
        font-weight: 800;
        padding: 0.12rem 0.45rem;
        border-radius: 4px;

        &.outbound { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        &.inbound { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
        &.sync { background: #fdf4ff; color: #7e22ce; border: 1px solid #f5d0fe; }
      }

      .flow-path {
        font-size: 0.72rem;
        color: #475569;
      }

      .proto-tag {
        font-size: 0.68rem;
        color: #64748b;
        background: #f1f5f9;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        font-family: monospace;
      }

      .server-pill {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        color: #334155;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 0.1rem 0.45rem;
        border-radius: 4px;
      }

      .status-live-pill {
        display: inline-block;
        font-size: 0.66rem;
        font-weight: 800;
        color: #059669;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
      }

      tr.row-outbound {
        background: #fcfffd;
      }

      tr.row-inbound {
        background: #fafcff;
      }

      .type-pill {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        background: #f1f5f9;
        color: #475569;

        &.sync {
          background: #fdf4ff;
          color: #7e22ce;
          border: 1px solid #f5d0fe;
        }
      }

      .om-tag {
        font-family: monospace;
        font-size: 0.68rem;
        color: #475569;
      }
    }

    .po-filter-toolbar {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;

      .search-box {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 0.35rem 0.65rem;

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.76rem;
          color: #0f172a;
          width: 100%;

          &::placeholder { color: #94a3b8; }
        }

        .clear-btn {
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 0.72rem;
          cursor: pointer;
        }
      }

      .filter-pills-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;

        .f-pill {
          padding: 0.25rem 0.55rem;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          border-radius: 5px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;

          &:hover { color: #0284c7; border-color: #0284c7; }

          &.active {
            background: #0284c7;
            border-color: #0284c7;
            color: #ffffff;
          }

          &.pill-green.active {
            background: #059669;
            border-color: #059669;
            color: #ffffff;
          }

          &.pill-blue.active {
            background: #0284c7;
            border-color: #0284c7;
            color: #ffffff;
          }

          &.pill-purple.active {
            background: #7e22ce;
            border-color: #7e22ce;
            color: #ffffff;
          }
        }
      }
    }

    .po-table-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 0.55rem 0.85rem;
      font-size: 0.72rem;
      color: #64748b;
    }

    /* RICH SYSTEM DETAILS MODAL STYLING */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 12px;
      width: 100%;
      max-width: 680px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalFadeIn 0.2s ease-out;

      .modal-header {
        padding: 1.25rem 1.5rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;

        .m-title-area {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;

          .m-category-badge {
            font-size: 0.65rem;
            font-weight: 800;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .m-name { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
          .sap-brand-lg { font-size: 0.72rem; color: #64748b; font-weight: 600; }
        }

        .modal-close-btn {
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          &:hover { background: #e2e8f0; color: #0f172a; }
        }
      }

      .modal-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.1rem;

        .eos-alert-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;

          .eos-alert-text {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            strong { color: #9f1239; font-size: 0.85rem; }
            p { margin: 0; font-size: 0.78rem; color: #be123c; line-height: 1.45; }
            .action-tag { font-size: 0.75rem; font-weight: 700; color: #047857; background: #ecfdf5; padding: 0.35rem 0.65rem; border-radius: 5px; margin-top: 0.35rem; }
          }
        }

        .rise-benefit-box {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;

          .rise-alert-text {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            strong { color: #047857; font-size: 0.85rem; }
            p { margin: 0; font-size: 0.78rem; color: #065f46; line-height: 1.45; }
          }
        }

        .specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem;

          .spec-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.85rem;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .s-label { font-size: 0.7rem; color: #64748b; font-weight: 600; }
            .s-value {
              font-size: 0.85rem;
              color: #0f172a;
              font-weight: 800;

              &.highlight-red { color: #dc2626; }
            }
          }
        }
      }

      .modal-footer {
        padding: 1rem 1.5rem;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
      }
    }

    /* Studio Floating Banners & Notifications */
    .canvas-floating-banner {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      padding: 0.6rem 1.25rem;
      border-radius: 30px;
      box-shadow: 0 8px 24px rgba(2, 132, 199, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.3);
      animation: bannerSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      .banner-inner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.84rem;

        .banner-prompt {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          strong { color: #fef08a; font-weight: 800; }
        }

        .btn-banner-cancel {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: #ffffff;
          border-radius: 20px;
          padding: 0.25rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: #ef4444;
            border-color: #ef4444;
          }
        }
      }
    }

    .canvas-floating-toast {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      background: #0f172a;
      color: #ffffff;
      padding: 0.55rem 1.15rem;
      border-radius: 24px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      gap: 0.55rem;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid #334155;
      animation: bannerSlideDown 0.25s ease-out;
    }

    /* Node Quick Actions Toolbar on Hover */
    .node-quick-actions {
      position: absolute;
      top: -14px;
      right: 6px;
      display: none;
      align-items: center;
      gap: 3px;
      background: #ffffff;
      padding: 2px 4px;
      border-radius: 14px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      border: 1px solid #cbd5e1;
      z-index: 30;

      .qa-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 5px;
        font-size: 0.72rem;
        border-radius: 10px;
        transition: all 0.15s;

        &.edit:hover { background: #e0f2fe; }
        &.link:hover { background: #fef3c7; }
        &.delete:hover { background: #fee2e2; color: #dc2626; }
      }
    }

    .canvas-node:hover .node-quick-actions,
    .rise-s4p-card:hover .node-quick-actions,
    .rise-service-card:hover .node-quick-actions,
    .po-node-card:hover .node-quick-actions {
      display: flex;
    }

    /* Connecting Mode Highlight Styles */
    .connecting-selectable {
      cursor: crosshair !important;
      outline: 2px dashed #0284c7 !important;
      outline-offset: 3px;
      animation: pulseConnecting 2s infinite;

      &:hover {
        transform: scale(1.03);
        outline-color: #059669 !important;
      }
    }

    .connecting-source {
      outline: 3px solid #d97706 !important;
      box-shadow: 0 0 16px rgba(217, 119, 6, 0.45) !important;
    }

    .modal-edges-container {
      padding: 1.25rem 1.5rem;
      max-height: 400px;
      overflow-y: auto;

      .modal-edges-list {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .modal-edge-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.65rem 0.85rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        transition: all 0.15s;

        &:hover {
          background: #f0f9ff;
          border-color: #bae6fd;
        }

        .edge-item-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .edge-path {
            font-size: 0.82rem;
            color: #0f172a;
          }

          .edge-sub-tag {
            font-size: 0.72rem;
            color: #0369a1;
            background: #e0f2fe;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
            font-weight: 600;
          }

          .edge-risk-tag {
            font-size: 0.7rem;
            color: #dc2626;
            background: #fee2e2;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
            font-weight: 700;
          }
        }
      }
    }

    /* Studio Modals (Node & Edge) */
    .studio-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .studio-modal-card {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 620px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
      border: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      animation: modalFadeIn 0.2s ease-out;

      &.sm { max-width: 480px; }

      .studio-modal-header {
        padding: 1.25rem 1.5rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;

        .badge-studio-mode {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: #e0f2fe;
          color: #0284c7;
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          margin-bottom: 0.3rem;

          &.edit-mode {
            background: #fef3c7;
            color: #b45309;
          }
        }

        h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
        }

        .modal-sub {
          margin: 0.2rem 0 0 0;
          font-size: 0.78rem;
          color: #64748b;
        }

        .modal-close-btn {
          background: #f1f5f9;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          font-size: 0.9rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          &:hover { background: #e2e8f0; color: #0f172a; }
        }
      }

      .presets-section {
        padding: 0.85rem 1.5rem;
        background: #f0fdf4;
        border-bottom: 1px solid #bbf7d0;

        .presets-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #15803d;
          margin-bottom: 0.45rem;
        }

        .preset-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;

          .preset-chip {
            background: #ffffff;
            border: 1px solid #86efac;
            color: #166534;
            padding: 0.3rem 0.65rem;
            border-radius: 6px;
            font-size: 0.74rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;

            &:hover {
              background: #16a34a;
              color: #ffffff;
              border-color: #16a34a;
              transform: translateY(-1px);
            }
          }
        }
      }

      .studio-form {
        padding: 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .form-row {
          display: flex;
          gap: 0.85rem;
        }

        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;

          &.flex-2 { flex: 2; }
          &.flex-1 { flex: 1; }

          label {
            font-size: 0.75rem;
            font-weight: 700;
            color: #334155;

            .req { color: #dc2626; }
          }

          .form-control {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-size: 0.82rem;
            color: #0f172a;
            outline: none;
            box-sizing: border-box;

            &:focus {
              border-color: #0284c7;
              box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
            }
          }
        }

        .eos-check-group {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;

            .cb-text {
              font-size: 0.8rem;
              font-weight: 700;
              color: #9f1239;
            }
          }

          .eos-date-input {
            display: flex;
            align-items: center;
            gap: 0.65rem;
            margin-top: 0.25rem;

            label {
              font-size: 0.75rem;
              font-weight: 700;
              color: #be123c;
              white-space: nowrap;
            }

            .form-control {
              padding: 0.35rem 0.6rem;
              border: 1px solid #fda4af;
              border-radius: 6px;
              font-size: 0.78rem;
            }
          }
        }

        .studio-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.65rem;
          padding-top: 0.85rem;
          border-top: 1px solid #f1f5f9;
          margin-top: 0.5rem;
        }
      }

      /* Edge Nodes Flow Preview in Modal */
      .edge-nodes-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.85rem;
        padding: 0.85rem 1.5rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;

        .edge-node-badge {
          padding: 0.4rem 0.85rem;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 800;

          &.source {
            background: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
          }

          &.target {
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
          }
        }

        .edge-arrow {
          font-size: 1.1rem;
          font-weight: 800;
          color: #64748b;
        }
      }
    }

    @keyframes bannerSlideDown {
      from { opacity: 0; transform: translate(-50%, -10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    @keyframes pulseConnecting {
      0%, 100% { outline-color: #0284c7; }
      50% { outline-color: #38bdf8; }
    }

    @keyframes pulseOrange {
      0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.4); }
      50% { box-shadow: 0 0 0 6px rgba(217, 119, 6, 0); }
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ArchitectureMapComponent {
  customerService = inject(CustomerService);
  importService = inject(DataImportService);
  route = inject(ActivatedRoute);

  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLDivElement>;

  // Architecture Mode: AS-IS (Mevcut 11 Sunucu) vs RISE (Hedef) vs PO (Excel Entegrasyonlar)
  architectureMode = signal<'asis' | 'po' | 'rise'>('asis');
  excelImportSuccess = signal<boolean>(false);
  // Core ERP Center Node Position matching PPT Slide 3 (Spaced Out)
  coreNode = { x: 520, y: 160 };

  // AS-IS Architecture Nodes Spaced Out Roomily across canvas
  asisNodes: ArchitectureNode[] = [
    { 
      id: 'node-po', 
      name: 'PO 7.5', 
      category: 'Integration', 
      userCount: 10, 
      instanceCount: 3, 
      dbInfo: 'Sybase 16 • Win 2019', 
      status: 'Active', 
      x: 160, 
      y: 160, 
      iconName: 'layers', 
      color: '#0284c7', 
      protocol: '10+ Live PO JDBC/SOAP (3 Sunucu)' 
    },
    { 
      id: 'node-core', 
      name: 'ERP EHP7 (SAP 1503 SFinancials)', 
      category: 'Core', 
      userCount: 380, 
      instanceCount: 3, 
      dbInfo: 'SLES 15 SP7 for SAP', 
      status: 'Active', 
      x: 520, 
      y: 160, 
      iconName: 'database', 
      color: '#0284c7', 
      protocol: 'SLES 15 SP7 (3 Sunucu)' 
    },
    { 
      id: 'node-fiori-eos', 
      name: 'Fiori S4H 1511 (FES 200)', 
      category: 'Legacy', 
      userCount: 200, 
      instanceCount: 2, 
      dbInfo: 'Sybase 16 • Win 2019', 
      status: 'Optimization Candidate', 
      x: 880, 
      y: 160, 
      iconName: 'users', 
      color: '#ef4444', 
      protocol: 'NW 7.5 FES 200 (2 Sunucu)', 
      isEosRisk: true, 
      eosDate: '31.12.2020' 
    },
    { 
      id: 'node-cs-eos', 
      name: 'CS 6.5 (Content Server)', 
      category: 'Legacy', 
      userCount: 1, 
      instanceCount: 1, 
      dbInfo: 'MaxDB 7.9 • Win 2019', 
      status: 'Optimization Candidate', 
      x: 200, 
      y: 490, 
      iconName: 'file-text', 
      color: '#ef4444', 
      protocol: 'HTTP Archive (1 Sunucu)', 
      isEosRisk: true, 
      eosDate: '31.12.2020' 
    },
    { 
      id: 'node-webdisp', 
      name: 'WebDisp (Web Dispatcher)', 
      category: 'Integration', 
      userCount: 2, 
      instanceCount: 2, 
      dbInfo: 'Windows 2019', 
      status: 'Active', 
      x: 700, 
      y: 490, 
      iconName: 'cloud', 
      color: '#f59e0b', 
      protocol: 'HTTPS Reverse Proxy (2 Sunucu)' 
    }
  ];

  // AS-IS Connection Edges matching PowerPoint Slide 3 ARROW DIRECTIONS exactly
  asisEdges: ArchitectureEdge[] = [
    { id: 'e1', fromId: 'node-po', toId: 'node-core', label: 'PO Entegrasyonu ➔' },
    { id: 'e2', fromId: 'node-cs-eos', toId: 'node-core', label: 'ArchiveLink ➔', isEosRisk: true },
    { id: 'e3', fromId: 'node-webdisp', toId: 'node-core', label: 'Reverse Proxy ➔' },
    { id: 'e4', fromId: 'node-webdisp', toId: 'node-fiori-eos', label: 'Fiori Trafik ➔', isEosRisk: true }
  ];

  // Excel ABC Sigorta PO Live Integration Interfaces Nodes (Extracted from ABC_Sigorta_PO_Entegrasyon_Listesi.xlsx)
  poNodes: ArchitectureNode[] = [
    // MERKEZİ HUB
    { 
      id: 'node-core', 
      name: 'SAP PO 7.5 (Process Orchestration)', 
      category: 'Core', 
      userCount: 10, 
      instanceCount: 3, 
      dbInfo: 'Sybase ASE 16 • Windows Server 2019', 
      status: 'Active', 
      x: 520, 
      y: 280, 
      iconName: 'layers', 
      color: '#0284c7', 
      protocol: 'Central Integration Hub (ESR & Integration Directory)',
      role: 'hub',
      roleLabel: 'Merkezi Entegrasyon Hub',
      serverCountLabel: '3 Sunucu (Dev, QA, Prod)'
    },

    // SOL SÜTUN: VERİCİ (OUTBOUND) KONUMDASINIZ (SAP ➔ DIŞ KURUMLAR - GENİŞ BOŞLUKLU DİZİLİM)
    { 
      id: 'node-a-bankasi', 
      name: 'A Bankası Online Ödeme Gateway', 
      category: 'Integration', 
      userCount: 5, 
      instanceCount: 2,
      dbInfo: 'SOAP ➔ HTTP WebService', 
      status: 'Active', 
      x: 180, 
      y: 80, 
      iconName: 'bolt', 
      color: '#059669', 
      protocol: 'SI_OUT_SYNC_MakeOnlineProcessMoney',
      role: 'outbound',
      roleLabel: 'Verici (Outbound) Konumdasınız',
      serverCountLabel: '2 Sunucu (Aktif/Pasif)'
    },
    { 
      id: 'node-winsure', 
      name: 'WINSURE Hasar Transferi', 
      category: 'Integration', 
      userCount: 12, 
      instanceCount: 2,
      dbInfo: 'SAP ➔ WINSURE XML/XSLT', 
      status: 'Active', 
      x: 180, 
      y: 230, 
      iconName: 'shield', 
      color: '#059669', 
      protocol: 'SI_OUT_SYNC_ClaimTransfer',
      role: 'outbound',
      roleLabel: 'Verici (Outbound) Konumdasınız',
      serverCountLabel: '2 Sunucu (Prod/QA)'
    },
    { 
      id: 'node-f110', 
      name: 'F110 Otomatik Ödeme Sync', 
      category: 'Integration', 
      userCount: 8, 
      instanceCount: 1,
      dbInfo: 'SOAP ➔ JDBC Database', 
      status: 'Active', 
      x: 180, 
      y: 380, 
      iconName: 'database', 
      color: '#059669', 
      protocol: 'SI_OUT_SYNC_FI_SAP_F110_DATA',
      role: 'outbound',
      roleLabel: 'Verici (Outbound) Konumdasınız',
      serverCountLabel: '1 Sunucu (Prod)'
    },
    { 
      id: 'node-fatura', 
      name: 'Fatura Kesin Kayıt Gateway', 
      category: 'Integration', 
      userCount: 15, 
      instanceCount: 2,
      dbInfo: 'SOAP ➔ WebService API', 
      status: 'Active', 
      x: 180, 
      y: 530, 
      iconName: 'file-text', 
      color: '#059669', 
      protocol: 'SI_OUT_SYNC_KESIN_KAYIT',
      role: 'outbound',
      roleLabel: 'Verici (Outbound) Konumdasınız',
      serverCountLabel: '2 Sunucu (Aktif/Pasif)'
    },
    { 
      id: 'node-satici', 
      name: 'Satıcı & Banka Doğrulama', 
      category: 'Integration', 
      userCount: 6, 
      instanceCount: 1,
      dbInfo: 'SOAP ➔ JDBC Database', 
      status: 'Active', 
      x: 180, 
      y: 680, 
      iconName: 'cart', 
      color: '#059669', 
      protocol: 'SI_OUT_SYNC_SAP_SATICI_BANKA',
      role: 'outbound',
      roleLabel: 'Verici (Outbound) Konumdasınız',
      serverCountLabel: '1 Sunucu (Prod)'
    },
    { 
      id: 'node-butce', 
      name: 'Bütçe & Masraf Merkezi KO', 
      category: 'Integration', 
      userCount: 4, 
      instanceCount: 1,
      dbInfo: 'SOAP ➔ JDBC Database', 
      status: 'Active', 
      x: 180, 
      y: 830, 
      iconName: 'chart', 
      color: '#059669', 
      protocol: 'SI_OUT_SYNC_SAP_BUTCE_KO',
      role: 'outbound',
      roleLabel: 'Verici (Outbound) Konumdasınız',
      serverCountLabel: '1 Sunucu (Prod)'
    },

    // SAĞ SÜTUN: ALICI (INBOUND) KONUMDASINIZ (DIŞ KURUMLAR ➔ SAP - GENİŞ BOŞLUKLU DİZİLİM)
    { 
      id: 'node-mt940', 
      name: 'Banka Hesap Ekstresi (MT940)', 
      category: 'Integration', 
      userCount: 20, 
      instanceCount: 2,
      dbInfo: 'SFTP ➔ SAP Inbound RFC', 
      status: 'Active', 
      x: 880, 
      y: 160, 
      iconName: 'database', 
      color: '#0284c7', 
      protocol: 'SI_IN_SYNC_BankStatement_MT940',
      role: 'inbound',
      roleLabel: 'Alıcı (Inbound) Konumdasınız',
      serverCountLabel: '2 Sunucu (Aktif/Pasif)'
    },
    { 
      id: 'node-police', 
      name: 'Acente Poliçe & Tahsilat', 
      category: 'Integration', 
      userCount: 30, 
      instanceCount: 2,
      dbInfo: 'REST API ➔ RFC Inbound', 
      status: 'Active', 
      x: 880, 
      y: 450, 
      iconName: 'shield', 
      color: '#0284c7', 
      protocol: 'SI_IN_SYNC_PolicyProduction',
      role: 'inbound',
      roleLabel: 'Alıcı (Inbound) Konumdasınız',
      serverCountLabel: '2 Sunucu (Gateway/App)'
    },
    { 
      id: 'node-efatura-in', 
      name: 'Gelen E-Fatura & E-İrsaliye', 
      category: 'Integration', 
      userCount: 25, 
      instanceCount: 1,
      dbInfo: 'SOAP ➔ SAP MM/FI Inbound', 
      status: 'Active', 
      x: 880, 
      y: 740, 
      iconName: 'file-text', 
      color: '#0284c7', 
      protocol: 'SI_IN_SYNC_EFATURA_RECEIVE',
      role: 'inbound',
      roleLabel: 'Alıcı (Inbound) Konumdasınız',
      serverCountLabel: '1 Sunucu (Prod)'
    },

    // ALT: İKİ YÖNLÜ (SENKRON) ENTEGRASYON
    { 
      id: 'node-cust-search', 
      name: 'Müşteri & TC Kimlik Sorgulama', 
      category: 'Integration', 
      userCount: 50, 
      instanceCount: 2,
      dbInfo: 'SAP RFC ⇄ NVI / GİB API', 
      status: 'Active', 
      x: 530, 
      y: 930, 
      iconName: 'search', 
      color: '#7e22ce', 
      protocol: 'SI_SYNC_CUSTOMER_SEARCH',
      role: 'sync',
      roleLabel: 'İki Yönlü (Senkron)',
      serverCountLabel: '2 Sunucu (Cluster)'
    }
  ];

  // Connection Edges with Directional Flow Markers
  poEdges: ArchitectureEdge[] = [
    // Verici (Outbound): SAP PO Hub ➔ Dış Sistemler
    { id: 'pe1', fromId: 'node-core', toId: 'node-a-bankasi', label: 'Verici (Outbound) ➔' },
    { id: 'pe2', fromId: 'node-core', toId: 'node-winsure', label: 'Verici (Outbound) ➔' },
    { id: 'pe3', fromId: 'node-core', toId: 'node-f110', label: 'Verici (Outbound) ➔' },
    { id: 'pe4', fromId: 'node-core', toId: 'node-fatura', label: 'Verici (Outbound) ➔' },
    { id: 'pe5', fromId: 'node-core', toId: 'node-satici', label: 'Verici (Outbound) ➔' },
    { id: 'pe6', fromId: 'node-core', toId: 'node-butce', label: 'Verici (Outbound) ➔' },

    // Alıcı (Inbound): Dış Sistemler ➔ SAP PO Hub
    { id: 'pe7', fromId: 'node-mt940', toId: 'node-core', label: 'Alıcı (Inbound) ➔' },
    { id: 'pe8', fromId: 'node-police', toId: 'node-core', label: 'Alıcı (Inbound) ➔' },
    { id: 'pe9', fromId: 'node-efatura-in', toId: 'node-core', label: 'Alıcı (Inbound) ➔' },

    // İki Yönlü Senkron
    { id: 'pe10', fromId: 'node-core', toId: 'node-cust-search', label: 'Senkron (Çift Yönlü) ⇄' }
  ];

  // Full ABC_Sigorta_PO_Entegrasyon_Listesi Excel Interfaces Data Table (109 Live Interfaces)
  poIntegrationInterfaces = PO_INTERFACES_DATA;

  poSearchQuery = '';
  poFilter = signal<string>('ALL');

  filteredPoInterfaces = computed(() => {
    let list = this.poIntegrationInterfaces;
    const filter = this.poFilter();
    const query = this.poSearchQuery.trim().toLowerCase();

    if (filter === 'OUTBOUND') {
      list = list.filter(i => i.role === 'outbound');
    } else if (filter === 'INBOUND') {
      list = list.filter(i => i.role === 'inbound');
    } else if (filter === 'SYNC') {
      list = list.filter(i => i.type === 'Synchronous');
    } else if (filter === 'ASYNC') {
      list = list.filter(i => i.type === 'Asynchronous');
    } else if (filter === 'JDBC' || filter === 'SOAP' || filter === 'RFC' || filter === 'REST' || filter === 'SFTP') {
      list = list.filter(i => i.protocol.includes(filter) || i.senderAdapter.includes(filter) || i.receiverAdapter.includes(filter));
    }

    if (query) {
      list = list.filter(i => 
        i.name.toLowerCase().includes(query) || 
        i.sender.toLowerCase().includes(query) || 
        i.receiver.toLowerCase().includes(query) || 
        i.protocol.toLowerCase().includes(query) || 
        i.scenario.toLowerCase().includes(query)
      );
    }

    return list;
  });

  // Current Active Nodes & Edges Signals
  nodes = signal<ArchitectureNode[]>(this.asisNodes);
  edges = signal<ArchitectureEdge[]>(this.asisEdges);
  selectedNode = signal<ArchitectureNode | null>(null);

  // Smooth Window-Level Dragging State
  draggingNodeId: string | null = null;
  currentEdges = signal<ArchitectureEdge[]>(this.asisEdges);
  detailModalNode = signal<ArchitectureNode | null>(null);
  activeSidebarTab = signal<'nodes' | 'edges'>('nodes');

  // Studio Interactive Canvas State
  showStudioNodeModal = signal<boolean>(false);
  editingNodeId: string | null = null;
  nodeForm: {
    name: string;
    instanceCount: number;
    category: ArchitectureNode['category'];
    userCount: number;
    dbInfo: string;
    osInfo: string;
    status: ArchitectureNode['status'];
    protocol: string;
    isEosRisk: boolean;
    eosDate: string;
  } = {
    name: '',
    instanceCount: 1,
    category: 'Core',
    userCount: 50,
    dbInfo: 'HANA 2.0 In-Memory',
    osInfo: 'SLES 15 SP7 for SAP',
    status: 'Active',
    protocol: 'SAP BTP OData / RFC',
    isEosRisk: false,
    eosDate: ''
  };

  isConnectingMode = signal<boolean>(false);
  connectSourceNode = signal<ArchitectureNode | null>(null);
  pendingTargetNode = signal<ArchitectureNode | null>(null);
  showEdgeModal = signal<boolean>(false);
  edgeForm = {
    label: '',
    isEosRisk: false
  };

  studioToastMessage = signal<string | null>(null);
  showManageEdgesModal = signal<boolean>(false);
  private toastTimeout: any = null;

  constructor() {
    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      if (mode && (mode === 'asis' || mode === 'po' || mode === 'rise')) {
        this.setArchitectureMode(mode);
      }
    });

    // Reactive Effect: Automatically draws diagram when an Excel file is uploaded!
    effect(() => {
      const recs = this.importService.records();
      if (recs && recs.length > 0) {
        const custom = this.importService.getDiagramFromUploadedExcel();
        if (custom.nodes && custom.nodes.length > 0) {
          this.nodes.set(custom.nodes);
          this.currentEdges.set(custom.edges);
          this.excelImportSuccess.set(true);
          
          if (this.importService.importCategory() === 'po' || this.importService.uploadedFileName().toLowerCase().includes('po')) {
            this.architectureMode.set('po');
          }
        }
      }
    });
  }

  // Dynamic RISE with SAP Target Architecture Generator Engine!
  generateRiseNodesFromCurrentData(): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
    const recs = this.importService.records();
    const activeUserCount = recs.length > 0 ? recs.length : 380;

    const nodes: ArchitectureNode[] = [
      { 
        id: 'node-s4p', 
        name: 'S4P', 
        category: 'Core', 
        userCount: activeUserCount, 
        instanceCount: 1, 
        dbInfo: 'S4/HANA • Fiori Launchpad', 
        status: 'Active', 
        x: 300, 
        y: 140, 
        iconName: 'database', 
        color: '#0284c7', 
        protocol: 'SLES for SAP Applications',
        osInfo: 'SLES for SAP Applications'
      },
      { 
        id: 'node-cs', 
        name: 'CS', 
        category: 'Cloud App', 
        userCount: 50, 
        instanceCount: 1, 
        dbInfo: 'BTP Object Storage', 
        status: 'Active', 
        x: 90, 
        y: 440, 
        iconName: 'file-text', 
        color: '#0284c7', 
        protocol: 'SAP BTP Document Management' 
      },
      { 
        id: 'node-webdisp', 
        name: 'WebDisp', 
        category: 'Integration', 
        userCount: 2, 
        instanceCount: 1, 
        dbInfo: 'Cloud Connector', 
        status: 'Active', 
        x: 300, 
        y: 440, 
        iconName: 'cloud', 
        color: '#0284c7', 
        protocol: 'SAP BTP Gateway & Reverse Proxy' 
      },
      { 
        id: 'node-ci', 
        name: 'CI', 
        category: 'Integration', 
        userCount: 50, 
        instanceCount: 1, 
        dbInfo: 'BTP Integration Suite', 
        status: 'Active', 
        x: 510, 
        y: 440, 
        iconName: 'layers', 
        color: '#0284c7', 
        protocol: 'SAP BTP Cloud Integration (iFlows)' 
      }
    ];

    const edges: ArchitectureEdge[] = [
      { id: 're-cs', fromId: 'node-cs', toId: 'node-s4p', label: 'BTP Storage ➔' },
      { id: 're-webdisp', fromId: 'node-webdisp', toId: 'node-s4p', label: 'Web Traffic ➔' },
      { id: 're-ci', fromId: 'node-ci', toId: 'node-s4p', label: 'Cloud iFlows ➔' }
    ];

    return { nodes, edges };
  }

  openDetailModal(node: ArchitectureNode): void {
    this.selectedNode.set(node);
    this.detailModalNode.set(node);
  }

  totalServerCount(): number {
    return this.nodes().reduce((sum, n) => sum + (n.instanceCount || 1), 0);
  }

  getNodePosition(nodeId: string): { x: number; y: number } | null {
    const node = this.nodes().find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : null;
  }

  setArchitectureMode(mode: 'asis' | 'po' | 'rise'): void {
    this.architectureMode.set(mode);
    this.excelImportSuccess.set(false);
    this.cancelConnectingMode();

    // Check if custom user diagram is saved in localStorage for this mode
    const savedCustom = localStorage.getItem('taskforce_custom_arch_' + mode);
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          this.nodes.set(parsed.nodes);
          this.currentEdges.set(parsed.edges || []);
          this.selectedNode.set(null);
          this.showToast(`Kaydedilmiş özel ${mode.toUpperCase()} mimarisi yüklendi.`);
          return;
        }
      } catch (e) {
        console.error('Error loading saved diagram', e);
      }
    }

    if (mode === 'asis') {
      this.nodes.set(JSON.parse(JSON.stringify(this.asisNodes)));
      this.currentEdges.set(JSON.parse(JSON.stringify(this.asisEdges)));
      this.coreNode = { x: 520, y: 160 };
    } else if (mode === 'po') {
      this.nodes.set(JSON.parse(JSON.stringify(this.poNodes)));
      this.currentEdges.set(JSON.parse(JSON.stringify(this.poEdges)));
      this.coreNode = { x: 520, y: 300 };
    } else {
      const riseTarget = this.generateRiseNodesFromCurrentData();
      this.nodes.set(riseTarget.nodes);
      this.currentEdges.set(riseTarget.edges);
      this.coreNode = { x: 520, y: 300 };
    }
    this.selectedNode.set(null);
  }

  /* --- Interactive Studio: Node Modal & Presets --- */
  openCreateNodeModal(): void {
    this.editingNodeId = null;
    this.nodeForm = {
      name: '',
      instanceCount: 1,
      category: 'Core' as const,
      userCount: 50,
      dbInfo: 'HANA 2.0 In-Memory',
      osInfo: 'SLES 15 SP7 for SAP',
      status: 'Active' as const,
      protocol: 'SAP BTP OData / RFC',
      isEosRisk: false,
      eosDate: ''
    };
    this.showStudioNodeModal.set(true);
  }

  openEditNodeModal(node: ArchitectureNode, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.editingNodeId = node.id;
    this.nodeForm = {
      name: node.name,
      instanceCount: node.instanceCount || 1,
      category: node.category,
      userCount: node.userCount,
      dbInfo: node.dbInfo || '',
      osInfo: node.osInfo || '',
      status: node.status,
      protocol: node.protocol || '',
      isEosRisk: !!node.isEosRisk,
      eosDate: node.eosDate || ''
    };
    this.showStudioNodeModal.set(true);
  }

  closeStudioNodeModal(): void {
    this.showStudioNodeModal.set(false);
    this.editingNodeId = null;
  }

  applyPreset(presetKey: string): void {
    switch (presetKey) {
      case 'erp':
        this.nodeForm.name = 'SAP S/4HANA Private Cloud';
        this.nodeForm.instanceCount = 3;
        this.nodeForm.category = 'Core';
        this.nodeForm.dbInfo = 'HANA 2.0 In-Memory';
        this.nodeForm.osInfo = 'SLES 15 SP7 for SAP';
        this.nodeForm.userCount = 380;
        this.nodeForm.protocol = 'SAP BTP OData / RFC';
        this.nodeForm.isEosRisk = false;
        break;
      case 'hana':
        this.nodeForm.name = 'HANA 2.0 In-Memory DB';
        this.nodeForm.instanceCount = 1;
        this.nodeForm.category = 'Core';
        this.nodeForm.dbInfo = '1 TB HANA Cloud DB';
        this.nodeForm.osInfo = 'SLES 15 SP7 for SAP';
        this.nodeForm.userCount = 100;
        this.nodeForm.protocol = 'HDB SQL / TLS 1.3';
        this.nodeForm.isEosRisk = false;
        break;
      case 'po':
        this.nodeForm.name = 'SAP PO 7.5 On-Premise';
        this.nodeForm.instanceCount = 3;
        this.nodeForm.category = 'Integration';
        this.nodeForm.dbInfo = 'Sybase ASE 16';
        this.nodeForm.osInfo = 'Windows Server 2019';
        this.nodeForm.userCount = 15;
        this.nodeForm.protocol = 'SOAP / JDBC / RFC / REST';
        this.nodeForm.isEosRisk = false;
        break;
      case 'fiori':
        this.nodeForm.name = 'SAP Fiori Gateway (FES)';
        this.nodeForm.instanceCount = 2;
        this.nodeForm.category = 'Legacy';
        this.nodeForm.dbInfo = 'Sybase ASE 16';
        this.nodeForm.osInfo = 'Windows Server 2019';
        this.nodeForm.userCount = 200;
        this.nodeForm.protocol = 'HTTPS / OData Gateway';
        this.nodeForm.isEosRisk = true;
        this.nodeForm.eosDate = '31.12.2020';
        break;
      case 'btp':
        this.nodeForm.name = 'SAP BTP Integration Suite';
        this.nodeForm.instanceCount = 1;
        this.nodeForm.category = 'Integration';
        this.nodeForm.dbInfo = 'SAP Cloud Platform';
        this.nodeForm.osInfo = 'SAP Managed Cloud';
        this.nodeForm.userCount = 50;
        this.nodeForm.protocol = 'Cloud iFlows / REST / OData';
        this.nodeForm.isEosRisk = false;
        break;
      case 'webdisp':
        this.nodeForm.name = 'SAP Web Dispatcher';
        this.nodeForm.instanceCount = 2;
        this.nodeForm.category = 'Integration';
        this.nodeForm.dbInfo = 'Reverse Proxy & Load Balancer';
        this.nodeForm.osInfo = 'Windows Server 2019';
        this.nodeForm.userCount = 5;
        this.nodeForm.protocol = 'HTTPS / TLS 1.3';
        this.nodeForm.isEosRisk = false;
        break;
      case 'cs':
        this.nodeForm.name = 'SAP Content Server 6.5';
        this.nodeForm.instanceCount = 1;
        this.nodeForm.category = 'Legacy';
        this.nodeForm.dbInfo = 'MaxDB 7.9';
        this.nodeForm.osInfo = 'Windows Server 2016';
        this.nodeForm.userCount = 20;
        this.nodeForm.protocol = 'HTTP Archive Gateway';
        this.nodeForm.isEosRisk = true;
        this.nodeForm.eosDate = '31.12.2020';
        break;
    }
  }

  saveNodeForm(): void {
    if (!this.nodeForm.name.trim()) return;

    if (this.editingNodeId) {
      // Update existing node
      this.nodes.update(list => list.map(n => {
        if (n.id === this.editingNodeId) {
          return {
            ...n,
            name: this.nodeForm.name.trim(),
            instanceCount: this.nodeForm.instanceCount || 1,
            category: this.nodeForm.category,
            userCount: this.nodeForm.userCount || 0,
            dbInfo: this.nodeForm.dbInfo,
            osInfo: this.nodeForm.osInfo,
            status: this.nodeForm.status,
            protocol: this.nodeForm.protocol,
            isEosRisk: this.nodeForm.isEosRisk,
            eosDate: this.nodeForm.isEosRisk ? this.nodeForm.eosDate : undefined
          };
        }
        return n;
      }));
      this.showToast(`"${this.nodeForm.name}" bileşeni güncellendi.`);
    } else {
      // Add new node with staggered position
      const count = this.nodes().length;
      const posX = 200 + ((count * 150) % 650);
      const posY = 150 + ((count * 95) % 400);

      const newNode: ArchitectureNode = {
        id: 'node-custom-' + Date.now(),
        name: this.nodeForm.name.trim(),
        instanceCount: this.nodeForm.instanceCount || 1,
        category: this.nodeForm.category,
        userCount: this.nodeForm.userCount || 0,
        dbInfo: this.nodeForm.dbInfo,
        osInfo: this.nodeForm.osInfo,
        status: this.nodeForm.status,
        x: posX,
        y: posY,
        iconName: this.nodeForm.category === 'Core' ? 'database' : (this.nodeForm.category === 'Integration' ? 'layers' : (this.nodeForm.category === 'Cloud App' ? 'cloud' : 'server')),
        color: this.nodeForm.isEosRisk ? '#ef4444' : '#0284c7',
        protocol: this.nodeForm.protocol,
        isEosRisk: this.nodeForm.isEosRisk,
        eosDate: this.nodeForm.isEosRisk ? this.nodeForm.eosDate : undefined
      };

      this.nodes.update(list => [...list, newNode]);
      this.showToast(`"${newNode.name}" eklendi! İstediğiniz konuma sürükleyebilirsiniz.`);
    }

    this.closeStudioNodeModal();
  }

  confirmRemoveNode(node: ArchitectureNode, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (confirm(`"${node.name}" sunucusunu ve tüm bağlantılarını silmek istediğinize emin misiniz?`)) {
      this.removeNode(node.id);
      this.showToast(`"${node.name}" silindi.`);
    }
  }

  /* --- Interactive Studio: Drawing Connections ("Bağlantı Kur") --- */
  toggleConnectingMode(): void {
    if (this.isConnectingMode()) {
      this.cancelConnectingMode();
    } else {
      this.isConnectingMode.set(true);
      this.connectSourceNode.set(null);
      this.showToast('Bağlantı modu aktif. Başlayacak 1. kaynak düğüme tıklayın.');
    }
  }

  startConnectingFromNode(node: ArchitectureNode, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isConnectingMode.set(true);
    this.connectSourceNode.set(node);
    this.showToast(`1. Kaynak seçildi: ${node.name}. Şimdi hedef bileşene tıklayın.`);
  }

  cancelConnectingMode(): void {
    this.isConnectingMode.set(false);
    this.connectSourceNode.set(null);
    this.pendingTargetNode.set(null);
  }

  onNodeClicked(node: ArchitectureNode, event: MouseEvent): void {
    if (!this.isConnectingMode()) {
      this.selectNode(node);
      return;
    }

    event.stopPropagation();
    const source = this.connectSourceNode();

    if (!source) {
      this.connectSourceNode.set(node);
      this.showToast(`1. Kaynak seçildi: ${node.name}. Şimdi hedef bileşene tıklayın.`);
    } else {
      if (source.id === node.id) {
        this.showToast('Bir bileşeni kendisine bağlayamazsınız. Lütfen farklı bir hedef seçin.');
        return;
      }

      this.pendingTargetNode.set(node);
      this.edgeForm = {
        label: `${source.name} ➔ ${node.name}`,
        isEosRisk: false
      };
      this.showEdgeModal.set(true);
    }
  }

  confirmCreateEdge(): void {
    const source = this.connectSourceNode();
    const target = this.pendingTargetNode();
    if (!source || !target) return;

    const newEdge: ArchitectureEdge = {
      id: 'edge-custom-' + Date.now(),
      fromId: source.id,
      toId: target.id,
      label: this.edgeForm.label.trim() || `${source.name} ➔`,
      isEosRisk: this.edgeForm.isEosRisk
    };

    this.currentEdges.update(list => [...list, newEdge]);
    this.showEdgeModal.set(false);
    this.cancelConnectingMode();
    this.showToast(`Bağlantı kuruldu: ${source.name} ➔ ${target.name}`);
  }

  cancelEdgeModal(): void {
    this.showEdgeModal.set(false);
    this.pendingTargetNode.set(null);
  }

  getNodeName(nodeId: string): string {
    const node = this.nodes().find(n => n.id === nodeId);
    return node ? node.name : nodeId;
  }

  openManageEdgesModal(): void {
    this.showManageEdgesModal.set(true);
  }

  closeManageEdgesModal(): void {
    this.showManageEdgesModal.set(false);
  }

  deleteEdge(edge: ArchitectureEdge, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const fromName = this.getNodeName(edge.fromId);
    const toName = this.getNodeName(edge.toId);
    this.currentEdges.update(list => list.filter(e => e.id !== edge.id));
    this.showToast(`Bağlantı kablosu silindi: ${fromName} ➔ ${toName}`);
  }

  promptDeleteEdge(edge: ArchitectureEdge, event?: MouseEvent): void {
    this.deleteEdge(edge, event);
  }

  /* --- Interactive Studio: Persistence & Storage --- */
  saveCustomLayout(): void {
    const mode = this.architectureMode();
    const data = {
      nodes: this.nodes(),
      edges: this.currentEdges()
    };
    localStorage.setItem('taskforce_custom_arch_' + mode, JSON.stringify(data));
    this.showToast(`Mimari çiziminiz (${mode.toUpperCase()}) tarayıcınıza başarıyla kaydedildi!`);
  }

  clearCanvas(): void {
    if (confirm('Tüm bileşenleri ve bağlantıları silip sıfırdan çizim yapmak istiyor musunuz?')) {
      this.nodes.set([]);
      this.currentEdges.set([]);
      this.selectedNode.set(null);
      this.showToast('Harita temizlendi. "+ Bileşen Ekle" ile sıfırdan çizmeye başlayabilirsiniz.');
    }
  }

  resetDiagram(): void {
    const mode = this.architectureMode();
    localStorage.removeItem('taskforce_custom_arch_' + mode);
    this.setArchitectureMode(mode);
    this.showToast('Harita orijinal şablon durumuna sıfırlandı.');
  }

  showToast(message: string): void {
    this.studioToastMessage.set(message);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.studioToastMessage.set(null);
    }, 4000);
  }

  selectNode(node: ArchitectureNode): void {
    this.selectedNode.set(node);
  }

  startDrag(node: ArchitectureNode, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedNode.set(node);
    this.draggingNodeId = node.id;
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent): void {
    if (!this.draggingNodeId || !this.canvasRef) return;
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    
    let newX = event.clientX - canvasRect.left;
    let newY = event.clientY - canvasRect.top;

    // Smooth clamping within canvas limits
    newX = Math.max(120, Math.min(canvasRect.width - 120, newX));
    newY = Math.max(50, Math.min(canvasRect.height - 50, newY));

    this.nodes.update(list =>
      list.map(n => n.id === this.draggingNodeId ? { ...n, x: newX, y: newY } : n)
    );

    if (this.draggingNodeId === 'node-core') {
      this.coreNode = { x: newX, y: newY };
    }
  }

  @HostListener('window:mouseup')
  onWindowMouseUp(): void {
    this.draggingNodeId = null;
  }

  removeNode(id: string): void {
    this.nodes.update(list => list.filter(n => n.id !== id));
    this.currentEdges.update(list => list.filter(e => e.fromId !== id && e.toId !== id));
    if (this.selectedNode()?.id === id) {
      this.selectedNode.set(null);
    }
  }

  exportDiagram(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 650;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Inter, sans-serif';
    const modeTitle = this.architectureMode() === 'asis' ? 'AS-IS Current Architecture' : (this.architectureMode() === 'po' ? 'PO Live Integration Map' : 'RISE with SAP Target Architecture');
    ctx.fillText(`${this.customerService.activeCustomer().name} - ${modeTitle}`, 20, 35);
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`Generated by Task Force Engine on ${new Date().toLocaleDateString('tr-TR')}`, 20, 55);

    this.currentEdges().forEach(edge => {
      const from = this.getNodePosition(edge.fromId);
      const to = this.getNodePosition(edge.toId);
      if (from && to) {
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = edge.isEosRisk ? '#ef4444' : '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect((from.x + to.x) / 2 - 45, (from.y + to.y) / 2 - 20, 90, 16);
        ctx.fillStyle = edge.isEosRisk ? '#dc2626' : '#0369a1';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(edge.label || '', (from.x + to.x) / 2 - 40, (from.y + to.y) / 2 - 8);
      }
    });

    this.nodes().forEach(node => {
      ctx.setLineDash([]);
      ctx.fillStyle = node.id === 'node-core' ? '#0284c7' : (node.isEosRisk ? '#fff1f2' : '#ffffff');
      ctx.strokeStyle = node.isEosRisk ? '#ef4444' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(node.x - 110, node.y - 28, 220, 56, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = node.id === 'node-core' ? '#ffffff' : (node.isEosRisk ? '#9f1239' : '#0f172a');
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(node.name, node.x - 90, node.y - 6);
      ctx.fillStyle = node.id === 'node-core' ? '#e0f2fe' : (node.isEosRisk ? '#be123c' : '#475569');
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`${node.instanceCount || 1}x Instance • ${node.userCount} Users`, node.x - 90, node.y + 12);
    });

    const link = document.createElement('a');
    link.download = `${this.customerService.activeCustomer().name}_${this.architectureMode()}_Clean_Diagram.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
