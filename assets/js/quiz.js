/* Квиз-расчёт. Главный узел конверсии страницы: спрос в регионе узкий,
 * поэтому вся ставка на долю посетителей, доходящих до заявки. */
(function () {
  'use strict';

  var form = document.getElementById('quiz');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.quiz__step'));
  var progress = document.getElementById('quizProgress');
  var summary = document.getElementById('quizSummary');
  var error = document.getElementById('quizError');
  var navBack = document.querySelector('#quizNav [data-back]');

  var QUESTIONS = ['Периметр крыши', 'Сейчас стоит', 'Обогрев', 'Сроки'];
  var LAST = steps.length - 1;      // экран «заявка принята»
  var CONTACTS = LAST - 1;          // экран с телефоном

  var answers = [];
  var at = 0;

  for (var i = 0; i < CONTACTS + 1; i++) {
    var tick = document.createElement('span');
    tick.className = 'quiz__tick';
    progress.appendChild(tick);
  }
  var ticks = Array.prototype.slice.call(progress.children);

  function render() {
    steps.forEach(function (s, n) { s.hidden = n !== at; });
    ticks.forEach(function (t, n) {
      if (n < at) t.setAttribute('data-done', '');
      else t.removeAttribute('data-done');
    });
    // Своя кнопка «назад» есть на экране контактов; общую там прячем.
    navBack.hidden = at === 0 || at >= CONTACTS;

    if (at === CONTACTS) {
      summary.innerHTML = '';
      answers.forEach(function (value, n) {
        var li = document.createElement('li');
        li.textContent = QUESTIONS[n] + ': ' + value;
        summary.appendChild(li);
      });
    }
    if (at === LAST) progress.hidden = true;
  }

  form.addEventListener('click', function (e) {
    var opt = e.target.closest('.quiz__opt');
    if (opt) {
      answers[at] = opt.dataset.value;
      // Пометка нужна на случай возврата назад: выбор должен быть виден.
      var siblings = opt.parentElement.querySelectorAll('.quiz__opt');
      Array.prototype.forEach.call(siblings, function (b) {
        b.setAttribute('aria-pressed', String(b === opt));
      });
      at = Math.min(at + 1, CONTACTS);
      render();
      return;
    }
    if (e.target.closest('[data-back]')) {
      at = Math.max(0, at - 1);
      render();
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var phone = form.querySelector('[name="phone"]').value.trim();
    // Считаем только цифры: пользователи пишут телефон как угодно, и придираться
    // к формату на последнем шаге — способ потерять заявку у самой двери.
    if (phone.replace(/\D/g, '').length < 10) {
      error.textContent = 'Оставьте телефон — без него не сможем прислать смету.';
      error.hidden = false;
      return;
    }
    error.hidden = true;

    var lead = {
      answers: answers.slice(),
      name: form.querySelector('[name="name"]').value.trim(),
      phone: phone
    };

    // TODO(заказчик): подставить приёмник заявок — CRM, почтовый обработчик
    // или Telegram-бот. Пока заявка никуда не уходит, только в консоль.
    console.log('Заявка:', lead);

    at = LAST;
    render();
  });

  render();
}());
