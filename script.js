// script.js
// - Smooth page transitions (fade out/in)
// - Subtle scroll reveal animations
// - Pickering weather module (Open-Meteo: no key)

(() => {
  // Mark page ready for transition-in
  requestAnimationFrame(() => document.body.classList.add("is-ready"));

  // Set aria-current based on path
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll('[data-nav]').forEach(a => {
    if (a.getAttribute("href") === path) a.setAttribute("aria-current", "page");
  });

  // Page transitions: intercept internal links
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

  // Weather (Pickering, ON) - approx coords
  // Pickering, Ontario: ~43.8384, -79.0868
  const weatherRoot = document.querySelector("[data-weather]");
  if (weatherRoot) {
    const lat = 43.8384, lon = -79.0868;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius`;

    const iconForCode = (code) => {
      // Simple icon set (emoji to avoid asset dependencies)
      // Open-Meteo weather codes: https://open-meteo.com/en/docs
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

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const temp = data?.current?.temperature_2m;
        const code = data?.current?.weather_code;
        if (typeof temp !== "number") throw new Error("No temp");

        weatherRoot.querySelector("[data-weather-temp]").textContent = `${Math.round(temp)}°C`;
        weatherRoot.querySelector("[data-weather-icon]").textContent = iconForCode(code);
        weatherRoot.querySelector("[data-weather-status]").textContent = "Pickering, ON (now)";
      })
      .catch(() => {
        weatherRoot.querySelector("[data-weather-status]").textContent = "Pickering, ON";
      });
  }
})();
