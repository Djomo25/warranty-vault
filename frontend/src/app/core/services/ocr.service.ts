import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface OcrResult {
  rawText: string;
  name: string | null;
  purchaseDate: string | null;
  price: number | null;
  store: string | null;
}

@Injectable({ providedIn: 'root' })
export class OcrService {
  private http = inject(HttpClient);

  scan(file: File): Observable<OcrResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<OcrResult>(`${environment.apiUrl}/ocr`, formData);
  }
}
