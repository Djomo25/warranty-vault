import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>WarrantyVault</h1>
        <div class="user-info">
          <span>{{ auth.user()?.fullName }}</span>
          <button (click)="auth.logout()">Déconnexion</button>
        </div>
      </header>
      <main>
        <h2>Mes garanties</h2>
        <p>Tableau de bord — à venir</p>
      </main>
    </div>
  `,
})
export class DashboardComponent {
  constructor(readonly auth: AuthService) {}
}
