export interface SapUsageRecord {
  id: string;
  userName: string;
  department: string;
  sapModule: string;
  licenseType: 'Professional' | 'Limited' | 'Employee' | 'Developer';
  monthlyTransactions: number;
  annualLicenseCost: number; // EUR
  manualWorkHours: number; // Yıllık Saat
  usageFrequency: 'High' | 'Medium' | 'Low';
  status: 'Normal' | 'Underutilized' | 'Overlicensed' | 'Automation Candidate';
}

export interface ColumnMapping {
  excelColumn: string;
  systemField: string;
  confidenceScore: number; // 0 - 100 %
  autoMapped: boolean;
  status: 'matched' | 'unmatched' | 'manual';
}

export interface SystemFieldOption {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

export interface DataImportSummary {
  fileName: string;
  fileSize: string;
  totalRows: number;
  totalCols: number;
  dataQualityScore: number;
  uploadDate: string;
  mappedCount: number;
}
