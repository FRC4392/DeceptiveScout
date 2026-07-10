// Scouting config — Autonomous page. This is plain markdown text inside a
// JS template literal (wrapped so the browser can load it via a plain
// <script> tag with no server or build step). See docs/Configuration.md.
// Only avoid a literal backtick (`) or ${...} in the text below.

window.DS_CONFIG = window.DS_CONFIG || {};
window.DS_CONFIG.pages = window.DS_CONFIG.pages || {};
window.DS_CONFIG.pages.auto = `
# Autonomous

- Left Starting Line {type:toggle} {code:all}

- Fuel Scored (Auto) {type:counter} {code:afs} {default:0} {alt1:5}

- Auto Cycle Timer {type:cycletimer} {code:act} {link:afs}

- Feed / Shuttle Quality {type:choice} {code:afq} {default:x}
  - b | Below Average (0-25)
  - a | Average (25-50)
  - g | Good (50-100)
  - e | Excellent (100+)
  - x | Did not feed

- Auto Start Position {type:fieldmap} {code:asp} {image:assets/field-placeholder.svg} {grid:12x6} {restrict:one} {flip:true} {undo:false} {marker:circle 10 white #1256a8 true}

- Notes {type:text} {code:an} {size:20} {maxSize:120}
`;
