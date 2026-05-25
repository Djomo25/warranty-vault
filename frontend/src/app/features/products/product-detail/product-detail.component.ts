import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { Product, getDaysRemaining, getWarrantyStatus, WarrantyStatus } from '../../../core/models/product.model';
import { InvoiceUploadComponent } from '../invoice-upload/invoice-upload.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, InvoiceUploadComponent],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);

  product = signal<Product | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productsService.getOne(id).subscribe({
      next: (p) => { this.product.set(p); this.loading.set(false); },
      error: () => this.router.navigate(['/dashboard']),
    });
  }

  get statusClass(): WarrantyStatus {
    const p = this.product();
    return p ? getWarrantyStatus(p.warranty_end) : 'expired';
  }

  get statusLabel(): string {
    const p = this.product();
    if (!p) return '';
    const days = getDaysRemaining(p.warranty_end);
    if (days < 0) return 'Garantie expirée';
    if (days === 0) return "Expire aujourd'hui";
    if (days <= 30) return `Expire dans ${days} jour${days > 1 ? 's' : ''}`;
    return `${days} jours de garantie restants`;
  }
}
