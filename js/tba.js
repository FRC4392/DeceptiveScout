window.DS = window.DS || {};

(function () {
  const TBA_BASE = 'https://www.thebluealliance.com/api/v3';
  const KEY_STORAGE = 'deceptivescout.tbaKey';
  const CACHE_PREFIX = 'deceptivescout.tbaCache.';

  function getTbaKey() {
    try {
      const stored = localStorage.getItem(KEY_STORAGE);
      if (stored) return stored;
    } catch {
      // ignore
    }
    // Per-device override (Settings dialog) takes priority; otherwise fall
    // back to the team-wide default shipped via local-config.js, so every
    // scouter's device works out of the box without entering a key.
    return (window.DS_CONFIG && window.DS_CONFIG.tbaKey) || '';
  }

  function setTbaKey(key) {
    try {
      if (key) localStorage.setItem(KEY_STORAGE, key);
      else localStorage.removeItem(KEY_STORAGE);
    } catch {
      // Storage unavailable (private browsing, full quota) — degrade silently.
    }
  }

  function cacheKey(eventCode) {
    return CACHE_PREFIX + eventCode;
  }

  function readCache(eventCode) {
    try {
      const raw = localStorage.getItem(cacheKey(eventCode));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeCache(eventCode, teams, matches) {
    try {
      localStorage.setItem(
        cacheKey(eventCode),
        JSON.stringify({ teams, matches, cachedAt: Date.now() })
      );
    } catch {
      // Storage unavailable — offline fallback just won't have this event cached.
    }
  }

  async function tbaFetch(path) {
    const key = getTbaKey();
    if (!key) return null;
    try {
      const res = await fetch(TBA_BASE + path, { headers: { 'X-TBA-Auth-Key': key } });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetch an event's team list and match schedule. On success, caches the
   * result to localStorage keyed by event code. If the network/API is
   * unreachable (e.g. offline at a competition), falls back to the most
   * recent successful fetch for that event, so the app stays usable offline
   * once a schedule has been loaded at least once.
   */
  async function loadEventData(eventCode) {
    if (!eventCode) return { teams: [], matches: [] };

    const [teams, matches] = await Promise.all([
      tbaFetch(`/event/${eventCode}/teams/simple`),
      tbaFetch(`/event/${eventCode}/matches/simple`),
    ]);

    if (teams && matches) {
      writeCache(eventCode, teams, matches);
      return { teams, matches };
    }

    const cached = readCache(eventCode);
    if (cached) return { teams: cached.teams, matches: cached.matches };

    return { teams: teams || [], matches: matches || [] };
  }

  const LEVEL_TO_COMP_LEVEL = { qm: 'qm', sf: 'sf', f: 'f' };

  /**
   * Look up the scheduled team for a given event/level/match/robot-slot
   * combination against a previously loaded {teams, matches} bundle.
   * Returns { teamNumber, nickname } or null if no match/data is found.
   */
  function lookupTeamFromSchedule({ teams, matches }, { eventCode, level, matchNum, robot }) {
    if (!matches?.length || !eventCode || !level || !matchNum || !robot) return null;

    const compLevel = LEVEL_TO_COMP_LEVEL[level] || level;
    const match = matches.find(
      (m) => m.comp_level === compLevel && String(m.match_number) === String(matchNum)
    );
    if (!match) return null;

    const alliance = robot[0] === 'r' ? 'red' : 'blue';
    const idx = Number(robot[1]) - 1;
    const teamKeys = match.alliances?.[alliance]?.team_keys;
    if (!teamKeys || !teamKeys[idx]) return null;

    const teamKey = teamKeys[idx];
    const teamNumber = teamKey.replace('frc', '');
    const teamInfo = (teams || []).find((t) => t.key === teamKey);
    return { teamNumber, nickname: teamInfo?.nickname || '' };
  }

  DS.tba = { getTbaKey, setTbaKey, loadEventData, lookupTeamFromSchedule };
})();
