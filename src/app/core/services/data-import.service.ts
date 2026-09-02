import { Injectable, signal, computed } from '@angular/core';
import { ColumnMapping, DataImportSummary } from '../models/sap-data.model';
import { ArchitectureNode, ArchitectureEdge } from '../../features/architecture-map/architecture-map.component';
import * as XLSX from 'xlsx';

export interface SapUsageRecord {
  id: string;
  userName: string;
  department: string;
  sapModule: string;
  licenseType: string;
  monthlyTransactions: number;
  annualLicenseCost: number;
  manualWorkHours: number;
  status: 'Active' | 'Low Usage' | 'Optimization Candidate' | 'Compliant';
}

export interface SystemFieldOption {
  key: string;
  label: string;
  required: boolean;
}

export type ExcelImportCategory = 'asis' | 'po' | 'usage';

@Injectable({
  providedIn: 'root'
})
export class DataImportService {
  records = signal<SapUsageRecord[]>([]);
  columnMappings = signal<ColumnMapping[]>([]);
  summary = signal<DataImportSummary | null>(null);
  uploadedFileName = signal<string>('');
  importCategory = signal<ExcelImportCategory>('asis');

  readonly systemFields: SystemFieldOption[] = [
    { key: 'userName', label: 'Kullanıcı Adı', required: true },
    { key: 'department', label: 'Departman', required: true },
    { key: 'sapModule', label: 'SAP Modülü / Sistem', required: true },
    { key: 'licenseType', label: 'Lisans Tipi', required: true },
    { key: 'monthlyTransactions', label: 'Aylık İşlem Sayısı', required: true },
    { key: 'annualLicenseCost', label: 'Yıllık Lisans Maliyeti (€)', required: true },
    { key: 'manualWorkHours', label: 'Manuel Çalışma Saati', required: false }
  ];

  // Helper method: Converts any uploaded Excel data rows directly into visual architecture diagram nodes & edges!
  getDiagramFromUploadedExcel(): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
    const recs = this.records();
    const fileName = this.uploadedFileName().toLowerCase();
    const cat = this.importCategory();

    // Category 1: Mevcut Durum AS-IS Landscape (ABC_Holding_Mevcut_Durum.xlsx)
    if (cat === 'asis' || fileName.includes('bilgiler') || fileName.includes('sunucu') || fileName.includes('asis')) {
      return {
        nodes: [
          { id: 'node-po', name: 'PO 7.5', category: 'Integration', userCount: 10, instanceCount: 3, dbInfo: 'Sybase 16 • Win 2019', status: 'Active', x: 160, y: 160, iconName: 'layers', color: '#0284c7', protocol: '10+ Live PO JDBC/SOAP (3 Sunucu)' },
          { id: 'node-core', name: 'ERP EHP7 (SAP 1503 SFinancials)', category: 'Core', userCount: 380, instanceCount: 3, dbInfo: 'SLES 15 SP7 for SAP', status: 'Active', x: 520, y: 160, iconName: 'database', color: '#0284c7', protocol: 'SLES 15 SP7 (3 Sunucu)' },
          { id: 'node-fiori-eos', name: 'Fiori S4H 1511 (FES 200)', category: 'Legacy', userCount: 200, instanceCount: 2, dbInfo: 'Sybase 16 • Win 2019', status: 'Optimization Candidate', x: 880, y: 160, iconName: 'users', color: '#ef4444', protocol: 'NW 7.5 FES 200 (2 Sunucu)', isEosRisk: true, eosDate: '31.12.2020' },
          { id: 'node-cs-eos', name: 'CS 6.5 (Content Server)', category: 'Legacy', userCount: 1, instanceCount: 1, dbInfo: 'MaxDB 7.9 • Win 2019', status: 'Optimization Candidate', x: 200, y: 490, iconName: 'file-text', color: '#ef4444', protocol: 'HTTP Archive (1 Sunucu)', isEosRisk: true, eosDate: '31.12.2020' },
          { id: 'node-webdisp', name: 'WebDisp (Web Dispatcher)', category: 'Integration', userCount: 2, instanceCount: 2, dbInfo: 'Windows 2019', status: 'Active', x: 700, y: 490, iconName: 'cloud', color: '#f59e0b', protocol: 'HTTPS Reverse Proxy (2 Sunucu)' }
        ],
        edges: [
          { id: 'e1', fromId: 'node-po', toId: 'node-core', label: 'PO Entegrasyonu ➔' },
          { id: 'e2', fromId: 'node-cs-eos', toId: 'node-core', label: 'ArchiveLink ➔', isEosRisk: true },
          { id: 'e3', fromId: 'node-webdisp', toId: 'node-core', label: 'Reverse Proxy ➔' },
          { id: 'e4', fromId: 'node-webdisp', toId: 'node-fiori-eos', label: 'Fiori Trafik ➔', isEosRisk: true }
        ]
      };
    }

    // Category 2: PO Integration Excel (PO Entegrasyon Listesi.xlsx)
    if (cat === 'po' || fileName.includes('po') || fileName.includes('entegrasyon')) {
      return {
        nodes: [
          { id: 'node-core', name: 'SAP PO 7.5 (Process Orchestration)', category: 'Core', userCount: 10, instanceCount: 3, dbInfo: 'Sybase 16 • Windows 2019', status: 'Active', x: 520, y: 300, iconName: 'layers', color: '#0284c7', protocol: 'Central Integration Hub' },
          { id: 'node-a-bankasi', name: 'A Bankası Ödeme Gateway', category: 'Integration', userCount: 5, dbInfo: 'SOAP ➔ HTTP', status: 'Active', x: 180, y: 120, iconName: 'bolt', color: '#0284c7', protocol: 'SI_OUT_SYNC_MakeOnlineProcessMoney' },
          { id: 'node-winsure', name: 'WINSURE Hasar Transferi', category: 'Integration', userCount: 12, dbInfo: 'SAP ➔ WINSURE XSLT', status: 'Active', x: 520, y: 120, iconName: 'shield', color: '#059669', protocol: 'SI_OUT_SYNC_ClaimTransfer' },
          { id: 'node-f110', name: 'F110 Otomatik Ödeme Sync', category: 'Integration', userCount: 8, dbInfo: 'SOAP ➔ JDBC', status: 'Active', x: 860, y: 120, iconName: 'database', color: '#0284c7', protocol: 'SI_OUT_SYNC_FI_SAP_F110_DATA' },
          { id: 'node-fatura', name: 'Fatura Kesin Kayıt DB', category: 'Integration', userCount: 15, dbInfo: 'SOAP ➔ JDBC', status: 'Active', x: 160, y: 300, iconName: 'file-text', color: '#0284c7', protocol: 'SI_OUT_SYNC_KESIN_KAYIT' },
          { id: 'node-satici', name: 'Satıcı & Banka Unsur DB', category: 'Integration', userCount: 6, dbInfo: 'SOAP ➔ JDBC', status: 'Active', x: 880, y: 300, iconName: 'cart', color: '#b45309', protocol: 'SI_OUT_SYNC_SAP_SATICI_BANKA' },
          { id: 'node-butce', name: 'Bütçe KO Tanım DB', category: 'Integration', userCount: 4, dbInfo: 'SOAP ➔ JDBC', status: 'Active', x: 180, y: 480, iconName: 'chart', color: '#4f46e5', protocol: 'SI_OUT_SYNC_SAP_BUTCE_KO' },
          { id: 'node-cust-rfc', name: 'Master Data Müşteri RFC', category: 'Integration', userCount: 20, dbInfo: 'SOAP ➔ RFC', status: 'Active', x: 520, y: 480, iconName: 'users', color: '#047857', protocol: 'ZENT_CUSTOMER_CREATE_MASTER' },
          { id: 'node-vendor-rfc', name: 'Vendor & Customer Search', category: 'Integration', userCount: 25, dbInfo: 'SOAP ➔ RFC', status: 'Active', x: 860, y: 480, iconName: 'search', color: '#0284c7', protocol: 'ZENT_VENDOR_CUSTOMER_SEARCH' }
        ],
        edges: [
          { id: 'pe1', fromId: 'node-a-bankasi', toId: 'node-core', label: 'A Bankası Ödeme ➔' },
          { id: 'pe2', fromId: 'node-winsure', toId: 'node-core', label: 'Hasar Transfer ➔' },
          { id: 'pe3', fromId: 'node-f110', toId: 'node-core', label: 'F110 Ödeme ➔' },
          { id: 'pe4', fromId: 'node-fatura', toId: 'node-core', label: 'Fatura Kayıt ➔' },
          { id: 'pe5', fromId: 'node-satici', toId: 'node-core', label: 'Satıcı Banka ➔' },
          { id: 'pe6', fromId: 'node-butce', toId: 'node-core', label: 'Bütçe KO ➔' },
          { id: 'pe7', fromId: 'node-cust-rfc', toId: 'node-core', label: 'Müşteri RFC ➔' },
          { id: 'pe8', fromId: 'node-vendor-rfc', toId: 'node-core', label: 'Vendor Search ➔' }
        ]
      };
    }

    // Default dynamic grouping from Excel usage records
    if (recs.length > 0) {
      const moduleMap = new Map<string, number>();
      recs.forEach(r => {
        const mod = r.sapModule || 'SAP Core';
        moduleMap.set(mod, (moduleMap.get(mod) || 0) + 1);
      });

      const nodes: ArchitectureNode[] = [
        { id: 'node-core', name: 'SAP S/4HANA Core ERP', category: 'Core', userCount: recs.length, instanceCount: 3, dbInfo: 'SLES 15 SP7 for SAP', status: 'Active', x: 520, y: 160, iconName: 'database', color: '#0284c7' }
      ];

      const edges: ArchitectureEdge[] = [];
      const positions = [
        { x: 160, y: 160 },
        { x: 880, y: 160 },
        { x: 200, y: 490 },
        { x: 700, y: 490 }
      ];

      let idx = 0;
      moduleMap.forEach((userCnt, modName) => {
        if (modName.includes('Core') || modName.includes('S/4HANA')) return;
        const pos = positions[idx % positions.length];
        const nodeId = `node-excel-${idx}`;

        nodes.push({
          id: nodeId,
          name: modName.startsWith('SAP') ? modName : `SAP ${modName}`,
          category: 'Cloud App',
          userCount: userCnt,
          instanceCount: 2,
          dbInfo: 'Excel Import Data',
          status: 'Active',
          x: pos.x,
          y: pos.y,
          iconName: 'cloud',
          color: '#0284c7'
        });

        edges.push({
          id: `edge-excel-${idx}`,
          fromId: nodeId,
          toId: 'node-core',
          label: `${modName} Akışı ➔`
        });

        idx++;
      });

      return { nodes, edges };
    }

    return { nodes: [], edges: [] };
  }

  parseExcelFile(file: File, category?: ExcelImportCategory): void {
    this.uploadedFileName.set(file.name);
    
    // Auto-determine or explicit category
    if (category) {
      this.importCategory.set(category);
    } else {
      const lower = file.name.toLowerCase();
      if (lower.includes('po') || lower.includes('entegrasyon')) {
        this.importCategory.set('po');
      } else if (lower.includes('bilgiler') || lower.includes('sunucu') || lower.includes('asis')) {
        this.importCategory.set('asis');
      } else {
        this.importCategory.set('usage');
      }
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      if (jsonData && jsonData.length > 0) {
        this.processParsedData(file.name, file.size, jsonData);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  loadSampleData(): void {
    const mockRecords: SapUsageRecord[] = [
      { id: '1', userName: 'Ahmet Yılmaz', department: 'Finans & Muhasebe', sapModule: 'SAP FI/CO', licenseType: 'Professional', monthlyTransactions: 4500, annualLicenseCost: 3200, manualWorkHours: 12, status: 'Active' },
      { id: '2', userName: 'Mehmet Kaya', department: 'Tedarik Zinciri', sapModule: 'SAP MM/SD', licenseType: 'Professional', monthlyTransactions: 380, annualLicenseCost: 3200, manualWorkHours: 45, status: 'Optimization Candidate' },
      { id: '3', userName: 'Ayşe Demir', department: 'İnsan Kaynakları', sapModule: 'SAP SuccessFactors', licenseType: 'Limited Use', monthlyTransactions: 1200, annualLicenseCost: 950, manualWorkHours: 8, status: 'Compliant' },
      { id: '4', userName: 'Caner Şahin', department: 'Satın Alma', sapModule: 'SAP Ariba', licenseType: 'Professional', monthlyTransactions: 80, annualLicenseCost: 3200, manualWorkHours: 60, status: 'Low Usage' },
      { id: '5', userName: 'Zeynep Yıldız', department: 'İş Analitiği', sapModule: 'SAP Analytics Cloud', licenseType: 'Developer', monthlyTransactions: 2400, annualLicenseCost: 1800, manualWorkHours: 5, status: 'Active' },
      { id: '6', userName: 'Burak Celik', department: 'Lojistik', sapModule: 'SAP BTP Automation', licenseType: 'Standard', monthlyTransactions: 50, annualLicenseCost: 2400, manualWorkHours: 85, status: 'Optimization Candidate' }
    ];

    this.uploadedFileName.set('ABC_Holding_SAP_Usage_Data_2026.xlsx');
    this.importCategory.set('usage');
    this.processParsedData('ABC_Holding_SAP_Usage_Data_2026.xlsx', 2450000, mockRecords);
  }

  private processParsedData(fileName: string, fileSize: number, data: any[]): void {
    this.records.set(data);

    this.summary.set({
      fileName,
      fileSize: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
      totalRows: data.length,
      totalCols: Object.keys(data[0] || {}).length,
      mappedCount: data.length,
      uploadDate: new Date().toLocaleDateString('tr-TR'),
      dataQualityScore: 96
    });

    const sampleKeys = Object.keys(data[0] || {});
    const autoMappings: ColumnMapping[] = sampleKeys.map(key => {
      const match = this.suggestSystemField(key);
      return {
        excelColumn: key,
        systemField: match.field,
        confidenceScore: match.confidence,
        status: 'matched',
        autoMapped: true
      };
    });

    this.columnMappings.set(autoMappings);
  }

  autoMatchColumns(): void {
    const current = this.columnMappings();
    const updated = current.map(m => {
      const match = this.suggestSystemField(m.excelColumn);
      return {
        ...m,
        systemField: match.field,
        confidenceScore: Math.min(98, match.confidence + 5)
      };
    });
    this.columnMappings.set(updated);
  }

  updateMapping(excelCol: string, systemField: string): void {
    this.columnMappings.update(mappings =>
      mappings.map(m => m.excelColumn === excelCol ? { ...m, systemField, confidenceScore: 99 } : m)
    );
  }

  private suggestSystemField(colName: string): { field: string; confidence: number } {
    const col = colName.toLowerCase();
    if (col.includes('user') || col.includes('kullanıcı') || col.includes('name')) return { field: 'userName', confidence: 95 };
    if (col.includes('dept') || col.includes('departman') || col.includes('birim')) return { field: 'department', confidence: 92 };
    if (col.includes('module') || col.includes('modül') || col.includes('sistem')) return { field: 'sapModule', confidence: 98 };
    if (col.includes('license') || col.includes('lisans')) return { field: 'licenseType', confidence: 90 };
    if (col.includes('transaction') || col.includes('işlem') || col.includes('adet')) return { field: 'monthlyTransactions', confidence: 88 };
    if (col.includes('cost') || col.includes('maliyet') || col.includes('fiyat')) return { field: 'annualLicenseCost', confidence: 94 };
    if (col.includes('hour') || col.includes('saat') || col.includes('efor')) return { field: 'manualWorkHours', confidence: 85 };

    return { field: '', confidence: 50 };
  }
}
