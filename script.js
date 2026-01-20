/* ==========
   Utilities
========== */
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ==========
   Banner dismiss
========== */
(() => {
  const banner = qs("[data-banner]");
  const close = qs("[data-banner-close]");
  if (!banner || !close) return;

  // optional: remember dismissal for session
  const key = "okapho_banner_dismissed";
  if (sessionStorage.getItem(key) === "1") {
    banner.style.display = "none";
    return;
  }

  close.addEventListener("click", () => {
    banner.style.display = "none";
    sessionStorage.setItem(key, "1");
  });
})();

/* ==========
   Scroll reveal
========== */
(() => {
  const els = qsa(".reveal");
  if (!els.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    els.forEach(el => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();

/* ==========
   Weather (Pickering) via Open-Meteo
   - Latitude/Longitude approx for Pickering, ON
========== */
async function loadWeather() {
  const tempEls = qsa("[data-weather-temp]");
  const iconEls = qsa("[data-weather-icon]");
  const statusEl = qs("[data-weather-status]");

  const setStatus = (t) => { if (statusEl) statusEl.textContent = t; };
  const setAllTemp = (t) => tempEls.forEach(el => el.textContent = t);
  const setAllIcon = (emoji) => iconEls.forEach(el => el.textContent = emoji);

  try {
    setStatus("Loading…");

    const lat = 43.8384;
    const lon = -79.0868;

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", "temperature_2m,weather_code");
    url.searchParams.set("temperature_unit", "celsius");
    url.searchParams.set("timezone", "America/Toronto");

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();

    const temp = data?.current?.temperature_2m;
    const code = data?.current?.weather_code;

    const tempText = (typeof temp === "number") ? `${Math.round(temp)}°C` : "—";
    setAllTemp(tempText);

    // Basic WMO -> emoji
    const icon = (() => {
      if (code === 0) return "☀️";              // clear
      if (code === 1 || code === 2) return "🌤️"; // mainly clear/partly
      if (code === 3) return "☁️";              // overcast
      if (code >= 45 && code <= 48) return "🌫️";
      if (code >= 51 && code <= 57) return "🌦️";
      if (code >= 61 && code <= 67) return "🌧️";
      if (code >= 71 && code <= 77) return "🌨️";
      if (code >= 80 && code <= 82) return "🌧️";
      if (code >= 85 && code <= 86) return "🌨️";
      if (code >= 95) return "⛈️";
      return "⛅";
    })();

    setAllIcon(icon);

    // simple status
    const status = (() => {
      if (code === 0) return "Clear";
      if (code === 1 || code === 2) return "Mostly clear";
      if (code === 3) return "Overcast";
      if (code >= 45 && code <= 48) return "Fog";
      if (code >= 51 && code <= 57) return "Drizzle";
      if (code >= 61 && code <= 67) return "Rain";
      if (code >= 71 && code <= 77) return "Snow";
      if (code >= 80 && code <= 82) return "Showers";
      if (code >= 95) return "Thunderstorm";
      return "Current conditions";
    })();

    setStatus(status);
  } catch (err) {
    // degrade gracefully
    qsa("[data-weather-temp]").forEach(el => el.textContent = "—");
    qsa("[data-weather-icon]").forEach(el => el.textContent = "⛅");
    const statusEl = qs("[data-weather-status]");
    if (statusEl) statusEl.textContent = "Weather unavailable";
  }
}

loadWeather();

/* ==========
   Full-screen menu + weather modal
========== */
(() => {
  const overlay = document.getElementById("menu-overlay");
  const modal = document.getElementById("weather-modal");

  const openMenuBtn = qs("[data-menu-open]");
  const closeMenuBtn = qs("[data-menu-close]");

  const weatherOpenBtns = qsa("[data-weather-open]");
  const weatherCloseBtns = qsa("[data-weather-close]");

  const openMenu = () => {
    if (!overlay) return;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    openMenuBtn?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    openMenuBtn?.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      overlay.hidden = true;
      document.body.style.overflow = "";
    }, 200);
  };

  const openWeather = () => {
    if (!modal) return;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.body.style.overflow = "hidden";
  };

  const closeWeather = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    setTimeout(() => {
      modal.hidden = true;
      document.body.style.overflow = "";
    }, 200);
  };

  openMenuBtn?.addEventListener("click", openMenu);
  closeMenuBtn?.addEventListener("click", closeMenu);

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (modal && !modal.hidden) closeWeather();
    else if (overlay && !overlay.hidden) closeMenu();
  });

  weatherOpenBtns.forEach(btn => btn.addEventListener("click", () => {
    if (overlay && !overlay.hidden) closeMenu();
    setTimeout(openWeather, 80);
  }));
  weatherCloseBtns.forEach(btn => btn.addEventListener("click", closeWeather));
})();
