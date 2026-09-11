import { Component, inject, signal, computed, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { BasisSizingService } from '../../core/services/basis-sizing.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="analytics-page">
      
      <!-- 1. PAGE HEADER -->
      <div class="page-top-header">
        <div class="title-area">
          <div class="customer-tag">
            <app-icon name="customers" [size]="13" color="#0284c7"></app-icon>
            <span>{{ customerService.activeCustomer().name }}</span>
          </div>
          <h1 class="page-title">FUE & Lisans Dönüşüm Analizi</h1>
          <p class="page-subtitle">Mevcut satın alınan sözleşme ve fiili USMM ölçümlerine dayalı RISE with SAP lisans boyutlandırması</p>
        </div>

        <!-- Main Mode Tabs -->
        <div class="main-tab-nav">
          <button 
            class="main-tab-btn" 
            [class.active]="activeTab() === 'fue'"
            (click)="setTab('fue')">
            <app-icon name="bolt" [size]="14"></app-icon>
            <span>FUE / Lisans Analizi</span>
          </button>
          
          <button 
            class="main-tab-btn" 
            [class.active]="activeTab() === 'dvm'"
            (click)="setTab('dvm')">
            <app-icon name="database" [size]="14"></app-icon>
            <span>Largest Table (DVM)</span>
          </button>

          <button 
            class="main-tab-btn" 
            [class.active]="activeTab() === 'overview'"
            (click)="setTab('overview')">
            <app-icon name="chart" [size]="14"></app-icon>
            <span>Grafikler</span>
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: FUE & LİSANS ANALİZİ (CLEAN, MINIMALIST & UNCLUTTERED)             -->
      <!-- ========================================================================= -->
      <div class="tab-content" *ngIf="activeTab() === 'fue'">
        
        <!-- EXECUTIVE RECOMMENDATION SUMMARY -->
        <div class="clean-summary-grid">
          <!-- Exact FUE Card (No arbitrary %15 addition) -->
          <div class="card-summary-highlight">
            <div class="badge-label">TAVSİYE EDİLEN RISE PAKETİ</div>
            <div class="big-number">{{ activeCalculatedFue() }} <span class="unit">FUE</span></div>
            <div class="sub-desc">{{ activeFueFormulaShort() }}</div>
            <div class="pill-exact">✓ Doğrudan SAP Formülü (Tam Değer)</div>
          </div>

          <!-- Consultant Note Box -->
          <div class="consultant-callout">
            <div class="callout-header">
              <div class="title-with-icon">
                <app-icon name="sparkles" [size]="15" color="#0284c7"></app-icon>
                <strong>Kurumsal Danışman Analiz & Doğrulama Notu</strong>
              </div>
              <span class="badge-optimum">Ek Güvenlik Payı Eklenmemiştir</span>
            </div>
            <p class="callout-text">
              {{ consultantNoteText() }}
            </p>
            <div class="callout-meta">
              <span class="ref-item">
                <app-icon name="file-text" [size]="12" color="#64748b"></app-icon>
                Referans: FUE Sınıflandırma Matrisi (/SDF & USMM)
              </span>
              <span class="text-green">✓ Doğrudan SAP FUE Formülü (HB + HC/5 + HD/30)</span>
            </div>
          </div>

          <!-- Fast KPI Pill Cards -->
          <div class="kpi-column">
            <div class="kpi-row-item">
              <span class="label">Toplam Kullanıcı Hacmi:</span>
              <strong class="val text-slate">{{ activeTotalUsers() }} Kullanıcı</strong>
            </div>
            <div class="kpi-row-item">
              <span class="label">HB Professional (1:1):</span>
              <strong class="val text-blue">{{ activeHbCount() }} ({{ activeHbCount() }}.0 FUE)</strong>
            </div>
            <div class="kpi-row-item">
              <span class="label">HC Functional (5:1):</span>
              <strong class="val text-blue">{{ activeHcCount() }} ({{ (activeHcCount() / 5).toFixed(1) }} FUE)</strong>
            </div>
            <div class="kpi-row-item">
              <span class="label">HD Productivity (30:1):</span>
              <strong class="val text-blue">{{ activeHdCount() }} ({{ (activeHdCount() / 30).toFixed(2) }} FUE)</strong>
            </div>
            <div class="kpi-row-item border-top">
              <span class="label">Hesaplanan Net FUE:</span>
              <strong class="val text-green font-lg">{{ activeCalculatedFue() }} FUE</strong>
            </div>
          </div>
        </div>

        <!-- SUB-SECTION SEGMENTED VIEW (Göz yormayan sekme yapısı) -->
        <div class="section-container">
          <div class="section-nav-header">
            <div class="nav-segmented-group">
              <button 
                class="seg-btn" 
                [class.active]="fueSubView() === 'calc'"
                (click)="fueSubView.set('calc')">
                <span class="step-num">1</span>
                <span>FUE Hesaplama & Oranlar</span>
              </button>
              
              <button 
                class="seg-btn" 
                [class.active]="fueSubView() === 'usmm'"
                (click)="fueSubView.set('usmm')">
                <span class="step-num">2</span>
                <span>FUE Sınıflandırma Matrisi ({{ activeTotalUsers() }})</span>
              </button>

              <button 
                class="seg-btn" 
                [class.active]="fueSubView() === 'purchased'"
                (click)="fueSubView.set('purchased')">
                <span class="step-num">3</span>
                <span>Satın Alınan Lisanslar ({{ activePurchasedMaterials().length }})</span>
              </button>
            </div>

            <span class="view-indicator">
              {{ fueSubView() === 'calc' ? 'Standart SAP FUE Oran Formülasyonu' : (fueSubView() === 'usmm' ? 'FUE Sınıflandırma ve Kullanıcı Dağılımı' : 'SAP for ME Finance & Legal Envanteri') }}
            </span>
          </div>

          <!-- SUB-VIEW 1: FUE HESAPLAMA & ORANLAR -->
          <div class="sub-view-body" *ngIf="fueSubView() === 'calc'">
            <div class="table-wrapper">
              <table class="clean-table">
                <thead>
                  <tr>
                    <th>Kullanım Tipi (Use Type)</th>
                    <th>Eski Lisans Modeli</th>
                    <th class="text-center">Dönüşüm Oranı</th>
                    <th class="text-center">Fiili Kullanıcı</th>
                    <th class="text-center">Hesaplanan FUE</th>
                    <th>Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of activeFueRatios(); track item.useType) {
                    <tr>
                      <td>
                        <span class="badge-type" [ngClass]="item.badgeClass">
                          {{ item.useType }}
                        </span>
                      </td>
                      <td><strong>{{ item.prevModel }}</strong></td>
                      <td class="text-center"><span class="ratio-box">{{ item.ratio }}</span></td>
                      <td class="text-center"><strong>{{ item.currentUsers }}</strong></td>
                      <td class="text-center"><strong class="text-blue">{{ item.calcFue }}</strong></td>
                      <td class="text-muted">{{ item.meaning }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Bottom Result Banner -->
            <div class="calc-result-bar">
              <div class="calc-left">
                <span class="calc-label">HESAPLAMA FORMÜLÜ:</span>
                <span class="calc-formula">
                  <strong>{{ activeFueFormulaFull() }}</strong>
                </span>
              </div>
              <div class="calc-right">
                <span class="recom-badge">➔ Gereken RISE Sözleşmesi: <strong>{{ activeCalculatedFue() }} FUE Paketi</strong></span>
              </div>
            </div>
          </div>

          <!-- SUB-VIEW 2: FUE SINIFLANDIRMA MATRİSİ -->
          <div class="sub-view-body" *ngIf="fueSubView() === 'usmm'">
            <div class="table-wrapper">
              <table class="clean-table">
                <thead>
                  <tr>
                    <th>Mevcut Sınıflandırma</th>
                    <th class="text-center">Toplam (Total)</th>
                    <th class="text-center">HB Professional Use</th>
                    <th class="text-center">HC Functional Use</th>
                    <th class="text-center">HD Productivity Use</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Summary Row -->
                  <tr class="sum-row">
                    <td><strong>GENEL TOPLAM</strong></td>
                    <td class="text-center"><strong class="tag-total">{{ activeTotalUsers() }}</strong></td>
                    <td class="text-center"><strong class="tag-adv">{{ activeHbCount() }}</strong></td>
                    <td class="text-center"><strong class="tag-core">{{ activeHcCount() }}</strong></td>
                    <td class="text-center"><strong class="tag-self">{{ activeHdCount() }}</strong></td>
                  </tr>

                  @for (row of activeFueRows(); track row.classification) {
                    <tr>
                      <td class="bold-title">{{ row.classification }}</td>
                      <td class="text-center bold">{{ row.total }}</td>
                      <td class="text-center">{{ row.hbProfessional }}</td>
                      <td class="text-center">{{ row.hcFunctional }}</td>
                      <td class="text-center">{{ row.hdProductivity }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="info-footer-bar">
              <app-icon name="check" [size]="14" color="#0284c7"></app-icon>
              <span>FUE Formülü: <strong>{{ activeHbCount() }} + {{ activeHcCount() }}/5 + {{ activeHdCount() }}/30 ≈ {{ activeCalculatedFue() }} FUE</strong></span>
            </div>
          </div>

          <!-- SUB-VIEW 3: SATIN ALINAN LİSANSLAR (SAP for ME - 1. Görsel) -->
          <div class="sub-view-body" *ngIf="fueSubView() === 'purchased'">
            <div class="table-wrapper">
              <table class="clean-table">
                <thead>
                  <tr>
                    <th>Materials (Sözleşme Kalemi)</th>
                    <th>Product</th>
                    <th class="text-center">Sipariş</th>
                    <th class="text-center">Miktar (Quantity)</th>
                    <th>Metric ID</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of activePurchasedMaterials(); track m.material) {
                    <tr [class.user-highlight]="m.isUser">
                      <td><strong>{{ m.material }}</strong></td>
                      <td class="text-muted">{{ m.product }}</td>
                      <td class="text-center">{{ m.orders }}</td>
                      <td class="text-center">
                        <span class="qty-tag" [class.user-tag]="m.isUser">{{ m.quantity }}</span>
                      </td>
                      <td class="metric-tag">{{ m.metricId }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="info-footer-bar">
              <app-icon name="check" [size]="14" color="#0284c7"></app-icon>
              <span>{{ purchasedLicensesSummaryText() }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: LARGEST TABLE (DVM)                                               -->
      <!-- ========================================================================= -->
      <div class="tab-content" *ngIf="activeTab() === 'dvm'">
        <div class="section-container">
          <div class="table-wrapper">
            <table class="clean-table">
              <thead>
                <tr>
                  <th>Tablo Adı</th>
                  <th>Modül / Açıklama</th>
                  <th class="text-center">Mevcut Boyut</th>
                  <th>Kayıt Sayısı</th>
                  <th>Potansiyel Tasarruf</th>
                  <th class="text-center">Hedef HANA Boyutu</th>
                </tr>
              </thead>
              <tbody>
                @for (tbl of dvmTables; track tbl.name) {
                  <tr>
                    <td><strong class="text-blue">{{ tbl.name }}</strong></td>
                    <td>{{ tbl.desc }}</td>
                    <td class="text-center"><span class="qty-tag">{{ tbl.sizeGB }} GB</span></td>
                    <td>{{ tbl.rowCount }}</td>
                    <td><span class="text-green font-bold">{{ tbl.potentialReduction }}</span></td>
                    <td class="text-center"><span class="qty-tag user-tag">{{ tbl.targetHanaGB }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 3: GRAFİKLER                                                         -->
      <!-- ========================================================================= -->
      <div class="tab-content" *ngIf="activeTab() === 'overview'">
        <div class="charts-row">
          <div class="chart-box">
            <h3 class="chart-title">Departmanlara Göre Kullanıcı Sayısı</h3>
            <div class="chart-canvas-container">
              <canvas #deptChart></canvas>
            </div>
          </div>

          <div class="chart-box">
            <h3 class="chart-title">SAP Modüllerine Göre Dağılım</h3>
            <div class="chart-canvas-container">
              <canvas #moduleChart></canvas>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .analytics-page {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
    }

    /* 1. TOP HEADER */
    .page-top-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;

      .title-area {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;

        .customer-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: #0284c7;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          width: fit-content;
        }

        .page-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
        }
      }

      .main-tab-nav {
        display: flex;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.25rem;
        gap: 0.25rem;

        .main-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          border: none;
          background: transparent;
          font-size: 0.78rem;
          font-weight: 700;
          color: #475569;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;

          &:hover { color: #0f172a; }

          &.active {
            background: #ffffff;
            color: #0284c7;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          }
        }
      }
    }

    .tab-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* 2. CLEAN SUMMARY GRID (Göz Yormayan Sade Yapı) */
    .clean-summary-grid {
      display: grid;
      grid-template-columns: 200px 1fr 270px;
      gap: 1rem;
      align-items: stretch;
    }

    .card-summary-highlight {
      background: #ffffff;
      border: 2px solid #0284c7;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08);

      .badge-label {
        font-size: 0.64rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        color: #0284c7;
      }

      .big-number {
        font-size: 2.2rem;
        font-weight: 900;
        color: #0f172a;
        line-height: 1.1;
        margin: 0.15rem 0;

        .unit {
          font-size: 1.1rem;
          color: #0284c7;
          font-weight: 800;
        }
      }

      .sub-desc {
        font-size: 0.68rem;
        color: #64748b;
        font-weight: 600;
      }

      .pill-exact {
        margin-top: 0.45rem;
        font-size: 0.62rem;
        font-weight: 700;
        color: #047857;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
      }
    }

    .consultant-callout {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0284c7;
      border-radius: 10px;
      padding: 0.9rem 1.1rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.35rem;

      .callout-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.76rem;
        color: #0284c7;
        font-weight: 800;

        .title-with-icon {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .badge-optimum {
          font-size: 0.63rem;
          font-weight: 700;
          color: #0369a1;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 0.12rem 0.45rem;
          border-radius: 4px;
        }
      }

      .callout-text {
        margin: 0;
        font-size: 0.84rem;
        line-height: 1.45;
        color: #334155;

        strong {
          color: #0f172a;
        }
      }

      .callout-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.68rem;
        color: #64748b;

        .ref-item {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .text-green {
          color: #059669;
          font-weight: 700;
        }
      }
    }

    .kpi-column {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      gap: 0.35rem;

      .kpi-row-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.72rem;

        .label { color: #64748b; font-weight: 500; }
        .val { font-weight: 800; }
        .text-slate { color: #334155; }
        .text-blue { color: #0284c7; }
        .text-green { color: #059669; }

        &.border-top {
          border-top: 1px dashed #cbd5e1;
          padding-top: 0.3rem;
          margin-top: 0.1rem;
        }

        .font-lg {
          font-size: 0.88rem;
        }
      }
    }

    /* 3. SECTION CONTAINER & SEGMENTED TABS */
    .section-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .section-nav-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 0.6rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .nav-segmented-group {
        display: flex;
        gap: 0.4rem;

        .seg-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.75rem;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;

          .step-num {
            width: 16px;
            height: 16px;
            background: #e2e8f0;
            border-radius: 50%;
            font-size: 0.62rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #334155;
          }

          &:hover {
            border-color: #0284c7;
            color: #0284c7;
          }

          &.active {
            background: #0284c7;
            border-color: #0284c7;
            color: #ffffff;

            .step-num {
              background: #ffffff;
              color: #0284c7;
            }
          }
        }
      }

      .view-indicator {
        font-size: 0.7rem;
        color: #64748b;
        font-weight: 600;
      }
    }

    .sub-view-body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    /* 4. CLEAN TABLES */
    .table-wrapper {
      overflow-x: auto;
    }

    .clean-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.76rem;

      thead th {
        background: #f8fafc;
        color: #475569;
        font-weight: 700;
        padding: 0.55rem 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;

        &.text-center { text-align: center; }
      }

      tbody tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.1s;

        &:hover { background: #f8fafc; }

        td {
          padding: 0.5rem 0.75rem;
          vertical-align: middle;

          &.text-center { text-align: center; }
          &.text-muted { color: #64748b; font-size: 0.72rem; }
          &.bold { font-weight: 700; }
        }

        &.user-highlight {
          background: #fafcff;
        }

        &.sum-row {
          background: #fffbeb;
          border-bottom: 2px solid #fde68a;

          .tag-total { color: #0f172a; font-size: 0.9rem; }
          .tag-adv { color: #dc2626; font-size: 0.88rem; }
          .tag-core { color: #d97706; font-size: 0.88rem; }
          .tag-self { color: #0284c7; font-size: 0.88rem; }
          .tag-none { color: #64748b; font-size: 0.88rem; }
        }
      }
    }

    .badge-type {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.12rem 0.45rem;
      border-radius: 4px;

      &.badge-advanced { background: #fee2e2; color: #b91c1c; }
      &.badge-core { background: #fef3c7; color: #b45309; }
      &.badge-self { background: #e0f2fe; color: #0369a1; }
      &.badge-dev { background: #f3e8ff; color: #7e22ce; }
    }

    .ratio-box {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-weight: 700;
      color: #334155;
    }

    .qty-tag {
      background: #f1f5f9;
      padding: 0.12rem 0.45rem;
      border-radius: 4px;
      font-weight: 700;
      color: #475569;
      font-size: 0.72rem;

      &.user-tag {
        background: #e0f2fe;
        color: #0369a1;
      }
    }

    .metric-tag {
      font-family: monospace;
      color: #64748b;
      font-size: 0.7rem;
    }

    .calc-result-bar {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.76rem;

      .calc-label { font-weight: 800; color: #065f46; margin-right: 0.35rem; }
      .calc-formula { color: #047857; }
      .recom-badge { font-weight: 700; color: #065f46; }
    }

    .info-footer-bar {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.45rem 0.75rem;
      font-size: 0.72rem;
      color: #475569;
    }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;

      .chart-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1.25rem;

        .chart-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 1rem;
        }

        .chart-canvas-container {
          height: 250px;
          position: relative;
        }
      }
    }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  customerService = inject(CustomerService);
  basisService = inject(BasisSizingService);
  route = inject(ActivatedRoute);

  @ViewChild('deptChart') deptChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('moduleChart') moduleChartRef?: ElementRef<HTMLCanvasElement>;

  activeTab = signal<'fue' | 'dvm' | 'overview'>('fue');
  fueSubView = signal<'calc' | 'usmm' | 'purchased'>('calc');

  activeTotalUsers = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return this.basisService.fueSummary().totalUsers;
    }
    return 541;
  });

  activeHbCount = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return this.basisService.fueSummary().hbCount;
    }
    return 355;
  });

  activeHcCount = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return this.basisService.fueSummary().hcCount;
    }
    return 185;
  });

  activeHdCount = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return this.basisService.fueSummary().hdCount;
    }
    return 1;
  });

  // Exact Excel formula: HB + HC/5 + HD/30, no arbitrary %15 addition!
  activeCalculatedFue = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      return Math.round(this.basisService.fueSummary().calculatedFUE);
    }
    return 392;
  });

  activeFueFormulaShort = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      const s = this.basisService.fueSummary();
      return `${s.hbCount} + ${s.hcCount}/5 + ${s.hdCount}/30 ≈ ${Math.round(s.calculatedFUE)} FUE`;
    }
    return '355 + 185/5 + 1/30 ≈ 392 FUE';
  });

  activeFueFormulaFull = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      const s = this.basisService.fueSummary();
      const hcVal = (s.hcCount / 5).toFixed(1);
      const hdVal = (s.hdCount / 30).toFixed(2);
      return `${s.hbCount}.0 (Professional) + ${hcVal} (Functional) + ${hdVal} (Productivity) = ${s.calculatedFUE.toFixed(1)} Net FUE (≈ ${Math.round(s.calculatedFUE)} FUE)`;
    }
    return '355.0 (Professional) + 37.0 (Functional) + 0.03 (Productivity) = 392.03 Net FUE (≈ 392 FUE)';
  });

  consultantNoteText = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      const s = this.basisService.fueSummary();
      const fue = Math.round(s.calculatedFUE);
      const hcPart = (s.hcCount / 5).toFixed(1);
      const hdPart = (s.hdCount / 30).toFixed(2);
      return `"FUE sınıflandırma matrisine göre sistemdeki ${s.totalUsers} kullanıcıdan ${s.hbCount} Professional (HB), ${s.hcCount} Functional (HC) ve ${s.hdCount} Productivity (HD) kullanıcısı doğrulanmıştır. SAP standart dönüşüm formülüyle (${s.hbCount} + ${hcPart} + ${hdPart}) RISE with SAP geçişinde ${fue} FUE paketi tam ve optimum seviye olarak belirlenmiştir. İlave %15 tampon eklenmeden doğrudan net değer önerilmektedir."`;
    }
    return '"FUE sınıflandırma matrisine göre sistemdeki 541 kullanıcıdan 355 Professional (HB), 185 Functional (HC) ve 1 Productivity (HD) kullanıcısı doğrulanmıştır. SAP standart dönüşüm formülüyle (355 + 37.0 + 0.03) RISE with SAP geçişinde 392 FUE paketi tam ve optimum seviye olarak belirlenmiştir. Sözleşme maliyetini şişirmemek adına ilave %15 güvenlik payı eklenmeden doğrudan net 392 FUE önerilmektedir."';
  });

  activeFueRows = computed(() => {
    const pkg = this.basisService.basisPackage();
    if (this.basisService.hasUploadedData() && pkg && pkg.fueRows && pkg.fueRows.length > 0) {
      return pkg.fueRows;
    }
    return [
      { classification: 'Not Classified (Default User Type)', total: 2, hbProfessional: 2, hcFunctional: 0, hdProductivity: 0 },
      { classification: 'AX mySAP ERP Professional', total: 173, hbProfessional: 173, hcFunctional: 0, hdProductivity: 0 },
      { classification: 'AY mySAP ERP Limited Profession', total: 364, hbProfessional: 178, hcFunctional: 185, hdProductivity: 1 },
      { classification: 'BA mySAP ERP Developer', total: 2, hbProfessional: 2, hcFunctional: 0, hdProductivity: 0 }
    ];
  });

  activeFueRatios = computed(() => {
    if (this.basisService.hasUploadedData() && this.basisService.fueSummary()) {
      const s = this.basisService.fueSummary();
      return [
        { useType: 'HB Professional', prevModel: 'Professional User', ratio: '1 : 1', meaning: '1 Professional User = 1.0 FUE', currentUsers: s.hbCount, calcFue: `${s.hbCount}.00 FUE`, badgeClass: 'badge-advanced' },
        { useType: 'HC Functional', prevModel: 'Limited / Functional User', ratio: '5 : 1', meaning: '5 Functional Users = 1.0 FUE', currentUsers: s.hcCount, calcFue: `${(s.hcCount / 5).toFixed(2)} FUE`, badgeClass: 'badge-core' },
        { useType: 'HD Productivity', prevModel: 'Productivity / Self-Service', ratio: '30 : 1', meaning: '30 Productivity Users = 1.0 FUE', currentUsers: s.hdCount, calcFue: `${(s.hdCount / 30).toFixed(2)} FUE`, badgeClass: 'badge-self' }
      ];
    }
    return [
      { useType: 'HB Professional', prevModel: 'Professional User', ratio: '1 : 1', meaning: '1 Professional User = 1.0 FUE', currentUsers: 355, calcFue: '355.00 FUE', badgeClass: 'badge-advanced' },
      { useType: 'HC Functional', prevModel: 'Limited / Functional User', ratio: '5 : 1', meaning: '5 Functional Users = 1.0 FUE', currentUsers: 185, calcFue: '37.00 FUE', badgeClass: 'badge-core' },
      { useType: 'HD Productivity', prevModel: 'Productivity / Self-Service', ratio: '30 : 1', meaning: '30 Productivity Users = 1.0 FUE', currentUsers: 1, calcFue: '0.03 FUE', badgeClass: 'badge-self' }
    ];
  });

  activePurchasedMaterials = computed(() => {
    const lics = this.basisService.licenses();
    if (lics && lics.length > 0) {
      return lics.map(l => ({
        material: l.materials,
        product: l.product,
        orders: l.orders,
        quantity: `${l.quantity} ${l.unit}`,
        metricId: l.metricId || '—',
        isUser: l.unit.toLowerCase().includes('user')
      }));
    }
    return [];
  });

  purchasedLicensesSummaryText = computed(() => {
    const lics = this.basisService.licenses();
    if (!lics || lics.length === 0) {
      return 'Sözleşme lisans envanteri Excel yüklendiğinde görüntülenecektir.';
    }
    const userLics = lics.filter(l => l.unit.toLowerCase().includes('user'));
    const totalUserCount = userLics.reduce((sum, l) => sum + l.quantity, 0);
    const profCount = userLics.find(l => l.materials.includes('Professional User') && !l.materials.includes('Limited'))?.quantity || 0;
    const limCount = userLics.find(l => l.materials.includes('Limited'))?.quantity || 0;
    const devCount = userLics.find(l => l.materials.includes('Developer'))?.quantity || 0;
    const otherCount = totalUserCount - (profCount + limCount + devCount);

    return `Toplam Satın Alınan Kullanıcı Lisansı: ${totalUserCount.toLocaleString('tr-TR')} Adet (${profCount} Professional + ${limCount} Limited + ${devCount} Developer + ${otherCount} Diğer Roller). Fiili FUE İhtiyacı: ${this.activeCalculatedFue()} FUE (Atıl Lisans Tasarrufu: ${totalUserCount - this.activeCalculatedFue()} Lisans).`;
  });

  // 2. GÖRSEL 2: USER VALIDATION RESULTS (USMM)
  validationSummary = {
    total: 83,
    advanced: 57,
    core: 16,
    selfService: 8,
    notClassified: 2
  };

  userValidationRows = [
    { classification: 'CB SAP Application Professional', total: 37, advanced: 34, core: 1, selfService: 2, notClassified: 0 },
    { classification: 'CD SAP Application Employee', total: 40, advanced: 17, core: 15, selfService: 6, notClassified: 2 },
    { classification: 'CD SAP Application Employee', total: 40, advanced: 17, core: 15, selfService: 6, notClassified: 2 },
    { classification: 'Not Classified (Default User Type)', total: 4, advanced: 4, core: 0, selfService: 0, notClassified: 0 },
    { classification: '91 Test', total: 2, advanced: 2, core: 0, selfService: 0, notClassified: 0 }
  ];

  // 3. GÖRSEL 4: SAP FUE RATIOS
  fueRatios = [
    { useType: 'Advanced', prevModel: 'Professional', ratio: '1 : 1', meaning: '1 Professional User consumes 1 FUE', currentUsers: 57, calcFue: '57.00 FUE', badgeClass: 'badge-advanced' },
    { useType: 'Core', prevModel: 'Functional', ratio: '5 : 1', meaning: '5 Functional Users consumes 1 FUE', currentUsers: 16, calcFue: '3.20 FUE', badgeClass: 'badge-core' },
    { useType: 'Self-serve', prevModel: 'Productivity', ratio: '30 : 1', meaning: '30 Productivity Users consumes 1 FUE', currentUsers: 8, calcFue: '0.27 FUE', badgeClass: 'badge-self' },
    { useType: 'Developer', prevModel: 'Developer', ratio: '0.5 : 1', meaning: '1 Developer User consumes 2 FUEs', currentUsers: 0, calcFue: 'Buffer / Dahil', badgeClass: 'badge-dev' }
  ];

  // 4. DVM TABLOSU
  dvmTables = [
    { name: 'BKPF', desc: 'Muhasebe Belge Başlıkları (FI)', sizeGB: 184, rowCount: '48.2M', potentialReduction: '%45 Arşivleme', targetHanaGB: '101 GB' },
    { name: 'BSEG', desc: 'Muhasebe Belge Kalemleri (FI)', sizeGB: 342, rowCount: '124.8M', potentialReduction: '%50 Arşivleme', targetHanaGB: '171 GB' },
    { name: 'CDHDR', desc: 'Değişiklik Belgeleri Başlık', sizeGB: 96, rowCount: '28.4M', potentialReduction: '%60 Temizleme', targetHanaGB: '38 GB' },
    { name: 'CDPOS', desc: 'Değişiklik Belgeleri Kalem', sizeGB: 215, rowCount: '74.1M', potentialReduction: '%60 Temizleme', targetHanaGB: '86 GB' },
    { name: 'EDI40', desc: 'IDoc Kontrol Kayıtları', sizeGB: 68, rowCount: '18.9M', potentialReduction: '%70 Temizleme', targetHanaGB: '20 GB' },
    { name: 'MARA', desc: 'Genel Malzeme Verileri (MM)', sizeGB: 42, rowCount: '11.3M', potentialReduction: '%20 İndeks Sıkıştırma', targetHanaGB: '33 GB' }
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'dvm' || tab === 'overview' || tab === 'fue') {
        this.activeTab.set(tab);
      }
    });
  }

  setTab(tab: 'fue' | 'dvm' | 'overview'): void {
    this.activeTab.set(tab);
    if (tab === 'overview') {
      setTimeout(() => this.initOverviewCharts(), 50);
    }
  }

  ngAfterViewInit(): void {
    if (this.activeTab() === 'overview') {
      this.initOverviewCharts();
    }
  }

  private initOverviewCharts(): void {
    if (!this.deptChartRef || !this.moduleChartRef) return;

    new Chart(this.deptChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Mali İşler (FI)', 'Satın Alma (MM)', 'Satış (SD)', 'Üretim (PP)', 'İnsan Kaynakları (HR)', 'IT / Basis'],
        datasets: [{
          label: 'Kullanıcı Sayısı',
          data: [34, 18, 15, 8, 5, 3],
          backgroundColor: '#0284c7',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
      }
    });

    new Chart(this.moduleChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['FI (Finans)', 'MM (Malzeme)', 'SD (Satış)', 'CO (Maliyet)', 'HR / PA', 'Basis'],
        datasets: [{
          data: [38, 22, 16, 12, 10, 5],
          backgroundColor: ['#0284c7', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });
  }
}
