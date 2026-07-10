import { renderCounter } from './fields/counter.js';
import { renderTimer, renderCycleTimer } from './fields/timer.js';
import { renderFieldMap } from './fields/field-image.js';

function renderText(wrap, def, ctx) {
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'text';
  input.className = 'field-input';
  if (def.attrs.maxSize) input.maxLength = Number(def.attrs.maxSize);
  if (def.attrs.disabled === 'true') input.disabled = true;
  const initial = ctx.state.get(def.code);
  input.value = initial !== undefined ? initial : def.attrs.default || '';
  ctx.state.seed(def.code, input.value);
  input.addEventListener('input', () => ctx.state.set(def.code, input.value));
  wrap.appendChild(input);
}

function renderNumber(wrap, def, ctx) {
  const input = document.createElement('input');
  input.type = 'number';
  input.inputMode = 'numeric';
  input.pattern = '[0-9]*';
  input.className = 'field-input';
  if (def.attrs.min !== undefined) input.min = def.attrs.min;
  if (def.attrs.max !== undefined) input.max = def.attrs.max;
  if (def.attrs.disabled === 'true') input.disabled = true;
  const initial = ctx.state.get(def.code);
  const startValue = initial !== undefined ? initial : def.attrs.default || '';
  input.value = startValue;
  ctx.state.seed(def.code, startValue === '' ? '' : Number(startValue));
  input.addEventListener('input', () => {
    ctx.state.set(def.code, input.value === '' ? '' : Number(input.value));
  });
  wrap.appendChild(input);
}

function renderChoice(wrap, def, ctx) {
  const group = document.createElement('div');
  group.className = 'choice-group';
  group.setAttribute('role', 'radiogroup');

  const initial = ctx.state.get(def.code);
  let selected = initial !== undefined ? initial : def.attrs.default;

  const pills = (def.choices || []).map((choice) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice-pill';
    btn.textContent = choice.label;
    btn.dataset.value = choice.value;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(choice.value === selected));
    if (choice.value === selected) btn.classList.add('is-selected');
    btn.addEventListener('click', () => {
      selected = choice.value;
      for (const other of pills) {
        const isSelected = other.dataset.value === selected;
        other.classList.toggle('is-selected', isSelected);
        other.setAttribute('aria-checked', String(isSelected));
      }
      ctx.state.set(def.code, selected);
    });
    return btn;
  });

  pills.forEach((btn) => group.appendChild(btn));
  wrap.appendChild(group);
  ctx.state.seed(def.code, selected);
}

function renderToggle(wrap, def, ctx) {
  const initial = ctx.state.get(def.code);
  let checked = initial !== undefined ? Boolean(initial) : def.attrs.default === 'true';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'switch';
  btn.setAttribute('role', 'switch');
  btn.setAttribute('aria-checked', String(checked));

  const track = document.createElement('span');
  track.className = 'switch-track';
  const thumb = document.createElement('span');
  thumb.className = 'switch-thumb';
  track.appendChild(thumb);
  btn.appendChild(track);

  btn.addEventListener('click', () => {
    checked = !checked;
    btn.setAttribute('aria-checked', String(checked));
    ctx.state.set(def.code, checked);
  });

  wrap.appendChild(btn);
  ctx.state.seed(def.code, checked);
}

function errorNode(message) {
  const p = document.createElement('p');
  p.className = 'field-error-note';
  p.textContent = message;
  return p;
}

export function renderField(container, fieldDef, ctx) {
  const wrap = document.createElement('div');
  wrap.className = `field field-${fieldDef.type}`;
  if (fieldDef.error) wrap.classList.add('field-error');
  wrap.dataset.code = fieldDef.code;

  if (fieldDef.type !== 'toggle') {
    const labelEl = document.createElement('label');
    labelEl.className = 'field-label';
    labelEl.textContent = fieldDef.label;
    if (fieldDef.attrs.tooltip) labelEl.title = fieldDef.attrs.tooltip;
    wrap.appendChild(labelEl);
  }

  switch (fieldDef.type) {
    case 'text':
      renderText(wrap, fieldDef, ctx);
      break;
    case 'number':
      renderNumber(wrap, fieldDef, ctx);
      break;
    case 'counter':
      renderCounter(wrap, fieldDef, ctx);
      break;
    case 'choice':
      renderChoice(wrap, fieldDef, ctx);
      break;
    case 'toggle':
      // Toggle renders its own label inline (switch + text) instead of the
      // standalone label element used by other field types.
      renderToggleWithLabel(wrap, fieldDef, ctx);
      break;
    case 'timer':
      renderTimer(wrap, fieldDef, ctx);
      break;
    case 'cycletimer':
      renderCycleTimer(wrap, fieldDef, ctx);
      break;
    case 'fieldmap':
      renderFieldMap(wrap, fieldDef, ctx);
      break;
    default:
      wrap.appendChild(errorNode(`Unknown field type "${fieldDef.type}"`));
  }

  container.appendChild(wrap);
  return wrap;
}

function renderToggleWithLabel(wrap, def, ctx) {
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.gap = '12px';

  const label = document.createElement('span');
  label.className = 'switch-text';
  label.textContent = def.label;

  const switchHost = document.createElement('div');
  renderToggle(switchHost, def, ctx);

  row.append(switchHost.firstChild, label);
  wrap.appendChild(row);
}

export function renderPage(container, fieldDefs, ctx) {
  container.innerHTML = '';
  for (const def of fieldDefs) renderField(container, def, ctx);
}
