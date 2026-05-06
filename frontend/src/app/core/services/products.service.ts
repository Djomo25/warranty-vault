import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product, ProductForm } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/products`;

  getAll() {
    return this.http.get<Product[]>(this.base);
  }

  getOne(id: string) {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  create(dto: ProductForm) {
    return this.http.post<Product>(this.base, dto);
  }

  update(id: string, dto: Partial<ProductForm>) {
    return this.http.put<Product>(`${this.base}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/${id}`);
  }
}
