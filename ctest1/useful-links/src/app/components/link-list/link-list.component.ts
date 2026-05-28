import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinkItemComponent } from '../link-item/link-item.component';
import { LinkFormComponent } from '../link-form/link-form.component';
import { LinkService } from '../../services/link.service';
import { Link } from '../../link';

@Component({
  selector: 'app-link-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LinkItemComponent, LinkFormComponent],
  template: `
    <main class="layout">
      <section class="hero">
        <h1 class="hero-title">实用链接</h1>
        <p class="hero-desc">收集和分享对开发者有用的优质资源</p>
        <div class="search-bar">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            (input)="onSearch()"
            placeholder="搜索链接、描述或标签..."
            class="search-input"
          />
          <button class="btn-add" (click)="showForm = true">+ 添加链接</button>
        </div>
      </section>

      <section class="filters">
        <button
          *ngFor="let cat of categories"
          class="filter-btn"
          [class.active]="selectedCategory === cat"
          (click)="filterByCategory(cat)"
        >{{ cat }}</button>
      </section>

      <section class="results" *ngIf="filteredLinks.length > 0; else empty">
        <app-link-item
          *ngFor="let link of filteredLinks"
          [link]="link"
          (delete)="onDelete($event)"
          (view)="onView($event)"
        ></app-link-item>
      </section>

      <ng-template #empty>
        <div class="empty-state">
          <p>没有找到匹配的链接</p>
          <button class="btn-add" (click)="showForm = true">添加新链接</button>
        </div>
      </ng-template>
    </main>

    <app-link-form *ngIf="showForm" (close)="showForm = false" (submit)="onAdd($event)"></app-link-form>
  `,
  styles: [`
    .layout {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px 60px;
    }
    .hero {
      text-align: center;
      padding: 60px 0 32px;
    }
    .hero-title {
      font-size: 36px;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 8px;
    }
    .hero-desc {
      font-size: 16px;
      color: #64748b;
      margin: 0 0 28px;
    }
    .search-bar {
      display: flex;
      gap: 12px;
      max-width: 600px;
      margin: 0 auto;
    }
    .search-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      background: #f8fafc;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .search-input:focus {
      outline: none;
      border-color: #6366f1;
      background: #fff;
    }
    .btn-add {
      padding: 12px 24px;
      background: #6366f1;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
    }
    .btn-add:hover {
      background: #4f46e5;
    }
    .filters {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }
    .filter-btn {
      padding: 6px 18px;
      border: 1px solid #e2e8f0;
      border-radius: 100px;
      background: #fff;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover {
      border-color: #6366f1;
      color: #6366f1;
    }
    .filter-btn.active {
      background: #6366f1;
      color: #fff;
      border-color: #6366f1;
    }
    .results {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }
    .empty-state {
      text-align: center;
      padding: 60px 0;
      color: #94a3b8;
    }
    .empty-state p {
      font-size: 16px;
      margin-bottom: 16px;
    }
  `]
})
export class LinkListComponent implements OnInit {
  links: Link[] = [];
  filteredLinks: Link[] = [];
  categories: string[] = [];
  searchTerm = '';
  selectedCategory = '全部';
  showForm = false;

  constructor(private linkService: LinkService) {}

  ngOnInit() {
    this.links = this.linkService.getAll();
    this.categories = this.linkService.getCategories();
    this.applyFilter();
  }

  onSearch() {
    this.applyFilter();
  }

  filterByCategory(cat: string) {
    this.selectedCategory = cat;
    this.applyFilter();
  }

  private applyFilter() {
    const cat = this.selectedCategory === '全部' ? undefined : this.selectedCategory;
    this.filteredLinks = this.linkService.search(this.searchTerm, cat);
  }

  onDelete(id: number) {
    if (confirm('确定要删除此链接吗？')) {
      this.linkService.delete(id);
      this.links = this.linkService.getAll();
      this.categories = this.linkService.getCategories();
      this.applyFilter();
    }
  }

  onView(link: Link) {
    window.open(link.url, '_blank');
  }

  onAdd(data: Omit<Link, 'id' | 'createdAt'>) {
    this.linkService.add(data);
    this.links = this.linkService.getAll();
    this.categories = this.linkService.getCategories();
    this.applyFilter();
    this.showForm = false;
  }
}
