'use strict';
/* CBX Medical — catalogue, bag and handoff to the official checkout.
   Runs on every page. Each block only wires itself up if its markup is present,
   so the same file serves the home page, the shop and the editorial pages.
   Names, prices and handles follow the live catalogue at
   https://cbxmedical.com/en/collections/all (checked 23 Nov 2026). */

const STORE = 'https://cbxmedical.com/en';
const RANGES = ['All', 'CanFlex', 'MetaFibro', 'CanRelax'];

/* key, title, handle, range, format, price */
const PRODUCTS = [
  ['cold',  'CanFlex Cold Gel',                  'canflex-cold-gel',                 'CanFlex',   'Cooling gel',          24.90],
  ['hot',   'CanFlex Hot Gel',                   'canflex-hot-gel',                  'CanFlex',   'Warming gel',          25.90],
  ['fdrop', 'CanFlex Drop',                      'canflex-drop',                     'CanFlex',   'Dropper oil · 10 ml',  69.90],
  ['holi',  'MetaFibro',                         'metafibro',                        'MetaFibro', 'Holistic · capsules',  29.90],
  ['fog',   'MetaFibro® Brain Fog',              'metafibro-brain-fog',              'MetaFibro', 'Capsules',             29.90],
  ['mag',   'MetaFibro® Magnésium bisglycinate', 'metafibro-magnesium-bisglycinate', 'MetaFibro', 'Capsules',             26.90],
  ['pea',   'MetaFibro® PEA Micronised',         'metafibro-pea-micronised',         'MetaFibro', 'Capsules',             64.90],
  ['patch', 'CanRelax Patch',                    'canrelax-patch',                   'CanRelax',  'Patch',                27.90],
  ['d5',    'CanRelax Drop 5%',                  'canrelax-drop-5',                  'CanRelax',  'Dropper oil · 10 ml',  34.90],
  ['d10',   'CanRelax Drop 10%',                 'canrelax-drop-10',                 'CanRelax',  'Dropper oil · 10 ml',  64.90],
  ['d20',   'CanRelax Drop 20%',                 'canrelax-drop-20',                 'CanRelax',  'Dropper oil · 10 ml', 109.90],
  ['d30',   'CanRelax Drop 30%',                 'canrelax-drop-30',                 'CanRelax',  'Dropper oil · 10 ml', 149.90]
];

const BY_KEY = new Map(PRODUCTS.map(p => [p[0], p]));
const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
const money = v => euro.format(v);
const photo = key => 'products/' + key + '.webp';
const productUrl = handle => STORE + '/products/' + handle;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = sel => document.querySelector(sel);

const grid = $('#grid'), filters = $('#filters'), teaser = $('#teaser');
const dialog = $('#bag'), feedback = $('#feedback'), toastEl = $('#toast');
const strengthBox = $('#strengths');

/* ------------------------------------------------ bag state */
const STORAGE = 'cbx-bag-v1';
let bag = {};
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
  bag = Object.fromEntries(Object.entries(saved).filter(
    ([k, q]) => BY_KEY.has(k) && Number.isInteger(q) && q > 0 && q <= 99));
} catch { bag = {}; }

function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify(bag)); } catch {}
}

let toastTimer;
function toast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function add(key, step = 1) {
  if (!BY_KEY.has(key)) return;
  const next = Math.min(99, (bag[key] || 0) + step);
  if (next <= 0) delete bag[key]; else bag[key] = next;
  persist();
  if (feedback) feedback.textContent = '';
  renderBag();
}

/* a bag opened in one tab should be right in the others too */
addEventListener('storage', event => {
  if (event.key !== STORAGE) return;
  try {
    const saved = JSON.parse(event.newValue || '{}');
    bag = Object.fromEntries(Object.entries(saved).filter(
      ([k, q]) => BY_KEY.has(k) && Number.isInteger(q) && q > 0 && q <= 99));
  } catch { bag = {}; }
  renderBag();
});

/* ------------------------------------------------ product cards */
function cardMarkup([key, title, handle, family, format, price]) {
  return `
    <article class="card" data-range="${family}">
      <a class="tile" href="${productUrl(handle)}" target="_blank" rel="noopener" aria-label="${esc(title)} on the official CBX shop">
        <img loading="lazy" src="${photo(key)}" alt="${esc(title)}" width="400" height="500">
      </a>
      <div class="cardmeta"><small>${family.toUpperCase()} · ${esc(format.toUpperCase())}</small></div>
      <h3><a href="${productUrl(handle)}" target="_blank" rel="noopener">${esc(title)}</a></h3>
      <div class="cardfoot">
        <span class="price">${money(price)}</span>
        <button type="button" class="addbtn" data-add="${key}">Add to bag</button>
      </div>
    </article>`;
}

function wireAdding(container) {
  container.addEventListener('click', event => {
    const key = event.target.closest('[data-add]')?.dataset.add;
    if (!key) return;
    add(key, 1);
    toast(BY_KEY.get(key)[1] + ' added to your bag');
  });
}

/* the shop page */
if (grid && filters) {
  const showRange = range => {
    for (const button of filters.children) {
      button.setAttribute('aria-pressed', String(button.dataset.range === range));
    }
    grid.innerHTML = PRODUCTS.filter(p => range === 'All' || p[3] === range).map(cardMarkup).join('');
    const url = new URL(location.href);
    if (range === 'All') url.searchParams.delete('range'); else url.searchParams.set('range', range);
    history.replaceState(null, '', url);
  };

  RANGES.forEach(name => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.dataset.range = name;
    button.addEventListener('click', () => showRange(name));
    filters.append(button);
  });

  const wanted = new URL(location.href).searchParams.get('range');
  showRange(RANGES.includes(wanted) ? wanted : 'All');
  wireAdding(grid);
}

/* the three highlights on the home page */
if (teaser) {
  teaser.innerHTML = (teaser.dataset.keys || '').split(',')
    .map(k => k.trim()).filter(k => BY_KEY.has(k))
    .map(k => cardMarkup(BY_KEY.get(k))).join('');
  wireAdding(teaser);
}

/* ------------------------------------------------ concentration selector */
if (strengthBox) {
  const STRENGTHS = [5, 10, 20, 30];

  const setStrength = value => {
    const key = 'd' + value;
    const [, title, handle, , , price] = BY_KEY.get(key);
    const shot = $('#heroShot');
    if (shot) { shot.src = photo(key); shot.alt = title + ' in amber glass with pipette'; }
    $('#roConc').textContent = value + '%';
    $('#roPrice').textContent = money(price);
    const button = $('#addStrength');
    button.textContent = 'Add to bag — ' + money(price);
    button.dataset.add = key;
    $('#strengthLink').href = productUrl(handle);
    for (const b of strengthBox.children) {
      b.setAttribute('aria-pressed', String(Number(b.dataset.strength) === value));
    }
  };

  STRENGTHS.forEach(value => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value + '%';
    button.dataset.strength = value;
    button.setAttribute('aria-label', 'CanRelax Drop ' + value + ' percent');
    button.addEventListener('click', () => setStrength(value));
    strengthBox.append(button);
  });
  setStrength(10);

  $('#addStrength').addEventListener('click', event => {
    const key = event.currentTarget.dataset.add;
    add(key, 1);
    toast(BY_KEY.get(key)[1] + ' added to your bag');
  });
}

/* ------------------------------------------------ bag panel */
function renderBag() {
  const entries = Object.entries(bag);
  const count = $('#count');
  if (count) count.textContent = entries.reduce((n, [, q]) => n + q, 0);
  if (!dialog) return;

  $('#baglines').innerHTML = entries.length ? entries.map(([key, q]) => {
    const [, title, handle, family, format, price] = BY_KEY.get(key);
    return `<div class="line">
      <div class="ph"><img alt="" src="${photo(key)}"></div>
      <div>
        <div class="nm"><a href="${productUrl(handle)}" target="_blank" rel="noopener">${esc(title)}</a></div>
        <div class="sub">${family} · ${esc(format)} — ${money(q * price)}</div>
      </div>
      <div class="qty">
        <button type="button" data-step="-1" data-key="${key}" aria-label="${q === 1 ? 'Remove' : 'One fewer'} ${esc(title)}">−</button>
        <span>${q}</span>
        <button type="button" data-step="1" data-key="${key}" aria-label="One more ${esc(title)}" ${q === 99 ? 'disabled' : ''}>+</button>
      </div>
    </div>`;
  }).join('') : '<p class="empty">Your bag is empty. <a href="shop.html">Browse the collection</a>.</p>';

  const total = entries.reduce((sum, [key, q]) => sum + q * BY_KEY.get(key)[5], 0);
  $('#bagfoot').innerHTML = entries.length ? `
    <div class="bagtotal"><span>Estimated subtotal</span><strong>${money(total)}</strong></div>
    <button type="button" class="buy" id="checkout">Checkout with CBX Medical</button>
    <small>You continue on cbxmedical.com. Availability, promotions, shipping and final prices are set by CBX Medical, so the total there can differ from this estimate.</small>` : '';
}

if (dialog) {
  $('#openBag').addEventListener('click', () => { if (!dialog.open) dialog.showModal(); });
  $('#closeBag').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', async event => {
    const step = event.target.closest('[data-step]');
    if (step) { add(step.dataset.key, Number(step.dataset.step)); return; }
    if (event.target.id !== 'checkout') return;
    await checkout(event.target);
  });
}

/* ------------------------------------------------ handoff to the official checkout */
async function resolveVariants(handles) {
  if (['http:', 'https:'].includes(location.protocol)) {
    try {
      const response = await fetch('api/variants?items=' + encodeURIComponent(handles.join(',')),
        { signal: AbortSignal.timeout(9000) });
      if (response.ok) {
        const ids = await response.json();
        if (Array.isArray(ids) && ids.length === handles.length) return ids;
      }
    } catch {}
  }
  return Promise.all(handles.map(async handle => {
    const response = await fetch(STORE + '/products/' + handle + '.js', { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('lookup failed');
    const data = await response.json();
    if (!Array.isArray(data.variants) || data.variants.length !== 1) return null;
    const variant = data.variants[0];
    return variant.available ? String(variant.id) : null;
  }));
}

async function checkout(button) {
  const snapshot = JSON.stringify(bag);
  const selection = Object.entries(bag).map(([key, q]) => ({ key, handle: BY_KEY.get(key)[2], q }));
  button.disabled = true;
  feedback.textContent = 'Checking availability with CBX Medical…';
  try {
    const ids = await resolveVariants(selection.map(item => item.handle));
    if (snapshot !== JSON.stringify(bag)) { feedback.textContent = 'Your bag changed — press checkout again.'; return; }
    const unavailable = selection.filter((item, index) => !/^\d+$/.test(String(ids[index])));
    if (unavailable.length) {
      feedback.innerHTML = 'CBX Medical cannot confirm ' + unavailable.map(item =>
        `<a href="${productUrl(item.handle)}" target="_blank" rel="noopener">${esc(BY_KEY.get(item.key)[1])}</a>`).join(', ') +
        ' right now. Your bag is saved — open the product to check it in the official shop, or remove it and continue.';
      return;
    }
    location.assign(STORE + '/cart/' + ids.map((id, index) => id + ':' + selection[index].q).join(','));
  } catch {
    feedback.innerHTML = 'The CBX shop did not answer. Your bag is saved and nothing is lost. ' +
      'You can try again, or order these directly: ' + selection.map(item =>
        `<a href="${productUrl(item.handle)}" target="_blank" rel="noopener">${esc(BY_KEY.get(item.key)[1])}</a> ×${item.q}`).join(', ') + '.';
  } finally {
    button.disabled = false;
  }
}

renderBag();
