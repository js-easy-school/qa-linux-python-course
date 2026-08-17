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
    code: {}          // сохранённый код по урокам
  };

  var session = null;   // текущая сессия консоли
  var lastPy = null;    // последний запуск Python
  var term, editor;

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
        state.idx = typeof d.idx === 'number' ? Math.min(d.idx, L.length - 1) : 0;
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
      el.onclick = function () { go(i); if (window.innerWidth <= 1150) $('sidebar').classList.remove('open'); };
      box.appendChild(el);
    });
  }

  var DAY_TITLES = {
    1: 'Linux: файлы, логи, поиск',
    2: 'Linux: процессы, службы, сеть',
    3: 'Python: основа руками',
    4: 'Python: тесты API и pytest'
  };

  function renderProgress() {
    var done = Object.keys(state.done).length;
    $('bar-fill').style.width = (L.length ? done / L.length * 100 : 0) + '%';
    $('prog-label').textContent = done + ' из ' + L.length;
    $('xp').textContent = state.xp;
  }

  /* ─────────── урок ─────────── */

  function cur() { return L[state.idx]; }

  function go(i) {
    if (i < 0 || i >= L.length) return;
    state.idx = i;
    save();
    renderSidebar();
    renderLesson();
  }

  function renderLesson() {
    var les = cur();
    $('kicker').textContent = 'День ' + les.day + ' · ' + les.module;
    $('title').textContent = les.title;
    $('goal').textContent = les.goal || '';
    $('theory').innerHTML = les.theory || '';
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
    updateStandLine();
    setWorkTab('main');
    $('pane-mid').scrollTop = 0;
  }

  function updateStandLine() {
    if (!session) return;
    var st = session.stand;
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

    if (res.ok && !state.done[les.id]) {
      state.done[les.id] = true;
      state.xp += 10;
      renderSidebar();
      renderProgress();
      save();
    }
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
    { t: '250010000000001', label: 'IMSI', wide: true }
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
      if (!$('cheat-view').innerHTML) $('cheat-view').innerHTML = window.QACheatsheet || '';
    } else {
      $('shell-view').hidden = les.mode === 'python';
      $('py-view').hidden = les.mode !== 'python';
    }
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

    term = new window.CourseTerminal({
      box: $('term'), out: $('term-out'), input: $('term-input'), prompt: $('term-prompt'),
      onRun: function () { updateStandLine(); }
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
      state.done = {}; state.xp = 0; state.quizDone = {}; state.code = {}; state.idx = 0;
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
