import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { OpportunityEngineService } from '../../core/services/opportunity-engine.service';
import { Opportunity, OpportunityStatus } from '../../core/models/opportunity.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-opportunities',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, IconComponent],
  template: `
    <div class="opp-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Fırsat Tespit & Önceliklendirme Motoru</h1>
          <p class="page-subtitle">Yüklenen SAP Verilerinden Otomatik Üretilen Fırsat ve 2-Eksenli Matris</p>
        </div>
      </div>

      <!-- 2-Axis Opportunity Matrix Section -->
      <div class="matrix-card">
        <div class="card-header">
          <div>
            <h3>2-Eksenli Opportunity Prioritization Matrix</h3>
            <p class="sub">X-Ekseni: Uygulama Zorluğu (Effort) • Y-Ekseni: İş Değeri (Business Value)</p>
          </div>
          <div class="quadrant-legend">
            <span class="legend-item qw">Quick Wins (Hızlı Kazanç)</span>
            <span class="legend-item so">Strategic Opportunities</span>
            <span class="legend-item he">High Effort</span>
            <span class="legend-item lp">Low Priority</span>
          </div>
        </div>

        <div class="matrix-grid">
          <!-- Quadrant 1: Quick Wins -->
          <div class="quadrant qw">
            <div class="q-header">
              <span class="q-title"><app-icon name="bolt" [size]="14"></app-icon> Quick Wins</span>
              <span class="q-desc">Düşük Efor / Yüksek Değer</span>
            </div>
            <div class="node-list">
              @for (opp of getQuadrantOpportunities('Quick Wins'); track opp.id) {
                <div class="matrix-node qw-node" (click)="openDetail(opp)">
                  <div class="node-top">
                    <strong>{{ opp.title }}</strong>
                    <span class="conf">%{{ opp.confidenceScore }}</span>
                  </div>
                  <div class="node-bottom">
                    <span class="val">€{{ opp.businessValue | number }} / Yıl</span>
                    <span class="effort">Efor: {{ opp.implementationEffort }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Quadrant 2: Strategic Opportunities -->
          <div class="quadrant so">
            <div class="q-header">
              <span class="q-title"><app-icon name="sparkles" [size]="14"></app-icon> Strategic Opportunities</span>
              <span class="q-desc">Yüksek Efor / Yüksek Değer</span>
            </div>
            <div class="node-list">
              @for (opp of getQuadrantOpportunities('Strategic Opportunities'); track opp.id) {
                <div class="matrix-node so-node" (click)="openDetail(opp)">
                  <div class="node-top">
                    <strong>{{ opp.title }}</strong>
                    <span class="conf">%{{ opp.confidenceScore }}</span>
                  </div>
                  <div class="node-bottom">
                    <span class="val">€{{ opp.businessValue | number }} / Yıl</span>
                    <span class="effort">Efor: {{ opp.implementationEffort }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Quadrant 3: Low Priority -->
          <div class="quadrant lp">
            <div class="q-header">
              <span class="q-title">Low Priority</span>
              <span class="q-desc">Düşük Efor / Düşük Değer</span>
            </div>
            <div class="node-list">
              <p class="empty-text" *ngIf="getQuadrantOpportunities('Low Priority').length === 0">Bu kategoride fırsat bulunmuyor.</p>
            </div>
          </div>

          <!-- Quadrant 4: High Effort -->
          <div class="quadrant he">
            <div class="q-header">
              <span class="q-title">High Effort</span>
              <span class="q-desc">Yüksek Efor / Düşük Değer</span>
            </div>
            <div class="node-list">
              <p class="empty-text" *ngIf="getQuadrantOpportunities('High Effort').length === 0">Bu kategoride fırsat bulunmuyor.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Opportunities Table Section -->
      <div class="table-card">
        <div class="card-header">
          <h3>Tespit Edilen Tüm Fırsatlar Listesi</h3>
          <div class="filter-pills">
            <button class="pill-btn" [class.active]="selectedCategory() === 'All'" (click)="selectedCategory.set('All')">Tümü ({{ oppService.opportunities().length }})</button>
            <button class="pill-btn" [class.active]="selectedCategory() === 'LİSANS OPTİMİZASYON'" (click)="selectedCategory.set('LİSANS OPTİMİZASYON')">Lisans</button>
            <button class="pill-btn" [class.active]="selectedCategory() === 'SAP BTP FIRSATI'" (click)="selectedCategory.set('SAP BTP FIRSATI')">BTP</button>
            <button class="pill-btn" [class.active]="selectedCategory() === 'AI FIRSATI'" (click)="selectedCategory.set('AI FIRSATI')">AI Joule</button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="opp-table">
            <thead>
              <tr>
                <th>Fırsat Adı</th>
                <th>Kategori</th>
                <th>Müşteri</th>
                <th>Business Value</th>
                <th>Tahmini Tasarruf</th>
                <th>ROI</th>
                <th>Efor</th>
                <th>Öncelik</th>
                <th>Güven Skoru</th>
                <th>Durum</th>
                <th class="text-right">Detay</th>
              </tr>
            </thead>
            <tbody>
              @for (opp of filteredOpportunities(); track opp.id) {
                <tr class="table-row" (click)="openDetail(opp)">
                  <td><strong>{{ opp.title }}</strong></td>
                  <td><span class="cat-badge">{{ opp.category }}</span></td>
                  <td>{{ opp.customerName }}</td>
                  <td><strong class="text-success">€{{ opp.businessValue | number }}</strong></td>
                  <td>€{{ opp.annualSavings | number }}</td>
                  <td><span class="roi-badge">%{{ opp.roi }}</span></td>
                  <td><span class="effort-tag">{{ opp.implementationEffort }}</span></td>
                  <td><app-status-badge [text]="opp.priority" type="priority"></app-status-badge></td>
                  <td><span class="conf-pill">%{{ opp.confidenceScore }}</span></td>
                  <td><app-status-badge [text]="opp.status" type="status"></app-status-badge></td>
                  <td class="text-right" (click)="$event.stopPropagation()">
                    <button class="btn-detail" (click)="openDetail(opp)">İncele ➔</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Opportunity Detail Modal / Drawer -->
      <div class="modal-overlay" *ngIf="activeDetailOpp()" (click)="closeDetail()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <app-status-badge [text]="activeDetailOpp()!.category" type="category"></app-status-badge>
              <h2 class="modal-title">{{ activeDetailOpp()!.title }}</h2>
              <span class="modal-sub">{{ activeDetailOpp()!.customerName }} • Matris Konumu: <strong>{{ activeDetailOpp()!.quadrant }}</strong></span>
            </div>
            <button class="close-btn" (click)="closeDetail()">✕</button>
          </div>

          <div class="modal-body">
            <!-- Mevcut Durum & Problem -->
            <div class="detail-section">
              <h4>Mevcut Durum</h4>
              <p>{{ activeDetailOpp()!.currentSituation }}</p>
            </div>

            <div class="detail-section warning">
              <h4>Problem Tanımı</h4>
              <p>{{ activeDetailOpp()!.problem }}</p>
            </div>

            <!-- Veri Kanıtı -->
            <div class="detail-section info">
              <h4>Excel Veri Kanıtları</h4>
              <p>{{ activeDetailOpp()!.dataEvidence }}</p>
            </div>

            <!-- Önerilen Çözüm -->
            <div class="detail-section success">
              <h4>Önerilen SAP Çözümü</h4>
              <p>{{ activeDetailOpp()!.proposedSolution }}</p>
            </div>

            <!-- Beklenen Faydalar Grid -->
            <div class="benefits-grid">
              <div class="b-card">
                <span class="b-label">Maliyet Tasarrufu</span>
                <strong class="b-val">{{ activeDetailOpp()!.expectedBenefits.costSavings }}</strong>
              </div>
              <div class="b-card">
                <span class="b-label">Zaman Kazancı</span>
                <strong class="b-val">{{ activeDetailOpp()!.expectedBenefits.timeSaved }}</strong>
              </div>
              <div class="b-card">
                <span class="b-label">Verimlilik Artışı</span>
                <strong class="b-val">{{ activeDetailOpp()!.expectedBenefits.efficiencyGain }}</strong>
              </div>
            </div>

            <!-- Finansal Etki & Status Actions -->
            <div class="detail-section">
              <h4>Finansal Etki & ROI</h4>
              <p>{{ activeDetailOpp()!.financialImpactSummary }}</p>
            </div>

            <div class="status-action-row">
              <span>Durumu Değiştir:</span>
              <button class="status-btn" [class.active]="activeDetailOpp()!.status === 'Under Review'" (click)="updateStatus('Under Review')">Under Review</button>
              <button class="status-btn success" [class.active]="activeDetailOpp()!.status === 'Approved'" (click)="updateStatus('Approved')">Approve</button>
              <button class="status-btn primary" [class.active]="activeDetailOpp()!.status === 'Presented'" (click)="updateStatus('Presented')">Presented</button>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeDetail()">Kapat</button>
            <button class="btn btn-primary" (click)="goToBusinessCase()">Business Case Hesabına Git ➔</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .opp-page {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
      .page-subtitle { margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #64748b; }
    }

    .btn-primary {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .matrix-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        h3 { margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a; }
        .sub { margin: 0.2rem 0 0 0; font-size: 0.78rem; color: #64748b; }
      }
    }

    .quadrant-legend {
      display: flex;
      gap: 0.75rem;
      font-size: 0.72rem;
      font-weight: 700;

      .legend-item {
        padding: 0.2rem 0.5rem;
        border-radius: 4px;

        &.qw { background: #ecfdf5; color: #059669; }
        &.so { background: #f0f9ff; color: #0284c7; }
        &.he { background: #fef2f2; color: #dc2626; }
        &.lp { background: #f1f5f9; color: #64748b; }
      }
    }

    .matrix-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 0.85rem;
      background: #f8fafc;
      padding: 0.85rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .quadrant {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;
      min-height: 170px;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;

      .q-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 0.4rem;

        .q-title { font-weight: 800; font-size: 0.82rem; display: flex; align-items: center; gap: 0.3rem; }
        .q-desc { font-size: 0.68rem; color: #94a3b8; }
      }

      &.qw { border-left: 3px solid #10b981; .q-title { color: #059669; } }
      &.so { border-left: 3px solid #0284c7; .q-title { color: #0284c7; } }
      &.he { border-left: 3px solid #ef4444; .q-title { color: #dc2626; } }
      &.lp { border-left: 3px solid #94a3b8; .q-title { color: #64748b; } }
    }

    .node-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      .empty-text { font-size: 0.75rem; color: #94a3b8; font-style: italic; margin: 1rem 0; }
    }

    .matrix-node {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.6rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { border-color: #0284c7; background: #f0f9ff; }

      .node-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        strong { font-size: 0.8rem; color: #0f172a; }
        .conf { font-size: 0.68rem; font-weight: 800; color: #059669; background: #ecfdf5; padding: 0.1rem 0.35rem; border-radius: 4px; }
      }

      .node-bottom {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        margin-top: 0.3rem;
        .val { font-weight: 700; color: #0284c7; }
        .effort { color: #64748b; }
      }
    }

    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        h3 { margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a; }
      }
    }

    .filter-pills {
      display: flex;
      gap: 0.4rem;

      .pill-btn {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        padding: 0.3rem 0.65rem;
        border-radius: 14px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        cursor: pointer;

        &.active { background: #0284c7; color: #ffffff; border-color: #0284c7; }
      }
    }

    .table-responsive { overflow-x: auto; }

    .opp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;

      th {
        background: #f8fafc;
        padding: 0.75rem 0.85rem;
        text-align: left;
        font-weight: 700;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
      }

      .table-row {
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        &:hover { background: #f0f9ff; }
        td { padding: 0.75rem 0.85rem; vertical-align: middle; }
      }
    }

    .cat-badge {
      font-size: 0.68rem;
      background: #f1f5f9;
      color: #334155;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-weight: 700;
    }

    .text-success { color: #059669; }

    .roi-badge {
      background: #ecfdf5;
      color: #059669;
      font-weight: 800;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
    }

    .effort-tag { font-weight: 600; color: #64748b; }
    .conf-pill { font-weight: 700; color: #0284c7; }
    .text-right { text-align: right; }

    .btn-detail {
      background: transparent;
      border: none;
      color: #0284c7;
      font-weight: 700;
      font-size: 0.78rem;
      cursor: pointer;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 1.5rem;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 12px;
      max-width: 660px;
      width: 100%;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      overflow: hidden;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;

      .modal-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0.3rem 0 0 0; }
      .modal-sub { font-size: 0.75rem; color: #64748b; }
      .close-btn { background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; }
    }

    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;

      .detail-section {
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 8px;
        padding: 0.75rem;

        h4 { margin: 0 0 0.3rem 0; font-size: 0.82rem; font-weight: 800; color: #0f172a; }
        p { margin: 0; font-size: 0.78rem; color: #334155; line-height: 1.4; }

        &.warning { background: #fff1f2; border-color: #fecdd3; h4 { color: #9f1239; } p { color: #881337; } }
        &.info { background: #f0f9ff; border-color: #bae6fd; h4 { color: #0369a1; } p { color: #075985; } }
        &.success { background: #ecfdf5; border-color: #a7f3d0; h4 { color: #047857; } p { color: #065f46; } }
      }
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.6rem;

      .b-card {
        background: #f1f5f9;
        border-radius: 6px;
        padding: 0.55rem;
        display: flex;
        flex-direction: column;
        .b-label { font-size: 0.68rem; color: #64748b; font-weight: 600; }
        .b-val { font-size: 0.78rem; color: #0f172a; font-weight: 800; margin-top: 0.2rem; }
      }
    }

    .status-action-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;

      .status-btn {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 700;
        cursor: pointer;

        &.active, &:hover { background: #0284c7; color: #fff; border-color: #0284c7; }
        &.success.active { background: #10b981; border-color: #10b981; }
        &.primary.active { background: #6366f1; border-color: #6366f1; }
      }
    }

    .modal-footer {
      padding: 0.85rem 1.25rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;

      .btn {
        padding: 0.45rem 0.85rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        &.btn-secondary { background: #e2e8f0; border: none; color: #334155; }
        &.btn-primary { background: #0284c7; border: none; color: #fff; }
      }
    }
  `]
})
export class OpportunitiesComponent {
  oppService = inject(OpportunityEngineService);
  router = inject(Router);

  selectedCategory = signal<string>('All');
  activeDetailOpp = signal<Opportunity | null>(null);

  readonly filteredOpportunities = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'All') return this.oppService.opportunities();
    return this.oppService.opportunities().filter(o => o.category.includes(cat));
  });

  getQuadrantOpportunities(quadrant: any): Opportunity[] {
    return this.oppService.opportunities().filter(o => o.quadrant === quadrant);
  }

  openDetail(opp: Opportunity): void { this.activeDetailOpp.set(opp); }
  closeDetail(): void { this.activeDetailOpp.set(null); }

  updateStatus(status: OpportunityStatus): void {
    if (this.activeDetailOpp()) {
      this.oppService.updateOpportunityStatus(this.activeDetailOpp()!.id, status);
      this.activeDetailOpp.update(o => o ? { ...o, status } : null);
    }
  }

  goToBusinessCase(): void {
    this.closeDetail();
    this.router.navigate(['/business-case']);
  }
}
