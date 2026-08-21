/* Контекстный словарь: объясняет выделенные команды и термины без ухода из урока. */
(function (root) {
  'use strict';

  var TERMS = {
    /* Linux */
    'help': ['Linux', 'Показывает доступные команды тренажёра и краткую справку по ним.'],
    'ssh': ['Linux / сеть', 'Защищённый протокол для удалённого входа на сервер и выполнения команд.'],
    'cli': ['Интерфейс', 'Command-Line Interface — управление программой текстовыми командами.'],
    'vm': ['Виртуализация', 'Virtual Machine — программно созданный компьютер со своей операционной системой.'],
    'cwd': ['Linux', 'Current Working Directory — каталог, относительно которого выполняются команды.'],
    'whoami': ['Linux', 'Печатает имя пользователя, от которого сейчас выполняются команды.'],
    'hostname': ['Linux', 'Показывает имя текущего узла — компьютера, сервера или виртуальной машины.'],
    'core-node': ['Учебный стенд', 'Имя учебного Linux-сервера, на котором в тренажёре выполняются команды и работают сервисы ядра.'],
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
    'posix': ['Операционные системы', 'Набор стандартов совместимости Unix-подобных систем и их программных интерфейсов.'],
    'sigterm': ['Linux', 'Сигнал с просьбой штатно завершить процесс и дать ему выполнить очистку.'],
    'sigkill': ['Linux', 'Сигнал немедленного завершения процесса без возможности выполнить очистку.'],
    'cpu': ['Компьютер', 'Центральный процессор; метрика CPU показывает долю вычислительной нагрузки.'],
    'ram': ['Компьютер', 'Оперативная память, которую процессы используют во время работы.'],

    /* Сети */
    'osi': ['Сети', 'Эталонная модель из семи уровней, помогающая локализовать сетевую проблему.'],
    'tcp/ip': ['Сети', 'Набор протоколов, на котором работает современная IP-сеть.'],
    'tcp': ['Сети', 'Надёжный протокол с установлением соединения, контролем доставки и порядка.'],
    'udp': ['Сети', 'Протокол без установления соединения и гарантии доставки; уменьшает накладные расходы.'],
    'sctp': ['Сети / 5G', 'Транспортный протокол N2, по которому gNB передаёт NGAP-сообщения в AMF.'],
    'dns': ['Сети', 'Система, преобразующая имена узлов в IP-адреса.'],
    'icmp': ['Сети', 'Служебный сетевой протокол, который использует ping для проверки доступности.'],
    'tls': ['Сети / безопасность', 'Шифрует соединение и подтверждает подлинность сервера, например в HTTPS.'],
    'url': ['Сети', 'Адрес ресурса: схема, имя узла, порт, путь и параметры запроса.'],
    'socket': ['Сети', 'Точка сетевого обмена: протокол, локальный адрес и порт, иногда удалённый адрес.'],
    'порт': ['Сети', 'Числовой идентификатор сетевой службы внутри узла.'],
    'localhost': ['Сети', 'Имя собственного компьютера; обычно соответствует адресу 127.0.0.1.'],
    'http/2': ['Сети', 'Версия HTTP с бинарными кадрами и несколькими параллельными потоками в одном соединении.'],
    'http': ['Сети', 'Протокол запрос–ответ, используемый веб-сервисами и API.'],
    'https': ['Сети / безопасность', 'HTTP поверх TLS: трафик шифруется, а сервер подтверждает свою подлинность.'],
    'get': ['HTTP', 'Метод запроса для чтения ресурса без изменения его состояния.'],
    'post': ['HTTP', 'Метод запроса для отправки данных и создания или запуска операции.'],
    'rest': ['API', 'Стиль построения HTTP API вокруг ресурсов, методов и кодов ответа.'],
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
    'ci/cd': ['CI/CD', 'Автоматизация проверок, сборки и доставки изменений в рабочую среду.'],
    'pipeline': ['CI/CD', 'Последовательность автоматических стадий: проверка, сборка, тесты и отчёты.'],
    'github actions': ['CI/CD', 'Сервис GitHub для запуска workflow из файлов репозитория.'],
    'gitlab ci': ['CI/CD', 'Система GitLab для выполнения pipeline, описанного в .gitlab-ci.yml.'],
    'yaml': ['Конфигурация', 'Текстовый формат конфигурации, чувствительный к отступам.'],
    'junit': ['Тестирование', 'XML-формат результатов тестов, который понимают CI-системы.'],
    'json': ['Формат данных', 'Текстовый формат объектов и массивов, часто используемый в API и конфигурации.'],
    'xml': ['Формат данных', 'Текстовый формат с тегами; часто используется для отчётов и обмена данными.'],
    'csv': ['Формат данных', 'Табличный текстовый формат, где строки — записи, а значения разделены запятыми или другим разделителем.'],

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
    'nf': ['5G Core', 'Network Function — отдельная сетевая функция ядра, например AMF, SMF или UDM.'],
    'nas': ['5G Core', 'Сигнальные сообщения между UE и ядром для регистрации, аутентификации и управления сессиями.'],
    'ran': ['5G', 'Radio Access Network — часть сети доступа между UE и ядром; в стенде её представляет gNB.'],
    'sim': ['5G', 'Модуль с идентификатором и секретным ключом абонента; в стенде его данные эмулируются.'],
    'rca': ['QA / эксплуатация', 'Root Cause Analysis — поиск и доказательство первопричины сбоя.'],
    'e2e': ['Тестирование', 'End-to-End — проверка полного пользовательского пути через все компоненты системы.'],
    'sa': ['5G', 'Standalone — архитектура 5G, в которой радиосеть подключена напрямую к ядру 5G Core.'],
    'suci': ['5G', 'Скрытая форма идентификатора абонента, защищающая постоянный SUPI/IMSI при передаче.'],
    'opc': ['5G / безопасность', 'Производный секрет абонента, используемый вместе с K при аутентификации.'],
    'mac': ['5G / безопасность', 'Message Authentication Code — код проверки целостности и подлинности сообщения.'],
    'ambr': ['5G', 'Aggregate Maximum Bit Rate — общий предел скорости передачи данных абонента.'],
    'hnet': ['5G / безопасность', 'Home Network — домашняя сеть абонента; её ключ используется для защиты SUCI.'],
    'slice': ['5G', 'Логический срез сети с заданным типом сервиса и набором ресурсов.'],
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
    'n2': ['5G Core', 'Интерфейс сигнализации gNB ↔ AMF, использующий NGAP поверх SCTP.'],
    'n3': ['5G Core', 'Интерфейс пользовательского трафика gNB ↔ UPF, использующий GTP-U.'],
    'n4': ['5G Core', 'Интерфейс управления SMF ↔ UPF, использующий PFCP.'],
    'n11': ['5G Core', 'Сервисный интерфейс AMF ↔ SMF для управления PDU-сессией.'],
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
    'pwd': 'pwd', 'whoami': 'whoami', 'ssh': 'SSH', 'cli': 'CLI', 'vm': 'VM', 'cwd': 'CWD',
    'icmp': 'ICMP', 'tls': 'TLS', 'url': 'URL', 'json': 'JSON', 'xml': 'XML', 'csv': 'CSV',
    'cpu': 'CPU', 'ram': 'RAM', 'posix': 'POSIX', 'sigterm': 'SIGTERM', 'sigkill': 'SIGKILL',
    'https': 'HTTPS', 'get': 'GET', 'post': 'POST', 'rest': 'REST',
    'gnb': 'gNB', 'ue': 'UE', 'nf': 'NF', 'nas': 'NAS', 'ran': 'RAN', 'sim': 'SIM',
    'rca': 'RCA', 'e2e': 'E2E', 'sa': 'SA', 'suci': 'SUCI', 'opc': 'OPc', 'mac': 'MAC',
    'ambr': 'AMBR', 'hnet': 'HNET', 'nrf': 'NRF', 'amf': 'AMF',
    'smf': 'SMF', 'upf': 'UPF', 'ausf': 'AUSF', 'udm': 'UDM', 'udr': 'UDR', 'pcf': 'PCF',
    'bsf': 'BSF', 'nssf': 'NSSF', 'sbi': 'SBI', 'ngap': 'NGAP', 'pfcp': 'PFCP',
    'gtp-u': 'GTP-U', 'pdu': 'PDU', 'imsi': 'IMSI', 'plmn': 'PLMN', 'dnn': 'DNN', 'sst': 'SST',
    'n2': 'N2', 'n3': 'N3', 'n4': 'N4', 'n11': 'N11'
  };

  /* В обычном тексте подсвечиваем только сокращения и специальные названия,
     чтобы теория не превращалась в сплошную россыпь ссылок. */
  var INLINE_KEYS = [
    'rm-registered', 'cm-connected', 'ps-active', 'docker compose', 'github actions',
    'http/2', 'https', 'http', 'ci/cd', 'ci', 'gtp-u', '5g core', 'open5gs', 'ueransim',
    'ssh', 'cli', 'vm', 'cwd', 'api', 'dns', 'tcp', 'udp', 'sctp', 'icmp', 'tls', 'url',
    'json', 'xml', 'csv', 'yaml', 'junit', 'bdd', 'gherkin', 'pytest', 'rest', 'get', 'post',
    'cpu', 'ram', 'posix', 'sigterm', 'sigkill', 'tun', 'osi',
    'ue', 'gnb', 'nf', 'nas', 'ran', 'sim', 'nrf', 'amf', 'smf', 'upf', 'ausf', 'udm', 'udr',
    'pcf', 'bsf', 'nssf', 'sbi', 'ngap', 'pfcp', 'pdu', 'imsi', 'plmn', 'dnn', 'sst',
    'rca', 'e2e', 'sa', 'suci', 'opc', 'mac', 'ambr', 'hnet', 'slice', 'n2', 'n3', 'n4', 'n11'
  ];

  function regexEscape(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var INLINE_RE = new RegExp('(?<![A-Za-zА-Яа-яЁё0-9_])(' + INLINE_KEYS.slice().sort(function (a, b) {
    return b.length - a.length;
  }).map(regexEscape).join('|') + ')(?![A-Za-zА-Яа-яЁё0-9_])', 'gi');

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

  Glossary.prototype.bindTerm = function (el, term) {
    var self = this;
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
  };

  Glossary.prototype.decorate = function (scope) {
    var self = this;
    (scope || document).querySelectorAll('code:not([data-glossary-ready])').forEach(function (el) {
      el.dataset.glossaryReady = '1';
      var term = lookup(el.textContent);
      if (!term) return;
      self.bindTerm(el, term);
    });
    this.decoratePlainText(scope || document);
  };

  Glossary.prototype.decoratePlainText = function (scope) {
    var self = this;
    var rootEl = scope && scope.nodeType === 1 ? scope : document.body;
    var nodes = [];
    var walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (!parent.closest('#theory, #task-text, #quiz, #hints, #verdict, #exam-modal, #review-modal, #cheat-view')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('code, pre, textarea, input, button, a, script, style, svg, .glossary-term')) return NodeFilter.FILTER_REJECT;
        INLINE_RE.lastIndex = 0;
        return INLINE_RE.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      var text = node.nodeValue;
      var frag = document.createDocumentFragment();
      var last = 0;
      INLINE_RE.lastIndex = 0;
      var match;
      while ((match = INLINE_RE.exec(text))) {
        var term = lookup(match[0]);
        if (!term) continue;
        if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
        var span = document.createElement('span');
        span.className = 'glossary-inline';
        span.textContent = match[0];
        self.bindTerm(span, term);
        frag.appendChild(span);
        last = match.index + match[0].length;
      }
      if (!last) return;
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
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
