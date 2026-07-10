window.DS = window.DS || {};
DS.fields = DS.fields || {};

DS.fields.renderFieldMap = function renderFieldMap(wrap, def, ctx) {
  const [cols, rows] = (def.attrs.grid || '12x6').split(/x/i).map(Number);
  const restrict = def.attrs.restrict || 'none';
  const toggle = def.attrs.toggle === 'true';
  const showFlip = def.attrs.flip !== 'false';
  const showUndo = def.attrs.undo !== 'false';
  const [shape = 'circle', size = '8', lineColor = 'white', fillColor = '#1256a8', fillFlag = 'true'] =
    (def.attrs.marker || 'circle 8 white #1256a8 true').split(/\s+/);

  let flipped = false;
  const stored = ctx.state.get(def.code);
  let boxes = Array.isArray(stored) ? stored.slice() : [];

  const btnRow = document.createElement('div');
  btnRow.className = 'fieldmap-controls';

  const canvas = document.createElement('canvas');
  canvas.className = 'fieldmap-canvas';

  const img = new Image();
  img.src = def.attrs.image || '';

  function boxNumberFromClick(x, y, width, height) {
    const col = Math.min(cols, Math.max(1, Math.ceil((x / width) * cols)));
    const row = Math.min(rows, Math.max(1, Math.ceil((y / height) * rows)));
    return (row - 1) * cols + col;
  }

  function centerOfBox(box, width, height) {
    const boxW = width / cols;
    const boxH = height / rows;
    const col = (box - 1) % cols;
    const row = Math.floor((box - 1) / cols);
    return { x: col * boxW + boxW / 2, y: row * boxH + boxH / 2 };
  }

  function draw() {
    if (!img.naturalWidth) return;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth || 320;
    const displayHeight = displayWidth * (img.naturalHeight / img.naturalWidth);
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.height = `${displayHeight}px`;

    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, displayWidth, displayHeight);
    c.save();
    if (flipped) {
      c.translate(displayWidth, displayHeight);
      c.rotate(Math.PI);
    }
    c.drawImage(img, 0, 0, displayWidth, displayHeight);

    // Markers are drawn inside the same (possibly flipped) transform as the
    // image, so a box's marker stays visually attached to its physical
    // field location regardless of flip state.
    for (const box of boxes) {
      const { x, y } = centerOfBox(box, displayWidth, displayHeight);
      c.beginPath();
      c.arc(x, y, Number(size), 0, Math.PI * 2);
      c.lineWidth = 2;
      c.strokeStyle = lineColor;
      if (fillFlag === 'true') {
        c.fillStyle = fillColor;
        c.fill();
      }
      c.stroke();
    }
    c.restore();
  }

  function handleClick(evt) {
    const rect = canvas.getBoundingClientRect();
    const clickX = evt.clientX - rect.left;
    const clickY = evt.clientY - rect.top;
    const effX = flipped ? rect.width - clickX : clickX;
    const effY = flipped ? rect.height - clickY : clickY;
    const box = boxNumberFromClick(effX, effY, rect.width, rect.height);

    if (toggle && boxes.includes(box)) {
      boxes = boxes.filter((b) => b !== box);
    } else if (restrict === 'one') {
      boxes = [box];
    } else if (restrict === 'onePerBox') {
      if (!boxes.includes(box)) boxes.push(box);
    } else {
      boxes.push(box);
    }

    ctx.state.set(def.code, boxes.slice());
    draw();
    if (def.attrs.link) ctx.fireLink(def.attrs.link, 'newCycle');
  }

  img.addEventListener('load', draw);
  img.addEventListener('error', () => {
    console.warn('[DeceptiveScout] Field-image failed to load:', def.attrs.image);
  });
  canvas.addEventListener('click', handleClick);
  window.addEventListener('resize', draw);

  if (showFlip) {
    const flipBtn = document.createElement('button');
    flipBtn.type = 'button';
    flipBtn.className = 'fieldmap-btn';
    flipBtn.textContent = 'Flip';
    flipBtn.addEventListener('click', () => {
      flipped = !flipped;
      draw();
    });
    btnRow.appendChild(flipBtn);
  }

  if (showUndo) {
    const undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'fieldmap-btn';
    undoBtn.textContent = 'Undo';
    undoBtn.addEventListener('click', () => {
      boxes.pop();
      ctx.state.set(def.code, boxes.slice());
      draw();
    });
    btnRow.appendChild(undoBtn);
  }

  wrap.append(btnRow, canvas);
  ctx.state.seed(def.code, boxes.slice());
};
