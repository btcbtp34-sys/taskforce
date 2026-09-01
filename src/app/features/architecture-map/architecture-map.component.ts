import { Component, inject, signal, ElementRef, ViewChild, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../core/services/customer.service';
import { DataImportService } from '../../core/services/data-import.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

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
  imports: [CommonModule, IconComponent, StatusBadgeComponent],
  template: `
    <div class="map-page">
      <!-- Page Header (Clean & Spacious Title) -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <app-icon name="map" [size]="24" color="#0284c7"></app-icon>
            Mimari Şema & Bulut Dönüşüm Konsolu
          </h1>
          <p class="page-subtitle">Mevcut AS-IS Altyapı, PO Entegrasyon Haritası ve RISE with SAP Bulut Hedef Mimarisi</p>
        </div>
      </div>

      <!-- Prominent Mode Toggle Toolbar Banner right below Header -->
      <div class="mode-toolbar-card">
        <div class="view-mode-toggle-lg">
          <button class="mode-btn" [class.active-asis]="architectureMode() === 'asis'" (click)="setArchitectureMode('asis')">
            <app-icon name="alert" [size]="15" [color]="architectureMode() === 'asis' ? '#ffffff' : '#d97706'"></app-icon>
            <span>Mevcut Durum (AS-IS 11 Sunucu)</span>
          </button>

          <button class="mode-btn" [class.active-po]="architectureMode() === 'po'" (click)="setArchitectureMode('po')">
            <app-icon name="bolt" [size]="15" [color]="architectureMode() === 'po' ? '#ffffff' : '#0284c7'"></app-icon>
            <span>PO Canlı Entegrasyon Haritası</span>
          </button>

          <button class="mode-btn" [class.active-rise]="architectureMode() === 'rise'" (click)="setArchitectureMode('rise')">
            <app-icon name="sparkles" [size]="15" [color]="architectureMode() === 'rise' ? '#ffffff' : '#059669'"></app-icon>
            <span>RISE with SAP Hedef Mimari</span>
          </button>
        </div>

        <div class="toolbar-right-actions">
          <button class="btn btn-secondary" (click)="resetDiagram()" title="Tüm Düğümleri Sıfırla">
            <app-icon name="refresh" [size]="15"></app-icon>
            <span>Haritayı Yeniden Çiz</span>
          </button>

          <button class="btn btn-primary" (click)="exportDiagram()" title="Çizimi PNG Görseli Olarak İndir">
            <app-icon name="download" [size]="15"></app-icon>
            <span>Mimari Görsel İndir (PNG)</span>
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
              <strong>PO Canlı Entegrasyon Otomatik Haritası:</strong> Yüklenen Entegrasyon Listesi Excel dosyasındaki 10 adet canlı servis (QNB Ödeme, WINSURE Hasar, F110 Otomatik Ödeme, Fatura Kesin Kayıt vb.) SAP PO 7.5 mimari haritasına dönüştürülmüştür.
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
            <h3><app-icon name="layers" [size]="16"></app-icon> {{ architectureMode() === 'po' ? 'PO Canlı Servisler' : 'Sistem Bileşenleri' }}</h3>
            <span class="sub-text">{{ totalServerCount() }} {{ architectureMode() === 'po' ? 'Servis / Arayüz' : 'Sunucu / Instance' }}</span>
          </div>

          <div class="node-config-list">
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

          <!-- Quick ROI & Transformation Summary Box -->
          <div class="roi-summary-box">
            <h4><app-icon name="chart" [size]="15" color="#0284c7"></app-icon> {{ architectureMode() === 'rise' ? 'RISE Bulut Kıyaslama Raporu' : 'Altyapı & Entegrasyon Özeti' }}</h4>
            
            <div class="summary-stat">
              <span class="s-label">Sunucu Altyapı Adedi</span>
              <strong class="s-val" [class.red]="architectureMode() === 'asis'" [class.green]="architectureMode() === 'rise'">
                {{ architectureMode() === 'asis' ? '11 Sunucu (Dağınık)' : (architectureMode() === 'po' ? '10 Servis (PO 7.5)' : '1 Bulut DB (Konsolide)') }}
              </strong>
            </div>

            <div class="summary-stat">
              <span class="s-label">Entegrasyon Mimarisi</span>
              <strong class="s-val" [class.green]="architectureMode() === 'rise'">
                {{ architectureMode() === 'rise' ? 'SAP BTP Integration Suite' : 'PO 7.5 On-Premise' }}
              </strong>
            </div>

            <div class="summary-stat">
              <span class="s-label">Hedef Lisans Paketi</span>
              <strong class="s-val green">70 FUE (Optimize Bulut)</strong>
            </div>

            <div class="summary-stat">
              <span class="s-label">Tahmini Yıllık Tasarruf</span>
              <strong class="s-val green">€140.000 / Yıl Net TCO</strong>
            </div>

            <div class="summary-stat">
              <span class="s-label">Destek Sonu (EoS) Riski</span>
              <strong class="s-val" [class.red]="architectureMode() === 'asis'" [class.green]="architectureMode() === 'rise'">
                {{ architectureMode() === 'asis' ? 'Fiori 1511 & CS (2 Kritik)' : '0 Risk (%100 SAP Bulut)' }}
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
                  <g class="connection-group">
                    <line 
                      [attr.x1]="getNodePosition(edge.fromId)!.x" 
                      [attr.y1]="getNodePosition(edge.fromId)!.y" 
                      [attr.x2]="getNodePosition(edge.toId)!.x" 
                      [attr.y2]="getNodePosition(edge.toId)!.y" 
                      [attr.stroke]="edge.isEosRisk ? '#ef4444' : (architectureMode() === 'asis' ? '#0284c7' : '#059669')" 
                      stroke-width="2.5" 
                      [attr.marker-end]="edge.isEosRisk ? 'url(#arrow-red)' : (architectureMode() === 'asis' ? 'url(#arrow-blue)' : 'url(#arrow-teal)')" />
                    
                    <!-- Animated Pulsing Dot along line -->
                    <circle 
                      [attr.cx]="(getNodePosition(edge.fromId)!.x + getNodePosition(edge.toId)!.x) / 2" 
                      [attr.cy]="(getNodePosition(edge.fromId)!.y + getNodePosition(edge.toId)!.y) / 2" 
                      r="4" 
                      [attr.fill]="edge.isEosRisk ? '#ef4444' : (architectureMode() === 'asis' ? '#0284c7' : '#059669')"
                      class="pulse-dot">
                      <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
                    </circle>

                    <!-- Text Outline Halo (White Background Behind Text for High Contrast Above Line) -->
                    <text 
                      [attr.x]="(getNodePosition(edge.fromId)!.x + getNodePosition(edge.toId)!.x) / 2" 
                      [attr.y]="(getNodePosition(edge.fromId)!.y + getNodePosition(edge.toId)!.y) / 2 - 14"
                      font-size="11"
                      font-weight="800"
                      stroke="#ffffff"
                      stroke-width="4"
                      stroke-linejoin="round"
                      text-anchor="middle">
                      {{ edge.label }}
                    </text>

                    <!-- Text Label Main Fill Positioned Cleanly Above Connection Line -->
                    <text 
                      [attr.x]="(getNodePosition(edge.fromId)!.x + getNodePosition(edge.toId)!.x) / 2" 
                      [attr.y]="(getNodePosition(edge.fromId)!.y + getNodePosition(edge.toId)!.y) / 2 - 14"
                      font-size="11"
                      font-weight="800"
                      [attr.fill]="edge.isEosRisk ? '#dc2626' : '#0369a1'"
                      text-anchor="middle">
                      {{ edge.label }}
                    </text>
                  </g>
                }
              }
            </svg>

            <!-- Rendered System Nodes on Canvas matching Slide Layout (Clean Corporate Card without icon clutter) -->
            @for (node of nodes(); track node.id) {
              <div 
                class="canvas-node" 
                [style.left.px]="node.x - (node.id === 'node-core' ? 125 : 110)" 
                [style.top.px]="node.y - 45"
                [class.core-node]="node.id === 'node-core'"
                [class.asis-node]="architectureMode() === 'asis' && node.id !== 'node-core'"
                [class.eos-node]="node.isEosRisk"
                [class.active-selected]="selectedNode()?.id === node.id"
                [class.is-dragging]="draggingNodeId === node.id"
                (mousedown)="startDrag(node, $event)"
                (click)="openDetailModal(node)">

                <!-- Red Square Instance Badge (bottom-right matching PPT slide) -->
                <div class="red-instance-badge" *ngIf="architectureMode() !== 'po'" title="Instance / Sunucu Adedi: {{ node.instanceCount || 1 }}">
                  {{ node.instanceCount || 1 }}
                </div>

                <div class="c-node-card-body">
                  <div class="c-header-row">
                    <strong class="c-name">{{ node.name }}</strong>
                    <span class="sap-brand-pill">SAP</span>
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
          </div>

          <!-- Selected Node Details Drawer Bar -->
          <div class="node-detail-bar" *ngIf="selectedNode() as sn">
            <div class="d-info">
              <strong>Bileşen Detayı: {{ sn.name }} ({{ sn.instanceCount || 1 }} Instance / Sunucu)</strong>
              <span>Veritabanı / Entegrasyon: {{ sn.dbInfo || 'Sybase / SLES / Windows 2019' }} • Protokol: {{ sn.protocol || 'SAP BTP OData / RFC' }}</span>
              <span *ngIf="sn.isEosRisk" class="eos-warning-text">UYARI: Bu bileşenin üretici desteği (End of Support: {{ sn.eosDate }}) dolmıştır. RISE with SAP dönüşümünde bulut servislerine taşınacaktır.</span>
            </div>
            <div class="d-actions">
              <button class="btn btn-sm btn-primary" (click)="openDetailModal(sn)">Tam Rapor Modalı ➔</button>
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
      min-height: 720px;
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
      border-radius: 6px;
      overflow: hidden;
      min-height: 640px;
      user-select: none;
    }

    .connections-svg {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    /* CLEAN CORPORATE SAP NODE CARD (NO ICON BOX CLUTTER) */
    .canvas-node {
      position: absolute;
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

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ArchitectureMapComponent {
  customerService = inject(CustomerService);
  importService = inject(DataImportService);

  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLDivElement>;

  // Architecture Mode: AS-IS (Mevcut 11 Sunucu) vs PO (Excel Entegrasyonlar) vs RISE (Hedef)
  architectureMode = signal<'asis' | 'po' | 'rise'>('asis');
  excelImportSuccess = signal<boolean>(false);
  detailModalNode = signal<ArchitectureNode | null>(null);

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

  // Excel Sompo PO Live Integration Interfaces Nodes (Extracted from Sompo PO Entegrasyon Listesi.xlsx)
  poNodes: ArchitectureNode[] = [
    { id: 'node-core', name: 'SAP PO 7.5 (Process Orchestration)', category: 'Core', userCount: 10, instanceCount: 3, dbInfo: 'Sybase 16 • Windows 2019', status: 'Active', x: 520, y: 300, iconName: 'layers', color: '#0284c7', protocol: 'Central Integration Hub' },
    { id: 'node-qnb', name: 'QNB Bank Ödeme Gateway', category: 'Integration', userCount: 5, dbInfo: 'SOAP ➔ HTTP', status: 'Active', x: 180, y: 120, iconName: 'bolt', color: '#0284c7', protocol: 'SI_OUT_SYNC_MakeOnlineProcessMoney' },
    { id: 'node-winsure', name: 'WINSURE Hasar Transferi', category: 'Integration', userCount: 12, dbInfo: 'SAP ➔ WINSURE XSLT', status: 'Active', x: 520, y: 120, iconName: 'shield', color: '#059669', protocol: 'SI_OUT_SYNC_ClaimTransfer' },
    { id: 'node-f110', name: 'F110 Otomatik Ödeme Sync', category: 'Integration', userCount: 8, dbInfo: 'SOAP ➔ JDBC', status: 'Active', x: 860, y: 120, iconName: 'database', color: '#0284c7', protocol: 'SI_OUT_SYNC_FI_SAP_F110_DATA' },
    { id: 'node-fatura', name: 'Fatura Kesin Kayıt DB', category: 'Integration', userCount: 15, dbInfo: 'SOAP ➔ JDBC', status: 'Active', x: 160, y: 300, iconName: 'file-text', color: '#0284c7', protocol: 'SI_OUT_SYNC_KESIN_KAYIT' },
    { id: 'node-satici', name: 'Satıcı & Banka Unsur DB', category: 'Integration', userCount: 6, dbInfo: 'SOAP ➔ JDBC', status: 'Active', x: 880, y: 300, iconName: 'cart', color: '#b45309', protocol: 'SI_OUT_SYNC_SAP_SATICI_BANKA' },
    { id: 'node-butce', name: 'Bütçe KO Tanım DB', category: 'Integration', userCount: 4, dbInfo: 'SOAP ➔ JDBC', status: 'Active', x: 180, y: 480, iconName: 'chart', color: '#4f46e5', protocol: 'SI_OUT_SYNC_SAP_BUTCE_KO' },
    { id: 'node-cust-rfc', name: 'Master Data Müşteri RFC', category: 'Integration', userCount: 20, dbInfo: 'SOAP ➔ RFC', status: 'Active', x: 520, y: 480, iconName: 'users', color: '#047857', protocol: 'ZENT_CUSTOMER_CREATE_MASTER' },
    { id: 'node-vendor-rfc', name: 'Vendor & Customer Search', category: 'Integration', userCount: 25, dbInfo: 'SOAP ➔ RFC', status: 'Active', x: 860, y: 480, iconName: 'search', color: '#0284c7', protocol: 'ZENT_VENDOR_CUSTOMER_SEARCH' }
  ];

  poEdges: ArchitectureEdge[] = [
    { id: 'pe1', fromId: 'node-qnb', toId: 'node-core', label: 'QNB Ödeme ➔' },
    { id: 'pe2', fromId: 'node-winsure', toId: 'node-core', label: 'Hasar Transfer ➔' },
    { id: 'pe3', fromId: 'node-f110', toId: 'node-core', label: 'F110 Ödeme ➔' },
    { id: 'pe4', fromId: 'node-fatura', toId: 'node-core', label: 'Fatura Kayıt ➔' },
    { id: 'pe5', fromId: 'node-satici', toId: 'node-core', label: 'Satıcı Banka ➔' },
    { id: 'pe6', fromId: 'node-butce', toId: 'node-core', label: 'Bütçe KO ➔' },
    { id: 'pe7', fromId: 'node-cust-rfc', toId: 'node-core', label: 'Müşteri RFC ➔' },
    { id: 'pe8', fromId: 'node-vendor-rfc', toId: 'node-core', label: 'Vendor Search ➔' }
  ];

  // Current Active Nodes & Edges Signals
  nodes = signal<ArchitectureNode[]>(this.asisNodes);
  edges = signal<ArchitectureEdge[]>(this.asisEdges);
  selectedNode = signal<ArchitectureNode | null>(null);

  // Smooth Window-Level Dragging State
  draggingNodeId: string | null = null;
  dragOffset = { x: 0, y: 0 };

  currentEdges = signal<ArchitectureEdge[]>(this.asisEdges);

  constructor() {
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
  // Analyzes AS-IS systems and PO interfaces, then calculates target cloud architecture
  generateRiseNodesFromCurrentData(): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
    const isPoMode = this.importService.importCategory() === 'po' || this.importService.uploadedFileName().toLowerCase().includes('po');
    const recs = this.importService.records();
    const activeUserCount = recs.length > 0 ? recs.length : 380;

    const nodes: ArchitectureNode[] = [
      { 
        id: 'node-core', 
        name: 'SAP S/4HANA Private Cloud (RISE)', 
        category: 'Core', 
        userCount: activeUserCount, 
        instanceCount: 1, 
        dbInfo: 'Prod 1TB / QA 768GB / Dev 256GB', 
        status: 'Active', 
        x: 520, 
        y: 300, 
        iconName: 'database', 
        color: '#0284c7', 
        protocol: 'S/4HANA Cloud (1 Konsolide DB)' 
      },
      { 
        id: 'node-btp-int', 
        name: 'SAP BTP Integration Suite', 
        category: 'Integration', 
        userCount: 50, 
        instanceCount: 1, 
        dbInfo: 'BTP Cloud Tenant', 
        status: 'Active', 
        x: 520, 
        y: 110, 
        iconName: 'layers', 
        color: '#0284c7', 
        protocol: isPoMode ? '10 Canlı PO Arayüzü BTP iFlows’a Taşındı' : 'Cloud iFlows (replaces PO 7.5)' 
      },
      { 
        id: 'node-embedded-fiori', 
        name: 'Embedded Fiori Launchpad S/4HANA', 
        category: 'Cloud App', 
        userCount: activeUserCount, 
        instanceCount: 1, 
        dbInfo: 'Embedded S/4HANA Cloud', 
        status: 'Active', 
        x: 180, 
        y: 220, 
        iconName: 'sparkles', 
        color: '#059669', 
        protocol: 'S/4HANA Cloud Fiori (0 EoS Risk)' 
      },
      { 
        id: 'node-btp-doc', 
        name: 'SAP Document Management Service', 
        category: 'Cloud App', 
        userCount: 50, 
        instanceCount: 1, 
        dbInfo: 'BTP Object Storage', 
        status: 'Active', 
        x: 860, 
        y: 220, 
        iconName: 'file-text', 
        color: '#047857', 
        protocol: 'BTP Storage (replaces Content Server 6.5)' 
      },
      { 
        id: 'node-sac', 
        name: 'SAP Analytics Cloud (SAC)', 
        category: 'Analytics', 
        userCount: 30, 
        instanceCount: 1, 
        dbInfo: 'SAC Tenant', 
        status: 'Planned', 
        x: 180, 
        y: 490, 
        iconName: 'chart', 
        color: '#4f46e5', 
        protocol: 'Live S/4HANA SAC Connection' 
      },
      { 
        id: 'node-fue', 
        name: '70 FUE Optimized Cloud License', 
        category: 'Automation', 
        userCount: 70, 
        instanceCount: 1, 
        dbInfo: 'FUE Cloud License', 
        status: 'Active', 
        x: 860, 
        y: 490, 
        iconName: 'bolt', 
        color: '#059669', 
        protocol: 'FUE License Consolidation' 
      }
    ];

    const edges: ArchitectureEdge[] = [
      { id: 're1', fromId: 'node-btp-int', toId: 'node-core', label: isPoMode ? 'BTP iFlows (10 Live) ➔' : 'BTP iFlows ➔' },
      { id: 're2', fromId: 'node-embedded-fiori', toId: 'node-core', label: 'Fiori Launchpad ➔' },
      { id: 're3', fromId: 'node-btp-doc', toId: 'node-core', label: 'Document Storage ➔' },
      { id: 're4', fromId: 'node-sac', toId: 'node-core', label: 'SAC Live ➔' },
      { id: 're5', fromId: 'node-fue', toId: 'node-core', label: 'FUE Lisans ➔' }
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

  resetDiagram(): void {
    this.setArchitectureMode(this.architectureMode());
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
