# DeceptiveScout Configuration Guide

DeceptiveScout is configured entirely through plain markdown-style content — no code changes are needed to add, remove, or change scouting questions. This document is the reference for the grammar those files use.

## Overview

A **config folder** (e.g. `config/2026-example/`) holds six files:

```
config/<your-config>/
  meta.js        # global settings
  prematch.js    # Scouter & Team page
  auto.js        # Autonomous page
  teleop.js      # Teleop page
  endgame.js     # Endgame page
  postmatch.js   # Post-Match page
```

Each file is a thin JS wrapper around plain markdown content — e.g.:

```js
window.DS_CONFIG.pages.auto = `
# Autonomous

- Left Starting Line {type:toggle} {code:all}
...
`;
```

Everything *between the backticks* is what you edit day to day — paste or type it exactly like markdown, no per-line quoting. The `.js` wrapper exists so the app can load these files with a plain `<script src="...">` tag: **no server, no build step, no `fetch()`** — the whole app works by just double-clicking `index.html`. (Config used to be plain `.md` files fetched at runtime, but browsers block `fetch()` of local files under `file://`, so that required running a local server. This format removes that requirement entirely.)

The only two things to avoid inside the content: a literal backtick (`` ` ``), since that's the JS string delimiter, and `${...}` (JS interpolation syntax) — both are exceedingly unlikely to show up in a scouting question.

To switch which config is active, change `CONFIG_SLUG` at the top of `js/app.js` and update the `<script src="./config/...">` paths in `index.html` to point at the new folder.

## `meta.js`

Global settings, one per line:

```js
window.DS_CONFIG.meta = `
# DeceptiveScout Config

- {title:Deceivers Robotics | Scouting}
- {dataFormat:tsv}
- {checkboxAs:10}
- {defaultEvent:2026micmp3}
`;
```

- `title` — shown in the app header.
- `dataFormat` — `tsv` (tab-separated, default) or `kvs` (`key=value;key=value;...`) for the QR/export data.
- `checkboxAs` — how toggle fields are encoded: `10` (1/0, default), `YN` (Y/N), or `TF` (T/F).
- `defaultEvent` — pre-filled value for the Event field.

## Field lines

Every scouting question is a single markdown bullet:

```
- <Label> {type:<fieldtype>} {code:<code>} [{attr:value} ...] [required]
```

- **Label** — the question text shown to the scouter. Everything before the first `{...}` attribute.
- Each `{key:value}` (curly braces included) is one attribute. The value is everything after the first colon, so it can itself contain punctuation (including `|`).
- The bare word `required` (no braces) marks the field as required — the app blocks leaving the Scouter & Team page until all required fields are filled.
- `type` and `code` are **mandatory** on every field. `code` is a short unique id (used internally and in the exported data) — keep it short, no spaces.
- Lines starting with `#` or `##` are headings and are ignored by the app — use them freely to visually group fields in the file.
- A blank line is ignored.

If a field line is missing `type` or `code`, the app doesn't crash — it shows an inline "Config error" message in place of that field so you can spot and fix the typo.

## Field types

### text
```
- Comments {type:text} {code:co} {size:20} {maxSize:200}
```
`size` (display width hint), `maxSize` (character limit), `default` (starting value), `disabled:true` (read-only).

### number
```
- Match # {type:number} {code:m} {min:1} {max:150} required
```
`min`, `max`, `default`, `disabled:true`.

### counter
```
- Fuel Scored {type:counter} {code:fs} {default:0} {alt1:5} {alt2:10}
```
Renders −/+ buttons. `default` (starting value), `alt1`/`alt2` (extra ± buttons for bigger jumps, e.g. +5/+10).

### choice
```
- Climb Result {type:choice} {code:cr} {default:x} required
  - c | Climbed
  - a | Attempted / Failed
  - x | Not Attempted
```
Renders as tappable pill buttons. Choices are an indented sub-list right below the field line, one per line: `- <value> | <Label>`. `default` sets which choice is pre-selected (match the value, not the label).

### toggle
```
- Crossed Trench {type:toggle} {code:tre}
```
A simple on/off switch. `default:true` to start it on.

### timer
```
- Cargo Cycle Timer {type:timer} {code:ctm}
```
A stopwatch with Start/Stop and Reset.

### cycletimer
```
- Fuel Cycle {type:cycletimer} {code:fct} {link:fs}
```
Like `timer`, but adds "New Cycle" (records the current time to a list and keeps running) and "Undo" (removes the last recorded time). Optional `link:<code>` — the `code` of a `counter` field on the same page — bumps that counter by 1 every time a new cycle is recorded.

### fieldmap
```
- Auto Start Position {type:fieldmap} {code:asp} {image:assets/field-placeholder.svg} {grid:12x6} {restrict:one} {flip:true} {undo:true} {marker:circle 10 white #1256a8 true} {link:fct}
```
Tap a spot on a field diagram to record a grid location.
- `image` (required) — path to the diagram image (SVG or PNG), relative to the app's root.
- `grid` — `<cols>x<rows>`, default `12x6`.
- `restrict` — `none` (default, unlimited taps), `one` (each tap replaces the last), or `onePerBox` (a box can only be recorded once).
- `toggle:true` — tapping an already-recorded box removes it.
- `flip` / `undo` — show/hide those buttons (default: shown).
- `marker` — `"<shape> <size> <lineColor> <fillColor> <fill>"`. Only `circle` is supported currently.
- `link:<code>` — the `code` of a `cycletimer` field on the same page; every tap also records a new cycle on it.

## Special "role" fields (Scouter & Team page only)

Add an optional `role:` attribute to mark a field as one of the six fields the app relies on structurally (for validation and TBA autofill). A `role` field is always treated as required, even without the bare `required` word:

| role      | purpose                                    |
|-----------|---------------------------------------------|
| `scouter` | scouter's initials                           |
| `event`   | TBA event code                               |
| `level`   | match level (`qm`/`sf`/`f`)                  |
| `match`   | match number                                 |
| `robot`   | robot slot (`r1`/`b1`/`r2`/`b2`/`r3`/`b3`)   |
| `team`    | team number (auto-filled from TBA if configured) |

See `config/2026-example/prematch.js` for the full worked example.

## The Blue Alliance API key

TBA autofill (matching a scouted robot to its team number from the published event schedule) needs a free read-only API key from https://www.thebluealliance.com/account. There are two ways to set it:

- **Team-wide default (recommended)** — copy `local-config.example.js` to `local-config.js` (same folder as `index.html`) and paste the key in. `local-config.js` is gitignored, so it's never committed; every scouter who gets a copy of the app folder (or loads it from wherever it's hosted) automatically has TBA working with no per-device setup.
- **Per-device override** — the gear icon in the app header opens a Settings dialog where an individual can enter their own key, stored only in that browser's local storage. This takes priority over the team-wide default on that device.

Once a schedule has loaded successfully at least once, it's cached in local storage per event, so autofill keeps working even if the device goes offline later in the day (e.g. no signal in the stands).

## Tips

- Keep `code` values short and stable across seasons if you want to compare data — changing a `code` changes the exported column for that field.
- Test a config change by editing the text and reloading the app (just refresh — no server, no build step, no restart needed).
- One typo in a field line only breaks that one field (shown as a "Config error" placeholder), not the whole page.
- Avoid a literal backtick (`` ` ``) or `${...}` anywhere in the content — those are the JS string boundary and interpolation syntax respectively. Everything else (apostrophes, quotes, `#`, `|`, emoji, whatever) is completely safe to type or paste.
