import { Injectable, signal, computed } from '@angular/core';
import { BusinessCase } from '../models/business-case.model';

@Injectable({
  providedIn: 'root'
})
export class BusinessCaseService {
  private existingAnnualCostSignal = signal<number>(450000);
  private implementationCostSignal = signal<number>(30000);
  private annualOperatingCostSignal = signal<number>(10000);
  private estimatedAnnualSavingsSignal = signal<number>(70000);
  private productivityHoursSavedSignal = signal<number>(1200);
  private hourlyCostRateSignal = signal<number>(25);
  private impactedUserCountSignal = signal<number>(150);

  readonly existingAnnualCost = this.existingAnnualCostSignal.asReadonly();
  readonly implementationCost = this.implementationCostSignal.asReadonly();
  readonly annualOperatingCost = this.annualOperatingCostSignal.asReadonly();
  readonly estimatedAnnualSavings = this.estimatedAnnualSavingsSignal.asReadonly();
  readonly productivityHoursSaved = this.productivityHoursSavedSignal.asReadonly();
  readonly hourlyCostRate = this.hourlyCostRateSignal.asReadonly();
  readonly impactedUserCount = this.impactedUserCountSignal.asReadonly();

  // Financial Outputs
  readonly netAnnualSavings = computed(() => 
    Math.max(0, this.estimatedAnnualSavingsSignal() - this.annualOperatingCostSignal())
  );

  readonly annualProductivityValue = computed(() => 
    this.productivityHoursSavedSignal() * this.hourlyCostRateSignal()
  );

  readonly totalAnnualBenefit = computed(() => 
    this.netAnnualSavings() + this.annualProductivityValue()
  );

  readonly roiPercentage = computed(() => {
    const cost = this.implementationCostSignal();
    if (cost <= 0) return 0;
    const benefit = this.totalAnnualBenefit();
    return Math.round(((benefit - this.annualOperatingCostSignal()) / cost) * 100);
  });

  readonly paybackPeriodMonths = computed(() => {
    const cost = this.implementationCostSignal();
    const monthlyNetBenefit = this.totalAnnualBenefit() / 12;
    if (monthlyNetBenefit <= 0) return 0;
    return Math.round((cost / monthlyNetBenefit) * 10) / 10;
  });

  readonly netBenefit = computed(() => 
    this.totalAnnualBenefit() - this.annualOperatingCostSignal()
  );

  readonly threeYearValue = computed(() => {
    const total3YrBenefit = (this.totalAnnualBenefit() * 3);
    const total3YrCost = this.implementationCostSignal() + (this.annualOperatingCostSignal() * 3);
    return total3YrBenefit - total3YrCost;
  });

  readonly cashflowBreakdown = computed(() => {
    const impl = this.implementationCostSignal();
    const opex = this.annualOperatingCostSignal();
    const savings = this.estimatedAnnualSavingsSignal();
    const prodVal = this.annualProductivityValue();

    let cum = -impl;
    const years = [1, 2, 3];

    return years.map(yr => {
      const net = savings + prodVal - opex;
      cum += net;
      return {
        year: yr,
        initialInvestment: yr === 1 ? impl : 0,
        operatingCost: opex,
        savings,
        productivityValue: prodVal,
        netBenefit: net,
        cumulativeBenefit: cum
      };
    });
  });

  updateInputs(params: {
    existingAnnualCost?: number;
    implementationCost?: number;
    annualOperatingCost?: number;
    estimatedAnnualSavings?: number;
    productivityHoursSaved?: number;
    hourlyCostRate?: number;
    impactedUserCount?: number;
  }): void {
    if (params.existingAnnualCost !== undefined) this.existingAnnualCostSignal.set(params.existingAnnualCost);
    if (params.implementationCost !== undefined) this.implementationCostSignal.set(params.implementationCost);
    if (params.annualOperatingCost !== undefined) this.annualOperatingCostSignal.set(params.annualOperatingCost);
    if (params.estimatedAnnualSavings !== undefined) this.estimatedAnnualSavingsSignal.set(params.estimatedAnnualSavings);
    if (params.productivityHoursSaved !== undefined) this.productivityHoursSavedSignal.set(params.productivityHoursSaved);
    if (params.hourlyCostRate !== undefined) this.hourlyCostRateSignal.set(params.hourlyCostRate);
    if (params.impactedUserCount !== undefined) this.impactedUserCountSignal.set(params.impactedUserCount);
  }
}
