import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModullerService, ModuleItem, ModuleSlide, ModuleCard, CardSeverity, CardStatus } from '../../core/services/moduller.service';
import { CustomerService } from '../../core/services/customer.service';

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modules.component.html',
  styleUrl: './modules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModulesComponent implements OnInit {
  modullerService = inject(ModullerService);
  customerService = inject(CustomerService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  selectedModuleKey = 'genel-bulgular';
  activeSlideIndex = 0;
  searchFilter = '';
  selectedSeverityFilter = 'TÜMÜ';
  selectedStatusFilter = 'TÜMÜ';

  moduleList: ModuleItem[] = [];
  currentModule: ModuleItem | undefined;
  currentSlide: ModuleSlide | undefined;
  availableSeverities: { severity: CardSeverity; count: number }[] = [];
  availableStatuses: { status: CardStatus; count: number }[] = [];
  filteredCards: ModuleCard[] = [];

  // Modal State
  isModalOpen = false;
  editingCardId: string | null = null;
  formTitle = '';
  formSeverity: CardSeverity = 'Kritik';
  formStatus: CardStatus = 'Geliştirme';
  formBulletsText = '';
  formFooterNote = '';
  formIsFullWidth = false;

  readonly severityOptions: CardSeverity[] = [
    'Düşük',
    'Orta',
    'Yüksek',
    'Kritik'
  ];

  readonly statusOptions: CardStatus[] = [
    'Geliştirme',
    'Standart',
    'Fırsat',
    'Uygun Değil',
    'Kısmen Uygun',
    'Önerilen'
  ];

  constructor() {
    // Re-render whenever modules change or customer switches
    effect(() => {
      this.moduleList = this.modullerService.modules();
      this.updateView();
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {
    this.moduleList = this.modullerService.modules();

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab) {
        this.modullerService.selectModule(tab);
      }
      this.syncActiveModule();
    });

    this.syncActiveModule();
  }

  syncActiveModule() {
    this.selectedModuleKey = this.modullerService.activeModuleKey();
    this.activeSlideIndex = 0;
    this.selectedSeverityFilter = 'TÜMÜ';
    this.selectedStatusFilter = 'TÜMÜ';
    this.searchFilter = '';
    this.updateView();
    this.cdr.markForCheck();
  }

  updateView() {
    this.currentModule = this.modullerService.getModuleByKey(this.selectedModuleKey);
    if (this.currentModule && this.currentModule.slides && this.currentModule.slides.length > 0) {
      const idx = Math.min(this.activeSlideIndex, this.currentModule.slides.length - 1);
      this.currentSlide = this.currentModule.slides[idx];
    } else {
      this.currentSlide = undefined;
    }

    if (!this.currentSlide) {
      this.availableSeverities = [];
      this.availableStatuses = [];
      this.filteredCards = [];
      return;
    }

    // Severity counts
    const sevCounts = new Map<CardSeverity, number>();
    const statCounts = new Map<CardStatus, number>();
    for (const card of this.currentSlide.cards) {
      sevCounts.set(card.severity, (sevCounts.get(card.severity) || 0) + 1);
      statCounts.set(card.status, (statCounts.get(card.status) || 0) + 1);
    }
    this.availableSeverities = Array.from(sevCounts.entries()).map(([severity, count]) => ({ severity, count }));
    this.availableStatuses = Array.from(statCounts.entries()).map(([status, count]) => ({ status, count }));

    // Filtered cards
    let list = this.currentSlide.cards;
    const query = this.searchFilter.trim().toLowerCase();
    if (query) {
      list = list.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.bullets.some(b => b.toLowerCase().includes(query)) ||
        (c.footerNote && c.footerNote.toLowerCase().includes(query))
      );
    }
    if (this.selectedSeverityFilter !== 'TÜMÜ') {
      list = list.filter(c => c.severity === this.selectedSeverityFilter);
    }
    if (this.selectedStatusFilter !== 'TÜMÜ') {
      list = list.filter(c => c.status === this.selectedStatusFilter);
    }
    this.filteredCards = list;
  }

  selectModule(key: string) {
    if (this.selectedModuleKey === key) return;
    this.modullerService.selectModule(key);
    this.selectedModuleKey = key;
    this.activeSlideIndex = 0;
    this.searchFilter = '';
    this.selectedSeverityFilter = 'TÜMÜ';
    this.selectedStatusFilter = 'TÜMÜ';
    this.updateView();
    this.cdr.markForCheck();
  }

  setSlide(index: number) {
    if (this.activeSlideIndex === index) return;
    this.activeSlideIndex = index;
    this.selectedSeverityFilter = 'TÜMÜ';
    this.selectedStatusFilter = 'TÜMÜ';
    this.updateView();
    this.cdr.markForCheck();
  }

  onFilterChange() {
    this.updateView();
    this.cdr.markForCheck();
  }

  setSeverityFilter(sev: string) {
    this.selectedSeverityFilter = sev;
    this.updateView();
    this.cdr.markForCheck();
  }

  setStatusFilter(stat: string) {
    this.selectedStatusFilter = stat;
    this.updateView();
    this.cdr.markForCheck();
  }

  trackByModuleKey(index: number, mod: ModuleItem): string {
    return mod.key;
  }

  trackBySlideId(index: number, slide: ModuleSlide): string {
    return slide.id;
  }

  trackByCardId(index: number, card: ModuleCard): string {
    return card.id;
  }

  getSeverityClass(severity: CardSeverity): string {
    switch (severity) {
      case 'Kritik':
        return 'sev-kritik';
      case 'Yüksek':
        return 'sev-yuksek';
      case 'Orta':
        return 'sev-orta';
      case 'Düşük':
        return 'sev-dusuk';
      default:
        return 'sev-orta';
    }
  }

  getStatusClass(status: CardStatus): string {
    switch (status) {
      case 'Geliştirme':
        return 'status-gelistirme';
      case 'Standart':
        return 'status-standart';
      case 'Fırsat':
        return 'status-firsat';
      case 'Uygun Değil':
        return 'status-uygun-degil';
      case 'Kısmen Uygun':
        return 'status-kismen-uygun';
      case 'Önerilen':
        return 'status-onerilen';
      default:
        return 'status-standart';
    }
  }

  openAddModal() {
    this.editingCardId = null;
    this.formTitle = '';
    this.formSeverity = 'Kritik';
    this.formStatus = 'Geliştirme';
    this.formBulletsText = '';
    this.formFooterNote = '';
    this.formIsFullWidth = false;
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  openEditModal(card: ModuleCard) {
    this.editingCardId = card.id;
    this.formTitle = card.title;
    this.formSeverity = card.severity;
    this.formStatus = card.status;
    this.formBulletsText = card.bullets.join('\n');
    this.formFooterNote = card.footerNote || '';
    this.formIsFullWidth = !!card.isFullWidth;
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal() {
    this.isModalOpen = false;
    this.cdr.markForCheck();
  }

  saveCard() {
    if (!this.formTitle.trim()) return;
    if (!this.currentSlide) return;

    const bullets = this.formBulletsText
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    if (this.editingCardId) {
      const updatedCard: ModuleCard = {
        id: this.editingCardId,
        title: this.formTitle.trim(),
        severity: this.formSeverity,
        status: this.formStatus,
        bullets: bullets,
        footerNote: this.formFooterNote.trim() || undefined,
        isFullWidth: this.formIsFullWidth
      };
      this.modullerService.updateCard(this.selectedModuleKey, this.currentSlide.id, updatedCard);
    } else {
      const newCard: ModuleCard = {
        id: 'card-' + Date.now(),
        title: this.formTitle.trim(),
        severity: this.formSeverity,
        status: this.formStatus,
        bullets: bullets,
        footerNote: this.formFooterNote.trim() || undefined,
        isFullWidth: this.formIsFullWidth
      };
      this.modullerService.addCard(this.selectedModuleKey, this.currentSlide.id, newCard);
    }

    this.updateView();
    this.closeModal();
  }

  deleteCard(cardId: string) {
    if (!this.currentSlide) return;
    const confirmDelete = window.confirm('Bu değerlendirme kartını silmek istediğinize emin misiniz?');
    if (!confirmDelete) return;

    this.modullerService.deleteCard(this.selectedModuleKey, this.currentSlide.id, cardId);
    this.updateView();
    this.cdr.markForCheck();
  }
}
