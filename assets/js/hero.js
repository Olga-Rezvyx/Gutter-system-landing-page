/* Герой: промотка разборки среза кромки жёлоба + привязка подписей к кадрам. */
(function () {
  'use strict';

  var canvas = document.getElementById('heroCanvas');
  var hero = document.getElementById('hero');
  var notes = Array.prototype.slice.call(document.querySelectorAll('#heroNotes .note'));

  var PX_PER_FRAME = 9.5;   // замеренный коридор — 9–10 px, иначе промотка дёргается
  var FALLBACK = { frames: 240, pattern: 'f%04d.jpg' };

  /* Одна остановка — на пике разборки, и больше нигде. Ход против паузы
   * с большим перевесом в сторону хода: обратное соотношение читается как
   * залипание, это первое, что называют заказчики. */
  var TIMELINE = [
    { to: 0.46, scroll: 5 },     // расходится по слоям
    { to: 0.56, scroll: 2.5 },   // держим на разобранном
    { to: 1.00, scroll: 4 }      // собирается обратно
  ];
  /* Пик разборки при pingpong приходится ровно на 0,50 слотов, поэтому
   * остановка задана вокруг него (0,46–0,56), а не после: заданная после
   * пика держит кадр уже на обратном ходу, и пауза читается не там. */

  function sizeSection(slots) {
    // Высота секции в пикселях: слоты × шаг + один экран на sticky.
    hero.style.height = Math.round(slots * PX_PER_FRAME + window.innerHeight) + 'px';
  }

  /* Оверлей с заголовком и кнопкой держим на собранном предмете — в начале
   * и в конце прохода — и убираем на время разборки: иначе крупная строка
   * стоит поверх расходящихся слоёв и спорит с подписями. */
  function bindOverlay() {
    var overlay = document.getElementById('heroOverlay');
    return function (p) {
      if (p > 0.10 && p < 0.88) overlay.setAttribute('data-off', '');
      else overlay.removeAttribute('data-off');
    };
  }

  function bindNotes() {
    // Границы читаем из разметки: отдельное расписание в JS разъезжается
    // с текстом при первой же правке любой из двух сторон.
    var bounds = notes.map(function (el) {
      return { el: el, from: parseFloat(el.dataset.from), to: parseFloat(el.dataset.to) };
    });
    return function (p) {
      for (var i = 0; i < bounds.length; i++) {
        var b = bounds[i];
        if (p >= b.from && p < b.to) b.el.setAttribute('data-on', '');
        else b.el.removeAttribute('data-on');
      }
    };
  }

  function layout(seq) {
    // Три режима по соотношению сторон и ширине, а не по одной ширине:
    // планшет стоймя ловит ту же беду, что и телефон.
    var portrait = window.matchMedia('(orientation: portrait)').matches;
    var narrow = window.innerWidth > 0 && window.innerWidth < 1216;

    if (portrait) {
      // contain в высокий канвас кладёт 16:9 тонкой полосой посередине —
      // возвращаем размер зумом, обрезая пустые бока.
      seq.zoom = 1.75; seq.offsetX = 0; seq.offsetY = 0;
    } else if (narrow) {
      // Колонка не помещается: текст уходит вниз, кадр приподнимаем из-под него.
      seq.zoom = 1; seq.offsetX = 0; seq.offsetY = -0.11;
    } else {
      // Двухколоночный режим: сдвигаем кадр влево, освобождая место под подписи.
      // На чёрном сдвиг ничего не стоит — едет пустота.
      seq.zoom = 1; seq.offsetX = -0.17; seq.offsetY = 0;
    }
    seq.redraw();
  }

  function build(meta) {
    var seq = new ScrollFrames({
      canvas: canvas,
      scroller: hero,
      dir: 'assets/frames',
      meta: meta,
      fit: 'contain',        // на чёрном полосы letterbox невидимы, кадрирование сохраняем
      pingpong: true,        // разбирается и собирается обратно, бесплатно и без шва
      timeline: TIMELINE,
      onFrame: (function () {
        var notes = bindNotes(), overlay = bindOverlay();
        return function (p) { notes(p); overlay(p); };
      }())
    });
    seq.start();

    sizeSection(seq.indices.length);
    layout(seq);

    window.addEventListener('resize', function () {
      sizeSection(seq.indices.length);
      layout(seq);
    });
  }

  // Манифест грузим, но не зависим от него: с file:// fetch запрещён политикой
  // источника, и без запасного значения герой там просто не запустится.
  if (window.fetch) {
    fetch('assets/frames/manifest.json')
      .then(function (r) { return r.ok ? r.json() : FALLBACK; })
      .then(build)
      .catch(function () { build(FALLBACK); });
  } else {
    build(FALLBACK);
  }

  /* Появлялки секций. Наблюдатель может не отработать — свёрнутая вкладка,
   * придушенные таймеры, споткнувшийся скрипт, — поэтому через 2,5 секунды
   * показываем всё скрытое, чем бы это ни было вызвано. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  function showAll() {
    reveals.forEach(function (el) { el.setAttribute('data-seen', ''); });
  }

  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.setAttribute('data-seen', '');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }
  setTimeout(showAll, 2500);
}());
