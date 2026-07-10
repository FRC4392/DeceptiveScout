// Scouting config — Post-Match page. Content is markdown, one line per
// array entry (wrapped in JS so the browser can load it via a plain
// <script> tag with no server or build step). See docs/Configuration.md.

window.DS_CONFIG = window.DS_CONFIG || {};
window.DS_CONFIG.pages = window.DS_CONFIG.pages || {};
window.DS_CONFIG.pages.postmatch = [
  '# Post-Match',
  '',
  '- Defense Rating `type:choice` `code:dr` `default:x`',
  '  - b | Below Average',
  '  - a | Average',
  '  - g | Good',
  '  - e | Excellent',
  '  - x | Did not play defense',
  '',
  '- Died / Immobilized `type:toggle` `code:die`',
  '',
  '- Was Defended `type:toggle` `code:def`',
  '',
  '- Comments `type:text` `code:co` `size:20` `maxSize:200`',
].join('\n');
