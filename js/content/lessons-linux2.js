/* День 2 — Linux: процессы, службы, журнал, сеть, диагностика. */
(function (root) {
  'use strict';
  var L = root.QALessons = root.QALessons || [];

  L.push(

  {
    id: 'l2-ps',
    day: 2,
    module: 'Процессы',
    title: 'Кто запущен: ps и kill',
    goal: 'Найти процесс сервиса и понять, жив ли он',
    mode: 'shell',
    theory: `
<p>Процесс — запущенная программа. У каждого есть <b>PID</b> (номер), владелец и командная строка.</p>
<pre class="mini">ps aux                    <span class="c"># все процессы системы</span>
ps aux | grep registrar   <span class="c"># только нужный</span>
kill 812                  <span class="c"># попросить процесс завершиться</span>
kill -9 812               <span class="c"># убить принудительно (крайняя мера)</span></pre>
<p>Колонки <code>ps aux</code>: пользователь, PID, %CPU, %памяти, команда. Тестировщику важны три вещи: <b>процесс есть или нет</b>, <b>под каким пользователем</b> он работает и <b>с какими аргументами</b> запущен — там обычно виден путь к конфигу.</p>
<p class="note">Аргументы запуска — источник половины ответов. Если в <code>ps</code> видно <code>--config /etc/core/registrar.conf</code>, значит сервис читает именно этот файл, а не тот, который вы правили.</p>`,
    task: 'Найдите процесс сервиса регистрации и посмотрите, с каким конфигом он запущен.',
    checks: [
      { type: 'used', re: 'ps\\s+(aux|-ef).*\\|\\s*grep\\s+registrar|ps\\s+aux', why: 'Покажите процессы: <code>ps aux | grep registrar</code>' },
      { type: 'anyOut', contains: '/opt/core/bin/registrar', why: 'В выводе не видно процесса registrar' },
      { type: 'anyOut', contains: '--config', why: 'Не видно аргументов запуска — нужен полный вывод ps' }
    ],
    hints: ['<code>ps aux | grep registrar</code>'],
    solution: 'ps aux | grep registrar',
    quiz: {
      q: 'Вы правите /etc/core/registrar.conf, но поведение сервиса не меняется. Первая гипотеза?',
      options: [
        'Файл сохранился с ошибкой',
        'Сервис не перезапущен после правки — или читает другой конфиг, путь виден в ps aux',
        'Нужно перезагрузить весь сервер',
        'Права на файл слишком широкие'
      ],
      answer: 1,
      explain: 'Конфиг читается при старте. Без перезапуска правка не применится. И стоит убедиться по ps, что путь к конфигу тот самый.'
    }
  },

  {
    id: 'l2-systemctl',
    day: 2,
    module: 'Службы',
    title: 'systemctl: состояние службы',
    goal: 'Проверять и перезапускать сервисы так, как это делают на стенде',
    mode: 'shell',
    theory: `
<p>Современные сервисы в Linux управляются через systemd:</p>
<table class="tbl">
<tr><td><code>systemctl status core-registrar</code></td><td>состояние, PID, последние строки журнала</td></tr>
<tr><td><code>systemctl is-active core-registrar</code></td><td>короткий ответ: active / failed — удобно в скриптах</td></tr>
<tr><td><code>systemctl restart core-registrar</code></td><td>перезапустить</td></tr>
<tr><td><code>systemctl stop / start</code></td><td>остановить / запустить</td></tr>
<tr><td><code>systemctl enable</code></td><td>включить автозапуск после перезагрузки</td></tr>
</table>
<p>В выводе <code>status</code> смотрят три поля:</p>
<ul>
<li><b>Active:</b> active (running) — работает; failed — упал; inactive (dead) — остановлен;</li>
<li><b>Main PID</b> — номер процесса;</li>
<li>хвост журнала — последние сообщения, часто прямо с причиной падения.</li>
</ul>
<p class="note">Разница между <code>enabled</code> и <code>active</code>: первое — «стартует при загрузке системы», второе — «работает прямо сейчас». На собеседовании это спрашивают.</p>`,
    task: 'Посмотрите полный статус службы <code>core-registrar</code>, затем получите короткий ответ о её активности.',
    checks: [
      { type: 'used', re: 'systemctl\\s+status\\s+core-registrar', why: 'Нужен <code>systemctl status core-registrar</code>' },
      { type: 'used', re: 'systemctl\\s+is-active\\s+core-registrar', why: 'Нужен короткий ответ: <code>systemctl is-active core-registrar</code>' },
      { type: 'out', contains: 'active', why: 'Последняя команда должна вернуть состояние службы' }
    ],
    hints: ['<code>systemctl status core-registrar</code>', '<code>systemctl is-active core-registrar</code>'],
    solution: 'systemctl status core-registrar\nsystemctl is-active core-registrar',
    quiz: {
      q: 'Что означает «enabled, but inactive»?',
      options: [
        'Служба работает, но с ошибками',
        'Служба стартует автоматически при загрузке, но сейчас остановлена',
        'Служба удалена',
        'Служба ждёт подключения клиента'
      ],
      answer: 1,
      explain: 'enabled — про автозапуск при загрузке, active — про текущее состояние. Их путают чаще всего.'
    }
  },

  {
    id: 'l2-journal',
    day: 2,
    module: 'Службы',
    title: 'journalctl: журнал вместо гадания',
    goal: 'Читать системный журнал службы и фильтровать по важности',
    mode: 'shell',
    theory: `
<p>Не все сервисы пишут собственный файл лога — многие отдают всё в journald.</p>
<table class="tbl">
<tr><td><code>journalctl -u core-registrar</code></td><td>журнал конкретной службы</td></tr>
<tr><td><code>journalctl -u core-registrar -n 20</code></td><td>последние 20 строк</td></tr>
<tr><td><code>journalctl -u core-registrar -p err</code></td><td>только ошибки</td></tr>
<tr><td><code>journalctl -u core-registrar -f</code></td><td>следить в реальном времени</td></tr>
<tr><td><code>journalctl -u core-registrar -g timeout</code></td><td>поиск по подстроке</td></tr>
</table>
<p>Порядок при разборе инцидента: <code>systemctl status</code> → увидели failed → <code>journalctl -u ... -n 50</code> → нашли строку с причиной → и только потом гипотеза.</p>
<p class="note warn">Частая ошибка новичка: увидеть «сервис не работает» и сразу перезапускать. Перезапуск скрывает причину. Сначала журнал — потом действие.</p>`,
    task: 'Покажите последние 5 строк журнала службы <code>core-registrar</code>, а затем отдельно только записи об ошибках.',
    checks: [
      { type: 'used', re: 'journalctl\\s+-u\\s+core-registrar\\s+-n\\s*5', why: 'Нужны последние 5 строк: <code>journalctl -u core-registrar -n 5</code>' },
      { type: 'used', re: 'journalctl\\s+.*-p\\s+err', why: 'Нужен фильтр только по ошибкам: <code>-p err</code>' },
      { type: 'anyOut', contains: 'registrar', why: 'В выводе не видно записей журнала службы' }
    ],
    hints: ['<code>journalctl -u core-registrar -n 5</code>', '<code>journalctl -u core-registrar -p err</code>'],
    solution: 'journalctl -u core-registrar -n 5\njournalctl -u core-registrar -p err',
    quiz: {
      q: 'Сервис упал ночью, утром его уже перезапустили. Где искать причину?',
      options: [
        'Нигде, информация потеряна',
        'В журнале: journalctl -u сервис --since вчера, плюс файл лога приложения',
        'Только в ps aux',
        'В curl к сервису'
      ],
      answer: 1,
      explain: 'Журнал systemd хранит историю, включая записи до перезапуска. Плюс собственный лог приложения. Именно поэтому логи не чистят до разбора.'
    }
  },

  {
    id: 'l2-ports',
    day: 2,
    module: 'Сеть',
    title: 'ss: кто слушает порт',
    goal: 'Проверять, что сервис действительно принимает соединения',
    mode: 'shell',
    theory: `
<p>Процесс может быть жив, но не слушать порт — тогда клиент получит «connection refused». Смотрим сокеты:</p>
<pre class="mini">ss -tulpn</pre>
<p>Флаги запоминаются как слово «tulpn»:</p>
<table class="tbl">
<tr><td><code>-t</code></td><td>TCP</td></tr>
<tr><td><code>-u</code></td><td>UDP</td></tr>
<tr><td><code>-l</code></td><td>только слушающие (listening)</td></tr>
<tr><td><code>-p</code></td><td>показать процесс</td></tr>
<tr><td><code>-n</code></td><td>номера портов вместо имён</td></tr>
</table>
<p>Ключевая деталь — <b>адрес</b>, на котором висит сокет:</p>
<ul>
<li><code>0.0.0.0:8080</code> — принимает соединения на всех интерфейсах, доступен снаружи;</li>
<li><code>127.0.0.1:8080</code> — только локально; из сети такой сервис недоступен, хотя <code>curl localhost</code> с самого сервера работает.</li>
</ul>
<p class="note">Эта разница — типовая задача на собеседовании: «сервис работает на сервере, но клиент не подключается». Первый ответ — посмотреть, на каком адресе он слушает.</p>`,
    task: 'Покажите все слушающие TCP-сокеты с процессами и найдите среди них порт 8080.',
    checks: [
      { type: 'used', re: 'ss\\s+-\\w*t\\w*l?\\w*p?\\w*n?|ss\\s+-tulpn|ss\\s+-tlpn', why: 'Нужна команда <code>ss -tulpn</code>' },
      { type: 'anyOut', contains: '8080', why: 'В выводе не видно порта 8080' },
      { type: 'anyOut', contains: 'registrar', why: 'Не видно, какой процесс слушает порт — добавьте флаг <code>-p</code>' }
    ],
    hints: ['<code>ss -tulpn</code>', 'Можно сузить: <code>ss -tulpn | grep 8080</code>'],
    solution: 'ss -tulpn | grep 8080',
    quiz: {
      q: 'Сервис слушает 127.0.0.1:8080. Коллега с соседней машины получает «connection refused». Почему?',
      options: [
        'Сломан DNS',
        'Сервис привязан только к локальному интерфейсу — снаружи он недоступен, нужен 0.0.0.0',
        'Не хватает прав у коллеги',
        'Порт 8080 занят другим процессом'
      ],
      answer: 1,
      explain: '127.0.0.1 — петлевой интерфейс, доступный только с самого хоста. Чтобы принимать соединения из сети, слушать надо 0.0.0.0 или конкретный внешний адрес.'
    }
  },

  {
    id: 'l2-net',
    day: 2,
    module: 'Сеть',
    title: 'Адреса, маршруты, DNS',
    goal: 'Пройти путь запроса: имя → адрес → маршрут → порт',
    mode: 'shell',
    theory: `
<p>Когда «не работает сеть», проверяют по цепочке снизу вверх:</p>
<table class="tbl">
<tr><th>Шаг</th><th>Команда</th><th>Что проверяем</th></tr>
<tr><td>1. Свой адрес</td><td><code>ip addr</code></td><td>интерфейс поднят, адрес есть</td></tr>
<tr><td>2. Маршрут</td><td><code>ip route</code></td><td>есть шлюз по умолчанию</td></tr>
<tr><td>3. Имя</td><td><code>dig имя +short</code></td><td>DNS отвечает адресом</td></tr>
<tr><td>4. Доступность узла</td><td><code>ping адрес</code></td><td>пакеты доходят</td></tr>
<tr><td>5. Порт</td><td><code>nc -zv узел порт</code></td><td>TCP-соединение устанавливается</td></tr>
</table>
<p>Разница важна: <code>ping</code> проверяет узел (уровень 3, IP), <code>nc</code> — конкретный порт (уровень 4, TCP). Узел может пинговаться, а порт быть закрыт. Обратное тоже бывает: ICMP запрещён политикой, а сервис работает.</p>
<p>Имена узлов сначала ищутся в <code>/etc/hosts</code>, только потом идёт запрос в DNS (<code>/etc/resolv.conf</code>).</p>`,
    task: 'Узнайте адрес узла <code>db.core.local</code> через DNS и проверьте, что до него доходят пакеты.',
    checks: [
      { type: 'used', re: 'dig\\s+.*db\\.core\\.local|nslookup\\s+db\\.core\\.local|host\\s+db\\.core\\.local', why: 'Нужно разрешить имя: <code>dig db.core.local +short</code>' },
      { type: 'used', re: 'ping\\s+.*(db\\.core\\.local|10\\.10\\.0\\.20)', why: 'Нужно проверить доступность узла командой <code>ping</code>' },
      { type: 'anyOut', contains: '10.10.0.20', why: 'В выводе нет адреса узла — проверьте имя' }
    ],
    hints: ['<code>dig db.core.local +short</code>', '<code>ping db.core.local</code>'],
    solution: 'dig db.core.local +short\nping db.core.local',
    quiz: {
      q: 'ping до узла проходит, а curl к порту 8080 висит и отваливается по таймауту. О чём это говорит?',
      options: [
        'Узел выключен',
        'Сеть до узла есть, проблема на уровне порта: сервис не слушает или пакеты режет фаервол',
        'Не работает DNS',
        'На клиенте нет маршрута'
      ],
      answer: 1,
      explain: 'ICMP дошёл — значит IP-связность есть. Дальше вопрос транспортного уровня: слушает ли кто-то порт и пропускает ли фаервол. Отличие refused от timeout: refused — порт закрыт, timeout — пакеты молча дропаются.'
    }
  },

  {
    id: 'l2-curl',
    day: 2,
    module: 'Сеть',
    title: 'curl: дёргаем API руками',
    goal: 'Отправлять запросы к сервису и читать коды ответов',
    mode: 'shell',
    theory: `
<p>Сервисы ядра общаются по HTTP (в 5G — HTTP/2 между сетевыми функциями). Проверять их руками умеет <code>curl</code>:</p>
<pre class="mini">curl http://localhost:8080/health                    <span class="c"># простой GET</span>
curl -i http://localhost:8080/health                 <span class="c"># с заголовками ответа</span>
curl -X POST -d '{"imsi":"250010000000001"}' \\
     -H "Content-Type: application/json" \\
     http://localhost:8080/api/registration          <span class="c"># POST с телом</span></pre>
<p>Коды ответов, которые обязан знать QA:</p>
<table class="tbl">
<tr><td><code>200</code></td><td>успех</td></tr>
<tr><td><code>400</code></td><td>клиент прислал неверные данные</td></tr>
<tr><td><code>403</code></td><td>доступ запрещён (например, абонент заблокирован)</td></tr>
<tr><td><code>404</code></td><td>объект не найден</td></tr>
<tr><td><code>500</code></td><td>ошибка на стороне сервиса — почти всегда дефект</td></tr>
<tr><td><code>503</code></td><td>сервис временно недоступен (например, лежит база)</td></tr>
</table>
<p class="note">Правильный статус — часть требования. Если по спецификации на неизвестного абонента должен быть 404, а сервис отдаёт 500, это дефект, даже когда «в целом работает».</p>`,
    task: 'Проверьте <code>/health</code> учебного сервиса и зарегистрируйте абонента <code>250010000000001</code> через POST на <code>/api/registration</code>.',
    checks: [
      { type: 'used', re: 'curl\\s+.*/health', why: 'Сначала проверьте здоровье сервиса: <code>curl http://localhost:8080/health</code>' },
      { type: 'used', re: 'curl\\s+.*-X\\s*POST.*api/registration|curl\\s+.*-d\\s+.*api/registration', why: 'Нужен POST-запрос на /api/registration' },
      { type: 'anyOut', contains: 'registered', why: 'Сервис не подтвердил регистрацию — проверьте тело запроса' },
      { type: 'state', fn: function (st) { return !!st.sessions['250010000000001']; }, why: 'Сессия для этого IMSI не создана — регистрация не прошла' }
    ],
    hints: [
      '<code>curl http://localhost:8080/health</code>',
      "<code>curl -X POST -d '{\"imsi\":\"250010000000001\"}' http://localhost:8080/api/registration</code>"
    ],
    solution: 'curl http://localhost:8080/health\ncurl -X POST -d \'{"imsi":"250010000000001"}\' http://localhost:8080/api/registration',
    quiz: {
      q: 'Сервис на неизвестного абонента отвечает 500 вместо 404. Как оформить?',
      options: [
        'Не оформлять: ошибка же возвращается',
        'Дефект: код ответа не соответствует спецификации, клиент не отличит «нет такого абонента» от аварии сервиса',
        'Задача на документацию',
        'Улучшение с низким приоритетом'
      ],
      answer: 1,
      explain: '5xx означает «сломался сервер», 4xx — «данные клиента неверны». Подмена одного другим ломает логику клиента и мониторинг: 500-е обычно поднимают тревогу дежурному.'
    }
  },

  {
    id: 'l2-quest1',
    day: 2,
    module: 'Диагностика',
    title: 'Квест 1: сервис не отвечает',
    goal: 'Пройти путь от жалобы до причины и починить конфиг',
    mode: 'shell',
    scenario: 'service-down',
    banner: 'Утро. В чате: «Тесты падают, регистрация не работает». Стенд перед вами.',
    theory: `
<p>Разбираем реальную ситуацию. Жалоба: <b>«не работает регистрация»</b>. Никаких деталей.</p>
<p>Алгоритм, который стоит проговорить и на собеседовании:</p>
<ol>
<li>воспроизвести: <code>curl</code> к сервису — что именно возвращается;</li>
<li>жив ли процесс: <code>systemctl status</code>;</li>
<li>если упал — почему: <code>journalctl -u ... -n 20</code> или лог приложения;</li>
<li>устранить причину;</li>
<li>перезапустить и <b>проверить, что починилось</b>;</li>
<li>записать в баг-репорт: что было, почему, как проверено.</li>
</ol>
<p class="note warn">Пункт 5 пропускают чаще всего. «Перезапустил» — не результат. Результат — повторный запрос, который вернул 200.</p>`,
    task: 'Найдите причину, устраните её и добейтесь, чтобы <code>curl http://localhost:8080/health</code> снова отвечал. Причина — в конфиге; править файл можно через <code>sed -i "s/было/стало/" файл</code>.',
    checks: [
      { type: 'used', re: 'systemctl\\s+status|journalctl', why: 'Сначала выясните состояние службы и загляните в журнал' },
      { type: 'state', fn: function (st) { return st.services['core-registrar'].active; }, why: 'Служба всё ещё не поднята' },
      { type: 'state', fn: function (st) { return /listen_port\s*=\s*8080/.test(st.fs.readFile('/etc/core/registrar.conf') || ''); }, why: 'В конфиге по-прежнему неверный порт' },
      { type: 'anyOut', contains: '"status"', why: 'Не вижу успешного ответа /health после починки — проверьте результат запросом curl' }
    ],
    hints: [
      'Начните с <code>systemctl status core-registrar</code> — он покажет failed и хвост журнала',
      'В журнале строка <code>invalid value for listen_port: "80o8"</code> — в конфиге опечатка: буква «o» вместо нуля',
      'Правка: <code>sed -i "s/80o8/8080/" /etc/core/registrar.conf</code>, затем <code>systemctl restart core-registrar</code>'
    ],
    solution: 'systemctl status core-registrar\njournalctl -u core-registrar -n 5\ngrep listen_port /etc/core/registrar.conf\nsed -i "s/80o8/8080/" /etc/core/registrar.conf\nsystemctl restart core-registrar\ncurl -s http://localhost:8080/health',
    praise: 'Это законченный цикл: воспроизвёл → нашёл причину → исправил → подтвердил проверкой.',
    quiz: {
      q: 'Что писать в баг-репорте по такому случаю?',
      options: [
        '«Сервис не работал, перезапустил»',
        'Симптом (curl → connection refused), причина из журнала (invalid value for listen_port), как исправлено, как проверено (curl → 200)',
        'Скриншот чата с жалобой',
        'Ничего, раз всё уже работает'
      ],
      answer: 1,
      explain: 'Ценность отчёта — в воспроизводимости и причине. По такому описанию разработчик добавит валидацию конфига, и дефект не повторится.'
    }
  },

  {
    id: 'l2-quest2',
    day: 2,
    module: 'Диагностика',
    title: 'Квест 2: снаружи не пускает',
    goal: 'Различать «процесс не слушает», «слушает не там» и «режет фаервол»',
    mode: 'shell',
    scenario: 'wrong-bind',
    banner: 'Жалоба: «С моей машины 10.10.0.55 сервис недоступен, а на самом сервере всё работает».',
    theory: `
<p>Симптом «локально работает, снаружи нет» имеет три типовые причины:</p>
<table class="tbl">
<tr><th>Причина</th><th>Как проявляется</th><th>Чем видно</th></tr>
<tr><td>Слушает только 127.0.0.1</td><td>снаружи connection refused</td><td><code>ss -tulpn</code>: адрес сокета</td></tr>
<tr><td>Фаервол дропает пакеты</td><td>снаружи <b>таймаут</b>, не refused</td><td><code>ufw status</code> / <code>iptables -L</code></td></tr>
<tr><td>Сервис вообще не запущен</td><td>refused и локально тоже</td><td><code>systemctl status</code></td></tr>
</table>
<p>Различие между <b>refused</b> и <b>timeout</b> — ключ к диагнозу: refused означает, что пакет дошёл и хост ответил «порт закрыт»; timeout — что ответа не было вовсе, пакеты где-то умерли.</p>`,
    task: 'Докажите, что снаружи (адрес <code>10.10.0.10</code>) сервис недоступен, а локально работает; затем найдите в конфиге параметр, который это вызывает, исправьте его на <code>0.0.0.0</code>, перезапустите службу и подтвердите доступность по адресу <code>10.10.0.10</code>.',
    checks: [
      { type: 'used', re: 'ss\\s+-\\w*t', why: 'Посмотрите сокеты: на каком адресе висит сервис' },
      { type: 'state', fn: function (st) { return /listen_address\s*=\s*0\.0\.0\.0/.test(st.fs.readFile('/etc/core/registrar.conf') || ''); }, why: 'В конфиге по-прежнему listen_address = 127.0.0.1' },
      { type: 'state', fn: function (st) { return !st.bindLocalOnly && st.services['core-registrar'].active; }, why: 'Служба не перезапущена с новым адресом' },
      { type: 'anyOut', contains: '"status"', why: 'Нет успешного ответа сервиса после починки' }
    ],
    hints: [
      '<code>ss -tulpn | grep 8080</code> — видно 127.0.0.1:8080',
      '<code>grep listen_address /etc/core/registrar.conf</code>',
      '<code>sed -i "s/listen_address = 127.0.0.1/listen_address = 0.0.0.0/" /etc/core/registrar.conf</code>, затем <code>systemctl restart core-registrar</code> и <code>curl -s http://10.10.0.10:8080/health</code>'
    ],
    solution: 'ss -tulpn | grep 8080\ncurl -s http://10.10.0.10:8080/health\ncurl -s http://127.0.0.1:8080/health\ngrep listen_address /etc/core/registrar.conf\nsed -i "s/listen_address = 127.0.0.1/listen_address = 0.0.0.0/" /etc/core/registrar.conf\nsystemctl restart core-registrar\ncurl -s http://10.10.0.10:8080/health',
    quiz: {
      q: 'Клиент получает не «connection refused», а таймаут. Что вероятнее?',
      options: [
        'Сервис слушает не тот адрес',
        'Пакеты дропаются фаерволом или теряются по дороге — ответа нет вообще',
        'Неверный URL',
        'Кончилось место на диске'
      ],
      answer: 1,
      explain: 'При закрытом порте ядро отвечает RST — клиент видит refused мгновенно. Таймаут означает, что ответа не пришло: типично для DROP на фаерволе.'
    }
  },

  {
    id: 'l2-quest3',
    day: 2,
    module: 'Диагностика',
    title: 'Квест 3: сервис жив, но отвечает 503',
    goal: 'Отличить дефект сервиса от проблемы соседнего компонента',
    mode: 'shell',
    scenario: 'db-down',
    banner: 'Жалоба: «Регистрация иногда падает с ошибкой, сервис вроде работает».',
    theory: `
<p>Это самый частый случай в ядре сети: узел работает, но зависит от соседей — базы, соседнего сетевого узла, системы тарификации. Когда падает сосед, симптом видит пользователь узла.</p>
<p>Задача QA — не просто написать «регистрация не работает», а <b>локализовать</b>: чей это дефект.</p>
<ol>
<li>Проверить сам сервис: <code>systemctl status</code>, <code>/health</code>.</li>
<li>Посмотреть, что он пишет в лог при запросе.</li>
<li>Проверить зависимости: соседние службы, порты, доступность БД.</li>
<li>Сделать вывод: «сервис отвечает 503, потому что недоступна БД на 10.10.0.20:5432; ошибка обрабатывается корректно / некорректно».</li>
</ol>
<p class="note">Обратите внимание на формулировку вывода: она содержит и факт, и оценку по спецификации. Именно так пишут в тест-репорт.</p>`,
    task: 'Выясните, почему регистрация не проходит: проверьте состояние служб и попробуйте зарегистрировать абонента <code>250010000000001</code>. Затем поднимите упавшую зависимость и убедитесь, что регистрация снова работает.',
    checks: [
      { type: 'used', re: 'curl\\s+.*api/registration', why: 'Воспроизведите проблему запросом на регистрацию' },
      { type: 'used', re: 'systemctl\\s+(status|is-active|start|restart)\\s+core-db', why: 'Проверьте состояние зависимости — службы core-db' },
      { type: 'state', fn: function (st) { return st.dbUp && st.services['core-db'].active; }, why: 'База данных всё ещё недоступна' },
      { type: 'state', fn: function (st) { return !!st.sessions['250010000000001']; }, why: 'После починки регистрация так и не прошла — повторите запрос' }
    ],
    hints: [
      'Сначала воспроизведите: <code>curl -s -X POST -d \'{"imsi":"250010000000001"}\' http://localhost:8080/api/registration</code> — вернётся 503',
      'Посмотрите <code>systemctl status core-db</code> и <code>ss -tulpn | grep 5432</code>',
      'Поднимите: <code>systemctl start core-db</code>, затем повторите запрос регистрации'
    ],
    solution: 'curl -s -X POST -d \'{"imsi":"250010000000001"}\' http://localhost:8080/api/registration\ncurl -s http://localhost:8080/health\nsystemctl status core-db\nsystemctl start core-db\ncurl -s -X POST -d \'{"imsi":"250010000000001"}\' http://localhost:8080/api/registration',
    praise: 'Локализация выполнена: проблема не в тестируемом узле, а в его зависимости. Это ровно то, чего ждут от QA ядра сети.',
    quiz: {
      q: 'Сервис при недоступной БД возвращает 503 и пишет в лог «database timeout». Дефект?',
      options: [
        'Да, любой сбой — дефект тестируемого узла',
        'Нет: узел корректно обработал отказ зависимости. Дефектом было бы 500 без пояснения, зависание запроса или потеря данных',
        'Дефект базы, тестировать нечего',
        'Зависит от настроения заказчика'
      ],
      answer: 1,
      explain: 'Проверяется не только «хорошая погода», но и поведение при отказе соседа: корректный код, понятная запись в лог, отсутствие зависаний и утечки сессий. Это и есть тестирование отказоустойчивости.'
    }
  },

  {
    id: 'l2-disk',
    day: 2,
    module: 'Диагностика',
    title: 'Квест 4: кончилось место',
    goal: 'Найти, что съело диск, и освободить его',
    mode: 'shell',
    scenario: 'disk-full',
    banner: 'Сервис перестал писать логи, в журнале «No space left on device».',
    theory: `
<p>Переполненный диск ломает сервисы неочевидно: приложение живо, но не может записать лог, временный файл или данные. Ошибки при этом самые разные — от «внутренней ошибки» до молчаливой потери событий.</p>
<pre class="mini">df -h                      <span class="c"># какие разделы заполнены</span>
du -sh /var/log            <span class="c"># сколько занимает каталог</span>
find /var/log -size +1G    <span class="c"># найти крупные файлы</span>
rm /path/to/huge.old       <span class="c"># удалить (осторожно!)</span></pre>
<p class="note warn">На рабочем сервере ничего не удаляют «на глаз». Сначала выясняют, что это за файл и не нужен ли он для разбора инцидента: старые логи обычно архивируют, а не стирают.</p>`,
    task: 'Найдите переполненный раздел, определите самый большой файл в <code>/var/log</code> и удалите именно его.',
    checks: [
      { type: 'used', re: 'df\\s+-h|df', why: 'Начните с <code>df -h</code>: какой раздел заполнен' },
      { type: 'used', re: 'du\\s+|find\\s+/var/log.*-size', why: 'Найдите виновника через <code>du -sh</code> или <code>find /var/log -size +1G</code>' },
      { type: 'state', fn: function (st) { return st.fs.node('/var/log/core/registrar.log.old') === null; }, why: 'Огромный файл registrar.log.old всё ещё на месте' },
      { type: 'state', fn: function (st) { return st.fs.readFile('/var/log/core/registrar.log') !== null; }, why: 'Действующий лог удалять нельзя — он нужен для разбора' }
    ],
    hints: [
      '<code>df -h</code> покажет 100% на /',
      '<code>find /var/log -size +1G</code> найдёт файл <code>registrar.log.old</code> на 13 ГБ',
      '<code>rm /var/log/core/registrar.log.old</code> — удаляем именно старый файл, действующий лог не трогаем'
    ],
    solution: 'df -h\ndu -sh /var/log\nfind /var/log -size +1G\nrm /var/log/core/registrar.log.old\ndf -h',
    quiz: {
      q: 'Диск заполнен на 100%, сервис жив. Почему нельзя просто удалить весь /var/log?',
      options: [
        'Можно, логи не нужны',
        'В логах причина инцидента и данные для отчёта; удалять надо адресно, а старое — архивировать и настроить ротацию',
        'Удаление логов требует прав root',
        'Логи защищены от удаления'
      ],
      answer: 1,
      explain: 'Логи — доказательная база. Правильное решение проблемы места — не удаление, а logrotate: сжатие и хранение ограниченного числа файлов.'
    }
  }

  );
})(typeof window !== 'undefined' ? window : globalThis);
