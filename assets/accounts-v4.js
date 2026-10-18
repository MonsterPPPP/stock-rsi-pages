(()=>{'use strict';
const root=document.documentElement,button=document.querySelector('.theme-toggle');
const setTheme=value=>{root.dataset.theme=value;if(button)button.setAttribute('aria-label',value==='dark'?'切换为浅色主题':'切换为深色主题');};
try{const saved=localStorage.getItem('rsi-accounts-theme');if(saved==='light'||saved==='dark')setTheme(saved);}catch{}
if(button)button.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';setTheme(next);try{localStorage.setItem('rsi-accounts-theme',next);}catch{}});
const stamp=document.querySelector('[data-generated-at]'),status=document.querySelector('[data-freshness]');
if(stamp&&status){const time=Date.parse(stamp.dataset.generatedAt);if(Number.isFinite(time)&&Date.now()-time>3*86400000){status.textContent='静态快照 · 距上次手动更新已超过 3 天';}}
})();