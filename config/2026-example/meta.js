// Scouting config — global settings. This is plain markdown text inside a
// JS template literal (wrapped so the browser can load it via a plain
// <script> tag with no server or build step). See docs/Configuration.md.
// Only avoid a literal backtick (`) or ${...} in the text below.

window.DS_CONFIG = window.DS_CONFIG || {};
window.DS_CONFIG.meta = `
# DeceptiveScout Config

- {title:Deceivers Robotics | Scouting}
- {dataFormat:tsv}
- {checkboxAs:10}
- {defaultEvent:2026micmp3}
`;
