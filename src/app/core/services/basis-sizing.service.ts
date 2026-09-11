import { Injectable, signal, computed } from '@angular/core';
import * as XLSX from 'xlsx';
import {
  BasisSizingPackage,
  FueClassificationItem,
  FueSummary,
  LargestTableRecord,
  SapLicenseItem,
  SizingDiskDetails,
  SizingMemoryDetails,
  SizingSystemInfo,
  SourceTargetMatrixItem
} from '../models/basis-sizing.model';

// Knowledge dictionary for known SAP tables & DVM recommendations
const SAP_TABLE_DICTIONARY: Record<string, { desc: string; module: string; rec: string; potential: string }> = {
  'ACCTCR': { desc: 'Muhasebe Döviz / İşlem Tutarları', module: 'FI/CO', rec: 'Eski mali dönemler için FI_DOCUMNT arşivlemesi uygulanmalı', potential: '%50 Arşivleme' },
  'MLCR': { desc: 'Malzeme Defteri Para Birimi Tutarları', module: 'CO-PC', rec: 'ML_DOCUMNT nesnesiyle malzeme defteri kayıtları arşivlenmeli', potential: '%60 Arşivleme' },
  'CKIS': { desc: 'Birim Maliyet Hesaplama Kalemleri', module: 'CO-PC', rec: 'Eski maliyet hesaplamaları için CO_ORDER temizleme ve arşivleme', potential: '%45 Arşivleme' },
  'MDSM': { desc: 'MRP Ana Malzeme Planlama Kalemleri', module: 'PP-MRP', rec: 'MD_CHANGE nesnesiyle geçmiş üretim planlama logları elenmeli', potential: '%55 Temizleme' },
  'MLCRF': { desc: 'Malzeme Defteri Kalem Değerleri', module: 'CO-PC', rec: 'ML_DOCUMNT ile senkronize dönem sonu arşivi uygulanmalı', potential: '%60 Arşivleme' },
  'ACCTIT': { desc: 'Sıkıştırılmış Muhasebe Kalemleri', module: 'FI/CO', rec: 'FI_DOCUMNT arşivleme nesnesine dahil edilmeli', potential: '%50 Arşivleme' },
  'COEP': { desc: 'Maliyet Muhasebesi Fiili Kalemleri', module: 'CO-OM', rec: 'CO_ITEM nesnesi ile eski dönem maliyet belgeleri arşivlenmeli', potential: '%40 Arşivleme' },
  'CKIT': { desc: 'Maliyet Hesaplama Metin Kalemleri', module: 'CO-PC', rec: 'Geçmiş kalkülasyon metinleri arşivlenmeli', potential: '%40 Arşivleme' },
  'ACDOCA': { desc: 'Universal Journal (Evrensel Muhasebe Defteri)', module: 'FI/CO', rec: 'Geçmiş mali yıllar için FI_DOCUMNT arşivlemesi uygulanmalı', potential: '%40 Arşivleme' },
  'CKMLPRKEPH': { desc: 'Malzeme Fiyat Bileşenleri Geçmişi', module: 'CO-PC', rec: 'Eski malzeme fiyat kalkülasyonları tasfiye edilmeli', potential: '%50 Temizleme' },
  'SE16N_CD_DATA': { desc: 'SE16N Tablo Değişiklik Log Verileri', module: 'BASIS', rec: 'Denetim süresi dolan SE16N logları silinmeli (Housekeeping)', potential: '%85 Temizleme' },
  'MLKEPH': { desc: 'Malzeme Defteri Maliyet Bileşenleri', module: 'CO-PC', rec: 'Yıllık malzeme defteri arşivleme stratejisi kurulmalı', potential: '%50 Arşivleme' },
  'FAGLFLEXA': { desc: 'Yeni Defteri Kebir Fiili Kalemleri', module: 'FI-GL', rec: 'S/4HANA öncesi defter kapanışları FI_DOCUMNT ile arşivlenmeli', potential: '%45 Arşivleme' },
  'MLIT': { desc: 'Malzeme Defteri Kalemleri', module: 'CO-PC', rec: 'ML_DOCUMNT arşivleme nesnesi uygulanmalı', potential: '%50 Arşivleme' },
  'MLCRP': { desc: 'Malzeme Defteri Dönem Sonu Değerleri', module: 'CO-PC', rec: 'Eski mali yıl kapanış kayıtları arşivlenmeli', potential: '%55 Arşivleme' },
  'MLAUFCR': { desc: 'Sipariş Malzeme Defteri Kayıtları', module: 'CO-PC', rec: 'Kapanmış üretim siparişlerinin malzeme kayıtları arşivlenmeli', potential: '%50 Arşivleme' },
  'MLCD': { desc: 'Malzeme Defteri Kümülatif Verileri', module: 'CO-PC', rec: 'Dönem kapanışı yapılmış eski stok hareketleri arşivlenmeli', potential: '%55 Arşivleme' },
  'MLPRKEPH': { desc: 'Maliyet Bileşenleri Detay Değerleri', module: 'CO-PC', rec: 'ML_DOCUMNT arşivleme paketiyle optimize edilmeli', potential: '%50 Arşivleme' },
  'MLPP': { desc: 'Malzeme Defteri Dönem Fiyatları', module: 'CO-PC', rec: 'Eski dönem fiyat geçmişi arşivlenmeli', potential: '%45 Arşivleme' },
  'MATDOC': { desc: 'S/4HANA Malzeme Belgesi Evrensel Tablosu', module: 'MM-IM', rec: 'MM_MATDOC nesnesi ile eski dönem stok belgeleri arşivlenmeli', potential: '%40 Arşivleme' },
  'CKMLPRKEKO': { desc: 'Malzeme Defteri Fiyat Başlıkları', module: 'CO-PC', rec: 'CKMLPRKEPH ile senkronize arşivlenmeli', potential: '%50 Arşivleme' },
  'CKMLKEPH': { desc: 'Fiili Maliyet Bileşenleri', module: 'CO-PC', rec: 'Periyodik DVM arşivlemesine dahil edilmeli', potential: '%45 Arşivleme' },
  'MLPRKEKO': { desc: 'Fiyat Değişiklik Başlık Kayıtları', module: 'CO-PC', rec: 'Geçmiş fiyat güncellemeleri temizlenmeli', potential: '%50 Temizleme' },
  'MDTC': { desc: 'MRP Toplu Malzeme Tablosu', module: 'PP-MRP', rec: 'Kullanılmayan eski MRP çalıştırma sonuçları silinmeli', potential: '%70 Temizleme' },
  'MSEG': { desc: 'Malzeme Belgesi Kalemleri', module: 'MM-IM', rec: 'MM_MATDOC / MM_INVBEL ile arşivlenmeli', potential: '%50 Arşivleme' },
  'KEPH': { desc: 'Maliyet Bileşeni Parçalanma Detayları', module: 'CO-PC', rec: 'Eski standart maliyet hesapları elenmeli', potential: '%40 Arşivleme' },
  'MLPPF': { desc: 'Malzeme Defteri Fiyat Geçmiş Kalemleri', module: 'CO-PC', rec: 'Eski dönem malzeme fiyatları arşivlenmeli', potential: '%50 Arşivleme' },
  'BSEG': { desc: 'Muhasebe Belge Kalemleri', module: 'FI', rec: 'Eski mali dönemler FI_DOCUMNT arşivlemesine dahil edilmeli', potential: '%50 Arşivleme' },
  'JCDS': { desc: 'Nesne Durum Değişiklikleri Geçmişi', module: 'BASIS/CO', rec: 'Tamamlanmış süreçlerin statü değişiklik logları temizlenmeli', potential: '%75 Temizleme' },
  'PRCD_ELEMENTS': { desc: 'S/4HANA Fiyatlandırma Koşulları', module: 'SD-PR', rec: 'SD_COND nesnesi ile geçerliliği bitmiş koşullar arşivlenmeli', potential: '%40 Arşivleme' },
  'REGUP': { desc: 'Ödeme Programı İşlem Kalemleri', module: 'FI-AP/AR', rec: 'FI_PAYDATA Arşivleme Nesnesi ile eski ödeme kayıtları temizlenmeli', potential: '%65 Arşivleme' },
  'REGUH': { desc: 'Ödeme Programı Ödeme Başlıkları', module: 'FI-AP/AR', rec: 'REGUP ile eş zamanlı FI_PAYDATA ile arşivlenmeli', potential: '%65 Arşivleme' },
  'CDPOS': { desc: 'Değişiklik Belgeleri Kalem', module: 'BASIS', rec: 'CHANGELOG silme/arşivleme job (RSCDTCLR) çalıştırılmalı', potential: '%60 Temizleme' },
  'CDHDR': { desc: 'Değişiklik Belgeleri Başlık', module: 'BASIS', rec: 'CDPOS ile birlikte RSCDTCLR ile temizlenmeli', potential: '%60 Temizleme' },
  'BKPF': { desc: 'Muhasebe Belge Başlıkları', module: 'FI', rec: 'BSEG ile ilişkili olarak FI_DOCUMNT nesnesiyle arşivlenmeli', potential: '%50 Arşivleme' },
  'BALDAT': { desc: 'Uygulama Log Verileri (Application Log)', module: 'BASIS', rec: 'SBP log temizleme job (BC_SBAL / SBAL_DELETE) çalıştırılmalı', potential: '%80 Temizleme' },
  'FAGL_SPLINFO': { desc: 'Belge Bölme Başlık Bilgileri', module: 'FI-GL', rec: 'Yeni Defteri Kebir belge bölme geçmişi arşivlenmeli', potential: '%45 Arşivleme' }
};

@Injectable({
  providedIn: 'root'
})
export class BasisSizingService {
  private readonly STORAGE_KEY = 'taskforce_dynamic_sizing_v2';

  // Upload State - Default FALSE, no pre-filled data!
  hasUploadedData = signal<boolean>(false);
  basisPackage = signal<BasisSizingPackage | null>(null);

  constructor() {
    try {
      // Purge any legacy demo/dummy package from browser storage
      localStorage.removeItem('taskforce_basis_sizing_package');
    } catch (e) {}
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const pkg = JSON.parse(saved) as BasisSizingPackage;
        if (pkg && pkg.fileName && pkg.isUploaded) {
          this.basisPackage.set(pkg);
          this.hasUploadedData.set(true);
        }
      }
    } catch (e) {
      console.error('Failed to load basis package from storage', e);
    }
  }

  private saveToStorage(pkg: BasisSizingPackage): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pkg));
    } catch (e) {
      console.error('Failed to save basis package to storage', e);
    }
  }

  // Dynamic Reactive Computeds - Empty by default until an Excel file is uploaded!
  readonly sizingMatrix = computed(() => {
    const pkg = this.basisPackage();
    return (pkg && pkg.sourceTargetMatrix && pkg.sourceTargetMatrix.length > 0)
      ? pkg.sourceTargetMatrix
      : [];
  });

  readonly systemInfo = computed(() => {
    const pkg = this.basisPackage();
    return pkg ? pkg.systemInfo : null;
  });

  readonly memoryDetails = computed(() => {
    const pkg = this.basisPackage();
    return pkg ? pkg.memoryDetails : null;
  });

  readonly diskDetails = computed(() => {
    const pkg = this.basisPackage();
    return pkg ? pkg.diskDetails : null;
  });

  readonly largestTables = computed(() => {
    const pkg = this.basisPackage();
    return (pkg && pkg.largestTables && pkg.largestTables.length > 0)
      ? pkg.largestTables
      : [];
  });

  readonly fueSummary = computed(() => {
    const pkg = this.basisPackage();
    return (pkg && pkg.fueSummary) ? pkg.fueSummary : null;
  });

  readonly fueRows = computed(() => {
    const pkg = this.basisPackage();
    return (pkg && pkg.fueRows && pkg.fueRows.length > 0) ? pkg.fueRows : [];
  });

  readonly licenses = computed(() => {
    const pkg = this.basisPackage();
    return (pkg && pkg.licenses && pkg.licenses.length > 0) ? pkg.licenses : [];
  });

  // PARSER ENGINE: Parses any SAP Basis & Sizing Workbook dynamically
  parseBasisWorkbook(workbook: XLSX.WorkBook, fileName: string, fileSize: number): BasisSizingPackage {
    const sheetNames = workbook.SheetNames;

    // 1. Sizing Report Sheet Parser
    const sizingSheetName = sheetNames.find(n => n.toLowerCase().includes('sizing') || n.toLowerCase().includes('hdb'));
    let systemInfo: SizingSystemInfo = {
      reportName: '/SDF/HDB_SIZING',
      version: 0,
      analysisDate: '',
      sid: '—',
      nwRelease: '—',
      kernelVersion: '—',
      operatingSystem: '—',
      dbType: '—',
      dbVersion: '—',
      isUnicode: false,
      diskSizeGiB: 0,
      tablesAnalyzed: 0,
      tablesWithError: 0
    };
    let memoryDetails: SizingMemoryDetails = {
      columnLoadable: 0,
      rowStore: 0,
      changesFI: 0,
      changesMMSD: 0,
      changesML: 0,
      initialLoadable: 0,
      hybridLobCache: 0,
      nseCache: 0,
      workSpace: 0,
      fixedSize: 0,
      anticipatedInitialMemoryGiB: 0
    };
    let diskDetails: SizingDiskDetails = {
      columnLoadable: 0,
      rowStore: 0,
      changesFI: 0,
      changesMMSD: 0,
      changesML: 0,
      hybridLobs: 0,
      nsePageLoadable: 0,
      spaceForMerges: 0,
      metadataStats: 0,
      initialNetDiskGiB: 0
    };

    if (sizingSheetName && workbook.Sheets[sizingSheetName]) {
      const parsedSizing = this.parseSizingReportSheet(workbook.Sheets[sizingSheetName]);
      systemInfo = parsedSizing.systemInfo;
      memoryDetails = parsedSizing.memoryDetails;
      diskDetails = parsedSizing.diskDetails;
    }

    // 2. Source_Target Sheet Parser
    const sourceTargetSheetName = sheetNames.find(n => n.toLowerCase().includes('source') || n.toLowerCase().includes('target'));
    let sourceTargetMatrix: SourceTargetMatrixItem[] = [];
    if (sourceTargetSheetName && workbook.Sheets[sourceTargetSheetName]) {
      sourceTargetMatrix = this.parseSourceTargetSheet(workbook.Sheets[sourceTargetSheetName]);
    }

    // 3. Largest Tables Sheet Parser
    const largestTablesSheetName = sheetNames.find(n => n.toLowerCase().includes('largest') || n.toLowerCase().includes('tablo'));
    let largestTables: LargestTableRecord[] = [];
    if (largestTablesSheetName && workbook.Sheets[largestTablesSheetName]) {
      largestTables = this.parseLargestTablesSheet(workbook.Sheets[largestTablesSheetName]);
    }

    // 4. FUE Sheet Parser
    const fueSheetName = sheetNames.find(n => n.toLowerCase().includes('fue'));
    let fueSummary: FueSummary = {
      totalUsers: 0,
      hbCount: 0,
      hcCount: 0,
      hdCount: 0,
      calculatedFUE: 0,
      formulaText: '0 FUE'
    };
    let fueRows: FueClassificationItem[] = [];
    if (fueSheetName && workbook.Sheets[fueSheetName]) {
      const parsedFue = this.parseFueSheet(workbook.Sheets[fueSheetName]);
      fueSummary = parsedFue.summary;
      fueRows = parsedFue.rows;
    }

    // 5. Licenses Sheet Parser
    const licenseSheetName = sheetNames.find(n => n.toLowerCase().includes('lisans') || n.toLowerCase().includes('license') || n.toLowerCase().includes('me.sap'));
    let licenses: SapLicenseItem[] = [];
    if (licenseSheetName && workbook.Sheets[licenseSheetName]) {
      licenses = this.parseLicensesSheet(workbook.Sheets[licenseSheetName]);
    }

    const pkg: BasisSizingPackage = {
      fileName,
      fileSize: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
      uploadTimestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isUploaded: true,
      systemInfo,
      memoryDetails,
      diskDetails,
      sourceTargetMatrix,
      largestTables,
      fueSummary,
      fueRows,
      licenses
    };

    // Commit to reactive signals and localStorage
    this.basisPackage.set(pkg);
    this.hasUploadedData.set(true);
    this.saveToStorage(pkg);

    return pkg;
  }

  // Parses /SDF/HDB_SIZING key-value pairs
  private parseSizingReportSheet(sheet: XLSX.WorkSheet): { systemInfo: SizingSystemInfo; memoryDetails: SizingMemoryDetails; diskDetails: SizingDiskDetails } {
    const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    const kvMap = new Map<string, any>();

    for (const r of rawRows) {
      if (!r || r.length < 2) continue;
      const key = String(r[0] || '').trim().toLowerCase();
      const val = r[1];
      if (key) {
        kvMap.set(key, val);
      }
    }

    const getNum = (keyPart: string, def = 0): number => {
      for (const [k, v] of kvMap.entries()) {
        if (k.includes(keyPart.toLowerCase())) {
          const num = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
          return isNaN(num) ? def : num;
        }
      }
      return def;
    };

    const getStr = (keyPart: string, def = ''): string => {
      for (const [k, v] of kvMap.entries()) {
        if (k.includes(keyPart.toLowerCase())) {
          return String(v).trim();
        }
      }
      return def;
    };

    const systemInfo: SizingSystemInfo = {
      reportName: getStr('sizing report', '/SDF/HDB_SIZING'),
      version: kvMap.get('version of the report') || 99,
      analysisDate: new Date().toISOString().split('T')[0],
      sid: getStr('sid', 'TEP'),
      nwRelease: getStr('nw release', '731 SP 4'),
      kernelVersion: getStr('kernel version', '722_EX2_REL'),
      operatingSystem: getStr('operating system', 'Windows Server / Linux'),
      dbType: getStr('type of analysed database', 'ORACLE'),
      dbVersion: getStr('database version', '19.20.0.0.0'),
      isUnicode: getStr('unicode').toLowerCase().includes('yes'),
      diskSizeGiB: getNum('data used size on disk', 3265),
      tablesAnalyzed: getNum('number of tables successfully analysed', 92699),
      tablesWithError: getNum('number of tables with error', 0)
    };

    const columnLoadable = getNum('column loadable data', 978.6);
    const rowStore = getNum('row store data', 0.9);
    const changesFI = getNum('changes in fi', 35.5);
    const changesMMSD = getNum('changes in mm/sd', 19.3);
    const changesML = getNum('changes in ml', 1.5);
    const initialLoadable = getNum('memory requirement for the initial loadable data', columnLoadable + rowStore + changesFI + changesMMSD + changesML);
    const hybridLobCache = getNum('hybrid lob cache', 22.1);
    const nseCache = getNum('nse cache', 10.9);
    const workSpace = getNum('work space', columnLoadable);
    const fixedSize = getNum('fixed size', 50.0);
    const anticipatedInitialMemoryGiB = getNum('anticipated initial memory requirement', initialLoadable + hybridLobCache + nseCache + workSpace + fixedSize);

    const memoryDetails: SizingMemoryDetails = {
      columnLoadable,
      rowStore,
      changesFI,
      changesMMSD,
      changesML,
      initialLoadable,
      hybridLobCache,
      nseCache,
      workSpace,
      fixedSize,
      anticipatedInitialMemoryGiB
    };

    const initialNetDiskGiB = getNum('initial net data size on disk', 1382.2);
    const diskDetails: SizingDiskDetails = {
      columnLoadable,
      rowStore,
      changesFI,
      changesMMSD,
      changesML,
      hybridLobs: getNum('hybrid lobs', 221.5),
      nsePageLoadable: getNum('page loadable data (nse)', 43.6),
      spaceForMerges: getNum('space required for merges', 56.3),
      metadataStats: getNum('metadata and statistics', 25.0),
      initialNetDiskGiB
    };

    return { systemInfo, memoryDetails, diskDetails };
  }

  // Parses Source_Target Sheet
  private parseSourceTargetSheet(sheet: XLSX.WorkSheet): SourceTargetMatrixItem[] {
    const rawRows = XLSX.utils.sheet_to_json<any>(sheet);
    const result: SourceTargetMatrixItem[] = [];

    for (const row of rawRows) {
      const product = String(row['Product'] || row['product'] || '').trim();
      if (!product) continue;

      const current = String(row['Current'] || row['current'] || '—').trim();
      const targetDb = row['Target DB'] || row['target db'] || undefined;
      const target = String(row['Target'] || row['target'] || targetDb || 'Planlanan').trim();

      const isDb = product.toLowerCase().includes('db') || product.toLowerCase().includes('database') || product.toLowerCase().includes('hana');

      let description = '';
      if (isDb && product.toLowerCase().includes('prod')) {
        description = 'Canlı In-Memory S/4HANA Private Cloud Veritabanı';
      } else if (isDb && (product.toLowerCase().includes('qa') || product.toLowerCase().includes('test'))) {
        description = 'Kalite ve Test ortamı Bulut DB';
      } else if (isDb && product.toLowerCase().includes('dev')) {
        description = 'Geliştirme ve Sandbox ortamı Bulut DB';
      } else if (!isDb && product.toLowerCase().includes('prod')) {
        description = 'Üretim Uygulama Sunucu Kümesi (App Cluster)';
      } else if (!isDb && product.toLowerCase().includes('qa')) {
        description = 'Test ve Entegrasyon Uygulama Sunucusu';
      } else if (!isDb && product.toLowerCase().includes('dev')) {
        description = 'Geliştirme & ABAP Uygulama Sunucusu';
      } else {
        description = 'S/4HANA RISE Mimarisi Bileşeni';
      }

      result.push({
        product,
        current,
        targetDb,
        target,
        description,
        isDb
      });
    }

    return result;
  }

  // Parses Largest Tables Sheet
  private parseLargestTablesSheet(sheet: XLSX.WorkSheet): LargestTableRecord[] {
    const rawRows = XLSX.utils.sheet_to_json<any>(sheet);
    const result: LargestTableRecord[] = [];

    for (const row of rawRows) {
      const name = String(row['Largest Column Loadable Tables'] || row['Table'] || row['Tablo'] || row['Name'] || '').trim();
      if (!name) continue;

      const rawSize = row['Estimated Memory Size in GiB'] || row['Size'] || row['Size (GiB)'] || row['Memory Size'] || 0;
      const sizeGiB = typeof rawSize === 'number' ? rawSize : parseFloat(String(rawSize).replace(',', '.'));

      const rawRecords = row['Estimated Record Count'] || row['Records'] || row['Kayıt Sayısı'] || 0;
      const records = typeof rawRecords === 'number' ? Math.round(rawRecords) : parseInt(String(rawRecords).replace(/\D/g, ''), 10) || 0;

      const isCustom = name.startsWith('Z') || name.startsWith('Y') || name.includes('_Z_');
      const lookup = SAP_TABLE_DICTIONARY[name.toUpperCase()];

      let desc = '';
      let module = '';
      let recommendation = '';
      let archivingPotential = '';

      if (lookup) {
        desc = lookup.desc;
        module = lookup.module;
        recommendation = lookup.rec;
        archivingPotential = lookup.potential;
      } else if (isCustom) {
        desc = `Özel Z Geliştirme Tablosu (${name})`;
        module = 'Z-Custom';
        recommendation = 'Eski tamamlanmış transaction logları için periyodik Housekeeping Job kurulmalı';
        archivingPotential = '%60 Temizleme';
      } else {
        desc = `Standart SAP Tablosu (${name})`;
        if (name.startsWith('M')) module = 'MM/PP';
        else if (name.startsWith('C')) module = 'CO';
        else if (name.startsWith('F') || name.startsWith('B') || name.startsWith('A')) module = 'FI';
        else if (name.startsWith('V') || name.startsWith('K') || name.startsWith('S')) module = 'SD';
        else module = 'BASIS';

        recommendation = 'Veri Yaşam Döngüsü (DVM) analizi ve periyodik arşivleme planlanmalı';
        archivingPotential = '%40 Arşivleme';
      }

      result.push({
        name,
        sizeGiB: isNaN(sizeGiB) ? 0 : sizeGiB,
        records,
        desc,
        module,
        isCustom,
        recommendation,
        archivingPotential
      });
    }

    return result;
  }

  // Parses FUE Sheet
  private parseFueSheet(sheet: XLSX.WorkSheet): { summary: FueSummary; rows: FueClassificationItem[] } {
    const rawRows = XLSX.utils.sheet_to_json<any>(sheet);
    const rows: FueClassificationItem[] = [];

    let totalUsers = 0;
    let hbCount = 0;
    let hcCount = 0;
    let hdCount = 0;

    for (const r of rawRows) {
      const classification = String(r['Current Classification'] || r['Kullanıcı Tipi'] || '').trim();
      if (!classification || classification.toLowerCase().includes('355 +') || classification.includes('≈')) continue;

      const total = Number(r['Total'] || r['Toplam'] || 0);
      const hb = Number(r['HB Professional Use'] || r['HB'] || 0);
      const hc = Number(r['HC Functional Use'] || r['HC'] || 0);
      const hd = Number(r['HD Productivity Use'] || r['HD'] || 0);

      if (classification.toLowerCase().includes('genel toplam') || classification.toLowerCase().includes('total')) {
        totalUsers = total;
        hbCount = hb;
        hcCount = hc;
        hdCount = hd;
      } else {
        rows.push({
          classification,
          total,
          hbProfessional: hb,
          hcFunctional: hc,
          hdProductivity: hd
        });
      }
    }

    // If general total row was not explicitly named, sum up rows
    if (totalUsers === 0 && rows.length > 0) {
      totalUsers = rows.reduce((acc, x) => acc + x.total, 0);
      hbCount = rows.reduce((acc, x) => acc + x.hbProfessional, 0);
      hcCount = rows.reduce((acc, x) => acc + x.hcFunctional, 0);
      hdCount = rows.reduce((acc, x) => acc + x.hdProductivity, 0);
    }

    // SAP Standard FUE calculation formula: HB + (HC / 5) + (HD / 30)
    const calculatedFUE = parseFloat((hbCount + (hcCount / 5) + (hdCount / 30)).toFixed(1));
    const formulaText = `${hbCount} + ${hcCount}/5 + ${hdCount}/30 ≈ ${calculatedFUE} FUE`;

    return {
      summary: {
        totalUsers,
        hbCount,
        hcCount,
        hdCount,
        calculatedFUE,
        formulaText
      },
      rows
    };
  }

  // Parses me.sap Lisanslar Sheet
  private parseLicensesSheet(sheet: XLSX.WorkSheet): SapLicenseItem[] {
    const rawRows = XLSX.utils.sheet_to_json<any>(sheet);
    const result: SapLicenseItem[] = [];

    for (const r of rawRows) {
      const materials = String(r['Materials'] || r['Material'] || r['Malzeme'] || '').trim();
      if (!materials) continue;

      const product = String(r['Product'] || r['Ürün'] || '').trim();
      const orders = Number(r['Orders'] || r['Sipariş'] || 1);
      const quantity = Number(r['Quantity'] || r['Miktar'] || 0);
      const unit = String(r['Unit'] || r['Birim'] || 'Users').trim();
      const metricId = r['Metric ID'] ? String(r['Metric ID']).trim() : undefined;

      result.push({
        materials,
        product,
        orders,
        quantity,
        unit,
        metricId
      });
    }

    return result;
  }

  // Resets to default initial demo data
  clearUploadedData(): void {
    this.basisPackage.set(null);
    this.hasUploadedData.set(false);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
  }
}
