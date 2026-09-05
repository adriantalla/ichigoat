// ===========================================================
// KLAVIYO PUBLIC CLIENT CREDENTIALS
// ===========================================================
const KLAVIYO_COMPANY_ID = 'ViZexi';
const KLAVIYO_PLAYBOOK_LIST_ID = 'VfyugC';

// ===========================================================
// FULLSCREEN PLAYBOOK MODAL & CLIENT DISPATCH
// ===========================================================
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'lead_takeover_dismissed_until';
  const CONVERTED_KEY = 'lead_playbook_converted';
  const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours

  // Reset trigger flag via URL for testing (e.g., ?reset_popup=1)
  if (window.location.search.includes('reset_popup')) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONVERTED_KEY);
    sessionStorage.removeItem('lead_widget_hidden');
  }

  // Permanently suppress if user already submitted the form
  if (localStorage.getItem(CONVERTED_KEY) === 'true') {
    return;
  }

  const modal = document.getElementById('lead-modal');
  const widgetWrap = document.getElementById('lead-widget-wrap');
  const widgetBtn = document.getElementById('lead-widget');
  const widgetClose = document.getElementById('lead-widget-close');
  const modalClose = document.getElementById('lead-modal-close');
  const noThanksBtn = document.getElementById('lead-nothanks-btn');

  const step1 = document.getElementById('lead-step-1');
  const step2 = document.getElementById('lead-step-2');
  const step3 = document.getElementById('lead-step-3');

  const quizBtns = document.querySelectorAll('.quiz-btn');
  const step2Back = document.getElementById('step-2-back');
  const captureForm = document.getElementById('lead-capture-form');
  const emailInput = document.getElementById('lead-email');
  const emailError = document.getElementById('lead-email-error');
  const doneBtn = document.getElementById('lead-done-btn');
  const bookCallBtn = document.getElementById('lead-book-call-btn');

  let selectedPriority = 'Scale Automated Flow Revenue';
  let hasTriggered = false;
  let timerFinished = false;

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function setError(inputEl, errorEl, message) {
    if (inputEl) inputEl.classList.add('is-invalid');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove('is-invalid');
    if (errorEl) errorEl.textContent = '';
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => clearError(emailInput, emailError));
  }

  function isDismissed() {
    if (localStorage.getItem(CONVERTED_KEY) === 'true') return true;
    const dismissedUntil = localStorage.getItem(STORAGE_KEY);
    if (!dismissedUntil) return false;
    return Date.now() < Number(dismissedUntil);
  }

  if (widgetWrap) {
    widgetWrap.classList.remove('is-visible');
  }

  function getScrollPercent() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    return docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  }

  function openModal() {
    if (isDismissed()) return;
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
    if (widgetWrap) widgetWrap.classList.remove('is-visible');
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    
    const hasConverted = localStorage.getItem(CONVERTED_KEY) === 'true';
    if (widgetWrap && !hasConverted && !sessionStorage.getItem('lead_widget_hidden')) {
      widgetWrap.classList.add('is-visible');
    } else if (widgetWrap && hasConverted) {
      widgetWrap.classList.remove('is-visible');
      widgetWrap.style.display = 'none';
    }
    
    localStorage.setItem(STORAGE_KEY, String(Date.now() + COOLDOWN_MS));
  }

  function checkTrigger() {
    if (timerFinished && getScrollPercent() >= 35 && !hasTriggered) {
      hasTriggered = true;
      openModal();
    }
  }

  // 18-second timer before scroll trigger activates
  setTimeout(() => {
    timerFinished = true;
    checkTrigger();
  }, 18000);

  window.addEventListener('scroll', () => {
    checkTrigger();
  }, { passive: true });

  // Desktop Exit-Intent trigger
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0 && !hasTriggered && !isDismissed()) {
      hasTriggered = true;
      openModal();
    }
  });

  // Step 1: Selection
  quizBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const strongText = btn.querySelector('strong');
      selectedPriority = strongText ? strongText.textContent.trim() : (btn.dataset.goal || 'Scale Automated Flow Revenue');

      if (typeof gtag === 'function') {
        gtag('event', 'lead_priority_selected', {
          event_category: 'lead_generation',
          goal: selectedPriority
        });
      }

      step1.classList.remove('active');
      step2.classList.add('active');
    });
  });

  // Step 2: Back Button
  if (step2Back) {
    step2Back.addEventListener('click', () => {
      step2.classList.remove('active');
      step1.classList.add('active');
    });
  }

  // Step 2: Form Submit to Klaviyo
  if (captureForm) {
    captureForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput ? emailInput.value.trim() : '';
      const submitBtn = captureForm.querySelector('button[type="submit"]');

      if (!email) {
        setError(emailInput, emailError, 'Please enter your work email.');
        return;
      } else if (!isValidEmail(email)) {
        setError(emailInput, emailError, 'Please enter a valid email address.');
        return;
      } else {
        clearError(emailInput, emailError);
      }

      submitBtn.textContent = 'Sending...';
      submitBtn.setAttribute('disabled', 'true');

      // Permanently suppress popup and floating launcher
      localStorage.setItem(CONVERTED_KEY, 'true');
      if (widgetWrap) {
        widgetWrap.classList.remove('is-visible');
        widgetWrap.style.display = 'none';
      }

      const urlParams = new URLSearchParams(window.location.search);
      const attribution = {
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_content: urlParams.get('utm_content') || '',
        utm_term: urlParams.get('utm_term') || '',
        referrer: document.referrer || 'Direct / None',
        page_url: window.location.href
      };

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
                list_id: KLAVIYO_PLAYBOOK_LIST_ID,
                email: email,
                properties: {
                  lead_source: '7-Figure Playbook Takeover',
                  priority_goal: selectedPriority,
                  ...attribution
                }
              }
            }
          })
        });

        if (typeof gtag === 'function') {
          gtag('event', 'playbook_lead_captured', {
            event_category: 'lead_generation',
            email_domain: email.split('@')[1] || '',
            utm_source: attribution.utm_source,
            utm_campaign: attribution.utm_campaign
          });
        }

        step2.classList.remove('active');
        step3.classList.add('active');
      } catch (err) {
        step2.classList.remove('active');
        step3.classList.add('active');
      } finally {
        submitBtn.removeAttribute('disabled');
        submitBtn.textContent = 'Send Me The Playbook →';
      }
    });
  }

  // Close & Widget Controls
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (noThanksBtn) noThanksBtn.addEventListener('click', closeModal);

  if (widgetBtn) {
    widgetBtn.addEventListener('click', () => {
      if (modal) {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      }
      document.body.style.overflow = 'hidden';
      widgetWrap.classList.remove('is-visible');
    });
  }

  if (widgetClose) {
    widgetClose.addEventListener('click', (e) => {
      e.stopPropagation();
      widgetWrap.classList.remove('is-visible');
      sessionStorage.setItem('lead_widget_hidden', 'true');
    });
  }

  // Step 3 Completion Handlers
  if (doneBtn) doneBtn.addEventListener('click', closeModal);
  if (bookCallBtn) bookCallBtn.addEventListener('click', closeModal);
});
