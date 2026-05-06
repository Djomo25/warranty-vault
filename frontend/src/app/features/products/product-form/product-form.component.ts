import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { CATEGORIES } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  categories = CATEGORIES;
  editId = signal<string | null>(null);
  loading = signal(false);
  error = signal('');

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
