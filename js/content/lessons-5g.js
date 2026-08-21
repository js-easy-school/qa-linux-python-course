/* Дни 5–8: Docker, 5G SA, BDD и рабочие инциденты. */
(function (root) {
  'use strict';
  var L = root.QALessons = root.QALessons || [];

  function mentor(why, observe, mistake, explain) {
    return { why: why, observe: observe, mistake: mistake, explain: explain };
  }
  function add(o) {
    o.mode = 'shell';
    o.praise = o.praise || 'Проверка выполнена и подтверждена наблюдаемым фактом.';
    L.push(o);
  }

  add({
    id: 'd5-compose-model', day: 5, module: 'Docker Compose',
    title: 'Compose как исполняемая схема стенда',
    goal: 'Проверять итоговую конфигурацию до долгой сборки',
    scenario: 'ok',
    theory: '<p><code>docker-compose.yml</code> описывает сервисы, сети, volumes, healthcheck и зависимости. После подстановки переменных и anchors итоговая модель может отличаться от исходного YAML.</p><p><code>docker compose config</code> ловит неизвестные поля и неверные типы до запуска. В CI эта быстрая проверка должна идти раньше сборки Open5GS.</p><pre class="mini">docker compose config --quiet  <span class="c"># только код возврата</span>\ndocker compose config          <span class="c"># итоговая модель</span></pre>',
    task: 'Постройте итоговую Compose-модель. Подтвердите наличие сервисов и закреплённых образов Open5GS 2.8.0 и UERANSIM 3.3.0.',
    solution: 'docker compose config',
    checks: [
      { type: 'used', re: 'docker\\s+compose\\s+config', why: 'Запустите <code>docker compose config</code>' },
      { type: 'out', contains: ['services:', 'open5gs:2.8.0', 'ueransim:3.3.0'], why: 'Найдите services и закреплённые версии образов' }
    ],
    hints: ['Начните с <code>docker compose config</code>.', 'Тег <code>latest</code> не воспроизводим.'],
    mentor: mentor('QA отделяет дефект конфигурации от дефекта продукта ещё до старта.', 'Код 0 и итоговые image tags.', 'Сразу запускать build и искать опечатку через 20 минут.', 'Покажите config validation перед build в CI.')
  });

  add({
    id: 'd5-compose-ps', day: 5, module: 'Docker Compose',
    title: 'Состояние контейнеров без догадок',
    goal: 'За минуту увидеть, какой слой стенда не поднялся',
    scenario: 'ok',
    theory: '<p><code>docker compose ps --all</code> показывает работающие и завершившиеся контейнеры. Читайте 5G-стенд по зависимостям: Mongo/NRF → остальные NF → AMF/UPF → gNB → UE.</p><p>Если ранняя зависимость exited, ошибки последующих компонентов часто вторичны.</p>',
    task: 'Покажите все контейнеры и подтвердите, что AMF, UPF, gNB и UE находятся в Up.',
    solution: 'docker compose ps --all',
    checks: [
      { type: 'used', re: 'docker\\s+compose\\s+ps.*(--all|-a)', why: 'Нужен список, включая exited: <code>ps --all</code>' },
      { type: 'out', contains: ['o5g-amf', 'o5g-upf', 'o5g-gnb', 'o5g-ue', 'Up'], why: 'Проверьте ключевые компоненты и STATUS' }
    ],
    hints: ['Команда: <code>docker compose ps --all</code>.'],
    mentor: mentor('Это первый срез контейнерного инцидента.', 'STATUS, время и порядок зависимостей.', 'Читать логи UE, когда UDM уже exited.', 'Опишите triage от зависимости к потребителю.')
  });

  add({
    id: 'd5-compose-logs', day: 5, module: 'Docker Compose',
    title: 'Корреляция логов нескольких NF',
    goal: 'Связать регистрацию UE и создание PDU-сессии',
    scenario: 'ok',
    theory: '<p>Регистрация распределена между NF, поэтому один лог редко доказывает весь сценарий. Compose объединяет выбранные сервисы и сохраняет их префиксы.</p><pre class="mini">docker compose logs --since=5m amf smf upf\ndocker compose logs --tail=100 gnb ue</pre><p>Временная граница защищает от ложного совпадения со старым запуском.</p>',
    task: 'Получите совместные логи AMF и SMF. Найдите завершённую регистрацию и активированную PDU-сессию.',
    solution: 'docker compose logs --tail=100 amf smf',
    checks: [
      { type: 'used', re: 'docker\\s+compose\\s+logs.*amf.*smf', why: 'Запросите логи AMF и SMF одной командой' },
      { type: 'out', contains: ['Registration complete', 'PDU session activated'], why: 'Нужны оба результата' }
    ],
    hints: ['<code>docker compose logs --tail=100 amf smf</code>.'],
    mentor: mentor('Сценарий 5G распределён между процессами.', 'Последовательность, IMSI/SUCI и session context.', 'Искать слово success в неограниченном старом логе.', 'Защитите два независимых end-to-end факта.')
  });

  add({
    id: 'd5-inspect', day: 5, module: 'Контейнерная диагностика',
    title: 'inspect: exit процесса или failed healthcheck',
    goal: 'Читать фактическое состояние Docker',
    scenario: 'nf-missing',
    theory: '<p><code>docker inspect</code> показывает State, ExitCode, Health, mounts и command. <b>Exited + code 1</b> означает завершение главного процесса. <b>Running + unhealthy</b> — процесс жив, но readiness не проходит.</p>',
    task: 'Исследуйте <code>o5g-udm</code> и подтвердите Status exited и ExitCode 1.',
    solution: 'docker inspect o5g-udm',
    checks: [
      { type: 'used', re: 'docker\\s+inspect\\s+.*o5g-udm', why: 'Используйте <code>docker inspect o5g-udm</code>' },
      { type: 'out', contains: ['"Status": "exited"', '"ExitCode": 1'], why: 'Найдите точные поля State' }
    ],
    hints: ['State виден и без format: <code>docker inspect o5g-udm</code>.'],
    mentor: mentor('Exit code направляет к логу процесса, health — к readiness.', 'State.Status и State.ExitCode.', 'Считать unhealthy и exited одним состоянием.', 'Объясните liveness против readiness.')
  });

  add({
    id: 'd5-ci-gate', day: 5, module: 'CI/CD',
    title: 'Pipeline: быстрый gate перед e2e',
    goal: 'Строить pipeline от дешёвой проверки к дорогой',
    scenario: 'ok',
    theory: '<p>Рабочий порядок: validation → build → deploy → readiness → tests → artifacts → teardown. JUnit и диагностические логи собираются при <code>always()</code>.</p><p>Marker expression позволяет отделить быстрый gate от slow/nightly сценариев.</p>',
    task: 'Сначала проверьте Compose-модель, затем запустите pytest без slow. Обе команды должны завершиться успешно.',
    solution: 'docker compose config\npytest -m "not slow"',
    checks: [
      { type: 'used', re: 'docker\\s+compose\\s+config[\\s\\S]*pytest\\s+-m', why: 'Сначала config, затем pytest marker' },
      { type: 'anyOut', contains: ['services:', '39 passed'], why: 'Нужны validation и зелёный test report' }
    ],
    hints: ['Первая команда: <code>docker compose config</code>.', 'Вторая: <code>pytest -m "not slow"</code>.'],
    mentor: mentor('Порядок gate экономит runner time.', 'Отдельная причина падения и artifact каждого этапа.', 'Терять логи, потому что upload стоит только on_success.', 'Нарисуйте pipeline и критерии перехода.'),
    quiz: { q: 'Что запускать раньше дорогой сборки?', options: ['E2E', 'Compose/static validation', 'Публикацию отчёта', 'Teardown'], answer: 1, explain: 'Быстрая детерминированная проверка даёт ранний feedback.' }
  });

  add({
    id: 'd6-nrf', day: 6, module: 'Service Based Architecture',
    title: 'NRF: кто зарегистрирован в ядре',
    goal: 'Проверять готовность по профилям NF, а не по одному 200',
    scenario: 'ok',
    theory: '<p><b>NRF</b> — реестр сетевых функций. AMF, SMF, AUSF, UDM, UDR, PCF, BSF и NSSF публикуют NF profile для discovery.</p><p>Open5GS SBI использует clear-text HTTP/2. Для ручной h2c-проверки нужен <code>curl --http2-prior-knowledge</code>. Ответ endpoint не доказывает наличие ожидаемого набора NF.</p>',
    task: 'Запросите NF instances у NRF по HTTP/2 и подтвердите наличие AMF, SMF и AUSF.',
    solution: 'curl --http2-prior-knowledge http://nrf:7777/nnrf-nfm/v1/nf-instances',
    checks: [
      { type: 'used', re: 'curl.*--http2-prior-knowledge.*nrf:7777.*nnrf-nfm', why: 'Используйте h2c и endpoint NRF' },
      { type: 'out', contains: ['AMF', 'SMF', 'AUSF'], why: 'Сравните содержимое registry' }
    ],
    hints: ['Endpoint: <code>/nnrf-nfm/v1/nf-instances</code>.'],
    mentor: mentor('NRF даёт карту control plane.', 'Множество expected и actual nfType.', 'Принимать любой HTTP 200 как readiness ядра.', 'Чем liveness NRF отличается от готовности всех NF?')
  });

  add({
    id: 'd6-ngap', day: 6, module: 'N2 / NGAP',
    title: 'AMF слушает SCTP/NGAP',
    goal: 'Не проверять SCTP инструментом для TCP',
    scenario: 'ok',
    theory: '<p>gNB подключается к AMF по N2: приложение NGAP, транспорт <b>SCTP</b>, порт 38412. Обычный <code>nc -z</code> проверяет TCP и даст ложный отказ.</p><p>Сначала докажите SCTP listener через <code>ss</code>, затем NG Setup по логам обеих сторон.</p>',
    task: 'Найдите SCTP listener AMF на 38412 и процесс open5gs-amfd.',
    solution: 'ss -lnp -A sctp | grep 38412',
    checks: [
      { type: 'used', re: 'ss\\s+.*(-A\\s*sctp|sctp).*grep\\s+38412', why: 'Выберите SCTP и порт 38412' },
      { type: 'out', contains: ['sctp', '38412', 'open5gs-amfd'], why: 'Нужен SCTP socket AMF' }
    ],
    hints: ['<code>ss -lnp -A sctp | grep 38412</code>.'],
    mentor: mentor('Неверный транспорт дал прежнему стенду гарантированный timeout.', 'Protocol, bind address, port, process.', 'Проверять NGAP как TCP.', 'Назовите N2/NGAP/SCTP и подходящую проверку.')
  });

  add({
    id: 'd6-user-plane-ports', day: 6, module: 'N4 / N3',
    title: 'PFCP и GTP-U: два UDP-порта',
    goal: 'Различать управление сессией и пользовательский трафик',
    scenario: 'ok',
    theory: '<p><b>PFCP/N4</b> между SMF и UPF использует UDP 8805 и программирует forwarding. <b>GTP-U/N3</b> между gNB и UPF переносит пользовательские пакеты по UDP 2152.</p><p>Открытый socket — базовый факт; end-to-end требует active PDU session и реального трафика через TUN.</p>',
    task: 'Покажите UDP sockets PFCP 8805 и GTP-U 2152.',
    solution: 'ss -lunp | grep -E "8805|2152"',
    checks: [
      { type: 'used', re: 'ss\\s+.*u.*grep.*8805.*2152', why: 'Отфильтруйте UDP sockets по обоим портам' },
      { type: 'out', contains: ['8805', '2152', 'open5gs-upfd'], why: 'Нужны оба socket UPF' }
    ],
    hints: ['<code>ss -lunp | grep -E "8805|2152"</code>.'],
    mentor: mentor('QA локализует control plane против user plane.', '8805 = PFCP, 2152 = GTP-U.', 'Называть PFCP транспортом user packets.', 'Опишите путь UE → gNB → UPF и роль SMF.')
  });

  add({
    id: 'd6-registration', day: 6, module: 'UE registration',
    title: 'NAS-состояние UE',
    goal: 'Проверять фактический результат через nr-cli',
    scenario: 'ok',
    theory: '<p><code>RM-REGISTERED</code> означает успешную mobility registration. <code>CM-CONNECTED</code> показывает signalling connection, но не доказывает PDU session.</p><p>Статус читают для конкретного IMSI; общий старый лог способен дать ложный зелёный результат.</p>',
    task: 'Получите status UE 999700000000001 и подтвердите RM-REGISTERED и CM-CONNECTED.',
    solution: 'docker exec o5g-ue nr-cli imsi-999700000000001 -e status',
    checks: [
      { type: 'used', re: 'docker\\s+exec\\s+o5g-ue\\s+nr-cli\\s+imsi-999700000000001.*status', why: 'Обратитесь к точному UE' },
      { type: 'out', contains: ['RM-REGISTERED', 'CM-CONNECTED'], why: 'Нужны оба состояния' }
    ],
    hints: ['<code>docker exec o5g-ue nr-cli imsi-999700000000001 -e status</code>.'],
    mentor: mentor('Это прямое наблюдение результата регистрации.', 'RM state и CM state отдельно.', 'Делать вывод по health контейнера.', 'Почему registered не равно active data session?')
  });

  add({
    id: 'd6-pdu', day: 6, module: 'PDU session',
    title: 'PDU-сессия, DNN и IP',
    goal: 'Доказать готовность UE к передаче данных',
    scenario: 'ok',
    theory: '<p>PDU session связывает UE с DNN <code>internet</code>. SMF выбирает UPF и адрес, UPF строит forwarding path, UE получает TUN.</p><p>Проверяйте <code>PS-ACTIVE</code>, DNN и IP из ожидаемого пула 10.45.0.0/16.</p>',
    task: 'Покажите PDU sessions UE: PS-ACTIVE, DNN internet и IP 10.45.0.2.',
    solution: 'docker exec o5g-ue nr-cli imsi-999700000000001 -e ps-list',
    checks: [
      { type: 'used', re: 'docker\\s+exec\\s+o5g-ue.*nr-cli.*ps-list', why: 'Запросите ps-list' },
      { type: 'out', contains: ['PS-ACTIVE', '10.45.0.2', 'internet'], why: 'Нужны state, IP и DNN' }
    ],
    hints: ['<code>docker exec o5g-ue nr-cli imsi-999700000000001 -e ps-list</code>.'],
    mentor: mentor('Registration и PDU session — разные требования.', 'State, DNN, IP from pool.', 'Считать RM-REGISTERED доказательством user plane.', 'Какие NF участвуют в PDU establishment?'),
    quiz: { q: 'RM-REGISTERED уже доказывает передачу данных?', options: ['Да', 'Нет, нужна active PDU session и user-plane проверка', 'Да, если gNB Up', 'Да, если NRF отвечает'], answer: 1, explain: 'Registration — control plane; data path проверяется отдельно.' }
  });

  add({
    id: 'd7-subscriber', day: 7, module: 'Test data',
    title: 'Профиль абонента в MongoDB',
    goal: 'Связать IMSI, security, slice и DNN',
    scenario: 'ok',
    theory: '<p>Open5GS хранит IMSI, K/OPc, AMBR, slices и DNN в MongoDB. UERANSIM должен использовать согласованные security values.</p><p>В реальном CI секреты не печатают: проверяют наличие/структуру и маскируют значение.</p>',
    task: 'Получите профиль IMSI 999700000000001. Подтвердите security, SST 1 и DNN internet.',
    solution: 'docker exec o5g-mongo mongosh open5gs --quiet --eval "db.subscribers.find({imsi:999700000000001}).toArray()"',
    checks: [
      { type: 'used', re: 'docker\\s+exec\\s+o5g-mongo.*mongosh', why: 'Запросите MongoDB в контейнере' },
      { type: 'out', contains: ['999700000000001', 'security', '"sst":1', 'internet'], why: 'Нужны IMSI, security, slice, DNN' }
    ],
    hints: ['Используйте <code>docker exec o5g-mongo mongosh ...</code>.'],
    mentor: mentor('Негативный auth-тест требует контролируемых данных.', 'Совпадение IMSI/K/OPc/slice/DNN.', 'Переиспользовать уже registered IMSI для bad-key.', 'Как изолировать positive и bad-key test data?')
  });

  add({
    id: 'd7-bdd', day: 7, module: 'BDD',
    title: 'Gherkin действительно исполняется',
    goal: 'Отличить feature-документ от привязанного автотеста',
    scenario: 'ok',
    theory: '<p>Feature полезен, когда steps связаны с кодом и scenario попадает в test collection. <code>pytest --collect-only</code> проверяет это без стенда.</p><p>Given — состояние, When — действие, Then — наблюдаемый результат. Детали Docker оставляйте в step definitions.</p>',
    task: 'Соберите тесты без выполнения и найдите сценарий неизвестного абонента.',
    solution: 'pytest --collect-only -q | grep unknown_subscriber',
    checks: [
      { type: 'used', re: 'pytest\\s+--collect-only.*grep.*unknown_subscriber', why: 'Соберите и отфильтруйте scenario' },
      { type: 'out', contains: 'test_unknown_subscriber_is_rejected', why: 'Scenario должен присутствовать в collection' }
    ],
    hints: ['<code>pytest --collect-only -q | grep unknown_subscriber</code>.'],
    mentor: mentor('Неисполняемый Gherkin расходится с продуктом.', 'Scenario name как pytest item.', 'Хранить feature без step definitions.', 'Покажите трассировку requirement → scenario → report.')
  });

  add({
    id: 'd7-markers', day: 7, module: 'pytest',
    title: 'Маркеры и быстрый негативный прогон',
    goal: 'Выбирать слой тестов без копирования наборов',
    scenario: 'ok',
    theory: '<p>Маркеры группируют <code>infra</code>, <code>registration</code>, <code>negative</code>, <code>slow</code>. Выражение <code>-m</code> поддерживает and/or/not.</p><p>Регистрируйте markers и включайте strict mode: опечатка должна падать, а не тихо менять coverage.</p>',
    task: 'Запустите только negative-тесты. Проверьте пять passed и остальные deselected.',
    solution: 'pytest -m negative',
    checks: [
      { type: 'used', re: 'pytest\\s+-m\\s+.*negative', why: 'Выберите marker negative' },
      { type: 'out', contains: ['5 passed', 'deselected'], why: 'Нужен отчёт выбранной группы' }
    ],
    hints: ['Команда: <code>pytest -m negative</code>.'],
    mentor: mentor('Markers управляют стоимостью feedback loop.', 'selected/deselected и отсутствие warning.', 'Дублировать тесты для каждого pipeline.', 'Предложите smoke/full/nightly expressions.')
  });

  add({
    id: 'd7-packets', day: 7, module: 'Packet diagnostics',
    title: 'tcpdump: увидеть GTP-U',
    goal: 'Подтвердить пользовательский трафик на UDP 2152',
    scenario: 'ok',
    theory: '<p>Packet capture отвечает «доходит ли пакет до интерфейса». GTP-U фильтруют по UDP 2152, PFCP — 8805.</p><p>Capture показывает transport fact, но не всегда application cause. При сложном падении pcap сохраняют как ограниченный CI artifact.</p>',
    task: 'Снимите три пакета UDP 2152 без DNS resolution. Найдите обмен gNB 10.33.0.30 ↔ UPF 10.33.0.22.',
    solution: 'tcpdump -nn -i any -c 3 udp port 2152',
    checks: [
      { type: 'used', re: 'tcpdump.*-nn.*udp.*port\\s+2152', why: 'Фильтруйте UDP 2152 и отключите DNS' },
      { type: 'out', contains: ['10.33.0.30.2152', '10.33.0.22.2152', 'GTP-U'], why: 'Нужен обмен gNB и UPF' }
    ],
    hints: ['<code>tcpdump -nn -i any -c 3 udp port 2152</code>.'],
    mentor: mentor('Capture разделяет отсутствие пакета и неправильную обработку.', 'Endpoints, direction, port, timestamp.', 'Собирать весь трафик без фильтра.', 'Когда приложить pcap, а когда хватит логов?')
  });

  add({
    id: 'd7-negative-auth', day: 7, module: 'Негативные сценарии',
    title: 'Неверный SIM-ключ: доказать отказ',
    goal: 'Проверить cause и отсутствие ложной регистрации',
    scenario: 'auth-fail',
    theory: '<p>Для заведённого IMSI с неверным K/OPc ожидается authentication failure и registration reject. Это отличается от unknown subscriber.</p><p>Используйте отдельный IMSI и свежую временную границу, иначе состояние предыдущего UE даст ложный успех.</p>',
    task: 'Получите логи AMF и UE. Найдите MAC failure и Registration reject.',
    solution: 'docker compose logs --tail=100 amf ue',
    checks: [
      { type: 'used', re: 'docker\\s+compose\\s+logs.*amf.*ue', why: 'Сопоставьте network-side и UE-side' },
      { type: 'out', contains: ['MAC failure', 'Registration reject'], why: 'Нужна точная причина и итог' }
    ],
    hints: ['<code>docker compose logs --tail=100 amf ue</code>.'],
    mentor: mentor('Negative security path — критический риск.', 'Cause, точный IMSI, отсутствие success.', 'Искать любое старое failure в общем логе.', 'Сравните bad-key и unknown IMSI.'),
    quiz: { q: 'Зачем bad-key сценарию отдельный IMSI?', options: ['Для скорости', 'Чтобы исключить состояние уже зарегистрированного UE', 'Mongo требует', 'Без него нет логов'], answer: 1, explain: 'Изоляция test data исключает false positive.' }
  });

  add({
    id: 'd8-nf-incident', day: 8, module: 'Инцидент 1',
    title: 'UDM отсутствует в NRF',
    goal: 'Локализовать missing NF до пути HNET-ключа',
    scenario: 'nf-missing',
    theory: '<p>Симптом: NRF не содержит UDM, UE не регистрируется. Идите state → inspect → свежий process log.</p><p>HNET keys source-build устанавливает в <code>/opt/open5gs/etc/open5gs/hnet</code>. Несуществующий path валит UDM до NF registration.</p>',
    task: 'Тремя командами докажите: UDM exited, ExitCode 1, причина — недоступный HNET private key.',
    solution: 'docker compose ps --all\ndocker inspect o5g-udm\ndocker compose logs --tail=100 udm',
    checks: [
      { type: 'used', re: 'docker\\s+compose\\s+ps[\\s\\S]*docker\\s+inspect.*udm[\\s\\S]*docker\\s+compose\\s+logs.*udm', why: 'Соберите state → inspect → log' },
      { type: 'anyOut', contains: ['o5g-udm', '"ExitCode": 1', 'Cannot open HNET private key'], why: 'Нужна полная доказательная цепочка' }
    ],
    hints: ['Не начинайте с restart.', 'ps --all → inspect → logs udm.'],
    mentor: mentor('Это реальный дефект прежнего проекта.', 'Missing NF — симптом, exited UDM и path — причина.', 'Перезапускать без исправления path.', 'Сформулируйте RCA, fix и regression guard.')
  });

  add({
    id: 'd8-ngap-incident', day: 8, module: 'Инцидент 2',
    title: 'gNB не устанавливает NG Setup',
    goal: 'Сравнить SCTP listener AMF и destination gNB',
    scenario: 'ngap-down',
    theory: '<p>Если AMF слушает 10.33.0.20:38412, а gNB идёт на 10.33.0.99, kernel и listener исправны — неверен адрес в gNB config.</p><p>Сравнивайте обе стороны: server bind и client destination.</p>',
    task: 'Сопоставьте логи gNB/AMF и SCTP socket. Докажите несовпадение 10.33.0.99 и 10.33.0.20.',
    solution: 'docker compose logs --tail=100 gnb amf\nss -lnp -A sctp | grep 38412',
    checks: [
      { type: 'used', re: 'docker\\s+compose\\s+logs.*gnb.*amf[\\s\\S]*ss\\s+.*sctp', why: 'Нужны client/server logs и socket' },
      { type: 'anyOut', contains: ['10.33.0.99:38412', '10.33.0.20:38412', 'open5gs-amfd'], why: 'Сравните destination и listener' }
    ],
    hints: ['Логи обеих сторон, затем <code>ss -lnp -A sctp</code>.'],
    mentor: mentor('Адресная ошибка маскируется как protocol problem.', 'Client destination против server bind.', 'Менять kernel, когда SCTP listener доказан.', 'Как эти факты исключают гипотезу «AMF не запущен»?')
  });

  add({
    id: 'd8-auth-incident', day: 8, module: 'Инцидент 3',
    title: 'UE получает Authentication failure',
    goal: 'Отличить security mismatch от отсутствующего профиля',
    scenario: 'auth-fail',
    theory: '<p>Unknown subscriber означает отсутствие IMSI. MAC failure означает: профиль найден, но security calculation не совпало.</p><p>Сверяйте exact IMSI, K, OP/OPc и OP type; ключи не публикуйте в bug report.</p>',
    task: 'По логам AMF и UE определите класс отказа и cause.',
    solution: 'docker compose logs --tail=100 amf ue',
    checks: [
      { type: 'used', re: 'docker\\s+compose\\s+logs.*amf.*ue', why: 'Нужны обе стороны auth flow' },
      { type: 'out', contains: ['Authentication failure', 'MAC failure', 'Registration reject'], why: 'Назовите mismatch и итоговый reject' }
    ],
    hints: ['MAC failure — не unknown IMSI.'],
    mentor: mentor('Точная классификация сужает поиск до test data.', 'IMSI найден, security values не сошлись.', 'Создавать профиль заново вместо сравнения K/OPc.', 'Сравните causes unknown IMSI и bad key.')
  });

  add({
    id: 'd8-upf-incident', day: 8, module: 'Инцидент 4',
    title: 'Регистрация есть, user plane не работает',
    goal: 'Локализовать отказ между SMF, UPF и TUN',
    scenario: 'user-plane-down',
    theory: '<p>RM-REGISTERED с PS-INACTIVE означает: access/mobility path прошёл, session/user plane — нет. Смотрите SMF N4/PFCP и UPF TUN/GTP-U.</p><p>Отсутствующий <code>/dev/net/tun</code> — capability Linux kernel. Его не исправит ожидание TCP-порта.</p>',
    task: 'Получите PDU-state и логи SMF/UPF. Докажите PS-INACTIVE, PFCP timeout и отсутствие TUN.',
    solution: 'docker exec o5g-ue nr-cli imsi-999700000000001 -e ps-list\ndocker compose logs --tail=100 smf upf',
    checks: [
      { type: 'used', re: 'docker\\s+exec\\s+o5g-ue.*ps-list[\\s\\S]*docker\\s+compose\\s+logs.*smf.*upf', why: 'Сопоставьте UE state с N4/UPF' },
      { type: 'anyOut', contains: ['PS-INACTIVE', 'No response from UPF', '/dev/net/tun unavailable'], why: 'Нужны три звена причины' }
    ],
    hints: ['nr-cli ps-list, затем совместные logs SMF/UPF.'],
    mentor: mentor('Это отделяет control-plane success от user-plane failure.', 'PS state → PFCP → TUN/GTP-U.', 'Объявлять всю registration сломанной.', 'Назовите последний успешный и первый failed слой.')
  });

  add({
    id: 'd8-final-shift', day: 8, module: 'Финальный допуск',
    title: 'Рабочая смена: приёмка 5G-стенда',
    goal: 'Самостоятельно собрать end-to-end evidence',
    scenario: 'ok',
    theory: '<p>Приёмка не равна «все контейнеры Up». Она доказывает NF readiness, регистрацию UE, активную PDU session и зелёный автоматизированный набор.</p><div class="note warn"><b>Допуск:</b> выполните без решения, повторите через день и пройдите три экзамена не ниже 8/10.</div>',
    task: 'Без подсказок выполните пять проверок: Compose state, NF registry, UE RM-state, PDU-state и pytest без slow.',
    solution: 'docker compose ps --all\ncurl --http2-prior-knowledge http://nrf:7777/nnrf-nfm/v1/nf-instances\ndocker exec o5g-ue nr-cli imsi-999700000000001 -e status\ndocker exec o5g-ue nr-cli imsi-999700000000001 -e ps-list\npytest -m "not slow"',
    checks: [
      { type: 'used', re: 'docker\\s+compose\\s+ps[\\s\\S]*curl.*nnrf-nfm[\\s\\S]*nr-cli.*status[\\s\\S]*nr-cli.*ps-list[\\s\\S]*pytest\\s+-m', why: 'Нужны пять слоёв в порядке приёмки' },
      { type: 'anyOut', contains: ['o5g-amf', 'NSSF', 'RM-REGISTERED', 'PS-ACTIVE', '39 passed'], why: 'Не хватает end-to-end evidence' }
    ],
    hints: ['Составьте чек-лист до первой команды.', 'Infrastructure → NF → registration → PDU → tests.'],
    mentor: mentor('Это доказательство самостоятельной приёмки.', 'State → NF → UE → user plane → report.', 'Подменить E2E одним healthcheck.', 'Дайте краткий release verdict с рисками.'),
    quiz: { q: 'Все контейнеры Up. Можно закрыть приёмку?', options: ['Да', 'Нет: нужны NF, UE, PDU/user plane и tests', 'Да, если AMF healthy', 'Да, если NRF 200'], answer: 1, explain: 'Container state — только инфраструктурный слой.' }
  });
})(typeof window !== 'undefined' ? window : globalThis);
