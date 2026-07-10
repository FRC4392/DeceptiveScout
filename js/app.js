import { parsePageMarkdown, parseMeta } from './parser.js';
import { renderPage } from './render.js';
import { collectData, serialize } from './data.js';
import { initQr, updateQr } from './qr.js';
import { getTbaKey, setTbaKey, loadEventData, lookupTeamFromSchedule } from './tba.js';
import { initThemeToggle } from './theme.js';

const CONFIG_SLUG = '2026-example';
const CONFIG_BASE = `config/${CONFIG_SLUG}/`;
const DATA_PAGES = ['prematch', 'auto', 'teleop', 'endgame', 'postmatch'];
const PAGE_ORDER = [...DATA_PAGES, 'qr'];
const PAGE_TITLES = {
  prematch: 'Scouter & Team',
  auto: 'Autonomous',
  teleop: 'Teleop',
  endgame: 'Endgame',
  postmatch: 'Post-Match',
  qr: 'Submit',
};
const STORAGE_KEY = 'deceptivescout.inprogress.v1';

const scoutState = {
  meta: {},
  pageDefs: {},
  values: new Map(),
  currentPageIndex: 0,
  tba: null,
  tbaLoadedEvent: null,
  lastQrText: '',
};

// ---------- Config loading ----------

async function loadConfig() {
  const metaText = await (await fetch(CONFIG_BASE + 'meta.md')).text();
  const meta = parseMeta(metaText);
  const pageDefs = {};
  for (const page of DATA_PAGES) {
    const text = await (await fetch(`${CONFIG_BASE}${page}.md`)).text();
    pageDefs[page] = parsePageMarkdown(text);
  }
  return { meta, pageDefs };
}

function fieldsByRole(pageDefs) {
  return Object.fromEntries(pageDefs.filter((f) => f.role).map((f) => [f.role, f]));
}

// ---------- Page render context ----------

function isEmpty(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function createPageContext(page) {
  const linkTargets = new Map();
  const ctx = {
    state: {
      get: (code) => scoutState.values.get(code),
      set: (code, value) => {
        scoutState.values.set(code, value);
        schedulePersist();
        if (page === 'prematch') maybeAutofillTeam();
      },
    },
    registerLinkTarget(code, api) {
      linkTargets.set(code, api);
    },
    fireLink(code, method, ...args) {
      const api = linkTargets.get(code);
      if (api && typeof api[method] === 'function') api[method](...args);
    },
    bumpCounter(code, delta) {
      ctx.fireLink(code, 'bump', delta);
    },
  };
  return ctx;
}

// ---------- TBA autofill ----------

async function maybeAutofillTeam() {
  const roles = fieldsByRole(scoutState.pageDefs.prematch || []);
  const { event: eventField, level: levelField, match: matchField, robot: robotField, team: teamField } = roles;
  if (!eventField || !levelField || !matchField || !robotField || !teamField) return;
  if (!getTbaKey()) return;

  const eventCode = scoutState.values.get(eventField.code);
  const level = scoutState.values.get(levelField.code);
  const matchNum = scoutState.values.get(matchField.code);
  const robot = scoutState.values.get(robotField.code);

  if (eventCode && eventCode !== scoutState.tbaLoadedEvent) {
    scoutState.tbaLoadedEvent = eventCode;
    scoutState.tba = await loadEventData(eventCode);
  }
  if (!scoutState.tba) return;

  const result = lookupTeamFromSchedule(scoutState.tba, { eventCode, level, matchNum, robot });
  if (!result) return;

  const teamWrap = document.querySelector(`[data-code="${teamField.code}"]`);
  if (!teamWrap) return;

  const input = teamWrap.querySelector('input');
  if (input && input.value !== result.teamNumber) {
    input.value = result.teamNumber;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  let hint = teamWrap.querySelector('.team-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'team-hint';
    teamWrap.appendChild(hint);
  }
  hint.textContent = result.nickname ? `You are scouting: ${result.nickname}` : '';
}

// ---------- Validation banner ----------

function collectMissingRequired(fields) {
  return fields.filter((f) => f.required && isEmpty(scoutState.values.get(f.code))).map((f) => f.label);
}

function showValidationBanner(missingLabels) {
  const banner = document.getElementById('prematch-validation');
  banner.hidden = false;
  banner.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = 'Please fill in all required fields before continuing:';
  const ul = document.createElement('ul');
  for (const label of missingLabels) {
    const li = document.createElement('li');
    li.textContent = label;
    ul.appendChild(li);
  }
  banner.append(p, ul);
}

function hideValidationBanner() {
  const banner = document.getElementById('prematch-validation');
  if (banner) banner.hidden = true;
}

// ---------- Page rendering / navigation ----------

function initPhaseStrip() {
  const dotsContainer = document.getElementById('phase-dots');
  dotsContainer.innerHTML = '';
  for (const _ of PAGE_ORDER) {
    const dot = document.createElement('div');
    dot.className = 'phase-dot';
    dotsContainer.appendChild(dot);
  }
}

function updatePhaseStrip() {
  const dots = document.querySelectorAll('#phase-dots .phase-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('is-complete', i < scoutState.currentPageIndex);
    dot.classList.toggle('is-active', i === scoutState.currentPageIndex);
  });
  document.getElementById('phase-label').textContent = PAGE_TITLES[PAGE_ORDER[scoutState.currentPageIndex]];
}

function updateNavButtons() {
  const idx = scoutState.currentPageIndex;
  document.getElementById('prev-btn').disabled = idx === 0;
  document.querySelector('.page-nav').style.display = PAGE_ORDER[idx] === 'qr' ? 'none' : 'flex';
}

function renderCurrentPage() {
  const page = PAGE_ORDER[scoutState.currentPageIndex];
  document.querySelectorAll('.page-panel').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.page === page);
  });
  updatePhaseStrip();

  if (page === 'qr') {
    renderQrPage();
  } else {
    hideValidationBanner();
    const container = document.getElementById(`fields-${page}`);
    renderPage(container, scoutState.pageDefs[page] || [], createPageContext(page));
  }

  updateNavButtons();
}

function navigateNext() {
  const page = PAGE_ORDER[scoutState.currentPageIndex];
  if (page === 'prematch') {
    const missing = collectMissingRequired(scoutState.pageDefs.prematch || []);
    if (missing.length) {
      showValidationBanner(missing);
      return;
    }
  }
  if (scoutState.currentPageIndex < PAGE_ORDER.length - 1) {
    scoutState.currentPageIndex += 1;
    renderCurrentPage();
    schedulePersist();
    window.scrollTo(0, 0);
  }
}

function navigatePrev() {
  if (scoutState.currentPageIndex > 0) {
    scoutState.currentPageIndex -= 1;
    renderCurrentPage();
    schedulePersist();
    window.scrollTo(0, 0);
  }
}

function setupSwipe() {
  const shell = document.getElementById('page-shell');
  let startX = 0;
  let startY = 0;

  shell.addEventListener(
    'touchstart',
    (e) => {
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;
    },
    { passive: true }
  );

  shell.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) navigateNext();
      else navigatePrev();
    },
    { passive: true }
  );
}

// ---------- QR / submit page ----------

function renderQrPage() {
  const roles = fieldsByRole(scoutState.pageDefs.prematch || []);
  const val = (role) => {
    const field = roles[role];
    if (!field) return '';
    const v = scoutState.values.get(field.code);
    return v === undefined || v === null ? '' : v;
  };

  document.getElementById('qr-header').textContent =
    `Event: ${val('event')}   Level: ${val('level')}   Match: ${val('match')}   ` +
    `Robot: ${val('robot')}   Team: ${val('team')}`;

  const parts = collectData(scoutState, scoutState.meta.checkboxAs || '10');
  const format = scoutState.meta.dataFormat || 'tsv';
  const text = serialize(parts, format);
  scoutState.lastQrText = text;

  updateQr(text);
  document.getElementById('raw-data-panel').textContent = text;
}

async function copyRawData() {
  const text = scoutState.lastQrText || '';
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // fall through to legacy fallback
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    // clipboard unavailable — user can select the raw-data panel manually
  }
  document.body.removeChild(ta);
}

function resetMatch() {
  scoutState.values.clear();
  scoutState.currentPageIndex = 0;
  scoutState.tba = null;
  scoutState.tbaLoadedEvent = null;
  clearPersisted();
  renderCurrentPage();
  window.scrollTo(0, 0);
}

function setupQrPageControls() {
  document.getElementById('copy-btn').addEventListener('click', copyRawData);

  const rawPanel = document.getElementById('raw-data-panel');
  const toggleRawBtn = document.getElementById('toggle-raw-btn');
  toggleRawBtn.addEventListener('click', () => {
    rawPanel.hidden = !rawPanel.hidden;
    toggleRawBtn.textContent = rawPanel.hidden ? 'Show Raw Data' : 'Hide Raw Data';
  });

  const clearBtn = document.getElementById('clear-btn');
  let armed = false;
  let armTimeout = null;
  clearBtn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      clearBtn.classList.add('is-armed');
      clearBtn.textContent = 'Tap again to confirm';
      armTimeout = setTimeout(() => {
        armed = false;
        clearBtn.classList.remove('is-armed');
        clearBtn.textContent = 'Clear Form';
      }, 4000);
      return;
    }
    clearTimeout(armTimeout);
    armed = false;
    clearBtn.classList.remove('is-armed');
    clearBtn.textContent = 'Clear Form';
    resetMatch();
  });
}

// ---------- Persistence ----------

let persistTimeout = null;

function schedulePersist() {
  clearTimeout(persistTimeout);
  persistTimeout = setTimeout(persistNow, 250);
}

function persistNow() {
  try {
    const record = {
      configSlug: CONFIG_SLUG,
      values: Array.from(scoutState.values.entries()),
      currentPageIndex: scoutState.currentPageIndex,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable — degrade to in-memory-only.
  }
}

function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function maybeShowResumeBanner() {
  const saved = loadPersisted();
  if (!saved || saved.configSlug !== CONFIG_SLUG || !Array.isArray(saved.values) || saved.values.length === 0) {
    return;
  }

  const savedDate = new Date(saved.savedAt);
  const sameDay = savedDate.toDateString() === new Date().toDateString();
  if (!sameDay) {
    clearPersisted();
    return;
  }

  const banner = document.getElementById('resume-banner');
  banner.hidden = false;

  document.getElementById('resume-btn').onclick = () => {
    scoutState.values = new Map(saved.values);
    scoutState.currentPageIndex = saved.currentPageIndex || 0;
    banner.hidden = true;
    renderCurrentPage();
  };

  document.getElementById('discard-btn').onclick = () => {
    clearPersisted();
    banner.hidden = true;
  };
}

// ---------- Settings dialog (TBA key) ----------

function setupSettingsDialog() {
  const dialog = document.getElementById('settings-dialog');
  const input = document.getElementById('tba-key-input');

  document.getElementById('settings-btn').addEventListener('click', () => {
    input.value = getTbaKey();
    dialog.showModal();
  });
  document.getElementById('close-settings-btn').addEventListener('click', () => dialog.close());
  document.getElementById('save-key-btn').addEventListener('click', () => {
    setTbaKey(input.value.trim());
    dialog.close();
  });
  document.getElementById('clear-key-btn').addEventListener('click', () => {
    setTbaKey('');
    input.value = '';
    scoutState.tba = null;
    scoutState.tbaLoadedEvent = null;
  });
}

// ---------- Boot ----------

async function boot() {
  const { meta, pageDefs } = await loadConfig();
  scoutState.meta = meta;
  scoutState.pageDefs = pageDefs;

  console.info('[DeceptiveScout] Loaded config', { meta, pageDefs });

  document.getElementById('header-title').textContent = meta.title || 'DeceptiveScout';

  initQr(document.getElementById('qr-code-container'));
  initThemeToggle(document.getElementById('theme-toggle'));
  initPhaseStrip();
  setupSettingsDialog();
  setupQrPageControls();
  setupSwipe();

  document.getElementById('next-btn').addEventListener('click', navigateNext);
  document.getElementById('prev-btn').addEventListener('click', navigatePrev);

  renderCurrentPage();
  maybeShowResumeBanner();
}

document.addEventListener('DOMContentLoaded', boot);
