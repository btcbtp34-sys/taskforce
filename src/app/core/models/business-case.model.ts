export interface BusinessCase {
  id: string;
  customerId: string;
  opportunityId?: string;
  opportunityTitle?: string;
  
  // Input parameters (Slider / Number controls)
  existingAnnualCost: number;
  implementationCost: number;
  annualOperatingCost: number;
  estimatedAnnualSavings: number;
  productivityHoursSaved: number;
  hourlyCostRate: number;
  impactedUserCount: number;

  // Calculated outputs
  roiPercentage: number;
  paybackPeriodMonths: number;
  netAnnualBenefit: number;
  threeYearValue: number;
  netPresentValue: number;

  // 3-Year Cashflow Breakdown
  cashflow: {
    year: number;
    initialInvestment: number;
    operatingCost: number;
    savings: number;
    productivityValue: number;
    netBenefit: number;
    cumulativeBenefit: number;
  }[];
}
