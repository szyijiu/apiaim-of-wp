(function () {
  'use strict';

  /* ---- Particle System ---- */
  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: null, y: null };
      this.resize();
      this.init();
      this.bindEvents();
      this.animate();
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    init() {
      const count = Math.floor((this.width * this.height) / 6000);
      this.particles = [];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
      this.stars = [];
      for (let i = 0; i < 50; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: Math.random() * 3 + 1,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        this.resize();
        this.init();
      });
      this.canvas.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });
      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });
    }

    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      const now = Date.now();

      for (const star of this.stars) {
        const twinkle = Math.sin(now * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        const alpha = twinkle * 0.8 + 0.2;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        this.ctx.fill();
        if (star.size > 2) {
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = `rgba(0, 240, 255, ${alpha * 0.5})`;
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      }

      for (const p of this.particles) {
        if (this.mouse.x !== null) {
          const dx = this.mouse.x - p.x;
          const dy = this.mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 150;
            p.x -= dx * force * 0.01;
            p.y -= dy * force * 0.01;
          }
        }
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(148, 163, 184, ${p.opacity})`;
        this.ctx.fill();
      }

      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (120 - dist) / 120 * 0.15;
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      }

      requestAnimationFrame(() => this.animate());
    }
  }

  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    new ParticleSystem(canvas);
  }

  /* ---- Counter Animation ---- */
  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-target'));
    const duration = 2000;
    const startTime = performance.now();
    const isDecimal = target % 1 !== 0;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      el.textContent = isDecimal ? current.toFixed(2) : Math.floor(current).toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = isDecimal ? target.toFixed(2) : target.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }

  /* ---- Count Up (hero stats) ---- */
  function animateCountUp(el) {
    const target = parseInt(el.getAttribute('data-target'));
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }

  /* ---- Intersection Observer for scroll animations ---- */
  const observerOptions = {
    threshold: 0.3,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;

        if (el.classList.contains('counter')) {
          animateCounter(el);
        }

        if (el.classList.contains('stat-number')) {
          animateCountUp(el);
        }

        if (el.classList.contains('data-card') || el.classList.contains('feature-card')) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }

        observer.unobserve(el);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.counter').forEach((el) => observer.observe(el));
  document.querySelectorAll('.stat-number').forEach((el) => observer.observe(el));
  document.querySelectorAll('.data-card').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
  });
  document.querySelectorAll('.feature-card').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
  });

  /* ---- Navbar scroll effect ---- */
  const navbar = document.querySelector('.navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  });

  /* ---- Active nav link on scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  function updateActiveLink() {
    let current = '';
    sections.forEach((section) => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink);

  /* ---- Smooth scroll for nav links ---- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (mobileOverlay) {
        mobileOverlay.classList.remove('open');
      }
    });
  });

  /* ---- Mobile nav toggle ---- */
  const toggleBtn = document.querySelector('.nav-toggle');
  const mobileOverlay = document.createElement('div');
  mobileOverlay.className = 'nav-overlay';
  mobileOverlay.innerHTML = `
    <div class="nav-links-mobile">
      <a href="#hero" class="active">首页</a>
      <a href="#data">数据</a>
      <a href="#features">功能</a>
      <a href="#footer">联系</a>
    </div>
    <div class="nav-actions-mobile">
      <a href="#" class="btn btn-ghost">登录</a>
      <a href="#" class="btn btn-primary">注册</a>
    </div>
  `;
  if (toggleBtn) {
    document.body.appendChild(mobileOverlay);
    toggleBtn.addEventListener('click', () => {
      mobileOverlay.classList.toggle('open');
    });
    mobileOverlay.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileOverlay.classList.remove('open');
      });
    });
  }

  /* ---- Mouse glow effect on feature cards ---- */
  document.querySelectorAll('.feature-card, .data-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    });
  });
})();
