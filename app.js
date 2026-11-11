(() => {
  const CFG = window.SHOP_CONFIG;
  const PRODUCTS = window.PRODUCTS || [];
  const view = document.getElementById("view");
  const STRINGS = PRODUCTS.filter(p => p.type === "Tennis Strings");
  const CAT_ORDER = ["Tennis Strings", "Tennis Rackets", "Tennis Balls", "Pickleball Paddles", "Pickleball Bags", "Accessories", "Apparel"];

  // ---------- helpers ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => CFG.currency + (Number.isInteger(n) ? n : n.toFixed(2));
  const img = (u, w) => {
    if (u && u.startsWith("images/")) return w <= 500 ? u.replace("images/", "images/thumb/") : u;
    return u && u.includes("cdn.shopify.com") ? u + (u.includes("?") ? "&" : "?") + "width=" + w : u;
  };
  const wa = text => `https://wa.me/${(CFG.whatsappNumber || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  const pageUrl = () => (location.protocol.startsWith("http") ? location.href : "");

  function priceLabel(p) {
    const prices = [...new Set(p.variants.map(v => v.price).filter(n => n > 0))].sort((a, b) => a - b);
    if (!prices.length) return "Ask for price";
    return (prices.length > 1 ? "From " : "") + money(prices[0]);
  }
  const minPrice = p => Math.min(...p.variants.map(v => v.price).filter(n => n > 0), Infinity);

  // ---------- catalogue ----------
  const state = { cat: "All", q: "", sort: "featured", scroll: 0 };

  function categories() {
    const counts = {};
    PRODUCTS.forEach(p => (counts[p.type] = (counts[p.type] || 0) + 1));
    const names = Object.keys(counts).sort((a, b) => {
      const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
    return [["All", PRODUCTS.length], ...names.map(n => [n, counts[n]])];
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    let list = PRODUCTS.filter(p =>
      (state.cat === "All" || p.type === state.cat) &&
      (!q || `${p.title} ${p.vendor} ${p.type}`.toLowerCase().includes(q)));
    if (state.sort === "low") list = [...list].sort((a, b) => minPrice(a) - minPrice(b));
    if (state.sort === "high") list = [...list].sort((a, b) => (minPrice(b) === Infinity ? -1 : minPrice(b)) - (minPrice(a) === Infinity ? -1 : minPrice(a)));
    if (state.sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }

  function cardHtml(p) {
    return `<a class="card" href="#/p/${encodeURIComponent(p.handle)}">
      <div class="thumb">
        ${p.images[0] ? `<img loading="lazy" src="${esc(img(p.images[0], 500))}" alt="${esc(p.title)}">` : ""}
        ${p.preloved ? `<span class="badge">Pre-loved</span>` : ""}
      </div>
      <div class="card-body">
        <span class="vendor">${esc(p.vendor)}</span>
        <span class="card-title">${esc(p.title)}</span>
        <span class="price">${esc(priceLabel(p))}</span>
      </div>
    </a>`;
  }

  function renderGrid() {
    const list = filtered();
    document.getElementById("count").textContent = `${list.length} item${list.length === 1 ? "" : "s"}`;
    document.getElementById("grid").innerHTML = list.length
      ? list.map(cardHtml).join("")
      : `<p class="empty">Nothing matches that search. Try another word, or message us — we may have it.</p>`;
  }

  function renderChips() {
    document.getElementById("cats").innerHTML = categories().map(([name, n]) =>
      `<button class="chip ${state.cat === name ? "on" : ""}" data-cat="${esc(name)}">${esc(name)}<small>${n}</small></button>`).join("");
  }

  function renderCatalogue() {
    view.innerHTML = `
      <section class="hero">
        <div>
          <h1>${esc(CFG.tagline)}</h1>
          <p>Browse what's in stock, then message us on WhatsApp to order or to book a restring.</p>
        </div>
        <a class="btn btn-ball" href="#/stringing">Book a stringing</a>
      </section>
      <div class="filters">
        <input class="search" id="q" type="search" placeholder="Search strings, paddles, brands…" value="${esc(state.q)}" aria-label="Search products">
        <select id="sort" aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
          <option value="az">Name: A to Z</option>
        </select>
      </div>
      <div class="chips" id="cats"></div>
      <p class="count" id="count"></p>
      <div class="grid" id="grid"></div>`;
    document.getElementById("sort").value = state.sort;
    renderChips();
    renderGrid();
    document.getElementById("q").addEventListener("input", e => { state.q = e.target.value; renderGrid(); });
    document.getElementById("sort").addEventListener("change", e => { state.sort = e.target.value; renderGrid(); });
    document.getElementById("cats").addEventListener("click", e => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      state.cat = b.dataset.cat;
      renderChips();
      renderGrid();
    });
    window.scrollTo(0, state.scroll);
  }

  // ---------- product page ----------
  function renderProduct(handle) {
    const p = PRODUCTS.find(x => x.handle === handle);
    if (!p) {
      view.innerHTML = `<a class="back" href="#/">← Back to shop</a><p class="empty">We couldn't find that item.</p>`;
      return;
    }
    const first = p.variants.find(v => v.price > 0) || p.variants[0] || { o: [], price: 0, img: "" };
    let sel = [...first.o];
    let activeImg = p.images[0] || first.img || "";

    const match = () => p.variants.find(v => v.o.every((x, i) => x === sel[i]));
    const valuesOf = i => [...new Set(p.variants.map(v => v.o[i]))];
    const available = (i, val) => p.variants.some(v => v.o[i] === val && v.o.every((x, j) => j === i || x === sel[j]));

    function orderText(v) {
      const lines = [`Hi ${CFG.businessName}! I'd like to order:`, `• ${p.title}`];
      p.options.forEach((name, i) => lines.push(`• ${name}: ${sel[i]}`));
      if (v && v.price > 0) lines.push(`• Price: ${money(v.price)}`);
      if (pageUrl()) lines.push("", pageUrl());
      return lines.join("\n");
    }

    function draw() {
      const v = match();
      const thumbs = p.images.length > 1
        ? `<div class="thumbs">${p.images.map(u => `<button class="${u === activeImg ? "on" : ""}" data-img="${esc(u)}" aria-label="View photo"><img loading="lazy" src="${esc(img(u, 150))}" alt=""></button>`).join("")}</div>`
        : "";
      const opts = p.options.map((name, i) => `
        <div class="opt">
          <div class="opt-label">${esc(name)}: <b>${esc(sel[i])}</b></div>
          <div class="chips">${valuesOf(i).map(val =>
            `<button class="chip ${val === sel[i] ? "on" : ""} ${available(i, val) ? "" : "na"}" data-opt="${i}" data-val="${esc(val)}">${esc(val)}</button>`).join("")}</div>
        </div>`).join("");
      view.innerHTML = `
        <a class="back" href="#/">← Back to shop</a>
        <article class="product">
          <div>
            <div class="gallery-main">
              ${activeImg ? `<img src="${esc(img(activeImg, 1000))}" alt="${esc(p.title)}">` : ""}
              ${p.preloved ? `<span class="badge">Pre-loved</span>` : ""}
            </div>
            ${thumbs}
          </div>
          <div class="info">
            <span class="vendor">${esc(p.vendor)} · ${esc(p.type)}</span>
            <h1>${esc(p.title)}</h1>
            <div class="price">${v && v.price > 0 ? esc(money(v.price)) : "Ask for price"}</div>
            ${opts}
            <div class="actions">
              <a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="${esc(wa(orderText(v)))}">Order on WhatsApp</a>
              ${p.type === "Tennis Strings" ? `<a class="btn btn-ghost btn-block" href="#/stringing?string=${encodeURIComponent(p.handle)}">String my racket with this</a>` : ""}
            </div>
            <p class="note">No payment on this site. Tapping the button opens WhatsApp with your order filled in, and we'll confirm stock and arrange payment there.</p>
            ${p.html ? `<div class="desc">${p.html}</div>` : ""}
          </div>
        </article>`;
    }

    view.onclick = e => {
      const o = e.target.closest("[data-opt]");
      const t = e.target.closest("[data-img]");
      if (o) {
        const i = +o.dataset.opt;
        sel[i] = o.dataset.val;
        let v = match();
        if (!v) { v = p.variants.find(x => x.o[i] === sel[i]); sel = [...v.o]; }
        if (v.img) activeImg = v.img;
        draw();
      } else if (t) {
        activeImg = t.dataset.img;
        draw();
      }
    };
    draw();
    window.scrollTo(0, 0);
  }

  // ---------- stringing form ----------
  function renderStringing(params) {
    const pre = params.get("string") || "";
    const stringOptions = sel => STRINGS.map(s => `<option value="${esc(s.handle)}" ${s.handle === sel ? "selected" : ""}>${esc(s.title)}</option>`).join("");
    view.innerHTML = `
      <div class="form-page">
        <h1>Book a stringing</h1>
        <p>Fill this in and tap send. WhatsApp opens with your order written out, and we'll reply to confirm drop-off and timing.</p>
        <form class="panel" id="sform">
          <div class="field"><label for="f-name">Your name</label><input id="f-name" autocomplete="name" required></div>
          <div class="field"><label for="f-racket">Racket <span class="hint">(brand and model)</span></label><input id="f-racket" placeholder="e.g. Babolat Pure Aero 100" required></div>
          <div class="field">
            <label for="f-string">String</label>
            <select id="f-string">
              <option value="">Choose a string…</option>
              ${stringOptions(pre)}
              <option value="__own">I'll bring my own string</option>
              <option value="__help">Not sure — please recommend one</option>
            </select>
          </div>
          <div class="row" id="f-string-opts" hidden></div>
          <div class="field" id="f-own-wrap" hidden><label for="f-own">Which string are you bringing?</label><input id="f-own" placeholder="e.g. Babolat RPM Blast 1.25"></div>
          <label class="check"><input type="checkbox" id="f-hybrid"> Hybrid — use a different string for the crosses</label>
          <div class="field" id="f-cross-wrap" hidden>
            <label for="f-cross">Cross string</label>
            <select id="f-cross"><option value="">Choose a string…</option>${stringOptions("")}<option value="__own">I'll bring my own string</option></select>
          </div>
          <div class="row">
            <div class="field"><label for="f-mains">Tension <span class="hint">(lbs)</span></label><input id="f-mains" type="number" inputmode="decimal" min="30" max="70" step="0.5" placeholder="52" required></div>
            <div class="field"><label for="f-crosses">Crosses <span class="hint">(if different)</span></label><input id="f-crosses" type="number" inputmode="decimal" min="30" max="70" step="0.5" placeholder="Same"></div>
          </div>
          <div class="field"><label for="f-qty">Number of rackets</label><input id="f-qty" type="number" inputmode="numeric" min="1" max="20" value="1" required></div>
          <div class="field"><label for="f-notes">Notes <span class="hint">(optional)</span></label><textarea id="f-notes" placeholder="When you need it by, grip changes, anything else"></textarea></div>
          <div class="estimate" id="f-estimate" hidden></div>
          <button class="btn btn-wa btn-block" type="submit">Send order on WhatsApp</button>
        </form>
      </div>`;

    const $ = id => document.getElementById(id);
    const strSel = $("f-string"), optsBox = $("f-string-opts");
    const chosen = () => STRINGS.find(s => s.handle === strSel.value);

    function drawOpts() {
      const s = chosen();
      // "Size" on strings means reel vs set, which doesn't apply to a restring.
      const opts = s ? s.options.map((n, i) => [n, i]).filter(([n]) => n !== "Size") : [];
      optsBox.hidden = !opts.length;
      optsBox.innerHTML = opts.map(([name, i]) => `
        <div class="field"><label for="f-o${i}">${esc(name)}</label>
          <select id="f-o${i}" data-name="${esc(name)}"><option value="">Any</option>${[...new Set(s.variants.map(v => v.o[i]))].map(v => `<option>${esc(v)}</option>`).join("")}</select>
        </div>`).join("");
      $("f-own-wrap").hidden = strSel.value !== "__own";
      drawEstimate();
    }

    function drawEstimate() {
      const box = $("f-estimate"), s = chosen();
      const fee = CFG.stringingLabourFee;
      if (fee == null) { box.hidden = true; return; }
      const qty = Math.max(1, +$("f-qty").value || 1);
      const i = s ? s.options.indexOf("Size") : -1;
      const set = s && i >= 0 ? s.variants.find(v => /set/i.test(v.o[i]) && v.price > 0) : null;
      box.hidden = false;
      if (strSel.value === "__own") box.textContent = `Estimate: ${money(fee * qty)} (labour only)`;
      else if (set && !$("f-hybrid").checked) box.textContent = `Estimate: ${money((fee + set.price) * qty)} (string + labour)`;
      else box.textContent = `Labour is ${money(fee)} per racket. We'll confirm the string price on WhatsApp.`;
    }

    strSel.addEventListener("change", drawOpts);
    $("f-qty").addEventListener("input", drawEstimate);
    $("f-hybrid").addEventListener("change", e => { $("f-cross-wrap").hidden = !e.target.checked; drawEstimate(); });
    drawOpts();

    const stringLabel = (value, own) => {
      if (value === "__own") return "Bringing my own" + (own ? ` (${own})` : "");
      if (value === "__help") return "Please recommend one";
      const s = STRINGS.find(x => x.handle === value);
      return s ? s.title : "";
    };

    $("sform").addEventListener("submit", e => {
      e.preventDefault();
      if (!strSel.value) { strSel.focus(); strSel.setCustomValidity("Please choose a string"); strSel.reportValidity(); strSel.setCustomValidity(""); return; }
      const hybrid = $("f-hybrid").checked && $("f-cross").value;
      let main = stringLabel(strSel.value, $("f-own").value.trim());
      const picks = [...optsBox.querySelectorAll("select")].filter(s => s.value).map(s => `${s.dataset.name} ${s.value}`);
      if (picks.length) main += ` — ${picks.join(", ")}`;
      const mains = $("f-mains").value, crosses = $("f-crosses").value;
      const lines = [
        `Hi ${CFG.businessName}! I'd like to book a stringing:`,
        `• Name: ${$("f-name").value.trim()}`,
        `• Racket: ${$("f-racket").value.trim()}`,
        hybrid ? `• Mains: ${main}` : `• String: ${main}`,
        hybrid ? `• Crosses: ${stringLabel($("f-cross").value)}` : null,
        `• Tension: ${crosses && crosses !== mains ? `${mains} lbs mains / ${crosses} lbs crosses` : `${mains} lbs`}`,
        `• Rackets: ${$("f-qty").value}`,
        $("f-notes").value.trim() ? `• Notes: ${$("f-notes").value.trim()}` : null,
      ].filter(Boolean);
      window.open(wa(lines.join("\n")), "_blank", "noopener");
    });
    window.scrollTo(0, 0);
  }

  // ---------- router ----------
  let onCatalogue = false;
  function route() {
    if (onCatalogue) state.scroll = window.scrollY;
    view.onclick = null;
    const [path, query = ""] = location.hash.replace(/^#/, "").split("?");
    const parts = path.split("/").filter(Boolean);
    onCatalogue = false;
    if (parts[0] === "p" && parts[1]) renderProduct(decodeURIComponent(parts[1]));
    else if (parts[0] === "stringing") renderStringing(new URLSearchParams(query));
    else { onCatalogue = true; renderCatalogue(); }
    document.querySelectorAll("[data-nav]").forEach(a =>
      a.classList.toggle("active", a.dataset.nav === (parts[0] === "stringing" ? "stringing" : "shop")));
  }

  document.getElementById("brand-name").textContent = CFG.businessName;
  document.getElementById("footer-name").textContent = CFG.businessName;
  document.getElementById("chat-link").href = wa(`Hi ${CFG.businessName}!`);
  document.title = `${CFG.businessName} — Stringing, strings and court gear`;
  window.addEventListener("hashchange", route);
  route();
})();
