/* ============================================
   AID OUR DREAMS – JavaScript v2.0
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Mobile Menu ----------
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('open');
      }
    });
  }

  // ---------- Navbar scroll effect ----------
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  // ---------- Hero Slideshow ----------
  let slides = document.querySelectorAll('.slide');
  let dots = document.querySelectorAll('.slide-dot');
  let currentSlide = 0;
  let slideInterval;

  function goToSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    currentSlide = index;
    if (slides[currentSlide]) slides[currentSlide].classList.add('active');
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
  }

  function nextSlide() {
    goToSlide((currentSlide + 1) % slides.length);
  }

  function initSlideshow() {
    if (slideInterval) clearInterval(slideInterval);
    slides = document.querySelectorAll('.slide');
    dots = document.querySelectorAll('.slide-dot');
    currentSlide = 0;
    if (slides.length > 1) {
      slideInterval = setInterval(nextSlide, 5000);
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          clearInterval(slideInterval);
          goToSlide(i);
          slideInterval = setInterval(nextSlide, 5000);
        });
      });
    }
  }

  // Expose globally so loadDynamicContent can reinit after fetching slides
  window.initSlideshow = initSlideshow;

  initSlideshow();

  // ---------- Scroll Animations ----------
  const fadeElements = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  fadeElements.forEach(el => fadeObserver.observe(el));

  // ---------- Gallery Modal ----------
  const galleryItems = document.querySelectorAll('.gallery-item');
  const modal = document.querySelector('.modal');

  if (modal && galleryItems.length) {
    const modalImg = modal.querySelector('.modal-content img');
    const modalClose = modal.querySelector('.modal-close');
    const modalPrev = modal.querySelector('.modal-prev');
    const modalNext = modal.querySelector('.modal-next');
    let currentIndex = 0;
    const images = Array.from(galleryItems);

    function openModal(index) {
      currentIndex = index;
      const img = images[currentIndex].querySelector('img');
      if (img) { modalImg.src = img.src; modalImg.alt = img.alt; }
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    function navigate(dir) {
      currentIndex = (currentIndex + dir + images.length) % images.length;
      const img = images[currentIndex].querySelector('img');
      if (img) { modalImg.src = img.src; modalImg.alt = img.alt; }
    }

    galleryItems.forEach((item, i) => item.addEventListener('click', () => openModal(i)));
    modalClose.addEventListener('click', closeModal);
    if (modalPrev) modalPrev.addEventListener('click', () => navigate(-1));
    if (modalNext) modalNext.addEventListener('click', () => navigate(1));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });
  }

  // ---------- Form Validation & Submission ----------
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let isValid = true;
      form.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));

      form.querySelectorAll('[required]').forEach(input => {
        const group = input.closest('.form-group');
        if (!input.value.trim()) { isValid = false; if (group) group.classList.add('error'); }
      });

      form.querySelectorAll('input[type="email"]').forEach(input => {
        const group = input.closest('.form-group');
        if (input.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
          isValid = false; if (group) group.classList.add('error');
        }
      });

      form.querySelectorAll('input[type="tel"]').forEach(input => {
        const group = input.closest('.form-group');
        if (input.value.trim() && !/^[\d\s\-+()]{7,}$/.test(input.value.trim())) {
          isValid = false; if (group) group.classList.add('error');
        }
      });

      if (!isValid) return;

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        await submitFormData(form);
        btn.textContent = 'Submitted!';
        btn.style.background = '#1F7A5A';
        btn.style.borderColor = '#1F7A5A';
        setTimeout(() => {
          form.reset();
          btn.textContent = originalText;
          btn.disabled = false;
          btn.style.background = '';
          btn.style.borderColor = '';
        }, 2500);
      } catch (err) {
        btn.textContent = 'Error — try again';
        btn.style.background = '#dc2626';
        btn.style.borderColor = '#dc2626';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.style.background = '';
          btn.style.borderColor = '';
        }, 2500);
      }
    });
  });

  // ---------- Filter Buttons (Programs & Events) ----------
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.programs-filter, .events-filter');
      if (!parent) return;
      parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const cards = document.querySelectorAll('.program-card, .event-card[data-category]');
      cards.forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });

  // ---------- Event Search ----------
  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase();
      document.querySelectorAll('.event-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }

  // ---------- Active Nav Link ----------
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a:not(.btn-primary)').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---------- Load Dynamic Content ----------
  loadDynamicContent();
});

/* ============================================
   Dynamic Content Loader
   Tries Supabase first, falls back to localStorage
   ============================================ */
async function loadDynamicContent() {
  const galleryData = await fetchData('gallery');
  const eventsData = await fetchData('events');
  const slidesData = await fetchData('slides');

  // Load gallery images
  const galleryGrid = document.querySelector('.gallery-grid');
  if (galleryGrid && galleryData.length > 0) {
    galleryGrid.innerHTML = '';
    galleryData.forEach(item => {
      const div = document.createElement('div');
      div.className = 'gallery-item fade-in visible';
      div.innerHTML = `
        <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="lazy">
        <div class="gallery-overlay">
          <span>🔍</span>
          <a class="download-btn" href="${escapeHtml(item.src)}" download title="Download" onclick="event.stopPropagation()">⬇</a>
        </div>
      `;
      galleryGrid.appendChild(div);
    });
    rebindGalleryModal();
  }

  // Load events
  const eventsGrid = document.querySelector('.events-grid');
  if (eventsGrid && eventsData.length > 0) {
    eventsGrid.innerHTML = '';
    eventsData.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'event-card fade-in visible';
      card.dataset.category = ev.category || 'all';
      card.innerHTML = `
        <div class="event-image">
          <img src="${escapeHtml(ev.image)}" alt="${escapeHtml(ev.title)}" loading="lazy">
        </div>
        <div class="event-body">
          <h3>${escapeHtml(ev.title)}</h3>
          <div class="event-meta">
            <span><span class="meta-icon">📅</span> ${escapeHtml(ev.date)}</span>
            <span><span class="meta-icon">📍</span> ${escapeHtml(ev.location)}</span>
          </div>
          <a href="#" class="btn-primary btn-sm">Learn More</a>
        </div>
      `;
      eventsGrid.appendChild(card);
    });
  }

  // Load slideshow
  const slideshow = document.querySelector('.hero-slideshow');
  if (slideshow && slidesData.length > 0) {
    const slidesContainer = slideshow.querySelector('.slides-wrapper');
    const dotsContainer = slideshow.querySelector('.slide-dots');
    if (slidesContainer && dotsContainer) {
      slidesContainer.innerHTML = '';
      dotsContainer.innerHTML = '';
      slidesData.forEach((s, i) => {
        const slide = document.createElement('div');
        slide.className = 'slide' + (i === 0 ? ' active' : '');
        slide.innerHTML = `
          <img src="${escapeHtml(s.image)}" alt="${escapeHtml(s.title)}">
          <div class="slide-overlay"></div>
          <div class="slide-content">
            <h1>${escapeHtml(s.title)}</h1>
            <p>${escapeHtml(s.description)}</p>
            <a href="${escapeHtml(s.link || 'get-involved.html')}" class="btn-primary">Join the Movement</a>
          </div>
          <div class="slide-info-bar">
            <div class="info-item"><span class="info-icon">📅</span> ${escapeHtml(s.date || '')}</div>
            <div class="info-item"><span class="info-icon">🕐</span> ${escapeHtml(s.time || '')}</div>
            <div class="info-item"><span class="info-icon">📍</span> ${escapeHtml(s.location || '')}</div>
          </div>
        `;
        slidesContainer.appendChild(slide);

        const dot = document.createElement('button');
        dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dotsContainer.appendChild(dot);
      });
      if (window.initSlideshow) window.initSlideshow();
    }
  }
}

/* Fetch data from Supabase or localStorage */
async function fetchData(table) {
  // Try Supabase if configured
  if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await client.from(table).select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) { /* fall through to localStorage */ }
  }
  return JSON.parse(localStorage.getItem('aod_' + table) || '[]');
}

function rebindGalleryModal() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const modal = document.querySelector('.modal');
  if (!modal || !galleryItems.length) return;

  const modalImg = modal.querySelector('.modal-content img');
  const modalClose = modal.querySelector('.modal-close');
  const modalPrev = modal.querySelector('.modal-prev');
  const modalNext = modal.querySelector('.modal-next');
  const modalDownload = modal.querySelector('#modal-download');
  const images = Array.from(galleryItems);
  let idx = 0;

  function updateDownload(src) { if(modalDownload) modalDownload.href = src; }
  function open(i) { idx = i; const img = images[idx].querySelector('img'); if(img){modalImg.src=img.src;modalImg.alt=img.alt;updateDownload(img.src);} modal.classList.add('active'); document.body.style.overflow='hidden'; }
  function close() { modal.classList.remove('active'); document.body.style.overflow=''; }
  function nav(d) { idx=(idx+d+images.length)%images.length; const img=images[idx].querySelector('img'); if(img){modalImg.src=img.src;modalImg.alt=img.alt;updateDownload(img.src);} }

  galleryItems.forEach((item,i) => item.addEventListener('click', () => open(i)));
  modalClose.addEventListener('click', close);
  if(modalPrev) modalPrev.addEventListener('click', () => nav(-1));
  if(modalNext) modalNext.addEventListener('click', () => nav(1));
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* Submit form data to Supabase */
async function submitFormData(form) {
  // Determine form type by checking field IDs
  const isVolunteer = !!form.querySelector('#vol-name');
  const isContact = !!form.querySelector('#contact-name');

  if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (isVolunteer) {
      const record = {
        name: form.querySelector('#vol-name').value.trim(),
        email: form.querySelector('#vol-email').value.trim(),
        phone: form.querySelector('#vol-phone').value.trim() || null,
        interest: form.querySelector('#vol-interest').value || null
      };
      const { error } = await client.from('volunteers').insert(record);
      if (error) throw error;
    } else if (isContact) {
      const record = {
        name: form.querySelector('#contact-name').value.trim(),
        email: form.querySelector('#contact-email').value.trim(),
        subject: form.querySelector('#contact-subject').value.trim(),
        message: form.querySelector('#contact-message').value.trim()
      };
      const { error } = await client.from('messages').insert(record);
      if (error) throw error;
    }
  }
  // If Supabase not available, form still shows success (graceful degradation)
}

/* ============================================
   Rating Widget
   ============================================ */
(function() {
  const starsContainer = document.getElementById('rating-stars');
  if (!starsContainer) return;

  const feedbackDiv = document.getElementById('rating-feedback');
  const submitBtn = document.getElementById('rating-submit');
  const avgEl = document.getElementById('rating-avg');
  let selectedRating = 0;

  // Load average rating on page load
  loadAverageRating();

  // Star click handler
  starsContainer.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.value);
      starsContainer.querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.value) <= selectedRating);
      });
      if (feedbackDiv) feedbackDiv.style.display = 'block';
    });
  });

  // Submit handler
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      if (selectedRating === 0) return;

      // Prevent duplicate submissions
      if (localStorage.getItem('aod_rated')) {
        if (avgEl) avgEl.textContent = 'You have already submitted a rating. Thank you!';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
          const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          const feedback = document.getElementById('rating-text').value.trim();
          const { error } = await client.from('ratings').insert({ rating: selectedRating, feedback: feedback || null });
          if (error) throw error;
        }
        localStorage.setItem('aod_rated', 'true');
        starsContainer.innerHTML = '<p style="color:var(--deep-green);font-weight:600;">Thank you for your rating! ⭐</p>';
        if (feedbackDiv) feedbackDiv.style.display = 'none';
        loadAverageRating();
      } catch (e) {
        console.error(e);
        submitBtn.textContent = 'Submit Rating';
        submitBtn.disabled = false;
      }
    });
  }

  async function loadAverageRating() {
    try {
      if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await client.from('ratings').select('rating');
        if (!error && data && data.length > 0) {
          const avg = (data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1);
          if (avgEl) avgEl.textContent = `Average rating: ${avg}/5 (${data.length} ${data.length === 1 ? 'review' : 'reviews'})`;
        }
      }
    } catch (e) { /* silently fail */ }

    // If already rated, show thank you
    if (localStorage.getItem('aod_rated') && starsContainer) {
      starsContainer.innerHTML = '<p style="color:var(--deep-green);font-weight:600;">Thank you for your rating! ⭐</p>';
      if (feedbackDiv) feedbackDiv.style.display = 'none';
    }
  }
})();
