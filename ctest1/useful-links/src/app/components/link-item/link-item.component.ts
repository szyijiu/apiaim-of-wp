import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Link } from '../../link';

@Component({
  selector: 'app-link-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="link-card" (click)="view.emit(link)">
      <div class="card-header">
        <span class="card-category">{{ link.category }}</span>
        <button class="btn-delete" (click)="delete.emit(link.id); $event.stopPropagation()" title="删除">✕</button>
      </div>
      <h3 class="card-title">{{ link.title }}</h3>
      <p class="card-desc">{{ link.description }}</p>
      <div class="card-tags">
        <span class="tag" *ngFor="let tag of link.tags">{{ tag }}</span>
      </div>
      <div class="card-footer">
        <a [href]="link.url" target="_blank" class="card-link" (click)="$event.stopPropagation()">
          访问链接 →
        </a>
        <span class="card-date">{{ link.createdAt | date:'yyyy-MM-dd' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .link-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid #e8e8ef;
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100%;
    }
    .link-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.08);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-category {
      font-size: 12px;
      font-weight: 600;
      color: #6366f1;
      background: #eef2ff;
      padding: 2px 10px;
      border-radius: 100px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn-delete {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 14px;
      padding: 4px 6px;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .btn-delete:hover {
      color: #ef4444;
      background: #fef2f2;
    }
    .card-title {
      font-size: 17px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
      line-height: 1.4;
    }
    .card-desc {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
      flex: 1;
    }
    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      font-size: 12px;
      color: #6366f1;
      background: #eef2ff;
      padding: 2px 10px;
      border-radius: 100px;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid #f1f5f9;
    }
    .card-link {
      font-size: 13px;
      font-weight: 600;
      color: #6366f1;
      text-decoration: none;
      transition: color 0.2s;
    }
    .card-link:hover {
      color: #4f46e5;
      text-decoration: underline;
    }
    .card-date {
      font-size: 12px;
      color: #94a3b8;
    }
  `]
})
export class LinkItemComponent {
  @Input({ required: true }) link!: Link;
  @Output() view = new EventEmitter<Link>();
  @Output() delete = new EventEmitter<number>();
}
