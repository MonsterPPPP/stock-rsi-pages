/* Public presentation only. No strategy execution or market-data fetching. */
(() => {
  'use strict';
  const themeButton = document.querySelector('.theme-toggle');
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton?.setAttribute('aria-label', `切换为${theme === 'dark' ? '浅' : '深'}色主题`);
    try { localStorage.setItem('rsi-theme', theme); } catch { /* Storage is optional. */ }
  }
  try { if (localStorage.getItem('rsi-theme') === 'light') setTheme('light'); } catch { /* Local files may disallow storage. */ }
  themeButton?.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  document.querySelectorAll('[data-expires]').forEach(node => {
    if (Date.now() > Date.parse(node.dataset.expires)) {
      node.classList.add('expired');
      node.textContent = '本期评价期已结束；按原冻结规则继续持现，直至新规则成功发布。账户数字为页面标注日期的记录。';
    }
  });

  const source = document.querySelector('#chart-data');
  if (!source) return;
  const {series} = JSON.parse(source.textContent);
  const svg = document.querySelector('#history-chart');
  const tooltip = document.querySelector('#chart-tooltip');
  const ns = 'http://www.w3.org/2000/svg';
  const visible = new Set(series.map(s => s.id));
  let metric = 'nav', selected = null, scale, cursor;
  function el(tag, attrs, text) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  }
  const format = value => metric === 'nav' ? value.toFixed(4) : `${(value * 100).toFixed(2)}%`;
  function render() {
    svg.replaceChildren(el('title', {id:'chart-title'}, metric === 'nav' ? '历史净值对照' : '历史回撤对照'),
      el('desc', {id:'chart-desc'}, '历史探索，非发布后账户业绩。使用左右方向键逐日查看，Home与End跳至首尾。净值起始基准1.000；回撤相对于此前最高净值。'));
    const active = series.filter(s => visible.has(s.id));
    const values = active.flatMap(s => s.points.map(p => p[metric]));
    const padding = metric === 'nav' ? .018 : .012;
    const low = Math.min(...values) - padding;
    const high = Math.max(metric === 'nav' ? 1 : 0, ...values) + padding;
    scale = value => 252 - (value - low) / (high - low) * 220;
    for (let i = 0; i < 5; i++) {
      const value = low + (high-low)*i/4;
      svg.append(el('path', {d:`M16 ${scale(value)}H574`, class:'grid-line'}),
        el('text', {x:589,y:scale(value)+4,class:'axis-label'}, metric === 'nav' ? value.toFixed(2) : `${(value*100).toFixed(0)}%`));
    }
    svg.append(el('path', {d:`M16 ${scale(metric === 'nav' ? 1 : 0)}H574`,class:'grid-line','stroke-dasharray':'4 5'}));
    for (const s of active) {
      const points = s.points.map((p,i) => `${16+i/(s.points.length-1)*558},${scale(p[metric])}`).join(' ');
      svg.append(el('polyline', {points,fill:'none',stroke:s.color,'stroke-width':2,class:'chart-line'}));
      const last = s.points.at(-1);
      svg.append(el('circle', {cx:574,cy:scale(last[metric]),r:3,fill:s.color}));
    }
    const count = series[0].points.length;
    for (const index of [0, Math.round((count-1)/3), Math.round((count-1)*2/3), count-1]) {
      const x = 16+index/(count-1)*558;
      const label = series[0].points[index].date.slice(5).replace('-', '.');
      svg.append(el('text', {x,y:286,'text-anchor':index === 0 ? 'start' : index === count-1 ? 'end' : 'middle',class:'axis-label'}, label));
    }
    cursor = el('g', {'aria-hidden':'true'}); svg.append(cursor);
    if (selected !== null) showPoint(selected);
  }
  function showPoint(index) {
    selected = index;
    const x = 16+index/(series[0].points.length-1)*558;
    cursor.replaceChildren(el('path', {d:`M${x} 24V252`,class:'crosshair','stroke-dasharray':'3 4'}));
    const heading = document.createElement('strong'); heading.textContent = series[0].points[index].date;
    tooltip.replaceChildren(heading);
    for (const s of series.filter(s => visible.has(s.id))) {
      cursor.append(el('circle',{cx:x,cy:scale(s.points[index][metric]),r:4,fill:s.color,class:'chart-point'}));
      const row = document.createElement('div'); row.textContent = `${s.label}  ${format(s.points[index][metric])}`;
      tooltip.append(row);
    }
    tooltip.hidden = false;
    tooltip.style.left = x > 320 ? '12px' : 'auto';
    tooltip.style.right = x > 320 ? 'auto' : '12px';
    tooltip.style.top = '12px';
  }
  svg.addEventListener('pointermove', event => {
    const box = svg.getBoundingClientRect();
    const x = (event.clientX-box.left)/box.width*640;
    const index = Math.max(0,Math.min(series[0].points.length-1,Math.round((x-16)/558*(series[0].points.length-1))));
    showPoint(index);
  });
  const hidePoint = () => { selected = null; tooltip.hidden = true; cursor.replaceChildren(); };
  svg.addEventListener('pointerleave', hidePoint);
  svg.addEventListener('blur', hidePoint);
  svg.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') { hidePoint(); return; }
    const last = series[0].points.length-1;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? last : Math.max(0,Math.min(last,(selected ?? last)+(event.key === 'ArrowLeft' ? -1 : 1)));
    showPoint(index);
  });
  document.querySelectorAll('[data-metric]').forEach(button => button.addEventListener('click', () => {
    metric = button.dataset.metric;
    document.querySelectorAll('[data-metric]').forEach(other => {
      const active = other === button; other.classList.toggle('active',active); other.setAttribute('aria-pressed',String(active));
    });
    render();
  }));
  document.querySelectorAll('[data-series]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.series;
    if (visible.has(id)) { if (visible.size === 1) return; visible.delete(id); } else visible.add(id);
    button.setAttribute('aria-pressed',String(visible.has(id))); render();
  }));
  render();
})();
