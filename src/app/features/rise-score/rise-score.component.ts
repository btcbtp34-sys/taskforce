import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RiseScoreService, RiseCriterion, RiseCriterionOption } from '../../core/services/rise-score.service';
import { CustomerService } from '../../core/services/customer.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-rise-score',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './rise-score.component.html',
  styleUrl: './rise-score.component.scss'
})
export class RiseScoreComponent {
  riseService = inject(RiseScoreService);
  customerService = inject(CustomerService);

  // Accordion state for option point editing per criterion (collapsed by default)
  expandedEditors = signal<Record<string, boolean>>({});

  // Filter or search query
  searchQuery = signal<string>('');

  // Notification toast
  toastMessage = signal<string | null>(null);

  get criteria(): RiseCriterion[] {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.riseService.criteria();
    if (!q) return list;
    return list.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.category.toLowerCase().includes(q) ||
      c.options.some(o => o.label.toLowerCase().includes(q))
    );
  }

  isEditorOpen(criterionId: string): boolean {
    return !!this.expandedEditors()[criterionId];
  }

  togglePointsEditor(criterionId: string): void {
    this.expandedEditors.update(map => ({
      ...map,
      [criterionId]: !map[criterionId]
    }));
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }

  onDropdownSelect(c: RiseCriterion, newLabel: string): void {
    if (!newLabel) return;
    c.selectedOptionLabel = newLabel;
    this.riseService.selectDropdownOption(c.id, newLabel);
  }

  onRadioChange(c: RiseCriterion, val: boolean): void {
    c.radioValue = val;
    this.riseService.setRadioValue(c.id, val);
  }

  onOptionPointChange(c: RiseCriterion, opt: RiseCriterionOption, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      const val = parseFloat(target.value) || 0;
      opt.points = val;
      this.riseService.updateOptionPoints(c.id, opt.label, val);
      this.showToast(`"${c.title} - ${opt.label}" puanı ${val} olarak güncellendi.`);
    }
  }

  trackByCriterion(index: number, c: RiseCriterion): string {
    return c.id;
  }

  trackByOption(index: number, opt: RiseCriterionOption): string {
    return opt.label;
  }

  onRadioPointChange(c: RiseCriterion, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      const val = parseFloat(target.value) || 0;
      this.riseService.updateRadioPoints(c.id, val);
      this.showToast(`"${c.title}" puanı ${val} olarak güncellendi.`);
    }
  }

  getSelectedPoint(c: RiseCriterion): number {
    return this.riseService.getCriterionScore(c);
  }

  resetAll(): void {
    if (confirm('Tüm kriter puanlarını ve seçimlerini varsayılan Excel şablonuna sıfırlamak istediğinize emin misiniz?')) {
      this.riseService.resetToDefaults();
      this.expandedEditors.set({});
      this.showToast('Tüm puanlar ve seçimler varsayılan Excel değerlerine sıfırlandı.');
    }
  }

  applyHighScore(): void {
    this.riseService.applyHighScorePreset();
    this.showToast('Yüksek skor senaryosu uygulandı.');
  }

  applyLowScore(): void {
    this.riseService.applyLowScorePreset();
    this.showToast('Düşük skor senaryosu uygulandı.');
  }

  printPage(): void {
    window.print();
  }
}
