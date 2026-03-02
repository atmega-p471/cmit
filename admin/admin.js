const TOKEN_KEY = 'cmit_jwt';

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

async function api(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  headers['Authorization'] = `Bearer ${getToken()}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) { logout(); return null; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-input').value;
  const err = document.getElementById('login-error');
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error();
    const { token } = await res.json();
    sessionStorage.setItem(TOKEN_KEY, token);
    err.classList.remove('show');
    showApp();
  } catch {
    err.classList.add('show');
    document.getElementById('login-input').value = '';
  }
}

function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  location.reload();
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.add('show');
  initApp();
}

let newsData = [];
let coursesData = [];
let mediaData = [];

async function initApp() {
  await Promise.all([loadNews(), loadCourses(), loadMedia()]);
  showPanel('dashboard');
}

function renderDashboard() {
  document.getElementById('stat-news').textContent    = newsData.length;
  document.getElementById('stat-courses').textContent = coursesData.length;
  document.getElementById('stat-media').textContent   = mediaData.length;
}

function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name)?.classList.add('active');
  document.querySelector(`[data-panel="${name}"]`)?.classList.add('active');
  const titles = { dashboard: 'Панель управления', news: 'Управление новостями', courses: 'Управление курсами', media: 'Медиатека', settings: 'Настройки' };
  document.getElementById('topbar-title').textContent = titles[name] || '';
}

async function loadNews() {
  newsData = await api('/api/news') || [];
  renderNewsList();
}

function renderNewsList() {
  renderDashboard();
  const list = document.getElementById('news-list');
  if (!newsData.length) {
    list.innerHTML = `<div class="empty-admin"><div class="icon">📰</div><h3>Новостей пока нет</h3><p>Нажмите «Добавить новость»</p></div>`;
    return;
  }
  list.innerHTML = newsData.map(n => `
    <div class="item-row">
      <div class="item-thumb">${n.image ? `<img src="${n.image}" alt="">` : '📰'}</div>
      <div class="item-info">
        <div class="item-title">${esc(n.title)}</div>
        <div class="item-meta">${fmtDate(n.date)} · ${(n.content || '').slice(0, 60)}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-ghost btn-sm" onclick="openNewsModal('${n.id}')">✏️ Редактировать</button>
        <button class="btn btn-danger btn-sm" onclick="deleteNews('${n.id}')">🗑</button>
      </div>
    </div>`).join('');
}

let editingNewsId = null;

function openNewsModal(id = null) {
  editingNewsId = id;
  const n = id ? newsData.find(x => x.id === id) : null;
  document.getElementById('news-modal-title').textContent = id ? 'Редактировать новость' : 'Новая новость';
  document.getElementById('nm-title').value   = n?.title   || '';
  document.getElementById('nm-date').value    = n?.date    || today();
  document.getElementById('nm-content').value = n?.content || '';
  document.getElementById('nm-img-url').value = n?.image   || '';
  const prev = document.getElementById('nm-img-preview');
  if (n?.image) { prev.querySelector('img').src = n.image; prev.classList.add('show'); }
  else prev.classList.remove('show');
  showModal('news-modal');
}

async function saveNews() {
  const body = {
    title:   document.getElementById('nm-title').value.trim(),
    date:    document.getElementById('nm-date').value,
    content: document.getElementById('nm-content').value.trim(),
    image:   document.getElementById('nm-img-url').value.trim()
  };
  if (!body.title) { toast('Введите заголовок', 'error'); return; }
  try {
    if (editingNewsId) await api(`/api/news/${editingNewsId}`, { method: 'PUT', body });
    else               await api('/api/news', { method: 'POST', body });
    await loadNews();
    closeModal('news-modal');
    toast(editingNewsId ? 'Новость обновлена' : 'Новость добавлена');
  } catch (e) { toast(e.message || 'Ошибка', 'error'); }
}

async function deleteNews(id) {
  if (!confirm('Удалить новость?')) return;
  try { await api(`/api/news/${id}`, { method: 'DELETE' }); await loadNews(); toast('Новость удалена'); }
  catch { toast('Ошибка удаления', 'error'); }
}

async function loadCourses() {
  coursesData = await api('/api/courses') || [];
  renderCoursesList();
}

function renderCoursesList() {
  renderDashboard();
  const list = document.getElementById('courses-list');
  if (!coursesData.length) {
    list.innerHTML = `<div class="empty-admin"><div class="icon">📚</div><h3>Курсов пока нет</h3><p>Нажмите «Добавить курс»</p></div>`;
    return;
  }
  list.innerHTML = coursesData.map(c => `
    <div class="item-row">
      <div class="item-thumb">${c.image ? `<img src="${c.image}" alt="">` : '⚙️'}</div>
      <div class="item-info">
        <div class="item-title">${esc(c.title)}</div>
        <div class="item-meta">${c.duration || ''} ${c.schedule ? '· ' + c.schedule : ''}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-ghost btn-sm" onclick="openCourseModal('${c.id}')">✏️ Редактировать</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCourse('${c.id}')">🗑</button>
      </div>
    </div>`).join('');
}

let editingCourseId = null;

function openCourseModal(id = null) {
  editingCourseId = id;
  const c = id ? coursesData.find(x => x.id === id) : null;
  document.getElementById('course-modal-title').textContent = id ? 'Редактировать курс' : 'Новый курс';
  document.getElementById('cm-title').value       = c?.title       || '';
  document.getElementById('cm-description').value = c?.description || '';
  document.getElementById('cm-duration').value    = c?.duration    || '';
  document.getElementById('cm-schedule').value    = c?.schedule    || '';
  document.getElementById('cm-img-url').value     = c?.image       || '';
  const prev = document.getElementById('cm-img-preview');
  if (c?.image) { prev.querySelector('img').src = c.image; prev.classList.add('show'); }
  else prev.classList.remove('show');
  showModal('course-modal');
}

async function saveCourse() {
  const body = {
    title:       document.getElementById('cm-title').value.trim(),
    description: document.getElementById('cm-description').value.trim(),
    duration:    document.getElementById('cm-duration').value.trim(),
    schedule:    document.getElementById('cm-schedule').value.trim(),
    image:       document.getElementById('cm-img-url').value.trim()
  };
  if (!body.title) { toast('Введите название курса', 'error'); return; }
  try {
    if (editingCourseId) await api(`/api/courses/${editingCourseId}`, { method: 'PUT', body });
    else                 await api('/api/courses', { method: 'POST', body });
    await loadCourses();
    closeModal('course-modal');
    toast(editingCourseId ? 'Курс обновлён' : 'Курс добавлен');
  } catch (e) { toast(e.message || 'Ошибка', 'error'); }
}

async function deleteCourse(id) {
  if (!confirm('Удалить курс?')) return;
  try { await api(`/api/courses/${id}`, { method: 'DELETE' }); await loadCourses(); toast('Курс удалён'); }
  catch { toast('Ошибка удаления', 'error'); }
}

async function loadMedia() {
  mediaData = await api('/api/media') || [];
  renderMediaGrid();
}

function renderMediaGrid() {
  renderDashboard();
  const grid = document.getElementById('media-grid');
  if (!mediaData.length) {
    grid.innerHTML = `<div class="empty-admin" style="grid-column:1/-1"><div class="icon">🖼️</div><h3>Изображений нет</h3><p>Загрузите первое изображение</p></div>`;
    return;
  }
  grid.innerHTML = mediaData.map(m => `
    <div class="media-item" title="${esc(m.name)}" onclick="copyMediaUrl('${m.src}', event)">
      <img src="${m.src}" alt="${esc(m.name)}" loading="lazy">
      <div class="media-name">${esc(m.name)}</div>
      <button class="media-del" onclick="deleteMedia('${m.id}', event)" title="Удалить">✕</button>
    </div>`).join('');
}

async function handleMediaUpload(files) {
  if (!files?.length) return;
  let count = 0;
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd
      });
      if (res.ok) count++;
    } catch {}
  }
  if (count) { await loadMedia(); toast(`Загружено: ${count}`); }
}

function copyMediaUrl(src, e) {
  e.stopPropagation();
  navigator.clipboard.writeText(src).then(() => toast('Путь скопирован')).catch(() => prompt('Путь:', src));
}

async function deleteMedia(id, e) {
  e.stopPropagation();
  if (!confirm('Удалить изображение?')) return;
  try { await api(`/api/media/${id}`, { method: 'DELETE' }); await loadMedia(); toast('Изображение удалено'); }
  catch { toast('Ошибка удаления', 'error'); }
}

let mediaSelectTarget = null;

function openMediaPicker(urlId, previewId) {
  mediaSelectTarget = { url: urlId, preview: previewId };
  const grid = document.getElementById('picker-grid');
  grid.innerHTML = !mediaData.length
    ? `<div class="empty-admin" style="grid-column:1/-1"><div class="icon">🖼️</div><h3>Медиатека пуста</h3></div>`
    : mediaData.map(m => `<div class="media-item" onclick="selectMedia('${m.src}')" title="${esc(m.name)}"><img src="${m.src}" alt=""><div class="media-name">${esc(m.name)}</div></div>`).join('');
  showModal('media-picker-modal');
}

function selectMedia(src) {
  if (!mediaSelectTarget) return;
  document.getElementById(mediaSelectTarget.url).value = src;
  const prev = document.getElementById(mediaSelectTarget.preview);
  prev.querySelector('img').src = src;
  prev.classList.add('show');
  closeModal('media-picker-modal');
}

function setupImgPreview(inputId, previewId) {
  document.getElementById(inputId)?.addEventListener('input', () => {
    const val = document.getElementById(inputId).value.trim();
    const prev = document.getElementById(previewId);
    if (val) { prev.querySelector('img').src = val; prev.classList.add('show'); }
    else prev.classList.remove('show');
  });
}

async function savePassword() {
  const curr = document.getElementById('set-curr-pass').value;
  const next = document.getElementById('set-new-pass').value;
  const conf = document.getElementById('set-conf-pass').value;
  if (!curr) { toast('Введите текущий пароль', 'error'); return; }
  if (!next || next.length < 4) { toast('Минимум 4 символа', 'error'); return; }
  if (next !== conf) { toast('Пароли не совпадают', 'error'); return; }
  try {
    await api('/api/auth/password', { method: 'PUT', body: { currentPassword: curr, newPassword: next } });
    ['set-curr-pass', 'set-new-pass', 'set-conf-pass'].forEach(id => document.getElementById(id).value = '');
    toast('Пароль изменён');
  } catch (e) { toast(e.message || 'Ошибка', 'error'); }
}

async function clearAllData(type) {
  if (type === 'news' && confirm('Удалить ВСЕ новости?')) {
    for (const n of newsData) await api(`/api/news/${n.id}`, { method: 'DELETE' });
    await loadNews(); toast('Все новости удалены');
  }
  if (type === 'courses' && confirm('Удалить ВСЕ курсы?')) {
    for (const c of coursesData) await api(`/api/courses/${c.id}`, { method: 'DELETE' });
    await loadCourses(); toast('Все курсы удалены');
  }
  if (type === 'media' && confirm('Удалить ВСЕ изображения?')) {
    for (const m of mediaData) await api(`/api/media/${m.id}`, { method: 'DELETE' });
    await loadMedia(); toast('Медиатека очищена');
  }
}

function showModal(id) { document.getElementById(id).classList.add('show'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('show'); document.body.style.overflow = ''; }

function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function today() {
  return new Date().toISOString().split('T')[0];
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-username')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-input')?.focus();
  });
  document.getElementById('login-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });

  if (getToken()) showApp();

  document.getElementById('media-upload-input')?.addEventListener('change', e => handleMediaUpload(e.target.files));

  const zone = document.getElementById('upload-zone');
  if (zone) {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag'); handleMediaUpload(e.dataTransfer.files); });
    zone.addEventListener('click', () => document.getElementById('media-upload-input')?.click());
  }

  setupImgPreview('nm-img-url', 'nm-img-preview');
  setupImgPreview('cm-img-url', 'cm-img-preview');

  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) { e.target.classList.remove('show'); document.body.style.overflow = ''; }
  });
});
