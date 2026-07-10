// Scouting config — Endgame page. This is plain markdown text inside a JS
// template literal (wrapped so the browser can load it via a plain
// <script> tag with no server or build step). See docs/Configuration.md.
// Only avoid a literal backtick (`) or ${...} in the text below.

window.DS_CONFIG = window.DS_CONFIG || {};
window.DS_CONFIG.pages = window.DS_CONFIG.pages || {};
window.DS_CONFIG.pages.endgame = `
# Endgame

- Climb Result {type:choice} {code:ec} {default:x} required
  - 1 | Level 1
  - 2 | Level 2
  - 3 | Level 3
  - a | Attempted / Failed
  - x | Not Attempted

- Robot Fell {type:toggle} {code:erf}
`;
