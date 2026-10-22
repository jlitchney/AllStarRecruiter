/*
 * Demo booking tracking
 * - Remembers UTM params from the landing page for the rest of the visit.
 * - Shows Calendly on this site, passing those UTMs to Calendly:
 *   - Pages with a [data-calendly-inline] block get the calendar embedded there.
 *     It preloads shortly after the page loads, and every Calendly link on the
 *     page scrolls down to it.
 *   - Other pages open Calendly links in a popup.
 * - When a meeting is booked, fires the Google Ads "Demo Booked" conversion
 *   a GA4 "demo_booked" event, and the OpenAI Pixel "appointment_scheduled" event.
 */
(function () {
  var ADS_CONVERSION = 'AW-18502172216/rnBXCPThpJcdELj8wvZE';
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var STORAGE_KEY = 'asr_utms';
  var LINK_SELECTOR = 'a[href*="calendly.com/"]';

  // --- UTM capture: a new landing with UTMs replaces any stored ones ---
  function readStoredUtms() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
  }

  var params = new URLSearchParams(window.location.search);
  var utms = {};
  UTM_KEYS.forEach(function (k) { if (params.get(k)) utms[k] = params.get(k); });
  if (Object.keys(utms).length) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms)); } catch (e) {}
  } else {
    utms = readStoredUtms();
  }

  // embed_domain/embed_type make Calendly post booking events back to this page
  function embedUrl(url, type) {
    var u = new URL(url);
    UTM_KEYS.forEach(function (k) { if (utms[k]) u.searchParams.set(k, utms[k]); });
    u.searchParams.set('embed_domain', window.location.host);
    u.searchParams.set('embed_type', type);
    return u.toString();
  }

  function makeFrame(src) {
    var frame = document.createElement('iframe');
    frame.title = 'Schedule a demo';
    frame.src = src;
    return frame;
  }

  var style = document.createElement('style');
  style.textContent =
    '.asr-cal-inline{width:100%;max-width:1000px;margin:0 auto;background:#fff;border-radius:10px;' +
      'overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.25);position:relative}' +
    '.asr-cal-inline iframe{position:relative;display:block;width:100%;height:700px;border:0}' +
    '.asr-cal-inline iframe.asr-cal-warm{position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:-1}' +
    '.asr-cal-spin{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
      'color:#245194;font:600 15px system-ui,sans-serif}' +
    '.asr-cal{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;' +
      'background:rgba(31,31,31,.6);padding:16px}' +
    '.asr-cal.open{display:flex}' +
    '.asr-cal-box{position:relative;width:100%;max-width:1000px;height:min(700px,calc(100vh - 32px));' +
      'background:#fff;border-radius:8px;overflow:hidden}' +
    '.asr-cal-box iframe{position:relative;width:100%;height:100%;border:0}' +
    '.asr-cal-close{position:absolute;top:8px;right:12px;z-index:1;width:36px;height:36px;border:0;' +
      'border-radius:50%;background:#fff;color:#333;font-size:26px;line-height:1;cursor:pointer;' +
      'box-shadow:0 1px 4px rgba(0,0,0,.25)}' +
    'body.asr-cal-lock{overflow:hidden}';
  document.head.appendChild(style);

  var inline = document.querySelector('[data-calendly-inline]');

  if (inline) {
    // --- Inline calendar ---
    var inlineFrame;
    // Chrome pauses off-screen iframes from other sites, so a calendar preloaded
    // in place wouldn't render until it scrolled into view. While preloading
    // ("warm"), the iframe is pinned on-screen but transparent and behind the
    // page; reveal() puts it back in the section. Repositioning doesn't reload it.
    var loadInline = function (warm) {
      if (inlineFrame) return;
      inline.classList.add('asr-cal-inline');
      inline.innerHTML = '<div class="asr-cal-spin">Loading calendar…</div>';
      inlineFrame = makeFrame(embedUrl(inline.getAttribute('data-calendly-inline'), 'Inline'));
      if (warm) {
        inlineFrame.className = 'asr-cal-warm';
        inlineFrame.style.width = inline.clientWidth + 'px';
        inlineFrame.setAttribute('tabindex', '-1');
        inlineFrame.setAttribute('aria-hidden', 'true');
      }
      inline.appendChild(inlineFrame);
    };
    var reveal = function () {
      loadInline(false);
      if (inlineFrame.className !== 'asr-cal-warm') return;
      inlineFrame.className = '';
      inlineFrame.style.width = '';
      inlineFrame.removeAttribute('tabindex');
      inlineFrame.removeAttribute('aria-hidden');
    };
    if ('IntersectionObserver' in window) {
      // Show the calendar in place before it scrolls into view
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.isIntersecting; })) { io.disconnect(); reveal(); }
      }, { rootMargin: '800px 0px' });
      io.observe(inline);
    } else {
      reveal();
    }
    // Preload a few seconds after the page itself has loaded, unless the visitor saves data
    var preloadSoon = function () {
      setTimeout(function () {
        var conn = navigator.connection;
        if (!(conn && conn.saveData)) loadInline(true);
      }, 3000);
    };
    if (document.readyState === 'complete') preloadSoon();
    else window.addEventListener('load', preloadSoon);

    // Calendly reports its content height; size the iframe to fit (no inner scrollbar)
    window.addEventListener('message', function (e) {
      if (e.origin !== 'https://calendly.com' || !inlineFrame || e.source !== inlineFrame.contentWindow) return;
      if (!e.data || e.data.event !== 'calendly.page_height') return;
      var h = parseInt(e.data.payload && e.data.payload.height, 10);
      // Ignore the tiny heights Calendly reports while it's still loading
      if (h >= 400) inlineFrame.style.height = h + 'px';
    });

    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest(LINK_SELECTOR);
      if (!link) return;
      e.preventDefault();
      reveal();
      (inline.closest('section') || inline).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } else {
    // --- Popup ---
    var overlay, popupFrame, popupSrc;
    var buildPopup = function (url) {
      var src = embedUrl(url, 'PopupText');
      if (overlay && popupSrc === src) return;
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'asr-cal';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Schedule a demo');
        overlay.innerHTML =
          '<div class="asr-cal-box"><div class="asr-cal-spin">Loading calendar…</div>' +
          '<button type="button" class="asr-cal-close" aria-label="Close">&times;</button></div>';
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay || e.target.closest('.asr-cal-close')) closePopup();
        });
        document.body.appendChild(overlay);
      }
      if (popupFrame) popupFrame.remove();
      popupSrc = src;
      popupFrame = makeFrame(src);
      overlay.querySelector('.asr-cal-box').appendChild(popupFrame);
    };
    var closePopup = function () {
      overlay.classList.remove('open');
      document.body.classList.remove('asr-cal-lock');
    };

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closePopup();
    });

    // Start loading Calendly as soon as the visitor reaches for the button
    ['pointerover', 'touchstart', 'focusin'].forEach(function (type) {
      document.addEventListener(type, function (e) {
        var link = e.target.closest && e.target.closest(LINK_SELECTOR);
        if (link) buildPopup(link.href);
      }, { passive: true });
    });

    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest(LINK_SELECTOR);
      if (!link) return;
      e.preventDefault();
      buildPopup(link.href);
      overlay.classList.add('open');
      document.body.classList.add('asr-cal-lock');
    });
  }

  // --- Conversion when a meeting is booked ---
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://calendly.com') return;
    if (!e.data || e.data.event !== 'calendly.event_scheduled') return;
    if (typeof oaiq === 'function') {
      oaiq('measure', 'appointment_scheduled', { type: 'customer_action' });
    }
    if (typeof gtag !== 'function') return;
    gtag('event', 'conversion', { send_to: ADS_CONVERSION });
    gtag('event', 'demo_booked', {
      page_location: window.location.href,
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign
    });
  });
})();
