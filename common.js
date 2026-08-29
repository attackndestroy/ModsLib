/* =========================================================
   ModsLib — common.js
   الوظائف المشتركة بين جميع صفحات الموقع
   ========================================================= */

const ModsLib = (() => {

  const DATA_URL = '/mods.json';
  const HEADER_IMG = '/header.png';
  const FAVICON = '/fav.ico';

  /* =========================================================
     Base64 — UTF-8 آمن
     ========================================================= */

  function b64Encode(str) {
    try {
      return btoa(unescape(encodeURIComponent(String(str))));
    } catch (e) {
      console.error('B64 encode failed', e);
      return '';
    }
  }

  function b64Decode(str) {
    try {
      return decodeURIComponent(escape(atob(String(str))));
    } catch (e) {
      console.error('B64 decode failed', e);
      return '';
    }
  }

  /* =========================================================
     URL Validation
     ========================================================= */

  function isLikelyValidUrl(str) {
    if (!str || typeof str !== 'string') return false;

    try {
      const u = new URL(str);

      return (
        u.protocol === 'http:' ||
        u.protocol === 'https:'
      );
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

  /* =========================================================
     جلب mods.json
     ========================================================= */

  async function fetchMods() {

    let res;

    try {
      res = await fetch(DATA_URL, {
        cache: 'no-store'
      });
    } catch (e) {
      throw new Error(
        'تعذر الاتصال بالخادم لتحميل قائمة المودات. تحقق من اتصالك بالإنترنت.'
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

  /* =========================================================
     ترتيب المودات
     ========================================================= */

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
    if (!Array.isArray(list) || !list.length) {
      return 0;
    }

    return Math.max(
      ...list.map(m => Number(m.id) || 0)
    );
  }

  /* =========================================================
     قراءة ID من الرابط
     ========================================================= */

  function getValidId() {

    const params = new URLSearchParams(
      window.location.search
    );

    const raw = params.get('id');

    if (raw === null) {
      return null;
    }

    const clean = raw.trim();

    if (!/^\d+$/.test(clean)) {
      return null;
    }

    const id = parseInt(clean, 10);

    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }

    return id;
  }

  /* =========================================================
     روابط الموقع
     
     مهم:
     toTomodUrl() = صفحة التفاصيل
     toModUrl()   = صفحة التحميل
     ========================================================= */

  function toTomodUrl(id) {
    return '/tomod.html?id=' +
      encodeURIComponent(id);
  }

  function toModUrl(id) {
    return '/mod.html?id=' +
      encodeURIComponent(id);
  }

  function fullTomodUrl(id) {
    try {
      return window.location.origin +
        toTomodUrl(id);
    } catch (e) {
      return toTomodUrl(id);
    }
  }

  function fullModUrl(id) {
    try {
      return window.location.origin +
        toModUrl(id);
    } catch (e) {
      return toModUrl(id);
    }
  }

  /* =========================================================
     حماية صفحة mod.html
     ========================================================= */

  function markAllowed(id) {
    try {
      sessionStorage.setItem(
        'allowed_mod_' + id,
        'true'
      );
    } catch (e) {
      /* local/session storage غير متاح */
    }
  }

  function isAllowed(id) {
    try {
      return sessionStorage.getItem(
        'allowed_mod_' + id
      ) === 'true';
    } catch (e) {
      return false;
    }
  }

  /*
     هذه الدالة تستخدمها mod.html.

     إذا لم يمر الزائر من tomod.html
     يتم إرساله مباشرة إلى tomod.html بنفس ID.
  */

  function protectDownloadPage(id) {

    if (!id) {
      window.location.replace('/index.html');
      return false;
    }

    if (!isAllowed(id)) {
      window.location.replace(
        toTomodUrl(id)
      );

      return false;
    }

    return true;
  }

  /* =========================================================
     Header
     ========================================================= */

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
      document.getElementById(
        'header-ad-slot'
      )
    );
  }

  /* =========================================================
     إعلان تحت الهيدر
     ========================================================= */

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

  /* =========================================================
     الإعلانات العامة
     ========================================================= */

  function injectGlobalAdScripts() {

    if (!document.body) return;

    if (
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

      document.body.appendChild(script);

    });
  }

  /* =========================================================
     إعلان 320×50
     
     يتم تحميل /320-50.js داخل iframe
     والـ iframe قابل لتغيير الارتفاع حسب المحتوى.
     ========================================================= */

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

          if (!doc || !doc.body) {
            return;
          }

          const resize = () => {

            const height =
              Math.max(
                doc.body.scrollHeight,
                doc.documentElement
                  ? doc.documentElement.scrollHeight
                  : 0
              );

            if (height > 10) {
              iframe.style.height =
                height + 'px';
            }
          };

          resize();

          setTimeout(resize, 400);
          setTimeout(resize, 1200);
          setTimeout(resize, 2500);

        } catch (e) {

          /*
             في حال تعذر الوصول لمحتوى iframe
             يبقى الارتفاع الافتراضي 50px.
          */

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

  /* =========================================================
     Footer
     ========================================================= */

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

  /* =========================================================
     Favicon
     ========================================================= */

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

  /* =========================================================
     Toast
     ========================================================= */

  let toastTimer = null;

  function showToast(message, type) {

    let el =
      document.getElementById(
        'mlib-toast'
      );

    if (!el) {

      el =
        document.createElement('div');

      el.id =
        'mlib-toast';

      el.className =
        'toast';

      document.body.appendChild(el);
    }

    el.textContent = message;

    let className =
      'toast is-visible';

    if (type === 'error') {
      className += ' is-error';
    }

    if (type === 'success') {
      className += ' is-success';
    }

    el.className = className;

    clearTimeout(toastTimer);

    toastTimer =
      setTimeout(() => {

        el.classList.remove(
          'is-visible'
        );

      }, 3200);
  }

  /* =========================================================
     Clipboard
     ========================================================= */

  async function copyToClipboard(text) {

    try {

      await navigator.clipboard.writeText(
        text
      );

      return true;

    } catch (e) {

      try {

        const textarea =
          document.createElement(
            'textarea'
          );

        textarea.value = text;

        textarea.style.position =
          'fixed';

        textarea.style.opacity =
          '0';

        document.body.appendChild(
          textarea
        );

        textarea.select();

        document.execCommand(
          'copy'
        );

        document.body.removeChild(
          textarea
        );

        return true;

      } catch (e2) {

        return false;
      }
    }
  }

  /* =========================================================
     HTML Escape
     ========================================================= */

  function escapeHtml(str) {

    if (
      str === null ||
      typeof str === 'undefined'
    ) {
      return '';
    }

    return String(str)
      .replaceAll(
        '&',
        '&amp;'
      )
      .replaceAll(
        '<',
        '&lt;'
      )
      .replaceAll(
        '>',
        '&gt;'
      )
      .replaceAll(
        '"',
        '&quot;'
      )
      .replaceAll(
        "'",
        '&#039;'
      );
  }

  /* =========================================================
     Public API
     ========================================================= */

  return {

    /* Base64 */
    b64Encode,
    b64Decode,

    /* URL */
    isLikelyValidUrl,
    resolveDownloadUrl,

    /* Data */
    fetchMods,
    sortByIdDesc,
    sortByIdAsc,
    highestId,

    /* ID */
    getValidId,

    /* Page URLs */
    toTomodUrl,
    toModUrl,
    fullTomodUrl,
    fullModUrl,

    /* Download protection */
    markAllowed,
    isAllowed,
    protectDownloadPage,

    /* Header */
    renderHeader,
    injectHeaderAd,

    /* Ads */
    injectGlobalAdScripts,
    createDynamicAd320,
    makeAdSlotWrap,

    /* Footer */
    renderFooter,

    /* Favicon */
    ensureFavicon,

    /* UI */
    showToast,
    copyToClipboard,
    escapeHtml

  };

})();