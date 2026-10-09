/*
 * Demo booking tracking
 * - Remembers UTM params from the landing page for the rest of the visit.
 * - Opens Calendly links in a popup on this site, passing those UTMs to Calendly.
 * - When a meeting is booked, fires the Google Ads "Demo Booked" conversion
 *   and a GA4 "demo_booked" event.
 */
(function () {
  var ADS_CONVERSION = 'AW-18502172216/rnBXCPThpJcdELj8wvZE';
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var STORAGE_KEY = 'asr_utms';

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

  function withUtms(url) {
    var u = new URL(url);
    UTM_KEYS.forEach(function (k) { if (utms[k]) u.searchParams.set(k, utms[k]); });
    return u.toString();
  }

  // --- Calendly popup ---
  var head = document.head;
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://assets.calendly.com/assets/external/widget.css';
  head.appendChild(css);
  var js = document.createElement('script');
  js.src = 'https://assets.calendly.com/assets/external/widget.js';
  js.async = true;
  head.appendChild(js);

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href*="calendly.com/"]');
    if (!link) return;
    e.preventDefault();
    var url = withUtms(link.href);
    if (window.Calendly && Calendly.initPopupWidget) {
      Calendly.initPopupWidget({ url: url });
    } else {
      // Widget not loaded (blocked or slow): fall back to a new tab, still with UTMs
      window.open(url, '_blank', 'noopener');
    }
  });

  // --- Conversion when a meeting is booked ---
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://calendly.com') return;
    if (!e.data || e.data.event !== 'calendly.event_scheduled') return;
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
