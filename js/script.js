// ===========================================================
// KLAVIYO CREDENTIALS & CONSTANTS
// ===========================================================
const KLAVIYO_COMPANY_ID = 'ViZexi';
const KLAVIYO_AUDIT_LIST_ID = 'TWM3de';

// ===========================================================
// ATTRIBUTION & UTM PARAMETER TRACKER
// ===========================================================
function getAttributionData() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_content: urlParams.get('utm_content') || '',
    utm_term: urlParams.get('utm_term') || '',
    referrer: document.referrer || 'Direct / None',
    page_url: window.location.href
  };
}

// ===========================================================
// VALIDATION HELPERS
// ===========================================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidUrl(url) {
  return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(url.trim());
}

function setError(inputEl, errorEl, message) {
  if (inputEl) inputEl.classList.add('is-invalid');
  if (errorEl) errorEl.textContent = message;
}

function clearError(inputEl, errorEl) {
  if (inputEl) inputEl.classList.remove('is-invalid');
  if (errorEl) errorEl.textContent = '';
}

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

// Intersection Observer for scroll triggers
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
// HERO REVENUE LEAK CALCULATOR & RECEIPT CTA
// ===========================================================
const slider = document.getElementById('rev-slider');
const displayVal = document.getElementById('calc-display-val');

const itemWelcome = document.getElementById('item-welcome');
const itemCart = document.getElementById('item-cart');
const itemPost = document.getElementById('item-post');
const itemWinback = document.getElementById('item-winback');
const itemVip = document.getElementById('item-vip');
const receiptTotal = document.getElementById('receipt-total');
const calcClaimBtn = document.getElementById('calc-claim-btn');

function updateCalculator(revenue) {
  const welcome = revenue * 0.032;
  const cart = revenue * 0.065;
  const post = revenue * 0.021;
  const winback = revenue * 0.027;
  const vip = revenue * 0.045;
  const total = welcome + cart + post + winback + vip;

  if (displayVal) displayVal.textContent = '$' + Number(revenue).toLocaleString('en-US') + '/mo';
  if (itemWelcome) itemWelcome.textContent = formatCurrency(welcome);
  if (itemCart) itemCart.textContent = formatCurrency(cart);
  if (itemPost) itemPost.textContent = formatCurrency(post);
  if (itemWinback) itemWinback.textContent = formatCurrency(winback);
  if (itemVip) itemVip.textContent = formatCurrency(vip);
  if (receiptTotal) receiptTotal.textContent = formatCurrency(total);
  if (calcClaimBtn) calcClaimBtn.textContent = `Recover This ${formatCurrency(total)} →`;
}

if (slider) {
  slider.addEventListener('input', (e) => {
    updateCalculator(e.target.value);
  });
  updateCalculator(slider.value);
}

// ===========================================================
// ACTIVE NAVIGATION HIGHLIGHT ON SCROLL
// ===========================================================
const sections = document.querySelectorAll('section[id], header[id]');
const navLinkElements = document.querySelectorAll('.nav__links .nav__link');

function highlightNav() {
  let currentSectionId = 'home';
  const scrollPosition = window.scrollY + 180;

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
// SERVICES SPLIT-SCREEN TABS
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

    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    if (currentActivePanel) {
      currentActivePanel.classList.add('is-animating-out');
      
      setTimeout(() => {
        currentActivePanel.classList.remove('active', 'is-animating-out');
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
        isTabTransitioning = false;
      }, 320);
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

// ===========================================================
// AUDIT INTAKE FORM (DIRECT TO KLAVIYO CLIENT API & REDIRECT)
// ===========================================================
const auditForm = document.getElementById('audit-request-form');
const auditSubmitBtn = document.getElementById('audit-submit-btn');

const nameInput = document.getElementById('audit-name');
const urlInput = document.getElementById('audit-url');
const emailInput = document.getElementById('audit-email');

const nameError = document.getElementById('audit-name-error');
const urlError = document.getElementById('audit-url-error');
const emailError = document.getElementById('audit-email-error');

if (nameInput) nameInput.addEventListener('input', () => clearError(nameInput, nameError));
if (urlInput) urlInput.addEventListener('input', () => clearError(urlInput, urlError));
if (emailInput) emailInput.addEventListener('input', () => clearError(emailInput, emailError));

if (auditForm) {
  auditForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameVal = nameInput ? nameInput.value.trim() : '';
    const urlVal = urlInput ? urlInput.value.trim() : '';
    const emailVal = emailInput ? emailInput.value.trim() : '';

    let hasErrors = false;

    if (!nameVal) {
      setError(nameInput, nameError, 'Please enter your first name.');
      hasErrors = true;
    } else {
      clearError(nameInput, nameError);
    }

    if (!urlVal) {
      setError(urlInput, urlError, 'Please enter your store website.');
      hasErrors = true;
    } else if (!isValidUrl(urlVal)) {
      setError(urlInput, urlError, 'Please enter a valid website address.');
      hasErrors = true;
    } else {
      clearError(urlInput, urlError);
    }

    if (!emailVal) {
      setError(emailInput, emailError, 'Please enter your work email.');
      hasErrors = true;
    } else if (!isValidEmail(emailVal)) {
      setError(emailInput, emailError, 'Please enter a valid email address.');
      hasErrors = true;
    } else {
      clearError(emailInput, emailError);
    }

    if (hasErrors) return;

    if (auditSubmitBtn) {
      auditSubmitBtn.textContent = 'Submitting Request...';
      auditSubmitBtn.setAttribute('disabled', 'true');
    }

    const attribution = getAttributionData();

    try {
      await fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=${KLAVIYO_COMPANY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'revision': '2024-02-15'
        },
        body: JSON.stringify({
          data: {
            type: 'subscription',
            attributes: {
              channels: {
                email: {
                  marketing: {
                    consent: 'SUBSCRIBED'
                  }
                }
              },
              email: emailVal,
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    first_name: nameVal,
                    properties: {
                      store_url: urlVal,
                      lead_source: 'Bespoke Audit PDF Intake',
                      priority_goal: 'Full Teardown Requested',
                      ...attribution
                    }
                  }
                }
              }
            },
            relationships: {
              list: {
                data: {
                  type: 'list',
                  id: KLAVIYO_AUDIT_LIST_ID
                }
              }
            }
          }
        })
      });

      if (typeof gtag === 'function') {
        gtag('event', 'audit_pdf_requested', {
          event_category: 'lead_generation',
          store_url: urlVal,
          email_domain: emailVal.split('@')[1] || '',
          utm_source: attribution.utm_source,
          utm_campaign: attribution.utm_campaign
        });
      }

      const redirectParams = new URLSearchParams({
        name: nameVal,
        email: emailVal,
        store_url: urlVal
      });
      window.location.href = `thankyou.html?${redirectParams.toString()}`;

    } catch (err) {
      const redirectParams = new URLSearchParams({
        name: nameVal,
        email: emailVal,
        store_url: urlVal
      });
      window.location.href = `thankyou.html?${redirectParams.toString()}`;
    } finally {
      if (auditSubmitBtn) {
        auditSubmitBtn.removeAttribute('disabled');
        auditSubmitBtn.textContent = 'Get My Free Audit Report →';
      }
    }
  });
}
