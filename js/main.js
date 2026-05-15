(function () {
  'use strict';

  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const menuToggle = document.getElementById('menuToggle');
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const yearEl = document.getElementById('year');
  const navLinks = document.querySelectorAll('.nav-list a, .footer-nav a');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* Header scroll state */
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
  }

  function openMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu();
      else openMenu();
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  window.matchMedia('(min-width: 800px)').addEventListener('change', (e) => {
    if (e.matches) closeMenu();
  });

  /* Active nav link on scroll */
  const sections = document.querySelectorAll('section[id]');

  function setActiveNav() {
    const scrollY = window.scrollY + 120;
    let current = '';

    sections.forEach((section) => {
      if (section.offsetTop <= scrollY) {
        current = section.getAttribute('id');
      }
    });

    document.querySelectorAll('.nav-list a').forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === `#${current}`);
    });
  }

  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();

  /* Scroll reveal */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* Animated counters */
  const counters = document.querySelectorAll('[data-count]');

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (Number.isNaN(target)) return;

    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  /* Subtle parallax on hero glow */
  const heroGlow = document.querySelector('.hero-glow');

  if (heroGlow && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY * 0.15;
        heroGlow.style.transform = `translateX(-50%) translateY(${y}px)`;
      },
      { passive: true }
    );
  }

  /* Contact form — POST /api/contact (Nodemailer on Vercel/Netlify, or npm run dev) */
  const CONTACT_API = '/api/contact';
  if (contactForm && formStatus) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    function setFormStatus(text, isError) {
      formStatus.textContent = text;
      formStatus.classList.toggle('error', Boolean(isError));
    }

    function showUrlStatus() {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sent') === '1') {
        setFormStatus('Thank you. Your message has been sent. We will respond shortly.', false);
        contactForm.reset();
        history.replaceState(null, '', window.location.pathname + '#contact');
      } else if (params.has('error')) {
        setFormStatus(decodeURIComponent(params.get('error')), true);
        history.replaceState(null, '', window.location.pathname + '#contact');
      }
    }

    showUrlStatus();

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const organization = contactForm.organization.value.trim();
      const message = contactForm.message.value.trim();
      const website = contactForm.website?.value?.trim() ?? '';

      if (!name || !email || !message) {
        setFormStatus('Please fill in all required fields.', true);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }
      setFormStatus('Sending your message…', false);

      try {
        const response = await fetch(CONTACT_API, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, organization, message, website }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          const errMsg =
            data?.message ||
            'Unable to send your message. Please email info@lionsgatepe.com directly.';
          throw new Error(errMsg);
        }

        setFormStatus(data.message, false);
        contactForm.reset();
      } catch (err) {
        const isNetwork =
          err instanceof TypeError ||
          (err.message && err.message.includes('Failed to fetch'));

        setFormStatus(
          isNetwork
            ? 'Could not reach the server. Use npm run dev locally, or email info@lionsgatepe.com directly.'
            : err.message || 'Something went wrong. Please try again.',
          true
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send message';
        }
      }
    });
  }
})();
