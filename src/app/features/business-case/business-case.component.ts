import { Component, signal, computed, ViewChild, ElementRef, AfterViewInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CustomerService } from '../../core/services/customer.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface TcoExpenseItem {
  id: string;
  name: string;
  values: number[];
  isCustom?: boolean;
}

const DEFAULT_YEARS: string[] = ['2022', '2023', '2024', '2025', '2026'];

const DEFAULT_ASIS_ITEMS: { id: string; name: string; values: number[] }[] = [
  { id: 'a1', name: 'Existing Maintenance', values: [80000, 80000, 80000, 80000, 80000] },
  { id: 'a2', name: 'Additional License (S/4 Transformation)', values: [0, 10000, 0, 0, 0] },
  { id: 'a3', name: 'Additional Maintenance', values: [0, 0, 0, 0, 0] },
  { id: 'a4', name: 'Infra/Hosting', values: [36000, 36000, 36000, 36000, 36000] },
  { id: 'a5', name: 'Infra Extensions', values: [0, 0, 0, 0, 0] },
  { id: 'a6', name: 'Disaster Recovery', values: [10000, 10000, 10000, 10000, 10000] },
  { id: 'a7', name: 'Security', values: [2000, 2000, 2000, 2000, 2000] },
  { id: 'a8', name: 'Basis/Upgrade', values: [36000, 136000, 36000, 36000, 36000] },
  { id: 'a9', name: 'Innovation Cost (AI, Sustainability, LowCode etc..)', values: [50000, 50000, 50000, 50000, 50000] }
];

const DEFAULT_RISE_ITEMS: { id: string; name: string; values: number[] }[] = [
  { id: 'r1', name: 'RISE Fee', values: [500000, 400000, 400000, 400000, 400000] },
  { id: 'r2', name: 'RISE Fund', values: [0, 0, 0, 0, 0] },
  { id: 'r3', name: 'Project / Implementation', values: [200000, 0, 0, 0, 0] }
];

@Component({
  selector: 'app-business-case',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="tco-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="header-tag-row">
            <span class="brand-tco-title">TOPLAM SAHİP OLMA MALİYETİ</span>
            <span class="sub-badge">{{ years().length }} Yıllık Finansal Modelleme & Kıyaslama</span>
          </div>
          <h1 class="page-title">Toplam Sahip Olma Maliyeti & Finansal Simülasyon</h1>
          <p class="page-subtitle">Mevcut On-Premise Giderleri ile RISE with SAP Bulut Dönüşüm Maliyetlerinin {{ years().length }} Yıllık Karşılaştırması</p>
        </div>

        <div class="header-actions">
          <!-- Quick Year Selector -->
          <div class="year-selector-box" title="Yılları 1 yıl ileri/geri kaydırın veya tablodaki yıl başlıklarına tıklayıp doğrudan düzenleyin">
            <span class="ys-label">Yıllar:</span>
            <button type="button" class="btn-year-nav" (click)="shiftYears(-1)" title="1 Yıl Geri">◀</button>
            <span class="ys-range">{{ years()[0] }} — {{ years()[years().length - 1] }}</span>
            <button type="button" class="btn-year-nav" (click)="shiftYears(1)" title="1 Yıl İleri">▶</button>
          </div>

          <button type="button" class="btn btn-secondary" (click)="resetToDefaults()">
            <app-icon name="refresh" [size]="15"></app-icon>
            <span>Örnek Değerlere Sıfırla</span>
          </button>
          <button type="button" class="btn btn-secondary" (click)="exportToCSV()">
            <app-icon name="file-spreadsheet" [size]="15" color="#059669"></app-icon>
            <span>Excel (CSV) İndir</span>
          </button>
          <button type="button" class="btn btn-primary" (click)="printTco()">
            <app-icon name="download" [size]="15"></app-icon>
            <span>PDF Rapor İndir</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Summary Bar -->
      <div class="tco-summary-cards">
        <div class="sum-card asis">
          <div class="s-top">
            <span class="s-lbl">{{ years().length }} Yıllık AS-IS On-Premise Toplamı</span>
            <app-icon name="database" [size]="16" color="#d97706"></app-icon>
          </div>
          <div class="s-val text-amber">€{{ asisTotalAllYears() | number:'1.2-2' }}</div>
          <div class="s-sub">Geleneksel Bakım, Donanım & Yükseltmeler</div>
        </div>

        <div class="sum-card rise">
          <div class="s-top">
            <span class="s-lbl">{{ years().length }} Yıllık RISE with SAP Toplamı</span>
            <app-icon name="sparkles" [size]="16" color="#0284c7"></app-icon>
          </div>
          <div class="s-val text-blue">€{{ riseTotalAllYears() | number:'1.2-2' }}</div>
          <div class="s-sub">Bulut Lisansı, Altyapı & Dönüşüm Projesi</div>
        </div>

        <div class="sum-card saving">
          <div class="s-top">
            <span class="s-lbl">{{ years().length }} Yıllık Net Maliyet Farkı / Bütçe</span>
            <app-icon name="dollar" [size]="16" color="#059669"></app-icon>
          </div>
          <div class="s-val text-emerald">€{{ (asisTotalAllYears() - riseTotalAllYears() > 0 ? asisTotalAllYears() - riseTotalAllYears() : riseTotalAllYears() - asisTotalAllYears()) | number:'1.2-2' }}</div>
          <div class="s-sub">Tümleşik Bulut Yönetimi & Sürekli İnovasyon</div>
        </div>
      </div>

      <!-- Interactive Table 1: AS-IS On-Premise Costs -->
      <div class="tco-section-card">
        <div class="section-title-bar">
          <div class="st-left">
            <span class="table-num">1</span>
            <h3>Mevcut Durum Giderleri (AS-IS On-Premise)</h3>
          </div>
          <button type="button" class="btn-add-row" (click)="addAsisRow()">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>+ Yeni Gider Kalemi Ekle</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="tco-table">
            <thead>
              <tr class="tco-gold-header">
                <th class="col-name">Gider Kalemi (Cost Item)</th>
                @for (yr of years(); track $index; let idx = $index; let isLast = $last) {
                  <th class="col-year" [class.is-last-year]="isLast">
                    <div class="year-header-cell" [class.last-cell]="isLast">
                      <input 
                        type="text" 
                        class="header-year-input" 
                        [ngModel]="yr" 
                        (ngModelChange)="updateYear(idx, $event)" 
                        [title]="(idx + 1) + '. Yılı değiştirmek için tıklayın'" />
                      @if (isLast) {
                        <div class="year-ctrl-btns">
                          <button 
                            *ngIf="years().length > 1" 
                            type="button" 
                            class="btn-year-del" 
                            (click)="removeYear()" 
                            title="En sağdaki yılı ({{ yr }}) sil">✕</button>
                          <button 
                            type="button" 
                            class="btn-year-add" 
                            (click)="addYear()" 
                            title="Sağa yeni yıl ekle">+</button>
                        </div>
                      }
                    </div>
                  </th>
                }
                <th class="col-total">Toplam ({{ years().length }} Yıl)</th>
                <th class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              @for (item of asisItems(); track item.id; let idx = $index) {
                <tr>
                  <td class="cell-name">
                    <input type="text" [(ngModel)]="item.name" (ngModelChange)="onDataChanged()" class="input-name" placeholder="Gider Kalemi Adı" />
                  </td>
                  @for (yr of years(); track $index; let yIdx = $index) {
                    <td class="cell-val">
                      <input type="number" [(ngModel)]="item.values[yIdx]" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                    </td>
                  }
                  <td class="cell-row-total">
                    {{ getItemTotal(item) | number:'1.2-2' }}
                  </td>
                  <td class="cell-action">
                    <button *ngIf="item.isCustom" class="btn-del" (click)="removeAsisRow(idx)" title="Satırı Sil">✕</button>
                  </td>
                </tr>
              }
              <!-- Subtotals Row -->
              <tr class="tco-subtotal-row">
                <td class="cell-name font-bold">YILLIK TOPLAM GİDER</td>
                @for (yr of years(); track $index; let yIdx = $index) {
                  <td class="cell-val font-bold">{{ asisYearSum(yIdx) | number:'1.2-2' }}</td>
                }
                <td class="cell-row-total font-bold">—</td>
                <td class="cell-action"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total Gold Box -->
        <div class="total-badge-box-container">
          <div class="gold-total-box">
            <span class="gt-lbl">{{ years().length }} YILLIK AS-IS TOPLAM:</span>
            <span class="gt-val">{{ asisTotalAllYears() | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>

      <!-- Interactive Table 2: RISE with SAP Costs -->
      <div class="tco-section-card mt-4">
        <div class="section-title-bar">
          <div class="st-left">
            <span class="table-num">2</span>
            <h3>RISE with SAP Bulut Maliyetleri (Target Cloud)</h3>
          </div>
          <button type="button" class="btn-add-row" (click)="addRiseRow()">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>+ Yeni Kalem Ekle</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="tco-table">
            <thead>
              <tr class="tco-gold-header">
                <th class="col-name">RISE Maliyet Kalemi (Cost Item)</th>
                @for (yr of years(); track $index; let idx = $index; let isLast = $last) {
                  <th class="col-year" [class.is-last-year]="isLast">
                    <div class="year-header-cell" [class.last-cell]="isLast">
                      <input 
                        type="text" 
                        class="header-year-input" 
                        [ngModel]="yr" 
                        (ngModelChange)="updateYear(idx, $event)" 
                        [title]="(idx + 1) + '. Yılı değiştirmek için tıklayın'" />
                      @if (isLast) {
                        <div class="year-ctrl-btns">
                          <button 
                            *ngIf="years().length > 1" 
                            type="button" 
                            class="btn-year-del" 
                            (click)="removeYear()" 
                            title="En sağdaki yılı ({{ yr }}) sil">✕</button>
                          <button 
                            type="button" 
                            class="btn-year-add" 
                            (click)="addYear()" 
                            title="Sağa yeni yıl ekle">+</button>
                        </div>
                      }
                    </div>
                  </th>
                }
                <th class="col-total">Toplam ({{ years().length }} Yıl)</th>
                <th class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              @for (item of riseItems(); track item.id; let idx = $index) {
                <tr>
                  <td class="cell-name">
                    <input type="text" [(ngModel)]="item.name" (ngModelChange)="onDataChanged()" class="input-name" placeholder="Kalem Adı" />
                  </td>
                  @for (yr of years(); track $index; let yIdx = $index) {
                    <td class="cell-val">
                      <input type="number" [(ngModel)]="item.values[yIdx]" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                    </td>
                  }
                  <td class="cell-row-total">
                    {{ getItemTotal(item) | number:'1.2-2' }}
                  </td>
                  <td class="cell-action">
                    <button *ngIf="item.isCustom" class="btn-del" (click)="removeRiseRow(idx)" title="Satırı Sil">✕</button>
                  </td>
                </tr>
              }
              <!-- Subtotals Row -->
              <tr class="tco-subtotal-row">
                <td class="cell-name font-bold">YILLIK TOPLAM RISE GİDERİ</td>
                @for (yr of years(); track $index; let yIdx = $index) {
                  <td class="cell-val font-bold">{{ riseYearSum(yIdx) | number:'1.2-2' }}</td>
                }
                <td class="cell-row-total font-bold">—</td>
                <td class="cell-action"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total Gold Box -->
        <div class="total-badge-box-container">
          <div class="gold-total-box">
            <span class="gt-lbl">{{ years().length }} YILLIK RISE WITH SAP TOPLAM:</span>
            <span class="gt-val">{{ riseTotalAllYears() | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>

      <!-- Interactive Table 3: SAVING / NET FARK -->
      <div class="tco-section-card mt-4">
        <div class="section-title-bar">
          <div class="st-left">
            <span class="table-num">3</span>
            <h3>TASARRUF & TOPLAM SAHİP OLMA MALİYETİ FARK ANALİZİ</h3>
          </div>
        </div>

        <div class="table-responsive">
          <table class="tco-table saving-table">
            <thead>
              <tr class="tco-gold-header">
                <th class="col-name">Kalem</th>
                @for (yr of years(); track $index; let idx = $index; let isLast = $last) {
                  <th class="col-year" [class.is-last-year]="isLast">
                    <div class="year-header-cell" [class.last-cell]="isLast">
                      <input 
                        type="text" 
                        class="header-year-input" 
                        [ngModel]="yr" 
                        (ngModelChange)="updateYear(idx, $event)" 
                        [title]="(idx + 1) + '. Yılı değiştirmek için tıklayın'" />
                      @if (isLast) {
                        <div class="year-ctrl-btns">
                          <button 
                            *ngIf="years().length > 1" 
                            type="button" 
                            class="btn-year-del" 
                            (click)="removeYear()" 
                            title="En sağdaki yılı sil">✕</button>
                          <button 
                            type="button" 
                            class="btn-year-add" 
                            (click)="addYear()" 
                            title="Sağa yeni yıl ekle">+</button>
                        </div>
                      }
                    </div>
                  </th>
                }
                <th class="col-total">{{ years().length }} Yıllık Net Durum</th>
                <th class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-name font-bold text-emerald">YILLIK NET TASARRUF / FARK</td>
                @for (yr of years(); track $index; let yIdx = $index) {
                  <td class="cell-val font-bold" [class.text-red]="netDifference(yIdx) < 0" [class.text-emerald]="netDifference(yIdx) >= 0">
                    {{ netDifference(yIdx) | number:'1.2-2' }}
                  </td>
                }
                <td class="cell-row-total font-bold text-emerald">
                  {{ totalDifference() | number:'1.2-2' }} €
                </td>
                <td class="cell-action"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="total-badge-box-container">
          <div class="green-saving-box">
            <span class="gt-lbl">{{ years().length }} YILLIK KÜMÜLATİF MALİYET FARKI:</span>
            <span class="gt-val">{{ totalDifference() | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>

      <!-- TCO Cumulative Visual Curve Chart -->
      <div class="tco-chart-card mt-4">
        <div class="ch-header">
          <app-icon name="chart" [size]="18" color="#0284c7"></app-icon>
          <h3>{{ years().length }} Yıllık Kümülatif Maliyet Trendi (AS-IS On-Premise vs RISE with SAP)</h3>
        </div>
        <div class="ch-body">
          <canvas #tcoChart></canvas>
        </div>
      </div>

      <!-- User Instruction Note at Bottom -->
      <div class="user-instruction-note">
        <app-icon name="info" [size]="16" color="#0284c7"></app-icon>
        <p><strong>Bilgilendirme:</strong> Bu tablo tamamen örnek olarak verilmiştir. Kendi giderlerinizi yazarak düzenleme yapabilirsiniz.</p>
      </div>
    </div>
  `,
  styles: [`
    .tco-page {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* HEADER */
    .page-header {
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

      .header-tag-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.35rem;

        .brand-tco-title {
          font-size: 1.6rem;
          font-weight: 900;
          color: #eab308;
          letter-spacing: -0.02em;
        }

        .sub-badge {
          background: #fefce8;
          color: #a16207;
          border: 1px solid #fef08a;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.15rem 0.55rem;
          border-radius: 4px;
        }
      }

      .page-title {
        font-size: 1.35rem;
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
        gap: 0.6rem;
        flex-wrap: wrap;

        .year-selector-box {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.35rem 0.65rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          margin-right: 0.35rem;

          .ys-label {
            font-size: 0.72rem;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .ys-range {
            font-size: 0.82rem;
            font-weight: 800;
            color: #0f172a;
            padding: 0 4px;
          }

          .btn-year-nav {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            color: #334155;
            cursor: pointer;
            transition: all 0.15s ease;

            &:hover {
              background: #0284c7;
              color: #ffffff;
              border-color: #0284c7;
            }
          }
        }
      }
    }

    /* BUTTONS */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.6rem 1.15rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.18s;

      &.btn-secondary {
        background: #ffffff;
        color: #334155;
        border-color: #cbd5e1;
        &:hover { background: #f1f5f9; border-color: #94a3b8; }
      }

      &.btn-primary {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        color: #ffffff;
        border-color: #0284c7;
        box-shadow: 0 3px 10px rgba(2, 132, 199, 0.28);
        &:hover { transform: translateY(-1px); box-shadow: 0 5px 15px rgba(2, 132, 199, 0.38); }
      }
    }

    /* SUMMARY CARDS */
    .tco-summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.1rem;

      .sum-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        .s-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.76rem;
          font-weight: 700;
          color: #64748b;
        }

        .s-val {
          font-size: 1.55rem;
          font-weight: 900;
          line-height: 1.2;
        }

        .s-sub {
          font-size: 0.72rem;
          color: #64748b;
        }

        &.asis { border-left: 4px solid #eab308; }
        &.rise { border-left: 4px solid #0284c7; }
        &.saving { border-left: 4px solid #059669; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); }
      }
    }

    /* TCO SECTION CARDS & TABLES */
    .tco-section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.35rem;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .section-title-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.5rem;

        .st-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;

          .table-num {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #eab308;
            color: #0f172a;
            font-weight: 900;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          h3 {
            margin: 0;
            font-size: 1.05rem;
            font-weight: 800;
            color: #0f172a;
          }
        }

        .btn-add-row {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.85rem;
          border-radius: 6px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #0284c7;
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;

          &:hover { background: #f0f9ff; border-color: #0284c7; }
        }
      }
    }

    .table-responsive {
      overflow-x: auto;
    }

    .tco-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 0.78rem;

      .tco-gold-header {
        background: #f59e0b; /* Yellow/Gold Header from image */
        color: #000000;

        th {
          padding: 0.65rem 0.85rem;
          font-weight: 800;
          text-align: right;
          border: 1px solid #d97706;

          &.col-name {
            text-align: left;
            width: 27%;
            min-width: 200px;
          }

          &.col-year {
            min-width: 85px;
            padding: 0.35rem 0.45rem;

            &.is-last-year {
              min-width: 128px;
            }

            .year-header-cell {
              display: flex;
              align-items: center;
              justify-content: flex-end;
              gap: 4px;

              &.last-cell {
                min-width: 118px;
              }

              .header-year-input {
                width: 60px;
                max-width: 70px;
                margin-left: auto;
                background: rgba(255, 255, 255, 0.25);
                border: 1px dashed rgba(0, 0, 0, 0.4);
                border-radius: 5px;
                padding: 0.28rem 0.35rem;
                font-size: 0.82rem;
                font-weight: 800;
                color: #000000;
                text-align: right;
                outline: none;
                cursor: pointer;
                transition: all 0.15s ease;

                &:hover {
                  background: rgba(255, 255, 255, 0.5);
                  border-color: rgba(0, 0, 0, 0.8);
                }

                &:focus {
                  background: #ffffff;
                  border: 1.5px solid #0284c7;
                  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.25);
                  cursor: text;
                }
              }

              .year-ctrl-btns {
                display: inline-flex;
                align-items: center;
                gap: 3px;

                .btn-year-del,
                .btn-year-add {
                  width: 22px;
                  height: 22px;
                  padding: 0;
                  border-radius: 4px;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 0.72rem;
                  font-weight: 800;
                  cursor: pointer;
                  line-height: 1;
                  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
                  transition: all 0.15s ease;
                }

                .btn-year-del {
                  background: #fee2e2;
                  color: #b91c1c;
                  border: 1px solid #fca5a5;

                  &:hover {
                    background: #ef4444;
                    color: #ffffff;
                    border-color: #dc2626;
                    transform: scale(1.08);
                  }
                }

                .btn-year-add {
                  background: #ecfdf5;
                  color: #047857;
                  border: 1px solid #6ee7b7;
                  font-size: 0.88rem;

                  &:hover {
                    background: #10b981;
                    color: #ffffff;
                    border-color: #059669;
                    transform: scale(1.08);
                  }
                }
              }
            }
          }

          &.col-total {
            width: 15%;
            min-width: 120px;
            background: #d97706;
            color: #ffffff;
            white-space: nowrap;
          }

          &.col-action {
            width: 36px;
            min-width: 36px;
            max-width: 36px;
            background: transparent;
            border: none;
          }
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #e2e8f0;

          &:hover {
            background: #f8fafc;
          }

          td {
            padding: 0.45rem 0.65rem;
            vertical-align: middle;
            border: 1px solid #f1f5f9;

            &.cell-name {
              text-align: left;

              .input-name {
                width: 100%;
                border: 1px solid transparent;
                background: transparent;
                font-size: 0.78rem;
                font-weight: 600;
                color: #1e293b;
                padding: 0.25rem 0.4rem;
                border-radius: 4px;

                &:hover, &:focus {
                  border-color: #cbd5e1;
                  background: #ffffff;
                }
              }
            }

            &.cell-val {
              text-align: right;
              padding: 0.35rem 0.45rem;

              .input-val {
                width: 100%;
                max-width: 110px;
                margin-left: auto;
                text-align: right;
                border: 1px solid #e2e8f0;
                background: #ffffff;
                font-size: 0.78rem;
                font-weight: 600;
                color: #0f172a;
                padding: 0.25rem 0.45rem;
                border-radius: 4px;
                outline: none;

                &:focus {
                  border-color: #0284c7;
                  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
                }
              }
            }

            &.cell-row-total {
              text-align: right;
              font-weight: 800;
              color: #0f172a;
              background: #f8fafc;
              white-space: nowrap;
              padding: 0.45rem 0.85rem;
            }

            &.cell-action {
              width: 36px;
              min-width: 36px;
              max-width: 36px;
              text-align: center;
              border: none;

              .btn-del {
                background: transparent;
                border: none;
                color: #ef4444;
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: 800;
                padding: 0.15rem 0.35rem;
                border-radius: 4px;

                &:hover { background: #fee2e2; }
              }
            }
          }

          &.tco-subtotal-row {
            background: #fefce8;
            border-top: 2px solid #f59e0b;

            td {
              font-size: 0.82rem;
              color: #0f172a;
              border-color: #fde047;
            }
          }
        }
      }
    }

    /* 5-YEAR TOTAL GOLD BOX (MATCHING SCREENSHOT) */
    .total-badge-box-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;

      .gold-total-box {
        background: #eab308;
        color: #000000;
        border: 2px solid #ca8a04;
        border-radius: 6px;
        padding: 0.5rem 1.25rem;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;

        .gt-lbl {
          font-size: 0.75rem;
          font-weight: 800;
        }

        .gt-val {
          font-size: 1.15rem;
          font-weight: 900;
          letter-spacing: -0.01em;
        }
      }

      .green-saving-box {
        background: #dcfce7;
        color: #166534;
        border: 2px solid #86efac;
        border-radius: 6px;
        padding: 0.5rem 1.25rem;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;

        .gt-lbl {
          font-size: 0.75rem;
          font-weight: 800;
        }

        .gt-val {
          font-size: 1.15rem;
          font-weight: 900;
        }
      }
    }

    /* CHART CARD */
    .tco-chart-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.35rem;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .ch-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h3 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
        }
      }

      .ch-body {
        position: relative;
        height: 240px;
        width: 100%;
      }
    }

    /* INSTRUCTION NOTE */
    .user-instruction-note {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 0.85rem 1.15rem;

      p {
        margin: 0;
        font-size: 0.82rem;
        color: #0369a1;
      }
    }

    .font-bold { font-weight: 800; }
    .text-amber { color: #d97706; }
    .text-blue { color: #0284c7; }
    .text-emerald { color: #059669; }
    .text-red { color: #dc2626; }
    .mt-4 { margin-top: 1rem; }
  `]
})
export class BusinessCaseComponent implements AfterViewInit {
  @ViewChild('tcoChart') tcoChartRef!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;
  customerService = inject(CustomerService);

  // Editable Years (Default 2022-2026)
  years = signal<string[]>([...DEFAULT_YEARS]);

  // 1. AS-IS On-Premise Items
  asisItems = signal<TcoExpenseItem[]>([...DEFAULT_ASIS_ITEMS.map(it => this.normalizeItem(it, DEFAULT_YEARS.length))]);

  // 2. RISE with SAP Items
  riseItems = signal<TcoExpenseItem[]>([...DEFAULT_RISE_ITEMS.map(it => this.normalizeItem(it, DEFAULT_YEARS.length))]);

  constructor() {
    effect(() => {
      const custId = this.customerService.activeCustomerId();
      this.loadForCustomer(custId);
    });
  }

  // Helper to normalize any loaded item
  normalizeItem(raw: any, yearCount: number): TcoExpenseItem {
    let vals: number[] = [];
    if (Array.isArray(raw.values)) {
      vals = raw.values.map((v: any) => Number(v) || 0);
    } else {
      vals = [
        Number(raw.y2025) || 0,
        Number(raw.y2026) || 0,
        Number(raw.y2027) || 0,
        Number(raw.y2028) || 0,
        Number(raw.y2029) || 0
      ];
    }
    while (vals.length < yearCount) {
      const lastVal = vals.length > 0 ? vals[vals.length - 1] : 0;
      vals.push(lastVal);
    }
    if (vals.length > yearCount) {
      vals = vals.slice(0, yearCount);
    }
    return {
      id: raw.id || 'item-' + Math.random().toString(36).substring(2, 9),
      name: raw.name || '',
      values: vals,
      isCustom: !!raw.isCustom
    };
  }

  // Row item total
  getItemTotal(item: TcoExpenseItem): number {
    if (!item || !item.values) return 0;
    return item.values.reduce((sum, v) => sum + (Number(v) || 0), 0);
  }

  // AS-IS per year sum
  asisYearSum(index: number): number {
    return this.asisItems().reduce((acc, it) => acc + (Number(it.values?.[index]) || 0), 0);
  }

  // Total AS-IS for all years
  asisTotalAllYears = computed(() => {
    return this.asisItems().reduce((acc, it) => acc + (it.values || []).reduce((s, v) => s + (Number(v) || 0), 0), 0);
  });

  // RISE per year sum
  riseYearSum(index: number): number {
    return this.riseItems().reduce((acc, it) => acc + (Number(it.values?.[index]) || 0), 0);
  }

  // Total RISE for all years
  riseTotalAllYears = computed(() => {
    return this.riseItems().reduce((acc, it) => acc + (it.values || []).reduce((s, v) => s + (Number(v) || 0), 0), 0);
  });

  // Difference per year
  netDifference(index: number): number {
    return this.asisYearSum(index) - this.riseYearSum(index);
  }

  // Cumulative total difference
  totalDifference = computed(() => {
    return this.asisTotalAllYears() - this.riseTotalAllYears();
  });

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initChart();
    }, 100);
  }

  private loadForCustomer(custId: string): void {
    if (!custId) return;
    try {
      const savedYears = localStorage.getItem(`taskforce_tco_years_${custId}`);
      if (savedYears) {
        const parsed = JSON.parse(savedYears);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.years.set(parsed);
        }
      } else {
        this.years.set([...DEFAULT_YEARS]);
      }

      const yearCount = this.years().length;
      const savedAsis = localStorage.getItem(`taskforce_tco_asis_${custId}`);
      if (savedAsis) {
        const parsed = JSON.parse(savedAsis);
        if (Array.isArray(parsed)) {
          this.asisItems.set(parsed.map(it => this.normalizeItem(it, yearCount)));
        }
      } else {
        this.asisItems.set(DEFAULT_ASIS_ITEMS.map(it => this.normalizeItem(it, yearCount)));
      }

      const savedRise = localStorage.getItem(`taskforce_tco_rise_${custId}`);
      if (savedRise) {
        const parsed = JSON.parse(savedRise);
        if (Array.isArray(parsed)) {
          this.riseItems.set(parsed.map(it => this.normalizeItem(it, yearCount)));
        }
      } else {
        this.riseItems.set(DEFAULT_RISE_ITEMS.map(it => this.normalizeItem(it, yearCount)));
      }

      this.updateChart();
    } catch (e) {
      console.warn('Failed to load TCO data from storage', e);
    }
  }

  private saveData(): void {
    try {
      const custId = this.customerService.activeCustomerId();
      if (custId) {
        localStorage.setItem(`taskforce_tco_years_${custId}`, JSON.stringify(this.years()));
        localStorage.setItem(`taskforce_tco_asis_${custId}`, JSON.stringify(this.asisItems()));
        localStorage.setItem(`taskforce_tco_rise_${custId}`, JSON.stringify(this.riseItems()));
      }
    } catch (e) {
      console.warn('Failed to save TCO data', e);
    }
  }

  updateYear(index: number, newYear: string): void {
    const arr = [...this.years()];
    arr[index] = newYear;

    if (index === 0 && /^\d{4}$/.test(newYear.trim())) {
      const startNum = parseInt(newYear.trim(), 10);
      for (let i = 1; i < arr.length; i++) {
        arr[i] = String(startNum + i);
      }
    }

    this.years.set(arr);
    this.saveData();
    this.updateChart();
  }

  shiftYears(delta: number): void {
    const firstYearNum = parseInt(this.years()[0], 10);
    if (!isNaN(firstYearNum)) {
      const newStart = firstYearNum + delta;
      const newYears = this.years().map((_, idx) => String(newStart + idx));
      this.years.set(newYears);
      this.saveData();
      this.updateChart();
    }
  }

  addYear(): void {
    const arr = [...this.years()];
    const lastStr = arr[arr.length - 1] || '2026';
    const lastNum = parseInt(lastStr.trim(), 10);
    const newYear = !isNaN(lastNum) ? String(lastNum + 1) : `Yıl ${arr.length + 1}`;
    arr.push(newYear);
    this.years.set(arr);

    // Extend values for all asis items
    this.asisItems.update(items => items.map(item => {
      const vals = [...(item.values || [])];
      const prev = vals.length > 0 ? vals[vals.length - 1] : 0;
      vals.push(prev);
      return { ...item, values: vals };
    }));

    // Extend values for all rise items
    this.riseItems.update(items => items.map(item => {
      const vals = [...(item.values || [])];
      const prev = vals.length > 0 ? vals[vals.length - 1] : 0;
      vals.push(prev);
      return { ...item, values: vals };
    }));

    this.saveData();
    this.updateChart();
  }

  removeYear(): void {
    if (this.years().length <= 1) return;

    const arr = [...this.years()];
    arr.pop();
    this.years.set(arr);

    // Pop last value for all asis items
    this.asisItems.update(items => items.map(item => {
      const vals = [...(item.values || [])];
      vals.pop();
      return { ...item, values: vals };
    }));

    // Pop last value for all rise items
    this.riseItems.update(items => items.map(item => {
      const vals = [...(item.values || [])];
      vals.pop();
      return { ...item, values: vals };
    }));

    this.saveData();
    this.updateChart();
  }

  onDataChanged(): void {
    this.asisItems.update(v => [...v]);
    this.riseItems.update(v => [...v]);
    this.saveData();
    this.updateChart();
  }

  addAsisRow(): void {
    const count = this.years().length;
    const newItem: TcoExpenseItem = {
      id: 'a-custom-' + Date.now(),
      name: 'Yeni Gider Kalemi',
      values: new Array(count).fill(10000),
      isCustom: true
    };
    this.asisItems.update(v => [...v, newItem]);
    this.saveData();
    this.updateChart();
  }

  removeAsisRow(idx: number): void {
    this.asisItems.update(v => v.filter((_, i) => i !== idx));
    this.saveData();
    this.updateChart();
  }

  addRiseRow(): void {
    const count = this.years().length;
    const newItem: TcoExpenseItem = {
      id: 'r-custom-' + Date.now(),
      name: 'Ek RISE Hizmeti',
      values: new Array(count).fill(20000),
      isCustom: true
    };
    this.riseItems.update(v => [...v, newItem]);
    this.saveData();
    this.updateChart();
  }

  removeRiseRow(idx: number): void {
    this.riseItems.update(v => v.filter((_, i) => i !== idx));
    this.saveData();
    this.updateChart();
  }

  resetToDefaults(): void {
    this.years.set([...DEFAULT_YEARS]);
    this.asisItems.set(DEFAULT_ASIS_ITEMS.map(it => this.normalizeItem(it, DEFAULT_YEARS.length)));
    this.riseItems.set(DEFAULT_RISE_ITEMS.map(it => this.normalizeItem(it, DEFAULT_YEARS.length)));
    this.saveData();
    this.updateChart();
  }

  private getCumulativeData(): { asisCum: number[]; riseCum: number[] } {
    const yearsCount = this.years().length;
    let runningAsis = 0;
    const asisCum: number[] = [];
    for (let i = 0; i < yearsCount; i++) {
      runningAsis += this.asisYearSum(i);
      asisCum.push(runningAsis);
    }

    let runningRise = 0;
    const riseCum: number[] = [];
    for (let i = 0; i < yearsCount; i++) {
      runningRise += this.riseYearSum(i);
      riseCum.push(runningRise);
    }

    return { asisCum, riseCum };
  }

  private initChart(): void {
    if (!this.tcoChartRef?.nativeElement) return;

    const { asisCum, riseCum } = this.getCumulativeData();

    this.chartInstance = new Chart(this.tcoChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: [...this.years()],
        datasets: [
          {
            label: 'AS-IS On-Premise Kümülatif (€)',
            data: asisCum,
            borderColor: '#eab308',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3
          },
          {
            label: 'RISE with SAP Kümülatif (€)',
            data: riseCum,
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => '€' + Number(val).toLocaleString()
            }
          }
        }
      }
    });
  }

  private updateChart(): void {
    if (!this.chartInstance) return;

    const { asisCum, riseCum } = this.getCumulativeData();

    this.chartInstance.data.labels = [...this.years()];
    this.chartInstance.data.datasets[0].data = asisCum;
    this.chartInstance.data.datasets[1].data = riseCum;
    this.chartInstance.update();
  }

  exportToCSV(): void {
    const y = this.years();
    let csv = `Kategori;Gider Kalemi;${y.join(';')};Toplam\n`;
    this.asisItems().forEach(i => {
      const tot = this.getItemTotal(i);
      csv += `AS-IS;${i.name};${(i.values || []).join(';')};${tot}\n`;
    });
    csv += `AS-IS;TOPLAM;${y.map((_, idx) => this.asisYearSum(idx)).join(';')};${this.asisTotalAllYears()}\n`;

    this.riseItems().forEach(i => {
      const tot = this.getItemTotal(i);
      csv += `RISE;${i.name};${(i.values || []).join(';')};${tot}\n`;
    });
    csv += `RISE;TOPLAM;${y.map((_, idx) => this.riseYearSum(idx)).join(';')};${this.riseTotalAllYears()}\n`;

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.customerService.activeCustomer().name}_Toplam_Sahip_Olma_Maliyeti.csv`;
    link.click();
  }

  printTco(): void {
    window.print();
  }
}
