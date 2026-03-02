let allNews = [];

document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  document.getElementById('news-search')?.addEventListener('input', () => {
    clearTimeout(window._nt);
    window._nt = setTimeout(filterNews, 300);
  });
});

async function loadNews() {
  try {
    const res = await fetch('/api/news');
    allNews = await res.json();
    renderNews(allNews);
  } catch {
    document.getElementById('news-page-grid').innerHTML = emptyHTML('📰', 'Ошибка загрузки', 'Попробуйте обновить страницу');
  }
}

function filterNews() {
  const q = (document.getElementById('news-search')?.value || '').toLowerCase().trim();
  renderNews(q ? allNews.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) : allNews);
}

function renderNews(items) {
  const grid = document.getElementById('news-page-grid');
  updateCount(items.length);
  if (!items.length) { grid.innerHTML = emptyHTML('📰', 'Ничего не найдено', 'Попробуйте другой запрос'); return; }
  grid.innerHTML = items.map(newsCard).join('');
  const hash = window.location.hash;
  if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 100);
}

function newsCard(n) {
  const img = n.image ? `<img src="${n.image}" alt="${n.title}" loading="lazy">` : '📰';
  return `<article class="news-card news-card--full" id="news-${n.id}">
    <div class="news-card-img">${img}</div>
    <div class="news-card-body">
      <div class="news-card-date">${fmtDate(n.date)}</div>
      <h2>${n.title}</h2>
      <div class="news-full-content">${(n.content || '').split('\n').map(l => l.trim() ? `<p>${l}</p>` : '').join('')}</div>
    </div>
  </article>`;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function updateCount(n) {
  const el = document.getElementById('news-count');
  if (!el) return;
  const f = ['новость', 'новости', 'новостей'];
  const m = n % 10, c = n % 100;
  el.textContent = n + ' ' + (m === 1 && c !== 11 ? f[0] : m >= 2 && m <= 4 && (c < 10 || c >= 20) ? f[1] : f[2]);
}

function emptyHTML(icon, title, text) {
  return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p></div>`;
}
