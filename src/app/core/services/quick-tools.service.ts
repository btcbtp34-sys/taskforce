import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QuickToolsService {
  readonly isNotesOpen = signal<boolean>(false);
  readonly isPdfExportOpen = signal<boolean>(false);
  readonly isAddNoteOpen = signal<boolean>(false);

  openNotes(): void {
    this.isNotesOpen.set(true);
  }

  closeNotes(): void {
    this.isNotesOpen.set(false);
  }

  toggleNotes(): void {
    this.isNotesOpen.update(v => !v);
  }

  openPdfExport(): void {
    this.isPdfExportOpen.set(true);
  }

  closePdfExport(): void {
    this.isPdfExportOpen.set(false);
  }

  togglePdfExport(): void {
    this.isPdfExportOpen.update(v => !v);
  }

  openAddNote(): void {
    this.isAddNoteOpen.set(true);
  }

  closeAddNote(): void {
    this.isAddNoteOpen.set(false);
  }

  toggleAddNote(): void {
    this.isAddNoteOpen.update(v => !v);
  }
}
