export function renderTimer(wrap, def, ctx, opts = {}) {
  const state = { running: false, elapsedMs: 0, startedAt: null, rafId: null };

  if (!opts.suppressStateWrite) {
    const stored = ctx.state.get(def.code);
    if (typeof stored === 'number') state.elapsedMs = stored * 1000;
  }

  const display = document.createElement('div');
  display.className = 'timer-display';

  const controls = document.createElement('div');
  controls.className = 'timer-controls';

  const startStopBtn = document.createElement('button');
  startStopBtn.type = 'button';
  startStopBtn.className = 'timer-btn timer-btn-start';
  startStopBtn.textContent = 'Start';

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'timer-btn timer-btn-secondary';
  resetBtn.textContent = 'Reset';

  function currentElapsedMs() {
    return state.elapsedMs + (state.running ? performance.now() - state.startedAt : 0);
  }

  function getElapsedSeconds() {
    return +(currentElapsedMs() / 1000).toFixed(1);
  }

  function paint() {
    display.textContent = getElapsedSeconds().toFixed(1);
  }

  function tick() {
    if (!state.running) return;
    paint();
    state.rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (state.running) return;
    state.running = true;
    state.startedAt = performance.now();
    startStopBtn.textContent = 'Stop';
    startStopBtn.classList.add('is-running');
    state.rafId = requestAnimationFrame(tick);
  }

  function commitElapsed() {
    if (state.running) {
      state.elapsedMs += performance.now() - state.startedAt;
      state.startedAt = performance.now();
    }
  }

  function stop() {
    if (!state.running) return;
    commitElapsed();
    state.running = false;
    cancelAnimationFrame(state.rafId);
    startStopBtn.textContent = 'Start';
    startStopBtn.classList.remove('is-running');
    paint();
    if (!opts.suppressStateWrite) ctx.state.set(def.code, getElapsedSeconds());
  }

  function reset() {
    state.running = false;
    state.elapsedMs = 0;
    state.startedAt = null;
    cancelAnimationFrame(state.rafId);
    startStopBtn.textContent = 'Start';
    startStopBtn.classList.remove('is-running');
    paint();
    if (!opts.suppressStateWrite) ctx.state.set(def.code, 0);
  }

  // Commit current elapsed, zero the accumulator, keep running — avoids the
  // button-state flicker that a plain stop()+start() pair would cause.
  function lap() {
    commitElapsed();
    const seconds = getElapsedSeconds();
    state.elapsedMs = 0;
    paint();
    return seconds;
  }

  startStopBtn.addEventListener('click', () => (state.running ? stop() : start()));
  resetBtn.addEventListener('click', reset);

  controls.append(startStopBtn, resetBtn);
  wrap.append(display, controls);
  paint();

  if (!opts.suppressStateWrite) ctx.state.seed(def.code, getElapsedSeconds());

  return { start, stop, reset, lap, getElapsedSeconds, isRunning: () => state.running };
}

export function renderCycleTimer(wrap, def, ctx) {
  const timerApi = renderTimer(wrap, def, ctx, { suppressStateWrite: true });

  const storedCycles = ctx.state.get(def.code);
  const cycles = Array.isArray(storedCycles) ? storedCycles.slice() : [];

  const cycleList = document.createElement('div');
  cycleList.className = 'cycle-list';

  const controls = document.createElement('div');
  controls.className = 'timer-controls';

  const newCycleBtn = document.createElement('button');
  newCycleBtn.type = 'button';
  newCycleBtn.className = 'timer-btn';
  newCycleBtn.textContent = 'New Cycle';

  const undoBtn = document.createElement('button');
  undoBtn.type = 'button';
  undoBtn.className = 'timer-btn timer-btn-secondary';
  undoBtn.textContent = 'Undo';

  function updateDisplay() {
    cycleList.textContent = cycles.length ? cycles.map((c) => c.toFixed(1)).join(', ') : '—';
    ctx.state.set(def.code, cycles.slice());
  }

  function commit() {
    if (!timerApi.isRunning()) timerApi.start();
    const seconds = timerApi.lap();
    cycles.push(seconds);
    updateDisplay();
    if (def.attrs.link) ctx.bumpCounter(def.attrs.link, 1);
  }

  newCycleBtn.addEventListener('click', commit);
  undoBtn.addEventListener('click', () => {
    cycles.pop();
    updateDisplay();
  });

  controls.append(newCycleBtn, undoBtn);
  wrap.append(cycleList, controls);
  cycleList.textContent = cycles.length ? cycles.map((c) => c.toFixed(1)).join(', ') : '—';
  ctx.state.seed(def.code, cycles.slice());

  ctx.registerLinkTarget(def.code, { newCycle: commit });
}
