// /js/syncras.js
(function () {
  "use strict";

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

    // chiudi cliccando fuori
    document.addEventListener("click", function (e) {
      const isOpen = document.body.classList.contains("nav-open");
      if (!isOpen) return;
      const clickedInside = nav.contains(e.target) || btn.contains(e.target);
      if (!clickedInside) document.body.classList.remove("nav-open");
    });

    // chiudi quando clicchi un link
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => document.body.classList.remove("nav-open"));
    });
  }

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

        if (navigator.share) {
          try { await navigator.share({ title, text, url }); } catch (e) {}
          return;
        }

        // fallback copia link
        try {
          await navigator.clipboard.writeText(url);
        } catch (e) {
          const tmp = document.createElement("textarea");
          tmp.value = url;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand("copy");
          document.body.removeChild(tmp);
        }

        const old = btn.textContent;
        btn.textContent = "✅ Link copiato!";
        setTimeout(() => (btn.textContent = old), 1400);
      });
    });
  }

  function bindCookieSettingsLink() {
    const a = document.getElementById("cookie-settings-link");
    if (!a) return;

    if (a.dataset.bound === "1") return;
    a.dataset.bound = "1";

    a.addEventListener("click", function (e) {
      e.preventDefault();
      if (window.revokeCookies) window.revokeCookies();
      else alert("Banner cookie non ancora caricato: ricarica la pagina.");
    });
  }

  function bindAll() {
    bindMenu();
    bindShare();
    bindCookieSettingsLink();
  }

  document.addEventListener("DOMContentLoaded", bindAll);
  window.__syncrasBindAll = bindAll;
})();


