function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#navLinks a').forEach(link => {
    link.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
  });

  initReveal();
  initCardReveal();

  if (document.getElementById('home-news-grid')) loadHomeNews();
  if (document.getElementById('home-courses-grid')) loadHomeCourses();
});

function initReveal() {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal, .reveal-left').forEach((el, i) => {
    const delay = (i % 4) * 80;
    el.style.transitionDelay = delay + 'ms';
    revealObserver.observe(el);
  });

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        if (!isNaN(target)) animateCounter(el, target, suffix);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num[data-count]').forEach(el => counterObserver.observe(el));
}

function animateCounter(el, target, suffix) {
  const duration = 1400;
  const start = performance.now();
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.round(easeOut(progress) * target);
    el.innerHTML = value + '<span>' + suffix + '</span>';
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCardReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.07 });

  document.querySelectorAll('.pillar-card,.mini-card,.skill-item,.contact-card,.news-card,.course-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = `opacity .55s ease ${(i % 4) * 80}ms, transform .55s ease ${(i % 4) * 80}ms, border-color .3s ease, box-shadow .3s ease`;
    obs.observe(el);
  });
}

async function loadHomeNews() {
  const grid = document.getElementById('home-news-grid');
  try {
    const res = await fetch('/api/news');
    const items = (await res.json()).slice(0, 3);
    if (!items.length) { grid.innerHTML = emptyHTML('📰', 'Новостей пока нет', 'Следите за обновлениями!'); return; }
    grid.innerHTML = items.map(newsCardHTML).join('');
    triggerObserver(grid.querySelectorAll('.news-card'));
  } catch {
    grid.innerHTML = emptyHTML('📰', 'Не удалось загрузить новости', '');
  }
}

async function loadHomeCourses() {
  const grid = document.getElementById('home-courses-grid');
  try {
    const res = await fetch('/api/courses');
    const items = (await res.json()).slice(0, 3);
    if (!items.length) { grid.innerHTML = emptyHTML('📚', 'Курсы скоро появятся', 'Следите за обновлениями!'); return; }
    grid.innerHTML = items.map(courseCardHTML).join('');
    triggerObserver(grid.querySelectorAll('.course-card'));
  } catch {
    grid.innerHTML = emptyHTML('📚', 'Не удалось загрузить курсы', '');
  }
}

function newsCardHTML(n) {
  const img = n.image ? `<img src="${n.image}" alt="${n.title}" loading="lazy">` : '📰';
  return `<a class="news-card" href="news.html#news-${n.id}">
    <div class="news-card-img">${img}</div>
    <div class="news-card-body">
      <div class="news-card-date">${fmtDate(n.date)}</div>
      <h3>${n.title}</h3>
      <p>${trunc(n.content, 120)}</p>
      <span class="news-card-link">Читать далее →</span>
    </div>
  </a>`;
}

function courseCardHTML(c) {
  const img = c.image ? `<img src="${c.image}" alt="${c.title}" loading="lazy">` : '⚙️';
  return `<div class="course-card">
    <div class="course-card-img">${img}</div>
    <div class="course-card-body">
      <h3>${c.title}</h3>
      <p>${trunc(c.description, 110)}</p>
      <div class="course-meta">
        ${c.duration ? `<span>⏱ ${c.duration}</span>` : ''}
        ${c.schedule ? `<span>📅 ${c.schedule}</span>` : ''}
      </div>
    </div>
  </div>`;
}

function emptyHTML(icon, title, text) {
  return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p></div>`;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function trunc(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function triggerObserver(els) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; obs.unobserve(e.target); }
    });
  }, { threshold: 0.07 });
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = `opacity .55s ease ${i * 80}ms, transform .55s ease ${i * 80}ms, border-color .3s ease, box-shadow .3s ease`;
    obs.observe(el);
  });
}
