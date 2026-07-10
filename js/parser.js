// Markdown-native config grammar parser.
//
// Field line:   - <Label> {type:<t>} {code:<c>} [{attr:value} ...] [required]
// Choice sub-list (only consumed when the parent field's type is "choice"):
//               - <value> | <Label>
// Meta line:    - {key:value}
//
// Never throws on malformed input — a bad line degrades to a warning
// (skipped) or an inline "Config error" field, so one typo can't blank
// an entire page.

window.DS = window.DS || {};

(function () {

const HEADING_RE = /^\s*#/;
const TOP_BULLET_RE = /^-\s+(.*)$/;
const SUB_BULLET_RE = /^\s+-\s+(.*)$/;
const ATTR_TOKEN_RE = /\{([^}]+)\}/g;
const REQUIRED_WORD_RE = /\brequired\b/;
const META_LINE_RE = /^-\s*\{([^}]+)\}\s*$/;

function splitLines(text) {
  return text.split(/\r\n|\r|\n/);
}

function parseAttrTokens(rest) {
  const attrs = {};
  const tokens = [...rest.matchAll(ATTR_TOKEN_RE)].map((m) => m[1]);
  for (const tok of tokens) {
    const idx = tok.indexOf(':');
    if (idx === -1) {
      console.warn('[DeceptiveScout] Malformed attribute (no colon):', tok);
      continue;
    }
    const key = tok.slice(0, idx).trim();
    const value = tok.slice(idx + 1).trim();
    if (key) attrs[key] = value;
  }
  return { attrs, tokenCount: tokens.length };
}

function parseChoiceLine(rawContent) {
  const pipeIdx = rawContent.indexOf('|');
  if (pipeIdx === -1) {
    const value = rawContent.trim();
    return { value, label: value };
  }
  const value = rawContent.slice(0, pipeIdx).trim();
  const label = rawContent.slice(pipeIdx + 1).trim();
  return { value, label: label || value };
}

function configErrorField(code, message) {
  return {
    label: message,
    type: 'text',
    code,
    role: null,
    required: false,
    attrs: { disabled: 'true' },
    choices: null,
    error: true,
  };
}

/**
 * Parse a single page's markdown source into an ordered array of field
 * definitions.
 * @param {string} text
 * @returns {Array<object>} field definitions
 */
function parsePageMarkdown(text) {
  const lines = splitLines(text);
  const fields = [];
  let i = 0;
  let errCounter = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '' || HEADING_RE.test(line)) {
      i += 1;
      continue;
    }

    const topMatch = TOP_BULLET_RE.exec(line);
    if (!topMatch) {
      // Indented/stray line with no owning top-level field — ignore.
      i += 1;
      continue;
    }

    const rest = topMatch[1];
    const withoutAttrs = rest.replace(ATTR_TOKEN_RE, '');
    const hasRequiredWord = REQUIRED_WORD_RE.test(withoutAttrs);
    const label = withoutAttrs.replace(REQUIRED_WORD_RE, '').trim();
    const { attrs, tokenCount } = parseAttrTokens(rest);

    i += 1;

    if (tokenCount === 0) {
      console.warn('[DeceptiveScout] Skipping bullet with no attributes:', line);
      continue;
    }

    if (!attrs.type || !attrs.code) {
      errCounter += 1;
      fields.push(
        configErrorField(
          attrs.code || `err${errCounter}`,
          `Config error: missing type/code near "${label || line.trim()}"`
        )
      );
      // Still consume any indented sub-list so it doesn't leak into the next field.
      while (i < lines.length && SUB_BULLET_RE.test(lines[i])) i += 1;
      continue;
    }

    const field = {
      label,
      type: attrs.type,
      code: attrs.code,
      role: attrs.role || null,
      required: hasRequiredWord || attrs.required === 'true' || !!attrs.role,
      attrs,
      choices: null,
    };

    if (field.type === 'choice') {
      const choices = [];
      while (i < lines.length && SUB_BULLET_RE.test(lines[i])) {
        const subMatch = SUB_BULLET_RE.exec(lines[i]);
        choices.push(parseChoiceLine(subMatch[1]));
        i += 1;
      }
      field.choices = choices;
    } else {
      // Non-choice fields don't use sub-lists — skip/ignore any stray ones.
      while (i < lines.length && SUB_BULLET_RE.test(lines[i])) i += 1;
    }

    fields.push(field);
  }

  return fields;
}

/**
 * Parse meta's flat `- {key:value}` lines into a plain object.
 * @param {string} text
 * @returns {Record<string, string>}
 */
function parseMeta(text) {
  const meta = {};
  for (const rawLine of splitLines(text)) {
    const line = rawLine.trim();
    if (line === '' || HEADING_RE.test(line)) continue;
    const m = META_LINE_RE.exec(line);
    if (!m) continue;
    const idx = m[1].indexOf(':');
    if (idx === -1) continue;
    const key = m[1].slice(0, idx).trim();
    const value = m[1].slice(idx + 1).trim();
    if (key) meta[key] = value;
  }
  return meta;
}

DS.parser = { parsePageMarkdown, parseMeta };

})();
