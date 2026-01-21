// script.js

/* ==========
   Utilities
========== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ==========
   Banner dismiss
========== */
(() => {
  const banner = $('[data-banner]');
  const closeBtn = $('[data-banner-close]');
  if (!banner || !closeBtn) return;

  closeBtn.addEventListener('click', () => {
    banner.setAttribute('hidden', '');
  });
})();

/* ==========
   Mobile menu overlay
========== */
(() => {
  const overlay = $('#menu-overlay');
  const openBtn = $('[data-menu-open]');
  const closeBtn = $('[data-menu-close]');
  if (!overlay || !openBtn || !closeBtn) return;

  const mqDesktop = window.matchMedia('(min-width: 920px)');

  const openMenu = () => {
    // Do nothing on desktop
    if (mqDesktop.matches) return;

    overlay.hidden = false;
    overlay.classList.add('is-open');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    overlay.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    // Keep it in DOM for transition end (but we’re using display switch),
    // so just hide after a tick.
    window.setTimeout(() => {
      overlay.hidden = true;
    }, 0);
  };

  openBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);

  // Click outside panel closes
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu();
  });

  // Esc closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeMenu();
  });

  // If viewport becomes desktop, ensure closed
  mqDesktop.addEventListener('change', () => {
    if (mqDesktop.matches) closeMenu();
  });
})();

/* ==========
   Weather modal
========== */
(() => {
  const modal = $('#weather-modal');
  const openers = $$('[data-weather-open]');
  const closers = $$('[data-weather-close]');
  if (!modal || !openers.length) return;

  const openModal = () => {
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(() => { modal.hidden = true; }, 0);
  };

  openers.forEach(btn => btn.addEventListener('click', openModal));
  closers.forEach(btn => btn.addEventListener('click', closeModal));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
})();

/* ==========
   Weather fetch (Open-Meteo, no key needed)
   Pickering approx: 43.835, -79.089
========== */
(async () => {
  const tempEls = $$('[data-weather-temp]');
  const iconEls = $$('[data-weather-icon]');
  const statusEl = $('[data-weather-status]');

  if (!tempEls.length || !iconEls.length) return;

  const lat = 43.835;
  const lon = -79.089;

  const setAll = ({ tempText, iconText, statusText }) => {
    tempEls.forEach(el => (el.textContent = tempText));
    iconEls.forEach(el => (el.textContent = iconText));
    if (statusEl) statusEl.textContent = statusText;
  };

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=America%2FToronto`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Weather request failed');
    const data = await res.json();

    const t = Math.round(data?.current?.temperature_2m);
    const code = data?.current?.weather_code;

    const codeToIcon = (wc) => {
      // Simplified set
      if (wc === 0) return '☀️';
      if ([1,2].includes(wc)) return '⛅';
      if (wc === 3) return '☁️';
      if ([45,48].includes(wc)) return '🌫️';
      if ([51,53,55,56,57].includes(wc)) return '🌦️';
      if ([61,63,65,66,67].includes(wc)) return '🌧️';
      if ([71,73,75,77].includes(wc)) return '🌨️';
      if ([80,81,82].includes(wc)) return '🌦️';
      if ([95,96,99].includes(wc)) return '⛈️';
      return '⛅';
    };

    const codeToText = (wc) => {
      if (wc === 0) return 'Clear';
      if ([1,2].includes(wc)) return 'Partly cloudy';
      if (wc === 3) return 'Cloudy';
      if ([45,48].includes(wc)) return 'Foggy';
      if ([51,53,55,56,57].includes(wc)) return 'Drizzle';
      if ([61,63,65,66,67].includes(wc)) return 'Rain';
      if ([71,73,75,77].includes(wc)) return 'Snow';
      if ([80,81,82].includes(wc)) return 'Showers';
      if ([95,96,99].includes(wc)) return 'Thunderstorms';
      return 'Weather';
    };

    setAll({
      tempText: `${t}°C`,
      iconText: codeToIcon(code),
      statusText: codeToText(code)
    });
  } catch (err) {
    setAll({ tempText: '—', iconText: '⛅', statusText: 'Unable to load weather.' });
  }
})();

/* ==========
   Scroll reveal (subtle)
========== */
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = $$('.reveal');
  if (!els.length) return;

  if (prefersReduced){
    els.forEach(el => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-in');
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();

/* ==========
   Hero text conversation: no shift (reserved typing slot)
========== */
(() => {
  const chat = document.querySelector('.chat');
  if (!chat) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bubbles = Array.from(chat.querySelectorAll('.bubble'));
  if (!bubbles.length) return;

  // Reduced motion: show immediately + hide typing
  if (prefersReduced){
    bubbles.forEach(b => b.classList.add('is-shown'));
    const typing = chat.querySelector('.typing');
    if (typing) typing.classList.remove('is-on');
    return;
  }

  // Ensure starting state
  bubbles.forEach(b => b.classList.remove('is-shown'));

  const typingSlot = chat.querySelector('.typing-slot');
  const typing = chat.querySelector('.typing');

  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  const play = async () => {
    for (const msg of bubbles){
      const isUs = msg.classList.contains('us');
      if (typingSlot) typingSlot.classList.toggle('us', isUs);

      if (typing){
        typing.classList.add('is-on');
        await wait(520);
        typing.classList.remove('is-on');
      } else {
        await wait(520);
      }

      msg.classList.add('is-shown');

      const len = (msg.textContent || '').trim().length;
      const pause = Math.min(900, 260 + len * 6);
      await wait(pause);
    }

    // Leave slot in place; just ensure dots are off
    if (typing) typing.classList.remove('is-on');
    if (typingSlot) typingSlot.classList.remove('us');
  };

  // Trigger once when hero enters view
  const hero = document.querySelector('.hero-media') || chat;
  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)){
      io.disconnect();
      play();
    }
  }, { threshold: 0.45 });

  io.observe(hero);
})();
