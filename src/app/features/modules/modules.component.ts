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

  // Summary Breakdown: Groups by Title (Başlık) fields from imported Excel
  readonly categoryBreakdown = computed(() => {
    const cards = this.modullerService.cards();
    const activeSev = this.summarySeverityFilter();
    
    // Distinct titles (Başlık alanları)
    const titlesSet = new Set<string>();
    for (const c of cards) {
      const t = (c.title || '').trim();
      if (t) titlesSet.add(t);
    }
    const titles = Array.from(titlesSet).sort((a, b) => a.localeCompare(b, 'tr'));

    const list = titles.map(titleName => {
      const titleCards = cards.filter(c => (c.title || '').trim().toLowerCase() === titleName.trim().toLowerCase());
      
      const kritik = titleCards.filter(c => c.severity === 'Kritik');
      const yuksek = titleCards.filter(c => c.severity === 'Yüksek');
      const orta = titleCards.filter(c => c.severity === 'Orta');
      const dusuk = titleCards.filter(c => c.severity === 'Düşük');

      let filteredCount = titleCards.length;
      let filteredCards = titleCards;
      let sentence = `${titleName} başlığında toplam ${titleCards.length} değerlendirme mevcut`;

      if (activeSev !== 'TÜMÜ') {
        filteredCards = titleCards.filter(c => c.severity === activeSev);
        filteredCount = filteredCards.length;
        if (filteredCount > 0) {
          sentence = `${titleName} başlığında ${filteredCount} madde ${activeSev.toLowerCase()}`;
        } else {
          sentence = `${titleName} başlığında ${activeSev.toLowerCase()} seviyesinde madde bulunmuyor`;
        }
      }

      return {
        name: titleName,
        total: titleCards.length,
        kritikCount: kritik.length,
        yuksekCount: yuksek.length,
        ortaCount: orta.length,
        dusukCount: dusuk.length,
        filteredCount,
        filteredCards,
        sentence
      };
    });

    // If a specific severity is selected, only show titles that HAVE that severity (count > 0)
    if (activeSev !== 'TÜMÜ') {
      return list.filter(item => item.filteredCount > 0);
    }

    return list;
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

  readonly hasActiveFilters = computed(() => {
    return (
      this.searchFilter().trim().length > 0 ||
      this.selectedCategoryFilter() !== 'TÜMÜ' ||
      this.selectedSeverityFilter() !== 'TÜMÜ' ||
      this.selectedStatusFilter() !== 'TÜMÜ'
    );
  });

  resetDetailFiltersState(): void {
    this.searchFilter.set('');
    this.selectedCategoryFilter.set('TÜMÜ');
    this.selectedSeverityFilter.set('TÜMÜ');
    this.selectedStatusFilter.set('TÜMÜ');
  }

  resetDetailFilters(): void {
    this.resetDetailFiltersState();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'detail' }
    });
  }

  clearSearch(): void {
    this.searchFilter.set('');
    const queryParams: any = { ...this.route.snapshot.queryParams };
    delete queryParams.search;
    delete queryParams.r;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams
    });
  }

  ngOnInit(): void {
    this.querySub = this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'detail') {
        this.activeTab.set('detail');
        // If navigated to detail with no active filter params, reset filters to show all
        if (!params['search'] && !params['category'] && !params['severity'] && !params['status']) {
          this.resetDetailFiltersState();
        }
      } else {
        this.activeTab.set('summary');
      }

      if (params['severity']) {
        this.selectedSeverityFilter.set(params['severity']);
      }
      if (params['category']) {
        this.selectedCategoryFilter.set(params['category']);
      }
      if (params['search']) {
        this.searchFilter.set(params['search']);
      }
      if (params['status']) {
        this.selectedStatusFilter.set(params['status']);
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
    if (tab === 'detail') {
      this.resetDetailFiltersState();
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab }
    });
  }

  selectSummarySeverity(sev: string): void {
    this.summarySeverityFilter.set(sev);
  }

  goToDetail(titleOrCat?: string, severity?: string): void {
    const queryParams: any = { tab: 'detail' };

    if (titleOrCat) {
      const isCat = this.dynamicCategories().some(c => c.toLowerCase() === titleOrCat.toLowerCase());
      if (isCat) {
        this.selectedCategoryFilter.set(titleOrCat);
        this.searchFilter.set('');
        queryParams['category'] = titleOrCat;
      } else {
        this.selectedCategoryFilter.set('TÜMÜ');
        this.searchFilter.set(titleOrCat);
        queryParams['search'] = titleOrCat;
      }
    } else {
      this.selectedCategoryFilter.set('TÜMÜ');
      this.searchFilter.set('');
    }

    if (severity && severity !== 'TÜMÜ') {
      this.selectedSeverityFilter.set(severity);
      queryParams['severity'] = severity;
    } else {
      this.selectedSeverityFilter.set('TÜMÜ');
    }

    this.selectedStatusFilter.set('TÜMÜ');
    this.activeTab.set('detail');

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams
    });
  }

  setCategoryFilter(cat: string): void {
    if (cat === 'TÜMÜ') {
      this.resetDetailFilters();
    } else {
      this.selectedCategoryFilter.set(cat);
      this.searchFilter.set(''); // Arama metnini temizle ki kategorideki tüm kartlar görünsün
      const queryParams: any = { tab: 'detail', category: cat };
      if (this.selectedSeverityFilter() !== 'TÜMÜ') queryParams.severity = this.selectedSeverityFilter();
      if (this.selectedStatusFilter() !== 'TÜMÜ') queryParams.status = this.selectedStatusFilter();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams
      });
    }
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
