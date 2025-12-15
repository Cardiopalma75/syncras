// /js/syncras.js
(function () {
  "use strict";

  // --- MENU MOBILE ---
  function bindMenu() {
    const btn = document.querySelector(".menu-toggle");
    const nav = document.getElementById("main-nav");
    if (!btn || !nav) return;

    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      document.body.classList.toggle("nav-open");
    });
  }

  // --- SHARE (Web Share API, fallback copia link) ---
  function bindShare() {
    const buttons = document.querySelectorAll("[data-share], .shareBtn");
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      if (btn.dataset.boundShare === "1") return;
      btn.dataset.boundShare = "1";

      btn.addEventListener("click", async (e) => {
        e.preventDefault();

        const title = btn.getAttribute("data-title") || document.title;
        const text = btn.getAttribute("data-text") || "";
        const url = window.location.href;

        if (navigator.share) {
          try {
            await navigator.share({ title, text, url });
          } catch (_) {}
          return;
        }

        try {
          await navigator.clipboard.writeText(url);
          const old = btn.textContent;
          btn.textContent = "✅ Link copiato!";
          setTimeout(() => (btn.textContent = old), 1400);
        } catch (_) {
          const tmp = document.createElement("textarea");
          tmp.value = url;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand("copy");
          document.body.removeChild(tmp);
          const old = btn.textContent;
          btn.textContent = "✅ Link copiato!";
          setTimeout(() => (btn.textContent = old), 1400);
        }
      });
    });
  }

  function bindAll() {
    bindMenu();
    bindShare();
  }

  document.addEventListener("DOMContentLoaded", bindAll);
  window.__syncrasBindAll = bindAll;
})();


