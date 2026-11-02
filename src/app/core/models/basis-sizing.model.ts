export interface SapLicenseItem {
  materials: string;
  product: string;
  orders: number;
  quantity: number;
  unit: string;
  metricId?: string;
}

export interface FueClassificationItem {
  classification: string;
  total: number;
  hbProfessional: number;
  hcFunctional: number;
  hdProductivity: number;
}

export interface FueSummary {
  totalUsers: number;
  hbCount: number;
  hcCount: number;
  hdCount: number;
  calculatedFUE: number;
  formulaText: string;
}

export interface SizingSystemInfo {
  reportName: string;
  version: number | string;
  analysisDate: string;
  sid: string;
  nwRelease: string;
  kernelVersion: string;
  operatingSystem: string;
  dbType: string;
  dbVersion: string;
  isUnicode: boolean;
  diskSizeGiB: number;
  tablesAnalyzed: number;
  tablesWithError: number;
}

export interface SizingMemoryDetails {
  columnLoadable: number;
  rowStore: number;
  changesFI: number;
  changesMMSD: number;
  changesML: number;
  initialLoadable: number;
  hybridLobCache: number;
  nseCache: number;
  workSpace: number;
  fixedSize: number;
  anticipatedInitialMemoryGiB: number;
}

export interface SizingDiskDetails {
  columnLoadable: number;
  rowStore: number;
  changesFI: number;
  changesMMSD: number;
  changesML: number;
  hybridLobs: number;
  nsePageLoadable: number;
  spaceForMerges: number;
  metadataStats: number;
  initialNetDiskGiB: number;
}

export interface SourceTargetMatrixItem {
  product: string;
  current: string;
  targetDb?: string;
  target: string;
  description?: string;
  isDb: boolean;
}

export interface LargestTableRecord {
  name: string;
  sizeGiB: number;
  records: number;
  desc: string;
  module: string;
  isCustom: boolean;
  recommendation: string;
  archivingPotential: string;
}

export interface MonthlyGrowthRecord {
  year: number;
  month: number;
  memoryGB: number;
  diskDataGB: number;
  diskLogGB: number;
}

export interface YearEndProjection {
  year: number;
  requiredGB: number;
  fromExcel?: boolean;
}

// Manual entries on the Mevcut / Hedef Sistem page (per customer, stored in localStorage)
export interface SizingMatrixRowOverride {
  current?: string;
  target?: string;
  fiveYear?: string;
  description?: string;
}

export interface SizingPageOverrides {
  serverCount?: number | null;
  consolidationPill?: string;
  targetConsolidation?: string;
  operationalState?: string;
  saps?: string;
  cpuCount?: number | null;
  cpuUsagePct?: number | null;
  traceGB?: number | null;
  memOptimizationPct?: number | null;
  diskArchivingPct?: number | null;
  logCachePct?: number | null;
  matrix?: Record<string, SizingMatrixRowOverride>;
}

export interface MonthlyGrowthData {
  records: MonthlyGrowthRecord[];
  avgMonthlyGrowthGB: number;
  yearlyGrowthGB: number;
  roundedYearlyGrowthGB: number;
  yearEndProjections: YearEndProjection[];
}

export interface BasisSizingPackage {
  fileName: string;
  fileSize: string;
  uploadTimestamp: string;
  isUploaded?: boolean;
  systemInfo: SizingSystemInfo;
  memoryDetails: SizingMemoryDetails;
  diskDetails: SizingDiskDetails;
  sourceTargetMatrix: SourceTargetMatrixItem[];
  largestTables: LargestTableRecord[];
  fueSummary: FueSummary;
  fueRows: FueClassificationItem[];
  licenses: SapLicenseItem[];
  monthlyGrowth?: MonthlyGrowthData | null;
}
