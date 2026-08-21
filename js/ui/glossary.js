/* Контекстный словарь: объясняет выделенные команды и термины без ухода из урока. */
(function (root) {
  'use strict';

  var TERMS = {
    /* Linux */
    'help': ['Linux', 'Показывает доступные команды тренажёра и краткую справку по ним.'],
    'whoami': ['Linux', 'Печатает имя пользователя, от которого сейчас выполняются команды.'],
    'pwd': ['Linux', 'Показывает полный путь к текущему рабочему каталогу.'],
    'ls': ['Linux', 'Показывает файлы и каталоги; флаг -l добавляет права, владельца и размер.'],
    'cd': ['Linux', 'Меняет текущий каталог терминальной сессии.'],
    'cat': ['Linux', 'Читает файл целиком и отправляет его содержимое в стандартный вывод.'],
    'head': ['Linux', 'Показывает первые строки файла или входного потока.'],
    'tail': ['Linux', 'Показывает последние строки; tail -f продолжает следить за растущим логом.'],
    'less': ['Linux', 'Открывает большой текст для постраничного просмотра и поиска.'],
    'grep': ['Linux', 'Фильтрует строки по тексту или регулярному выражению.'],
    'awk': ['Linux', 'Разбирает строки на поля и выполняет над ними небольшую программу.'],
    'sed': ['Linux', 'Поточно ищет, заменяет или выбирает части текста.'],
    'cut': ['Linux', 'Извлекает выбранные столбцы или поля из строк.'],
    'sort': ['Linux', 'Сортирует строки; часто используется перед uniq.'],
    'uniq': ['Linux', 'Убирает или считает соседние повторяющиеся строки.'],
    'wc': ['Linux', 'Считает строки, слова или байты во входном потоке.'],
    'find': ['Linux', 'Рекурсивно ищет файлы по имени, типу, размеру и другим признакам.'],
    'xargs': ['Linux', 'Преобразует строки входного потока в аргументы другой команды.'],
    'tee': ['Linux', 'Одновременно показывает поток в терминале и записывает его в файл.'],
    'chmod': ['Linux', 'Изменяет права чтения, записи и выполнения файла.'],
    'chown': ['Linux', 'Меняет владельца и группу файла или каталога.'],
    'ps': ['Linux', 'Показывает снимок работающих процессов и их PID.'],
    'pgrep': ['Linux', 'Ищет PID процессов по имени или другим признакам.'],
    'top': ['Linux', 'В реальном времени показывает процессы и нагрузку на систему.'],
    'kill': ['Linux', 'Отправляет процессу сигнал; это не всегда означает принудительное завершение.'],
    'systemctl': ['Linux', 'Управляет службами systemd и показывает их текущее состояние.'],
    'journalctl': ['Linux', 'Читает системный журнал и логи служб, которыми управляет systemd.'],
    'ss': ['Сеть', 'Показывает сокеты, адреса, порты, протоколы и связанные процессы.'],
    'ip': ['Сеть', 'Показывает и настраивает интерфейсы, IP-адреса и таблицу маршрутизации.'],
    'ping': ['Сеть', 'Проверяет IP-доступность узла и измеряет время ответа ICMP.'],
    'curl': ['Сеть', 'Отправляет HTTP-запрос и показывает ответ сервиса.'],
    'dig': ['Сеть', 'Запрашивает DNS и помогает проверить преобразование имени в IP-адрес.'],
    'nslookup': ['Сеть', 'Простой инструмент для проверки DNS-записей доменного имени.'],
    'df': ['Linux', 'Показывает занятое и свободное место файловых систем.'],
    'du': ['Linux', 'Считает, сколько места занимают файлы и каталоги.'],
    'free': ['Linux', 'Показывает использование оперативной памяти и swap.'],
    'env': ['Linux', 'Показывает переменные окружения текущего процесса.'],
    'export': ['Linux', 'Создаёт переменную окружения для текущего shell и его дочерних процессов.'],
    'which': ['Linux', 'Показывает, какой исполняемый файл будет запущен по имени команды.'],
    'stdout': ['Linux', 'Стандартный поток нормального вывода программы.'],
    'stderr': ['Linux', 'Отдельный стандартный поток ошибок и диагностических сообщений.'],
    'pipe': ['Linux', 'Канал |, передающий stdout одной команды на stdin следующей.'],
    'stdin': ['Linux', 'Стандартный вход — поток данных, который читает программа.'],
    'pid': ['Linux', 'Уникальный числовой идентификатор работающего процесса.'],
    'systemd': ['Linux', 'Менеджер запуска и контроля системных служб в Linux.'],
    'tun': ['Linux / сеть', 'Виртуальный сетевой интерфейс уровня IP; нужен UPF и UE для пользовательского трафика.'],

    /* Сети */
    'osi': ['Сети', 'Эталонная модель из семи уровней, помогающая локализовать сетевую проблему.'],
    'tcp/ip': ['Сети', 'Набор протоколов, на котором работает современная IP-сеть.'],
    'tcp': ['Сети', 'Надёжный протокол с установлением соединения, контролем доставки и порядка.'],
    'udp': ['Сети', 'Протокол без установления соединения и гарантии доставки; уменьшает накладные расходы.'],
    'sctp': ['Сети / 5G', 'Транспортный протокол N2, по которому gNB передаёт NGAP-сообщения в AMF.'],
    'dns': ['Сети', 'Система, преобразующая имена узлов в IP-адреса.'],
    'socket': ['Сети', 'Точка сетевого обмена: протокол, локальный адрес и порт, иногда удалённый адрес.'],
    'порт': ['Сети', 'Числовой идентификатор сетевой службы внутри узла.'],
    'localhost': ['Сети', 'Имя собственного компьютера; обычно соответствует адресу 127.0.0.1.'],
    'http/2': ['Сети', 'Версия HTTP с бинарными кадрами и несколькими параллельными потоками в одном соединении.'],
    'http': ['Сети', 'Протокол запрос–ответ, используемый веб-сервисами и API.'],
    'api': ['Разработка', 'Определённый интерфейс, через который одна программа обращается к другой.'],
    'client-server': ['Архитектура', 'Клиент отправляет запрос, сервер обрабатывает его и возвращает ответ.'],

    /* Docker и CI */
    'docker': ['Docker', 'Запускает приложение с зависимостями в изолированном контейнере.'],
    'docker compose': ['Docker', 'Описывает и совместно запускает набор связанных контейнеров, сетей и томов.'],
    'container': ['Docker', 'Изолированный процесс приложения, созданный из образа.'],
    'контейнер': ['Docker', 'Изолированный процесс приложения, созданный из образа.'],
    'image': ['Docker', 'Неизменяемый шаблон файлов и настроек, из которого создаётся контейнер.'],
    'образ': ['Docker', 'Неизменяемый шаблон файлов и настроек, из которого создаётся контейнер.'],
    'dockerfile': ['Docker', 'Пошаговая инструкция сборки Docker-образа.'],
    'volume': ['Docker', 'Хранилище данных, живущее отдельно от файловой системы контейнера.'],
    'inspect': ['Docker', 'Возвращает полное фактическое состояние Docker-объекта в JSON.'],
    'ci': ['CI/CD', 'Автоматический запуск проверок при изменении кода.'],
    'pipeline': ['CI/CD', 'Последовательность автоматических стадий: проверка, сборка, тесты и отчёты.'],
    'github actions': ['CI/CD', 'Сервис GitHub для запуска workflow из файлов репозитория.'],
    'gitlab ci': ['CI/CD', 'Система GitLab для выполнения pipeline, описанного в .gitlab-ci.yml.'],
    'yaml': ['Конфигурация', 'Текстовый формат конфигурации, чувствительный к отступам.'],
    'junit': ['Тестирование', 'XML-формат результатов тестов, который понимают CI-системы.'],

    /* Python и тестирование */
    'python': ['Python', 'Скриптовый язык, часто используемый для автоматизации тестирования.'],
    'str': ['Python', 'Тип данных для текста — строки символов.'],
    'int': ['Python', 'Тип данных для целых чисел.'],
    'float': ['Python', 'Тип данных для чисел с дробной частью.'],
    'bool': ['Python', 'Логический тип с двумя значениями: True и False.'],
    'none': ['Python', 'Специальное значение, означающее отсутствие значения.'],
    'list': ['Python', 'Изменяемая упорядоченная коллекция элементов.'],
    'dict': ['Python', 'Коллекция пар ключ–значение.'],
    'def': ['Python', 'Начинает объявление функции.'],
    'return': ['Python', 'Завершает функцию и возвращает результат вызывающему коду.'],
    'try': ['Python', 'Начинает блок, в котором ожидается возможное исключение.'],
    'except': ['Python', 'Обрабатывает исключение определённого типа.'],
    'requests': ['Python', 'Популярная библиотека Python для HTTP-запросов.'],
    'pytest': ['Тестирование', 'Фреймворк Python для поиска, запуска и отчётности автотестов.'],
    'fixture': ['Тестирование', 'Подготавливает данные или окружение для теста и при необходимости очищает их после.'],
    'assert': ['Тестирование', 'Сравнивает фактический результат с ожидаемым и роняет тест при несовпадении.'],
    'parametrize': ['Тестирование', 'Запускает один тест с несколькими наборами входных данных.'],
    'gherkin': ['BDD', 'Язык сценариев Given–When–Then, понятный бизнесу, QA и разработчикам.'],
    'bdd': ['BDD', 'Подход, при котором ожидаемое поведение описывается примерами и исполняемыми сценариями.'],
    'given': ['BDD', 'Исходные условия сценария: данные и состояние системы до действия.'],
    'when': ['BDD', 'Действие или событие, которое выполняется в сценарии.'],
    'then': ['BDD', 'Проверяемый ожидаемый результат сценария.'],

    /* 5G Core */
    '5g core': ['5G Core', 'Серверная часть мобильной сети: регистрирует абонента, создаёт сессии и проводит трафик.'],
    'open5gs': ['5G Core', 'Открытая программная реализация функций ядра 4G/5G.'],
    'ueransim': ['5G Core', 'Эмулятор gNB и UE для проверки протоколов 5G выше физического радиоуровня.'],
    'ue': ['5G Core', 'User Equipment — телефон или его эмулятор, который подключается к мобильной сети.'],
    'gnb': ['5G Core', 'Базовая станция 5G, связывающая UE с ядром сети.'],
    'nrf': ['5G Core', 'Реестр, в котором функции ядра находят друг друга и публикуют свои профили.'],
    'amf': ['5G Core', 'Управляет регистрацией UE, доступом и сигнальным соединением с gNB.'],
    'smf': ['5G Core', 'Создаёт PDU-сессии, выделяет адрес и программирует UPF.'],
    'upf': ['5G Core', 'Передаёт пользовательский IP-трафик UE между gNB и внешней сетью.'],
    'ausf': ['5G Core', 'Проверяет подлинность абонента при аутентификации.'],
    'udm': ['5G Core', 'Управляет данными и параметрами абонента.'],
    'udr': ['5G Core', 'Хранилище структурированных данных абонентов и политик.'],
    'pcf': ['5G Core', 'Предоставляет правила политик для сессий и сервисов.'],
    'bsf': ['5G Core', 'Связывает сессию абонента с обслуживающей функцией политик.'],
    'nssf': ['5G Core', 'Выбирает подходящий сетевой slice для абонента.'],
    'sbi': ['5G Core', 'Service Based Interface — HTTP/2-взаимодействие между функциями ядра.'],
    'ngap': ['5G Core', 'Сигнальный протокол между gNB и AMF на интерфейсе N2.'],
    'pfcp': ['5G Core', 'Протокол N4, по которому SMF настраивает правила передачи в UPF.'],
    'gtp-u': ['5G Core', 'Туннельный протокол пользовательского трафика между gNB и UPF.'],
    'pdu': ['5G Core', 'Единица данных; PDU-сессия даёт UE IP-подключение через ядро.'],
    'pdu-сессия': ['5G Core', 'Логическое IP-подключение UE через SMF и UPF к data network.'],
    'imsi': ['5G Core', 'Уникальный идентификатор мобильного абонента в тестовом профиле.'],
    'plmn': ['5G Core', 'Идентификатор мобильной сети, составленный из MCC и MNC.'],
    'dnn': ['5G Core', 'Имя сети передачи данных; аналог APN в 5G.'],
    'sst': ['5G Core', 'Тип сервиса сетевого slice.'],
    'rm-registered': ['5G Core', 'UE успешно зарегистрирован в ядре мобильной сети.'],
    'cm-connected': ['5G Core', 'Между UE и ядром активно сигнальное соединение.'],
    'ps-active': ['5G Core', 'PDU-сессия активна и готова передавать пользовательские данные.']
  };

  var LABELS = {
    'pwd': 'pwd', 'whoami': 'whoami', 'gnb': 'gNB', 'ue': 'UE', 'nrf': 'NRF', 'amf': 'AMF',
    'smf': 'SMF', 'upf': 'UPF', 'ausf': 'AUSF', 'udm': 'UDM', 'udr': 'UDR', 'pcf': 'PCF',
    'bsf': 'BSF', 'nssf': 'NSSF', 'sbi': 'SBI', 'ngap': 'NGAP', 'pfcp': 'PFCP',
    'gtp-u': 'GTP-U', 'pdu': 'PDU', 'imsi': 'IMSI', 'plmn': 'PLMN', 'dnn': 'DNN', 'sst': 'SST'
  };

  function normalize(text) {
    return String(text || '').replace(/\u00a0/g, ' ').replace(/^[\s`$]+|[\s`,.;:()]+$/g, '').replace(/\s+/g, ' ').toLowerCase();
  }

  function lookup(text) {
    var clean = normalize(text);
    if (!clean || clean.length > 120 || /^[\/\.]/.test(clean) || /^https?:/.test(clean)) return null;
    var candidates = [clean];
    if (/^docker\s+compose\b/.test(clean)) candidates.push('docker compose');
    var first = clean.split(/\s+/)[0].replace(/[^a-zа-я0-9_\/-]/gi, '');
    if (first) candidates.push(first);
    for (var i = 0; i < candidates.length; i++) {
      if (TERMS[candidates[i]]) return { key: candidates[i], label: LABELS[candidates[i]] || candidates[i], category: TERMS[candidates[i]][0], text: TERMS[candidates[i]][1] };
    }
    return null;
  }

  function Glossary(opts) {
    this.tip = opts.tooltip;
    this.category = opts.category;
    this.title = opts.title;
    this.text = opts.text;
    this.anchor = null;
    this.hideTimer = null;
    this.pinned = false;
    this.bindGlobal();
  }

  Glossary.prototype.bindGlobal = function () {
    var self = this;
    document.addEventListener('pointerdown', function (e) {
      if (!self.pinned || e.target.closest('.glossary-term') || e.target.closest('#glossary-popover')) return;
      self.hide(true);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') self.hide(true); });
    window.addEventListener('resize', function () { if (!self.tip.hidden && self.anchor) self.position(self.anchor); });
    document.addEventListener('scroll', function () { if (!self.tip.hidden && self.anchor) self.position(self.anchor); }, true);
  };

  Glossary.prototype.decorate = function (scope) {
    var self = this;
    (scope || document).querySelectorAll('code:not([data-glossary-ready])').forEach(function (el) {
      el.dataset.glossaryReady = '1';
      var term = lookup(el.textContent);
      if (!term) return;
      el.classList.add('glossary-term');
      el.tabIndex = 0;
      el.setAttribute('aria-label', el.textContent + ': ' + term.text);
      el.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch') return;
        self.pinned = false; self.show(el, term);
      });
      el.addEventListener('pointerleave', function (e) {
        if (e.pointerType === 'touch' || self.pinned) return;
        self.hideTimer = setTimeout(function () { self.hide(false); }, 90);
      });
      el.addEventListener('focus', function () { if (!self.pinned) self.show(el, term); });
      el.addEventListener('blur', function () { if (!self.pinned) self.hide(false); });
      el.addEventListener('click', function (e) {
        e.preventDefault();
        self.pinned = self.anchor !== el || !self.pinned;
        self.show(el, term);
      });
    });
  };

  Glossary.prototype.observe = function (rootEl) {
    var self = this;
    this.decorate(rootEl);
    this.observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('code')) self.decorate(node.parentNode || rootEl);
          else self.decorate(node);
        });
      });
    });
    this.observer.observe(rootEl, { childList: true, subtree: true });
  };

  Glossary.prototype.show = function (anchor, term) {
    clearTimeout(this.hideTimer);
    this.anchor = anchor;
    this.category.textContent = term.category;
    this.title.textContent = term.label;
    this.text.textContent = term.text;
    this.tip.hidden = false;
    this.position(anchor);
  };

  Glossary.prototype.position = function (anchor) {
    var rect = anchor.getBoundingClientRect();
    var tipRect = this.tip.getBoundingClientRect();
    var gap = 9;
    var left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(10, Math.min(window.innerWidth - tipRect.width - 10, left));
    var top = rect.top - tipRect.height - gap;
    var placement = 'top';
    if (top < 10) { top = rect.bottom + gap; placement = 'bottom'; }
    this.tip.style.left = Math.round(left) + 'px';
    this.tip.style.top = Math.round(top) + 'px';
    this.tip.dataset.placement = placement;
  };

  Glossary.prototype.hide = function (force) {
    clearTimeout(this.hideTimer);
    if (this.pinned && !force) return;
    this.pinned = false;
    this.tip.hidden = true;
    this.anchor = null;
  };

  root.CourseGlossary = Glossary;
})(typeof window !== 'undefined' ? window : globalThis);
