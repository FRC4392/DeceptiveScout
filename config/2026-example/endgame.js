// Scouting config — Endgame page. Content is markdown, one line per array
// entry (wrapped in JS so the browser can load it via a plain <script>
// tag with no server or build step). See docs/Configuration.md.

window.DS_CONFIG = window.DS_CONFIG || {};
window.DS_CONFIG.pages = window.DS_CONFIG.pages || {};
window.DS_CONFIG.pages.endgame = [
  '# Endgame',
  '',
  '- Climb Result `type:choice` `code:ec` `default:x` required',
  '  - 1 | Level 1',
  '  - 2 | Level 2',
  '  - 3 | Level 3',
  '  - a | Attempted / Failed',
  '  - x | Not Attempted',
  '',
  '- Robot Fell `type:toggle` `code:erf`',
].join('\n');
