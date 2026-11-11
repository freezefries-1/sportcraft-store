(() => {
  const CFG = window.SHOP_CONFIG;
  const PRODUCTS = window.PRODUCTS || [];
  const view = document.getElementById("view");
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

  // ---------- stock (from the Google Sheet) ----------
  const STOCK = { loaded: false };
  const LOW = CFG.lowStockThreshold ?? 3;
  function stockStatus(v) {
    if (!STOCK.loaded || !v) return null;
    const s = v.stock;
    if (s && (!s.available || s.qty === 0)) return { sold: true, label: "Sold out", cls: "out" };
    if (s && s.qty != null && s.qty <= LOW) return { sold: false, label: `Only ${s.qty} left`, cls: "low" };
    return { sold: false, label: "In stock", cls: "in" };
  }
  const soldOut = v => !!stockStatus(v)?.sold;
  const productSoldOut = p => STOCK.loaded && p.variants.length > 0 && p.variants.every(soldOut);

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c !== '"') cell += c;
        else if (text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  async function loadStock() {
    if (!CFG.stockSheetUrl) return;
    try {
      const res = await fetch(CFG.stockSheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const rows = parseCsv(await res.text());
      const head = (rows.shift() || []).map(h => h.trim().toLowerCase());
      const [ci, cq, ca, cp, cf] = ["id", "quantity", "available", "price", "featured"].map(n => head.indexOf(n));
      if (ci < 0) throw new Error("the sheet has no ID column");
      const byId = new Map(rows.map(r => [(r[ci] || "").trim(), r]));
      PRODUCTS.forEach(p => { p.featured = null; });
      PRODUCTS.forEach(p => p.variants.forEach(v => {
        const r = byId.get(v.id);
        if (!r) return;
        // Featured: a number (1 shows first) or "yes" on any one row of the product.
        const f = cf >= 0 ? (r[cf] || "").trim().toLowerCase() : "";
        const rank = f !== "" && !isNaN(+f) ? +f : ["yes", "y", "true", "x"].includes(f) ? 1e6 : null;
        if (rank !== null && (p.featured === null || rank < p.featured)) p.featured = rank;
        const q = cq >= 0 ? (r[cq] || "").trim() : "";
        const a = ca >= 0 ? (r[ca] || "").trim().toLowerCase() : "";
        v.stock = {
          qty: q === "" || isNaN(+q) ? null : Math.max(0, Math.floor(+q)),
          available: !["no", "n", "false", "0", "x"].includes(a),
        };
        const price = cp >= 0 ? (r[cp] || "").replace(/[^0-9.]/g, "") : "";
        if (price !== "" && !isNaN(+price)) v.price = +price;
      }));
      STOCK.loaded = true;
      // Redraw with stock info, but never wipe a half-filled stringing form.
      if (!location.hash.startsWith("#/stringing")) route();
    } catch (e) {
      console.warn("Stock sheet could not be loaded:", e);
    }
  }

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
    if (state.sort === "featured") {
      const rank = p => (p.featured == null ? Infinity : p.featured);
      list = [...list].sort((a, b) => (rank(a) === rank(b) ? 0 : rank(a) - rank(b)));
    }
    if (state.sort === "low") list = [...list].sort((a, b) => minPrice(a) - minPrice(b));
    if (state.sort === "high") list = [...list].sort((a, b) => (minPrice(b) === Infinity ? -1 : minPrice(b)) - (minPrice(a) === Infinity ? -1 : minPrice(a)));
    if (state.sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }

  function cardHtml(p) {
    const gone = productSoldOut(p);
    return `<a class="card ${gone ? "sold" : ""}" href="#/p/${encodeURIComponent(p.handle)}">
      <div class="thumb">
        ${p.images[0] ? `<img loading="lazy" src="${esc(img(p.images[0], 500))}" alt="${esc(p.title)}">` : ""}
        ${gone ? `<span class="badge badge-out">Sold out</span>` : p.preloved ? `<span class="badge">Pre-loved</span>` : p.isNew ? `<span class="badge badge-new">New</span>` : ""}
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
    // In the default order, featured products get their own block above the rest.
    const top = state.sort === "featured" ? list.filter(p => p.featured != null) : [];
    const cards = top.length && top.length < list.length
      ? `<h2 class="grid-head">Featured</h2>${top.map(cardHtml).join("")}
         <h2 class="grid-head grid-head-rest">More products</h2>${list.slice(top.length).map(cardHtml).join("")}`
      : list.map(cardHtml).join("");
    document.getElementById("grid").innerHTML = list.length
      ? cards
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
          ${CFG.slogan ? `<div class="eyebrow">${esc(CFG.slogan)}</div>` : ""}
          <h1>${esc(CFG.tagline)}</h1>
          <p>Browse what's in stock, then message us on WhatsApp to order or to book a restring.</p>
        </div>
        <div class="hero-actions">
          <a class="btn btn-ball" href="#/stringing">Book a stringing</a>
          <a class="btn btn-line" href="#/prices">Restringing prices</a>
        </div>
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
    const first = p.variants.find(v => v.price > 0 && !soldOut(v)) || p.variants.find(v => v.price > 0) || p.variants[0] || { o: [], price: 0, img: "" };
    let sel = [...first.o];
    let activeImg = p.images[0] || first.img || "";

    const match = () => p.variants.find(v => v.o.every((x, i) => x === sel[i]));
    const valuesOf = i => [...new Set(p.variants.map(v => v.o[i]))];
    const available = (i, val) => p.variants.some(v => v.o[i] === val && !soldOut(v) && v.o.every((x, j) => j === i || x === sel[j]));

    function orderText(v) {
      const lines = [`Hi ${CFG.businessName}! I'd like to order:`, `• ${p.title}`];
      p.options.forEach((name, i) => lines.push(`• ${name}: ${sel[i]}`));
      if (v && v.price > 0) lines.push(`• Price: ${money(v.price)}`);
      if (pageUrl()) lines.push("", pageUrl());
      return lines.join("\n");
    }

    function restockText() {
      const opts = p.options.map((name, i) => `${name}: ${sel[i]}`).join(", ");
      return `Hi ${CFG.businessName}! Will you be getting more of this?\n• ${p.title}${opts ? `\n• ${opts}` : ""}${pageUrl() ? "\n\n" + pageUrl() : ""}`;
    }

    function draw() {
      const v = match();
      const st = stockStatus(v);
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
              ${p.preloved ? `<span class="badge">Pre-loved</span>` : p.isNew ? `<span class="badge badge-new">New</span>` : ""}
            </div>
            ${thumbs}
          </div>
          <div class="info">
            <span class="vendor">${esc(p.vendor)} · ${esc(p.type)}</span>
            <h1>${esc(p.title)}</h1>
            <div class="price">${v && v.price > 0 ? esc(money(v.price)) : "Ask for price"}</div>
            ${st ? `<div class="stock ${st.cls}">${esc(st.label)}</div>` : ""}
            ${opts}
            <div class="actions">
              ${st && st.sold
                ? `<a class="btn btn-ghost btn-block" target="_blank" rel="noopener" href="${esc(wa(restockText()))}">Sold out — ask about restock</a>`
                : `<a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="${esc(wa(orderText(v)))}">Order on WhatsApp</a>`}
              ${p.type === "Tennis Strings" ? `<a class="btn btn-ghost btn-block" href="#/stringing?string=${encodeURIComponent(p.handle)}">String my racket with this${restringFor(p.handle) ? ` — ${esc(money(restringFor(p.handle).price))}` : ""}</a>` : ""}
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

  // ---------- stringing: price list data ----------
  let SP, RESTRINGS, formTouched = false;
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function setStringing(data) {
    SP = data || { groups: [], extras: [], bringYourOwn: 0, delivery: 0 };
    RESTRINGS = SP.groups.flatMap(g => g.items.map(([name, gauges, price, handle, note]) =>
      ({ id: slug(name), name, gauges: gauges || [], price, handle: handle || "", note: note || "", group: g.name })));
  }
  setStringing(window.STRINGING);
  const restringFor = handle => RESTRINGS.find(r => r.handle === handle);
  const groupItems = g => g.items.map(([name]) => RESTRINGS.find(r => r.id === slug(name)));

  // Replaces the built-in price list with the Google Sheet tab, when one is set.
  async function loadStringingPrices() {
    if (!CFG.stringingSheetUrl) return;
    try {
      const res = await fetch(CFG.stringingSheetUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const rows = parseCsv(await res.text());
      const head = (rows.shift() || []).map(h => h.trim().toLowerCase());
      const [ct, cs, ci, cg, cp, cn, ch] = ["type", "section", "item", "gauges", "price", "note", "shop id"].map(n => head.indexOf(n));
      if (ci < 0 || cp < 0) throw new Error("the sheet needs Item and Price columns");
      const cell = (r, i) => (i >= 0 ? (r[i] || "").trim() : "");
      const num = s => { const n = parseFloat(s.replace(/[^0-9.]/g, "")); return isNaN(n) ? null : n; };
      const bucket = (list, name) => list.find(g => g.name === name) || list[list.push({ name, items: [] }) - 1];
      const data = { updated: "", bringYourOwn: SP.bringYourOwn, delivery: SP.delivery, groups: [], extras: [] };
      rows.forEach(r => {
        const item = cell(r, ci), price = cell(r, cp), type = cell(r, ct).toLowerCase() || "string";
        if (!item) return;
        if (type === "fee") {
          const n = num(price);
          if (n == null) return;
          if (/deliver/i.test(item)) data.delivery = n;
          else if (/own/i.test(item)) data.bringYourOwn = n;
        } else if (type === "other") {
          bucket(data.extras, cell(r, cs) || "Other").items.push([item, /^[0-9.]+$/.test(price) ? money(+price) : price]);
        } else {
          const n = num(price);
          if (n == null) return;
          const gauges = cell(r, cg).split(",").map(s => s.trim()).filter(Boolean);
          bucket(data.groups, cell(r, cs) || "Strings").items.push([item, gauges, n, cell(r, ch), cell(r, cn)]);
        }
      });
      if (!data.groups.length) throw new Error("no string rows found");
      setStringing(data);
      const page = location.hash.replace(/^#\/?/, "").split("?")[0];
      if (page === "prices" || page.startsWith("p/") || (page === "stringing" && !formTouched)) route();
    } catch (e) {
      console.warn("Stringing price sheet could not be loaded:", e);
    }
  }

  // ---------- price list page ----------
  function renderPrices() {
    const priceRows = SP.groups.map(g => `
      <section class="pl-group" data-group>
        <h3>${esc(g.name)}</h3>
        ${groupItems(g).map(r => `
          <a class="pl-row" href="#/stringing?string=${encodeURIComponent(r.id)}" data-text="${esc((r.name + " " + g.name).toLowerCase())}">
            <span class="pl-name">${esc(r.name)}${r.note ? ` <em>${esc(r.note)}</em>` : ""}${r.gauges.length ? `<small>${esc(r.gauges.join(", "))}</small>` : ""}</span>
            <span class="pl-price">${esc(money(r.price))}</span>
          </a>`).join("")}
      </section>`).join("");
    const extraRows = (SP.extras || []).map(g => `
      <section class="pl-group">
        <h3>${esc(g.name)}</h3>
        ${g.items.map(([name, price]) => `<div class="pl-row static"><span class="pl-name">${esc(name)}</span><span class="pl-price">${esc(price)}</span></div>`).join("")}
      </section>`).join("");

    view.innerHTML = `
      <div class="form-page">
        <h1>Restringing price list</h1>
        <p>Prices are per racket and include the string and labour. Tap a string to book a restring with it.${SP.updated ? ` Updated ${esc(SP.updated)}.` : ""}</p>
        <a class="btn btn-wa" href="#/stringing">Book a stringing</a>
        <section class="pricelist">
          <div class="pl-group">
            <div class="pl-row static"><span class="pl-name">Bring your own string<small>labour only</small></span><span class="pl-price">${esc(money(SP.bringYourOwn))}</span></div>
            <div class="pl-row static"><span class="pl-name">Delivery<small>pick-up and drop-off</small></span><span class="pl-price">${esc(money(SP.delivery))}</span></div>
          </div>
          <input class="search" id="pl-q" type="search" placeholder="Search strings…" aria-label="Search the price list">
          ${priceRows}
          <p class="empty" id="pl-empty" hidden>No string matches that search. Message us — we may be able to get it.</p>
          ${extraRows}
        </section>
      </div>`;

    document.getElementById("pl-q").addEventListener("input", e => {
      const q = e.target.value.trim().toLowerCase();
      let shown = 0;
      view.querySelectorAll("[data-group]").forEach(g => {
        let n = 0;
        g.querySelectorAll("[data-text]").forEach(row => { const hit = !q || row.dataset.text.includes(q); row.hidden = !hit; if (hit) n++; });
        g.hidden = !n;
        shown += n;
      });
      document.getElementById("pl-empty").hidden = shown > 0;
    });
    window.scrollTo(0, 0);
  }

  // ---------- stringing booking form ----------
  function renderStringing(params) {
    const pre = (restringFor(params.get("string")) || RESTRINGS.find(r => r.id === params.get("string")) || {}).id || "";
    const label = r => `${r.name}${r.note ? ` (${r.note})` : ""} — ${money(r.price)}`;
    const stringOptions = sel => SP.groups.map(g => `<optgroup label="${esc(g.name)}">${
      groupItems(g).map(r => `<option value="${esc(r.id)}" ${r.id === sel ? "selected" : ""}>${esc(label(r))}</option>`).join("")}</optgroup>`).join("");

    view.innerHTML = `
      <div class="form-page">
        <h1>Book a stringing</h1>
        <p>Prices are per racket and include the string and labour. Fill in the form and tap send — WhatsApp opens with your order written out, and we'll reply to confirm drop-off and timing. <a href="#/prices">See the full price list</a>.</p>
        <form class="panel" id="sform">
          <div class="field"><label for="f-name">Your name</label><input id="f-name" autocomplete="name" required></div>
          <div class="field"><label for="f-racket">Racket <span class="hint">(brand and model)</span></label><input id="f-racket" placeholder="e.g. Babolat Pure Aero 100" required></div>
          <div class="field">
            <label for="f-string">String</label>
            <select id="f-string">
              <option value="">Choose a string…</option>
              <option value="__own">I'll bring my own string — ${esc(money(SP.bringYourOwn))}</option>
              <option value="__help">Not sure — please recommend one</option>
              ${stringOptions(pre)}
            </select>
          </div>
          <div class="field" id="f-gauge-wrap" hidden><label for="f-gauge">Gauge</label><select id="f-gauge"></select></div>
          <div class="field" id="f-own-wrap" hidden><label for="f-own">Which string are you bringing?</label><input id="f-own" placeholder="e.g. Babolat RPM Blast 1.25"></div>
          <label class="check"><input type="checkbox" id="f-hybrid"> Hybrid — use a different string for the crosses</label>
          <div class="field" id="f-cross-wrap" hidden>
            <label for="f-cross">Cross string</label>
            <select id="f-cross"><option value="">Choose a string…</option><option value="__own">I'll bring my own string</option>${stringOptions("")}</select>
          </div>
          <div class="row">
            <div class="field"><label for="f-mains">Tension <span class="hint">(lbs)</span></label><input id="f-mains" type="number" inputmode="decimal" min="30" max="70" step="0.5" placeholder="52" required></div>
            <div class="field"><label for="f-crosses">Crosses <span class="hint">(if different)</span></label><input id="f-crosses" type="number" inputmode="decimal" min="30" max="70" step="0.5" placeholder="Same"></div>
          </div>
          <div class="field"><label for="f-qty">Number of rackets</label><input id="f-qty" type="number" inputmode="numeric" min="1" max="20" value="1" required></div>
          <label class="check"><input type="checkbox" id="f-delivery"> Pick-up and drop-off delivery (+${esc(money(SP.delivery))})</label>
          <div class="field"><label for="f-notes">Notes <span class="hint">(optional)</span></label><textarea id="f-notes" placeholder="String colour, when you need it by, grip changes, anything else"></textarea></div>
          <div class="estimate" id="f-estimate" hidden></div>
          <button class="btn btn-wa btn-block" type="submit">Send order on WhatsApp</button>
        </form>
      </div>`;

    const $ = id => document.getElementById(id);
    const strSel = $("f-string");
    const chosen = () => RESTRINGS.find(r => r.id === strSel.value);
    formTouched = false;
    $("sform").addEventListener("input", () => { formTouched = true; });

    function drawString() {
      const r = chosen();
      $("f-gauge-wrap").hidden = !r || !r.gauges.length;
      if (r) $("f-gauge").innerHTML = (r.gauges.length > 1 ? `<option value="">Any</option>` : "") + r.gauges.map(g => `<option>${esc(g)}</option>`).join("");
      $("f-own-wrap").hidden = strSel.value !== "__own";
      drawEstimate();
    }

    function drawEstimate() {
      const box = $("f-estimate"), r = chosen();
      const qty = Math.max(1, +$("f-qty").value || 1);
      const delivery = $("f-delivery").checked ? SP.delivery : 0;
      const hybrid = $("f-hybrid").checked;
      const per = strSel.value === "__own" ? SP.bringYourOwn : r ? r.price : null;
      box.hidden = per == null && !hybrid;
      if (per == null || hybrid) box.textContent = "We'll confirm the price for this setup on WhatsApp.";
      else box.textContent = `Estimated total: ${money(per * qty + delivery)}` +
        ` (${qty} × ${money(per)}${delivery ? ` + ${money(delivery)} delivery` : ""})`;
    }

    strSel.addEventListener("change", drawString);
    $("f-qty").addEventListener("input", drawEstimate);
    $("f-delivery").addEventListener("change", drawEstimate);
    $("f-hybrid").addEventListener("change", e => { $("f-cross-wrap").hidden = !e.target.checked; drawEstimate(); });
    drawString();

    const stringLabel = (value, own) => {
      if (value === "__own") return "Bringing my own" + (own ? ` (${own})` : "");
      if (value === "__help") return "Please recommend one";
      const r = RESTRINGS.find(x => x.id === value);
      return r ? r.name : "";
    };

    $("sform").addEventListener("submit", e => {
      e.preventDefault();
      if (!strSel.value) { strSel.focus(); strSel.setCustomValidity("Please choose a string"); strSel.reportValidity(); strSel.setCustomValidity(""); return; }
      const hybrid = $("f-hybrid").checked && $("f-cross").value;
      let main = stringLabel(strSel.value, $("f-own").value.trim());
      if (chosen() && $("f-gauge").value) main += ` ${$("f-gauge").value}`;
      const mains = $("f-mains").value, crosses = $("f-crosses").value;
      const est = $("f-estimate");
      const lines = [
        `Hi ${CFG.businessName}! I'd like to book a stringing:`,
        `• Name: ${$("f-name").value.trim()}`,
        `• Racket: ${$("f-racket").value.trim()}`,
        hybrid ? `• Mains: ${main}` : `• String: ${main}`,
        hybrid ? `• Crosses: ${stringLabel($("f-cross").value)}` : null,
        `• Tension: ${crosses && crosses !== mains ? `${mains} lbs mains / ${crosses} lbs crosses` : `${mains} lbs`}`,
        `• Rackets: ${$("f-qty").value}`,
        $("f-delivery").checked ? `• Delivery: pick-up and drop-off` : null,
        $("f-notes").value.trim() ? `• Notes: ${$("f-notes").value.trim()}` : null,
        !est.hidden && est.textContent.startsWith("Estimated") ? `• ${est.textContent}` : null,
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
    else if (parts[0] === "prices") renderPrices();
    else { onCatalogue = true; renderCatalogue(); }
    document.querySelectorAll("[data-nav]").forEach(a =>
      a.classList.toggle("active", a.dataset.nav === (["stringing", "prices"].includes(parts[0]) ? parts[0] : "shop")));
  }

  document.getElementById("brand-name").textContent = CFG.businessName;
  document.getElementById("footer-name").textContent = CFG.businessName;
  document.getElementById("chat-link").href = wa(`Hi ${CFG.businessName}!`);
  document.title = `${CFG.businessName} — Stringing, strings and court gear`;
  window.addEventListener("hashchange", route);
  route();
  loadStock();
  loadStringingPrices();
})();
