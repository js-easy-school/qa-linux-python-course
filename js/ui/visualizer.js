/* Живая учебная схема: связывает команды и Python-код с состоянием стенда. */
(function (root) {
  'use strict';

  var SCENES = {
    linux: {
      label: 'Linux · выполнение команды',
      nodes: [
        { id: 'terminal', x: 18, y: 116, w: 108, h: 58, title: 'Терминал', sub: 'qa@core-node' },
        { id: 'shell', x: 154, y: 116, w: 108, h: 58, title: 'Shell', sub: 'разбор команды' },
        { id: 'tools', x: 302, y: 28, w: 112, h: 58, title: 'Утилита', sub: 'grep · awk · sed' },
        { id: 'fs', x: 302, y: 202, w: 112, h: 58, title: 'Файлы', sub: '/etc · /var/log' },
        { id: 'systemd', x: 454, y: 28, w: 112, h: 58, title: 'systemd', sub: 'управление службой' },
        { id: 'process', x: 454, y: 116, w: 112, h: 58, title: 'Процесс', sub: 'core-registrar' },
        { id: 'network', x: 646, y: 78, w: 128, h: 58, title: 'Сеть / сокет', sub: 'TCP · UDP · SCTP' },
        { id: 'database', x: 646, y: 202, w: 128, h: 58, title: 'База данных', sub: 'db.core.local' }
      ],
      paths: [
        { id: 'terminal-shell', from: [126, 145], to: [154, 145], label: '' },
        { id: 'shell-tools', from: [262, 134], to: [302, 68], label: 'pipe' },
        { id: 'shell-fs', from: [262, 158], to: [302, 222], label: 'read' },
        { id: 'shell-systemd', from: [262, 126], to: [454, 58], label: 'D-Bus' },
        { id: 'shell-process', from: [262, 145], to: [454, 145], label: 'PID' },
        { id: 'shell-network', from: [262, 145], to: [646, 107], label: 'request' },
        { id: 'systemd-process', from: [510, 86], to: [510, 116], label: '' },
        { id: 'process-network', from: [566, 137], to: [646, 113], label: 'socket' },
        { id: 'process-database', from: [566, 158], to: [646, 223], label: 'SQL' },
        { id: 'process-fs', from: [454, 158], to: [414, 222], label: 'log' },
        { id: 'tools-terminal', from: [302, 52], to: [126, 128], label: 'stdout', curve: -34 }
      ]
    },

    python: {
      label: 'Python · поток данных',
      nodes: [
        { id: 'code', x: 22, y: 116, w: 112, h: 58, title: 'Ваш код', sub: 'редактор' },
        { id: 'runtime', x: 166, y: 116, w: 120, h: 58, title: 'Python', sub: 'выполнение строк' },
        { id: 'data', x: 330, y: 28, w: 120, h: 58, title: 'Данные', sub: 'строки · списки' },
        { id: 'api', x: 330, y: 202, w: 120, h: 58, title: 'Linux / API', sub: 'файл · HTTP' },
        { id: 'assertion', x: 500, y: 28, w: 120, h: 58, title: 'Проверка', sub: 'assert · pytest' },
        { id: 'output', x: 500, y: 202, w: 120, h: 58, title: 'Результат', sub: 'stdout · response' },
        { id: 'report', x: 674, y: 116, w: 120, h: 58, title: 'Отчёт', sub: 'pass · fail · error' }
      ],
      paths: [
        { id: 'code-runtime', from: [134, 145], to: [166, 145], label: 'run' },
        { id: 'runtime-data', from: [286, 132], to: [330, 68], label: 'value' },
        { id: 'runtime-api', from: [286, 158], to: [330, 222], label: 'call' },
        { id: 'runtime-output', from: [286, 145], to: [500, 223], label: 'print', curve: 28 },
        { id: 'runtime-assertion', from: [286, 132], to: [500, 58], label: 'actual' },
        { id: 'data-assertion', from: [450, 57], to: [500, 57], label: 'expected' },
        { id: 'api-output', from: [450, 231], to: [500, 231], label: 'response' },
        { id: 'assertion-report', from: [620, 57], to: [674, 129], label: 'result' },
        { id: 'output-report', from: [620, 231], to: [674, 161], label: 'evidence' }
      ]
    },

    fiveg: {
      label: '5G SA · маршрут сигнала и данных',
      nodes: [
        { id: 'qa', x: 18, y: 116, w: 102, h: 58, title: 'QA / pytest', sub: 'команда · тест' },
        { id: 'compose', x: 146, y: 24, w: 106, h: 58, title: 'Compose', sub: '14 контейнеров' },
        { id: 'ue', x: 146, y: 202, w: 106, h: 58, title: 'UE', sub: 'эмулятор телефона' },
        { id: 'gnb', x: 286, y: 202, w: 106, h: 58, title: 'gNB', sub: 'базовая станция' },
        { id: 'amf', x: 426, y: 116, w: 106, h: 58, title: 'AMF', sub: 'регистрация UE' },
        { id: 'auth', x: 426, y: 24, w: 106, h: 58, title: 'AUSF / UDM', sub: 'ключи и профиль' },
        { id: 'nrf', x: 566, y: 24, w: 106, h: 58, title: 'NRF', sub: 'реестр функций' },
        { id: 'smf', x: 566, y: 116, w: 106, h: 58, title: 'SMF', sub: 'PDU-сессия' },
        { id: 'upf', x: 566, y: 202, w: 106, h: 58, title: 'UPF', sub: 'user plane' },
        { id: 'mongo', x: 706, y: 24, w: 96, h: 58, title: 'MongoDB', sub: 'абоненты' },
        { id: 'internet', x: 706, y: 202, w: 96, h: 58, title: 'Data net', sub: '10.45.0.1' }
      ],
      paths: [
        { id: 'qa-compose', from: [120, 132], to: [146, 64], label: 'docker' },
        { id: 'qa-ue', from: [120, 160], to: [146, 222], label: 'nr-cli' },
        { id: 'qa-amf', from: [120, 145], to: [426, 145], label: 'logs', curve: -22 },
        { id: 'qa-nrf', from: [120, 126], to: [566, 54], label: 'HTTP/2', curve: -42 },
        { id: 'qa-mongo', from: [120, 122], to: [706, 54], label: 'mongosh', curve: -62 },
        { id: 'ue-gnb', from: [252, 231], to: [286, 231], label: 'RLS' },
        { id: 'gnb-amf', from: [392, 218], to: [426, 158], label: 'NGAP · SCTP' },
        { id: 'amf-auth', from: [479, 116], to: [479, 82], label: 'auth' },
        { id: 'auth-mongo', from: [532, 53], to: [706, 53], label: 'profile' },
        { id: 'amf-nrf', from: [532, 132], to: [566, 67], label: 'SBI' },
        { id: 'amf-smf', from: [532, 145], to: [566, 145], label: 'N11' },
        { id: 'smf-upf', from: [619, 174], to: [619, 202], label: 'PFCP 8805' },
        { id: 'gnb-upf', from: [392, 231], to: [566, 231], label: 'GTP-U 2152' },
        { id: 'upf-internet', from: [672, 231], to: [706, 231], label: 'IP' },
        { id: 'compose-ue', from: [199, 82], to: [199, 202], label: '' },
        { id: 'compose-amf', from: [252, 53], to: [426, 132], label: 'start', curve: 24 },
        { id: 'compose-core', from: [252, 47], to: [566, 47], label: 'start' }
      ]
    }
  };

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function stripHtml(text) {
    var div = document.createElement('div');
    div.innerHTML = String(text || '');
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function pathD(path) {
    var x1 = path.from[0], y1 = path.from[1], x2 = path.to[0], y2 = path.to[1];
    if (!path.curve) return 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2;
    var cx = (x1 + x2) / 2;
    var cy = (y1 + y2) / 2 + path.curve;
    return 'M ' + x1 + ' ' + y1 + ' Q ' + cx + ' ' + cy + ' ' + x2 + ' ' + y2;
  }

  function Visualizer(opts) {
    this.panel = opts.panel;
    this.stage = opts.stage;
    this.sceneLabel = opts.sceneLabel;
    this.eventTitle = opts.eventTitle;
    this.summary = opts.summary;
    this.steps = opts.steps;
    this.badge = opts.badge;
    this.toggle = opts.toggle;
    this.replay = opts.replay;
    this.sceneName = null;
    this.lesson = null;
    this.session = null;
    this.lastEvent = null;
    this.flowTimer = null;
    this.bind();
  }

  Visualizer.prototype.bind = function () {
    var self = this;
    this.toggle.addEventListener('click', function () {
      self.panel.classList.toggle('collapsed');
      var collapsed = self.panel.classList.contains('collapsed');
      self.toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      self.toggle.textContent = collapsed ? 'Развернуть' : 'Свернуть';
      try { localStorage.setItem('qa-course-viz-collapsed', collapsed ? '1' : '0'); } catch (e) {}
    });
    this.replay.addEventListener('click', function () {
      if (self.lastEvent) self.showEvent(self.lastEvent, false, true);
    });
    try {
      if (localStorage.getItem('qa-course-viz-collapsed') === '1') {
        this.panel.classList.add('collapsed');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.toggle.textContent = 'Развернуть';
      }
    } catch (e) {}
  };

  Visualizer.prototype.attach = function (session, lesson) {
    this.session = session;
    this.lesson = lesson;
    var scene = this.sceneFor(lesson);
    this.renderScene(scene);
    this.updateStatuses();
    this.showEvent({
      title: 'Схема готова — введите команду',
      summary: stripHtml(lesson.task) || 'Выполните задание и проследите маршрут действия.',
      nodes: scene === 'fiveg' ? ['qa'] : (scene === 'python' ? ['code'] : ['terminal']),
      paths: [],
      status: 'idle',
      steps: [
        { name: 'До запуска', detail: 'Жёлтый маршрут появится уже во время набора.' },
        { name: 'После Enter', detail: 'Путь начнёт двигаться, а индикаторы покажут результат.' }
      ]
    }, false);
  };

  Visualizer.prototype.sceneFor = function (lesson) {
    if (lesson.day >= 5) return 'fiveg';
    if (lesson.mode === 'python') return 'python';
    return 'linux';
  };

  Visualizer.prototype.renderScene = function (name) {
    this.sceneName = name;
    var scene = SCENES[name];
    this.sceneLabel.textContent = scene.label;
    var html = '<svg class="viz-svg" viewBox="0 0 820 288" role="img" aria-label="' + esc(scene.label) + '">' +
      '<defs><marker id="viz-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>';

    scene.paths.forEach(function (path) {
      var lx = (path.from[0] + path.to[0]) / 2;
      var ly = (path.from[1] + path.to[1]) / 2 + (path.curve ? path.curve * 0.55 : -7);
      html += '<path class="viz-link" data-path="' + path.id + '" d="' + pathD(path) + '" marker-end="url(#viz-arrow)"></path>';
      if (path.label) html += '<text class="viz-link-label" x="' + lx + '" y="' + ly + '">' + esc(path.label) + '</text>';
    });

    scene.nodes.forEach(function (node) {
      html += '<g class="viz-node" data-node="' + node.id + '" transform="translate(' + node.x + ' ' + node.y + ')">' +
        '<rect width="' + node.w + '" height="' + node.h + '" rx="8"></rect>' +
        '<circle class="viz-lamp" cx="14" cy="14" r="4"></circle>' +
        '<text class="viz-node-title" x="12" y="32">' + esc(node.title) + '</text>' +
        '<text class="viz-node-sub" x="12" y="48">' + esc(node.sub) + '</text></g>';
    });
    html += '</svg>';
    this.stage.innerHTML = html;
  };

  Visualizer.prototype.updateStatuses = function () {
    var st = this.session && this.session.stand;
    var statuses = {};
    if (!st) return;

    if (this.sceneName === 'linux') {
      var svc = st.services && st.services['core-registrar'];
      var sock = st.sockets && st.sockets.some(function (s) { return s.prog === 'registrar'; });
      statuses = {
        terminal: 'up', shell: 'up', tools: 'up', fs: 'up', systemd: 'up',
        process: svc && svc.active ? 'up' : 'down',
        network: sock ? 'up' : 'warn', database: st.dbUp ? 'up' : 'down'
      };
    } else if (this.sceneName === 'python') {
      statuses = { code: 'up', runtime: 'up', data: 'up', api: 'up', assertion: 'idle', output: 'idle', report: 'idle' };
    } else {
      var f = st.fiveg || {};
      var down = f.down || [];
      function serviceStatus() {
        for (var i = 0; i < arguments.length; i++) if (down.indexOf(arguments[i]) >= 0) return 'down';
        return 'up';
      }
      statuses = {
        qa: 'up', compose: down.length ? 'warn' : 'up',
        ue: f.ueState === 'RM-REGISTERED' ? 'up' : 'down',
        gnb: f.gnbConnected ? 'up' : 'down', amf: serviceStatus('amf'),
        auth: (!f.authOk || serviceStatus('ausf', 'udm') === 'down') ? 'down' : 'up',
        nrf: serviceStatus('nrf'), smf: serviceStatus('smf'), upf: serviceStatus('upf'),
        mongo: serviceStatus('mongo'), internet: f.userPlane ? 'up' : 'down'
      };
    }

    Object.keys(statuses).forEach(function (id) {
      var node = this.stage.querySelector('[data-node="' + id + '"]');
      if (!node) return;
      node.classList.remove('status-up', 'status-down', 'status-warn', 'status-idle');
      node.classList.add('status-' + statuses[id]);
    }, this);
  };

  Visualizer.prototype.preview = function (line) {
    if (!line || !line.trim()) {
      if (this.lastEvent) this.showEvent(this.lastEvent, false);
      return;
    }
    var event = this.commandEvent(line, null);
    event.title = 'После Enter: ' + event.title;
    event.status = 'preview';
    event.summary = 'Предпросмотр маршрута. Команда ещё не выполнена и состояние стенда не изменилось.';
    this.showEvent(event, true);
  };

  Visualizer.prototype.handleCommand = function (line, result) {
    var wantedScene = this.sceneFor(this.lesson);
    if (wantedScene !== this.sceneName) this.renderScene(wantedScene);
    this.updateStatuses();
    var event = this.commandEvent(line, result || { code: 0 });
    this.lastEvent = event;
    this.showEvent(event, false);
  };

  Visualizer.prototype.handlePython = function (code, result, withTests) {
    if (this.sceneName !== 'python') this.renderScene('python');
    this.updateStatuses();
    var hasError = !!(result && result.error);
    var usesApi = /requests\s*\.|urlopen|subprocess|http:\/\//i.test(code);
    var usesFile = /open\s*\(|read\s*\(|registrar\.log/i.test(code);
    var usesTest = withTests || /pytest|assert\s|def\s+test_/i.test(code);
    var paths = ['code-runtime'];
    var nodes = ['code', 'runtime'];
    var steps = [{ name: 'Python читает код', detail: 'Интерпретатор выполняет инструкции сверху вниз.' }];

    if (usesApi || usesFile) {
      paths.push('runtime-api', 'api-output');
      nodes.push('api', 'output');
      steps.push({ name: usesApi ? 'Внешний запрос' : 'Чтение файла', detail: usesApi ? 'Код обращается к сервису и получает response.' : 'Код получает данные из файловой системы.' });
    } else {
      paths.push('runtime-data', 'runtime-output');
      nodes.push('data', 'output');
      steps.push({ name: 'Обработка данных', detail: 'Переменные и коллекции преобразуются в результат.' });
    }
    if (usesTest) {
      paths.push('runtime-assertion', 'data-assertion', 'assertion-report');
      nodes.push('assertion', 'report');
      steps.push({ name: 'Сравнение', detail: 'pytest сопоставляет фактическое значение с ожидаемым.' });
    } else {
      paths.push('output-report');
      nodes.push('report');
    }
    steps.push({ name: hasError ? 'Ошибка выполнения' : 'Результат готов', detail: hasError ? 'Красный узел показывает место, на котором выполнение остановилось.' : 'Вывод и диагностические данные доступны для проверки.' });

    var event = {
      title: withTests ? 'pytest выполняет проверки' : 'Python выполняет программу',
      summary: hasError ? 'Код завершился с ошибкой: проследите путь до красного узла.' : 'Код выполнен; схема показывает, откуда пришли данные и куда ушёл результат.',
      nodes: nodes, paths: paths, status: hasError ? 'error' : 'success', steps: steps,
      errorNode: hasError ? 'runtime' : null
    };
    this.lastEvent = event;
    this.showEvent(event, false);
  };

  Visualizer.prototype.commandEvent = function (line, result) {
    if (this.sceneName === 'fiveg') return fivegEvent(line, result, this.session && this.session.stand, this.lesson);
    return linuxEvent(line, result, this.session && this.session.stand);
  };

  Visualizer.prototype.showEvent = function (event, preview, replay) {
    clearTimeout(this.flowTimer);
    this.stage.querySelectorAll('.viz-link').forEach(function (el) {
      el.classList.remove('flow-active', 'flow-preview', 'flow-error', 'flow-seen');
    });
    this.stage.querySelectorAll('.viz-node').forEach(function (el) {
      el.classList.remove('node-active', 'node-preview', 'node-error');
    });

    (event.paths || []).forEach(function (id) {
      var el = this.stage.querySelector('[data-path="' + id + '"]');
      if (!el) return;
      el.classList.add(preview ? 'flow-preview' : (event.status === 'error' ? 'flow-error' : 'flow-active'));
      if (replay) { el.classList.remove('flow-active'); void el.getBoundingClientRect(); el.classList.add('flow-active'); }
    }, this);
    (event.nodes || []).forEach(function (id) {
      var el = this.stage.querySelector('[data-node="' + id + '"]');
      if (el) el.classList.add(preview ? 'node-preview' : 'node-active');
    }, this);
    if (event.errorNode) {
      var bad = this.stage.querySelector('[data-node="' + event.errorNode + '"]');
      if (bad) bad.classList.add('node-error');
    }

    this.eventTitle.textContent = event.title;
    this.summary.textContent = event.summary;
    this.badge.className = 'viz-badge ' + (event.status || 'idle');
    this.badge.textContent = event.status === 'success' ? 'успех' : event.status === 'error' ? 'ошибка' : event.status === 'preview' ? 'до запуска' : 'ожидание';
    this.steps.innerHTML = '';
    (event.steps || []).forEach(function (step, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + (i + 1) + '</span><div><b>' + esc(step.name) + '</b><small>' + esc(step.detail) + '</small></div>';
      this.steps.appendChild(li);
    }, this);

    if (!preview && event.paths && event.paths.length) {
      var self = this;
      this.flowTimer = setTimeout(function () {
        self.stage.querySelectorAll('.flow-active').forEach(function (el) {
          el.classList.remove('flow-active'); el.classList.add('flow-seen');
        });
      }, 4200);
    }
  };

  Visualizer.prototype.setVisible = function (visible) {
    this.panel.hidden = !visible;
  };

  function resultStatus(result) {
    if (!result) return 'preview';
    return result.code === 0 ? 'success' : 'error';
  }

  function linuxEvent(line, result, st) {
    var cmd = String(line || '').trim();
    var low = cmd.toLowerCase();
    var status = resultStatus(result);
    var error = status === 'error';
    var event = {
      title: 'Shell разбирает и запускает команду',
      summary: error ? 'Команда завершилась с ненулевым кодом. Красный маршрут показывает место проверки.' : 'Shell нашёл программу, передал ей аргументы и вернул вывод в терминал.',
      nodes: ['terminal', 'shell'], paths: ['terminal-shell'], status: status,
      steps: [
        { name: 'Ввод', detail: 'Терминал передаёт строку командной оболочке.' },
        { name: 'Разбор', detail: 'Shell выделяет имя команды, флаги, пути и операторы.' },
        { name: error ? 'Код возврата не равен нулю' : 'Код возврата 0', detail: error ? 'Команда сообщает об ошибке — изучите stderr.' : 'Результат возвращается в stdout.' }
      ],
      errorNode: error ? 'shell' : null
    };

    if (/\b(cd|ls|find|cat|head|tail|less|du|stat|mkdir|touch|rm|cp|mv)\b/.test(low)) {
      event.title = /\b(cd|ls|find)\b/.test(low) ? 'Shell обращается к файловой системе' : 'Команда читает или изменяет файл';
      event.nodes.push('fs'); event.paths.push('shell-fs');
      event.steps[1] = { name: 'Путь', detail: 'Linux преобразует относительный или абсолютный путь в объект файловой системы.' };
      event.steps.splice(2, 0, { name: /tail|cat|head|less/.test(low) ? 'Чтение' : 'Операция', detail: /var\/log/.test(low) ? 'Содержимое журнала читается с диска.' : 'Ядро проверяет существование объекта и права доступа.' });
      if (/var\/log/.test(low)) { event.nodes.push('process'); event.paths.push('process-fs'); }
    }
    if (/\b(grep|awk|sed|cut|sort|uniq|wc)\b/.test(low)) {
      event.title = 'Поток проходит через текстовый фильтр';
      event.nodes.push('tools', 'fs'); event.paths.push('shell-fs', 'shell-tools', 'tools-terminal');
      event.steps = [
        { name: 'Источник', detail: 'Файл или предыдущая команда отдаёт строки в stdout.' },
        { name: 'Pipe', detail: 'Символ | передаёт поток следующей программе без временного файла.' },
        { name: 'Фильтр', detail: 'grep/awk/sed выбирает или преобразует строки.' },
        { name: 'Результат', detail: 'Отфильтрованный поток возвращается в терминал.' }
      ];
    }
    if (/\b(systemctl|journalctl)\b/.test(low)) {
      event.title = /journalctl/.test(low) ? 'journalctl читает журнал службы' : 'systemd проверяет состояние службы';
      event.nodes.push('systemd', 'process'); event.paths.push('shell-systemd', 'systemd-process');
      if (/journalctl/.test(low)) { event.nodes.push('fs'); event.paths.push('process-fs'); }
      event.steps = [
        { name: 'Запрос к systemd', detail: 'Shell обращается к менеджеру служб.' },
        { name: 'Состояние процесса', detail: 'systemd сопоставляет unit, PID и последнюю причину изменения.' },
        { name: 'Доказательство', detail: 'Статус или журнал возвращается в терминал.' }
      ];
      if (st && st.services && !st.services['core-registrar'].active) event.errorNode = 'process';
    } else if (/\b(ps|pgrep|top|kill|pkill)\b/.test(low)) {
      event.title = 'Команда работает с таблицей процессов';
      event.nodes.push('process'); event.paths.push('shell-process');
      event.steps[1] = { name: 'Таблица процессов', detail: 'Linux показывает PID, владельца, ресурсы и командную строку.' };
    }
    if (/\b(ss|netstat|lsof)\b/.test(low)) {
      event.title = 'Linux показывает открытые сокеты';
      event.nodes.push('network', 'process'); event.paths.push('shell-network', 'process-network');
      event.steps = [
        { name: 'Запрос', detail: 'Утилита читает таблицу сетевых сокетов ядра.' },
        { name: 'Связь с PID', detail: 'Порт сопоставляется с процессом, который его открыл.' },
        { name: 'Вывод', detail: 'Протокол, адрес, порт и состояние возвращаются QA.' }
      ];
    }
    if (/\b(curl|wget)\b/.test(low)) {
      event.title = 'HTTP-запрос проходит к сервису';
      event.nodes = ['terminal', 'shell', 'network', 'process'];
      event.paths = ['terminal-shell', 'shell-network', 'process-network'];
      event.steps = [
        { name: 'Клиент', detail: 'curl разбирает URL, метод, заголовки и тело.' },
        { name: 'Соединение', detail: 'Запрос идёт на адрес и порт через сетевой сокет.' },
        { name: 'Сервис', detail: 'Процесс обрабатывает запрос и при необходимости обращается к базе.' },
        { name: 'Ответ', detail: 'HTTP-код и тело возвращаются в терминал.' }
      ];
      if (st && st.dbUp) { event.nodes.push('database'); event.paths.push('process-database'); }
      if (error) event.errorNode = st && !st.dbUp ? 'database' : 'network';
    }
    if (/\b(ping|dig|nslookup|ip\s+(addr|route)|traceroute)\b/.test(low)) {
      event.title = 'Команда проверяет сетевой путь';
      event.nodes.push('network'); event.paths.push('shell-network');
      event.steps[1] = { name: 'Сетевой слой', detail: /dig|nslookup/.test(low) ? 'DNS преобразует имя в IP-адрес.' : 'Ядро выбирает интерфейс и маршрут до назначения.' };
      if (error) event.errorNode = 'network';
    }
    return event;
  }

  function fivegEvent(line, result, st, lesson) {
    var cmd = String(line || '').trim();
    var low = cmd.toLowerCase();
    var status = resultStatus(result);
    var error = status === 'error';
    var scenario = lesson && lesson.scenario;
    var event = {
      title: 'QA обращается к 5G-стенду',
      summary: error ? 'Команда не выполнилась успешно. Красный узел помогает локализовать слой отказа.' : 'Команда получила диагностические данные от стенда.',
      nodes: ['qa'], paths: [], status: status,
      steps: [{ name: 'Команда QA', detail: 'Вы выбираете наблюдаемое состояние, а не делаете вывод наугад.' }],
      errorNode: null
    };

    if (/docker\s+compose\s+config/.test(low)) {
      event.title = 'Compose строит итоговую модель стенда';
      event.nodes = ['qa', 'compose', 'ue', 'gnb', 'amf', 'auth', 'nrf', 'smf', 'upf'];
      event.paths = ['qa-compose', 'compose-ue', 'compose-amf', 'compose-core'];
      event.steps = [
        { name: 'Чтение YAML', detail: 'Compose объединяет файл, переменные и значения по умолчанию.' },
        { name: 'Проверка модели', detail: 'Сервисы, сети, volumes и образы валидируются до сборки.' },
        { name: 'Результат', detail: 'Корректная модель ещё не доказывает, что контейнеры запустятся.' }
      ];
    } else if (/docker\s+compose\s+ps/.test(low)) {
      event.title = 'Compose опрашивает состояния контейнеров';
      event.nodes = ['qa', 'compose', 'ue', 'gnb', 'amf', 'auth', 'nrf', 'smf', 'upf', 'mongo'];
      event.paths = ['qa-compose', 'compose-ue', 'compose-amf', 'compose-core'];
      event.steps = [
        { name: 'Docker Engine', detail: 'Compose получает состояние каждого контейнера.' },
        { name: 'Сравнение', detail: 'QA ищет exited, restarting и отсутствующие сервисы.' },
        { name: 'Следующий шаг', detail: 'Для проблемного контейнера нужны inspect и logs.' }
      ];
      if (st && st.fiveg && st.fiveg.down.length) event.errorNode = st.fiveg.down.indexOf('udm') >= 0 ? 'auth' : st.fiveg.down[0];
    } else if (/docker\s+inspect/.test(low)) {
      var target = /udm/.test(low) ? 'auth' : /upf/.test(low) ? 'upf' : /amf/.test(low) ? 'amf' : 'compose';
      event.title = 'Docker раскрывает фактическое состояние контейнера';
      event.nodes = ['qa', 'compose', target]; event.paths = ['qa-compose'];
      event.steps = [
        { name: 'Inspect', detail: 'Docker возвращает State, ExitCode, mounts и сетевые параметры.' },
        { name: 'Факт', detail: 'ExitCode показывает итог процесса, но причина обычно находится в logs.' }
      ];
      if (scenario === 'nf-missing') event.errorNode = 'auth';
    } else if (/docker\s+compose\s+logs/.test(low)) {
      event.title = 'QA сопоставляет журналы сетевых функций';
      event.nodes = ['qa']; event.paths = [];
      if (/gnb/.test(low)) { event.nodes.push('gnb'); event.paths.push('gnb-amf'); }
      if (/amf/.test(low)) { event.nodes.push('amf'); event.paths.push('qa-amf'); }
      if (/smf/.test(low)) { event.nodes.push('smf'); event.paths.push('amf-smf'); }
      if (/upf/.test(low)) { event.nodes.push('upf'); event.paths.push('smf-upf'); }
      if (/udm|ausf/.test(low)) { event.nodes.push('auth'); event.paths.push('amf-auth'); }
      if (/ue/.test(low)) { event.nodes.push('ue'); event.paths.push('qa-ue'); }
      event.steps = [
        { name: 'Временная линия', detail: 'Логи разных компонентов читаются как одна цепочка событий.' },
        { name: 'Причина и следствие', detail: 'Сначала ищется точный cause, затем итоговое состояние UE/PDU.' }
      ];
      if (/auth|failure/.test(String(scenario))) event.errorNode = 'auth';
      else if (/ngap/.test(String(scenario))) event.errorNode = 'gnb';
      else if (/upf/.test(String(scenario))) event.errorNode = 'upf';
    } else if (/nnrf-nfm|\bnrf\b/.test(low) && /curl/.test(low)) {
      event.title = 'HTTP/2-запрос идёт в реестр NRF';
      event.nodes = ['qa', 'nrf']; event.paths = ['qa-nrf'];
      event.steps = [
        { name: 'SBI-запрос', detail: 'curl отправляет HTTP/2-запрос на сервисный интерфейс NRF.' },
        { name: 'Registry', detail: 'NRF возвращает зарегистрированные типы и instances сетевых функций.' },
        { name: 'Проверка', detail: 'AMF, SMF и AUSF должны присутствовать в реестре.' }
      ];
      if (error) event.errorNode = 'nrf';
    } else if (/\bss\b/.test(low) && /sctp|38412/.test(low)) {
      event.title = 'Проверяется N2: gNB → AMF';
      event.nodes = ['qa', 'gnb', 'amf']; event.paths = ['gnb-amf', 'qa-amf'];
      event.steps = [
        { name: 'SCTP listener', detail: 'AMF должен слушать порт 38412.' },
        { name: 'NGAP', detail: 'gNB устанавливает сигнальное соединение с правильным IP AMF.' }
      ];
      if (scenario === 'ngap-mismatch') event.errorNode = 'gnb';
    } else if (/\bss\b/.test(low) && /8805|2152/.test(low)) {
      event.title = 'Проверяются PFCP и GTP-U сокеты UPF';
      event.nodes = ['qa', 'gnb', 'smf', 'upf']; event.paths = ['smf-upf', 'gnb-upf'];
      event.steps = [
        { name: 'PFCP 8805', detail: 'SMF управляет правилами сессии на UPF.' },
        { name: 'GTP-U 2152', detail: 'Пользовательский трафик идёт между gNB и UPF.' }
      ];
    } else if (/nr-cli/.test(low) && /status/.test(low)) {
      event.title = 'UE сообщает состояние регистрации';
      event.nodes = ['qa', 'ue', 'gnb', 'amf', 'auth']; event.paths = ['qa-ue', 'ue-gnb', 'gnb-amf', 'amf-auth'];
      event.steps = [
        { name: 'UE', detail: 'nr-cli читает фактическое состояние эмулятора абонента.' },
        { name: 'RAN', detail: 'UE проходит через gNB к AMF по NGAP/SCTP.' },
        { name: 'Регистрация', detail: 'RM-REGISTERED и CM-CONNECTED подтверждают успешный control plane.' }
      ];
      if (st && st.fiveg && st.fiveg.ueState !== 'RM-REGISTERED') event.errorNode = scenario === 'auth-failure' ? 'auth' : 'amf';
    } else if (/nr-cli/.test(low) && /ps-list/.test(low)) {
      event.title = 'Проверяется PDU-сессия и путь данных';
      event.nodes = ['qa', 'ue', 'amf', 'smf', 'upf', 'internet'];
      event.paths = ['qa-ue', 'amf-smf', 'smf-upf', 'upf-internet'];
      event.steps = [
        { name: 'Session state', detail: 'PS-ACTIVE означает, что PDU-сессия создана.' },
        { name: 'Адрес', detail: 'SMF выделяет UE адрес из пула 10.45.0.0/16.' },
        { name: 'User plane', detail: 'UPF передаёт IP-трафик в data network.' }
      ];
      if (st && st.fiveg && st.fiveg.pduState !== 'PS-ACTIVE') event.errorNode = 'upf';
    } else if (/mongosh|subscribers/.test(low)) {
      event.title = 'Проверяется профиль абонента в MongoDB';
      event.nodes = ['qa', 'mongo', 'auth']; event.paths = ['qa-mongo', 'auth-mongo'];
      event.steps = [
        { name: 'Тестовые данные', detail: 'IMSI связывается с ключами, slice и DNN.' },
        { name: 'Аутентификация', detail: 'UDM/AUSF используют профиль при регистрации UE.' }
      ];
    } else if (/tcpdump/.test(low) && /2152/.test(low)) {
      event.title = 'tcpdump наблюдает GTP-U user plane';
      event.nodes = ['qa', 'gnb', 'upf', 'internet']; event.paths = ['gnb-upf', 'upf-internet'];
      event.steps = [
        { name: 'Захват', detail: 'Фильтр оставляет UDP-пакеты порта 2152.' },
        { name: 'Туннель', detail: 'Внешние адреса показывают обмен gNB ↔ UPF.' },
        { name: 'Полезная нагрузка', detail: 'Внутри GTP-U переносится IP-трафик UE.' }
      ];
    } else if (/\bpytest\b/.test(low)) {
      event.title = /collect-only/.test(low) ? 'pytest собирает тестовые сценарии' : 'pytest проверяет цепочку 5G end-to-end';
      event.nodes = ['qa', 'ue', 'gnb', 'amf', 'auth', 'nrf', 'smf', 'upf', 'internet'];
      event.paths = /collect-only/.test(low) ? [] : ['qa-ue', 'ue-gnb', 'gnb-amf', 'amf-auth', 'amf-nrf', 'amf-smf', 'smf-upf', 'gnb-upf', 'upf-internet'];
      event.steps = /collect-only/.test(low) ? [
        { name: 'Discovery', detail: 'pytest импортирует модули и связывает Gherkin scenarios с step definitions.' },
        { name: 'Без выполнения', detail: 'collect-only подтверждает структуру набора, но не работоспособность сети.' }
      ] : [
        { name: 'Control plane', detail: 'Проверяются NF, регистрация UE и аутентификация.' },
        { name: 'Session', detail: 'Проверяются PDU-сессия, адрес и правила UPF.' },
        { name: 'User plane', detail: 'Проверяется прохождение трафика и отсутствие фатальных ошибок.' },
        { name: 'Отчёт', detail: 'JUnit/HTML и логи сохраняют доказательства результата.' }
      ];
    } else {
      event.nodes.push('compose'); event.paths.push('qa-compose');
      event.steps.push({ name: 'Стенд', detail: 'Команда читает состояние контейнеров или запускает диагностическую утилиту.' });
    }

    if (error && !event.errorNode) event.errorNode = event.nodes[event.nodes.length - 1];
    return event;
  }

  root.CourseVisualizer = Visualizer;
})(typeof window !== 'undefined' ? window : globalThis);
