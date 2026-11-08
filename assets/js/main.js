/* ==========================================================================
   Escuela de Formación y Desarrollo Profesional EC — Interacciones
   JavaScript sin dependencias. Todo el contenido es visible sin JS;
   este archivo solo añade navegación, slider, filtros, modal y formularios.
   ========================================================================== */
(function () {
  'use strict';

  var WHATSAPP = '593962716288';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopNav = window.matchMedia('(min-width: 1081px)');

  function waLink(msg, number) {
    return 'https://wa.me/' + (number || WHATSAPP) + '?text=' + encodeURIComponent(msg);
  }

  /* ---------- Pantalla de carga ---------- */
  // Solo se muestra al abrir el sitio; al navegar entre secciones ya no aparece.
  var preloader = document.getElementById('preloader');
  if (preloader && document.documentElement.classList.contains('pl-skip')) {
    preloader.parentNode.removeChild(preloader);
    preloader = null;
  }
  if (preloader) {
    try { sessionStorage.setItem('fdp-visto', '1'); } catch (err) {}
    var minTime = reduceMotion ? 600 : 2800; // al menos 2,8 s para que se aprecie
    var hidePreloader = function () {
      var wait = Math.max(0, minTime - (window.performance ? performance.now() : 0));
      setTimeout(function () {
        preloader.classList.add('is-done');
        document.documentElement.classList.remove('is-loading');
        document.dispatchEvent(new CustomEvent('fdp:ready'));
        setTimeout(function () { if (preloader.parentNode) preloader.parentNode.removeChild(preloader); }, 700);
      }, wait);
    };
    if (document.readyState === 'complete') hidePreloader();
    else window.addEventListener('load', hidePreloader);
  }

  /* ---------- Consentimiento de cookies ---------- */
  var CONSENT_KEY = 'fdp-consent';
  var consent = null;
  try { consent = JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch (err) { consent = null; }
  var banner = document.getElementById('cookie-banner');
  var prefsBox = document.getElementById('cookie-prefs');
  var cfgBtn = banner ? $('[data-cookie-config]', banner) : null;
  var applyConsent = function () {
    if (!(consent && consent.externos)) return;
    $$('[data-consent="externos"]').forEach(function (box) {
      $$('iframe[data-src]', box).forEach(function (f) { if (!f.getAttribute('src')) f.setAttribute('src', f.getAttribute('data-src')); });
      box.classList.add('is-allowed');
    });
  };
  var setPrefsOpen = function (open) {
    if (!prefsBox || !cfgBtn) return;
    prefsBox.hidden = !open;
    cfgBtn.setAttribute('aria-expanded', String(open));
    cfgBtn.textContent = open ? 'Ocultar configuración' : 'Configurar';
  };
  var showBanner = function (withPrefs) {
    if (!banner) return;
    var sw = document.getElementById('cookie-externos');
    if (sw) sw.checked = !!(consent && consent.externos);
    setPrefsOpen(!!withPrefs);
    banner.hidden = false;
    setTimeout(function () { banner.classList.add('is-open'); }, 20);
  };
  var hideBanner = function () {
    if (!banner || banner.hidden) return;
    banner.classList.remove('is-open');
    setTimeout(function () { banner.hidden = true; }, 400);
  };
  var saveConsent = function (externos) {
    consent = { necesarias: true, externos: !!externos, fecha: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); } catch (err) {}
    applyConsent();
    hideBanner();
  };
  if (banner) {
    $('[data-cookie-accept]', banner).addEventListener('click', function () { saveConsent(true); });
    $('[data-cookie-reject]', banner).addEventListener('click', function () { saveConsent(false); });
    $('[data-cookie-save]', banner).addEventListener('click', function () { saveConsent(document.getElementById('cookie-externos').checked); });
    if (cfgBtn) cfgBtn.addEventListener('click', function () { setPrefsOpen(prefsBox.hidden); });
  }
  $$('[data-cookie-settings]').forEach(function (b) { b.addEventListener('click', function () { showBanner(true); }); });
  $$('[data-consent-accept]').forEach(function (b) { b.addEventListener('click', function () { saveConsent(true); }); });
  applyConsent();
  if (!consent && banner) {
    // El aviso aparece cuando termina la pantalla de carga
    if (preloader) document.addEventListener('fdp:ready', function () { setTimeout(function () { showBanner(false); }, 450); }, { once: true });
    else setTimeout(function () { showBanner(false); }, 800);
  }

  /* ---------- Sedes: dirección emergente ---------- */
  var topbarEl = $('.topbar');
  var placeBtns = $$('.place-pop__btn');
  var closePlaces = function (except) {
    placeBtns.forEach(function (b) {
      if (b === except) return;
      b.setAttribute('aria-expanded', 'false');
      var panel = document.getElementById(b.getAttribute('aria-controls'));
      if (panel) panel.hidden = true;
    });
    if (topbarEl && !except) topbarEl.classList.remove('has-pop');
  };
  placeBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      var open = btn.getAttribute('aria-expanded') !== 'true';
      closePlaces(btn);
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      if (topbarEl) topbarEl.classList.toggle('has-pop', open);
    });
  });
  if (placeBtns.length) {
    document.addEventListener('click', function (e) { if (!e.target.closest('.place-pop')) closePlaces(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePlaces(); });
    window.addEventListener('scroll', function () { if (window.scrollY > 60) closePlaces(); }, { passive: true });
  }

  /* ---------- Año del footer ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header: sombra al hacer scroll + volver arriba ---------- */
  var header = $('.site-header');
  var toTop = $('.to-top');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  /* ---------- Navegación: submenús ---------- */
  var subItems = $$('.nav__item--has-sub');
  function closeSubs(except) {
    subItems.forEach(function (item) {
      if (item === except) return;
      item.classList.remove('is-open');
      var t = $('.nav__toggle', item);
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }
  function setSub(item, open) {
    item.classList.toggle('is-open', open);
    $('.nav__toggle', item).setAttribute('aria-expanded', String(open));
  }
  subItems.forEach(function (item) {
    var toggle = $('.nav__toggle', item);
    var hoverTimer;
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !item.classList.contains('is-open');
      closeSubs(item);
      setSub(item, open);
    });
    item.addEventListener('mouseenter', function () {
      if (!desktopNav.matches) return;
      clearTimeout(hoverTimer);
      closeSubs(item);
      setSub(item, true);
    });
    item.addEventListener('mouseleave', function () {
      if (!desktopNav.matches) return;
      hoverTimer = setTimeout(function () { setSub(item, false); }, 160);
    });
    item.addEventListener('focusout', function (e) {
      if (desktopNav.matches && !item.contains(e.relatedTarget)) setSub(item, false);
    });
  });
  document.addEventListener('click', function (e) {
    if (desktopNav.matches && !e.target.closest('.nav__item--has-sub')) closeSubs();
  });

  /* ---------- Navegación móvil (drawer) ---------- */
  var burger = $('.burger');
  var nav = $('#site-nav');
  var overlay = $('.nav-overlay');
  function openDrawer() {
    if (typeof closePlaces === 'function') closePlaces();
    document.body.classList.add('nav-open');
    burger.setAttribute('aria-expanded', 'true');
    var first = $('.nav__close', nav);
    if (first) setTimeout(function () { first.focus(); }, 50);
  }
  function closeDrawer() {
    if (!document.body.classList.contains('nav-open')) return;
    document.body.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.focus();
  }
  if (burger && nav) {
    burger.addEventListener('click', openDrawer);
    $$('.nav__close', nav).forEach(function (b) { b.addEventListener('click', closeDrawer); });
    if (overlay) overlay.addEventListener('click', closeDrawer);
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (!desktopNav.matches) closeDrawer(); }); });
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || desktopNav.matches || !document.body.classList.contains('nav-open')) return;
      var f = $$('a, button', nav).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    desktopNav.addEventListener ? desktopNav.addEventListener('change', function () { document.body.classList.remove('nav-open'); closeSubs(); }) : null;
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeSubs(); closeDrawer(); }
  });

  /* ---------- Slider principal ---------- */
  var hero = $('[data-slider]');
  if (hero) {
    var slides = $$('.hero__slide', hero);
    var dots = $$('.hero__dot', hero);
    var DURATION = 7000;
    var current = 0, timer = null, paused = false;
    hero.style.setProperty('--slide-ms', DURATION + 'ms');

    var go = function (n) {
      slides[current].classList.remove('is-active');
      slides[current].setAttribute('aria-hidden', 'true');
      slides[current].inert = true;
      dots[current] && dots[current].setAttribute('aria-current', 'false');
      current = (n + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      slides[current].removeAttribute('aria-hidden');
      slides[current].inert = false;
      if (dots[current]) {
        dots[current].setAttribute('aria-current', 'false');
        void dots[current].offsetWidth; // reinicia la barra de progreso
        dots[current].setAttribute('aria-current', 'true');
      }
      // carga diferida de imágenes de slides siguientes
      var next = slides[(current + 1) % slides.length];
      $$('img[loading="lazy"]', next).forEach(function (img) { img.loading = 'eager'; });
      schedule();
    };
    var schedule = function () {
      clearTimeout(timer);
      if (!paused && !reduceMotion) timer = setTimeout(function () { go(current + 1); }, DURATION);
    };
    var pause = function () { paused = true; hero.classList.add('is-paused'); clearTimeout(timer); };
    var resume = function () { paused = false; hero.classList.remove('is-paused'); schedule(); };

    slides.forEach(function (s, i) { if (i !== 0) { s.setAttribute('aria-hidden', 'true'); s.inert = true; } });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    var prev = $('[data-slide-prev]', hero), nextBtn = $('[data-slide-next]', hero);
    if (prev) prev.addEventListener('click', function () { go(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(current + 1); });
    hero.addEventListener('mouseenter', pause);
    hero.addEventListener('mouseleave', resume);
    hero.addEventListener('focusin', pause);
    hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) resume(); });
    document.addEventListener('visibilitychange', function () { document.hidden ? clearTimeout(timer) : schedule(); });

    var startX = null;
    hero.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
    hero.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') go(current + 1);
      if (e.key === 'ArrowLeft') go(current - 1);
    });
    go(0);
  }

  /* ---------- Filtro y búsqueda de cursos ---------- */
  $$('[data-course-filter]').forEach(function (wrap) {
    var scope = wrap.closest('section') || document;
    var chips = $$('[data-filter]', wrap);
    var search = $('[data-course-search]', wrap);
    var cards = $$('.course-card', scope);
    var countEl = $('[data-course-count]', scope);
    var empty = $('[data-course-empty]', scope);
    var area = 'todos';

    var normalize = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var apply = function () {
      var q = normalize(search ? search.value.trim() : '');
      var shown = 0;
      cards.forEach(function (c) {
        var okArea = area === 'todos' || c.dataset.area === area;
        var okText = !q || normalize(c.textContent + ' ' + (c.dataset.keywords || '')).indexOf(q) !== -1;
        var show = okArea && okText;
        c.hidden = !show;
        if (show) shown++;
      });
      if (countEl) countEl.textContent = shown === 1 ? '1 curso disponible' : shown + ' cursos disponibles';
      if (empty) empty.hidden = shown !== 0;
    };
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        area = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        apply();
      });
    });
    if (search) search.addEventListener('input', apply);
    var reset = $('[data-filter-reset]', scope);
    if (reset) reset.addEventListener('click', function () {
      area = 'todos'; if (search) search.value = '';
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.filter === 'todos')); });
      apply();
    });
    apply();
  });

  /* ---------- Modal de programa ---------- */
  var modal = $('#course-modal');
  var data = window.CURSOS || {};
  var lastTrigger = null;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); };
  var ICON = function (id, cls) { return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + id + '"></use></svg>'; };

  function renderCourse(c) {
    var facts = [
      ['Modalidad', c.modalidad],
      ['Sede', c.sedes],
      ['Duración', c.duracion],
      ['Certificación', c.certificacion]
    ].filter(function (f) { return f[1]; })
     .map(function (f) { return '<div class="fact"><small>' + f[0] + '</small><strong>' + esc(f[1]) + '</strong></div>'; }).join('');
    var perks = (c.beneficios || []).map(function (b) { return '<li>' + ICON('check-circle') + esc(b) + '</li>'; }).join('');
    perks = perks ? '<ul class="perks">' + perks + '</ul>' : '';
    var number = c.whatsapp || WHATSAPP;
    var temas = c.temas.map(function (t) { return '<li>' + ICON('check-circle') + '<span>' + esc(t) + '</span></li>'; }).join('');
    var bonus = c.bono ? '<div class="bonus-box">' + ICON('gift') + '<div><strong>Beneficio incluido</strong><span>' + esc(c.bono) + '</span></div></div>' : '';
    var aud = (c.dirigido ? '<p class="modal__audience"><strong>Dirigido a:</strong> ' + esc(c.dirigido) + '</p>' : '') +
              (c.ponente ? '<p class="modal__audience"><strong>Ponente:</strong> ' + esc(c.ponente) + '</p>' : '');
    var msg = 'Hola 👋, quiero información sobre el curso *' + c.titulo + '*.\n¿Me pueden enviar los horarios, la inversión y la fecha de inicio?';
    return '' +
      '<div class="modal__content">' +
        '<p class="modal__area">' + esc(c.areaNombre) + '</p>' +
        '<h2 class="modal__title" id="course-modal-title">' + esc(c.titulo) + '</h2>' +
        '<p class="modal__desc">' + esc(c.descripcion) + '</p>' +
        (facts ? '<div class="facts">' + facts + '</div>' : '') +
        perks +
        '<h3 class="modal__h">' + esc(c.temasTitulo || 'Lo que aprenderás') + '</h3>' +
        '<ul class="checklist">' + temas + '</ul>' +
        bonus + aud +
        '<div class="modal__actions">' +
          '<a class="btn btn--whatsapp" target="_blank" rel="noopener" href="' + waLink(msg, number) + '">' + ICON('whatsapp') + 'Inscribirme por WhatsApp</a>' +
          '<a class="btn btn--outline" href="tel:+' + number + '">' + ICON('phone') + 'Llamar ahora</a>' +
        '</div>' +
      '</div>' +
      '<figure class="modal__aside">' +
        '<img src="' + esc(c.afiche) + '" alt="Afiche oficial del curso ' + esc(c.titulo) + '" width="700" height="700">' +
        '<figcaption>Afiche oficial del curso</figcaption>' +
      '</figure>';
  }

  function openCourse(id, push) {
    var c = data[id];
    if (!modal || !c || typeof modal.showModal !== 'function') return false;
    closeSubs();
    $('.modal__inner', modal).innerHTML = renderCourse(c);
    if (!modal.open) modal.showModal();
    $('.modal__inner', modal).scrollTop = 0;
    var content = $('.modal__content', modal); if (content) content.scrollTop = 0;
    if (push && document.body.dataset.page === 'oferta') history.replaceState(null, '', '#' + id);
    return true;
  }
  if (modal) {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-course]');
      if (!t) return;
      if (openCourse(t.dataset.course, true)) { e.preventDefault(); lastTrigger = t; }
    });
    $('.modal__close', modal).addEventListener('click', function () { modal.close(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
    modal.addEventListener('close', function () {
      if (document.body.dataset.page === 'oferta' && location.hash) history.replaceState(null, '', location.pathname + location.search);
      if (lastTrigger) lastTrigger.focus();
    });
    var fromHash = function () {
      var hash = decodeURIComponent(location.hash.replace('#', ''));
      if (!hash || !data[hash]) return;
      var card = document.getElementById('curso-' + hash);
      if (card) card.scrollIntoView({ block: 'center' });
      openCourse(hash, false);
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* ---------- Formularios → WhatsApp ---------- */
  $$('form[data-wa-form]').forEach(function (form) {
    var status = $('.form-status', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', form).forEach(function (input) {
        var field = input.closest('.field');
        var valid = input.value.trim() !== '' && input.checkValidity();
        if (field) field.classList.toggle('has-error', !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;
      // Mensaje con formato de WhatsApp (*negrita*, _cursiva_) y un campo por línea
      var SEP = '━━━━━━━━━━━━━━━';
      var lines = [form.dataset.waForm || 'Hola, quisiera información.', ''];
      if (form.dataset.waTitle) lines.push('📋 *' + form.dataset.waTitle + '*', SEP);
      var extra = [];
      $$('[name]', form).forEach(function (input) {
        var v = input.value.trim().replace(/\n{3,}/g, '\n\n');
        if (!v) return;
        var label = (input.dataset.emoji ? input.dataset.emoji + ' ' : '') + '*' + (input.dataset.label || input.name) + ':*';
        if (input.tagName === 'TEXTAREA') extra.push('', label, v);
        else lines.push(label + ' ' + v);
      });
      lines = lines.concat(extra);
      lines.push(SEP, '_Enviado desde la página web_');
      window.open(waLink(lines.join('\n')), '_blank', 'noopener');
      if (status) status.classList.add('is-visible');
    });
    $$('input, select, textarea', form).forEach(function (input) {
      input.addEventListener('input', function () { var f = input.closest('.field'); if (f) f.classList.remove('has-error'); });
    });
  });

  // Preselecciona el interés en contacto (contacto.html?interes=excel)
  var interest = $('#f-interes');
  if (interest) {
    var p = new URLSearchParams(location.search).get('interes');
    if (p) $$('option', interest).forEach(function (o) { if (o.value === p || o.dataset.id === p) interest.value = o.value; });
  }

  /* ---------- Carrusel de reseñas ---------- */
  $$('[data-review-slider]').forEach(function (slider) {
    var track = $('.review-slider__track', slider);
    var slides = $$('.review-slide', slider);
    var dotsWrap = $('.review-slider__dots', slider);
    var count = $('.review-slider__count', slider);
    if (slides.length < 2) { slider.classList.add('is-single'); return; }
    var index = 0, timer = null, paused = false;
    var dots = slides.map(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'review-slider__dot';
      d.setAttribute('aria-label', 'Ver reseña ' + (i + 1));
      d.addEventListener('click', function () { goTo(i); restart(); });
      dotsWrap.appendChild(d);
      return d;
    });
    var offset = function (i) { return slides[i].offsetLeft - slides[0].offsetLeft; };
    var setActive = function (i) {
      index = i;
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      if (count) count.textContent = (i + 1) + ' / ' + slides.length;
    };
    var target = null;
    var goTo = function (i) {
      target = (i + slides.length) % slides.length;
      setActive(target);
      track.scrollTo({ left: offset(target), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    var update = function () {
      var x = track.scrollLeft, best = 0, min = Infinity;
      slides.forEach(function (s, i) { var d = Math.abs(offset(i) - x); if (d < min) { min = d; best = i; } });
      if (target !== null) { if (best === target) target = null; else return; } // mientras se desliza hacia el destino
      setActive(best);
    };
    var restart = function () {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(function () { if (!paused && !document.hidden) goTo(index + 1); }, 8000);
    };
    var settle;
    track.addEventListener('scroll', function () {
      clearTimeout(settle);
      settle = setTimeout(function () { target = null; update(); }, 160);
      update();
    }, { passive: true });
    track.addEventListener('pointerdown', function () { target = null; });
    $('[data-review-prev]', slider).addEventListener('click', function () { goTo(index - 1); restart(); });
    $('[data-review-next]', slider).addEventListener('click', function () { goTo(index + 1); restart(); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); restart(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); restart(); }
    });
    slider.addEventListener('mouseenter', function () { paused = true; });
    slider.addEventListener('mouseleave', function () { paused = false; });
    slider.addEventListener('focusin', function () { paused = true; });
    slider.addEventListener('focusout', function (e) { if (!slider.contains(e.relatedTarget)) paused = false; });
    track.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    window.addEventListener('resize', function () { track.scrollTo({ left: offset(index), behavior: 'auto' }); });
    update();
    restart();
  });

  /* ---------- Llegar a una sección (#sedes, #preguntas…) desde otra página ---------- */
  // Las imágenes y fuentes cambian la altura de la página mientras carga; se corrige la posición al terminar.
  var jumpToHash = function () {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    if (!id || (window.CURSOS && window.CURSOS[id])) return;
    var target = document.getElementById(id);
    if (!target) return;
    var root = document.documentElement, prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto'; // salto inmediato (sin animación) para que no se quede a medio camino
    target.scrollIntoView({ block: 'start' });
    root.style.scrollBehavior = prev;
  };
  if (location.hash) {
    if (document.readyState === 'complete') setTimeout(jumpToHash, 60);
    else window.addEventListener('load', function () { setTimeout(jumpToHash, 60); });
    document.addEventListener('fdp:ready', function () { setTimeout(jumpToHash, 30); }, { once: true });
  }

  /* ---------- Animación al hacer scroll ---------- */
  var revealEls = $$('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        // al terminar la animación se limpian las clases para que los hover propios funcionen
        setTimeout(function () { el.classList.remove('reveal', 'reveal-stagger', 'is-visible'); }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
