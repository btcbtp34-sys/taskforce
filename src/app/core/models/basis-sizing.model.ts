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

export interface BasisSizingPackage {
  fileName: string;
  fileSize: string;
  uploadTimestamp: string;
  systemInfo: SizingSystemInfo;
  memoryDetails: SizingMemoryDetails;
  diskDetails: SizingDiskDetails;
  sourceTargetMatrix: SourceTargetMatrixItem[];
  largestTables: LargestTableRecord[];
  fueSummary: FueSummary;
  fueRows: FueClassificationItem[];
  licenses: SapLicenseItem[];
}
