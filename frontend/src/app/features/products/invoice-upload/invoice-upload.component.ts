import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoicesService } from '../../../core/services/invoices.service';
import { Invoice, isImage, formatFileSize } from '../../../core/models/invoice.model';

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 10;

@Component({
  selector: 'app-invoice-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-upload.component.html',
})
export class InvoiceUploadComponent implements OnInit {
  @Input({ required: true }) productId!: string;

  private invoicesService = inject(InvoicesService);

  invoices = signal<Invoice[]>([]);
  uploading = signal(false);
  uploadError = signal('');
  deletingId = signal<string | null>(null);
  dragging = signal(false);

  isImage = isImage;
  formatSize = formatFileSize;

  ngOnInit() {
    this.invoicesService.getByProduct(this.productId).subscribe({
      next: (list) => this.invoices.set(list),
      error: () => this.uploadError.set('Impossible de charger les factures.'),
    });
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
    (event.target as HTMLInputElement).value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave() {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File) {
    this.uploadError.set('');

    if (!ACCEPTED.includes(file.type)) {
      this.uploadError.set('Format non supporté. Utilise PDF, JPEG, PNG ou WEBP.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      this.uploadError.set(`Fichier trop volumineux (max ${MAX_MB} Mo).`);
      return;
    }

    this.uploading.set(true);
    this.invoicesService.upload(this.productId, file).subscribe({
      next: (inv) => {
        this.invoices.update((list) => [inv, ...list]);
        this.uploading.set(false);
      },
      error: (err) => {
        this.uploadError.set(err?.error?.message ?? 'Erreur lors de l\'envoi.');
        this.uploading.set(false);
      },
    });
  }

  delete(invoice: Invoice) {
    if (!confirm(`Supprimer "${invoice.file_name}" ?`)) return;
    this.deletingId.set(invoice.id);
    this.invoicesService.delete(invoice.id).subscribe({
      next: () => {
        this.invoices.update((list) => list.filter((i) => i.id !== invoice.id));
        this.deletingId.set(null);
      },
      error: () => this.deletingId.set(null),
    });
  }
}
