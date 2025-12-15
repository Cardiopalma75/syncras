(function () {
  function initMenu() {
    const btn = document.querySelector('.menu-toggle');
    const nav = document.getElementById('main-nav');

    if (!btn || !nav) return;

    // Toggle menu
    btn.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });

    // Chiudi menu quando tocchi un link (mobile)
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => document.body.classList.remove('nav-open'));
    });
  }

  async function shareOrCopy() {
    const url = window.location.href;
    const title = document.title || 'Syncras.App';
    const text = 'Articolo Syncras: tempo, attenzione e scelte furbe.';

    // Prova share nativo
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        // se l’utente annulla o il browser blocca → fallback sotto
      }
    }

    // Fallback: copia link
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copiato ✅\n\n' + url);
    } catch (e) {
      // fallback “vecchio”
      const tmp = document.createElement('input');
      tmp.value = url;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      alert('Link copiato ✅\n\n' + url);
    }
  }

  function initShare() {
    const btns = ['shareBtnTop', 'shareBtnBottom']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (!btns.length) return;

    btns.forEach(btn => {
      btn.style.display = 'inline-block';
      btn.addEventListener('click', shareOrCopy);
    });
  }

  // Questo è il punto chiave: funziona anche con header caricato via fetch
  function initAll() {
    initMenu();
    initShare();
  }

  // Parte quando la pagina è pronta
  document.addEventListener('DOMContentLoaded', initAll);

  // E riprova poco dopo (utile quando header/footer arrivano via fetch)
  setTimeout(initAll, 200);
  setTimeout(initAll, 800);
})();
