window.DS = window.DS || {};
DS.fields = DS.fields || {};

DS.fields.renderCounter = function renderCounter(wrap, def, ctx) {
  const group = document.createElement('div');
  group.className = 'counter-group';

  const initial = ctx.state.get(def.code);
  let value = Number(initial ?? def.attrs.default ?? 0);

  const display = document.createElement('div');
  display.className = 'counter-display';
  display.textContent = String(value);

  function commit() {
    display.textContent = String(value);
    ctx.state.set(def.code, value);
  }

  function makeBtn(label, delta, cls) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `counter-btn ${cls}`;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      value = Math.max(0, value + delta);
      commit();
    });
    return btn;
  }

  const alt1 = def.attrs.alt1 ? Number(def.attrs.alt1) : null;
  const alt2 = def.attrs.alt2 ? Number(def.attrs.alt2) : null;

  if (alt2) group.appendChild(makeBtn(`−${alt2}`, -alt2, 'counter-btn-alt'));
  if (alt1) group.appendChild(makeBtn(`−${alt1}`, -alt1, 'counter-btn-alt'));
  group.appendChild(makeBtn('−', -1, 'counter-btn-main'));
  group.appendChild(display);
  group.appendChild(makeBtn('+', 1, 'counter-btn-main'));
  if (alt1) group.appendChild(makeBtn(`+${alt1}`, alt1, 'counter-btn-alt'));
  if (alt2) group.appendChild(makeBtn(`+${alt2}`, alt2, 'counter-btn-alt'));

  wrap.appendChild(group);
  ctx.state.seed(def.code, value);

  ctx.registerLinkTarget(def.code, {
    bump(delta) {
      value = Math.max(0, value + delta);
      commit();
    },
  });
};
