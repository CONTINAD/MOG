/* =========================================================
   APP — drawer modal, hash routing, hero counter, splash
   Required globals: window.PEPTIDES, window.PEPTIDE_INDEX (peptides.js)
   ========================================================= */
(() => {
  /* ---------------- Splash ---------------- */
  function bootSplash() {
    if (sessionStorage.getItem('mogh_splashed')) return;
    sessionStorage.setItem('mogh_splashed', '1');
    const splash = document.createElement('div');
    splash.className = 'splash';
    splash.innerHTML = `
      <div class="splash-inner">
        <div class="splash-logo">M</div>
        <div class="splash-title">MOG <em>HARDER</em></div>
        <div class="splash-status" id="bootStatus">PROTOCOL · INIT</div>
        <div class="splash-bar"><span></span></div>
        <div class="splash-foot">v0.1 · pep-research-protocol</div>
      </div>`;
    document.body.appendChild(splash);
    const stages = ["PROTOCOL · INIT", "VERIFY TREASURY", "INDEX PEPTIDES", "BOOT · OK"];
    let i = 0;
    const tick = setInterval(() => {
      i++;
      if (i < stages.length) {
        const el = document.getElementById('bootStatus');
        if (el) el.textContent = stages[i];
      } else {
        clearInterval(tick);
        splash.classList.add('out');
        setTimeout(() => splash.remove(), 700);
      }
    }, 220);
  }

  /* ---------------- Hero counter ---------------- */
  function animateCounter(el) {
    const text = el.dataset.count || el.textContent;
    const isFloat = text.includes('.');
    const numberOnly = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    const hasComma = text.includes(',');
    const prefix = (text.match(/^[^\d-]*/) || [''])[0];
    const suffix = (text.match(/[^\d.,]*$/) || [''])[0];
    const dur = 1300;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = numberOnly * eased;
      let str = isFloat ? v.toFixed(1) : Math.round(v).toString();
      if (hasComma) str = Number(str).toLocaleString('en-US', isFloat ? { minimumFractionDigits: 1 } : {});
      el.textContent = prefix + str + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function bootCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
      el.textContent = (el.dataset.count.startsWith('0') && el.dataset.count.length > 1) ? el.dataset.count.replace(/\d/g, '0') : '0';
      animateCounter(el);
    });
  }

  /* ---------------- Drawer ---------------- */
  let drawer, drawerBody, scrim, isOpen = false;
  function buildDrawer() {
    drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <header class="drawer-head">
        <span class="drawer-code" id="drawerCode">PEP-001</span>
        <button class="drawer-close" id="drawerClose" aria-label="Close">
          <span>esc</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
            <line x1="4" y1="4" x2="16" y2="16"/>
            <line x1="16" y1="4" x2="4" y2="16"/>
          </svg>
        </button>
      </header>
      <div class="drawer-body" id="drawerBody"></div>`;
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);

    drawer.querySelector('#drawerClose').addEventListener('click', closeDrawer);
    scrim.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeDrawer(); });

    drawerBody = document.getElementById('drawerBody');
  }

  function openDrawer(id) {
    const p = window.PEPTIDE_INDEX[id];
    if (!p) return;
    if (!drawer) buildDrawer();
    drawerBody.innerHTML = renderMonograph(p);
    document.getElementById('drawerCode').textContent = p.code || '—';
    drawer.classList.add('open');
    scrim.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    isOpen = true;
    document.body.style.overflow = 'hidden';
    drawerBody.scrollTop = 0;

    if (location.hash !== '#p/' + id) {
      history.replaceState(null, '', '#p/' + id);
    }

    /* Wire up "stacks well with" links inside drawer */
    drawerBody.querySelectorAll('[data-pep]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        openDrawer(a.dataset.pep);
      });
    });
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    scrim.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    isOpen = false;
    document.body.style.overflow = '';
    if (location.hash.startsWith('#p/')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function renderMonograph(p) {
    const seqDiagram = p.seq ? renderSeqSvg(p.seq) : '';
    const protoRows = (p.protocol || []).map(r => `
      <div class="row"><span class="d">${r.d}</span><span class="v">${r.v}</span><span class="t">${r.t || ''}</span></div>
    `).join('');
    const stacks = (p.stacks || []).map(id => {
      const sp = window.PEPTIDE_INDEX[id];
      return sp ? `<a href="#p/${sp.id}" data-pep="${sp.id}" class="stack-chip"><span class="nm">${sp.n}</span><span class="cd">${sp.code}</span></a>` : '';
    }).filter(Boolean).join('');
    const refs = (p.refs || []).map(r => `<li><span class="rt">${r.t}</span><span class="rj">${r.j || ''} ${r.y ? '· ' + r.y : ''}</span></li>`).join('');
    const cats = (p.cats || []).map(c => `<span class="cat-chip">${c}</span>`).join('');

    return `
      <div class="mono-page">
        <div class="mono-tags">${cats}<span class="tier-chip">Tier · <b>${p.tier || '—'}</b></span></div>
        <h2 class="mono-name">${p.n}</h2>
        <p class="mono-tagline">${p.short || ''}</p>

        <div class="mono-meta">
          ${p.cas ? `<div><span class="k">CAS</span><span class="v">${p.cas}</span></div>` : ''}
          ${p.mw ? `<div><span class="k">MW</span><span class="v">${p.mw}</span></div>` : ''}
          ${p.residues ? `<div><span class="k">Class</span><span class="v">${p.residues}</span></div>` : ''}
          ${p.half ? `<div><span class="k">Half-life</span><span class="v">${p.half}</span></div>` : ''}
          ${p.route ? `<div><span class="k">Route</span><span class="v">${p.route}</span></div>` : ''}
          ${p.typical ? `<div><span class="k">Typical dose</span><span class="v">${p.typical}</span></div>` : ''}
          ${p.cycle ? `<div><span class="k">Cycle</span><span class="v">${p.cycle}</span></div>` : ''}
        </div>

        ${p.seq ? `<div class="mono-seq"><div class="lbl">// Sequence</div><div class="seq-text">${p.seq}</div>${seqDiagram}</div>` : ''}

        ${p.mechanism ? `<section class="mono-section">
          <h5>// Mechanism</h5>
          <p>${p.mechanism}</p>
        </section>` : ''}

        ${p.effects ? `<section class="mono-section">
          <h5>// Researched effects</h5>
          <ul class="bullets">${p.effects.map(e => `<li>${e}</li>`).join('')}</ul>
        </section>` : ''}

        ${protoRows ? `<section class="mono-section">
          <h5>// Dosing protocol · sample</h5>
          <div class="mono-proto">${protoRows}</div>
        </section>` : ''}

        ${stacks ? `<section class="mono-section">
          <h5>// Stacks well with</h5>
          <div class="stack-row">${stacks}</div>
        </section>` : ''}

        ${refs ? `<section class="mono-section">
          <h5>// References</h5>
          <ol class="refs">${refs}</ol>
        </section>` : ''}

        ${p.notes ? `<section class="mono-section">
          <h5>// Notes</h5>
          <p class="notes-p">${p.notes}</p>
        </section>` : ''}

        <div class="mono-disclaimer">
          For research purposes only. Not medical advice. Always consult a qualified physician.
        </div>
      </div>`;
  }

  /* SVG: amino acid bead chain */
  function renderSeqSvg(seq) {
    const beads = seq.split(/[-·]/).slice(0, 16).map(s => s.trim()).filter(Boolean);
    const w = 760, h = 110;
    const step = (w - 60) / Math.max(beads.length - 1, 1);
    const r = 16;
    const path = beads.map((_, i) => {
      const x = 30 + i * step;
      const y = i % 2 === 0 ? 75 : 35;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    const dots = beads.map((b, i) => {
      const x = 30 + i * step;
      const y = i % 2 === 0 ? 75 : 35;
      const fill = (i % 3 === 1) ? 'var(--lab)' : 'var(--bone)';
      const stroke = 'var(--ink)';
      return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
        <text x="${x}" y="${y + 4}" text-anchor="middle" font-family="JetBrains Mono" font-size="9" font-weight="700" fill="var(--ink)">${b.slice(0, 4)}</text></g>`;
    }).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet" style="margin-top: 14px;">
      <path d="${path}" stroke="var(--ink)" stroke-width="1.4" fill="none"/>
      ${dots}
    </svg>`;
  }

  /* ---------------- Hash routing ---------------- */
  function checkHash() {
    const m = location.hash.match(/^#p\/([\w\-]+)/);
    if (m) {
      openDrawer(m[1]);
    } else if (isOpen) {
      closeDrawer();
    }
  }

  /* ---------------- Delegation ---------------- */
  function wireGlobalDelegation() {
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-pep]');
      if (a && a.dataset.pep) {
        e.preventDefault();
        openDrawer(a.dataset.pep);
      }
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  function setupReveals() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    bootSplash();
    setTimeout(bootCounters, 80);
    buildDrawer();
    wireGlobalDelegation();
    setupReveals();
    checkHash();
    window.addEventListener('hashchange', checkHash);
  });

  /* expose */
  window.MOGH = { openDrawer, closeDrawer };
})();
