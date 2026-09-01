export type OpportunityCategory = 
  | 'LİSANS OPTİMİZASYONU' 
  | 'SAP BTP FIRSATI' 
  | 'SÜREÇ OPTİMİZASYON' 
  | 'AI FIRSATI';

export type ImplementationEffort = 'Low' | 'Medium' | 'High';
export type PriorityLevel = 'Yüksek' | 'Orta' | 'Düşük';
export type OpportunityStatus = 'New' | 'Under Review' | 'Approved' | 'Rejected' | 'Presented';

export interface Opportunity {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  category: OpportunityCategory;
  businessValue: number; // EUR / Year
  annualSavings: number; // EUR / Year
  roi: number; // Percentage
  implementationEffort: ImplementationEffort;
  effortScore: number; // 1 (Easy) to 100 (Hard) - X axis
  valueScore: number; // 1 (Low) to 100 (High) - Y axis
  priority: PriorityLevel;
  confidenceScore: number; // 0 - 100%
  status: OpportunityStatus;
  
  // Detailed attributes
  currentSituation: string;
  dataEvidence: string;
  problem: string;
  proposedSolution: string;
  expectedBenefits: {
    costSavings: string;
    timeSaved: string;
    efficiencyGain: string;
  };
  financialImpactSummary: string;
  quadrant: 'Quick Wins' | 'Strategic Opportunities' | 'High Effort' | 'Low Priority';
}
