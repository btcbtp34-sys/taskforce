import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BusinessCaseService } from '../../core/services/business-case.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-business-case',
  standalone: true,
  imports: [CommonModule, RouterModule, KpiCardComponent, IconComponent],
  template: `
    <div class="bc-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Business Case Calculator & Finansal Simülatör</h1>
          <p class="page-subtitle">İnteraktif Parametreler İle Anlık ROI, Payback ve 3 Yıllık Net Fayda Modellemesi</p>
        </div>
      </div>

      <!-- Real-Time Calculated Financial Output Cards -->
      <div class="kpi-grid">
        <app-kpi-card 
          label="ROI (Yatırım Getirisi Oranı)" 
          [value]="'%' + bcService.roiPercentage()" 
          trendText="Payback: 6 Ay"
          subtext="Net Karlılık Performansı"
          theme="emerald">
          <app-icon name="chart" [size]="20" color="#059669"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="Payback Period (Geri Ödeme)" 
          [value]="bcService.paybackPeriodMonths()" 
          unit="Ay"
          trendText="Hızlı Geri Dönüş"
          theme="primary">
          <app-icon name="bolt" [size]="20" color="#0284c7"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="Net Yıllık Fayda" 
          [value]="'€' + (bcService.netBenefit() | number)" 
          unit="/ Yıl"
          trendText="Yıllık Net Katkı"
          theme="emerald">
          <app-icon name="dollar" [size]="20" color="#059669"></app-icon>
        </app-kpi-card>

        <app-kpi-card 
          label="3 Yıllık Kumulatif Net Değer" 
          [value]="'€' + (bcService.threeYearValue() | number)" 
          subtext="3 Yıllık Toplam Katma Değer"
          theme="indigo">
          <app-icon name="sparkles" [size]="20" color="#6366f1"></app-icon>
        </app-kpi-card>
      </div>

      <!-- Main Calculator Controls & Visual Breakdown Grid -->
      <div class="calculator-grid">
        <!-- Interactive Controls Card -->
        <div class="card-box">
          <div class="card-header">
            <h3><app-icon name="sliders" [size]="18"></app-icon> İnteraktif Parametre Simülatörü</h3>
            <span class="sub">Slider veya sayısal alanları değiştirerek sonuçları anlık görün</span>
          </div>

          <div class="control-list">
            <!-- Existing Annual Cost Slider -->
            <div class="control-item">
              <div class="control-label">
                <span>Mevcut Yıllık Lisans Maliyeti</span>
                <strong>€{{ bcService.existingAnnualCost() | number }}</strong>
              </div>
              <input 
                type="range" 
                min="100000" 
                max="1000000" 
                step="10000" 
                [value]="bcService.existingAnnualCost()" 
                (input)="onInputChange('existingAnnualCost', $event)" 
                class="slider" />
            </div>

            <!-- Implementation Cost Slider -->
            <div class="control-item">
              <div class="control-label">
                <span>Tek Seferlik Uygulama (Implementation) Maliyeti</span>
                <strong>€{{ bcService.implementationCost() | number }}</strong>
              </div>
              <input 
                type="range" 
                min="5000" 
                max="150000" 
                step="5000" 
                [value]="bcService.implementationCost()" 
                (input)="onInputChange('implementationCost', $event)" 
                class="slider" />
            </div>

            <!-- Annual Operating Cost Slider -->
            <div class="control-item">
              <div class="control-label">
                <span>Yıllık İşletim / Lisans (BTP) Maliyeti</span>
                <strong>€{{ bcService.annualOperatingCost() | number }}</strong>
              </div>
              <input 
                type="range" 
                min="2000" 
                max="50000" 
                step="1000" 
                [value]="bcService.annualOperatingCost()" 
                (input)="onInputChange('annualOperatingCost', $event)" 
                class="slider" />
            </div>

            <!-- Estimated Annual Savings Slider -->
            <div class="control-item">
              <div class="control-label">
                <span>Tahmini Yıllık Lisans Tasarrufu</span>
                <strong>€{{ bcService.estimatedAnnualSavings() | number }}</strong>
              </div>
              <input 
                type="range" 
                min="10000" 
                max="300000" 
                step="5000" 
                [value]="bcService.estimatedAnnualSavings()" 
                (input)="onInputChange('estimatedAnnualSavings', $event)" 
                class="slider emerald" />
            </div>

            <!-- Productivity Hours Saved Slider -->
            <div class="control-item">
              <div class="control-label">
                <span>Kazanılacak Yıllık Çalışma Saati</span>
                <strong>{{ bcService.productivityHoursSaved() | number }} Saat / Yıl</strong>
              </div>
              <input 
                type="range" 
                min="100" 
                max="5000" 
                step="100" 
                [value]="bcService.productivityHoursSaved()" 
                (input)="onInputChange('productivityHoursSaved', $event)" 
                class="slider emerald" />
            </div>

            <!-- Hourly Cost Rate Input -->
            <div class="dual-inputs">
              <div class="input-box">
                <label>Saatlik Personel Maliyet Oranı (€/Saat)</label>
                <input 
                  type="number" 
                  [value]="bcService.hourlyCostRate()" 
                  (input)="onInputChange('hourlyCostRate', $event)" />
              </div>
              <div class="input-box">
                <label>Etkilenen Kullanıcı Sayısı</label>
                <input 
                  type="number" 
                  [value]="bcService.impactedUserCount()" 
                  (input)="onInputChange('impactedUserCount', $event)" />
              </div>
            </div>
          </div>
        </div>

        <!-- 3-Year Cashflow Table & Summary -->
        <div class="card-box">
          <div class="card-header">
            <h3><app-icon name="chart" [size]="18"></app-icon> 3 Yıllık Nakit Akışı & Katma Değer Tablosu</h3>
            <span class="sub">Kumulatif Katma Değer Analizi</span>
          </div>

          <div class="table-responsive">
            <table class="cashflow-table">
              <thead>
                <tr>
                  <th>Yıl</th>
                  <th>Yatırım (€)</th>
                  <th>İşletim (€)</th>
                  <th>Lisans Tasarrufu (€)</th>
                  <th>Zaman Kazancı (€)</th>
                  <th>Net Fayda (€)</th>
                  <th>Kumulatif Net (€)</th>
                </tr>
              </thead>
              <tbody>
                @for (cf of bcService.cashflowBreakdown(); track cf.year) {
                  <tr>
                    <td><strong>Yıl {{ cf.year }}</strong></td>
                    <td><span [class.text-danger]="cf.initialInvestment > 0">€{{ cf.initialInvestment | number }}</span></td>
                    <td>€{{ cf.operatingCost | number }}</td>
                    <td><strong class="text-success">€{{ cf.savings | number }}</strong></td>
                    <td>€{{ cf.productivityValue | number }}</td>
                    <td><strong class="text-success">€{{ cf.netBenefit | number }}</strong></td>
                    <td>
                      <span class="cum-pill" [class.positive]="cf.cumulativeBenefit > 0">
                        €{{ cf.cumulativeBenefit | number }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="executive-summary-box">
            <h4><app-icon name="info" [size]="16" color="#0369a1"></app-icon> Yönetici Özeti (Executive Summary)</h4>
            <p>
              Modellenen senaryoya göre, <strong>€{{ bcService.implementationCost() | number }}</strong> tutarındaki tek seferlik yatırım ile 
              ilk yıl <strong>€{{ bcService.estimatedAnnualSavings() | number }}</strong> doğrudan lisans tasarrufu ve 
              <strong>{{ bcService.productivityHoursSaved() | number }} saat</strong> iş gücü kazanımı elde edilmektedir. 
              Proje <strong>{{ bcService.paybackPeriodMonths() }} ay</strong> içerisinde kendini amorti etmekte ve 3 yılda net 
              <strong>€{{ bcService.threeYearValue() | number }}</strong> katma değer üretmektedir.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bc-page {
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

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .calculator-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 1.25rem;
    }

    .card-box {
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
        h3 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.4rem; }
        .sub { font-size: 0.75rem; color: #64748b; }
      }
    }

    .control-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .control-item {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        .control-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: #475569;
          strong { color: #0f172a; font-size: 0.85rem; }
        }

        .slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #cbd5e1;
          outline: none;
          accent-color: #0284c7;

          &.emerald { accent-color: #10b981; }
        }
      }
    }

    .dual-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem;

      .input-box {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        label { font-size: 0.72rem; color: #64748b; font-weight: 700; }
        input {
          padding: 0.4rem;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          font-size: 0.82rem;
          font-weight: 700;
          outline: none;
        }
      }
    }

    .table-responsive { overflow-x: auto; }

    .cashflow-table {
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

      td { padding: 0.75rem 0.85rem; border-bottom: 1px solid #f1f5f9; }
    }

    .text-danger { color: #ef4444; font-weight: 700; }
    .text-success { color: #059669; }

    .cum-pill {
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      background: #f1f5f9;
      color: #475569;

      &.positive { background: #ecfdf5; color: #059669; }
    }

    .executive-summary-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      margin-top: 0.5rem;

      h4 { margin: 0 0 0.3rem 0; font-size: 0.85rem; font-weight: 800; color: #0369a1; display: flex; align-items: center; gap: 0.4rem; }
      p { margin: 0; font-size: 0.8rem; color: #0c4a6e; line-height: 1.45; }
    }
  `]
})
export class BusinessCaseComponent {
  bcService = inject(BusinessCaseService);

  onInputChange(key: string, event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.bcService.updateInputs({ [key]: val });
  }
}
