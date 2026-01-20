// script.js
// - Smooth page transitions
// - Subtle scroll reveals
// - Alert bar dismiss (localStorage)
// - Pickering weather pill + modal (Open-Meteo, no key)

(() => {
  // Transition-in
  requestAnimationFrame(() => document.body.classList.add("is-ready"));

  // aria-current
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll('[data-nav]').forEach(a => {
    if (a.getAttribute("href") === path) a.setAttribute("aria-current", "page");
  });

  // Internal link transitions
  const isInternal = (a) => {
    const href = a.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:")) return false;
    if (a.target === "_blank") return false;
    return !href.startsWith("http");
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !isInternal(a)) return;
    e.preventDefault();
    const href = a.getAttribute("href");
    document.body.classList.add("is-leaving");
    setTimeout(() => { window.location.href = href; }, 220);
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }

  // Alert bar dismiss
  const alertBar = document.querySelector("[data-alertbar]");
  if (alertBar) {
    const key = "okapho_alert_dismissed_v1";
    const dismissed = localStorage.getItem(key) === "1";
    if (dismissed) alertBar.remove();

    const btn = document.querySelector("[data-alert-dismiss]");
    btn?.addEventListener("click", () => {
      localStorage.setItem(key, "1");
      alertBar.remove();
    });
  }

  // Weather
  const weatherBtn = document.querySelector("[data-weather-btn]");
  const dialog = document.querySelector("[data-weather-dialog]");
  const closeBtn = document.querySelector("[data-weather-close]");

  const wxIconForCode = (code) => {
    if (code === 0) return "☀️";
    if ([1,2].includes(code)) return "🌤️";
    if (code === 3) return "☁️";
    if ([45,48].includes(code)) return "🌫️";
    if ([51,53,55,56,57].includes(code)) return "🌦️";
    if ([61,63,65,66,67].includes(code)) return "🌧️";
    if ([71,73,75,77].includes(code)) return "🌨️";
    if ([80,81,82].includes(code)) return "🌧️";
    if ([85,86].includes(code)) return "🌨️";
    if ([95,96,99].includes(code)) return "⛈️";
    return "🌡️";
  };

  const setWx = ({ temp, code }) => {
    const icon = wxIconForCode(code);
    document.querySelectorAll("[data-wx-icon]").forEach(n => n.textContent = icon);
    document.querySelectorAll("[data-wx-temp]").forEach(n => n.textContent = `${Math.round(temp)}°C`);
    document.querySelectorAll("[data-wx-sub]").forEach(n => n.textContent = "Pickering • now");
  };

  const loadWx = () => {
    // Pickering coords (approx)
    const lat = 43.8384, lon = -79.0868;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const temp = data?.current?.temperature_2m;
        const code = data?.current?.weather_code;
        if (typeof temp !== "number") throw new Error("No temp");
        setWx({ temp, code });
      })
      .catch(() => {
        document.querySelectorAll("[data-wx-sub]").forEach(n => n.textContent = "Pickering");
      });
  };

  if (weatherBtn && dialog) {
    loadWx();

    weatherBtn.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "open");
    });

    closeBtn?.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (e) => {
      const rect = dialog.querySelector(".modal")?.getBoundingClientRect();
      if (!rect) return;
      const inBox = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inBox) dialog.close();
    });
  }
})();
