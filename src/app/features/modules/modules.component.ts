import { Component, inject, ChangeDetectionStrategy, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  ModullerService, 
  ModuleCard, 
  CardSeverity, 
  CardStatus, 
  VALID_SEVERITIES, 
  VALID_STATUSES, 
  COMMON_CATEGORIES, 
  downloadModulesTemplate
} from '../../core/services/moduller.service';
import { CustomerService } from '../../core/services/customer.service';

export interface CategoryGroup {
  category: string;
  cards: ModuleCard[];
}

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './modules.component.html',
  styleUrl: './modules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModulesComponent implements OnInit, OnDestroy {
  modullerService = inject(ModullerService);
  customerService = inject(CustomerService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  private querySub?: Subscription;

  // Active View Tab: 'summary' (Özet) or 'detail' (Detay)
  activeTab = signal<'summary' | 'detail'>('summary');

  // Summary View Severity Filter: 'TÜMÜ' | 'Kritik' | 'Yüksek' | 'Orta' | 'Düşük'
  summarySeverityFilter = signal<string>('TÜMÜ');

  // Filters State for Detail View
  searchFilter = signal<string>('');
  selectedCategoryFilter = signal<string>('TÜMÜ');
  selectedSeverityFilter = signal<string>('TÜMÜ');
  selectedStatusFilter = signal<string>('TÜMÜ');

  // Modal State
  isModalOpen = false;
  editingCardId: string | null = null;
  formCategory = 'Genel Bulgular';
  formTitle = '';
  formSeverity: CardSeverity = 'Kritik';
  formStatus: CardStatus = 'Geliştirme';
  formBulletsText = '';
  formFooterNote = '';
  formIsFullWidth = false;

  readonly severityOptions = VALID_SEVERITIES;
  readonly statusOptions = VALID_STATUSES;
  readonly commonCategories = COMMON_CATEGORIES;

  // Severity Counts for Dashboard Cards (Özet)
  readonly severityCounts = computed(() => {
    const cards = this.modullerService.cards();
    const counts: Record<string, number> = {
      'Kritik': 0,
      'Yüksek': 0,
      'Orta': 0,
      'Düşük': 0,
      'TÜMÜ': cards.length
    };

    for (const card of cards) {
      if (counts[card.severity] !== undefined) {
        counts[card.severity]++;
      } else {
        counts['Orta']++;
      }
    }

    return counts;
  });

  // Category Breakdown for Summary View
  readonly categoryBreakdown = computed(() => {
    const cards = this.modullerService.cards();
    const activeSev = this.summarySeverityFilter();
    const cats = this.modullerService.existingCategories();

    const list = cats.map(catName => {
      const catCards = cards.filter(c => (c.category || '').trim().toLowerCase() === catName.trim().toLowerCase());
      
      const kritik = catCards.filter(c => c.severity === 'Kritik');
      const yuksek = catCards.filter(c => c.severity === 'Yüksek');
      const orta = catCards.filter(c => c.severity === 'Orta');
      const dusuk = catCards.filter(c => c.severity === 'Düşük');

      let filteredCount = catCards.length;
      let filteredCards = catCards;
      let sentence = `${catName} modülünde toplam ${catCards.length} değerlendirme maddesi mevcut`;

      if (activeSev !== 'TÜMÜ') {
        filteredCards = catCards.filter(c => c.severity === activeSev);
        filteredCount = filteredCards.length;
        if (filteredCount > 0) {
          sentence = `${catName} modülünde ${filteredCount} madde ${activeSev.toLowerCase()}`;
        } else {
          sentence = `${catName} modülünde ${activeSev.toLowerCase()} seviyesinde madde bulunmuyor`;
        }
      }

      return {
        name: catName,
        total: catCards.length,
        kritikCount: kritik.length,
        yuksekCount: yuksek.length,
        ortaCount: orta.length,
        dusukCount: dusuk.length,
        filteredCount,
        filteredCards,
        sentence
      };
    });

    // If a specific severity is selected, only show categories that HAVE that severity (count > 0)
    if (activeSev !== 'TÜMÜ') {
      return list.filter(item => item.filteredCount > 0);
    }

    return list;
  });

  // All categories breakdown for the full matrix table
  readonly allCategoryBreakdown = computed(() => {
    const cards = this.modullerService.cards();
    const cats = this.modullerService.existingCategories();

    return cats.map(catName => {
      const catCards = cards.filter(c => (c.category || '').trim().toLowerCase() === catName.trim().toLowerCase());
      return {
        name: catName,
        total: catCards.length,
        kritikCount: catCards.filter(c => c.severity === 'Kritik').length,
        yuksekCount: catCards.filter(c => c.severity === 'Yüksek').length,
        ortaCount: catCards.filter(c => c.severity === 'Orta').length,
        dusukCount: catCards.filter(c => c.severity === 'Düşük').length
      };
    });
  });

  // Categories currently in data
  readonly dynamicCategories = computed(() => {
    return this.modullerService.existingCategories();
  });

  // Filtered and Grouped Cards
  readonly groupedCategories = computed<CategoryGroup[]>(() => {
    const query = this.searchFilter().trim().toLowerCase();
    const catFilter = this.selectedCategoryFilter();
    const sevFilter = this.selectedSeverityFilter();
    const statFilter = this.selectedStatusFilter();

    let list = this.modullerService.cards();

    // 1. Search Query
    if (query) {
      list = list.filter(c =>
        c.category.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.bullets.some(b => b.toLowerCase().includes(query)) ||
        (c.footerNote && c.footerNote.toLowerCase().includes(query))
      );
    }

    // 2. Category Filter
    if (catFilter !== 'TÜMÜ') {
      list = list.filter(c => c.category.trim().toLowerCase() === catFilter.trim().toLowerCase());
    }

    // 3. Severity Filter
    if (sevFilter !== 'TÜMÜ') {
      list = list.filter(c => c.severity === sevFilter);
    }

    // 4. Status Filter
    if (statFilter !== 'TÜMÜ') {
      list = list.filter(c => c.status === statFilter);
    }

    // 5. Group by Category
    const map = new Map<string, ModuleCard[]>();
    for (const card of list) {
      const cat = (card.category || 'Genel Bulgular').trim();
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(card);
    }

    // 6. Sort categories alphabetically (Turkish locale)
    const sortedCatNames = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, 'tr'));

    // 7. Sort cards within each category alphabetically by Title
    return sortedCatNames.map(category => {
      const cards = map.get(category)!.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
      return { category, cards };
    });
  });

  readonly totalFilteredCards = computed(() => {
    return this.groupedCategories().reduce((sum, g) => sum + g.cards.length, 0);
  });

  ngOnInit(): void {
    this.querySub = this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'detail') {
        this.activeTab.set('detail');
      } else if (tab === 'summary') {
        this.activeTab.set('summary');
      }
      if (params['severity']) {
        this.selectedSeverityFilter.set(params['severity']);
      }
      if (params['category']) {
        this.selectedCategoryFilter.set(params['category']);
      }
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  // Helper count for specific category
  getCategoryCount(catName: string): number {
    return this.modullerService.cards().filter(c => c.category.trim().toLowerCase() === catName.trim().toLowerCase()).length;
  }

  setActiveTab(tab: 'summary' | 'detail'): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  selectSummarySeverity(sev: string): void {
    this.summarySeverityFilter.set(sev);
  }

  goToDetail(category?: string, severity?: string): void {
    if (category) {
      this.selectedCategoryFilter.set(category);
    }
    if (severity && severity !== 'TÜMÜ') {
      this.selectedSeverityFilter.set(severity);
    }
    this.setActiveTab('detail');
  }

  setCategoryFilter(cat: string): void {
    this.selectedCategoryFilter.set(cat);
  }

  setSeverityFilter(sev: string): void {
    this.selectedSeverityFilter.set(sev);
  }

  setStatusFilter(stat: string): void {
    this.selectedStatusFilter.set(stat);
  }

  onSearchChange(val: string): void {
    this.searchFilter.set(val);
  }

  getSeverityClass(severity: CardSeverity | string): string {
    switch (severity) {
      case 'Kritik': return 'sev-kritik';
      case 'Yüksek': return 'sev-yuksek';
      case 'Orta': return 'sev-orta';
      case 'Düşük': return 'sev-dusuk';
      default: return 'sev-orta';
    }
  }

  getStatusClass(status: CardStatus | string): string {
    switch (status) {
      case 'Geliştirme': return 'status-gelistirme';
      case 'Standart': return 'status-standart';
      case 'Fırsat': return 'status-firsat';
      case 'Uygun Değil': return 'status-uygun-degil';
      case 'Kısmen Uygun': return 'status-kismen-uygun';
      case 'Önerilen': return 'status-onerilen';
      default: return 'status-standart';
    }
  }

  openAddModal(prefilledCategory?: string): void {
    this.editingCardId = null;
    if (prefilledCategory) {
      this.formCategory = prefilledCategory;
    } else if (this.selectedCategoryFilter() !== 'TÜMÜ') {
      this.formCategory = this.selectedCategoryFilter();
    } else {
      this.formCategory = this.dynamicCategories()[0] || 'Genel Bulgular';
    }
    this.formTitle = '';
    this.formSeverity = 'Kritik';
    this.formStatus = 'Geliştirme';
    this.formBulletsText = '';
    this.formFooterNote = '';
    this.formIsFullWidth = false;
    this.isModalOpen = true;
  }

  openEditModal(card: ModuleCard): void {
    this.editingCardId = card.id;
    this.formCategory = card.category;
    this.formTitle = card.title;
    this.formSeverity = card.severity;
    this.formStatus = card.status;
    this.formBulletsText = card.bullets.join('\n');
    this.formFooterNote = card.footerNote || '';
    this.formIsFullWidth = !!card.isFullWidth;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveCard(): void {
    if (!this.formTitle.trim()) return;

    const cat = this.formCategory.trim() || 'Genel Bulgular';
    const bullets = this.formBulletsText
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    if (this.editingCardId) {
      const updated: ModuleCard = {
        id: this.editingCardId,
        category: cat,
        title: this.formTitle.trim(),
        severity: this.formSeverity,
        status: this.formStatus,
        bullets,
        footerNote: this.formFooterNote.trim() || undefined,
        isFullWidth: this.formIsFullWidth
      };
      this.modullerService.updateCard(updated);
    } else {
      const newCard: ModuleCard = {
        id: 'card-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        category: cat,
        title: this.formTitle.trim(),
        severity: this.formSeverity,
        status: this.formStatus,
        bullets,
        footerNote: this.formFooterNote.trim() || undefined,
        isFullWidth: this.formIsFullWidth
      };
      this.modullerService.addCard(newCard);
    }

    this.closeModal();
  }

  deleteCard(cardId: string): void {
    if (confirm('Bu değerlendirme kartını silmek istediğinize emin misiniz?')) {
      this.modullerService.deleteCard(cardId);
    }
  }

  downloadTemplate(): void {
    downloadModulesTemplate();
  }
}
