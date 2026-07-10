const TBA_BASE = 'https://www.thebluealliance.com/api/v3';
const KEY_STORAGE = 'deceptivescout.tbaKey';

export function getTbaKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setTbaKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    // Storage unavailable (private browsing, full quota) — degrade silently.
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
 * Fetch an event's team list and match schedule. Resolves to empty arrays
 * (never rejects) if no key is configured or the network/API is unreachable.
 */
export async function loadEventData(eventCode) {
  if (!eventCode) return { teams: [], matches: [] };
  const [teams, matches] = await Promise.all([
    tbaFetch(`/event/${eventCode}/teams/simple`),
    tbaFetch(`/event/${eventCode}/matches/simple`),
  ]);
  return { teams: teams || [], matches: matches || [] };
}

const LEVEL_TO_COMP_LEVEL = { qm: 'qm', sf: 'sf', f: 'f' };

/**
 * Look up the scheduled team for a given event/level/match/robot-slot
 * combination against a previously loaded {teams, matches} bundle.
 * Returns { teamNumber, nickname } or null if no match/data is found.
 */
export function lookupTeamFromSchedule({ teams, matches }, { eventCode, level, matchNum, robot }) {
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
