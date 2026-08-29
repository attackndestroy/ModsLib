const ModsLib = (() => {

  const DATA_URL = '/mods.json';
  const HEADER_IMG = '/header.png';
  const FAVICON = '/fav.ico';

  /* =========================
     Base64 UTF-8
     ========================= */

  function b64Encode(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      console.error('B64 encode failed', e);
      return '';
    }
  }

  function b64Decode(str) {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (e) {
      console.error('B64 decode failed', e);
      return '';
    }
  }

  /* =========================
     URL
     ========================= */

  function isLikelyValidUrl(str) {
    if (!str || typeof str !== 'string') return false;

    try {
      const u = new URL(str);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function resolveDownloadUrl(mod) {
    if (!mod || !mod.download) return null;

    const decoded = b64Decode(mod.download);

    if (!isLikelyValidUrl(decoded)) {
      return null;
    }

    return decoded;
  }

  /* =========================
     JSON
     ========================= */

  async function fetchMods() {
    let res;

    try {
      res = await fetch(DATA_URL, {
        cache: 'no-store'
      });
    } catch (e) {
      throw new Error(
        'تعذر الاتصال بالخادم لتحميل قائمة المودات.'
      );
    }

    if (!res.ok) {
      throw new Error(
        'ملف mods.json غير موجود أو تعذر الوصول إليه (' +
        res.status +
        ').'
      );
    }

    let data;

    try {
      data = await res.json();
    } catch (e) {
      throw new Error(
        'ملف mods.json تالف أو بصيغة غير صالحة.'
      );
    }

    if (!Array.isArray(data)) {
      throw new Error(
        'تنسيق mods.json غير صحيح.'
      );
    }

    return data.filter(
      m => m && typeof m.id !== 'undefined'
    );
  }

  function sortByIdDesc(list) {
    return [...list].sort(
      (a, b) => Number(b.id) - Number(a.id)
    );
  }

  function sortByIdAsc(list) {
    return [...list].sort(
      (a, b) => Number(a.id) - Number(b.id)
    );
  }

  function highestId(list) {
    if (!list.length) return 0;

    return Math.max(
      ...list.map(m => Number(m.id) || 0)
    );
  }

  /* =========================
     ID
     ========================= */

  function getValidId() {
    const params = new URLSearchParams(
      window.location.search
    );

    const raw = params.get('id');

    if (raw === null) {
      return null;
    }

    if (!/^\d+$/.test(raw.trim())) {
      return null;
    }

    const n = parseInt(raw, 10);

    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }

    return n;
  }

  /* =========================
     Navigation
     ========================= */

  // من tomod.html إلى mod.html
  function modUrl(id) {
    return '/mod.html?id=' +
      encodeURIComponent(id);
  }

  // رابط كامل للمود
  function fullModUrl(id) {
    return window.location.origin +
      modUrl(id);
  }

  // من mod.html إلى tomod.html
  function toModDetailsUrl(id) {
    return '/tomod.html?id=' +
      encodeURIComponent(id);
  }

  /* =========================
     Session Gate
     ========================= */

  function markAllowed(id) {
    try {
      sessionStorage.setItem(
        'allowed_mod_' + String(id),
        'true'
      );
    } catch (e) {
      console.warn(
        'Unable to save session permission',
        e
      );
    }
  }

  function isAllowed(id) {
    try {
      return sessionStorage.getItem(
        'allowed_mod_' + String(id)
      ) === 'true';
    } catch (e) {
      return false;
    }
  }

  /* =========================
     Header
     ========================= */

  function renderHeader(targetSelector) {
    const target =
      document.querySelector(targetSelector);

    if (!target) return;

    target.innerHTML = `
      <header class="site-header">
        <div class="site-header__inner">
          <a
            href="/index.html"
            class="site-header__link"
            aria-label="ModsLib"
          >
            <img
              src="${HEADER_IMG}"
              alt="ModsLib"
              class="site-header__img"
              onerror="this.style.display='none'"
            >
          </a>
        </div>
      </header>

      <div
        class="ad-slot ad-slot--under-header"
        id="header-ad-slot"
      ></div>
    `;

    injectHeaderAd(
      document.getElementById('header-ad-slot')
    );
  }

  function injectHeaderAd(container) {
    if (!container) return;

    if (
      container.dataset.injected === 'true'
    ) {
      return;
    }

    container.dataset.injected = 'true';

    const script =
      document.createElement('script');

    script.async = true;
    script.setAttribute(
      'data-cfasync',
      'false'
    );

    script.src =
      'https://pl30972435.profitableratecpmnetwork.com/2d6b46676c10234a8731ba94f0111059/invoke.js';

    const div =
      document.createElement('div');

    div.id =
      'container-2d6b46676c10234a8731ba94f0111059';

    container.appendChild(script);
    container.appendChild(div);
  }

  /* =========================
     Global Ads
     ========================= */

  function injectGlobalAdScripts() {
    if (
      !document.body ||
      document.body.dataset.globalAdsInjected === 'true'
    ) {
      return;
    }

    document.body.dataset.globalAdsInjected =
      'true';

    const srcs = [
      'https://pl30972434.profitableratecpmnetwork.com/5d/cb/c4/5dcbc48828059421881a9fb4cc6cbce5.js',
      'https://pl30972436.profitableratecpmnetwork.com/b1/ba/7f/b1ba7f77f910a4b42aa63b1b0f9fe466.js'
    ];

    srcs.forEach(src => {
      const script =
        document.createElement('script');

      script.src = src;
      script.async = true;

      document.body.appendChild(script);
    });
  }

  /* =========================
     Dynamic 320x50
     ========================= */

  function createDynamicAd320() {
    const iframe =
      document.createElement('iframe');

    iframe.setAttribute(
      'scrolling',
      'no'
    );

    iframe.setAttribute(
      'loading',
      'lazy'
    );

    iframe.setAttribute(
      'title',
      'إعلان'
    );

    iframe.style.width = '100%';
    iframe.style.maxWidth = '336px';
    iframe.style.minHeight = '50px';
    iframe.style.height = '50px';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';

    iframe.srcdoc =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<style>' +
      'html,body{' +
      'margin:0;' +
      'padding:0;' +
      'background:transparent;' +
      'overflow:hidden;' +
      '}' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<script src="/320-50.js"><\\/script>' +
      '</body>' +
      '</html>';

    iframe.addEventListener(
      'load',
      () => {
        try {
          const doc =
            iframe.contentDocument;

          if (!doc || !doc.body) return;

          const resize = () => {
            const h =
              doc.body.scrollHeight;

            if (h > 10) {
              iframe.style.height =
                h + 'px';
            }
          };

          resize();

          setTimeout(resize, 400);
          setTimeout(resize, 1200);

        } catch (e) {
          // تجاهل
        }
      }
    );

    return iframe;
  }

  function makeAdSlotWrap() {
    const wrap =
      document.createElement('div');

    wrap.className =
      'ad-slot ad-slot--inline320';

    const inner =
      document.createElement('div');

    inner.className =
      'ad-slot__frame-wrap';

    inner.appendChild(
      createDynamicAd320()
    );

    wrap.appendChild(inner);

    return wrap;
  }

  /* =========================
     Footer
     ========================= */

  function renderFooter(targetSelector) {
    const target =
      document.querySelector(targetSelector);

    if (!target) return;

    target.innerHTML = `
      <footer class="site-footer">
        <p class="site-footer__line">
          Copyright:
          <span class="site-footer__brand">
            ATTACK N' DESROY
          </span>
        </p>

        <p class="site-footer__line">
          Powered By:
          <span class="site-footer__brand">
            ATTACK N' DESTROY
          </span>
        </p>
      </footer>
    `;
  }

  /* =========================
     Favicon
     ========================= */

  function ensureFavicon() {
    if (
      document.querySelector(
        'link[rel="icon"]'
      )
    ) {
      return;
    }

    const link =
      document.createElement('link');

    link.rel = 'icon';
    link.href = FAVICON;

    document.head.appendChild(link);
  }

  /* =========================
     Toast
     ========================= */

  let toastTimer = null;

  function showToast(message, type) {
    let el =
      document.getElementById(
        'mlib-toast'
      );

    if (!el) {
      el =
        document.createElement('div');

      el.id = 'mlib-toast';
      el.className = 'toast';

      document.body.appendChild(el);
    }

    el.textContent = message;

    el.className =
      'toast is-visible' +
      (
        type === 'error'
          ? ' is-error'
          : type === 'success'
            ? ' is-success'
            : ''
      );

    clearTimeout(toastTimer);

    toastTimer =
      setTimeout(() => {
        el.classList.remove(
          'is-visible'
        );
      }, 3200);
  }

  /* =========================
     Clipboard
     ========================= */

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(
        text
      );

      return true;

    } catch (e) {

      try {
        const ta =
          document.createElement(
            'textarea'
          );

        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';

        document.body.appendChild(ta);

        ta.select();

        document.execCommand('copy');

        document.body.removeChild(ta);

        return true;

      } catch (e2) {
        return false;
      }
    }
  }

  /* =========================
     HTML Escape
     ========================= */

  function escapeHtml(str) {
    if (
      str === null ||
      typeof str === 'undefined'
    ) {
      return '';
    }

    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  /* =========================
     Public API
     ========================= */

  return {
    b64Encode,
    b64Decode,

    isLikelyValidUrl,
    resolveDownloadUrl,

    fetchMods,
    sortByIdDesc,
    sortByIdAsc,
    highestId,

    getValidId,

    modUrl,
    fullModUrl,
    toModDetailsUrl,

    markAllowed,
    isAllowed,

    renderHeader,
    injectHeaderAd,
    injectGlobalAdScripts,

    createDynamicAd320,
    makeAdSlotWrap,

    renderFooter,
    ensureFavicon,

    showToast,
    copyToClipboard,
    escapeHtml
  };

})();