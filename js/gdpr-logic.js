// /js/gdpr-logic.js
(function () {
  "use strict";

  const GA_ID = "G-CFTTCYDZ2P";
  const CONSENT_KEY = "syncras_cookie_consent";

  // blocco preventivo: GA disabilitato finché non c'è consenso
  window["ga-disable-" + GA_ID] = true;

  function loadGoogleAnalytics() {
    if (window.__syncrasGaLoaded) return;
    window.__syncrasGaLoaded = true;

    window["ga-disable-" + GA_ID] = false;

    const gaScript = document.createElement("script");
    gaScript.async = true;
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
  }

  function showBanner() {
    const b = document.getElementById("cookie-banner");
    if (b) b.style.display = "block";
  }

  function hideBanner() {
    const b = document.getElementById("cookie-banner");
    if (b) b.style.display = "none";
  }

  function setConsent(val) {
    localStorage.setItem(CONSENT_KEY, val);
  }

  // Esposta: serve al footer
  window.revokeCookies = function () {
    localStorage.removeItem(CONSENT_KEY);
    window["ga-disable-" + GA_ID] = true;
    showBanner();
  };

  // Questa va chiamata DOPO che gdpr.html è stato caricato nel DOM
  window.__syncrasInitGdpr = function () {
    const acceptBtn = document.getElementById("cookie-accept");
    const rejectBtn = document.getElementById("cookie-reject");

    if (acceptBtn && acceptBtn.dataset.bound !== "1") {
      acceptBtn.dataset.bound = "1";
      acceptBtn.addEventListener("click", () => {
        setConsent("yes");
        hideBanner();
        loadGoogleAnalytics();
      });
    }

    if (rejectBtn && rejectBtn.dataset.bound !== "1") {
      rejectBtn.dataset.bound = "1";
      rejectBtn.addEventListener("click", () => {
        setConsent("no");
        hideBanner();
        window["ga-disable-" + GA_ID] = true;
      });
    }

    const consent = localStorage.getItem(CONSENT_KEY);

    if (consent === "yes") {
      loadGoogleAnalytics();
    } else if (consent === "no") {
      window["ga-disable-" + GA_ID] = true;
      // banner resta chiuso
    } else {
      showBanner(); // <-- QUI appare in incognito
    }
  };
})();
