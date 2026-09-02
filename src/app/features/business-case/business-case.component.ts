import { Component, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface TcoExpenseItem {
  id: string;
  name: string;
  y2025: number;
  y2026: number;
  y2027: number;
  y2028: number;
  y2029: number;
  isCustom?: boolean;
}

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
            <span class="brand-tco-title">TCO</span>
            <span class="sub-badge">5 Yıllık Finansal Modelleme & Kıyaslama</span>
          </div>
          <h1 class="page-title">Total Cost of Ownership (TCO) & Finansal Simülasyon</h1>
          <p class="page-subtitle">Mevcut On-Premise Giderleri ile RISE with SAP Bulut Dönüşüm Maliyetlerinin 5 Yıllık Karşılaştırması</p>
        </div>

        <div class="header-actions">
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
            <span class="s-lbl">5 Yıllık AS-IS On-Premise Toplamı</span>
            <app-icon name="database" [size]="16" color="#d97706"></app-icon>
          </div>
          <div class="s-val text-amber">€{{ asisTotal5Years() | number:'1.2-2' }}</div>
          <div class="s-sub">Geleneksel Bakım, Donanım & Yükseltmeler</div>
        </div>

        <div class="sum-card rise">
          <div class="s-top">
            <span class="s-lbl">5 Yıllık RISE with SAP Toplamı</span>
            <app-icon name="sparkles" [size]="16" color="#0284c7"></app-icon>
          </div>
          <div class="s-val text-blue">€{{ riseTotal5Years() | number:'1.2-2' }}</div>
          <div class="s-sub">Bulut Lisansı, Altyapı & Dönüşüm Projesi</div>
        </div>

        <div class="sum-card saving">
          <div class="s-top">
            <span class="s-lbl">5 Yıllık Net TCO Farkı / Bütçe</span>
            <app-icon name="dollar" [size]="16" color="#059669"></app-icon>
          </div>
          <div class="s-val text-emerald">€{{ (asisTotal5Years() - riseTotal5Years() > 0 ? asisTotal5Years() - riseTotal5Years() : riseTotal5Years() - asisTotal5Years()) | number:'1.2-2' }}</div>
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
                <th class="col-year">2025</th>
                <th class="col-year">2026</th>
                <th class="col-year">2027</th>
                <th class="col-year">2028</th>
                <th class="col-year">2029</th>
                <th class="col-total">Toplam (5 Yıl)</th>
                <th class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              @for (item of asisItems(); track item.id; let idx = $index) {
                <tr>
                  <td class="cell-name">
                    <input type="text" [(ngModel)]="item.name" (ngModelChange)="onDataChanged()" class="input-name" placeholder="Gider Kalemi Adı" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2025" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2026" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2027" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2028" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2029" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-row-total">
                    {{ (item.y2025 + item.y2026 + item.y2027 + item.y2028 + item.y2029) | number:'1.2-2' }}
                  </td>
                  <td class="cell-action">
                    <button *ngIf="item.isCustom" class="btn-del" (click)="removeAsisRow(idx)" title="Satırı Sil">✕</button>
                  </td>
                </tr>
              }
              <!-- Subtotals Row -->
              <tr class="tco-subtotal-row">
                <td class="cell-name font-bold">YILLIK TOPLAM GİDER</td>
                <td class="cell-val font-bold">{{ asisSum2025() | number:'1.2-2' }}</td>
                <td class="cell-val font-bold">{{ asisSum2026() | number:'1.2-2' }}</td>
                <td class="cell-val font-bold">{{ asisSum2027() | number:'1.2-2' }}</td>
                <td class="cell-val font-bold">{{ asisSum2028() | number:'1.2-2' }}</td>
                <td class="cell-val font-bold">{{ asisSum2029() | number:'1.2-2' }}</td>
                <td class="cell-row-total font-bold">—</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 5-Year Total Gold Box -->
        <div class="total-badge-box-container">
          <div class="gold-total-box">
            <span class="gt-lbl">5 YILLIK AS-IS TOPLAM:</span>
            <span class="gt-val">{{ asisTotal5Years() | number:'1.2-2' }} €</span>
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
                <th class="col-year">2025</th>
                <th class="col-year">2026</th>
                <th class="col-year">2027</th>
                <th class="col-year">2028</th>
                <th class="col-year">2029</th>
                <th class="col-total">Toplam (5 Yıl)</th>
                <th class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              @for (item of riseItems(); track item.id; let idx = $index) {
                <tr>
                  <td class="cell-name">
                    <input type="text" [(ngModel)]="item.name" (ngModelChange)="onDataChanged()" class="input-name" placeholder="Kalem Adı" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2025" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2026" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2027" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2028" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-val">
                    <input type="number" [(ngModel)]="item.y2029" (ngModelChange)="onDataChanged()" class="input-val" step="1000" />
                  </td>
                  <td class="cell-row-total">
                    {{ (item.y2025 + item.y2026 + item.y2027 + item.y2028 + item.y2029) | number:'1.2-2' }}
                  </td>
                  <td class="cell-action">
                    <button *ngIf="item.isCustom" class="btn-del" (click)="removeRiseRow(idx)" title="Satırı Sil">✕</button>
                  </td>
                </tr>
              }
              <!-- Subtotals Row -->
              <tr class="tco-subtotal-row">
                <td class="cell-name font-bold">YILLIK TOPLAM RISE GİDERİ</td>
                <td class="cell-val font-bold">{{ riseSum2025() | number:'1.2-2' }}</td>
                <td class="cell-val font-bold">{{ riseSum2026() | number:'1.2-2' }}</td>
                <td class="cell-val font-bold">{{ riseSum2027() | number:'1.2-2' }}</td>
                <td class="cell-val font-bold">{{ riseSum2028() | number:'1.2-2' }}</td>
                <td class="cell-val font-bold">{{ riseSum2029() | number:'1.2-2' }}</td>
                <td class="cell-row-total font-bold">—</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 5-Year Total Gold Box -->
        <div class="total-badge-box-container">
          <div class="gold-total-box">
            <span class="gt-lbl">5 YILLIK RISE WITH SAP TOPLAM:</span>
            <span class="gt-val">{{ riseTotal5Years() | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>

      <!-- Interactive Table 3: SAVING / NET FARK -->
      <div class="tco-section-card mt-4">
        <div class="section-title-bar">
          <div class="st-left">
            <span class="table-num">3</span>
            <h3>SAVING & TCO FARK ANALİZİ</h3>
          </div>
        </div>

        <div class="table-responsive">
          <table class="tco-table saving-table">
            <thead>
              <tr class="tco-gold-header">
                <th class="col-name">Kalem</th>
                <th class="col-year">2025</th>
                <th class="col-year">2026</th>
                <th class="col-year">2027</th>
                <th class="col-year">2028</th>
                <th class="col-year">2029</th>
                <th class="col-total">5 Yıllık Net Durum</th>
                <th class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="cell-name font-bold text-emerald">YILLIK NET TASARRUF / FARK</td>
                <td class="cell-val font-bold" [class.text-red]="asisSum2025() - riseSum2025() < 0" [class.text-emerald]="asisSum2025() - riseSum2025() >= 0">
                  {{ (asisSum2025() - riseSum2025()) | number:'1.2-2' }}
                </td>
                <td class="cell-val font-bold" [class.text-red]="asisSum2026() - riseSum2026() < 0" [class.text-emerald]="asisSum2026() - riseSum2026() >= 0">
                  {{ (asisSum2026() - riseSum2026()) | number:'1.2-2' }}
                </td>
                <td class="cell-val font-bold" [class.text-red]="asisSum2027() - riseSum2027() < 0" [class.text-emerald]="asisSum2027() - riseSum2027() >= 0">
                  {{ (asisSum2027() - riseSum2027()) | number:'1.2-2' }}
                </td>
                <td class="cell-val font-bold" [class.text-red]="asisSum2028() - riseSum2028() < 0" [class.text-emerald]="asisSum2028() - riseSum2028() >= 0">
                  {{ (asisSum2028() - riseSum2028()) | number:'1.2-2' }}
                </td>
                <td class="cell-val font-bold" [class.text-red]="asisSum2029() - riseSum2029() < 0" [class.text-emerald]="asisSum2029() - riseSum2029() >= 0">
                  {{ (asisSum2029() - riseSum2029()) | number:'1.2-2' }}
                </td>
                <td class="cell-row-total font-bold text-emerald">
                  {{ (asisTotal5Years() - riseTotal5Years()) | number:'1.2-2' }} €
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="total-badge-box-container">
          <div class="green-saving-box">
            <span class="gt-lbl">5 YILLIK KÜMÜLATİF TCO FARKI:</span>
            <span class="gt-val">{{ (asisTotal5Years() - riseTotal5Years()) | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>

      <!-- TCO 5-Year Cumulative Visual Curve Chart -->
      <div class="tco-chart-card mt-4">
        <div class="ch-header">
          <app-icon name="chart" [size]="18" color="#0284c7"></app-icon>
          <h3>5 Yıllık Kümülatif Maliyet Trendi (AS-IS On-Premise vs RISE with SAP)</h3>
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
            width: 320px;
          }

          &.col-total {
            background: #d97706;
            color: #ffffff;
          }

          &.col-action {
            width: 40px;
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

              .input-val {
                width: 110px;
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
            }

            &.cell-action {
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

  // 1. AS-IS On-Premise Items (Exact structure from user screenshot)
  asisItems = signal<TcoExpenseItem[]>([
    { id: 'a1', name: 'Existing Maintenance', y2025: 80000, y2026: 80000, y2027: 80000, y2028: 80000, y2029: 80000 },
    { id: 'a2', name: 'Additional License (S/4 Transformation)', y2025: 0, y2026: 10000, y2027: 0, y2028: 0, y2029: 0 },
    { id: 'a3', name: 'Additional Maintenance', y2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0 },
    { id: 'a4', name: 'Infra/Hosting', y2025: 36000, y2026: 36000, y2027: 36000, y2028: 36000, y2029: 36000 },
    { id: 'a5', name: 'Infra Extensions', y2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0 },
    { id: 'a6', name: 'Disaster Recovery', y2025: 10000, y2026: 10000, y2027: 10000, y2028: 10000, y2029: 10000 },
    { id: 'a7', name: 'Security', y2025: 2000, y2026: 2000, y2027: 2000, y2028: 2000, y2029: 2000 },
    { id: 'a8', name: 'Basis/Upgrade', y2025: 36000, y2026: 136000, y2027: 36000, y2028: 36000, y2029: 36000 },
    { id: 'a9', name: 'Innovation Cost (AI, Sustainability, LowCode etc..)', y2025: 50000, y2026: 50000, y2027: 50000, y2028: 50000, y2029: 50000 }
  ]);

  // 2. RISE with SAP Items (Exact structure from user screenshot)
  riseItems = signal<TcoExpenseItem[]>([
    { id: 'r1', name: 'RISE Fee', y2025: 500000, y2026: 400000, y2027: 400000, y2028: 400000, y2029: 400000 },
    { id: 'r2', name: 'RISE Fund', y2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0 },
    { id: 'r3', name: 'Project / Implementation', y2025: 200000, y2026: 0, y2027: 0, y2028: 0, y2029: 0 }
  ]);

  // Computed Sums for AS-IS
  asisSum2025 = computed(() => this.asisItems().reduce((acc, it) => acc + (Number(it.y2025) || 0), 0));
  asisSum2026 = computed(() => this.asisItems().reduce((acc, it) => acc + (Number(it.y2026) || 0), 0));
  asisSum2027 = computed(() => this.asisItems().reduce((acc, it) => acc + (Number(it.y2027) || 0), 0));
  asisSum2028 = computed(() => this.asisItems().reduce((acc, it) => acc + (Number(it.y2028) || 0), 0));
  asisSum2029 = computed(() => this.asisItems().reduce((acc, it) => acc + (Number(it.y2029) || 0), 0));
  asisTotal5Years = computed(() => 
    this.asisSum2025() + this.asisSum2026() + this.asisSum2027() + this.asisSum2028() + this.asisSum2029()
  );

  // Computed Sums for RISE
  riseSum2025 = computed(() => this.riseItems().reduce((acc, it) => acc + (Number(it.y2025) || 0), 0));
  riseSum2026 = computed(() => this.riseItems().reduce((acc, it) => acc + (Number(it.y2026) || 0), 0));
  riseSum2027 = computed(() => this.riseItems().reduce((acc, it) => acc + (Number(it.y2027) || 0), 0));
  riseSum2028 = computed(() => this.riseItems().reduce((acc, it) => acc + (Number(it.y2028) || 0), 0));
  riseSum2029 = computed(() => this.riseItems().reduce((acc, it) => acc + (Number(it.y2029) || 0), 0));
  riseTotal5Years = computed(() => 
    this.riseSum2025() + this.riseSum2026() + this.riseSum2027() + this.riseSum2028() + this.riseSum2029()
  );

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initChart();
    }, 100);
  }

  onDataChanged(): void {
    this.asisItems.update(v => [...v]);
    this.riseItems.update(v => [...v]);
    this.updateChart();
  }

  addAsisRow(): void {
    const newItem: TcoExpenseItem = {
      id: 'a-custom-' + Date.now(),
      name: 'Yeni Gider Kalemi',
      y2025: 10000,
      y2026: 10000,
      y2027: 10000,
      y2028: 10000,
      y2029: 10000,
      isCustom: true
    };
    this.asisItems.update(v => [...v, newItem]);
    this.updateChart();
  }

  removeAsisRow(idx: number): void {
    this.asisItems.update(v => v.filter((_, i) => i !== idx));
    this.updateChart();
  }

  addRiseRow(): void {
    const newItem: TcoExpenseItem = {
      id: 'r-custom-' + Date.now(),
      name: 'Ek RISE Hizmeti',
      y2025: 20000,
      y2026: 20000,
      y2027: 20000,
      y2028: 20000,
      y2029: 20000,
      isCustom: true
    };
    this.riseItems.update(v => [...v, newItem]);
    this.updateChart();
  }

  removeRiseRow(idx: number): void {
    this.riseItems.update(v => v.filter((_, i) => i !== idx));
    this.updateChart();
  }

  resetToDefaults(): void {
    this.asisItems.set([
      { id: 'a1', name: 'Existing Maintenance', y2025: 80000, y2026: 80000, y2027: 80000, y2028: 80000, y2029: 80000 },
      { id: 'a2', name: 'Additional License (S/4 Transformation)', y2025: 0, y2026: 10000, y2027: 0, y2028: 0, y2029: 0 },
      { id: 'a3', name: 'Additional Maintenance', y2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0 },
      { id: 'a4', name: 'Infra/Hosting', y2025: 36000, y2026: 36000, y2027: 36000, y2028: 36000, y2029: 36000 },
      { id: 'a5', name: 'Infra Extensions', y2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0 },
      { id: 'a6', name: 'Disaster Recovery', y2025: 10000, y2026: 10000, y2027: 10000, y2028: 10000, y2029: 10000 },
      { id: 'a7', name: 'Security', y2025: 2000, y2026: 2000, y2027: 2000, y2028: 2000, y2029: 2000 },
      { id: 'a8', name: 'Basis/Upgrade', y2025: 36000, y2026: 136000, y2027: 36000, y2028: 36000, y2029: 36000 },
      { id: 'a9', name: 'Innovation Cost (AI, Sustainability, LowCode etc..)', y2025: 50000, y2026: 50000, y2027: 50000, y2028: 50000, y2029: 50000 }
    ]);

    this.riseItems.set([
      { id: 'r1', name: 'RISE Fee', y2025: 500000, y2026: 400000, y2027: 400000, y2028: 400000, y2029: 400000 },
      { id: 'r2', name: 'RISE Fund', y2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0 },
      { id: 'r3', name: 'Project / Implementation', y2025: 200000, y2026: 0, y2027: 0, y2028: 0, y2029: 0 }
    ]);

    this.updateChart();
  }

  private initChart(): void {
    if (!this.tcoChartRef?.nativeElement) return;

    const asisCum = [
      this.asisSum2025(),
      this.asisSum2025() + this.asisSum2026(),
      this.asisSum2025() + this.asisSum2026() + this.asisSum2027(),
      this.asisSum2025() + this.asisSum2026() + this.asisSum2027() + this.asisSum2028(),
      this.asisTotal5Years()
    ];

    const riseCum = [
      this.riseSum2025(),
      this.riseSum2025() + this.riseSum2026(),
      this.riseSum2025() + this.riseSum2026() + this.riseSum2027(),
      this.riseSum2025() + this.riseSum2026() + this.riseSum2027() + this.riseSum2028(),
      this.riseTotal5Years()
    ];

    this.chartInstance = new Chart(this.tcoChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['2025', '2026', '2027', '2028', '2029'],
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

    const asisCum = [
      this.asisSum2025(),
      this.asisSum2025() + this.asisSum2026(),
      this.asisSum2025() + this.asisSum2026() + this.asisSum2027(),
      this.asisSum2025() + this.asisSum2026() + this.asisSum2027() + this.asisSum2028(),
      this.asisTotal5Years()
    ];

    const riseCum = [
      this.riseSum2025(),
      this.riseSum2025() + this.riseSum2026(),
      this.riseSum2025() + this.riseSum2026() + this.riseSum2027(),
      this.riseSum2025() + this.riseSum2026() + this.riseSum2027() + this.riseSum2028(),
      this.riseTotal5Years()
    ];

    this.chartInstance.data.datasets[0].data = asisCum;
    this.chartInstance.data.datasets[1].data = riseCum;
    this.chartInstance.update();
  }

  exportToCSV(): void {
    let csv = 'Kategori;Gider Kalemi;2025;2026;2027;2028;2029;Toplam\n';
    this.asisItems().forEach(i => {
      const tot = i.y2025 + i.y2026 + i.y2027 + i.y2028 + i.y2029;
      csv += `AS-IS;${i.name};${i.y2025};${i.y2026};${i.y2027};${i.y2028};${i.y2029};${tot}\n`;
    });
    csv += `AS-IS;TOPLAM;${this.asisSum2025()};${this.asisSum2026()};${this.asisSum2027()};${this.asisSum2028()};${this.asisSum2029()};${this.asisTotal5Years()}\n`;

    this.riseItems().forEach(i => {
      const tot = i.y2025 + i.y2026 + i.y2027 + i.y2028 + i.y2029;
      csv += `RISE;${i.name};${i.y2025};${i.y2026};${i.y2027};${i.y2028};${i.y2029};${tot}\n`;
    });
    csv += `RISE;TOPLAM;${this.riseSum2025()};${this.riseSum2026()};${this.riseSum2027()};${this.riseSum2028()};${this.riseSum2029()};${this.riseTotal5Years()}\n`;

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ABC_Holding_TCO_Model.csv';
    link.click();
  }

  printTco(): void {
    window.print();
  }
}
