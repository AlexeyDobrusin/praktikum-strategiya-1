/* ============================================
   MATERIALS JS — Закрытые материалы практикумов
   Пароль, видео pip, навигация, PDF
   ============================================ */

// ===== 1. PASSWORD =====
const LESSON_PASSWORD = 'strategia2025';

function checkPassword() {
  const input = document.getElementById('pw-input');
  const error = document.getElementById('pw-error');

  if (input.value === LESSON_PASSWORD) {
    document.getElementById('password-gate').classList.add('hidden');
    document.getElementById('main-content').classList.add('visible');
  } else {
    input.classList.add('error');
    error.textContent = 'Неверный пароль';
    setTimeout(() => input.classList.remove('error'), 400);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.getElementById('pw-input');
  if (pwInput) {
    pwInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') checkPassword();
    });
  }

  initVideo();
  initVideoPip();
  initNavigation();
  initPdfHint();
});

// ===== 2. VIDEO (Kinescope) =====
const VIDEO_SRC = 'https://kinescope.io/embed/d8yMZHuLVvRLgBdqaKzKAL';

function initVideo() {
  const playBtn = document.getElementById('video-play');
  const preview = document.getElementById('video-preview');
  const spinner = document.getElementById('video-spinner');
  const iframe = document.getElementById('kinescope-player');

  if (!playBtn || !iframe) return;

  let hideTimer = null;

  function startVideo() {
    playBtn.style.display = 'none';
    if (spinner) spinner.style.display = 'block';

    iframe.onload = function() {
      hideTimer = setTimeout(function() {
        if (preview) preview.classList.add('hidden');
        if (spinner) spinner.style.display = 'none';
      }, 600);
    };
    iframe.src = VIDEO_SRC + '?autoplay=1';
  }

  playBtn.addEventListener('click', startVideo);
  playBtn.addEventListener('touchend', function(e) {
    e.preventDefault();
    startVideo();
  });
}

// ===== 3. VIDEO PIP (sticky при скролле) =====
function initVideoPip() {
  const vs = document.getElementById('video-section');
  const vf = document.getElementById('video-frame');
  const vsp = document.getElementById('video-spacer');
  const closeBtn = document.getElementById('video-close');

  if (!vs || !vf) return;

  let stickyOff = false;

  window.addEventListener('scroll', () => {
    if (stickyOff) return;

    const r = vs.getBoundingClientRect();

    if (r.bottom < -100 && !vs.classList.contains('is-sticky')) {
      vsp.style.height = vf.offsetHeight + 'px';
      vs.classList.add('is-sticky');
    } else if (r.bottom >= -100 && vs.classList.contains('is-sticky')) {
      vs.classList.remove('is-sticky');
      vsp.style.height = '0';
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      stickyOff = true;
      vs.classList.remove('is-sticky');
      vsp.style.height = '0';
    });
  }
}

// ===== 4. NAVIGATION =====
function initNavigation() {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  // Scroll-based: находим секцию, ближайшую к верху viewport
  let ticking = false;
  function updateActiveSection() {
    const navHeight = 68;
    let currentId = '';

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= navHeight + 80) {
        currentId = section.id;
      }
    });

    if (currentId) {
      navLinks.forEach(n => n.classList.remove('active'));
      const activeLink = document.querySelector(`.nav-link[data-section="${currentId}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
        activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateActiveSection);
      ticking = true;
    }
  });

  // Первичная установка
  updateActiveSection();

  // Smooth scroll при клике
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Индикатор прокрутки навигации — скрываем стрелку когда доскроллили
  const navScroll = document.querySelector('.nav-scroll');
  const navBar = document.getElementById('nav-bar');
  if (navScroll && navBar) {
    navScroll.addEventListener('scroll', () => {
      const atEnd = navScroll.scrollLeft + navScroll.clientWidth >= navScroll.scrollWidth - 10;
      navBar.classList.toggle('scrolled-end', atEnd);
    });
  }
}

// ===== 5. PDF HINT (адаптивная подсказка) =====
function initPdfHint() {
  const el = document.getElementById('pdf-hint-text');
  if (!el) return;

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    el.innerHTML = 'Нажмите на\u00a0кнопку \u2014 откроется окно печати. Нажмите <strong>\u00abПоделиться\u00bb</strong> (иконка со\u00a0стрелкой), затем выберите <strong>\u00abСохранить в\u00a0\u00abФайлы\u00bb\u00bb</strong> \u2014 конспект сохранится в\u00a0формате PDF.';
  } else if (isAndroid) {
    el.innerHTML = 'Нажмите на\u00a0кнопку \u2014 откроется предпросмотр. В\u00a0верхнем меню выберите <strong>\u00abСохранить как\u00a0PDF\u00bb</strong>, затем нажмите кнопку скачивания \u2014 файл сохранится на\u00a0устройство.';
  }
  // Desktop: оставляем текст из HTML как есть
}

// ===== 6. PDF — через window.print() =====
// html2pdf.js/html2canvas не работает: canvas-лимит ~16384px, CSS-переменные не резолвятся.
// Надёжный способ: @media print (в CSS) + window.print() → браузер сам генерирует PDF.
function generatePDF() {
  window.print();
}
