import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProductsService } from '../../core/services/products.service';
import { Product, getWarrantyStatus, getDaysRemaining, WarrantyStatus } from '../../core/models/product.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private productsService = inject(ProductsService);

  products = signal<Product[]>([]);
  loading = signal(true);
  error = signal('');
  deletingId = signal<string | null>(null);

  stats = computed(() => {
    const all = this.products();
    return {
      total: all.length,
      active: all.filter(p => getWarrantyStatus(p.warranty_end) === 'active').length,
      expiring: all.filter(p => getWarrantyStatus(p.warranty_end) === 'expiring').length,
      expired: all.filter(p => getWarrantyStatus(p.warranty_end) === 'expired').length,
    };
  });

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.productsService.getAll().subscribe({
      next: (data) => { this.products.set(data); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger les produits'); this.loading.set(false); },
    });
  }

  delete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return;
    this.deletingId.set(id);
    this.productsService.delete(id).subscribe({
      next: () => {
        this.products.update(list => list.filter(p => p.id !== id));
        this.deletingId.set(null);
      },
      error: () => this.deletingId.set(null),
    });
  }

  statusLabel(warrantyEnd: string): string {
    const days = getDaysRemaining(warrantyEnd);
    if (days < 0) return 'Expirée';
    if (days === 0) return 'Expire aujourd\'hui';
    if (days <= 30) return `Expire dans ${days}j`;
    return `${days} jours restants`;
  }

  statusClass(warrantyEnd: string): WarrantyStatus {
    return getWarrantyStatus(warrantyEnd);
  }
}
