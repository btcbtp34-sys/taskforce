import { Customer } from '../models/customer.model';

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'ABC Holding',
    code: 'ABC-2026',
    sector: 'Manufacturing & Enterprise',
    sapUserCount: 1250,
    activeUserCount: 1120,
    lowUsageUserCount: 130,
    totalLicenseCost: 450000,
    estimatedOpportunityValue: 160000,
    activeOpportunityCount: 5,
    taskForceStatus: 'Solution Design',
    progressPercentage: 65,
    sapProducts: [
      { id: 'p1', name: 'SAP S/4HANA', category: 'ERP Core', status: 'Active', licenseCount: 850, monthlyCost: 22000, icon: 'database' },
      { id: 'p2', name: 'SAP SuccessFactors', category: 'HXM', status: 'Active', licenseCount: 1250, monthlyCost: 8500, icon: 'users' },
      { id: 'p3', name: 'SAP Ariba', category: 'Procurement', status: 'Active', licenseCount: 150, monthlyCost: 4200, icon: 'shopping-cart' },
      { id: 'p4', name: 'SAP BTP', category: 'Platform & Integration', status: 'Active', licenseCount: 50, monthlyCost: 2800, icon: 'layers' },
      { id: 'p5', name: 'SAP Analytics Cloud', category: 'Analytics', status: 'Planned', licenseCount: 30, monthlyCost: 1500, icon: 'bar-chart' }
    ],
    coreProblems: [
      'Yüksek Lisans Maliyeti',
      'Manuel İş Süreçleri',
      'Tekrarlayan İşlemler',
      'Düşük Kullanım Oranları',
      'Entegrasyon Problemleri',
      'Raporlama Problemleri'
    ],
    contactPerson: 'Mehmet Yılmaz (CIO)',
    email: 'mehmet.yilmaz@abcholding.com',
    phone: '+90 212 555 0199',
    logo: 'building',
    lastAnalysisDate: '2026-08-28'
  },
  {
    id: 'cust-sigorta',
    name: 'ABC Sigorta A.Ş.',
    code: 'SIG-2026',
    sector: 'Insurance & Financial Services',
    sapUserCount: 450,
    activeUserCount: 380,
    lowUsageUserCount: 70,
    totalLicenseCost: 380000,
    estimatedOpportunityValue: 140000,
    activeOpportunityCount: 6,
    taskForceStatus: 'Solution Design',
    progressPercentage: 75,
    sapProducts: [
      { id: 'p-sig-1', name: 'SAP ERP EHP 7 (Sybase)', category: 'ERP Core', status: 'Active', licenseCount: 380, monthlyCost: 18000, icon: 'database' },
      { id: 'p-sig-2', name: 'SAP PO 7.5 (Process Orchestration)', category: 'Integration', status: 'Active', licenseCount: 3, monthlyCost: 4500, icon: 'layers' },
      { id: 'p-sig-3', name: 'SAP Fiori S4H 1511 (FES 200)', category: 'User Experience', status: 'Optimization Candidate', licenseCount: 200, monthlyCost: 3200, icon: 'users' },
      { id: 'p-sig-4', name: 'SAP Content Server 6.5 (MaxDB)', category: 'Document Storage', status: 'Optimization Candidate', licenseCount: 1, monthlyCost: 1200, icon: 'file-text' },
      { id: 'p-sig-5', name: 'Finansal Ödeme & Hasar Entegrasyon Gateway', category: 'Financial Interfaces', status: 'Active', licenseCount: 10, monthlyCost: 2800, icon: 'bolt' }
    ],
    coreProblems: [
      'Fiori & Content Server Destek Sonu (EoS 2020)',
      'ERP EHP 7 S/4HANA Dönüşüm İhtiyacı',
      'Fazla Lisans Kullanımı (70 FUE Yeterli)',
      '10+ Canlı PO Entegrasyonu (Banka Ödeme, Hasar Transferi)',
      '1 TB Prod S/4HANA DB Boyutlandırma Gereksinimi'
    ],
    contactPerson: 'IT Mimari & Sistem Yönetimi',
    email: 'it.architecture@abcsigorta.com.tr',
    phone: '+90 216 600 5000',
    logo: 'shield-check',
    lastAnalysisDate: '2026-06-09'
  },
  {
    id: 'cust-2',
    name: 'DEF Kimya A.Ş.',
    code: 'DEF-2026',
    sector: 'Chemicals & Energy',
    sapUserCount: 840,
    activeUserCount: 710,
    lowUsageUserCount: 130,
    totalLicenseCost: 310000,
    estimatedOpportunityValue: 95000,
    activeOpportunityCount: 3,
    taskForceStatus: 'Analysis',
    progressPercentage: 40,
    sapProducts: [
      { id: 'p1', name: 'SAP S/4HANA Cloud', category: 'ERP Core', status: 'Active', licenseCount: 600, monthlyCost: 16000, icon: 'cloud' },
      { id: 'p2', name: 'SAP Ariba', category: 'Procurement', status: 'Active', licenseCount: 120, monthlyCost: 3800, icon: 'shopping-cart' },
      { id: 'p3', name: 'SAP BTP Process Automation', category: 'Automation', status: 'Planned', licenseCount: 20, monthlyCost: 1200, icon: 'cpu' }
    ],
    coreProblems: [
      'Manuel Tedarik Zinciri Süreçleri',
      'Rapor Alma Süreçlerinde Yavaşlık',
      'Fazla Lisans Atamaları'
    ],
    contactPerson: 'Ayşe Demir (IT Director)',
    email: 'ayse.demir@defkimya.com',
    phone: '+90 216 444 0288',
    logo: 'flask-conical',
    lastAnalysisDate: '2026-08-25'
  },
  {
    id: 'cust-3',
    name: 'GHI Lojistik Grubu',
    code: 'GHI-2026',
    sector: 'Logistics & Retail',
    sapUserCount: 2100,
    activeUserCount: 1850,
    lowUsageUserCount: 250,
    totalLicenseCost: 680000,
    estimatedOpportunityValue: 240000,
    activeOpportunityCount: 7,
    taskForceStatus: 'Opportunity Identification',
    progressPercentage: 50,
    sapProducts: [
      { id: 'p1', name: 'SAP S/4HANA', category: 'ERP Core', status: 'Active', licenseCount: 1400, monthlyCost: 38000, icon: 'database' },
      { id: 'p2', name: 'SAP Transportation Management', category: 'Supply Chain', status: 'Active', licenseCount: 450, monthlyCost: 12500, icon: 'truck' },
      { id: 'p3', name: 'SAP Analytics Cloud', category: 'Analytics', status: 'Active', licenseCount: 80, monthlyCost: 3200, icon: 'bar-chart' },
      { id: 'p4', name: 'SAP Joule AI Assistant', category: 'AI', status: 'Under Review', licenseCount: 0, monthlyCost: 0, icon: 'sparkles' }
    ],
    coreProblems: [
      'Depo Manuel Veri Girişleri',
      'Müşteri Bildirimlerinde Raporlama Yavaşlığı',
      'Kullanılmayan Professional Lisanslar'
    ],
    contactPerson: 'Caner Kaya (COO)',
    email: 'caner.kaya@ghilogistics.com',
    phone: '+90 312 333 0911',
    logo: 'truck',
    lastAnalysisDate: '2026-08-30'
  }
];
