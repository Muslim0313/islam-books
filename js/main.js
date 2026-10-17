/* =========================================================
   СОКРОВИЩНИЦА ИСЛАМА — логика сайта
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var rub = function (n) { return new Intl.NumberFormat('ru-RU').format(n) + ' ₽'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- безопасное хранилище ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватный режим */ } }
  };

  var BOOKS = window.BOOKS || [];
  var CATS = window.CATEGORIES || [];
  var catName = {}; CATS.forEach(function (c) { catName[c.key] = c.name; });
  function catNames(b) { return b.cats.map(function (k) { return catName[k]; }).join(' · '); }
  var byId = {}; BOOKS.forEach(function (b) { byId[b.id] = b; });

  var state = {
    cat: 'all', q: '', sort: 'pop', mode: store.get('mode', 0), shown: 12,
    cart: store.get('cart', {}), wish: store.get('wish', [])
  };

  /* ---------- обложки: кожа + золотое тиснение, рисуются кодом ----------
     У каждой категории свой оттенок, у каждой книги свой медальон (по номеру).
     Когда пришлёте реальные обложки (поле cover в books.js), они заменят эти. */
  var PAL = {
    quran:    ['#2f8650', '#0d3a21'],   // изумруд
    hadith:   ['#217367', '#082c29'],   // малахит
    aqida:    ['#3b7a45', '#0f2b1a'],   // хвоя
    fiqh:     ['#2a6a4a', '#0a2218'],   // нефрит
    sira:     ['#17563a', '#061a10'],   // тёмный изумруд
    prophets: ['#4a8a3a', '#14321b'],   // оливково-зелёный
    soul:     ['#1f6a58', '#07261f'],   // бирюзовая хвоя
    goods:    ['#1a3324', '#050d09']    // чёрный изумруд
  };
  var KINDS = ['star8', 'rosette', 'mihrab', 'crescent', 'knot', 'hexstar'];

  function ornament(kind) {
    var F = 'stroke="url(#foil)" fill="none"', G = 'fill="url(#foil)"', s = '';
    // двойная рамка
    s += '<rect x="9" y="9" width="182" height="262" rx="4" ' + F + ' stroke-width="1.3"/>' +
         '<rect x="14.5" y="14.5" width="171" height="251" rx="2" ' + F + ' stroke-width=".55" opacity=".75"/>';
    // уголки: дуга + ромбик
    [[14.5, 14.5, 1, 1], [185.5, 14.5, -1, 1], [14.5, 265.5, 1, -1], [185.5, 265.5, -1, -1]].forEach(function (c) {
      var x = c[0], y = c[1], sx = c[2], sy = c[3], dx = x + sx * 9, dy = y + sy * 9;
      s += '<path d="M' + x + ' ' + (y + sy * 24) + ' Q' + x + ' ' + y + ' ' + (x + sx * 24) + ' ' + y + '" ' + F + ' stroke-width=".9"/>' +
           '<rect x="' + (dx - 2.2) + '" y="' + (dy - 2.2) + '" width="4.4" height="4.4" ' + G + ' transform="rotate(45 ' + dx + ' ' + dy + ')"/>';
    });
    if (kind === 'frame') return s;
    // медальон
    var m = '<g transform="translate(100 92)">';
    if (kind === 'star8') {
      m += '<rect x="-27" y="-27" width="54" height="54" ' + F + ' stroke-width="1.1"/><rect x="-27" y="-27" width="54" height="54" transform="rotate(45)" ' + F + ' stroke-width="1.1"/>' +
           '<circle r="38" ' + F + ' stroke-width=".7"/><circle r="15" ' + F + ' stroke-width=".9"/><circle r="4" ' + G + '/>';
    } else if (kind === 'rosette') {
      for (var k = 0; k < 12; k++) m += '<ellipse cx="0" cy="-19" rx="6.5" ry="15" transform="rotate(' + k * 30 + ')" ' + F + ' stroke-width=".9"/>';
      m += '<circle r="41" ' + F + ' stroke-width=".7"/><circle r="8" ' + F + ' stroke-width=".9"/><circle r="2.6" ' + G + '/>';
    } else if (kind === 'mihrab') {
      m += '<path d="M-28 44 V-6 Q-28 -30 0 -50 Q28 -30 28 -6 V44" ' + F + ' stroke-width="1.2"/>' +
           '<path d="M-20 44 V-4 Q-20 -22 0 -37 Q20 -22 20 -4 V44" ' + F + ' stroke-width=".7" opacity=".75"/>' +
           '<rect x="-7" y="-1" width="14" height="14" ' + F + ' stroke-width=".9" transform="translate(0 6)"/><rect x="-7" y="-1" width="14" height="14" ' + F + ' stroke-width=".9" transform="translate(0 6) rotate(45 0 6)"/>' +
           '<path d="M-36 44 H36" ' + F + ' stroke-width="1"/>';
    } else if (kind === 'crescent') {
      m += '<circle r="39" ' + F + ' stroke-width=".8"/><circle r="33" ' + F + ' stroke-width=".4" opacity=".7"/>' +
           '<path d="M12 -26 A27 27 0 1 0 12 26 A21 21 0 1 1 12 -26 Z" ' + G + '/>' +
           '<rect x="-4.5" y="-4.5" width="9" height="9" ' + G + ' transform="translate(21 0)"/><rect x="-4.5" y="-4.5" width="9" height="9" ' + G + ' transform="translate(21 0) rotate(45)"/>';
    } else if (kind === 'knot') {
      m += '<circle cx="0" cy="-12" r="21" ' + F + ' stroke-width="1"/><circle cx="-10.4" cy="9" r="21" ' + F + ' stroke-width="1"/><circle cx="10.4" cy="9" r="21" ' + F + ' stroke-width="1"/>' +
           '<circle r="41" ' + F + ' stroke-width=".7"/><circle r="3" ' + G + '/>';
    } else {
      m += '<polygon points="0,-34 29.4,17 -29.4,17" ' + F + ' stroke-width="1.1"/><polygon points="0,34 29.4,-17 -29.4,-17" ' + F + ' stroke-width="1.1"/>' +
           '<circle r="41" ' + F + ' stroke-width=".7"/><circle r="10" ' + F + ' stroke-width=".9"/><circle r="2.6" ' + G + '/>';
    }
    m += '</g>';
    // разделитель под медальоном
    s += m + '<path d="M44 148H92M108 148H156" ' + F + ' stroke-width=".7"/><rect x="96" y="144" width="8" height="8" ' + G + ' transform="rotate(45 100 148)"/>';
    return s;
  }

  function titleSize(t) {   // чем длиннее название, тем мельче шрифт (в долях ширины обложки)
    var n = t.length;
    return n <= 12 ? 13 : n <= 20 ? 11.2 : n <= 30 ? 9.6 : n <= 40 ? 8.4 : 7.4;
  }

  /* ---------- задний план под цвет книги ---------- */
  function shade(hex, k) {   // k>0 светлее, k<0 темнее
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return hex;
    var n = parseInt(m[1], 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) {
      return Math.round(clamp(k > 0 ? v + (255 - v) * k : v * (1 + k), 0, 255));
    });
    return '#' + c.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  function bgStyle(b) {
    if (!b.bg) return '';
    return ' style="background:radial-gradient(80% 66% at 50% 58%,' + shade(b.bg, .1) + ' 0%,' + shade(b.bg, -.38) + ' 62%,' + shade(b.bg, -.7) + ' 100%)"';
  }

  function coverHTML(b, mini) {
    if (b.cover) {
      return '<img class="real" src="' + esc(b.cover) + '" alt="' + esc(b.title) + '"' + (b.ar ? ' data-ar="' + b.ar + '"' : '') + (b.side ? ' data-side="1" data-bg="' + esc(b.bg) + '"' : '') + ' loading="lazy">';
    }
    var p = b.bg ? [shade(b.bg, .12), shade(b.bg, -.55)] : PAL.quran, st = 'style="--c1:' + p[0] + ';--c2:' + p[1] + ';--fs:' + titleSize(b.title) + 'cqw"';
    var text = mini ? '' : '<div class="t"><h4>' + esc(b.title) + '</h4><small>' + esc(b.author) + '</small></div>';
    if (b.img) {     // товар (чётки, рахль...): фото-вырезка на тёмной «подложке»
      return '<div class="art art-prod" ' + st + '><svg class="orn" viewBox="0 0 200 280" aria-hidden="true">' + ornament('frame') + '</svg>' +
        '<img class="pimg" src="' + esc(b.img) + '" alt="" loading="lazy">' + text + '</div>';
    }
    return '<div class="art" ' + st + '><svg class="orn" viewBox="0 0 200 280" aria-hidden="true">' + ornament(KINDS[b.id % KINDS.length]) + '</svg>' + text + '</div>';
  }

  /* ---------- цены ---------- */
  var MIN_OPT = 7000;   // оптовый заказ принимается от этой суммы, ₽
  function unit(b, qty) {
    return state.mode === 1 ? b.wholesale : b.retail;
  }
  function cartSum() {
    return Object.keys(state.cart).reduce(function (s, k) { return byId[k] && state.cart[k] > 0 ? s + unit(byId[k], state.cart[k]) * state.cart[k] : s; }, 0);
  }
  function optShort() { return state.mode === 1 ? Math.max(0, MIN_OPT - cartSum()) : 0; }   // сколько не хватает до минимального оптового заказа

  /* =========================================================
     РАЗДЕЛЫ, МЕНЮ, ЛЕНТА
     ========================================================= */
  function renderStatic() {
    // цифры в блоке «О магазине» считаются из каталога
    var sb = $('#statBooks'), sc = $('#statCats');
    if (sb) sb.dataset.count = BOOKS.length;
    if (sc) sc.dataset.count = CATS.length;
    if (!BOOKS.length) {   // пока каталог пуст — прячем счётчики, разделы, бегущую строку и панель фильтров
      [sb, sc].forEach(function (e) { if (e) e.parentNode.style.display = 'none'; });
      ['.cats', '.marquee', '.toolbar', '.more'].forEach(function (q) { var e = $(q); if (e) e.style.display = 'none'; });
    }
    $('#cats').innerHTML = CATS.map(function (c, i) {
      return '<li data-reveal style="--d:' + i * 55 + 'ms"><a class="tile" href="#catalog" data-cat="' + c.key + '">' +
        '<svg class="ico" viewBox="0 0 32 32"><use href="#i-' + c.icon + '"/></svg><span>' + esc(c.name) + '</span></a></li>';
    }).join('');

    $('#drop').innerHTML = CATS.map(function (c, i) {
      return '<a href="#catalog" data-cat="' + c.key + '" style="--i:' + i + '"><svg class="ico" viewBox="0 0 32 32"><use href="#i-' + c.icon + '"/></svg>' + esc(c.name) + '</a>';
    }).join('');

    $('#fCats').innerHTML = CATS.map(function (c) { return '<li><a href="#catalog" data-cat="' + c.key + '">' + esc(c.name) + '</a></li>'; }).join('');

    var row = CATS.map(function (c) { return '<span>' + esc(c.name) + '</span>'; }).join('');
    $('#marquee').innerHTML = row + row;

    var chips = '<button class="chip on" type="button" data-cat="all" role="tab">Все книги</button>' +
      CATS.map(function (c) { return '<button class="chip" type="button" data-cat="' + c.key + '" role="tab">' + esc(c.name) + '</button>'; }).join('');
    $('#chips').innerHTML = chips;
  }

  /* =========================================================
     КАТАЛОГ
     ========================================================= */
  function filtered() {
    var q = state.q.trim().toLowerCase();
    var list = BOOKS.filter(function (b) {
      if (state.cat !== 'all' && b.cats.indexOf(state.cat) < 0) return false;
      if (!q) return true;
      return (b.title + ' ' + b.author + ' ' + catNames(b)).toLowerCase().indexOf(q) > -1;
    });
    var price = function (b) { return state.mode === 1 ? b.wholesale : b.retail; };
    var rank = { hit: 0, rare: 1, new: 1, '': 2 };
    list.sort(function (a, b) {
      switch (state.sort) {
        case 'pa': return price(a) - price(b);
        case 'pd': return price(b) - price(a);
        case 'az': return a.title.localeCompare(b.title, 'ru');
        case 'new': return (a.badge === 'new' ? 0 : 1) - (b.badge === 'new' ? 0 : 1) || b.id - a.id;
        default: return rank[a.badge] - rank[b.badge] || a.id - b.id;
      }
    });
    return list;
  }

  function cardHTML(b, i) {
    var inWish = state.wish.indexOf(b.id) > -1;
    var opt = state.mode === 1;
    var priceHTML = opt
      ? (b.onOrder ? '<b>' + rub(b.retail) + '</b><small>опт — под заказ</small>'
        : '<b>' + rub(b.wholesale) + '</b><s>' + rub(b.retail) + '</s><small>опт, заказ от ' + rub(MIN_OPT) + '</small>')
      : '<b>' + rub(b.retail) + '</b><small>розница</small>';
    return '<article class="card" style="--i:' + (i % 12) + '" data-id="' + b.id + '">' +
      '<div class="cover-wrap"' + bgStyle(b) + '>' +
        (b.badge === 'new' ? '<span class="badge-n new">Новинка</span>' : b.badge === 'rare' ? '<span class="badge-n rare">Редкая</span>' : '') +
        '<button class="wish' + (inWish ? ' on' : '') + '" type="button" aria-label="В избранное" data-act="wish"><svg class="ico"><use href="#i-heart"/></svg></button>' +
        '<div class="cover" data-act="view">' + coverHTML(b) + '<i class="glare"></i></div>' +
        '<span class="qv" data-act="view"><svg class="ico"><use href="#i-search"/></svg>Быстрый просмотр</span>' +
      '</div>' +
      '<div class="card-b"><span class="cat">' + esc(catNames(b)) + '</span><h3>' + esc(b.title) + '</h3><span class="au">' + esc(b.author) + '</span></div>' +
      '<div class="card-f"><div class="price">' + priceHTML + '</div>' +
      '<button class="add" type="button" aria-label="Добавить в корзину" data-act="add"><svg class="ico"><use href="#i-plus"/></svg></button></div>' +
      '</article>';
  }

  function renderGrid() {
    var list = filtered();
    var part = list.slice(0, state.shown);
    $('#grid').innerHTML = part.length ? part.map(cardHTML).join('') :
      '<div class="empty">' + (BOOKS.length ? 'Ничего не найдено. Попробуйте другой запрос или раздел.' : 'Каталог скоро пополнится. Загляните позже или напишите нам.') + '</div>';
    var more = $('#more');
    more.parentElement.style.display = list.length > state.shown ? '' : 'none';
    more.firstChild.nodeValue = 'Показать ещё (' + (list.length - state.shown) + ') ';
  }

  function setCat(key, scroll) {
    state.cat = key; state.shown = 12;
    $$('.chip').forEach(function (c) { c.classList.toggle('on', c.dataset.cat === key); });
    renderGrid();
    if (scroll) { var t = $('#catalog'); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 20, behavior: reduce ? 'auto' : 'smooth' }); }
  }

  /* =========================================================
     КОРЗИНА
     ========================================================= */
  function cartCount() { return Object.keys(state.cart).reduce(function (s, k) { return s + state.cart[k]; }, 0); }
  function saveCart() { store.set('cart', state.cart); updateBadges(); }
  function updateBadges() {
    var c = cartCount(), cb = $('#cartBadge'), w = state.wish.length, wb = $('#wishBadge');
    cb.textContent = c; cb.classList.toggle('on', c > 0);
    wb.textContent = w; wb.classList.toggle('on', w > 0);
  }
  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  function addToCart(id, n, from) {
    state.cart[id] = (state.cart[id] || 0) + (n || 1);
    saveCart();
    sfx.play('add');
    if (from && !reduce) fly(from); else bump($('#cartBadge'));
    toast('«' + byId[id].title + '» в корзине' + (n > 1 ? ' · ' + n + ' шт.' : ''));
    if ($('#drawer').classList.contains('on')) renderCart();
  }

  function renderCart() {
    var ids = Object.keys(state.cart).filter(function (k) { return state.cart[k] > 0 && byId[k]; });
    var list = $('#cartList'), foot = $('#cartFoot');
    $('#drawerTitle').textContent = 'Корзина' + (ids.length ? ' · ' + cartCount() : '');
    if (!ids.length) {
      list.innerHTML = '<div class="empty-c"><svg class="ico" viewBox="0 0 24 24"><use href="#i-cart"/></svg><h4>Здесь пока пусто</h4><p>Добавьте книги из каталога — они появятся здесь.</p></div>';
      foot.innerHTML = '<a class="btn btn-gold" href="#catalog" data-close>Перейти в каталог <svg class="ico"><use href="#i-arrow"/></svg></a>';
      return;
    }
    var total = 0;
    list.innerHTML = ids.map(function (k) {
      var b = byId[k], q = state.cart[k], u = unit(b, q), s = u * q; total += s;
      var note = '';
      return '<div class="line-i" data-id="' + b.id + '"><div class="mini">' + coverHTML(b, true) + '</div>' +
        '<div><h5>' + esc(b.title) + '</h5><small>' + rub(u) + ' / шт.</small>' +
        '<div class="qty"><button type="button" data-q="-1" aria-label="Меньше"><svg class="ico"><use href="#i-minus"/></svg></button><span>' + q + '</span><button type="button" data-q="1" aria-label="Больше"><svg class="ico"><use href="#i-plus"/></svg></button></div>' +
        (note ? '<div style="margin-top:6px">' + note + '</div>' : '') + '</div>' +
        '<div class="sum">' + rub(s) + '<button class="rm" type="button" data-rm>Удалить</button></div></div>';
    }).join('');
    foot.innerHTML = '<div class="tot"><span>Итого (' + (state.mode ? 'опт' : 'розница') + ')</span><b>' + rub(total) + '</b></div>' +
      (optShort()
        ? '<div class="hintopt" style="margin:2px 0 10px;font-size:13.5px;line-height:1.4">Оптовый заказ принимается от ' + rub(MIN_OPT) + '. Добавьте книг ещё на ' + rub(optShort()) + ' или переключитесь на розницу.</div>' +
          '<button class="btn btn-gold" type="button" id="checkout" disabled style="opacity:.45;cursor:not-allowed">Оформить заявку</button>'
        : '<button class="btn btn-gold mag" type="button" id="checkout">Оформить заявку <svg class="ico"><use href="#i-arrow"/></svg></button>') +
      '<span class="note" style="font-size:12px;color:#7f7867">Откроется чат с продавцом. Заказ можно отправить в Telegram или WhatsApp.</span>';
  }

  function openDrawer() { sfx.play('page'); renderCart(); $('#drawer').classList.add('on'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('on'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { $('#drawer').classList.remove('on'); $('#drawer').setAttribute('aria-hidden', 'true'); if (!$('#modal').classList.contains('on')) { $('#scrim').classList.remove('on'); document.body.style.overflow = ''; } }

  /* ---------- модальное окно ---------- */
  function openModal(html) {
    sfx.play('page');
    $('#modalBox').innerHTML = '<button class="x" type="button" data-mclose aria-label="Закрыть"><svg class="ico"><use href="#i-close"/></svg></button>' + html;
    $('#modal').classList.add('on'); $('#modal').setAttribute('aria-hidden', 'false');
    $('#scrim').classList.add('on'); document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    $('#modal').classList.remove('on'); $('#modal').setAttribute('aria-hidden', 'true');
    if (!$('#drawer').classList.contains('on')) { $('#scrim').classList.remove('on'); document.body.style.overflow = ''; }
  }
  function quickView(id) {
    var b = byId[id];
    openModal('<div class="cover-wrap"' + bgStyle(b) + '><div class="cover" style="aspect-ratio:3/4.1">' + coverHTML(b) + '</div></div>' +
      '<div class="info"><span class="cat">' + esc(catNames(b)) + '</span><h3>' + esc(b.title) + '</h3><div class="au">' + esc(b.author) + '</div>' +
      '<p>' + esc(b.desc) + '</p>' +
      '<div class="spec">' + (b.pages ? '<div>Страниц<b>' + b.pages + '</b></div>' : '') + (b.year ? '<div>Год<b>' + b.year + '</b></div>' : '') + '<div>Опт, заказ от<b>' + rub(MIN_OPT) + '</b></div></div>' +
      '<div class="prices"><div class="p"><b>' + rub(b.retail) + '</b><span>розница</span></div><div class="p">' + (b.onOrder ? '<b>под заказ</b><span>опт</span>' : '<b>' + rub(b.wholesale) + '</b><span>опт, заказ от ' + rub(MIN_OPT) + '</span>') + '</div></div>' +
      '<button class="btn btn-gold mag" type="button" data-addm="' + b.id + '">В корзину <svg class="ico"><use href="#i-arrow"/></svg></button></div>');
  }
  /* ---------- заказ в Telegram продавца ---------- */
  var TG_USER = 'Arion9697';   // username продавца без @
  function tgUrl(text) { return 'https://t.me/' + TG_USER + '?text=' + encodeURIComponent(text); }
  var WA_NUM = '79289737940';   // WhatsApp продавца: +7 928 973-79-40, только цифры
  function waUrl(text) { return 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(text); }
  function openTg(url) { var w = window.open(url, '_blank'); if (!w) window.location.href = url; }
  function orderText(name, phone) {
    var ids = Object.keys(state.cart).filter(function (k) { return state.cart[k] > 0 && byId[k]; }), total = 0;
    var lines = ids.map(function (k, i) {
      var b = byId[k], q = state.cart[k], u = unit(b, q), s = u * q; total += s;
      return (i + 1) + '. ' + b.title + (b.author ? ' (' + b.author + ')' : '') + ': ' + q + ' шт. × ' + rub(u) + ' = ' + rub(s);
    });
    // ссылка на страницу заказа с обложками (мессенджеры не принимают картинки через ссылку, поэтому даём страницу)
    var base = /^https?:$/.test(location.protocol) && !/^(localhost|127\.|\[)/.test(location.hostname) ? location.origin : 'https://xn----7sbbag0bacmqmfjb3anl0g9b.xn--p1ai';
    var link = base + '/order.html?m=' + (state.mode ? 1 : 0) + '&b=' + ids.map(function (k) { return k + '.' + state.cart[k]; }).join(',');
    return 'Здравствуйте! Хочу сделать заказ (' + (state.mode ? 'опт' : 'розница') + ').\n\n' + lines.join('\n') +
      '\n\nИтого: ' + rub(total) + '\n\nИмя: ' + name + '\nТелефон: ' + phone + '\n\nКниги с обложками: ' + link;
  }
  var tgLast = '';
  function copyText(s) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).then(function () { return true; }, function () { return false; }); } catch (e) { /* нет доступа */ }
    return Promise.resolve(false);
  }
  /* окно после заказа: открываем Telegram, текст заказа копируем и показываем на случай, если приложение не открылось */
  function tgSent(text, name, clearCart, via) {
    tgLast = text;
    var url = tgUrl(text), web = 'https://web.telegram.org/k/#@' + TG_USER;
    openTg(via === 'wa' ? waUrl(text) : url); copyText(text);
    if (clearCart) { state.cart = {}; saveCart(); }
    openModal('<div style="grid-column:1/-1;max-width:480px;margin:0 auto;width:100%"><span class="eyebrow" style="color:var(--gold)">Почти готово</span>' +
      '<h3 style="font-family:var(--serif);font-weight:500;font-size:38px;line-height:1.02;margin:14px 0 12px;color:#f9f1de">' + esc(name) + ', отправьте заказ продавцу</h3>' +
      '<p style="color:#cfc6af;margin-bottom:14px">'+ (via === 'wa' ? 'Мы открыли WhatsApp с готовым заказом.' : 'Мы открыли Telegram с готовым заказом.') +' Если мессенджер не открылся или удобнее другой, воспользуйтесь кнопками ниже.</p>' +
      '<textarea readonly rows="7" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:rgba(0,0,0,.25);color:#e8dfc8;font:inherit;font-size:13.5px;line-height:1.45;resize:none">' + esc(text) + '</textarea>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px">' +
      '<a class="btn btn-gold" href="' + esc(url) + '" target="_blank" rel="noopener">Открыть Telegram <svg class="ico"><use href="#i-arrow"/></svg></a>' +
      '<a class="btn btn-gold" href="' + esc(waUrl(text)) + '" target="_blank" rel="noopener">Написать в WhatsApp <svg class="ico"><use href="#i-arrow"/></svg></a>' +
      '<a class="btn btn-ghost" href="' + web + '" target="_blank" rel="noopener">Telegram Web</a>' +
      '<button class="btn btn-ghost" type="button" data-copy>Скопировать заказ</button></div>' +
      '<p class="note" style="margin-top:14px">В WhatsApp заказ подставится сам. В Telegram Web откройте чат с @' + TG_USER + ' и вставьте скопированный текст (Ctrl+V).</p></div>');
  }  function checkoutForm() {
    closeDrawer();
    openModal('<div style="grid-column:1/-1;max-width:460px;margin:0 auto;width:100%"><span class="eyebrow" style="color:var(--gold)">Оформление</span>' +
      '<h3 style="font-family:var(--serif);font-weight:500;font-size:40px;line-height:1;margin:14px 0 22px;color:#f9f1de">Оставьте контакты</h3>' +
      '<form id="coForm" novalidate style="display:grid;gap:14px">' +
      '<div class="field"><input id="cName" placeholder=" " autocomplete="name" required><label for="cName">Ваше имя</label></div>' +
      '<div class="field"><input id="cPhone" placeholder=" " type="tel" autocomplete="tel" required><label for="cPhone">Телефон</label></div>' +
      '<button class="btn btn-gold mag" type="submit" value="tg">Заказать в Telegram <svg class="ico"><use href="#i-arrow"/></svg></button>' +
      '<button class="btn btn-ghost mag" type="submit" value="wa">Заказать в WhatsApp <svg class="ico"><use href="#i-arrow"/></svg></button>' +
      '<p class="note">Заказ уже будет написан. Отправить его можно в Telegram или WhatsApp.</p></form></div>');
    setTimeout(function () { var i = $('#cName'); if (i) i.focus(); }, 300);
  }

  /* ---------- toast ---------- */
  var toastT;
  function toast(msg) {
    $('#toastTxt').textContent = msg; $('#toast').classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { $('#toast').classList.remove('on'); }, 2600);
  }

  /* =========================================================
     СОБЫТИЯ
     ========================================================= */
  function bindEvents() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      var catEl = t.closest('[data-cat]');
      if (catEl && !catEl.classList.contains('chip')) { e.preventDefault(); setCat(catEl.dataset.cat, true); $('#nav').classList.remove('on'); return; }
      if (catEl && catEl.classList.contains('chip')) { sfx.play('tick'); setCat(catEl.dataset.cat, false); return; }
      if (t.closest('#sndBtn')) { sfx.set(!sfx.isOn()); syncSound(); toast(sfx.isOn() ? 'Звук включён' : 'Звук выключен'); return; }

      var act = t.closest('[data-act]');
      if (act) {
        var card = act.closest('.card'); var id = card && +card.dataset.id;
        if (act.dataset.act === 'add') { addToCart(id, 1, card.querySelector('.cover')); act.classList.add('ok'); setTimeout(function () { act.classList.remove('ok'); }, 700); return; }
        if (act.dataset.act === 'wish') {
          var i = state.wish.indexOf(id);
          sfx.play('pop');
          if (i > -1) state.wish.splice(i, 1); else { state.wish.push(id); toast('Добавлено в избранное'); }
          store.set('wish', state.wish); act.classList.toggle('on', i === -1); updateBadges(); bump($('#wishBadge')); return;
        }
        if (act.dataset.act === 'view') { quickView(id); return; }
      }
      if (t.closest('#cartBtn')) { openDrawer(); return; }
      if (t.closest('#wishBtn')) {
        if (!state.wish.length) { toast('В избранном пока пусто'); return; }
        state.cat = 'all'; state.q = '';
        var wl = state.wish.slice(); var g = $('#grid');
        g.innerHTML = wl.map(function (id, i) { return cardHTML(byId[id], i); }).join('');
        $$('.chip').forEach(function (c) { c.classList.remove('on'); }); $('#more').parentElement.style.display = 'none';
        var tt = $('#catalog'); window.scrollTo({ top: tt.getBoundingClientRect().top + scrollY - 20, behavior: 'smooth' });
        toast('Показано избранное'); return;
      }
      if (t.closest('#drawerX') || t.closest('#scrim')) { closeDrawer(); closeModal(); return; }
      if (t.closest('[data-mclose]')) { closeModal(); return; }
      if (t.closest('[data-close]')) { closeDrawer(); return; }
      var am = t.closest('[data-addm]'); if (am) { addToCart(+am.dataset.addm, 1, $('#modal .cover')); closeModal(); return; }
      if (t.closest('#modal') && !t.closest('#modalBox')) { closeModal(); return; }

      var li = t.closest('.line-i');
      if (li) {
        var lid = +li.dataset.id, q = t.closest('[data-q]');
        if (q) { state.cart[lid] = Math.max(0, (state.cart[lid] || 0) + +q.dataset.q); if (!state.cart[lid]) delete state.cart[lid]; saveCart(); renderCart(); return; }
        if (t.closest('[data-rm]')) { delete state.cart[lid]; saveCart(); renderCart(); return; }
      }
      var cp = t.closest('[data-copy]');
      if (cp) { copyText(tgLast).then(function (ok) { toast(ok ? 'Заказ скопирован. Вставьте его в чат (Ctrl+V)' : 'Выделите текст в окне и скопируйте вручную'); }); return; }
      if (t.closest('#checkout')) {
        if (optShort()) { toast('Оптовый заказ принимается от ' + rub(MIN_OPT) + '. Не хватает ' + rub(optShort())); return; }
        checkoutForm(); return;
      }
      var ts = t.closest('[data-toast]'); if (ts) { e.preventDefault(); toast(ts.dataset.toast); return; }
      var md = t.closest('#mode button');
      if (md) {
        sfx.play('tick');
        state.mode = +md.dataset.m; store.set('mode', state.mode); syncMode(); state.shown = Math.max(state.shown, 12); renderGrid();
        toast(state.mode ? 'Показаны оптовые цены' : 'Показаны розничные цены'); return;
      }
      if (t.closest('#more')) { state.shown += 12; renderGrid(); return; }
      if (t.closest('#burger')) { $('#nav').classList.toggle('on'); return; }
      if (t.closest('#nav a')) { $('#nav').classList.remove('on'); }
    });

    document.addEventListener('submit', function (e) {
      var f = e.target;
      if (f.id === 'coForm') {
        e.preventDefault();
        var n = $('#cName').value.trim(), p = $('#cPhone').value.replace(/\D/g, '');
        if (!n || p.length < 10) { toast('Укажите имя и телефон'); return; }
        tgSent(orderText(n, $('#cPhone').value.trim()), n, true, e.submitter && e.submitter.value);
      }
      if (f.id === 'optForm') {
        e.preventDefault();
        var n2 = $('#oName').value.trim(), p2 = $('#oPhone').value.replace(/\D/g, '');
        if (!n2 || p2.length < 10) { toast('Укажите имя и телефон'); return; }
        var msg = $('#oMsg').value.trim();
        tgSent('Здравствуйте! Оптовая заявка.\n\nИмя: ' + n2 + '\nТелефон: ' + $('#oPhone').value.trim() + (msg ? '\n\nЧто интересует: ' + msg : ''), n2, false, e.submitter && e.submitter.value);
        f.reset();
      }
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); closeModal(); $('#nav').classList.remove('on'); } });

    var sortEl = $('#sort'); if (sortEl) sortEl.addEventListener('change', function (e) { state.sort = e.target.value; renderGrid(); });   // выбор сортировки убран с сайта
    var qt;
    $('#q').addEventListener('input', function (e) {
      state.q = e.target.value; state.shown = 12; clearTimeout(qt);
      qt = setTimeout(function () {
        renderGrid();
        if (state.q.trim()) { var t = $('#catalog'); if (t.getBoundingClientRect().top > innerHeight * .6 || t.getBoundingClientRect().bottom < 0) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 20, behavior: reduce ? 'auto' : 'smooth' }); }
      }, 220);
    });
  }

  function syncMode() {
    var seg = $('#mode'); seg.dataset.v = state.mode;
    $$('#mode button').forEach(function (b) { b.classList.toggle('on', +b.dataset.m === state.mode); });
  }

  /* =========================================================
     ЭФФЕКТЫ
     ========================================================= */
  function bindFx() {
    /* — шапка и прогресс — */
    var hdr = $('#hdr'), bar = $('#progress');
    function onScrollUi() {
      hdr.classList.toggle('is-solid', scrollY > 30);
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
    }

    /* — reveal — */
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); if (x.target.querySelector('[data-count]')) countUp(x.target); } });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });

    function countUp(root) {
      $$('[data-count]', root).forEach(function (el) {
        var to = +el.dataset.count, t0 = performance.now(), dur = 1600;
        (function tick(t) { var p = clamp((t - t0) / dur, 0, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(tick); })(t0);
      });
    }

    /* — активный пункт меню — */
    var links = $$('.nav a[href^="#"]');
    var secs = ['top', 'about', 'delivery', 'contacts'].map(function (id) { return document.getElementById(id); });
    function activeNav() {
      var cur = 'top', y = scrollY + innerHeight * .35;
      [['delivery', '#delivery'], ['about', '#about'], ['contacts', '#contacts']].forEach(function (p) { var el = document.querySelector(p[1]); if (el && el.offsetTop <= y) cur = p[0]; });
      links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + (cur === 'top' ? 'top' : cur)); });
    }

    /* — курсор — */
    if (finePointer && !reduce) {
      document.body.classList.add('has-cursor');
      var cur = $('#cursor'), dot = $('.dot', cur), ring = $('.ring', cur), mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
      document.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; });
      (function loop() { rx += (mx - rx) * .17; ry += (my - ry) * .17; ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)'; requestAnimationFrame(loop); })();
      document.addEventListener('pointerover', function (e) {
        var t = e.target;
        var link = t.closest && t.closest('a,button,select,input,label,.tile,.chip,.cover');
        cur.classList.toggle('is-link', !!link);
      });
    }

    /* — магнитные кнопки — */
    if (finePointer && !reduce) {
      document.addEventListener('pointermove', function (e) {
        var m = e.target.closest && e.target.closest('.mag');
        $$('.mag').forEach(function (el) { if (el !== m && el._mg) { el.style.transform = ''; el._mg = 0; } });
        if (!m) return; var r = m.getBoundingClientRect();
        m.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3) + 'px)'; m._mg = 1;
      });
      document.addEventListener('pointerout', function (e) { var m = e.target.closest && e.target.closest('.mag'); if (m && !m.contains(e.relatedTarget)) { m.style.transform = ''; m._mg = 0; } });
    }

    /* — подсветка плиток категорий и наклон карточек — */
    document.addEventListener('pointermove', function (e) {
      var tile = e.target.closest && e.target.closest('.tile');
      if (tile) { var r = tile.getBoundingClientRect(); tile.style.setProperty('--mx', (e.clientX - r.left) + 'px'); tile.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
      var w = e.target.closest && e.target.closest('.cover-wrap');
      if (w && !reduce && finePointer) {
        var c = $('.cover', w), r2 = c.getBoundingClientRect();
        var px = (e.clientX - r2.left) / r2.width, py = (e.clientY - r2.top) / r2.height;
        c.style.setProperty('--ry', ((px - .5) * 22) + 'deg'); c.style.setProperty('--rx', ((.5 - py) * 18) + 'deg');
        c.style.setProperty('--gx', (px * 100) + '%'); c.style.setProperty('--gy', (py * 100) + '%');
      }
    });
    document.addEventListener('pointerout', function (e) {
      var w = e.target.closest && e.target.closest('.cover-wrap');
      if (w && !w.contains(e.relatedTarget)) { var c = $('.cover', w); c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); }
    });

    /* — параллакс героя — */
    var heroMedia = $$('#heroBg .hero-media'), lant = $('#heroLantern'), px = 0, py = 0, tx = 0, ty = 0;
    if (finePointer && !reduce) {
      $('#hero').addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; });
      (function loop() {
        px += (tx - px) * .06; py += (ty - py) * .06;
        var sy = Math.min(scrollY, innerHeight) * .18;
        var tr = 'translate3d(' + (-px * 22) + 'px,' + (-py * 12 + sy) + 'px,0) scale(1.03)';
        for (var hm = 0; hm < heroMedia.length; hm++) heroMedia[hm].style.transform = tr;
        if (lant) lant.style.translate = (px * 30) + 'px ' + (py * 16) + 'px';
        requestAnimationFrame(loop);
      })();
    }

    window.addEventListener('scroll', function () { onScrollUi(); activeNav(); }, { passive: true });
    onScrollUi(); activeNav();
  }

  /* =========================================================
     ЗОЛОТАЯ ПЫЛЬ
     ========================================================= */
  function dust() {
    if (reduce) { $('#dust').style.display = 'none'; return; }
    var cv = $('#dust'), ctx = cv.getContext('2d'), W, H, dpr = Math.min(devicePixelRatio || 1, 2), P = [], vis = true;
    function size() { W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; }
    size(); addEventListener('resize', size);
    var n = innerWidth < 700 ? 28 : 56;
    for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.4 + .4) * dpr, vy: -(Math.random() * .25 + .06) * dpr, vx: (Math.random() - .5) * .12 * dpr, a: Math.random() * .6 + .15, ph: Math.random() * 6.28 });
    document.addEventListener('visibilitychange', function () { vis = !document.hidden; if (vis) loop(); });
    function loop() {
      if (!vis) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.x += p.vx + Math.sin(p.ph += .008) * .15 * dpr; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        var green = i % 3 === 0;   // каждая третья пылинка изумрудная
        g.addColorStop(0, (green ? 'rgba(140,235,175,' : 'rgba(246,224,170,') + p.a + ')'); g.addColorStop(1, green ? 'rgba(60,190,120,0)' : 'rgba(232,205,158,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* =========================================================
     PNG-фонарь (подгружается, если файл есть)
     ========================================================= */
  function pngs() {
    var probe = new Image();
    probe.onload = function () {
      var r = $('#relicImg'); r.src = 'assets/lantern.png';
      var h = $('#heroLantern'); h.src = 'assets/lantern.png'; h.classList.add('on');
    };
    probe.onerror = function () { var rel = $('#relic'); if (rel) rel.style.display = 'none'; };
    probe.src = 'assets/lantern.png';
  }

  /* =========================================================
     ЗВУК: синтезируется в браузере (файлов нет), по умолчанию ВЫКЛЮЧЕН
     ========================================================= */
  var sfx = (function () {
    var ctx = null, on = false;   // звук отключён совсем: кнопки включения на сайте нет
    function ac() {
      if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (e) { return null; } }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(f, t0, d, type, g, f2) {
      var c = ac(); if (!c) return;
      var o = c.createOscillator(), v = c.createGain(), t = c.currentTime + t0;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + .012); v.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(v); v.connect(c.destination); o.start(t); o.stop(t + d + .05);
    }
    function noise(t0, d, f0, f1, g) {
      var c = ac(); if (!c) return;
      var len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var s = c.createBufferSource(), bp = c.createBiquadFilter(), v = c.createGain(), t = c.currentTime + t0;
      s.buffer = buf; bp.type = 'bandpass'; bp.Q.value = .9;
      bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + d);
      v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + .02); v.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(bp); bp.connect(v); v.connect(c.destination); s.start(t);
    }
    var sounds = {
      add:  function () { tone(988, 0, .55, 'sine', .11); tone(1480, 0, .45, 'sine', .055); tone(1976, .07, .35, 'triangle', .03); },   // мягкий колокольчик
      pop:  function () { tone(420, 0, .14, 'sine', .1, 840); },                                                                       // сердечко
      tick: function () { tone(1900, 0, .045, 'square', .016); tone(1300, .01, .05, 'sine', .04); },                                   // переключатели
      page: function () { noise(0, .3, 2200, 800, .07); noise(.11, .22, 1600, 600, .045); },                                           // шелест страницы
      on:   function () { tone(660, 0, .35, 'sine', .09); tone(990, .1, .45, 'sine', .08); },
      off:  function () { tone(660, 0, .25, 'sine', .07, 440); }
    };
    return {
      isOn: function () { return on; },
      set: function (v) { var was = on; on = !!v; store.set('sound', on ? 1 : 0); if (on) sounds.on(); else if (was) { var o = on; on = true; try { sounds.off(); } catch (e) {} on = o; } },
      play: function (n) { if (on && sounds[n]) { try { sounds[n](); } catch (e) { /* звук не критичен */ } } }
    };
  })();
  function syncSound() {
    var b = $('#sndBtn'); if (!b) return;
    b.setAttribute('aria-pressed', sfx.isOn() ? 'true' : 'false');
    b.setAttribute('aria-label', sfx.isOn() ? 'Выключить звук' : 'Включить звук');
  }

  /* =========================================================
     «ЛЕТЯЩАЯ» ОБЛОЖКА: книга по дуге улетает в корзину
     ========================================================= */
  function fly(srcEl) {
    var target = $('#cartBtn');
    if (!srcEl || !target || !srcEl.getBoundingClientRect || !srcEl.animate) { bump($('#cartBadge')); return; }
    var r = srcEl.getBoundingClientRect(), tr = target.getBoundingClientRect();
    if (!r.width || !r.height) { bump($('#cartBadge')); return; }
    var g = srcEl.cloneNode(true);
    g.className = 'cover fly'; g.removeAttribute('style'); g.removeAttribute('data-act');
    g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
    document.body.appendChild(g);
    var sx = r.left, sy = r.top, ex = tr.left + tr.width / 2 - r.width / 2, ey = tr.top + tr.height / 2 - r.height / 2;
    var mx = (sx + ex) / 2 - 30, my = Math.min(sy, ey) - 150, frames = [], N = 20;
    for (var i = 0; i <= N; i++) {
      var t = i / N, u = 1 - t;
      var x = u * u * sx + 2 * u * t * mx + t * t * ex, y = u * u * sy + 2 * u * t * my + t * t * ey;
      frames.push({ offset: t, opacity: t > .93 ? 0 : 1, transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (1 - .86 * t).toFixed(3) + ') rotate(' + (-20 * t).toFixed(1) + 'deg)' });
    }
    var a = g.animate(frames, { duration: 900, easing: 'cubic-bezier(.45,.05,.25,1)' });
    a.onfinish = function () {
      g.remove(); bump($('#cartBadge'));
      target.classList.add('hit'); setTimeout(function () { target.classList.remove('hit'); }, 450);
    };
  }

  /* =========================================================
     ЗАГРУЗОЧНЫЙ ЭКРАН: логотип «проявляется», затем занавес уходит
     ========================================================= */
  function loader() {
    var el = $('#loader'), root = document.documentElement;
    if (!el) { document.body.classList.add('ready'); return; }
    root.classList.add('is-loading');
    var seen = false; try { seen = sessionStorage.getItem('seen') === '1'; } catch (e) {}
    var minT = reduce ? 0 : (seen ? 600 : 2000), t0 = performance.now(), done = false;
    el.style.setProperty('--lt', (minT / 1000) + 's');
    function hide() {
      if (done) return; done = true;
      el.classList.add('out'); root.classList.remove('is-loading'); document.body.classList.add('ready');
      try { sessionStorage.setItem('seen', '1'); } catch (e) {}
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
    }
    function check() { setTimeout(hide, Math.max(0, minT - (performance.now() - t0))); }
    if (document.readyState === 'complete') check(); else window.addEventListener('load', check);
    setTimeout(hide, 5000);   // страховка: не держим экран дольше 5 секунд
  }

  /* =========================================================
     ПЛАШКА НАД ШАПКОЙ: условия доставки и опта (текст в index.html, #promo)
     ========================================================= */
  function promo() {
    var el = $('#promo'), root = document.documentElement;
    if (!el) return;
    var closed = false; try { closed = sessionStorage.getItem('promoX') === '1'; } catch (e) {}
    if (closed) { el.parentNode.removeChild(el); root.style.setProperty('--promo-h', '0px'); return; }
    root.classList.add('has-promo');
    function pos() { root.style.setProperty('--promo-h', Math.max(0, 36 - scrollY) + 'px'); }   // плашка уезжает вместе со страницей
    pos(); window.addEventListener('scroll', pos, { passive: true });
    $('#promoX').addEventListener('click', function () {
      window.removeEventListener('scroll', pos);
      el.parentNode.removeChild(el); root.classList.remove('has-promo'); root.style.setProperty('--promo-h', '0px');
      try { sessionStorage.setItem('promoX', '1'); } catch (e) {}
    });
  }

  /* =========================================================
     КАЛЬКУЛЯТОР ОПТА
     ========================================================= */
  function calc() {
    var sel = $('#cBook'); if (!sel) return;
    sel.innerHTML = CATS.map(function (c) {
      return '<optgroup label="' + esc(c.name) + '">' + BOOKS.filter(function (b) { return b.cats.indexOf(c.key) > -1; }).map(function (b) {
        return '<option value="' + b.id + '">' + esc(b.title) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    var qty = $('#cQty'), range = $('#cRange'), cover = $('#calcCover'), bar = $('#cBar'), note = $('#cNote'), addBtn = $('#cAdd'), addTxt = $('#cAddTxt');
    var out = { unitR: $('#cUnitR'), unitO: $('#cUnitO'), totR: $('#cTotR'), totO: $('#cTotO'), save: $('#cSave'), pct: $('#cPct') };
    function num() { return clamp(parseInt(qty.value, 10) || 1, 1, 999); }
    function tween(el, to, suffix) {
      var from = el._v == null ? to : el._v, t0 = performance.now(), dur = reduce ? 0 : 450; el._v = to;
      cancelAnimationFrame(el._r);
      (function step(t) {
        var p = dur ? clamp((t - t0) / dur, 0, 1) : 1, e = 1 - Math.pow(1 - p, 3), v = Math.round(from + (to - from) * e);
        el.textContent = suffix ? v + suffix : rub(v);
        if (p < 1) el._r = requestAnimationFrame(step);
      })(t0);
    }
    function update() {
      var b = byId[sel.value], q = num(), isOpt = q >= b.minOpt;
      var unitO = isOpt ? b.wholesale : b.retail, totR = b.retail * q, totO = unitO * q, save = totR - totO, pct = totR ? Math.round(save / totR * 100) : 0;
      tween(out.unitR, b.retail); tween(out.unitO, unitO); tween(out.totR, totR); tween(out.totO, totO); tween(out.save, save); tween(out.pct, pct, '%');
      bar.style.transform = 'scaleX(' + clamp(q / b.minOpt, 0, 1) + ')';
      note.innerHTML = isOpt ? '<svg class="ico"><use href="#i-check"/></svg> Оптовая цена действует' : 'Ещё <b>' + (b.minOpt - q) + ' шт.</b> до оптовой цены ' + rub(b.wholesale);
      note.classList.toggle('ok', isOpt);
      $('#calcOptNote').textContent = 'Опт от ' + b.minOpt + ' шт. · розница ' + rub(b.retail) + ' · опт ' + rub(b.wholesale);
      addTxt.textContent = 'Добавить ' + q + ' шт. в корзину';
      range.value = Math.min(q, +range.max);
      range.style.setProperty('--fill', (range.value / range.max * 100) + '%');
    }
    function showCover() { cover.innerHTML = coverHTML(byId[sel.value]); }
    sel.addEventListener('change', function () { sfx.play('tick'); showCover(); update(); });
    qty.addEventListener('input', function () { range.value = Math.min(num(), +range.max); update(); });
    qty.addEventListener('change', function () { qty.value = num(); update(); });
    range.addEventListener('input', function () { qty.value = range.value; update(); sfx.play('tick'); });
    $('#cMinus').addEventListener('click', function () { qty.value = Math.max(1, num() - 1); sfx.play('tick'); update(); });
    $('#cPlus').addEventListener('click', function () { qty.value = Math.min(999, num() + 1); sfx.play('tick'); update(); });
    $$('[data-cq]').forEach(function (b) { b.addEventListener('click', function () { qty.value = b.dataset.cq; sfx.play('tick'); update(); }); });
    addBtn.addEventListener('click', function () {
      var b = byId[sel.value], q = num();
      if (q >= b.minOpt && state.mode !== 1) { state.mode = 1; store.set('mode', 1); syncMode(); renderGrid(); }
      addToCart(b.id, q, cover.firstElementChild || cover);
    });
    sel.value = '1'; qty.value = 10; showCover(); update();
  }

  /* =========================================================
     ДЕКОР-PNG: лёгкий параллакс при прокрутке
     ========================================================= */
  function deco() {
    var els = $$('[data-deco]'); if (!els.length || reduce) return;
    var ticking = false;
    function upd() {
      ticking = false; var vh = innerHeight;
      els.forEach(function (el) {
        var host = el.parentElement.getBoundingClientRect(), d = host.top + host.height / 2 - vh / 2;
        el.style.translate = '0 ' + (d * parseFloat(el.dataset.deco)).toFixed(1) + 'px';
        el.style.rotate = (d * parseFloat(el.dataset.rot || 0) * .01).toFixed(2) + 'deg';
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd); upd();
  }

  /* =========================================================
     ВИДЕО-ФОН ГЕРОЯ (запасной вариант — фото)
     ========================================================= */
  function heroVideo() {
    var v = $('#heroVideo'); if (!v) return;
    var save = navigator.connection && navigator.connection.saveData;
    if (reduce || save) { v.parentNode.removeChild(v); return; }
    v.muted = true;
    v.addEventListener('playing', function () { v.classList.add('on'); });
    v.addEventListener('error', function () { if (v.parentNode) v.parentNode.removeChild(v); });
    var p = v.play(); if (p && p.catch) p.catch(function () { /* автозапуск запрещён — остаётся фото */ });
  }

  /* =========================================================
     КНИГА В ЗАГОЛОВКЕ КАТАЛОГА: открывается и закрывается по прокрутке
     (3D на CSS, без картинок и видео; размеры «мира»: W=300, H=420, D=52)
     ========================================================= */
  function catBook() {
    var host = $('#catBook'); if (!host) return;
    var cam = $('#cbCam'), book = $('#cbBook'), front = $('#cbFront');
    var W = 300, H = 420, D = 52, RAD = Math.PI / 180, cur = 0, last = -1;
    var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };

    /* ---------- страницы книги: разные по содержимому, всего 14 листов (28 страниц) ----------
       Книга раскрывается «до середины»: 7 листов перелистываются влево, 7 остаются справа веером. */
    var N = 14, K = 7, seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var ORN = '<svg viewBox="0 0 120 14" width="86" height="10"><path d="M2 7h44M74 7h44"/><path d="M60 1l6 6-6 6-6-6z"/><circle cx="50" cy="7" r="1.6"/><circle cx="70" cy="7" r="1.6"/></svg>';
    var CRES = '<svg viewBox="0 0 40 40" width="26" height="26"><path d="M26 6a14 14 0 1 0 0 28a11 11 0 1 1 0-28z"/><path d="M30 20l2.4 2.4L30 25l-2.4-2.6z"/></svg>';
    function star(cx, cy, R, r, n) {   // многоконечная звезда (рубъ-эль-хизб и хатам)
      var p = [];
      for (var k = 0; k < n * 2; k++) { var a = Math.PI * k / n - Math.PI / 2, d = k % 2 ? r : R; p.push((cx + d * Math.cos(a)).toFixed(1) + ',' + (cy + d * Math.sin(a)).toFixed(1)); }
      return '<polygon points="' + p.join(' ') + '"/>';
    }
    var HALF = '<path d="M120 170C142 164 156 178 152 196C138 196 126 188 120 170z"/><path d="M120 214C148 212 160 232 146 242C134 249 122 238 130 230C135 225 141 228 139 233"/><path d="M120 258C142 254 154 268 150 284C136 284 126 276 120 258z"/>';
    var ARCH = '<svg viewBox="0 0 240 340" preserveAspectRatio="xMidYMid meet">' +
      '<defs><pattern id="cbS" width="26" height="26" patternUnits="userSpaceOnUse"><rect x="4" y="4" width="18" height="18"/><rect x="4" y="4" width="18" height="18" transform="rotate(45 13 13)"/><circle cx="13" cy="13" r="3"/></pattern>' +
      '<pattern id="cbR" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M6 1l2 3 3 2-3 2-2 3-2-3-3-2 3-2z"/></pattern></defs>' +
      '<rect x="3" y="3" width="234" height="334" rx="3"/><rect x="10" y="10" width="220" height="320" rx="2" opacity=".7"/>' +
      '<rect x="14" y="14" width="212" height="312" fill="url(#cbR)" stroke="none" opacity=".55"/><rect x="26" y="26" width="188" height="288" rx="2"/>' +
      '<rect x="28" y="28" width="184" height="284" fill="url(#cbS)" stroke="none" opacity=".5"/>' +
      '<path d="M66 56H174L186 68V272L174 284H66L54 272V68Z" fill="#f8efd3" stroke-width="1.7"/>' +
      '<path d="M70 64H170L178 72V268L170 276H70L62 268V72Z" opacity=".75"/>' +
      '<path d="M120 60l3 3-3 3-3-3zM120 274l3 3-3 3-3-3zM60 168l3 3-3 3-3-3zM180 168l3 3-3 3-3-3z" opacity=".9"/></svg>';
    var VINE = '<svg viewBox="0 0 120 30" width="96" height="24"><path d="M4 15Q22 2 40 15T76 15T116 15"/><path d="M22 9q-3-6-9-6M58 21q3 6 9 6M94 9q3-6 9-6M40 15l-4 6M76 15l4-6"/><circle cx="60" cy="15" r="2.4"/></svg>';
    function lines(n, indent) {
      var h = '';
      for (var i = 0; i < n; i++) {
        var w = i === n - 1 ? 28 + rnd() * 44 : 90 + rnd() * 10;
        h += '<b style="width:' + w.toFixed(0) + '%' + (i === 0 && indent ? ';margin-left:12%' : '') + '"></b>';
      }
      return h + '<u></u>';
    }
    var AR = ['بسم الله الرحمن الرحيم', 'وقل رب زدني علما', 'العلم نور', 'الحمد لله رب العالمين'];
    var PAGES = {
      text: function (n) { return '<div class="tx">' + lines(7, 1) + lines(6, 1) + lines(5, 1) + '</div><i class="pn">' + n + '</i>'; },
      head: function (n) { return '<h6>Начало знаний</h6>' + ORN + '<div class="dcw"><p class="dc">ب</p><div class="tx">' + lines(6) + '</div></div><div class="tx">' + lines(7, 1) + lines(4, 1) + '</div><i class="pn">' + n + '</i>'; },
      arab: function (n) { return '<p class="ar">' + AR[n % 4] + '</p>' + ORN + '<div class="tx">' + lines(6, 1) + lines(8, 1) + '</div><i class="pn">' + n + '</i>'; },
      vine: function (n) { return VINE + '<div class="tx">' + lines(9, 1) + '</div>' + VINE + '<div class="tx">' + lines(5, 1) + '</div><i class="pn">' + n + '</i>'; },
      arch: function (n) { return '<div class="tart"><div class="sq">' + ARCH + '<div class="tp"><svg class="ts" viewBox="0 0 40 40" width="28" height="28">' + star(20, 20, 18, 9, 8) + '<circle cx="20" cy="20" r="3.6"/></svg><i class="t1">Сокровищница</i><i class="t2">Ислама</i>' + ORN + '<i class="t3">Книги · Знания · Вера</i>' + CRES + '</div></div></div><i class="pn">' + n + '</i>'; },
      title: function () { return '<div class="ttl">' + CRES + '<h6>Сокровищница<br>Ислама</h6>' + ORN + '<i class="cap">Книги · Знания · Вера</i></div>'; },
      geo: function (n) { return '<div class="geo"></div><i class="pn">' + n + '</i>'; },
      quote: function (n) { return '<div class="qt"><p class="ar">العلم قبل القول والعمل</p>' + ORN + '<h6>Знание — прежде слова и дела</h6></div><div class="tx">' + lines(4, 1) + '</div><i class="pn">' + n + '</i>'; }
    };
    var FRONT = ['title', 'text', 'geo', 'arab', 'vine', 'text', 'quote', 'head', 'arab', 'text', 'geo', 'vine', 'text', 'head'];   // правые стороны листов
    var BACK  = ['text', 'head', 'text', 'quote', 'text', 'arab', 'arch', 'geo', 'text', 'vine', 'arab', 'text', 'head', 'text'];    // обратные стороны
    var pg0 = $('.pg0', host); if (pg0) pg0.innerHTML = '<div class="pc">' + PAGES.text(29) + '</div>';
    var fi = $('.fi', host); if (fi) fi.innerHTML = '<div class="pc end"></div>';
    var leaves = [];
    for (var li = 0; li < N; li++) {
      var lf = document.createElement('div'); lf.className = 'leaf';
      lf.innerHTML = '<i class="f lf"><div class="pc">' + PAGES[FRONT[li]](li * 2 + 1) + '</div>' + (li === K ? '<i class="rib"></i>' : '') + '</i>' +
                     '<i class="f lb"><div class="pc">' + PAGES[BACK[li]](li * 2 + 2) + '</div></i>';
      book.insertBefore(lf, front); leaves.push(lf);
    }
    function render(p) {
      var e1 = ease(seg(p, .08, .6));                                          // обложка откидывается
      var spanL = W * Math.max(0, -Math.cos(178 * e1 * RAD));                   // ширина откинутой половины
      var bw = host.offsetWidth, bh = host.offsetHeight;
      var scC = Math.min(bh * .76 / H, bw * .52 / W), scO = Math.min(bw * .94 / (2 * W), bh * .76 / H) * .9;   // запас под наклон и веер страниц
      var sc = scC + (scO - scC) * e1;
      cam.style.transform = 'scale(' + sc.toFixed(4) + ') rotateX(' + (-6 - 10 * e1).toFixed(2) + 'deg) rotateY(' + (-26 * (1 - e1) + 4 * e1).toFixed(2) + 'deg)';   // раскрытая книга чуть наклонена к зрителю — видна толщина блока
      book.style.transform = 'translate3d(' + (-(W - spanL) / 2).toFixed(2) + 'px,0,0)';   // разворот всегда по центру
      front.style.transform = 'translateZ(' + (D / 2) + 'px) rotateY(' + (-178 * e1).toFixed(2) + 'deg)';
      leaves.forEach(function (l, i) {
        var z = 24 - i * .5, ang;
        if (i < K) {                                                            // листы по очереди перелистываются влево и ложатся веером
          var a0 = .40 + i * .04;
          ang = ease(seg(p, a0, a0 + .26)) * (176 - i * 3.8);
        } else {                                                                // оставшиеся справа слегка приподнимаются веером
          ang = ease(seg(p, .74 + (i - K) * .025, 1)) * (3 + (N - 1 - i) * 27 / (N - 1 - K));
        }
        l.style.transform = 'translateZ(' + z + 'px) rotateY(' + (-ang).toFixed(2) + 'deg)';
      });
    }
    function progress() { var r = host.getBoundingClientRect(), vh = innerHeight; return clamp((vh * .94 - r.top) / (vh * .6), 0, 1); }
    function tick() {
      var p = progress(); cur += (p - cur) * .12;
      if (Math.abs(p - cur) < .0005) cur = p;
      if (cur !== last) { render(cur); last = cur; }
      requestAnimationFrame(tick);
    }
    if (reduce) { render(1); } else { render(0); tick(); }
    window.addEventListener('resize', function () { last = -1; });
  }
  /* ---------- пропорции обложек-фото ----------
     Рамка обложки у всех 3:4.1. Если у книги другие пропорции (поле ar), обложка подгоняется под них без растяжения
     и обрезки, стоит по центру рамки, а карточки в ряду остаются одной высоты. */
  function fitCovers() {
    $$('.cover img.real[data-ar]:not([data-fit]), .cover img.real[data-side]:not([data-fit])').forEach(function (img) {
      var ar = parseFloat(img.dataset.ar), c = img.parentNode; img.dataset.fit = '1';
      if (!c || !c.classList.contains('cover')) return;
      if (img.dataset.side) { c.classList.add('side3d'); if (img.dataset.bg) c.style.setProperty('--spine', img.dataset.bg); }   // «вид сбоку»: см. CSS .side3d
      if (!ar) return;
      c.style.setProperty('aspect-ratio', String(ar), 'important');
      var F = 3 / 4.1, k = Math.min(0.907, ar / F);   // 0.907 — ширина самой узкой обложки; все книги стоят одной ширины
      c.style.width = (k * 100).toFixed(2) + '%';
      c.style.marginLeft = c.style.marginRight = 'auto';
      c.style.marginTop = c.style.marginBottom = (Math.max(0, 1 / F - k / ar) / 2 * 100).toFixed(2) + '%';   // по вертикали — в центре рамки
    });
  }
  new MutationObserver(fitCovers).observe(document.body, { childList: true, subtree: true });

  /* ---------- запуск ---------- */
  loader(); promo();
  renderStatic(); syncMode(); renderGrid(); updateBadges(); bindEvents(); bindFx(); dust(); pngs();
  calc(); deco(); heroVideo(); syncSound(); catBook();
})();
