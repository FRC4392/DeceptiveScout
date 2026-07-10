// Dynamically loads the six files for the active config folder (picked by
// config/active.js) via injected <script> tags — same file://-compatible
// mechanism as a static <script src>, just parameterized by the active
// slug instead of hardcoded in index.html. app.js waits for DS.onConfigReady
// before booting, since these load in parallel and may finish after
// DOMContentLoaded.

window.DS = window.DS || {};

(function () {
  const PAGES = ['meta', 'prematch', 'auto', 'teleop', 'endgame', 'postmatch'];
  const slug = window.DS_ACTIVE_CONFIG || '2026-example';
  const base = `config/${slug}/`;

  let remaining = PAGES.length;
  let isReady = false;
  const readyCallbacks = [];

  function checkDone() {
    remaining -= 1;
    if (remaining > 0) return;
    isReady = true;
    for (const fn of readyCallbacks) fn();
  }

  for (const page of PAGES) {
    const script = document.createElement('script');
    script.src = base + page + '.js';
    script.onload = checkDone;
    script.onerror = () => {
      console.warn('[DeceptiveScout] Failed to load config file:', script.src);
      checkDone();
    };
    document.head.appendChild(script);
  }

  DS.onConfigReady = function (fn) {
    if (isReady) fn();
    else readyCallbacks.push(fn);
  };
})();
