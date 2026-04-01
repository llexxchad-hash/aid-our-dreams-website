/* ============================================
   AID OUR DREAMS – Admin Panel v2.0
   Supabase-powered with localStorage fallback
   ============================================ */

// ---------- Auth ----------
async function signIn(email, password) {
  if (supabaseClient && isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  // Fallback: demo mode
  if (email === 'admin@aidourdreams.org' && password === 'AidOurDreams2026') {
    sessionStorage.setItem('aod_admin_logged_in', 'true');
    return { user: { email } };
  }
  throw new Error('Invalid credentials');
}

async function isLoggedIn() {
  if (supabaseClient && isSupabaseConfigured()) {
    const { data } = await supabaseClient.auth.getSession();
    return !!data.session;
  }
  return sessionStorage.getItem('aod_admin_logged_in') === 'true';
}

async function requireAuth() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    window.location.href = 'login.html';
  }
}

async function logout() {
  if (supabaseClient && isSupabaseConfigured()) {
    await supabaseClient.auth.signOut();
  }
  sessionStorage.removeItem('aod_admin_logged_in');
  window.location.href = 'login.html';
}

// ---------- Change Password ----------
async function changePassword(newPassword) {
  if (!supabaseClient || !isSupabaseConfigured()) {
    throw new Error('Password change requires Supabase connection.');
  }
  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ---------- Toast Notifications ----------
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icon = type === 'success' ? '&#10003;' : '&#9888;';
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span>${escapeHtml(message)}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ---------- Data Layer (Supabase + localStorage fallback) ----------
async function getData(table) {
  if (supabaseClient && isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.from(table).select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return data;
  }
  return JSON.parse(localStorage.getItem('aod_' + table) || '[]');
}

async function insertData(table, record) {
  if (supabaseClient && isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.from(table).insert([record]).select();
    if (error) throw error;
    return data[0];
  }
  const items = JSON.parse(localStorage.getItem('aod_' + table) || '[]');
  record.id = generateId();
  record.created_at = new Date().toISOString();
  items.unshift(record);
  localStorage.setItem('aod_' + table, JSON.stringify(items));
  return record;
}

async function updateData(table, id, record) {
  if (supabaseClient && isSupabaseConfigured()) {
    const { data, error } = await supabaseClient.from(table).update(record).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
  const items = JSON.parse(localStorage.getItem('aod_' + table) || '[]');
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) { items[idx] = { ...items[idx], ...record }; }
  localStorage.setItem('aod_' + table, JSON.stringify(items));
  return items[idx];
}

async function deleteData(table, id) {
  if (supabaseClient && isSupabaseConfigured()) {
    const { error } = await supabaseClient.from(table).delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const items = JSON.parse(localStorage.getItem('aod_' + table) || '[]');
  const filtered = items.filter(i => i.id !== id);
  localStorage.setItem('aod_' + table, JSON.stringify(filtered));
}

// ---------- File Upload ----------
async function uploadImage(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error('File too large. Max 5MB.');

  if (supabaseClient && isSupabaseConfigured()) {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabaseClient.storage.from('images').upload(fileName, file);
    if (error) throw error;
    const { data } = supabaseClient.storage.from('images').getPublicUrl(fileName);
    return data.publicUrl;
  }
  // Fallback: base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- Escape HTML ----------
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Connection Status ----------
function updateConnectionUI() {
  const el = document.getElementById('connection-status');
  if (!el) return;
  if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    el.className = 'connection-status connected';
    el.innerHTML = '<span class="dot"></span> Supabase Connected';
  } else {
    el.className = 'connection-status disconnected';
    el.innerHTML = '<span class="dot"></span> Local Mode';
  }
}

// ---------- Gallery Management ----------
async function loadGalleryAdmin() {
  const tbody = document.getElementById('gallery-table-body');
  if (!tbody) return;

  const gallery = await getData('gallery');
  const countEl = document.getElementById('stat-gallery');
  if (countEl) countEl.textContent = gallery.length;

  if (gallery.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">🖼️</div><h3>No images yet</h3><p>Upload your first image using the form above.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = gallery.map(img => `
    <tr>
      <td><img src="${escapeHtml(img.src)}" class="thumb" alt="${escapeHtml(img.alt)}"></td>
      <td>${escapeHtml(img.alt)}</td>
      <td>${img.created_at ? new Date(img.created_at).toLocaleDateString() : 'N/A'}</td>
      <td class="actions">
        <button class="btn btn-danger btn-sm" onclick="deleteGalleryImage('${img.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function deleteGalleryImage(id) {
  if (!confirm('Delete this image?')) return;
  await deleteData('gallery', id);
  await loadGalleryAdmin();
  updateStats();
  showToast('Image deleted');
  if (window.refreshPreview) window.refreshPreview();
}

// ---------- Events Management ----------
async function loadEventsAdmin() {
  const tbody = document.getElementById('events-table-body');
  if (!tbody) return;

  const events = await getData('events');
  const countEl = document.getElementById('stat-events');
  if (countEl) countEl.textContent = events.length;

  if (events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📅</div><h3>No events yet</h3><p>Create your first event using the form above.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(ev => `
    <tr>
      <td><img src="${escapeHtml(ev.image)}" class="thumb" alt="${escapeHtml(ev.title)}"></td>
      <td><strong>${escapeHtml(ev.title)}</strong></td>
      <td>${escapeHtml(ev.date)}</td>
      <td><span class="status-badge ${ev.category === 'upcoming' ? 'upcoming' : 'past'}">${escapeHtml(ev.category)}</span></td>
      <td class="actions">
        <button class="btn btn-outline btn-sm" onclick="editEvent('${ev.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEvent('${ev.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  await deleteData('events', id);
  await loadEventsAdmin();
  updateStats();
  showToast('Event deleted');
  if (window.refreshPreview) window.refreshPreview();
}

let currentEditEventId = null;
async function editEvent(id) {
  const events = await getData('events');
  const ev = events.find(e => e.id === id);
  if (!ev) return;

  currentEditEventId = id;
  document.getElementById('event-title').value = ev.title;
  document.getElementById('event-date').value = ev.date;
  document.getElementById('event-time').value = ev.time || '';
  document.getElementById('event-location').value = ev.location;
  document.getElementById('event-category').value = ev.category;
  document.getElementById('event-description').value = ev.description || '';
  document.getElementById('event-form').scrollIntoView({ behavior: 'smooth' });
  showToast('Editing event — update the form and save', 'success');
}

// ---------- Slides Management ----------
async function loadSlidesAdmin() {
  const tbody = document.getElementById('slides-table-body');
  if (!tbody) return;

  const slides = await getData('slides');
  const countEl = document.getElementById('stat-slides');
  if (countEl) countEl.textContent = slides.length;

  if (slides.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">🎞️</div><h3>No slides yet</h3><p>Add your first banner slide using the form above.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = slides.map(s => `
    <tr>
      <td><img src="${escapeHtml(s.image)}" class="thumb" alt="${escapeHtml(s.title)}"></td>
      <td><strong>${escapeHtml(s.title)}</strong><br><small style="color:var(--text-muted)">${escapeHtml(s.description || '').substring(0, 80)}</small></td>
      <td>${escapeHtml(s.date || 'N/A')}</td>
      <td class="actions">
        <button class="btn btn-outline btn-sm" onclick="editSlide('${s.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteSlide('${s.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function deleteSlide(id) {
  if (!confirm('Delete this slide?')) return;
  await deleteData('slides', id);
  await loadSlidesAdmin();
  updateStats();
  showToast('Slide deleted');
  if (window.refreshPreview) window.refreshPreview();
}

let currentEditSlideId = null;
async function editSlide(id) {
  const slides = await getData('slides');
  const s = slides.find(x => x.id === id);
  if (!s) return;

  currentEditSlideId = id;
  document.getElementById('slide-title').value = s.title;
  document.getElementById('slide-description').value = s.description || '';
  document.getElementById('slide-date').value = s.date || '';
  document.getElementById('slide-time').value = s.time || '';
  document.getElementById('slide-location').value = s.location || '';
  document.getElementById('slide-link').value = s.link || '';
  document.getElementById('slide-form').scrollIntoView({ behavior: 'smooth' });
  showToast('Editing slide — update and save', 'success');
}

// ---------- Programs Management ----------
async function loadProgramsAdmin() {
  const tbody = document.getElementById('programs-table-body');
  if (!tbody) return;

  const programs = await getData('programs');
  const countEl = document.getElementById('stat-programs');
  if (countEl) countEl.textContent = programs.length;

  if (programs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📋</div><h3>No programs yet</h3><p>Add your first program using the form above.</p></div></td></tr>`;
    return;
  }

  const categoryLabels = { current: 'Current Program', outreach: 'Outreach', past: 'Past Project' };
  tbody.innerHTML = programs.map(p => `
    <tr>
      <td><img src="${escapeHtml(p.image)}" class="thumb" alt="${escapeHtml(p.title)}"></td>
      <td><strong>${escapeHtml(p.title)}</strong><br><small style="color:var(--text-muted)">${escapeHtml((p.description || '').substring(0, 80))}</small></td>
      <td><span class="status-badge ${p.category === 'current' ? 'upcoming' : 'past'}">${escapeHtml(categoryLabels[p.category] || p.category)}</span></td>
      <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</td>
      <td class="actions">
        <button class="btn btn-outline btn-sm" onclick="editProgram('${p.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProgram('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function deleteProgram(id) {
  if (!confirm('Delete this program?')) return;
  await deleteData('programs', id);
  await loadProgramsAdmin();
  updateStats();
  showToast('Program deleted');
  if (window.refreshPreview) window.refreshPreview();
}

let currentEditProgramId = null;
async function editProgram(id) {
  const programs = await getData('programs');
  const p = programs.find(x => x.id === id);
  if (!p) return;

  currentEditProgramId = id;
  document.getElementById('program-title').value = p.title;
  document.getElementById('program-description').value = p.description || '';
  document.getElementById('program-category').value = p.category || 'current';
  document.getElementById('program-form').scrollIntoView({ behavior: 'smooth' });
  showToast('Editing program — update and save', 'success');
}

// ---------- Messages Management ----------
async function loadMessagesAdmin() {
  const tbody = document.getElementById('messages-table-body');
  if (!tbody) return;

  const messages = await getData('messages');
  const countEl = document.getElementById('messages-count');
  const statEl = document.getElementById('stat-messages');
  if (countEl) countEl.textContent = messages.length;
  if (statEl) statEl.textContent = messages.length;

  if (messages.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📩</div><h3>No messages yet</h3><p>Contact form submissions will appear here.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = messages.map(m => `
    <tr>
      <td><span class="status-badge ${m.status === 'unread' ? 'upcoming' : 'past'}">${escapeHtml(m.status)}</span></td>
      <td>${escapeHtml(m.name)}</td>
      <td><a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a></td>
      <td>${escapeHtml(m.subject)}</td>
      <td title="${escapeHtml(m.message)}">${escapeHtml((m.message || '').substring(0, 60))}${(m.message || '').length > 60 ? '...' : ''}</td>
      <td>${m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}</td>
      <td class="actions">
        ${m.status === 'unread' ? `<button class="btn btn-outline btn-sm" onclick="markMessageRead('${m.id}')">Mark Read</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteMessage('${m.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function markMessageRead(id) {
  await updateData('messages', id, { status: 'read' });
  await loadMessagesAdmin();
  updateMessageStats();
  showToast('Message marked as read');
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  await deleteData('messages', id);
  await loadMessagesAdmin();
  updateMessageStats();
  showToast('Message deleted');
}

// ---------- Volunteers Management ----------
async function loadVolunteersAdmin() {
  const tbody = document.getElementById('volunteers-table-body');
  if (!tbody) return;

  const volunteers = await getData('volunteers');
  const countEl = document.getElementById('volunteers-count');
  const statEl = document.getElementById('stat-volunteers');
  if (countEl) countEl.textContent = volunteers.length;
  if (statEl) statEl.textContent = volunteers.length;

  if (volunteers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🙋</div><h3>No applications yet</h3><p>Volunteer form submissions will appear here.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = volunteers.map(v => `
    <tr>
      <td><span class="status-badge ${v.status === 'new' ? 'upcoming' : 'past'}">${escapeHtml(v.status)}</span></td>
      <td>${escapeHtml(v.name)}</td>
      <td><a href="mailto:${escapeHtml(v.email)}">${escapeHtml(v.email)}</a></td>
      <td>${escapeHtml(v.phone || 'N/A')}</td>
      <td>${escapeHtml(v.interest || 'N/A')}</td>
      <td>${v.created_at ? new Date(v.created_at).toLocaleDateString() : 'N/A'}</td>
      <td class="actions">
        ${v.status === 'new' ? `<button class="btn btn-outline btn-sm" onclick="markVolunteerReviewed('${v.id}')">Reviewed</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteVolunteer('${v.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function markVolunteerReviewed(id) {
  await updateData('volunteers', id, { status: 'reviewed' });
  await loadVolunteersAdmin();
  updateMessageStats();
  showToast('Application marked as reviewed');
}

async function deleteVolunteer(id) {
  if (!confirm('Delete this application?')) return;
  await deleteData('volunteers', id);
  await loadVolunteersAdmin();
  updateMessageStats();
  showToast('Application deleted');
}

// ---------- Partnerships Admin ----------
async function loadPartnershipsAdmin() {
  const tbody = document.getElementById('partnerships-table-body');
  if (!tbody) return;

  const partnerships = await getData('partnerships');
  const countEl = document.getElementById('partnerships-count');
  const statEl = document.getElementById('stat-partnerships');
  if (countEl) countEl.textContent = partnerships.length;
  if (statEl) statEl.textContent = partnerships.length;

  if (partnerships.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🤝</div><h3>No inquiries yet</h3><p>Partnership form submissions will appear here.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = partnerships.map(p => `
    <tr>
      <td><span class="status-badge ${p.status === 'new' ? 'upcoming' : 'past'}">${escapeHtml(p.status)}</span></td>
      <td>${escapeHtml(p.org_name)}</td>
      <td>${escapeHtml(p.contact_name)}</td>
      <td><a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></td>
      <td>${escapeHtml(p.phone || 'N/A')}</td>
      <td>${escapeHtml(p.org_type || 'N/A')}</td>
      <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(p.message || '')}">${escapeHtml(p.message || 'N/A')}</td>
      <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</td>
      <td class="actions">
        ${p.status === 'new' ? `<button class="btn btn-outline btn-sm" onclick="markPartnershipReviewed('${p.id}')">Reviewed</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deletePartnership('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function markPartnershipReviewed(id) {
  await updateData('partnerships', id, { status: 'reviewed' });
  await loadPartnershipsAdmin();
  updateMessageStats();
  showToast('Partnership inquiry marked as reviewed');
}

async function deletePartnership(id) {
  if (!confirm('Delete this partnership inquiry?')) return;
  await deleteData('partnerships', id);
  await loadPartnershipsAdmin();
  updateMessageStats();
  showToast('Partnership inquiry deleted');
}

// ---------- Message Stats ----------
async function updateMessageStats() {
  const messages = await getData('messages');
  const volunteers = await getData('volunteers');
  const partnerships = await getData('partnerships');
  const unreadMessages = messages.filter(m => m.status === 'unread').length;
  const newVolunteers = volunteers.filter(v => v.status === 'new').length;
  const newPartnerships = partnerships.filter(p => p.status === 'new').length;
  const totalUnread = unreadMessages + newVolunteers + newPartnerships;

  const statUnread = document.getElementById('stat-unread');
  if (statUnread) statUnread.textContent = totalUnread;

  // Update nav badge on all pages
  const navBadge = document.getElementById('nav-messages-count');
  if (navBadge) navBadge.textContent = totalUnread;
}

// ---------- Stats ----------
async function updateStats() {
  const gallery = await getData('gallery');
  const events = await getData('events');
  const slides = await getData('slides');
  const programs = await getData('programs');

  const g = document.getElementById('stat-gallery');
  const e = document.getElementById('stat-events');
  const s = document.getElementById('stat-slides');
  const p = document.getElementById('stat-programs');

  if (g) g.textContent = gallery.length;
  if (e) e.textContent = events.length;
  if (s) s.textContent = slides.length;
  if (p) p.textContent = programs.length;

  // Also update messages badge on non-messages pages
  await updateMessageStats();
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', async () => {
  // Init Supabase
  initSupabase();
  updateConnectionUI();

  const isLoginPage = window.location.pathname.includes('login.html');

  // Auth check
  if (!isLoginPage) {
    await requireAuth();
  }

  // Load data
  if (!isLoginPage) {
    await Promise.all([loadGalleryAdmin(), loadEventsAdmin(), loadSlidesAdmin(), loadProgramsAdmin()]);
    await updateStats();
  }

  // Active sidebar link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

  // ---------- Login Form ----------
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.dataset.handled = 'true';
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      const errorEl = document.getElementById('login-error');
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      btn.classList.add('loading');
      btn.disabled = true;
      errorEl.classList.remove('show');

      try {
        await signIn(email, password);
        window.location.href = 'index.html';
      } catch (err) {
        errorEl.classList.add('show');
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    });
  }

  // ---------- Gallery Upload Form ----------
  const galleryForm = document.getElementById('gallery-form');
  if (galleryForm) {
    const fileInput = document.getElementById('gallery-file');
    const uploadZone = document.getElementById('gallery-upload-zone');
    const previewGrid = document.getElementById('gallery-preview');
    let pendingFiles = [];

    if (uploadZone) {
      uploadZone.addEventListener('click', () => fileInput.click());
      uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
      uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
      uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', () => handleFiles(fileInput.files));
    }

    function handleFiles(files) {
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        pendingFiles.push(file);
        const reader = new FileReader();
        reader.onload = () => {
          const div = document.createElement('div');
          div.className = 'image-preview';
          div.innerHTML = `<img src="${reader.result}" alt="Preview"><button class="remove-btn" type="button">&times;</button>`;
          div.querySelector('.remove-btn').addEventListener('click', () => {
            const idx = Array.from(previewGrid.children).indexOf(div);
            pendingFiles.splice(idx, 1);
            div.remove();
          });
          previewGrid.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    }

    galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (pendingFiles.length === 0) { showToast('Select at least one image', 'error'); return; }

      const altText = document.getElementById('gallery-alt').value.trim() || 'Gallery image';
      const btn = galleryForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Uploading...';

      try {
        for (const file of pendingFiles) {
          const src = await uploadImage(file);
          await insertData('gallery', { src, alt: altText });
        }
        showToast(`${pendingFiles.length} image(s) uploaded`);
        pendingFiles = [];
        previewGrid.innerHTML = '';
        galleryForm.reset();
        await loadGalleryAdmin();
        await updateStats();
        if (window.refreshPreview) window.refreshPreview();
      } catch (err) {
        showToast(err.message, 'error');
      }
      btn.disabled = false;
      btn.textContent = 'Upload to Gallery';
    });
  }

  // ---------- Event Form ----------
  const eventForm = document.getElementById('event-form');
  if (eventForm) {
    const eventFileInput = document.getElementById('event-image-file');
    const eventUploadZone = document.getElementById('event-upload-zone');
    let eventImageUrl = '';

    if (eventUploadZone && eventFileInput) {
      eventUploadZone.addEventListener('click', () => eventFileInput.click());
      eventFileInput.addEventListener('change', async () => {
        if (eventFileInput.files[0]) {
          try {
            eventImageUrl = await uploadImage(eventFileInput.files[0]);
            eventUploadZone.innerHTML = `<img src="${eventImageUrl}" style="max-height:120px;border-radius:10px;margin:0 auto;">`;
          } catch (err) { showToast(err.message, 'error'); }
        }
      });
    }

    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('event-title').value.trim();
      const date = document.getElementById('event-date').value.trim();
      const time = document.getElementById('event-time').value.trim();
      const location = document.getElementById('event-location').value.trim();
      const category = document.getElementById('event-category').value;
      const description = document.getElementById('event-description').value.trim();

      if (!title || !date || !location) { showToast('Fill in required fields', 'error'); return; }

      const record = {
        title, date, time, location, category, description,
        image: eventImageUrl || 'https://placehold.co/600x400/0F3D2E/FFFFFF?text=Event'
      };

      try {
        if (currentEditEventId) {
          await updateData('events', currentEditEventId, record);
          currentEditEventId = null;
          showToast('Event updated');
        } else {
          await insertData('events', record);
          showToast('Event created');
        }
        eventForm.reset();
        eventImageUrl = '';
        if (eventUploadZone) eventUploadZone.innerHTML = '<div class="upload-icon">📷</div><h4>Upload event image</h4><p>Click or drag image here</p>';
        await loadEventsAdmin();
        await updateStats();
        if (window.refreshPreview) window.refreshPreview();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  // ---------- Slide Form ----------
  const slideForm = document.getElementById('slide-form');
  if (slideForm) {
    const slideFileInput = document.getElementById('slide-image-file');
    const slideUploadZone = document.getElementById('slide-upload-zone');
    let slideImageUrl = '';

    if (slideUploadZone && slideFileInput) {
      slideUploadZone.addEventListener('click', () => slideFileInput.click());
      slideFileInput.addEventListener('change', async () => {
        if (slideFileInput.files[0]) {
          try {
            slideImageUrl = await uploadImage(slideFileInput.files[0]);
            slideUploadZone.innerHTML = `<img src="${slideImageUrl}" style="max-height:120px;border-radius:10px;margin:0 auto;">`;
          } catch (err) { showToast(err.message, 'error'); }
        }
      });
    }

    slideForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('slide-title').value.trim();
      const description = document.getElementById('slide-description').value.trim();
      const date = document.getElementById('slide-date').value.trim();
      const time = document.getElementById('slide-time').value.trim();
      const location = document.getElementById('slide-location').value.trim();
      const link = document.getElementById('slide-link').value.trim();

      if (!title) { showToast('Enter a slide title', 'error'); return; }

      const record = {
        title, description, date, time, location, link,
        image: slideImageUrl || 'https://placehold.co/1400x800/0F3D2E/FFFFFF?text=Slide'
      };

      try {
        if (currentEditSlideId) {
          await updateData('slides', currentEditSlideId, record);
          currentEditSlideId = null;
          showToast('Slide updated');
        } else {
          await insertData('slides', record);
          showToast('Slide added');
        }
        slideForm.reset();
        slideImageUrl = '';
        if (slideUploadZone) slideUploadZone.innerHTML = '<div class="upload-icon">🖼️</div><h4>Upload banner image</h4><p>Recommended: 1400 x 800px landscape</p>';
        await loadSlidesAdmin();
        await updateStats();
        if (window.refreshPreview) window.refreshPreview();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  // ---------- Program Form ----------
  const programForm = document.getElementById('program-form');
  if (programForm) {
    const programFileInput = document.getElementById('program-image-file');
    const programUploadZone = document.getElementById('program-upload-zone');
    let programImageUrl = '';

    if (programUploadZone && programFileInput) {
      programUploadZone.addEventListener('click', () => programFileInput.click());
      programFileInput.addEventListener('change', async () => {
        if (programFileInput.files[0]) {
          try {
            programImageUrl = await uploadImage(programFileInput.files[0]);
            programUploadZone.innerHTML = `<img src="${programImageUrl}" style="max-height:120px;border-radius:10px;margin:0 auto;">`;
          } catch (err) { showToast(err.message, 'error'); }
        }
      });
    }

    programForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('program-title').value.trim();
      const description = document.getElementById('program-description').value.trim();
      const category = document.getElementById('program-category').value;

      if (!title || !description) { showToast('Fill in required fields', 'error'); return; }

      const record = {
        title, description, category,
        image: programImageUrl || 'https://placehold.co/600x400/0F3D2E/FFFFFF?text=Program'
      };

      try {
        if (currentEditProgramId) {
          if (programImageUrl) record.image = programImageUrl;
          else delete record.image;
          await updateData('programs', currentEditProgramId, record);
          currentEditProgramId = null;
          showToast('Program updated');
        } else {
          await insertData('programs', record);
          showToast('Program added');
        }
        programForm.reset();
        programImageUrl = '';
        if (programUploadZone) programUploadZone.innerHTML = '<div class="upload-icon">📷</div><h4>Upload program image</h4><p>Click or drag image here</p>';
        await loadProgramsAdmin();
        await updateStats();
        if (window.refreshPreview) window.refreshPreview();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  // ---------- Sidebar mobile toggle ----------
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ---------- Site Preview Panel ----------
  const previewToggle = document.getElementById('preview-toggle');
  const previewPanel = document.getElementById('preview-panel');
  const previewIframe = document.getElementById('preview-iframe');
  const previewClose = document.getElementById('preview-close');
  const previewRefresh = document.getElementById('preview-refresh');

  function openPreview() {
    if (!previewPanel) return;
    previewPanel.classList.add('open');
    previewToggle.classList.add('active');
    document.body.classList.add('preview-open');
  }

  function closePreview() {
    if (!previewPanel) return;
    previewPanel.classList.remove('open');
    previewToggle.classList.remove('active');
    document.body.classList.remove('preview-open');
  }

  function refreshPreview() {
    if (!previewIframe) return;
    previewIframe.src = previewIframe.src;
  }

  if (previewToggle) {
    previewToggle.addEventListener('click', () => {
      if (previewPanel.classList.contains('open')) {
        closePreview();
      } else {
        openPreview();
      }
    });
  }

  if (previewClose) previewClose.addEventListener('click', closePreview);
  if (previewRefresh) previewRefresh.addEventListener('click', refreshPreview);

  // Device size buttons
  document.querySelectorAll('.preview-device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preview-device-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (previewIframe) {
        previewIframe.classList.remove('tablet', 'mobile');
        const device = btn.dataset.device;
        if (device === 'tablet') previewIframe.classList.add('tablet');
        if (device === 'mobile') previewIframe.classList.add('mobile');
      }
    });
  });

  // Escape key closes preview
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewPanel && previewPanel.classList.contains('open')) {
      closePreview();
    }
  });

  // Expose refreshPreview globally so save/delete handlers can call it
  window.refreshPreview = refreshPreview;
});
