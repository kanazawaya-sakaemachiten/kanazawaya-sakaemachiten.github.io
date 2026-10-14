// ==========================================================================
// 金沢屋 除雪サービス — shared behavior
// ==========================================================================


// Status / news rendering (values come from status-data.js)
document.addEventListener('DOMContentLoaded', () => {
  const data = window.SITE_STATUS;
  if (!data) return;
  const pick = (path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), data);
  document.querySelectorAll('[data-s]').forEach(el => {
    const key = el.getAttribute('data-s');
    if (key === 'updatedText') {
      el.textContent = data.updated ? `最終更新：${data.updated}` : '';
    } else {
      el.textContent = pick(key) || '';
    }
  });
  const list = document.getElementById('news-list');
  if (list) {
    const items = Array.isArray(data.news) ? data.news : [];
    if (!items.length) {
      list.innerHTML = '<li class="news-empty">現在、お知らせはありません。</li>';
    } else {
      list.innerHTML = items.map(n =>
        `<li><time>${n.date || ''}</time><span>${n.title || ''}</span></li>`).join('');
    }
  }
});

// Inquiry / application forms — no data is stored or sent anywhere.
// The form composes the mail text; the visitor copies it or opens their mail app.
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form[data-compose]');
  if (!forms.length) return;
  const MAIL = 'kanazawaya.sakaemachi@gmail.com';

  const overlay = document.createElement('div');
  overlay.className = 'tel-confirm-overlay';
  overlay.innerHTML = `
    <div class="tel-confirm-box compose-box" role="dialog" aria-modal="true" aria-labelledby="compose-title">
      <p id="compose-title" class="tel-confirm-title">メール本文ができました</p>
      <p class="mail-confirm-note">宛先：<b class="compose-to"></b></p>
      <textarea class="compose-text" readonly rows="8"></textarea>
      <div class="tel-confirm-actions" style="flex-wrap:wrap;">
        <button type="button" class="btn btn-outline compose-close" style="color:var(--text-on-light); border-color:var(--line-light);">閉じる</button>
        <button type="button" class="btn btn-outline compose-copy-addr" style="color:var(--text-on-light); border-color:var(--line-light);">宛先をコピー</button>
        <button type="button" class="btn btn-amber compose-copy">本文をコピー</button>
      </div>
      <p class="mail-confirm-note"><a class="compose-open" href="#" target="_blank" rel="noopener" style="text-decoration:underline;">メールアプリで開く</a>（開けない場合は、宛先と本文をコピーしてお使いください）</p>
      <p class="mail-copy-status" aria-live="polite"></p>
    </div>`;
  document.body.appendChild(overlay);

  const toEl = overlay.querySelector('.compose-to');
  const textEl = overlay.querySelector('.compose-text');
  const statusEl = overlay.querySelector('.mail-copy-status');
  const openEl = overlay.querySelector('.compose-open');
  toEl.textContent = MAIL;

  async function copy(text, okMsg) {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (e) { /* fall back */ }
    if (!ok) {
      try {
        const t = document.createElement('textarea');
        t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        document.execCommand('copy'); t.remove(); ok = true;
      } catch (e) { /* ignore */ }
    }
    statusEl.textContent = ok ? okMsg : 'コピーできませんでした。直接ご選択ください。';
  }

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const lines = [form.dataset.intro || '', ''];
      form.querySelectorAll('[name]').forEach(f => {
        const v = (f.value || '').trim();
        lines.push(`${f.name}：${v || '（未記入）'}`);
      });
      const body = lines.join('\n');
      const subject = form.dataset.subject || '【お問い合わせ】';
      textEl.value = body;
      statusEl.textContent = '';
      openEl.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      overlay.classList.add('open');
    });
  });

  overlay.querySelector('.compose-copy').addEventListener('click', () => copy(textEl.value, '本文をコピーしました。メールに貼り付けてください。'));
  overlay.querySelector('.compose-copy-addr').addEventListener('click', () => copy(MAIL, '宛先をコピーしました。'));
  const close = () => overlay.classList.remove('open');
  overlay.querySelector('.compose-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
});

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const expanded = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', String(expanded));
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }
});

// Snowfall canvas (hero only)
(function snowfall() {
  const canvas = document.getElementById('snowfall');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let w, h, flakes;
  const COUNT = 70;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
  }

  function makeFlake() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.4,
      speed: 0.4 + Math.random() * 1.1,
      drift: (Math.random() - 0.5) * 0.6,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.35 + Math.random() * 0.5
    };
  }

  function init() {
    resize();
    flakes = Array.from({ length: COUNT }, makeFlake);
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#EEF1F4';
    for (const f of flakes) {
      f.phase += 0.01;
      f.y += f.speed;
      f.x += f.drift + Math.sin(f.phase) * 0.3;
      if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
      if (f.x > w + 4) f.x = -4;
      if (f.x < -4) f.x = w + 4;
      ctx.globalAlpha = f.opacity;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  init();
  requestAnimationFrame(tick);
})();
