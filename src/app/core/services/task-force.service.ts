import { Injectable, signal, computed, inject } from '@angular/core';
import { OpenQuestion, TaskForceAction, TaskForceMember, TaskForceNote, TaskForceStageInfo } from '../models/workspace.model';
import { CustomerService } from './customer.service';

@Injectable({
  providedIn: 'root'
})
export class TaskForceService {
  private customerService = inject(CustomerService);

  readonly stages: TaskForceStageInfo[] = [
    { index: 1, id: 'discovery', label: 'Discovery', description: 'Müşteri mevcut SAP yapısı & gereksinim belirleme', completed: true, current: false },
    { index: 2, id: 'data-collection', label: 'Data Collection', description: 'SAP kullanım verilerinin yüklenmesi (.xlsx / .csv)', completed: true, current: false },
    { index: 3, id: 'analysis', label: 'Analysis', description: 'Veri kalitesi, modül ve lisans dağılım analizi', completed: true, current: false },
    { index: 4, id: 'opportunity-id', label: 'Opportunity Identification', description: 'Lisans, BTP ve otomasyon fırsatlarının tespiti', completed: true, current: false },
    { index: 5, id: 'solution-design', label: 'Solution Design', description: 'Task Force ekibi senaryo ve mimari tasarımı', completed: false, current: true },
    { index: 6, id: 'business-case', label: 'Business Case', description: 'ROI, Payback ve finansal etki hesaplama', completed: false, current: false },
    { index: 7, id: 'presentation', label: 'Customer Presentation', description: 'Müşteri karar verici sunumunun hazırlanması', completed: false, current: false },
    { index: 8, id: 'closed', label: 'Closed', description: 'Proje onayı & uygulama fazına geçiş', completed: false, current: false }
  ];

  readonly teamMembers: TaskForceMember[] = [
    { id: 'm1', name: 'Ahmet Yılmaz', role: 'Sales Manager', avatar: 'AY', email: 'ahmet.y@sapconsulting.com' },
    { id: 'm2', name: 'Zeynep Kaya', role: 'SAP Consultant', avatar: 'ZK', email: 'zeynep.k@sapconsulting.com' },
    { id: 'm3', name: 'Caner Demir', role: 'Solution Architect', avatar: 'CD', email: 'caner.d@sapconsulting.com' },
    { id: 'm4', name: 'Elif Şahin', role: 'Business Analyst', avatar: 'EŞ', email: 'elif.s@sapconsulting.com' },
    { id: 'm5', name: 'Murat Öztürk', role: 'Technical Consultant', avatar: 'MÖ', email: 'murat.o@sapconsulting.com' }
  ];

  private currentStageIndexSignal = signal<number>(5); // Default Solution Design

  private actionsSignal = signal<TaskForceAction[]>([
    // ABC Holding (cust-1)
    {
      id: 'act-1',
      customerId: 'cust-1',
      title: 'Finance süreci manuel fatura doğrulama detaylarını analiz et',
      description: 'Monthly 400 manuel işlem için BTP Document Information Extraction uyumluluğunu kontrol et.',
      assignedTo: this.teamMembers[1],
      dueDate: '2026-09-15',
      status: 'In Progress',
      priority: 'High'
    },
    {
      id: 'act-2',
      customerId: 'cust-1',
      title: '130 adet düşük kullanımlı Professional lisans yetki matrisini dökümantasyona dök',
      description: 'Kullanıcıların kullandığı T-Code ve Fiori App dökümünü çıkar.',
      assignedTo: this.teamMembers[3],
      dueDate: '2026-09-10',
      status: 'In Progress',
      priority: 'High'
    },
    {
      id: 'act-3',
      customerId: 'cust-1',
      title: 'SAP BTP Build Process Automation mimari diyagramını hazırla',
      description: 'S/4HANA Cloud & BTP connector mimarisi çizilmeli.',
      assignedTo: this.teamMembers[2],
      dueDate: '2026-09-18',
      status: 'To Do',
      priority: 'Medium'
    },
    {
      id: 'act-4',
      customerId: 'cust-1',
      title: 'CIO Mehmet Yılmaz ile Business Case ön görüşmesi yap',
      description: 'ROI ve 3 Yıllık Net Fayda çıktılarını değerlendir.',
      assignedTo: this.teamMembers[0],
      dueDate: '2026-09-20',
      status: 'To Do',
      priority: 'High'
    },

    // ABC Sigorta A.Ş. (cust-sigorta)
    {
      id: 'act-sig-1',
      customerId: 'cust-sigorta',
      title: 'ERP EHP 7 Sybase S/4HANA dönüşüm yol haritasını hazırla',
      description: '1 TB veritabanı boyutlandırması ve HANA optimizasyonu değerlendirilecek.',
      assignedTo: this.teamMembers[2],
      dueDate: '2026-09-22',
      status: 'In Progress',
      priority: 'High'
    },
    {
      id: 'act-sig-2',
      customerId: 'cust-sigorta',
      title: '10+ canlı PO entegrasyonunu BTP Integration Suite geçişi için analiz et',
      description: 'Banka ödeme arayüzleri ve acente servislerinin iFlow uyumluluğu kontrol edilecek.',
      assignedTo: this.teamMembers[4],
      dueDate: '2026-09-25',
      status: 'In Progress',
      priority: 'High'
    },
    {
      id: 'act-sig-3',
      customerId: 'cust-sigorta',
      title: 'Fiori & Content Server Destek Sonu (EoS) geçiş planını çıkar',
      description: 'EoS 2020 kapsamındaki bileşenlerin BTP Document Management ve Launchpad geçişi.',
      assignedTo: this.teamMembers[1],
      dueDate: '2026-09-19',
      status: 'To Do',
      priority: 'Medium'
    },
    {
      id: 'act-sig-4',
      customerId: 'cust-sigorta',
      title: 'Hasar & Finans Gateway arayüz güvenlik sertifikalarını doğrula',
      description: 'Ödeme kanalları mTLS ve API güvenlik kontrolleri.',
      assignedTo: this.teamMembers[3],
      dueDate: '2026-09-28',
      status: 'To Do',
      priority: 'High'
    },

    // DEF Kimya A.Ş. (cust-2)
    {
      id: 'act-def-1',
      customerId: 'cust-2',
      title: 'SAP Basis ekibinden sistem kullanım verilerinin (.xlsx) talep edilmesi',
      description: 'FUE ve kullanıcı işlem kayıtlarının ihracı bekleniyor.',
      assignedTo: this.teamMembers[0],
      dueDate: '2026-09-24',
      status: 'In Progress',
      priority: 'High'
    },
    {
      id: 'act-def-2',
      customerId: 'cust-2',
      title: 'Ayşe Demir (IT Direktörü) ile ilk analiz kapsam toplantısı',
      description: 'Kimya sektörü öncelikli süreç darboğazları belirlenecek.',
      assignedTo: this.teamMembers[1],
      dueDate: '2026-09-26',
      status: 'To Do',
      priority: 'Medium'
    },

    // F*****R (cust-3)
    {
      id: 'act-f-1',
      customerId: 'cust-3',
      title: 'Depo ve Lojistik Transportation Management süreç analizini tamamla',
      description: '450 TM kullanıcısının sahadaki veri giriş darboğazları incelenecek.',
      assignedTo: this.teamMembers[3],
      dueDate: '2026-09-21',
      status: 'In Progress',
      priority: 'High'
    },
    {
      id: 'act-f-2',
      customerId: 'cust-3',
      title: '250 atıl Professional lisansın revizyonunu planla',
      description: '€560.000 potansiyel lisans optimizasyonu teklif dokümanına işlenecek.',
      assignedTo: this.teamMembers[0],
      dueDate: '2026-09-23',
      status: 'To Do',
      priority: 'High'
    }
  ]);

  private notesSignal = signal<TaskForceNote[]>([
    {
      id: 'n-1',
      author: 'Zeynep Kaya',
      role: 'SAP Consultant',
      timestamp: '28 Ağustos 2026, 14:30',
      content: 'Müşterinin FI-CO modülündeki manuel çalışma saati oldukça yüksek. BTP Process Automation ile 1.200 saat kazanabiliriz.',
      tags: ['BTP', 'Automation']
    },
    {
      id: 'n-2',
      author: 'Caner Demir',
      role: 'Solution Architect',
      timestamp: '29 Ağustos 2026, 09:15',
      content: 'Professional lisans düşürümünde IT direktörü ile mutabık kaldık. Faz-1 kapsamında 15 kullanıcı ile başlanacak.',
      tags: ['License', 'QuickWin']
    }
  ]);

  private questionsSignal = signal<OpenQuestion[]>([
    {
      id: 'q-1',
      question: 'BTP Automation botları için ek S/4HANA API lisansı gerekiyor mu?',
      askedBy: 'Zeynep Kaya',
      answer: 'Hayır, S/4HANA standart OData servisleri BTP paketi dahilinde ücretsiz kullanılabilir.',
      answeredBy: 'Caner Demir',
      status: 'Resolved'
    },
    {
      id: 'q-2',
      question: 'Müşteri Cloud entegrasyonu için güvenlik onayı verdi mi?',
      askedBy: 'Ahmet Yılmaz',
      status: 'Open'
    }
  ]);

  readonly currentStageIndex = this.currentStageIndexSignal.asReadonly();
  readonly actions = this.actionsSignal.asReadonly();
  readonly customerActions = computed(() => {
    const custId = this.customerService.activeCustomerId();
    return this.actionsSignal().filter(a => a.customerId === custId);
  });
  readonly notes = this.notesSignal.asReadonly();
  readonly questions = this.questionsSignal.asReadonly();

  readonly currentStage = computed(() => 
    this.stages[this.currentStageIndexSignal() - 1]
  );

  setStage(index: number): void {
    if (index >= 1 && index <= this.stages.length) {
      this.currentStageIndexSignal.set(index);
    }
  }

  toggleActionStatus(id: string): void {
    this.actionsSignal.update(list => 
      list.map(a => {
        if (a.id === id) {
          const nextStatus = a.status === 'Done' ? 'In Progress' : a.status === 'In Progress' ? 'Done' : 'In Progress';
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  }

  addAction(action: Omit<TaskForceAction, 'id'>): void {
    const newAction: TaskForceAction = {
      ...action,
      id: `act-${Date.now()}`
    };
    this.actionsSignal.update(list => [newAction, ...list]);
  }

  addNote(content: string, author: string, role: string): void {
    const newNote: TaskForceNote = {
      id: `n-${Date.now()}`,
      author,
      role,
      timestamp: new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      content,
      tags: ['TaskForce']
    };
    this.notesSignal.update(list => [newNote, ...list]);
  }
}
