// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---------- Footer year ----------
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Count-up animation ----------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function formatCurrency(value) {
  return '$' + Math.round(value).toLocaleString('en-US');
}

function animateValue(el, { to, duration = 1200, prefix = '', suffix = '', isCurrency = false }) {
  if (prefersReducedMotion) {
    el.textContent = isCurrency ? formatCurrency(to) : `${prefix}${to}${suffix}`;
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = to * eased;
    el.textContent = isCurrency
      ? formatCurrency(current)
      : `${prefix}${(to < 10 ? current.toFixed(1) : Math.round(current))}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function runReceiptAnimation() {
  const lineItems = document.querySelectorAll('#receipt-lines b[data-amount]');
  const total = document.getElementById('receipt-total');

  lineItems.forEach((el, i) => {
    const amount = Number(el.dataset.amount);
    setTimeout(() => {
      animateValue(el, { to: amount, duration: 700, isCurrency: true });
    }, prefersReducedMotion ? 0 : i * 220);
  });

  if (total) {
    const amount = Number(total.dataset.amount);
    const delay = prefersReducedMotion ? 0 : lineItems.length * 220 + 200;
    setTimeout(() => {
      animateValue(total, { to: amount, duration: 900, isCurrency: true });
    }, delay);
  }
}

function runStatsAnimation() {
  document.querySelectorAll('.stat__num[data-count]').forEach(el => {
    const to = Number(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    animateValue(el, { to, duration: 1300, prefix, suffix });
  });
}

function runProcessChartAnimation() {
  document.querySelectorAll('.process__chart-num[data-count]').forEach(el => {
    const to = Number(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    animateValue(el, { to, duration: 2500, prefix, suffix });
  });

  const path = document.getElementById('chart-path');
  if (path && typeof path.getTotalLength === 'function') {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    if (prefersReducedMotion) {
      path.style.strokeDashoffset = '0';
    } else {
      path.animate(
        [
          { strokeDashoffset: length },
          { strokeDashoffset: 0 }
        ],
        { 
          duration: 6500, 
          easing: 'ease-in-out',
          fill: 'forwards' 
        }
      );
    }
  }
}

// ---------- Marquee vertical pan (reveals full email length inside each card) ----------
function setupMarqueePan() {
  const imgs = document.querySelectorAll('.marquee__img');
  imgs.forEach(img => {
    const measure = () => {
      const frame = img.parentElement;
      if (!frame) return;
      const frameHeight = frame.clientHeight;
      const frameWidth = frame.clientWidth;
      if (!img.naturalWidth || !frameWidth) return;
      const displayedHeight = (frameWidth / img.naturalWidth) * img.naturalHeight;
      const delta = displayedHeight - frameHeight;
      img.style.setProperty('--pan-distance', delta > 0 ? `-${Math.round(delta)}px` : '0px');
    };
    if (img.complete) {
      measure();
    } else {
      img.addEventListener('load', measure, { once: true });
    }
    window.addEventListener('resize', measure);
  });
}
setupMarqueePan();

// Trigger once elements enter the viewport
const observed = new WeakSet();
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !observed.has(entry.target)) {
      observed.add(entry.target);
      if (entry.target.id === 'receipt') runReceiptAnimation();
      if (entry.target.classList.contains('stats')) runStatsAnimation();
      if (entry.target.id === 'process-chart') runProcessChartAnimation();
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

const receiptEl = document.getElementById('receipt');
const statsEl = document.querySelector('.stats');
const processChartEl = document.getElementById('process-chart');
if (receiptEl) observer.observe(receiptEl);
if (statsEl) observer.observe(statsEl);
if (processChartEl) observer.observe(processChartEl);
