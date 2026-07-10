export const PAGE_ORDER = ['prematch', 'auto', 'teleop', 'endgame', 'postmatch'];

const CHECKBOX_CHARS = {
  YN: ['Y', 'N'],
  TF: ['T', 'F'],
  10: ['1', '0'],
};

function sanitize(str) {
  return str.replace(/"/g, '').replace(/;/g, '-').replace(/\t/g, ' ');
}

/**
 * Walk scoutState.values in field-definition order across all pages and
 * produce an ordered [{code, value}] list ready for serialization.
 */
export function collectData(scoutState, checkboxAs) {
  const [onChar, offChar] = CHECKBOX_CHARS[checkboxAs] || CHECKBOX_CHARS['10'];
  const parts = [];

  for (const page of PAGE_ORDER) {
    for (const def of scoutState.pageDefs[page] || []) {
      const raw = scoutState.values.get(def.code);
      let out;
      if (def.type === 'toggle') {
        out = raw ? onChar : offChar;
      } else if (Array.isArray(raw)) {
        out = raw.join('|');
      } else {
        out = (raw ?? '').toString();
      }
      parts.push({ code: def.code, value: sanitize(out) });
    }
  }

  return parts;
}

export function serialize(parts, format) {
  if (format === 'kvs') return parts.map((p) => `${p.code}=${p.value}`).join(';');
  return parts.map((p) => p.value).join('\t');
}
