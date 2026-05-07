import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Invoice } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getByProduct(productId: string) {
    return this.http.get<Invoice[]>(`${this.base}/products/${productId}/invoices`);
  }

  upload(productId: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Invoice>(`${this.base}/products/${productId}/invoices`, form);
  }

  delete(invoiceId: string) {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/invoices/${invoiceId}`);
  }
}
