import { Injectable } from '@angular/core';
import { Link } from '../link';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private links: Link[] = [
    {
      id: 1,
      title: 'Angular 官方文档',
      url: 'https://angular.dev',
      description: 'Angular 是一个基于 TypeScript 的现代 Web 应用开发框架，提供完整的工具链和最佳实践。',
      tags: ['框架', '前端', 'TypeScript'],
      category: '前端开发',
      createdAt: new Date('2026-01-15'),
    },
    {
      id: 2,
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org/zh-CN/',
      description: 'Mozilla 的 Web 技术文档，涵盖 HTML、CSS、JavaScript 等全面的 Web 开发参考资料。',
      tags: ['文档', 'HTML', 'CSS', 'JavaScript'],
      category: '前端开发',
      createdAt: new Date('2026-01-20'),
    },
    {
      id: 3,
      title: 'Node.js 中文网',
      url: 'https://nodejs.cn',
      description: 'Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时，用于构建高性能的网络应用。',
      tags: ['运行时', '后端', 'JavaScript'],
      category: '后端开发',
      createdAt: new Date('2026-02-01'),
    },
    {
      id: 4,
      title: 'Docker 中文指南',
      url: 'https://docker.easydoc.net',
      description: 'Docker 是一个开源的容器化平台，帮助开发者快速构建、测试和部署应用。',
      tags: ['容器', 'DevOps', '部署'],
      category: 'DevOps',
      createdAt: new Date('2026-02-10'),
    },
    {
      id: 5,
      title: 'Python 官方文档',
      url: 'https://docs.python.org/zh-cn/3/',
      description: 'Python 是一种易学且功能强大的编程语言，广泛应用于数据分析、AI 和后端开发。',
      tags: ['语言', '数据分析', 'AI'],
      category: '后端开发',
      createdAt: new Date('2026-02-15'),
    },
    {
      id: 6,
      title: 'TypeScript 中文手册',
      url: 'https://www.typescriptlang.org/zh/',
      description: 'TypeScript 是 JavaScript 的超集，添加了静态类型检查，提升大型项目的开发效率。',
      tags: ['语言', '类型系统', '前端'],
      category: '前端开发',
      createdAt: new Date('2026-03-01'),
    },
    {
      id: 7,
      title: 'GitHub',
      url: 'https://github.com',
      description: '全球最大的代码托管平台，支持 Git 版本控制、协作开发和 CI/CD 集成。',
      tags: ['代码托管', '协作', 'CI/CD'],
      category: 'DevOps',
      createdAt: new Date('2026-03-05'),
    },
    {
      id: 8,
      title: 'Vue.js 官方文档',
      url: 'https://vuejs.org',
      description: 'Vue.js 是一个渐进式 JavaScript 框架，以其简洁的 API 和灵活的设计著称。',
      tags: ['框架', '前端', 'JavaScript'],
      category: '前端开发',
      createdAt: new Date('2026-03-10'),
    },
    {
      id: 9,
      title: 'Rust 程序设计语言',
      url: 'https://www.rust-lang.org/zh-CN/',
      description: 'Rust 是一种系统编程语言，注重安全、并发和性能，无需垃圾回收即可保证内存安全。',
      tags: ['语言', '系统编程', '高性能'],
      category: '后端开发',
      createdAt: new Date('2026-03-15'),
    },
  ];

  private nextId = 10;

  constructor() {
    const saved = localStorage.getItem('useful-links');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.links = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
        this.nextId = Math.max(...this.links.map(l => l.id)) + 1;
      } catch {}
    }
  }

  private save() {
    localStorage.setItem('useful-links', JSON.stringify(this.links));
  }

  getAll(): Link[] {
    return [...this.links];
  }

  getById(id: number): Link | undefined {
    return this.links.find(l => l.id === id);
  }

  search(term: string, category?: string): Link[] {
    return this.links.filter(link => {
      const matchTerm = !term ||
        link.title.toLowerCase().includes(term.toLowerCase()) ||
        link.description.toLowerCase().includes(term.toLowerCase()) ||
        link.tags.some(t => t.toLowerCase().includes(term.toLowerCase()));
      const matchCategory = !category || category === '全部' || link.category === category;
      return matchTerm && matchCategory;
    });
  }

  getCategories(): string[] {
    return ['全部', ...new Set(this.links.map(l => l.category))];
  }

  add(link: Omit<Link, 'id' | 'createdAt'>): Link {
    const newLink: Link = {
      ...link,
      id: this.nextId++,
      createdAt: new Date(),
    };
    this.links.push(newLink);
    this.save();
    return newLink;
  }

  update(id: number, updates: Partial<Link>): boolean {
    const index = this.links.findIndex(l => l.id === id);
    if (index === -1) return false;
    this.links[index] = { ...this.links[index], ...updates };
    this.save();
    return true;
  }

  delete(id: number): boolean {
    const index = this.links.findIndex(l => l.id === id);
    if (index === -1) return false;
    this.links.splice(index, 1);
    this.save();
    return true;
  }
}
