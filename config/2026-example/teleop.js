// Scouting config — Teleop page. Content is markdown, one line per array
// entry (wrapped in JS so the browser can load it via a plain <script>
// tag with no server or build step). See docs/Configuration.md.

window.DS_CONFIG = window.DS_CONFIG || {};
window.DS_CONFIG.pages = window.DS_CONFIG.pages || {};
window.DS_CONFIG.pages.teleop = [
  '# Teleop',
  '',
  "- Fuel Scored `type:counter` `code:tfs` `default:0` `alt1:5` `alt2:10`",
  '',
  '- Fuel Output Level `type:choice` `code:tfo` `default:a`',
  '  - b | Low',
  '  - a | Medium',
  '  - g | High',
  '  - e | Extreme',
  '',
  '- Crossed Midfield `type:toggle` `code:tcm`',
  '',
  '- Played Defense `type:toggle` `code:tpd`',
  '',
  '- Scoring Cycle Timer `type:cycletimer` `code:tct`',
  '',
  '- Notes `type:text` `code:tn` `size:20` `maxSize:120`',
].join('\n');
