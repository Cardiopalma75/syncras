// /js/syncras.js
(function () {
  "use strict";

  // --- MENU MOBILE (funziona anche con header caricato via fetch) ---
  function bindMenu() {
    const btn = document.querySelector(".menu-toggle");
    const nav = document.getElementById("main-nav");
    if (!btn || !nav) return;

    // evita doppi binding se richiamato più volte
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
  }

  // --- SHARE (usa Web Share API se disponibile, altrimenti copia link) ---
  function bindShare() {
    const buttons = document.querySelectorAll("[data-share]");
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";

      btn.addEventListener("click", async () => {
        const title = btn.getAttribute("data-title") || document.title;
        const text = btn.getAttribute("data-text") || "";
        const url = window.location.href;

        // Web Share API (mobile e alcuni browser)
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url });
          } catch (e) {
            // l'utente può annullare: non è un errore vero
          }
          return;
        }

        // Fallback: copia link
        try {
          await navigator.clipboard.writeText(url);
          btn.textContent = "✅ Link copiato!";
          setTimeout(() => (btn.textContent = "📎 Condividi"), 1400);
        } catch (e) {
          // fallback vecchio stile
          const tmp = document.createElement("textarea");
          tmp.value = url;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand("copy");
          document.body.removeChild(tmp);
          btn.textContent = "✅ Link copiato!";
          setTimeout(() => (btn.textContent = "📎 Condividi"), 1400);
        }
      });
    });
  }

  // chiamata unica per agganciare tutto
  function bindAll() {
    bindMenu();
    bindShare();
  }

  // 1) quando DOM pronto
  document.addEventListener("DOMContentLoaded", bindAll);

  // 2) quando header/footer vengono inseriti via fetch: richiama bindAll()
  // (lo farà la pagina, vedi punto 2 sotto)
  window.__syncrasBindAll = bindAll;
})();

