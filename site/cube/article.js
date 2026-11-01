(() => {
  const $ = id => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';
  const vertices = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => [x, y, z])));
  const edges = [];
  vertices.forEach((v, i) => vertices.forEach((w, j) => {
    if (j > i && v.filter((value, k) => value !== w[k]).length === 1) edges.push([i, j]);
  }));
  const add = (parent, tag, attrs) => {
    const element = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    parent.append(element);
    return element;
  };
  const lines = edges.map(() => add($('cube-lines'), 'line', {}));
  const dots = vertices.map(() => add($('cube-dots'), 'circle', { r: 3 }));
  function drawCube() {
    const ax = Number($('angle-x').value), ay = Number($('angle-y').value), distance = Number($('distance').value);
    $('angle-x-out').value = `${Math.round(ax)}°`; $('angle-y-out').value = `${Math.round(ay)}°`; $('distance-out').value = distance;
    const a = ax * Math.PI / 180, b = ay * Math.PI / 180;
    const points = vertices.map(([x, y, z]) => {
      const y1 = y * Math.cos(a) - z * Math.sin(a), z1 = y * Math.sin(a) + z * Math.cos(a);
      const x2 = x * Math.cos(b) + z1 * Math.sin(b), z2 = -x * Math.sin(b) + z1 * Math.cos(b);
      const scale = 200 / (z2 + distance);
      return [300 + x2 * scale, 180 - y1 * scale, z2];
    });
    edges.forEach(([i, j], k) => {
      const [x1, y1] = points[i], [x2, y2] = points[j];
      Object.entries({x1,y1,x2,y2}).forEach(([key,value]) => lines[k].setAttribute(key,value));
      lines[k].style.opacity = .45 + .5 * (1 - (points[i][2] + points[j][2] + 4) / 8);
    });
    points.forEach(([x,y],i) => { dots[i].setAttribute('cx',x); dots[i].setAttribute('cy',y); });
    $('cube-desc').textContent = `8 вершин, 12 рёбер. Поворот X: ${Math.round(ax)}°, Y: ${Math.round(ay)}°. Камера на расстоянии ${distance}.`;
    $('cube-state').textContent = `X: ${Math.round(ax)}° · Y: ${Math.round(ay)}° · расстояние: ${distance}`;
  }
  ['angle-x','angle-y','distance'].forEach(id => $(id).addEventListener('input',drawCube));
  let playing = false, frame = null, previous = null, visible = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function schedule() {
    if (playing && visible && !document.hidden && !reduced.matches && frame === null) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = null;
    if (!playing || !visible || document.hidden || reduced.matches) { previous = null; return; }
    if (previous !== null) {
      const delta = Math.min(now - previous, 60) * .035;
      ['angle-x','angle-y'].forEach(id => { $(id).value = ((Number($(id).value) + delta + 180) % 360) - 180; });
      drawCube();
    }
    previous = now; schedule();
  }
  function stop() {
    playing = false; previous = null;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; $('play').textContent = 'Вращать'; $('play').setAttribute('aria-pressed','false');
  }
  $('play').addEventListener('click', () => {
    if (playing) { stop(); return; }
    if (reduced.matches) {
      $('angle-y').value = ((Number($('angle-y').value) + 195) % 360) - 180;
      drawCube(); return;
    }
    playing = true; $('play').textContent = 'Пауза'; $('play').setAttribute('aria-pressed','true'); schedule();
  });
  $('cube-reset').addEventListener('click', () => { stop(); $('angle-x').value=25; $('angle-y').value=35; $('distance').value=5; drawCube(); });
  new IntersectionObserver(entries => { visible=entries[0].isIntersecting; previous=null; schedule(); }).observe($('cube-view'));
  document.addEventListener('visibilitychange', () => { previous=null; schedule(); });
  reduced.addEventListener('change',stop);
  function drawPlane() {
    const angle=Number($('plane-angle').value), a=angle*Math.PI/180, y=Math.cos(a), z=Math.sin(a);
    const px=300+120*y, py=165-120*z;
    $('plane-angle-out').value=`${angle}°`;
    $('rotation-radius').setAttribute('d',`M300 165L${px} ${py}`);
    $('rotation-projection').setAttribute('d',`M${px} 165V${py}H300`);
    $('rotation-dot').setAttribute('cx',px); $('rotation-dot').setAttribute('cy',py);
    const text=`y′ = ${y.toFixed(3)} · z′ = ${z.toFixed(3)} · радиус = 1`;
    $('plane-result').textContent=text; $('plane-desc').textContent=text;
  }
  $('plane-angle').addEventListener('input',drawPlane);
  $('plane-reset').addEventListener('click',()=>{ $('plane-angle').value=0; drawPlane(); });
  function drawDepth() {
    const d=Number($('depth').value), half=300/d;
    $('depth-out').value=d; $('depth-line').setAttribute('d',`M410 ${150-half}V${150+half}`);
    $('depth-label').textContent=`d = ${d}`;
    const text=`Правый отрезок: ${(300/d).toFixed(0)}% высоты левого.`;
    $('depth-result').textContent=text; $('depth-desc').textContent=text;
  }
  $('depth').addEventListener('input',drawDepth);
  $('depth-reset').addEventListener('click',()=>{ $('depth').value=3; drawDepth(); });
  for(let x=0;x<=16;x++) add($('raster-grid'),'path',{d:`M${33+x*32} 18V306`,opacity:'.15'});
  for(let y=0;y<=9;y++) add($('raster-grid'),'path',{d:`M33 ${18+y*32}H545`,opacity:'.15'});
  // Python round uses ties-to-even; this example has no half-integer ties.
  function drawLine() {
    const step=Number($('line-step').value); $('raster-cells').replaceChildren();
    for(let i=0;i<=step;i++) {
      const t=i/13, x=Math.round(1+13*t), y=Math.round(1+6*t);
      add($('raster-cells'),'rect',{x:33+x*32,y:18+y*32,width:32,height:32,fill:'currentColor',opacity:'.35'});
    }
    const t=step/13, x=1+13*t, y=1+6*t;
    $('raster-dot').setAttribute('cx',49+x*32); $('raster-dot').setAttribute('cy',34+y*32);
    $('line-step-out').value=`${step} / 13`;
    const text=`t = ${t.toFixed(3)} · ячейка (${Math.round(x)}, ${Math.round(y)})`;
    $('line-result').textContent=text; $('raster-desc').textContent=text;
  }
  $('line-step').addEventListener('input',drawLine);
  $('line-reset').addEventListener('click',()=>{ $('line-step').value=0; drawLine(); });
  drawCube(); drawPlane(); drawDepth(); drawLine();
})();
