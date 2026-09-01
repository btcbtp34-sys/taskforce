export interface SapProduct {
  id: string;
  name: string;
  category: string;
  status: 'Active' | 'Planned' | 'Under Review' | 'Optimization Candidate';
  licenseCount: number;
  monthlyCost: number;
  icon: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  sector: string;
  sapUserCount: number;
  activeUserCount: number;
  lowUsageUserCount: number;
  totalLicenseCost: number; // Yıllık EUR
  estimatedOpportunityValue: number; // EUR
  activeOpportunityCount: number;
  taskForceStatus: 'Discovery' | 'Data Collection' | 'Analysis' | 'Opportunity Identification' | 'Solution Design' | 'Business Case' | 'Customer Presentation' | 'Closed';
  progressPercentage: number;
  sapProducts: SapProduct[];
  coreProblems: string[];
  contactPerson: string;
  email: string;
  phone: string;
  logo: string;
  lastAnalysisDate: string;
}
