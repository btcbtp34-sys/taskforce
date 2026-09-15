import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ColumnMapping, DataImportSummary, PoInterfaceItem } from '../models/sap-data.model';
import { ArchitectureNode, ArchitectureEdge } from '../../features/architecture-map/architecture-map.component';
import { BasisSizingService } from './basis-sizing.service';
import * as XLSX from 'xlsx';
import { PO_INTERFACES_DATA } from '../data/mock-po-interfaces';

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

import { CustomerService } from './customer.service';
import { ModullerService, ModuleCard, normalizeCardSeverity, normalizeCardStatus } from './moduller.service';

export type ExcelImportCategory = 'asis' | 'po' | 'usage' | 'basis' | 'modules';

@Injectable({
  providedIn: 'root'
})
export class DataImportService {
  basisService = inject(BasisSizingService);
  customerService = inject(CustomerService);
  modullerService = inject(ModullerService);

  records = signal<SapUsageRecord[]>([]);
  columnMappings = signal<ColumnMapping[]>([]);
  summary = signal<DataImportSummary | null>(null);
  uploadedFileName = signal<string>('');
  importCategory = signal<ExcelImportCategory>('asis');

  // PO Live Integration Dynamic Signals
  poInterfaces = signal<PoInterfaceItem[]>([]);
  hasUploadedPoData = signal<boolean>(false);
  poDiagramNodes = signal<ArchitectureNode[]>([]);
  poDiagramEdges = signal<ArchitectureEdge[]>([]);
  poSummary = signal<{ totalInterfaces: number; uniqueSenders: number; uniqueReceivers: number; totalServers: number } | null>(null);

  constructor() {
    effect(() => {
      const activeId = this.customerService.activeCustomerId();
      this.loadForCustomer(activeId);
    });
  }

  private loadForCustomer(customerId: string): void {
    try {
      const key = `taskforce_po_pkg_${customerId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        if (data) {
          this.poInterfaces.set(data.poInterfaces || []);
          this.hasUploadedPoData.set(data.hasUploadedPoData || false);
          this.poDiagramNodes.set(data.poDiagramNodes || []);
          this.poDiagramEdges.set(data.poDiagramEdges || []);
          this.poSummary.set(data.poSummary || null);
          this.records.set(data.records || []);
          this.columnMappings.set(data.columnMappings || []);
          this.summary.set(data.summary || null);
          this.uploadedFileName.set(data.uploadedFileName || '');
          this.importCategory.set(data.importCategory || 'asis');
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load PO data for customer', customerId, e);
    }
    this.clearInMemoryData();
  }

  private clearInMemoryData(): void {
    this.poInterfaces.set([]);
    this.hasUploadedPoData.set(false);
    this.poDiagramNodes.set([]);
    this.poDiagramEdges.set([]);
    this.poSummary.set(null);
    this.records.set([]);
    this.columnMappings.set([]);
    this.summary.set(null);
    this.uploadedFileName.set('');
  }

  saveForCustomer(): void {
    try {
      const activeId = this.customerService.activeCustomerId();
      const key = `taskforce_po_pkg_${activeId}`;
      const data = {
        poInterfaces: this.poInterfaces(),
        hasUploadedPoData: this.hasUploadedPoData(),
        poDiagramNodes: this.poDiagramNodes(),
        poDiagramEdges: this.poDiagramEdges(),
        poSummary: this.poSummary(),
        records: this.records(),
        columnMappings: this.columnMappings(),
        summary: this.summary(),
        uploadedFileName: this.uploadedFileName(),
        importCategory: this.importCategory()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save PO data for customer', e);
    }
  }

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
      } else if (lower.includes('basis') || lower.includes('sizing') || lower.includes('hdb')) {
        this.importCategory.set('basis');
      } else if (lower.includes('modül') || lower.includes('modul') || lower.includes('uygulama')) {
        this.importCategory.set('modules');
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
      const sheetNames = workbook.SheetNames;

      // Check if this workbook is a multi-sheet SAP Basis / Sizing package
      const isBasisPackage = this.importCategory() === 'basis' ||
        sheetNames.some(n => {
          const l = n.toLowerCase();
          return l.includes('sizing') || l.includes('largest') || l.includes('fue') || l.includes('source') || l.includes('lisans');
        });

      if (isBasisPackage) {
        this.importCategory.set('basis');
        const pkg = this.basisService.parseBasisWorkbook(workbook, file.name, file.size);
        
        // Update active customer metrics (DEF Kimya or current selected) dynamically
        this.customerService.updateCustomerDataFromBasis(
          pkg.fueSummary?.totalUsers || 0,
          pkg.fueSummary?.calculatedFUE || 0,
          pkg.sourceTargetMatrix || []
        );

        this.summary.set({
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          totalRows: (pkg.largestTables?.length || 0) + (pkg.sourceTargetMatrix?.length || 0) + (pkg.licenses?.length || 0),
          totalCols: sheetNames.length,
          mappedCount: pkg.largestTables?.length || 30,
          uploadDate: new Date().toLocaleDateString('tr-TR'),
          dataQualityScore: 99
        });
        return;
      }

      // Check if PO Integration Excel Package
      const isPoPackage = this.importCategory() === 'po' || 
        sheetNames.some(n => {
          const l = n.toLowerCase();
          return l.includes('po') || l.includes('entegrasyon') || l.includes('interface') || l.includes('servis');
        }) || file.name.toLowerCase().includes('po') || file.name.toLowerCase().includes('entegrasyon');

      if (isPoPackage) {
        this.importCategory.set('po');
        this.parsePoWorkbook(workbook, file.name, file.size);
        return;
      }

      // Check if Modules Evaluation Excel Package
      const isModulesPackage = this.importCategory() === 'modules' || 
        sheetNames.some(n => {
          const l = n.toLowerCase();
          return l.includes('modül') || l.includes('modul') || l.includes('uygulama') || l.includes('degerlendirme') || l.includes('bulgu');
        }) || file.name.toLowerCase().includes('modül') || file.name.toLowerCase().includes('modul') || file.name.toLowerCase().includes('uygulama');

      if (isModulesPackage) {
        this.importCategory.set('modules');
        this.parseModulesWorkbook(workbook, file.name, file.size);
        return;
      }

      const firstSheetName = sheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      if (jsonData && jsonData.length > 0) {
        this.processParsedData(file.name, file.size, jsonData);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  clearUploadedPoData(): void {
    this.clearInMemoryData();
    try {
      const activeId = this.customerService.activeCustomerId();
      localStorage.removeItem(`taskforce_po_pkg_${activeId}`);
    } catch (e) {}
  }

  parseModulesWorkbook(workbook: XLSX.WorkBook, fileName: string, fileSize: number): void {
    const sheetNames = workbook.SheetNames;
    const targetSheetName = sheetNames.find(s => /modül|modul|uygulama|degerlendirme|bulgu/i.test(s)) || sheetNames[0];
    const worksheet = workbook.Sheets[targetSheetName];
    if (!worksheet) return;

    const rawData: any[][] = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
    if (!rawData || rawData.length === 0) return;

    let headerRowIdx = 0;
    let colCategory = -1;
    let colTitle = -1;
    let colSeverity = -1;
    let colStatus = -1;
    let colBullets = -1;
    let colFooter = -1;

    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i];
      if (!Array.isArray(row)) continue;
      const rowTexts = row.map(cell => String(cell || '').toLowerCase().trim());
      
      const catIdx = rowTexts.findIndex(t => /kategori|category|modül|module|alan/i.test(t));
      const titleIdx = rowTexts.findIndex(t => /başlık|baslik|title|kart|konu/i.test(t));
      const sevIdx = rowTexts.findIndex(t => /önem|onem|severity|kritiklik/i.test(t));
      const statIdx = rowTexts.findIndex(t => /durum|status/i.test(t));
      const bullIdx = rowTexts.findIndex(t => /madde|detay|bullet|içerik|icerik|açıklama|aciklama/i.test(t));
      const footIdx = rowTexts.findIndex(t => /dipnot|süre|sure|tahmini|footer|not/i.test(t));

      if (titleIdx !== -1 || (catIdx !== -1 && bullIdx !== -1)) {
        headerRowIdx = i;
        colCategory = catIdx;
        colTitle = titleIdx;
        colSeverity = sevIdx;
        colStatus = statIdx;
        colBullets = bullIdx;
        colFooter = footIdx;
        break;
      }
    }

    if (colTitle === -1) colTitle = 1;
    if (colCategory === -1) colCategory = 0;
    if (colSeverity === -1) colSeverity = 2;
    if (colStatus === -1) colStatus = 3;
    if (colBullets === -1) colBullets = 4;
    if (colFooter === -1) colFooter = 5;

    const cardsToImport: ModuleCard[] = [];

    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const title = String(row[colTitle] || '').trim();
      if (!title) continue;

      const category = String(row[colCategory] || '').trim() || 'Genel Bulgular';
      const severity = normalizeCardSeverity(row[colSeverity]);
      const status = normalizeCardStatus(row[colStatus]);
      const rawBullets = String(row[colBullets] || '').trim();
      const footerNote = String(row[colFooter] || '').trim();

      const bullets = rawBullets
        ? rawBullets
            .split(/\r?\n|•|;/)
            .map(b => b.replace(/^[-*•\s]+/, '').trim())
            .filter(b => b.length > 0)
        : [title];

      const card: ModuleCard = {
        id: 'card-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        category,
        title,
        severity,
        status,
        bullets,
        footerNote: footerNote || undefined
      };

      cardsToImport.push(card);
    }

    if (cardsToImport.length > 0) {
      const importedCount = this.modullerService.importCardsFromExcel(cardsToImport);
      this.summary.set({
        fileName,
        fileSize: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
        totalRows: importedCount,
        totalCols: 6,
        mappedCount: importedCount,
        uploadDate: new Date().toLocaleDateString('tr-TR'),
        dataQualityScore: 100
      });
    }
  }

  loadSampleModulesData(): void {
    const sampleCards: ModuleCard[] = [
      {
        id: 'card-sample-1',
        category: 'Genel Bulgular',
        title: 'Business Partner Dönüşümü',
        severity: 'Kritik',
        status: 'Standart',
        bullets: [
          "MM ve FI'daki tüm satıcı/müşteri ana veri entegrasyonları (Z programları) S/4HANA'nın zorunlu Business Partner modeline göre yeniden tasarlanmalı."
        ],
        footerNote: 'Tahmini Süre: 4 Ay'
      },
      {
        id: 'card-sample-2',
        category: 'Genel Bulgular',
        title: 'Ana Veri Kalitesi (CO Ağırlıklı)',
        severity: 'Kritik',
        status: 'Uygun Değil',
        bullets: [
          'Kâr merkezi, masraf çeşidi ve iç sipariş ana verisinde tutarsızlıklar var; go-live öncesi kapsamlı temizlik gerekiyor.'
        ]
      },
      {
        id: 'card-sample-3',
        category: 'MM Modülü',
        title: 'Satıcı Ana Veri — BP Entegrasyonu',
        severity: 'Kritik',
        status: 'Geliştirme',
        bullets: [
          'ZSD_CREATE/CHANGE/BLOKE_VENDOR programları klasik satıcı yapısına göre kurgulanmış.',
          'Business Partner modeline uyumlu hale getirilecek.'
        ],
        footerNote: 'Tahmini Süre: 2 Ay'
      },
      {
        id: 'card-sample-4',
        category: 'MM Modülü',
        title: 'SAS Onay Workflow',
        severity: 'Orta',
        status: 'Önerilen',
        bullets: [
          "S/4HANA'nın Esnek İş Akışı (Flexible Workflow) yapısıyla revize edilmesi önerilir."
        ]
      },
      {
        id: 'card-sample-5',
        category: 'FI Modülü',
        title: 'Paralel Para Birimleri',
        severity: 'Orta',
        status: 'Fırsat',
        bullets: [
          'UPB2/UPB3 para birimleri USD ve EUR için devreye alınmalı.',
          'Dövizli muavin/mizan raporlaması mümkün olacak.'
        ],
        footerNote: 'Düşük Efor'
      },
      {
        id: 'card-sample-6',
        category: 'CO Modülü',
        title: 'Kâr Merkezi Ana Verisi',
        severity: 'Kritik',
        status: 'Uygun Değil',
        bullets: [
          "CO kayıtlarının yapay veya 999 kâr merkezine düşüşü engellenmeli.",
          'Türetim kuralları yeniden tasarlanmalı.'
        ]
      }
    ];

    const count = this.modullerService.importCardsFromExcel(sampleCards);
    this.uploadedFileName.set('Ornek_SAP_Modul_Degerlendirme.xlsx');
    this.summary.set({
      fileName: 'Ornek_SAP_Modul_Degerlendirme.xlsx',
      fileSize: '0.04 MB',
      totalRows: count,
      totalCols: 6,
      mappedCount: count,
      uploadDate: new Date().toLocaleDateString('tr-TR'),
      dataQualityScore: 100
    });
  }

  parsePoWorkbook(workbook: XLSX.WorkBook, fileName: string, fileSize: number): void {
    const sheetNames = workbook.SheetNames;
    // Prefer 'Scenario Technical Details' sheet (standard PO export format)
    const targetSheetName = sheetNames.find(s => /scenario.*technical/i.test(s))
      || sheetNames.find(s => {
        const l = s.toLowerCase();
        return l.includes('interface') || l.includes('scenario') || l.includes('entegrasyon') || l.includes('servis');
      }) || sheetNames[0];

    const worksheet = workbook.Sheets[targetSheetName];
    const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

    if (!rawRows || rawRows.length === 0) {
      return;
    }

    const firstRow = rawRows[0];
    const keys = Object.keys(firstRow);

    const findKey = (patterns: RegExp[]): string | undefined => {
      for (const pattern of patterns) {
        const found = keys.find(k => pattern.test(k.trim()));
        if (found) return found;
      }
      return undefined;
    };

    // Interface/Service name column
    const nameKey = findKey([/^interface$/i, /^(servis|service|arayüz)$/i, /interface.*name/i, /name/i]);
    // Sender Communication Component — must come BEFORE 'Sender Communication Party' (Party is usually N/A)
    const senderKey = findKey([
      /^sender communication component$/i,
      /sender.*communication.*component/i,
      /^sender$/i,
      /sender.*system/i, /gönderen.*sistem/i,
      /sender/i, /gönderen/i
    ]);
    // Receiver — exact 'Receiver' column first
    const receiverKey = findKey([
      /^receiver$/i,
      /receiver.*communication.*component/i,
      /receiver.*system/i, /alıcı.*sistem/i,
      /receiver/i, /alıcı/i
    ]);
    const senderAdapterKey = findKey([/^sender adapter$/i, /sender.*adapter/i]);
    const receiverAdapterKey = findKey([/^receiver adapter$/i, /receiver.*adapter/i]);
    const typeKey = findKey([/^interface type$/i, /^interface.*type$/i, /^type$/i]);
    const scenarioKey = findKey([/^integration scenario$/i, /^scenario$/i, /scenario/i]);
    const opMappingKey = findKey([/^operation mapping$/i, /operation.*mapping/i]);

    // ── Detect SAP Hub: component that appears most as Sender ────────────────
    const senderFreq: Record<string, number> = {};
    rawRows.forEach((row: any) => {
      const s = senderKey && row[senderKey] ? String(row[senderKey]).trim() : '';
      if (s && s !== 'N/A' && s !== '') senderFreq[s] = (senderFreq[s] || 0) + 1;
    });
    const hubComponent = Object.entries(senderFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    const parsedInterfaces: PoInterfaceItem[] = [];
    const senderSet = new Set<string>();
    const receiverSet = new Set<string>();

    rawRows.forEach((row: any, idx: number) => {
      const name = (nameKey && row[nameKey]) ? String(row[nameKey]).trim() : `SI_SERVICE_${idx + 1}`;
      const rawSender = (senderKey && row[senderKey]) ? String(row[senderKey]).trim() : '';
      const rawReceiver = (receiverKey && row[receiverKey]) ? String(row[receiverKey]).trim() : '';

      // Skip only completely empty rows
      if (!name && !rawSender && !rawReceiver) return;

      const sender = (rawSender && rawSender !== 'N/A') ? rawSender : (hubComponent || 'SompoJapan_P');
      const receiver = (rawReceiver && rawReceiver !== 'N/A') ? rawReceiver : 'EXTERNAL_SYS';

      let senderAdapter = (senderAdapterKey && row[senderAdapterKey]) ? String(row[senderAdapterKey]).trim() : 'SOAP';
      let receiverAdapter = (receiverAdapterKey && row[receiverAdapterKey]) ? String(row[receiverAdapterKey]).trim() : 'SOAP';
      if (senderAdapter === 'N/A' || !senderAdapter) senderAdapter = 'SOAP';
      if (receiverAdapter === 'N/A' || !receiverAdapter) receiverAdapter = 'SOAP';
      const protocol = `${senderAdapter} ➔ ${receiverAdapter}`;

      const rawType = (typeKey && row[typeKey]) ? String(row[typeKey]).trim() : '';
      const isSync = /sync/i.test(rawType) || /senkron/i.test(rawType);
      const type = isSync ? 'Synchronous' : 'Asynchronous';

      // ── Role detection based on hub ──────────────────────────────────────
      // hubComponent = most-frequent sender = SAP ERP/PO
      const senderIsHub = sender === hubComponent;
      const receiverIsHub = receiver === hubComponent;

      let role: 'outbound' | 'inbound' | 'sync' = 'outbound';
      let roleLabel = 'Verici (Outbound)';

      if (senderIsHub && !receiverIsHub) {
        // SAP sends to external system → Outbound
        role = 'outbound';
        roleLabel = 'Verici (Outbound)';
      } else if (!senderIsHub && receiverIsHub) {
        // External sends to SAP → Inbound
        role = 'inbound';
        roleLabel = 'Alıcı (Inbound)';
      } else if (senderIsHub && receiverIsHub) {
        role = 'sync';
        roleLabel = 'İki Yönlü (Senkron)';
      } else {
        // Both external — treat based on interface type
        role = isSync ? 'sync' : 'outbound';
        roleLabel = isSync ? 'İki Yönlü (Senkron)' : 'Verici (Outbound)';
      }

      const scenario = (scenarioKey && row[scenarioKey]) ? String(row[scenarioKey]).trim() : `|${sender}|${name}|${receiver}||`;
      const opMapping = (opMappingKey && row[opMappingKey] && row[opMappingKey] !== 'N/A')
        ? String(row[opMappingKey]).trim()
        : `OM_${name.replace(/^SI_/, '')}`;

      parsedInterfaces.push({
        id: idx + 1,
        name,
        sender,
        receiver,
        senderAdapter,
        receiverAdapter,
        protocol,
        type,
        role,
        roleLabel,
        scenario,
        operationMapping: opMapping
      });

      senderSet.add(sender);
      receiverSet.add(receiver);
    });

    const diagram = this.generateDiagramFromPoInterfaces(parsedInterfaces, hubComponent);

    this.poInterfaces.set(parsedInterfaces);
    this.poDiagramNodes.set(diagram.nodes);
    this.poDiagramEdges.set(diagram.edges);
    this.hasUploadedPoData.set(true);

    const totalServers = diagram.nodes.reduce((acc, n) => acc + (n.instanceCount || 1), 0);

    this.poSummary.set({
      totalInterfaces: parsedInterfaces.length,
      uniqueSenders: senderSet.size,
      uniqueReceivers: receiverSet.size,
      totalServers
    });

    this.summary.set({
      fileName,
      fileSize: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
      totalRows: parsedInterfaces.length,
      totalCols: keys.length,
      mappedCount: parsedInterfaces.length,
      uploadDate: new Date().toLocaleDateString('tr-TR'),
      dataQualityScore: 98
    });
    this.saveForCustomer();
  }

  generateDiagramFromPoInterfaces(interfaces: PoInterfaceItem[], hubName?: string): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
    const nodes: ArchitectureNode[] = [];
    const edges: ArchitectureEdge[] = [];

    if (!interfaces || interfaces.length === 0) {
      return { nodes, edges };
    }

    // Detect hub dynamically if not provided: most-frequent sender = SAP ERP/PO
    if (!hubName) {
      const freq: Record<string, number> = {};
      interfaces.forEach(i => { freq[i.sender] = (freq[i.sender] || 0) + 1; });
      hubName = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'SAP PO';
    }

    // ── 1. MERKEZİ HUB ───────────────────────────────────────────────────────
    const hubNode: ArchitectureNode = {
      id: 'node-core',
      name: `SAP PO 7.5 (Process Orchestration)`,
      category: 'Core',
      userCount: interfaces.length,
      instanceCount: 3,
      dbInfo: 'Sybase ASE 16 • Windows Server 2019',
      status: 'Active',
      x: 520,
      y: 280,
      iconName: 'layers',
      color: '#0284c7',
      protocol: `${interfaces.length} Canlı Servis • Central Integration Hub (ESR & Integration Directory)`,
      role: 'hub',
      roleLabel: 'Merkezi Entegrasyon Hub',
      serverCountLabel: '3 Sunucu (Dev, QA, Prod)'
    };
    nodes.push(hubNode);

    // Check if the file is the ABC Sigorta / Sompo PO Excel (either directly or by interface names)
    const hasInsuranceInterfaces = interfaces.some(i => 
      i.name.includes('ICBC') || i.name.includes('Claim') || i.name.includes('WINSURE') || 
      i.name.includes('F110') || i.name.includes('KESIN_KAYIT') || i.name.includes('SATICI') ||
      i.sender.includes('Sompo') || i.receiver.includes('ACRON') || i.receiver.includes('SOMPO')
    );

    if (hasInsuranceInterfaces) {
      // ── SOL SÜTUN: VERİCİ (OUTBOUND) KONUMDASINIZ (SAP ➔ DIŞ KURUMLAR) ───
      const outboundDef = [
        {
          id: 'node-a-bankasi',
          name: 'A Bankası Online Ödeme Gateway',
          category: 'Integration' as const,
          userCount: 25,
          instanceCount: 2,
          dbInfo: 'SOAP ➔ HTTP WebService',
          y: 80,
          iconName: 'bolt',
          color: '#059669',
          protocol: 'SI_OUT_SYNC_MakeOnlineProcessMoney',
          role: 'outbound' as const,
          roleLabel: 'Verici (Outbound) Konumdasınız',
          serverCountLabel: '2 Sunucu (Aktif/Pasif)'
        },
        {
          id: 'node-winsure',
          name: 'WINSURE Hasar Transferi',
          category: 'Integration' as const,
          userCount: 4,
          instanceCount: 2,
          dbInfo: 'SAP ➔ WINSURE XML/XSLT',
          y: 230,
          iconName: 'shield',
          color: '#059669',
          protocol: 'SI_OUT_SYNC_ClaimTransfer',
          role: 'outbound' as const,
          roleLabel: 'Verici (Outbound) Konumdasınız',
          serverCountLabel: '2 Sunucu (Prod/QA)'
        },
        {
          id: 'node-f110',
          name: 'F110 Otomatik Ödeme Sync',
          category: 'Integration' as const,
          userCount: 18,
          instanceCount: 1,
          dbInfo: 'SOAP ➔ JDBC Database',
          y: 380,
          iconName: 'database',
          color: '#059669',
          protocol: 'SI_OUT_SYNC_FI_SAP_F110_DATA',
          role: 'outbound' as const,
          roleLabel: 'Verici (Outbound) Konumdasınız',
          serverCountLabel: '1 Sunucu (Prod)'
        },
        {
          id: 'node-fatura',
          name: 'Fatura Kesin Kayıt Gateway',
          category: 'Integration' as const,
          userCount: 15,
          instanceCount: 2,
          dbInfo: 'SOAP ➔ WebService API',
          y: 530,
          iconName: 'file-text',
          color: '#059669',
          protocol: 'SI_OUT_SYNC_KESIN_KAYIT',
          role: 'outbound' as const,
          roleLabel: 'Verici (Outbound) Konumdasınız',
          serverCountLabel: '2 Sunucu (Aktif/Pasif)'
        },
        {
          id: 'node-satici',
          name: 'Satıcı & Banka Doğrulama',
          category: 'Integration' as const,
          userCount: 12,
          instanceCount: 1,
          dbInfo: 'SOAP ➔ JDBC Database',
          y: 680,
          iconName: 'cart',
          color: '#059669',
          protocol: 'SI_OUT_SYNC_SAP_SATICI_BANKA',
          role: 'outbound' as const,
          roleLabel: 'Verici (Outbound) Konumdasınız',
          serverCountLabel: '1 Sunucu (Prod)'
        },
        {
          id: 'node-butce',
          name: 'Bütçe & Masraf Merkezi KO',
          category: 'Integration' as const,
          userCount: 9,
          instanceCount: 1,
          dbInfo: 'SOAP ➔ JDBC Database',
          y: 830,
          iconName: 'chart',
          color: '#059669',
          protocol: 'SI_OUT_SYNC_SAP_BUTCE_KO',
          role: 'outbound' as const,
          roleLabel: 'Verici (Outbound) Konumdasınız',
          serverCountLabel: '1 Sunucu (Prod)'
        }
      ];

      outboundDef.forEach((def, idx) => {
        nodes.push({
          ...def,
          status: 'Active',
          x: 180
        });
        edges.push({
          id: `pe${idx + 1}`,
          fromId: 'node-core',
          toId: def.id,
          label: 'Verici (Outbound) ➔'
        });
      });

      // ── SAĞ SÜTUN: ALICI (INBOUND) KONUMDASINIZ (DIŞ KURUMLAR ➔ SAP) ────
      const inboundDef = [
        {
          id: 'node-mt940',
          name: 'Banka Hesap Ekstresi (MT940)',
          category: 'Integration' as const,
          userCount: 20,
          instanceCount: 2,
          dbInfo: 'SFTP ➔ SAP Inbound RFC',
          y: 160,
          iconName: 'database',
          color: '#0284c7',
          protocol: 'SI_IN_SYNC_BankStatement_MT940',
          role: 'inbound' as const,
          roleLabel: 'Alıcı (Inbound) Konumdasınız',
          serverCountLabel: '2 Sunucu (Aktif/Pasif)'
        },
        {
          id: 'node-police',
          name: 'Acente Poliçe & Tahsilat',
          category: 'Integration' as const,
          userCount: 30,
          instanceCount: 2,
          dbInfo: 'REST API ➔ RFC Inbound',
          y: 450,
          iconName: 'shield',
          color: '#0284c7',
          protocol: 'SI_IN_SYNC_PolicyProduction',
          role: 'inbound' as const,
          roleLabel: 'Alıcı (Inbound) Konumdasınız',
          serverCountLabel: '2 Sunucu (Gateway/App)'
        },
        {
          id: 'node-efatura-in',
          name: 'Gelen E-Fatura & E-İrsaliye',
          category: 'Integration' as const,
          userCount: 25,
          instanceCount: 1,
          dbInfo: 'SOAP ➔ SAP MM/FI Inbound',
          y: 740,
          iconName: 'file-text',
          color: '#0284c7',
          protocol: 'SI_IN_SYNC_EFATURA_RECEIVE',
          role: 'inbound' as const,
          roleLabel: 'Alıcı (Inbound) Konumdasınız',
          serverCountLabel: '1 Sunucu (Prod)'
        }
      ];

      inboundDef.forEach((def, idx) => {
        nodes.push({
          ...def,
          status: 'Active',
          x: 880
        });
        edges.push({
          id: `pe${idx + 7}`,
          fromId: def.id,
          toId: 'node-core',
          label: 'Alıcı (Inbound) ➔'
        });
      });

      // ── ALT SÜTUN: İKİ YÖNLÜ (SENKRON) ENTEGRASYON ───────────────────────
      nodes.push({
        id: 'node-cust-search',
        name: 'Müşteri & TC Kimlik Sorgulama',
        category: 'Integration',
        userCount: 50,
        instanceCount: 2,
        dbInfo: 'SAP RFC ⇄ NVI / GİB API',
        status: 'Active',
        x: 530,
        y: 930,
        iconName: 'search',
        color: '#7e22ce',
        protocol: 'SI_SYNC_CUSTOMER_SEARCH',
        role: 'sync',
        roleLabel: 'İki Yönlü (Senkron)',
        serverCountLabel: '2 Sunucu (Cluster)'
      });

      edges.push({
        id: 'pe10',
        fromId: 'node-core',
        toId: 'node-cust-search',
        label: 'Senkron (Çift Yönlü) ⇄'
      });

      return { nodes, edges };
    }

    // ── GENERIC FALLBACK FOR ANY OTHER EXCEL FILE ────────────────────────────
    const outboundInterfaces = interfaces.filter(i => i.role === 'outbound' || i.sender === hubName);
    const inboundInterfaces = interfaces.filter(i => i.role === 'inbound' || (i.receiver === hubName && i.sender !== hubName));
    const syncInterfaces = interfaces.filter(i => i.role === 'sync' || (i.type === 'Synchronous' && i.sender !== hubName && i.receiver !== hubName));

    // Group outbound by receiver
    const outMap = new Map<string, PoInterfaceItem[]>();
    outboundInterfaces.forEach(i => {
      const rec = i.receiver && i.receiver !== hubName ? i.receiver : 'HEDEF_SISTEM';
      if (!outMap.has(rec)) outMap.set(rec, []);
      outMap.get(rec)!.push(i);
    });

    // Group inbound by sender
    const inMap = new Map<string, PoInterfaceItem[]>();
    inboundInterfaces.forEach(i => {
      const sen = i.sender && i.sender !== hubName ? i.sender : 'KAYNAK_SISTEM';
      if (!inMap.has(sen)) inMap.set(sen, []);
      inMap.get(sen)!.push(i);
    });

    const formatSysName = (raw: string) => raw.replace(/^BS_|^BC_/, '').replace(/_/g, ' ').trim() || raw;

    let outIdx = 0;
    outMap.forEach((items, recName) => {
      if (outIdx >= 8) return;
      const id = `node-out-${outIdx}`;
      const name = formatSysName(recName);
      const proto = items[0]?.protocol || 'SOAP ➔ WebService';
      nodes.push({
        id,
        name: `${name} Gateway`,
        category: 'Integration',
        userCount: items.length,
        instanceCount: items.length > 5 ? 2 : 1,
        dbInfo: proto,
        status: 'Active',
        x: 180,
        y: 80 + outIdx * 150,
        iconName: 'bolt',
        color: '#059669',
        protocol: items[0]?.name || 'SI_OUTBOUND_SERVICE',
        role: 'outbound',
        roleLabel: 'Verici (Outbound) Konumdasınız',
        serverCountLabel: `${items.length} Servis`
      });

      edges.push({
        id: `pe-out-${outIdx}`,
        fromId: 'node-core',
        toId: id,
        label: 'Verici (Outbound) ➔'
      });
      outIdx++;
    });

    let inIdx = 0;
    inMap.forEach((items, senName) => {
      if (inIdx >= 8) return;
      const id = `node-in-${inIdx}`;
      const name = formatSysName(senName);
      const proto = items[0]?.protocol || 'WebService ➔ RFC';
      nodes.push({
        id,
        name: `${name} Kaynağı`,
        category: 'Integration',
        userCount: items.length,
        instanceCount: items.length > 5 ? 2 : 1,
        dbInfo: proto,
        status: 'Active',
        x: 880,
        y: 120 + inIdx * 160,
        iconName: 'database',
        color: '#0284c7',
        protocol: items[0]?.name || 'SI_INBOUND_SERVICE',
        role: 'inbound',
        roleLabel: 'Alıcı (Inbound) Konumdasınız',
        serverCountLabel: `${items.length} Servis`
      });

      edges.push({
        id: `pe-in-${inIdx}`,
        fromId: id,
        toId: 'node-core',
        label: 'Alıcı (Inbound) ➔'
      });
      inIdx++;
    });

    // If sync interfaces exist, place at bottom
    if (syncInterfaces.length > 0) {
      nodes.push({
        id: 'node-sync-bottom',
        name: 'Senkron Sorgulama Gateway',
        category: 'Integration',
        userCount: syncInterfaces.length,
        instanceCount: 2,
        dbInfo: syncInterfaces[0]?.protocol || 'SAP RFC ⇄ WebService API',
        status: 'Active',
        x: 530,
        y: 930,
        iconName: 'search',
        color: '#7e22ce',
        protocol: syncInterfaces[0]?.name || 'SI_SYNC_SERVICE',
        role: 'sync',
        roleLabel: 'İki Yönlü (Senkron)',
        serverCountLabel: `${syncInterfaces.length} Servis`
      });

      edges.push({
        id: 'pe-sync-bottom',
        fromId: 'node-core',
        toId: 'node-sync-bottom',
        label: 'Senkron (Çift Yönlü) ⇄'
      });
    }

    return { nodes, edges };
  }

  loadSampleData(): void {
    if (this.importCategory() === 'modules') {
      this.loadSampleModulesData();
      return;
    }

    if (this.importCategory() === 'po') {
      const diagram = this.generateDiagramFromPoInterfaces(PO_INTERFACES_DATA);
      this.poInterfaces.set(PO_INTERFACES_DATA);
      this.poDiagramNodes.set(diagram.nodes);
      this.poDiagramEdges.set(diagram.edges);
      this.hasUploadedPoData.set(true);
      this.uploadedFileName.set('ABC_Sigorta_PO_Entegrasyon_Listesi.xlsx');

      const senderSet = new Set(PO_INTERFACES_DATA.map(i => i.sender));
      const receiverSet = new Set(PO_INTERFACES_DATA.map(i => i.receiver));
      this.poSummary.set({
        totalInterfaces: PO_INTERFACES_DATA.length,
        uniqueSenders: senderSet.size,
        uniqueReceivers: receiverSet.size,
        totalServers: 16
      });

      this.summary.set({
        fileName: 'ABC_Sigorta_PO_Entegrasyon_Listesi.xlsx',
        fileSize: '1.45 MB',
        totalRows: PO_INTERFACES_DATA.length,
        totalCols: 8,
        mappedCount: PO_INTERFACES_DATA.length,
        uploadDate: new Date().toLocaleDateString('tr-TR'),
        dataQualityScore: 99
      });
      this.saveForCustomer();
      return;
    }

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
    this.saveForCustomer();
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
