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
    if (!isNaN(amount)) {
      setTimeout(() => {
        animateValue(el, { to: amount, duration: 700, isCurrency: true });
      }, prefersReducedMotion ? 0 : i * 220);
    }
  });

  if (total && total.dataset.amount) {
    const amount = Number(total.dataset.amount);
    if (!isNaN(amount)) {
      const delay = prefersReducedMotion ? 0 : lineItems.length * 220 + 200;
      setTimeout(() => {
        animateValue(total, { to: amount, duration: 900, isCurrency: true });
      }, delay);
    }
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
    animateValue(el, { to, duration: 6500, prefix, suffix });
  });

  const path = document.getElementById('chart-path');
  const dotMotion = document.querySelector('#chart-dot animateMotion');

  if (path && typeof path.getTotalLength === 'function') {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    if (prefersReducedMotion) {
      path.style.strokeDashoffset = '0';
    } else {
      const anim = path.animate(
        [
          { strokeDashoffset: length },
          { strokeDashoffset: 0 }
        ],
        { 
          duration: 6500, 
          easing: 'linear', 
          iterations: 1, 
          fill: 'forwards' 
        }
      );
      anim.onfinish = () => {
        path.style.strokeDashoffset = '0';
      };

      if (dotMotion && typeof dotMotion.beginElement === 'function') {
        dotMotion.beginElement();
      }
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

// Smooth scroll to top and set URL hash to #home
document.querySelectorAll('.nav__logo, .nav__links a[href="#home"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    history.pushState(null, '', '#home');
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
    highlightNav();
  });
});

// ===========================================================
// HERO REVENUE LEAK CALCULATOR
// ===========================================================
const slider = document.getElementById('rev-slider');
const displayVal = document.getElementById('calc-display-val');

const itemWelcome = document.getElementById('item-welcome');
const itemCart = document.getElementById('item-cart');
const itemPost = document.getElementById('item-post');
const itemWinback = document.getElementById('item-winback');
const itemVip = document.getElementById('item-vip');
const receiptTotal = document.getElementById('receipt-total');

function updateCalculator(revenue) {
  // Estimated recovery percentages based on standard DTC benchmarks
  const welcome = revenue * 0.032;  // 3.2%
  const cart = revenue * 0.065;     // 6.5%
  const post = revenue * 0.021;     // 2.1%
  const winback = revenue * 0.027;  // 2.7%
  const vip = revenue * 0.045;      // 4.5%
  const total = welcome + cart + post + winback + vip;

  if (displayVal) displayVal.textContent = '$' + Number(revenue).toLocaleString('en-US') + '/mo';
  if (itemWelcome) itemWelcome.textContent = formatCurrency(welcome);
  if (itemCart) itemCart.textContent = formatCurrency(cart);
  if (itemPost) itemPost.textContent = formatCurrency(post);
  if (itemWinback) itemWinback.textContent = formatCurrency(winback);
  if (itemVip) itemVip.textContent = formatCurrency(vip);
  if (receiptTotal) receiptTotal.textContent = formatCurrency(total);
}

if (slider) {
  slider.addEventListener('input', (e) => {
    updateCalculator(e.target.value);
  });
  // Initialize on load
  updateCalculator(slider.value);
}

// ===========================================================
// ACTIVE NAVIGATION HIGHLIGHT ON SCROLL
// ===========================================================
const sections = document.querySelectorAll('section[id], header[id]');
const navLinkElements = document.querySelectorAll('.nav__links .nav__link');

function highlightNav() {
  let currentSectionId = 'home';
  const scrollPosition = window.scrollY + 180; // Trigger line offset

  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    if (scrollPosition >= top && scrollPosition < top + height) {
      currentSectionId = section.getAttribute('id');
    }
  });

  navLinkElements.forEach((link) => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === `#${currentSectionId}` || (href === '#showcase' && currentSectionId === 'showcase')) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', highlightNav, { passive: true });
window.addEventListener('load', highlightNav);

// ===========================================================
// SERVICES CATEGORY FILTERING
// ===========================================================
const filterButtons = document.querySelectorAll('.services__filters .filter-btn');
const serviceCards = document.querySelectorAll('#services-grid .card');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const filter = btn.dataset.filter;

    serviceCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.classList.remove('is-hidden');
      } else {
        card.classList.add('is-hidden');
      }
    });
  });
});

// ===========================================================
// SERVICES SPLIT-SCREEN TABS (Silky Staggered Transition)
// ===========================================================
const tabBtns = document.querySelectorAll('.services-tabs__btn');
const tabPanels = document.querySelectorAll('.services-tab__panel');
let isTabTransitioning = false;

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active') || isTabTransitioning) return;

    const targetTab = btn.dataset.tab;
    const currentActivePanel = document.querySelector('.services-tab__panel.active');
    const targetPanel = document.getElementById(`tab-${targetTab}`);

    isTabTransitioning = true;

    // Update button states
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    // Smooth exit then entry
    if (currentActivePanel) {
      currentActivePanel.classList.add('is-animating-out');
      
      setTimeout(() => {
        currentActivePanel.classList.remove('active', 'is-animating-out');
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
        isTabTransitioning = false;
      }, 320); // Matched with exit transition duration
    } else if (targetPanel) {
      targetPanel.classList.add('active');
      isTabTransitioning = false;
    }
  });
});

// Interactive selection for Tab 02 (Capture Quiz Mock)
document.querySelectorAll('.optin-preview__choice').forEach(choice => {
  choice.addEventListener('click', () => {
    const parent = choice.closest('.optin-preview__choices');
    parent.querySelectorAll('.optin-preview__choice').forEach(c => {
      c.classList.remove('selected');
      c.textContent = c.textContent.replace('✓ ', '');
    });
    choice.classList.add('selected');
    choice.textContent = '✓ ' + choice.textContent;
  });
});
