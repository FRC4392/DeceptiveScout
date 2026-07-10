// Scouting config — global settings. Content is markdown, one line per
// array entry (wrapped in JS so the browser can load it via a plain
// <script> tag with no server or build step). See docs/Configuration.md.

window.DS_CONFIG = window.DS_CONFIG || {};
window.DS_CONFIG.meta = [
  '# DeceptiveScout Config',
  '',
  '- `title:Deceivers Robotics | Scouting`',
  '- `dataFormat:tsv`',
  '- `checkboxAs:10`',
  '- `defaultEvent:2026micmp3`',
].join('\n');
