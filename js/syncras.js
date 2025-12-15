// /js/syncras.js
(function () {
  "use strict";

  // =========================
  // MENU MOBILE
  // =========================
  function bindMenu() {
    const btn = document.querySelector(".menu-toggle");
    const nav = document.getElementById("main-nav");
    if (!btn || !nav) return;

    // evita doppi binding
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      document.body.classList.toggle("nav-open");
    });

    // Chiudi menu quando clicchi un link (mobile)
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => document.body.classList.remove("nav-open"));
    });

    // Chiudi menu se clicchi fuori (mobile)
    document.addEventListener("click", function (e) {
      const isOpen = document.body.classList.contains("nav-open");
      if (!isOpen) return;

      const clickedInside = nav.contains(e.target) || btn.contains(e.target);
      if (!clickedInside) document.body.classList.remove("nav-open");
    });
  }

  // =========================
  // SHARE BUTTONS
  // (usa data-share)
  // =========================
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

        // Web Share API
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url });
          } catch (e) {
            // annullato dall'utente: ok
          }
          return;
        }

        // fallback: copia link
        const original = btn.textContent;
        try {
          await navigator.clipboard.writeText(url);
          btn.textContent = "✅ Link copiato!";
          setTimeout(() => (btn.textContent = original), 1400);
        } catch (e) {
          // fallback vecchio stile
          try {
            const tmp = document.createElement("textarea");
            tmp.value = url;
            tmp.setAttribute("readonly", "");
            tmp.style.position = "absolute";
            tmp.style.left = "-9999px";
            document.body.appendChild(tmp);
            tmp.select();
            document.execCommand("copy");
            document.body.removeChild(tmp);

            btn.textContent = "✅ Link copiato!";
            setTimeout(() => (btn.textContent = original), 1400);
          } catch (e2) {
            // se proprio non può copiare
            alert("Copia questo link:\n" + url);
          }
        }
      });
    });
  }

  // =========================
  // GDPR FOOTER LINK
  // (#cookie-settings -> window.revokeCookies())
  // =========================
  function bindGdprSettings() {
    const settings = document.getElementById("cookie-settings");
    if (!settings) return;

    if (settings.dataset.bound === "1") return;
    settings.dataset.bound = "1";

    settings.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.revokeCookies) {
        window.revokeCookies();
      } else {
        console.warn("revokeCookies non disponibile: gdpr.html non caricato o init non avviato.");
      }
    });
  }

  // =========================
  // BIND TUTTO
  // =========================
  function bindAll() {
    bindMenu();
    bindShare();
    bindGdprSettings();
  }

  // 1) quando DOM pronto
  document.addEventListener("DOMContentLoaded", bindAll);

  // 2) quando header/footer/gdpr vengono inseriti via fetch
  window.__syncrasBindAll = bindAll;
})();



