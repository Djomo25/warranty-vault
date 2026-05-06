import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../models/user.model';

const TOKEN_KEY = 'wv_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  register(email: string, password: string, fullName: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, { email, password, fullName })
      .pipe(tap((res) => this.handleAuth(res)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.handleAuth(res)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private handleAuth(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    this._user.set(res.user);
    this.router.navigate(['/dashboard']);
  }

  private loadFromStorage() {
    const token = this.getToken();
    if (!token) return;
    this.http.get<User>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (user) => this._user.set(user),
      error: () => this.logout(),
    });
  }
}
