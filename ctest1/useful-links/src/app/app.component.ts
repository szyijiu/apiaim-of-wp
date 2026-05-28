import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="header">
      <div class="header-inner">
        <a routerLink="/" class="logo">◆ Useful<span class="logo-accent">Links</span></a>
        <nav class="nav">
          <a href="https://github.com" target="_blank" class="nav-link">GitHub</a>
          <a href="https://angular.dev" target="_blank" class="nav-link">Angular</a>
        </nav>
      </div>
    </header>
    <router-outlet />
  `,
  styles: [`
    .header {
      background: #fff;
      border-bottom: 1px solid #e8e8ef;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
      text-decoration: none;
    }
    .logo-accent {
      color: #6366f1;
    }
    .nav {
      display: flex;
      gap: 20px;
    }
    .nav-link {
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      text-decoration: none;
      transition: color 0.2s;
    }
    .nav-link:hover {
      color: #6366f1;
    }
  `]
})
export class AppComponent {}
