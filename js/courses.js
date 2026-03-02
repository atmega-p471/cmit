let allCourses = [];

document.addEventListener('DOMContentLoaded', () => {
  loadCourses();
  document.getElementById('courses-search')?.addEventListener('input', () => {
    clearTimeout(window._ct);
    window._ct = setTimeout(filterCourses, 300);
  });
});

async function loadCourses() {
  try {
    const res = await fetch('/api/courses');
    allCourses = await res.json();
    renderCourses(allCourses);
  } catch {
    document.getElementById('courses-page-grid').innerHTML = emptyHTML('📚', 'Ошибка загрузки', 'Попробуйте обновить страницу');
  }
}

function filterCourses() {
  const q = (document.getElementById('courses-search')?.value || '').toLowerCase().trim();
  renderCourses(q ? allCourses.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) : allCourses);
}

function renderCourses(items) {
  const grid = document.getElementById('courses-page-grid');
  updateCount(items.length);
  if (!items.length) { grid.innerHTML = emptyHTML('📚', 'Курсы скоро появятся', ''); return; }
  grid.innerHTML = items.map(courseCard).join('');
}

function courseCard(c) {
  const img = c.image ? `<img src="${c.image}" alt="${c.title}" loading="lazy">` : '⚙️';
  return `<div class="course-card">
    <div class="course-card-img">${img}</div>
    <div class="course-card-body">
      <h3>${c.title}</h3>
      <p>${c.description || ''}</p>
      <div class="course-meta">
        ${c.duration ? `<span>⏱ ${c.duration}</span>` : ''}
        ${c.schedule ? `<span>📅 ${c.schedule}</span>` : ''}
      </div>
    </div>
  </div>`;
}

function updateCount(n) {
  const el = document.getElementById('courses-count');
  if (!el) return;
  const f = ['курс', 'курса', 'курсов'];
  const m = n % 10, c = n % 100;
  el.textContent = n + ' ' + (m === 1 && c !== 11 ? f[0] : m >= 2 && m <= 4 && (c < 10 || c >= 20) ? f[1] : f[2]);
}

function emptyHTML(icon, title, text) {
  return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p></div>`;
}
