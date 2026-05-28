import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Link } from '../../link';

@Component({
  selector: 'app-link-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>添加新链接</h2>
          <button class="btn-close" (click)="close.emit()">✕</button>
        </div>
        <form (ngSubmit)="onSubmit()" class="link-form">
          <div class="form-group">
            <label for="title">标题</label>
            <input id="title" name="title" [(ngModel)]="formData.title" required placeholder="链接标题" />
          </div>
          <div class="form-group">
            <label for="url">URL</label>
            <input id="url" name="url" [(ngModel)]="formData.url" required placeholder="https://" type="url" />
          </div>
          <div class="form-group">
            <label for="desc">描述</label>
            <textarea id="desc" name="description" [(ngModel)]="formData.description" rows="3" placeholder="简短描述该链接"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="category">分类</label>
              <input id="category" name="category" [(ngModel)]="formData.category" required placeholder="如: 前端开发" />
            </div>
            <div class="form-group">
              <label for="tags">标签 (逗号分隔)</label>
              <input id="tags" name="tags" [(ngModel)]="tagsInput" placeholder="框架, TypeScript" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-cancel" (click)="close.emit()">取消</button>
            <button type="submit" class="btn btn-submit">添加链接</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal-content {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      padding: 28px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.15);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .modal-header h2 {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .btn-close:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
    .link-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }
    .form-group label {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }
    .form-group input,
    .form-group textarea {
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      color: #1e293b;
      background: #f8fafc;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #6366f1;
      background: #fff;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 8px;
    }
    .btn {
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-cancel:hover {
      background: #e2e8f0;
    }
    .btn-submit {
      background: #6366f1;
      color: #fff;
    }
    .btn-submit:hover {
      background: #4f46e5;
    }
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
      }
    }
  `]
})
export class LinkFormComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<Omit<Link, 'id' | 'createdAt'>>();

  formData = {
    title: '',
    url: '',
    description: '',
    category: '',
    tags: [] as string[],
  };

  get tagsInput(): string {
    return this.formData.tags.join(', ');
  }

  set tagsInput(value: string) {
    this.formData.tags = value.split(',').map(t => t.trim()).filter(Boolean);
  }

  onSubmit() {
    if (!this.formData.title || !this.formData.url) return;
    this.submit.emit({ ...this.formData });
    this.formData = { title: '', url: '', description: '', category: '', tags: [] };
  }
}
