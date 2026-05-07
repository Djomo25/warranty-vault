import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { CATEGORIES } from '../../../core/models/product.model';
import { InvoiceUploadComponent } from '../invoice-upload/invoice-upload.component';
import { OcrService } from '../../../core/services/ocr.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InvoiceUploadComponent],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ocrService = inject(OcrService);

  @ViewChild('ocrInput') ocrInput!: ElementRef<HTMLInputElement>;

  categories = CATEGORIES;
  editId = signal<string | null>(null);
  loading = signal(false);
  error = signal('');
  ocrLoading = signal(false);
  ocrError = signal('');

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    brand: [''],
    model: [''],
    serialNumber: [''],
    category: ['Autre', Validators.required],
    purchaseDate: ['', Validators.required],
    warrantyMonths: [12, [Validators.required, Validators.min(1)]],
    price: [null as number | null],
    store: [''],
    notes: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.productsService.getOne(id).subscribe({
        next: (p) => {
          this.form.patchValue({
            name: p.name,
            brand: p.brand ?? '',
            model: p.model ?? '',
            serialNumber: p.serial_number ?? '',
            category: p.category,
            purchaseDate: p.purchase_date,
            warrantyMonths: p.warranty_months,
            price: p.price ?? null,
            store: p.store ?? '',
            notes: p.notes ?? '',
          });
        },
        error: () => this.router.navigate(['/dashboard']),
      });
    }
  }

  triggerOcrInput() {
    this.ocrInput.nativeElement.click();
  }

  onOcrFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    this.ocrLoading.set(true);
    this.ocrError.set('');

    this.ocrService.scan(file).subscribe({
      next: (result) => {
        this.ocrLoading.set(false);
        const patch: Record<string, any> = {};
        if (result.name) patch['name'] = result.name;
        if (result.purchaseDate) patch['purchaseDate'] = result.purchaseDate;
        if (result.price != null) patch['price'] = result.price;
        if (result.store) patch['store'] = result.store;
        this.form.patchValue(patch);
      },
      error: (err) => {
        this.ocrLoading.set(false);
        this.ocrError.set(err?.error?.message ?? "Erreur lors de l'analyse OCR");
      },
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const value = this.form.value;
    const dto: any = {
      name: value.name!,
      brand: value.brand || undefined,
      model: value.model || undefined,
      serialNumber: value.serialNumber || undefined,
      category: value.category!,
      purchaseDate: value.purchaseDate!,
      warrantyMonths: Number(value.warrantyMonths),
      price: value.price ?? undefined,
      store: value.store || undefined,
      notes: value.notes || undefined,
    };

    const id = this.editId();
    const request = id
      ? this.productsService.update(id, dto)
      : this.productsService.create(dto);

    request.subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Une erreur est survenue');
        this.loading.set(false);
      },
    });
  }

  get isEdit() { return this.editId() !== null; }
}
