/* Сборка курса: список уроков, прогресс, терминал, редактор, проверка заданий. */
(function () {
  'use strict';

  var L = window.QALessons || [];
  var $ = function (id) { return document.getElementById(id); };
  var STORE = 'qa-course-progress-v1';

  var state = {
    idx: 0,
    done: {},
    xp: 0,
    quizDone: {},
    code: {},          // сохранённый код по урокам
    attempts: {},      // количество удачных и неудачных проверок
    reviews: {}        // сила памяти и дата следующего повторения
  };

  var session = null;   // текущая сессия консоли
  var lastPy = null;    // последний запуск Python
  var term, editor, visualizer, glossary;
  var reviewMode = false;

  var REVIEW_INTERVALS = [10 * 60 * 1000, 24 * 60 * 60 * 1000, 3 * 24 * 60 * 60 * 1000,
    7 * 24 * 60 * 60 * 1000, 14 * 24 * 60 * 60 * 1000];

  /* ─────────── хранилище ─────────── */

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var d = JSON.parse(raw);
        state.done = d.done || {};
        state.xp = d.xp || 0;
        state.quizDone = d.quizDone || {};
        state.code = d.code || {};
        state.attempts = d.attempts || {};
        state.reviews = d.reviews || {};
        state.idx = typeof d.idx === 'number' ? Math.min(d.idx, L.length - 1) : 0;
        Object.keys(state.done).forEach(function (id) {
          if (!state.reviews[id]) state.reviews[id] = { strength: 1, successes: 1, failures: 0, next: 0 };
        });
      }
    } catch (e) { /* приватный режим — просто без сохранения */ }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  /* ─────────── сайдбар ─────────── */

  function renderSidebar() {
    var box = $('sidebar');
    box.innerHTML = '';
    var lastDay = null, lastMod = null;

    L.forEach(function (les, i) {
      if (les.day !== lastDay) {
        lastDay = les.day;
        lastMod = null;
        var dh = document.createElement('div');
        dh.className = 'day-head';
        dh.innerHTML = 'День ' + les.day + ' <span>· ' + (DAY_TITLES[les.day] || '') + '</span>';
        box.appendChild(dh);
      }
      if (les.module !== lastMod) {
        lastMod = les.module;
        var mh = document.createElement('div');
        mh.className = 'mod-head';
        mh.textContent = les.module;
        box.appendChild(mh);
      }
      var el = document.createElement('div');
      el.className = 'les' + (i === state.idx ? ' active' : '') + (state.done[les.id] ? ' done' : '');
      el.innerHTML = '<span class="mark">' + (state.done[les.id] ? '✓' : (les.mode === 'python' ? 'py' : '$')) + '</span>' +
        '<span>' + les.title + '</span>';
      el.onclick = function () { go(i); if (window.innerWidth <= 1390) $('sidebar').classList.remove('open'); };
      box.appendChild(el);
    });
  }

  var DAY_TITLES = {
    1: 'Linux: файлы, логи, поиск',
    2: 'Linux: процессы, службы, сеть',
    3: 'Python: основа руками',
    4: 'Python: тесты API и pytest',
    5: 'Docker, Compose и CI',
    6: 'Архитектура и протоколы 5G SA',
    7: 'BDD, данные и диагностика 5G',
    8: 'Рабочая смена и собеседование'
  };

  function renderProgress() {
    var done = Object.keys(state.done).length;
    var mastered = L.filter(function (les) {
      var r = state.reviews[les.id];
      return r && r.successes >= 2 && r.strength >= 2;
    }).length;
    var due = reviewQueue(true).length;
    $('bar-fill').style.width = (L.length ? done / L.length * 100 : 0) + '%';
    $('prog-label').textContent = done + ' из ' + L.length;
    $('xp').textContent = state.xp;
    $('mastery').textContent = (L.length ? Math.round(mastered / L.length * 100) : 0) + '%';
    $('review-count').textContent = due;
    $('btn-review').classList.toggle('due', due > 0);
  }

  /* ─────────── урок ─────────── */

  function cur() { return L[state.idx]; }

  function go(i) {
    if (i < 0 || i >= L.length) return;
    reviewMode = false;
    state.idx = i;
    save();
    renderSidebar();
    renderLesson();
  }

  function renderLesson() {
    var les = cur();
    var note = (window.QAMentorNotes || {})[les.id] || les.mentor;
    $('pane-mid').classList.toggle('review-active', reviewMode);
    $('review-banner').hidden = !reviewMode;
    $('btn-reveal').disabled = false;
    $('btn-reveal').textContent = 'Открыть теорию';
    $('kicker').textContent = 'День ' + les.day + ' · ' + les.module;
    $('title').textContent = les.title;
    $('goal').textContent = les.goal || '';
    $('theory').innerHTML = (les.theory || '') + renderMentor(note);
    $('task-text').innerHTML = les.task || '';
    $('hints').innerHTML = '';
    $('verdict').className = 'verdict';
    $('verdict').innerHTML = '';
    renderQuiz(les);

    lastPy = null;
    var shellView = $('shell-view'), pyView = $('py-view');

    if (les.mode === 'python') {
      shellView.hidden = true;
      pyView.hidden = false;
      $('cheat-view').hidden = true;
      editor.setValue(state.code[les.id] !== undefined ? state.code[les.id] : (les.starter || ''));
      $('py-out').textContent = '';
      // стенд нужен урокам про requests/subprocess
      session = window.QAEngine.newSession(les.scenario || 'ok');
      $('btn-pytest').style.display = les.pytest ? '' : 'none';
    } else {
      pyView.hidden = true;
      shellView.hidden = false;
      $('cheat-view').hidden = true;
      session = window.QAEngine.newSession(les.scenario || 'ok');
      session.banner = les.banner || 'Стенд поднят. Наберите help, если забыли команду.';
      term.attach(session);
    }
    if (visualizer) visualizer.attach(session, les);
    updateStandLine();
    setWorkTab('main');
    $('pane-mid').scrollTop = 0;
  }

  function renderMentor(note) {
    if (!note) return '';
    return '<div class="study-loop"><b>Цикл урока:</b>' +
      '<span class="study-step">прочитать</span><span class="study-arrow">→</span>' +
      '<span class="study-step">предсказать</span><span class="study-arrow">→</span>' +
      '<span class="study-step">выполнить</span><span class="study-arrow">→</span>' +
      '<span class="study-step">объяснить вслух</span></div>' +
      '<section class="mentor-brief"><div class="mentor-title">▣ Комментарий наставника</div>' +
      '<div class="mentor-grid">' +
      mentorItem('Зачем это QA 5G', note.why) + mentorItem('Что наблюдать', note.observe) +
      mentorItem('Частая ошибка', note.mistake, 'mistake') + mentorItem('Как защитить на собеседовании', note.explain) +
      '</div></section>';
  }

  function mentorItem(label, text, cls) {
    return '<article class="mentor-item ' + (cls || '') + '"><span>' + label + '</span><p>' + text + '</p></article>';
  }

  function updateStandLine() {
    if (!session) return;
    var st = session.stand;
    if (cur().day >= 5 && st.fiveg) {
      var f = st.fiveg;
      $('stand-line').innerHTML = '5G SA: <b>Open5GS + UERANSIM</b> · containers ' +
        (f.containers.length - f.down.length) + '/' + f.containers.length + ' up · NF ' + f.nfTypes.length + '/8 · UE ' +
        (f.ueState === 'RM-REGISTERED' ? '<span class="up">' + f.ueState + '</span>' : '<span class="down">' + f.ueState + '</span>') +
        ' · PDU ' + (f.pduState === 'PS-ACTIVE' ? '<span class="up">active</span>' : '<span class="down">inactive</span>');
      return;
    }
    var svc = st.services['core-registrar'];
    var sock = st.sockets.filter(function (s) { return s.prog === 'registrar'; })[0];
    $('stand-line').innerHTML =
      'стенд: <b>core-node</b> 10.10.0.10 · сервис core-registrar ' +
      (svc.active ? '<span class="up">active</span>' : '<span class="down">failed</span>') +
      ' · слушает ' + (sock ? sock.local : '—') +
      ' · БД ' + (st.dbUp ? '<span class="up">up</span>' : '<span class="down">down</span>') +
      (st.firewall.enabled ? ' · firewall <span class="down">on</span>' : '');
  }

  /* ─────────── квиз ─────────── */

  function renderQuiz(les) {
    var box = $('quiz');
    box.innerHTML = '';
    if (!les.quiz) return;
    var q = les.quiz;
    var card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = '<h3>Вопрос как на собеседовании</h3><div class="quiz-q">' + q.q + '</div>';
    var expl = document.createElement('div');
    expl.className = 'quiz-exp';
    expl.innerHTML = '<b>Почему:</b> ' + q.explain;

    q.options.forEach(function (opt, i) {
      var b = document.createElement('button');
      b.className = 'quiz-opt';
      b.innerHTML = opt;
      b.onclick = function () {
        if (card.dataset.answered) return;
        card.dataset.answered = '1';
        b.classList.add(i === q.answer ? 'right' : 'wrong');
        if (i !== q.answer) {
          card.querySelectorAll('.quiz-opt')[q.answer].classList.add('right');
        } else if (!state.quizDone[les.id]) {
          state.quizDone[les.id] = true;
          state.xp += 5;
          renderProgress();
          save();
        }
        expl.classList.add('show');
      };
      card.appendChild(b);
    });
    card.appendChild(expl);
    box.appendChild(card);
  }

  /* ─────────── проверка задания ─────────── */

  function check() {
    var les = cur();
    var ctx = { session: session, py: lastPy, code: les.mode === 'python' ? editor.getValue() : '' };

    if (les.mode === 'python' && !lastPy) {
      showVerdict(false, ['Сначала запустите код кнопкой «Запустить» — проверять пока нечего.']);
      return;
    }

    var res = window.QAEngine.checkLesson(les, ctx);
    showVerdict(res.ok, res.fails);
    recordAttempt(les.id, res.ok);

    if (res.ok && !state.done[les.id]) {
      state.done[les.id] = true;
      state.xp += 10;
      renderSidebar();
      renderProgress();
      save();
    }
    if (res.ok && reviewMode) {
      $('verdict').innerHTML += '<div class="review-result">Следующее повторение: ' + formatDue(state.reviews[les.id].next) + '.</div>';
    }
    renderProgress();
    save();
  }

  function recordAttempt(id, okFlag) {
    var a = state.attempts[id] || { success: 0, fail: 0 };
    var r = state.reviews[id] || { strength: 0, successes: 0, failures: 0, next: 0 };
    if (okFlag) {
      a.success++;
      r.successes++;
      r.strength = Math.min(5, r.strength + 1);
      var interval = REVIEW_INTERVALS[Math.min(REVIEW_INTERVALS.length - 1, Math.max(0, r.strength - 1))];
      r.next = Date.now() + interval;
    } else {
      a.fail++;
      r.failures++;
      r.strength = Math.max(0, r.strength - 1);
      r.next = Date.now() + 10 * 60 * 1000;
    }
    r.last = Date.now();
    state.attempts[id] = a;
    state.reviews[id] = r;
  }

  function reviewQueue(onlyDue) {
    var now = Date.now();
    return L.filter(function (les) {
      var r = state.reviews[les.id];
      if (!state.done[les.id] || !r) return false;
      return !onlyDue || !r.next || r.next <= now;
    }).sort(function (a, b) {
      var ra = state.reviews[a.id], rb = state.reviews[b.id];
      if (ra.strength !== rb.strength) return ra.strength - rb.strength;
      return (ra.next || 0) - (rb.next || 0);
    });
  }

  function smartReviewQueue() {
    var due = reviewQueue(true);
    if (due.length) return due;
    return reviewQueue(false).slice(0, 7);
  }

  function formatDue(timestamp) {
    if (!timestamp || timestamp <= Date.now()) return 'сейчас';
    var mins = Math.ceil((timestamp - Date.now()) / 60000);
    if (mins < 60) return 'через ' + mins + ' мин';
    var hours = Math.ceil(mins / 60);
    if (hours < 24) return 'через ' + hours + ' ч';
    return 'через ' + Math.ceil(hours / 24) + ' дн';
  }

  function showVerdict(ok, fails) {
    var v = $('verdict');
    v.className = 'verdict show ' + (ok ? 'ok' : 'no');
    if (ok) {
      v.innerHTML = '<b>Зачтено.</b> ' + (cur().praise || 'Идём дальше.');
    } else {
      v.innerHTML = '<b>Пока нет.</b><ul>' + fails.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>';
    }
  }

  /* ─────────── запуск Python ─────────── */

  function runPython(withTests) {
    var les = cur();
    var code = editor.getValue();
    state.code[les.id] = code;
    save();

    session = window.QAEngine.newSession(les.scenario || 'ok');
    var res = window.QAEngine.runPython(code, {
      stand: session.stand,
      pytest: !!withTests
    });
    lastPy = res;

    var outEl = $('py-out');
    outEl.innerHTML = '';
    var text = res.out || '';
    if (res.error) text += (text && !/\n$/.test(text) ? '\n' : '') + res.error;
    outEl.appendChild(colorize(text || '(программа ничего не вывела)'));
    updateStandLine();
    if (visualizer) visualizer.handlePython(code, res, !!withTests);
  }

  function colorize(text) {
    var frag = document.createDocumentFragment();
    text.split('\n').forEach(function (line, i, arr) {
      var span = document.createElement('span');
      if (/^(\w*Error|Ошибка|FAILED|E  )/.test(line) || /FAILURES/.test(line)) span.className = 'fail';
      else if (/PASSED|passed|^\.+$/.test(line)) span.className = 'pass';
      span.textContent = line + (i < arr.length - 1 ? '\n' : '');
      frag.appendChild(span);
    });
    return frag;
  }

  /* ─────────── быстрые вставки для телефона ─────────── */

  var SHELL_KEYS = [
    { t: '|' }, { t: '>' }, { t: '-' }, { t: '/' }, { t: '"' },
    { t: '/var/log/core/registrar.log', label: 'лог сервиса', wide: true },
    { t: '/etc/core/registrar.conf', label: 'конфиг', wide: true },
    { t: '/etc/core/subscribers.csv', label: 'абоненты', wide: true },
    { t: 'core-registrar', wide: true },
    { t: 'http://localhost:8080', wide: true },
    { t: '250010000000001', label: 'IMSI старого стенда', wide: true },
    { t: 'docker compose ps --all', label: 'compose ps', wide: true },
    { t: 'docker compose logs --tail=100 ', label: 'compose logs', wide: true },
    { t: '999700000000001', label: '5G IMSI', wide: true },
    { t: 'http://nrf:7777/nnrf-nfm/v1/nf-instances', label: 'NRF endpoint', wide: true }
  ];

  var PY_KEYS = [
    { t: '_' }, { t: ':' }, { t: '(' }, { t: ')' }, { t: '[' }, { t: ']' },
    { t: '{' }, { t: '}' }, { t: '"' }, { t: '=' }, { t: '==' },
    { t: '    ', label: '⇥ отступ' },
    { t: '/var/log/core/registrar.log', label: 'лог сервиса', wide: true },
    { t: 'http://localhost:8080', wide: true },
    { t: '250010000000001', label: 'IMSI', wide: true }
  ];

  function buildKeys(boxId, keys, insert) {
    var box = $(boxId);
    if (!box || box.dataset.ready) return;
    box.dataset.ready = '1';
    keys.forEach(function (k) {
      var b = document.createElement('button');
      b.className = 'qk' + (k.wide ? ' wide' : '');
      b.textContent = k.label || k.t;
      b.title = k.t;
      b.onmousedown = function (e) { e.preventDefault(); };   // не терять фокус поля
      b.onclick = function () { insert(k.t); };
      box.appendChild(b);
    });
  }

  function insertIntoInput(el, text) {
    var start = el.selectionStart === null ? el.value.length : el.selectionStart;
    var end = el.selectionEnd === null ? el.value.length : el.selectionEnd;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    var pos = start + text.length;
    el.focus();
    try { el.setSelectionRange(pos, pos); } catch (e) { /* некоторые мобильные браузеры */ }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* ─────────── вкладки рабочей области ─────────── */

  function setWorkTab(which) {
    var les = cur();
    $('wt-main').classList.toggle('active', which === 'main');
    $('wt-cheat').classList.toggle('active', which === 'cheat');
    $('cheat-view').hidden = which !== 'cheat';
    if (which === 'cheat') {
      $('shell-view').hidden = true;
      $('py-view').hidden = true;
      if (visualizer) visualizer.setVisible(false);
      if (!$('cheat-view').innerHTML) $('cheat-view').innerHTML = window.QACheatsheet || '';
    } else {
      $('shell-view').hidden = les.mode === 'python';
      $('py-view').hidden = les.mode !== 'python';
      if (visualizer) visualizer.setVisible(true);
    }
  }

  /* ─────────── интервальное повторение ─────────── */

  function strengthBars(n) {
    var html = '<span class="strength" title="прочность памяти ' + n + ' из 5">';
    for (var i = 1; i <= 5; i++) html += '<i class="' + (i <= n ? 'on' : '') + '"></i>';
    return html + '</span>';
  }

  function openReview() {
    var due = reviewQueue(true);
    var queue = smartReviewQueue();
    var learned = Object.keys(state.done).length;
    var mastered = L.filter(function (les) {
      var r = state.reviews[les.id];
      return r && r.successes >= 2 && r.strength >= 2;
    }).length;
    var box = $('review-modal');
    box.innerHTML = '<h2>Умное повторение</h2>' +
      '<div class="sub">Алгоритм показывает сначала просроченные и слабые темы. Во время повтора теория и подсказки закрыты до первой попытки.</div>' +
      '<div class="review-summary">' +
      '<div class="review-metric"><b>' + due.length + '</b><span>пора повторить</span></div>' +
      '<div class="review-metric"><b>' + learned + '</b><span>пройдено один раз</span></div>' +
      '<div class="review-metric"><b>' + mastered + '</b><span>закреплено ≥ 2 раз</span></div></div>' +
      '<div class="readiness-note"><b>Правило допуска:</b> «пройдено» означает одну удачную попытку, а «закреплено» — минимум две удачные попытки в разные подходы. Для выхода на собеседование цель — 80% закреплённых уроков и 8/10 на трёх экзаменах подряд.</div>' +
      (queue.length ? '<div class="review-list">' + queue.slice(0, 7).map(function (les) {
        var r = state.reviews[les.id];
        return '<div class="review-row"><div class="review-info"><b>' + les.title + '</b><small>День ' + les.day + ' · ' + formatDue(r.next) + '</small></div>' +
          strengthBars(r.strength) + '<button class="btn btn-ghost review-pick" data-id="' + les.id + '">Повторить</button></div>';
      }).join('') + '</div>' : '<div class="note">Сначала завершите хотя бы один практический урок — он появится в очереди повторения.</div>') +
      '<div class="task-actions">' + (queue.length ? '<button class="btn btn-check" id="review-start">Начать слабую тему</button>' : '') +
      '<button class="btn btn-ghost" id="review-close">Закрыть</button></div>';
    $('review-back').hidden = false;
    box.querySelectorAll('.review-pick').forEach(function (button) {
      button.onclick = function () { startReview(button.dataset.id); };
    });
    if ($('review-start')) $('review-start').onclick = function () { startReview(queue[0].id); };
    $('review-close').onclick = function () { $('review-back').hidden = true; };
  }

  function startReview(id) {
    var idx = L.findIndex(function (les) { return les.id === id; });
    if (idx < 0) return;
    state.idx = idx;
    reviewMode = true;
    $('review-back').hidden = true;
    save();
    renderSidebar();
    renderLesson();
  }

  /* ─────────── экзамен ─────────── */

  function openExam() {
    var pool = (window.QAExam || []).slice();
    for (var i = pool.length - 1; i > 0; i--) {          // перемешиваем
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    var questions = pool.slice(0, 10);
    var box = $('exam-modal');
    var started = Date.now();

    box.innerHTML = '<h2>Режим собеседования <span class="exam-timer" id="exam-timer">00:00</span></h2>' +
      '<div class="sub">10 вопросов без подсказок и без интернета. Отвечайте так, как сказали бы вслух: коротко и по делу. ' +
      'Проверка ищет ключевые слова, поэтому пишите команду или термин, а не «ну, надо посмотреть логи».</div>' +
      questions.map(function (q, i) {
        return '<div class="exam-q" data-i="' + i + '">' +
          '<div class="num">вопрос ' + (i + 1) + ' · ' + q.topic + '</div>' +
          '<p>' + q.q + '</p>' +
          '<input class="exam-input" placeholder="ответ одной строкой">' +
          '<div class="exam-res"></div></div>';
      }).join('') +
      '<div class="task-actions"><button class="btn btn-check" id="exam-check">Проверить ответы</button>' +
      '<button class="btn btn-ghost" id="exam-close">Закрыть</button></div>';

    $('exam-back').hidden = false;
    var timer = setInterval(function () {
      var s = Math.floor((Date.now() - started) / 1000);
      var el = $('exam-timer');
      if (!el) { clearInterval(timer); return; }
      el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }, 1000);

    $('exam-check').onclick = function () {
      var right = 0;
      box.querySelectorAll('.exam-q').forEach(function (el) {
        var q = questions[+el.dataset.i];
        var val = el.querySelector('.exam-input').value.trim();
        var res = el.querySelector('.exam-res');
        var okFlag = q.accept.some(function (re) { return new RegExp(re, 'i').test(val); });
        res.className = 'exam-res ' + (okFlag ? 'ok' : 'no');
        res.innerHTML = okFlag ? '✓ верно' : '✗ ожидалось: ' + q.answer;
        if (okFlag) right++;
      });
      var verdict = right >= 8 ? 'Готовы к техсобесу по этому блоку.'
        : right >= 5 ? 'Средне: повторите темы, где ошиблись, и пройдите заново.'
        : 'Рано идти на собеседование — вернитесь к урокам этих тем.';
      var sum = document.createElement('div');
      sum.className = 'note';
      sum.innerHTML = '<b>' + right + ' из ' + questions.length + '.</b> ' + verdict;
      box.appendChild(sum);
      if (right >= 8) { state.xp += 25; renderProgress(); save(); }
    };
    $('exam-close').onclick = function () { clearInterval(timer); $('exam-back').hidden = true; };
  }

  /* ─────────── инициализация ─────────── */

  function init() {
    load();

    visualizer = new window.CourseVisualizer({
      panel: $('live-lab'), stage: $('viz-stage'), sceneLabel: $('viz-scene-label'),
      eventTitle: $('viz-event-title'), summary: $('viz-summary'), steps: $('viz-steps'),
      badge: $('viz-badge'), toggle: $('viz-toggle'), replay: $('viz-replay'),
      detach: $('viz-detach'), fullscreen: $('viz-fullscreen')
    });

    glossary = new window.CourseGlossary({
      tooltip: $('glossary-popover'), category: $('glossary-category'),
      title: $('glossary-title'), text: $('glossary-text')
    });
    glossary.observe(document.body);

    term = new window.CourseTerminal({
      box: $('term'), out: $('term-out'), input: $('term-input'), prompt: $('term-prompt'),
      onRun: function (line, result) {
        updateStandLine();
        visualizer.handleCommand(line, result);
      },
      onPreview: function (line) { visualizer.preview(line); }
    });

    editor = new window.CourseEditor({
      textarea: $('editor'), gutter: $('gutter'),
      onRun: function () { runPython(false); }
    });

    $('btn-check').onclick = check;
    $('btn-run').onclick = function () { runPython(false); };
    $('btn-pytest').onclick = function () { runPython(true); };
    $('btn-reset-code').onclick = function () {
      editor.setValue(cur().starter || '');
      delete state.code[cur().id];
      save();
    };

    $('btn-hint').onclick = function () {
      var les = cur();
      var box = $('hints');
      var shown = box.children.length;
      var hints = les.hints || [];
      if (shown >= hints.length) {
        box.innerHTML += '<div>Подсказки кончились — жмите «Решение», но сначала попробуйте сами ещё раз.</div>';
        return;
      }
      var d = document.createElement('div');
      d.innerHTML = hints[shown];
      box.appendChild(d);
    };

    $('btn-solution').onclick = function () {
      var les = cur();
      if (!les.solution) return;
      if (les.mode === 'python') {
        editor.setValue(les.solution);
        $('hints').innerHTML += '<div>Решение вставлено в редактор. Прочитайте его построчно и объясните себе вслух каждую строку — на собеседовании спросят именно это.</div>';
      } else {
        $('hints').innerHTML += '<div>Команды решения:<pre class="mini">' +
          les.solution.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</pre>Наберите их руками, не копируйте.</div>';
      }
    };

    $('btn-prev').onclick = function () { go(state.idx - 1); };
    $('btn-next').onclick = function () { go(state.idx + 1); };
    $('wt-main').onclick = function () { setWorkTab('main'); };
    $('wt-cheat').onclick = function () { setWorkTab('cheat'); };
    $('btn-exam').onclick = openExam;
    $('btn-review').onclick = openReview;
    $('btn-reveal').onclick = function () {
      $('pane-mid').classList.remove('review-active');
      $('btn-reveal').disabled = true;
      $('btn-reveal').textContent = 'Теория открыта';
    };
    $('btn-review-exit').onclick = function () {
      reviewMode = false;
      renderLesson();
    };
    $('btn-menu').onclick = function () { $('sidebar').classList.toggle('open'); };
    $('m-theory').onclick = function () {
      $('pane-mid').classList.add('show'); $('pane-work').classList.remove('show');
      $('m-theory').classList.add('active'); $('m-work').classList.remove('active');
    };
    $('m-work').onclick = function () {
      $('pane-work').classList.add('show'); $('pane-mid').classList.remove('show');
      $('m-work').classList.add('active'); $('m-theory').classList.remove('active');
    };

    $('btn-theme').onclick = function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      if (cur === 'dark') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', 'light');
      try { localStorage.setItem('qa-course-theme', cur); } catch (e) {}
    };

    $('btn-reset').onclick = function () {
      if (!confirm('Сбросить весь прогресс и написанный код?')) return;
      state.done = {}; state.xp = 0; state.quizDone = {}; state.code = {};
      state.attempts = {}; state.reviews = {}; state.idx = 0; reviewMode = false;
      save();
      renderSidebar(); renderProgress(); renderLesson();
    };

    document.addEventListener('keydown', function (e) {
      if (e.altKey && e.key === 'ArrowRight') go(state.idx + 1);
      if (e.altKey && e.key === 'ArrowLeft') go(state.idx - 1);
    });

    buildKeys('term-keys', SHELL_KEYS, function (t) { insertIntoInput($('term-input'), t); });
    buildKeys('py-keys', PY_KEYS, function (t) { insertIntoInput($('editor'), t); });

    renderSidebar();
    renderProgress();
    renderLesson();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
