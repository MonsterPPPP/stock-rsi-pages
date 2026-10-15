/* Presentation controls only. No signals, execution rules or return calculations. */
(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const applyTheme = value => {
    root.dataset.theme = value === 'light' ? 'light' : 'dark';
    themeButton?.setAttribute('aria-label', root.dataset.theme === 'dark' ? '切换为浅色主题' : '切换为深色主题');
  };
  try { applyTheme(localStorage.getItem('rsi-theme')); } catch { applyTheme('dark'); }
  themeButton?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    try { localStorage.setItem('rsi-theme', root.dataset.theme); } catch { /* optional preference */ }
  });
  for (const panel of document.querySelectorAll('[data-candidate-panel]')) {
    const buttons = [...panel.querySelectorAll('[data-asset-filter]')];
    const rows = [...panel.querySelectorAll('[data-asset-kind]')];
    const limit = Number(panel.dataset.limit) || rows.length;
    const applyFilter = kind => {
      let shown = 0;
      rows.forEach(row => {
        const eligible = kind === 'all' || row.dataset.assetKind === kind;
        row.hidden = !eligible || shown >= limit;
        if (eligible && !row.hidden) shown += 1;
      });
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.assetFilter === kind)));
      const status = panel.querySelector('[data-filter-status]');
      if (status) status.textContent = `显示 ${shown} 个候选`;
    };
    buttons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.assetFilter)));
    applyFilter(buttons[0]?.dataset.assetFilter || 'all');
  }
  for (const panel of document.querySelectorAll('[data-strategy-panel]')) {
    const list = panel.querySelector('[data-strategy-list]');
    const buttons = [...panel.querySelectorAll('[data-strategy-sort]')];
    if (!list) continue;
    buttons.forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.strategySort;
      [...list.children].sort((a, b) => Number(b.dataset[key]) - Number(a.dataset[key])).forEach(row => list.append(row));
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      const status = panel.querySelector('[data-sort-status]');
      if (status) status.textContent = key === 'risk' ? '已按最大回撤从小到大排列' : '已按价格方向涨跌从高到低排列';
    }));
  }
})();
