// =====================================================================
// SKETCH LAYER — subtle pencil construction drawings along the home page
// (rule of thirds, golden rectangle + spiral, golden triangle, compass
// circles, registration marks). Decorative only: pointer-events: none,
// aria-hidden, very low opacity. Lines draw in quietly as you scroll.
// =====================================================================
(function () {
  const isHome = !!document.getElementById('hero');

  const NS = 'http://www.w3.org/2000/svg';
  const PHI = 0.6180339887;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let layer, svg, root, maskEl, groups = [], revealed = new Set(), lastW = 0, lastH = 0;

  // Seeded RNG so the "hand" is the same on every rebuild
  function rngFactory(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rnd = rngFactory(7);
  const jit = (s) => (rnd() - 0.5) * 2 * s;

  // ---------- hand-drawn path builders ----------
  function linePath(x1, y1, x2, y2, over = 8, wob = 0.7) {
    const L = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux;
    const o1 = over * (0.4 + rnd() * 0.6), o2 = over * (0.4 + rnd() * 0.6);
    const sx = x1 - ux * o1, sy = y1 - uy * o1, tot = L + o1 + o2;
    const n = Math.max(2, Math.ceil(tot / 90));
    let d = '';
    for (let i = 0; i <= n; i++) {
      const t = (tot * i) / n, j = i === 0 || i === n ? jit(wob * 0.4) : jit(wob);
      const x = sx + ux * t + nx * j, y = sy + uy * t + ny * j;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d;
  }
  function arcPath(cx, cy, r, a0, a1, over = 4, wob = 0.8) {
    const e0 = a0 - over * (0.3 + rnd() * 0.7), e1 = a1 + over * (0.3 + rnd() * 0.7);
    const n = Math.max(10, Math.ceil(Math.abs(e1 - e0) * r / 900));
    let d = '';
    for (let i = 0; i <= n; i++) {
      const th = ((e0 + ((e1 - e0) * i) / n) * Math.PI) / 180, rr = r + jit(wob);
      d += (i ? 'L' : 'M') + (cx + rr * Math.cos(th)).toFixed(1) + ' ' + (cy + rr * Math.sin(th)).toFixed(1);
    }
    return d;
  }

  // ---------- group helpers ----------
  function newGroup(anchorY) {
    const g = document.createElementNS(NS, 'g');
    g.dataset.anchor = anchorY;
    g._i = 0;
    root.appendChild(g);
    groups.push(g);
    return g;
  }
  function addPath(g, d, cls) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', cls);
    if (cls.indexOf('sk-draw') > -1) p.setAttribute('pathLength', '1');
    p.style.transitionDelay = (g._i++ * 0.12).toFixed(2) + 's';
    g.appendChild(p);
  }
  // solid pencil stroke = main pass + lighter second pass
  function stroke(g, x1, y1, x2, y2, over) {
    addPath(g, linePath(x1, y1, x2, y2, over), 'sk-draw');
    addPath(g, linePath(x1, y1, x2, y2, over), 'sk-draw sk-soft');
  }
  function dashed(g, x1, y1, x2, y2, dotted) {
    addPath(g, linePath(x1, y1, x2, y2, 0, 0.4), dotted ? 'sk-fade sk-dot' : 'sk-fade sk-dash');
  }
  function arc(g, cx, cy, r, a0, a1, over) {
    addPath(g, arcPath(cx, cy, r, a0, a1, over), 'sk-draw');
    addPath(g, arcPath(cx, cy, r, a0, a1, over), 'sk-draw sk-soft');
  }
  function note(g, x, y, txt, anchor) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('class', 'sk-fade sk-note');
    if (anchor) t.setAttribute('text-anchor', anchor);
    t.textContent = txt;
    t.style.transitionDelay = (g._i++ * 0.12).toFixed(2) + 's';
    g.appendChild(t);
  }
  function cross(g, x, y, s = 7) {
    addPath(g, linePath(x - s, y, x + s, y, 2, 0.2), 'sk-draw');
    addPath(g, linePath(x, y - s, x, y + s, 2, 0.2), 'sk-draw');
  }

  // golden rectangle with fibonacci squares + spiral; mirror flips horizontally
  function goldenSpiral(g, x, y, w, mirror, steps = 8) {
    const h = w * PHI;
    let x0 = x, y0 = y, x1 = x + w, y1 = y + h;
    const X = (v) => (mirror ? 2 * x + w - v : v);
    const A = (a) => (mirror ? 180 - a : a);
    stroke(g, X(x0), y0, X(x1), y0); stroke(g, X(x0), y1, X(x1), y1);
    stroke(g, X(x0), y0, X(x0), y1); stroke(g, X(x1), y0, X(x1), y1);
    const order = ['L', 'T', 'R', 'B'];
    let eye = [0, 0];
    for (let i = 0; i < steps; i++) {
      const c = order[i % 4];
      let s;
      if (c === 'L') { s = y1 - y0; stroke(g, X(x0 + s), y0, X(x0 + s), y1, 4); arcM(x0 + s, y1, s, 180, 270); x0 += s; }
      else if (c === 'T') { s = x1 - x0; stroke(g, X(x0), y0 + s, X(x1), y0 + s, 4); arcM(x0, y0 + s, s, 270, 360); y0 += s; }
      else if (c === 'R') { s = y1 - y0; stroke(g, X(x1 - s), y0, X(x1 - s), y1, 4); arcM(x1 - s, y0, s, 0, 90); x1 -= s; }
      else { s = x1 - x0; stroke(g, X(x0), y1 - s, X(x1), y1 - s, 4); arcM(x1, y1 - s, s, 90, 180); y1 -= s; }
      if (s < 6) break;
    }
    eye = [X((x0 + x1) / 2), (y0 + y1) / 2];
    function arcM(cx, cy, r, a0, a1) {
      if (mirror) arc(g, X(cx), cy, r, A(a1), A(a0), 3);
      else arc(g, cx, cy, r, a0, a1, 3);
    }
    return { h, eye };
  }


  // ---------- mask: keep the drawings *under* content ----------
  // Positions come from the layout (offsetTop chain), so AOS entrance transforms don't shift the holes.
  const BOXES = '.package, .package-addon, .details-container, .project-box, .video-thumbnail, .masonry-item, .contact-info-container, .btn, .lang-switcher, iframe, video, .scroll-indicator';
  const TEXT = 'h1, h2, h3, h4, p, li, blockquote, img';
  const SKIP = 'nav, footer, .sidebar, .gallery-sub-nav, .sketch-layer, #popup-overlay, #video-popup-overlay, #youtube-popup-overlay, .page-loader';
  function layoutPos(el) {
    let x = 0, y = 0, e = el;
    while (e) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y };
  }
  function hole(x, y, w, h, rx) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', x.toFixed(1)); r.setAttribute('y', y.toFixed(1));
    r.setAttribute('width', Math.max(0, w).toFixed(1)); r.setAttribute('height', Math.max(0, h).toFixed(1));
    if (rx) r.setAttribute('rx', rx);
    r.setAttribute('fill', 'black');
    maskEl.appendChild(r);
  }
  function buildMask(W, H) {
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', W); bg.setAttribute('height', H); bg.setAttribute('fill', 'white');
    maskEl.appendChild(bg);
    document.querySelectorAll(BOXES).forEach((el) => {
      if (el.closest(SKIP) || !el.offsetWidth || (el.parentElement && el.parentElement.closest(BOXES))) return;
      const p = layoutPos(el);
      const rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      hole(p.x - 1, p.y - 1, el.offsetWidth + 2, el.offsetHeight + 2, rad);
    });
    document.querySelectorAll(TEXT).forEach((el) => {
      if (el.closest(SKIP) || el.closest(BOXES) || !el.offsetWidth) return;
      if (el.tagName !== 'IMG' && el.querySelector(TEXT.replace(', img', ''))) return; // let the inner element define the hole
      const p = layoutPos(el);
      let dx = 0, dy = 0, w = el.offsetWidth, h = el.offsetHeight;
      if (el.tagName !== 'IMG') {
        // tight box around the actual text (translation-safe: measured relative to the element itself)
        const range = document.createRange(); range.selectNodeContents(el);
        const rr = range.getBoundingClientRect(), er = el.getBoundingClientRect();
        if (rr.width && er.width) {
          const sx = el.offsetWidth / er.width || 1;
          dx = (rr.left - er.left) * sx; dy = (rr.top - er.top) * sx; w = rr.width * sx; h = rr.height * sx;
        }
      }
      const pad = el.tagName === 'IMG' ? 2 : 8;
      hole(p.x + dx - pad, p.y + dy - pad, w + pad * 2, h + pad * 2, 4);
    });
  }

  // ---------- composition ----------
  function sectionBox(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, h: r.height, bottom: r.bottom + window.scrollY };
  }

  function build() {
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.scrollHeight;
    if (Math.abs(W - lastW) < 2 && Math.abs(H - lastH) < 2 && svg) return;
    lastW = W; lastH = H;
    rnd = rngFactory(7);
    const mobile = W < 768;

    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'sketch-layer';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
    }
    layer.innerHTML = '';
    layer.style.height = H + 'px';
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    layer.appendChild(svg);
    // everything is drawn inside a masked group; content boxes punch holes in the mask
    const defs = document.createElementNS(NS, 'defs');
    maskEl = document.createElementNS(NS, 'mask');
    maskEl.setAttribute('id', 'sk-mask');
    maskEl.setAttribute('maskUnits', 'userSpaceOnUse');
    ['x', 'y'].forEach((k) => maskEl.setAttribute(k, 0));
    maskEl.setAttribute('width', W); maskEl.setAttribute('height', H);
    defs.appendChild(maskEl); svg.appendChild(defs);
    root = document.createElementNS(NS, 'g');
    root.setAttribute('mask', 'url(#sk-mask)');
    svg.appendChild(root);
    groups = [];

    // 1. Rule of thirds — full-height dashed verticals (desktop only)
    if (!mobile) {
      const g = newGroup(0);
      dashed(g, W / 3, 0, W / 3, H); dashed(g, (2 * W) / 3, 0, (2 * W) / 3, H);
      note(g, W / 3 + 6, 110, '1/3'); note(g, (2 * W) / 3 + 6, 110, '2/3');
    }

    if (isHome) {
    // 2. Hero — golden spiral, bottom-right, bleeding off the edge
    const hero = sectionBox('hero');
    if (hero) {
      const g = newGroup(hero.top);
      const w = mobile ? W * 0.95 : Math.min(W * 0.56, 980);
      const x = mobile ? W * 0.2 : W - w * 0.86;
      const y = hero.bottom - w * PHI - (mobile ? 30 : hero.h * 0.06);
      const s = goldenSpiral(g, x, y, w, false, mobile ? 6 : 8);
      if (!mobile) {
        note(g, x + w * 0.6, y - 10, '1 : 1.618');
        note(g, s.eye[0] + 8, s.eye[1] + 4, 'φ');
      }
    }

    // 3. Services — compass circle half off the left edge
    const sv = sectionBox('services');
    if (sv) {
      const g = newGroup(sv.top);
      const r = mobile ? W * 0.55 : Math.min(W * 0.3, 460);
      const cx = mobile ? -r * 0.35 : W * 0.04, cy = sv.top + sv.h * 0.32;
      arc(g, cx, cy, r, -95, 95, 0);
      if (!mobile) {
        cross(g, cx, cy);
        const a = (-32 * Math.PI) / 180;
        dashed(g, cx, cy, cx + r * Math.cos(a), cy + r * Math.sin(a));
        arc(g, cx + r * Math.cos(a), cy + r * Math.sin(a), 22, 120, 200, 1);
        note(g, cx + r * Math.cos(a) + 10, cy + r * Math.sin(a) - 8, 'r');
      }
    }

    // 4. Process — golden triangle (diagonal + perpendiculars), dotted
    const pr = sectionBox('process');
    if (pr && !mobile) {
      const g = newGroup(pr.top);
      const ax = 0, ay = pr.top, bx = W, by = pr.bottom;
      dashed(g, ax, ay, bx, by, true);
      const foot = (px, py) => {
        const t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2);
        return [ax + t * (bx - ax), ay + t * (by - ay)];
      };
      const f1 = foot(W, pr.top), f2 = foot(0, pr.bottom);
      dashed(g, W, pr.top, f1[0], f1[1], true);
      dashed(g, 0, pr.bottom, f2[0], f2[1], true);
    }

    // 5. Work — smaller mirrored spiral on the left
    const wk = sectionBox('work');
    if (wk && !mobile) {
      const g = newGroup(wk.top);
      const w = Math.min(W * 0.34, 560);
      goldenSpiral(g, -w * 0.18, wk.top + wk.h * 0.12, w, true, 7);
    }

    // 6. Contact — compass circle + figure label on the right
    const ct = sectionBox('contact');
    if (ct) {
      const g = newGroup(ct.top);
      const r = mobile ? W * 0.4 : Math.min(W * 0.16, 240);
      const cx = W - (mobile ? r * 0.3 : r * 0.55), cy = ct.top + ct.h * 0.5;
      arc(g, cx, cy, r, 0, 360, 0);
      if (!mobile) { cross(g, cx, cy, 6); note(g, cx - r, cy + r + 22, 'fig. 03'); }
    }

    // 7. Registration marks at each section boundary (desktop)
    if (!mobile) {
      document.querySelectorAll('main > section').forEach((sec, i) => {
        if (i === 0) return;
        const b = sectionBox(sec.id); if (!b) return;
        const g = newGroup(b.top);
        cross(g, 28, b.top, 6); cross(g, W - 28, b.top, 6);
      });
    }

    } else {

    // ---------- inner pages (Video / Pictures / Graphics) ----------
    const intro = sectionBox(document.querySelector('.page-intro'));
    if (intro) {
      const g = newGroup(intro.top);
      const w = mobile ? W * 0.95 : Math.min(W * 0.5, 900);
      const x = mobile ? W * 0.2 : W - w * 0.82;
      const y = intro.bottom - w * PHI - (mobile ? 20 : intro.h * 0.08);
      const s = goldenSpiral(g, x, y, w, false, mobile ? 6 : 8);
      if (!mobile) { note(g, x + w * 0.6, y - 10, '1 : 1.618'); note(g, s.eye[0] + 8, s.eye[1] + 4, 'φ'); }
      if (!mobile) {
        const r = Math.min(W * 0.2, 300), cx = W * 0.06, cy = intro.top + intro.h * 0.38;
        arc(g, cx, cy, r, -90, 90, 0); cross(g, cx, cy);
      }
    }
    // blocks = gallery sections (or category titles on Pictures)
    let blocks = Array.from(document.querySelectorAll('section.project-section'));
    if (!blocks.length) blocks = Array.from(document.querySelectorAll('.masonry-category-title'));
    const footerEl = document.querySelector('footer');
    const endY = footerEl ? sectionBox(footerEl).top : H;
    blocks.forEach((el, i) => {
      const b = sectionBox(el); if (!b) return;
      const next = blocks[i + 1] ? sectionBox(blocks[i + 1]).top : endY;
      b.h = Math.max(b.h, next - b.top); b.bottom = b.top + b.h;
      const g = newGroup(b.top);
      if (!mobile) { cross(g, 28, b.top, 6); cross(g, W - 28, b.top, 6); }
      const motif = i % 3;
      if (motif === 0) {
        const r = mobile ? W * 0.45 : Math.min(W * 0.26, 420);
        const cx = mobile ? -r * 0.3 : -r * 0.35, cy = b.top + Math.min(b.h, 900) * 0.45;
        arc(g, cx, cy, r, -92, 92, 0);
      } else if (motif === 1 && !mobile) {
        const w = Math.min(W * 0.32, 520);
        goldenSpiral(g, W - w * 0.78, b.top + 40, w, true, 7);
      } else if (!mobile) {
        const top = b.top, bot = b.top + Math.min(b.h, 1200);
        dashed(g, 0, top, W, bot, true);
        note(g, W - 90, top + 30, 'fig. 0' + (i + 1));
      }
    });
    }

    buildMask(W, H);

    // restore already-revealed groups instantly (no re-animation on resize)
    groups.forEach((g) => {
      if (revealed.has(g.dataset.anchor) || reduceMotion) {
        g.classList.add('no-anim', 'is-drawn');
      }
    });
    check();
  }

  // ---------- reveal on scroll ----------
  let ticking = false, ready = false;
  function check() {
    ticking = false;
    if (!ready) return;
    const line = window.scrollY + window.innerHeight * 0.88;
    groups.forEach((g) => {
      if (!g.classList.contains('is-drawn') && +g.dataset.anchor < line) {
        g.classList.add('is-drawn');
        revealed.add(g.dataset.anchor);
      }
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }

  let rt;
  function onResize() { clearTimeout(rt); rt = setTimeout(build, 250); }

  function init() {
    build();
    // wait for the page-loader curtain before drawing the first lines
    setTimeout(() => { ready = true; check(); }, reduceMotion ? 0 : 900);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(document.body);
    new MutationObserver(() => { lastW = 0; onResize(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['dir', 'lang'] });
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
