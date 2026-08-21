/* Вопросы режима собеседования: короткий ответ строкой, проверка по ключевым словам. */
(function (root) {
  'use strict';

  root.QAExam = [
    { topic: 'Linux', q: 'Чем посмотреть последние 50 строк файла лога?', answer: 'tail -n 50 файл', sample: 'tail -n 50 /var/log/core/registrar.log', accept: ['tail\\s+-n?\\s*-?50', 'tail\\s+-50'] },
    { topic: 'Linux', q: 'Как посчитать количество строк со словом ERROR в логе одной командой?', answer: 'grep -c ERROR файл', sample: 'grep -c ERROR /var/log/core/registrar.log', accept: ['grep\\s+-c\\w*\\s+error', 'grep.*error.*\\|\\s*wc\\s+-l'] },
    { topic: 'Linux', q: 'Какой командой посмотреть, какие порты слушает сервер и какими процессами?', answer: 'ss -tulpn (или netstat -tulpn)', sample: 'ss -tulpn', accept: ['ss\\s+-\\w*t\\w*', 'netstat\\s+-\\w*t\\w*', 'lsof\\s+-i'] },
    { topic: 'Linux', q: 'Как узнать, работает ли служба core-registrar прямо сейчас?', answer: 'systemctl status / is-active core-registrar', sample: 'systemctl is-active core-registrar', accept: ['systemctl\\s+(status|is-active)'] },
    { topic: 'Linux', q: 'Где смотреть журнал упавшей службы, если у неё нет своего файла лога?', answer: 'journalctl -u имя_службы', sample: 'journalctl -u core-registrar -n 50', accept: ['journalctl'] },
    { topic: 'Linux', q: 'Диск заполнен. С какой команды начнёте?', answer: 'df -h — посмотреть разделы', sample: 'df -h', accept: ['df'] },
    { topic: 'Linux', q: 'Как найти в /var/log все файлы больше 1 гигабайта?', answer: 'find /var/log -size +1G', sample: 'find /var/log -size +1G', accept: ['find\\s+.*-size\\s*\\+\\s*1\\s*g'] },
    { topic: 'Linux', q: 'Чем отличается > от >> при перенаправлении вывода?', answer: '> перезаписывает файл, >> дописывает в конец', sample: '> перезаписывает, >> дописывает', accept: ['перезап.*допис', 'допис.*перезап', 'затира.*допис'] },
    { topic: 'Linux', q: 'Как показать строки с ошибкой вместе с двумя строками до неё?', answer: 'grep -B 2 ERROR файл', sample: 'grep -B 2 ERROR log', accept: ['grep\\s+.*-b\\s*2', 'grep\\s+.*-c\\s*2'] },
    { topic: 'Linux', q: 'Какая команда покажет процессы и их аргументы запуска?', answer: 'ps aux', sample: 'ps aux | grep registrar', accept: ['ps\\s+(aux|-ef|ax)'] },

    { topic: 'Сети', q: 'На каком уровне модели OSI работает TCP?', answer: '4, транспортный', sample: '4 транспортный', accept: ['\\b4\\b', 'транспорт'] },
    { topic: 'Сети', q: 'На каком уровне OSI работает IP-адресация и маршрутизация?', answer: '3, сетевой', sample: '3 сетевой', accept: ['\\b3\\b', 'сетев'] },
    { topic: 'Сети', q: 'Клиент получает connection refused. Что это означает?', answer: 'Пакет дошёл, но порт никто не слушает (или сервис упал)', sample: 'порт закрыт, никто не слушает', accept: ['не\\s+слуша', 'порт\\s+закрыт', 'сервис\\s+(упал|не\\s+запущен)', 'rst'] },
    { topic: 'Сети', q: 'Клиент получает таймаут вместо refused. Наиболее вероятная причина?', answer: 'Пакеты дропаются фаерволом — ответа нет вообще', sample: 'фаервол дропает пакеты', accept: ['фа[ей]рвол', 'firewall', 'iptables', 'дроп', 'фильтр'] },
    { topic: 'Сети', q: 'Чем отличается 0.0.0.0:8080 от 127.0.0.1:8080 в выводе ss?', answer: '0.0.0.0 — доступен со всех интерфейсов, 127.0.0.1 — только локально', sample: '0.0.0.0 все интерфейсы, 127.0.0.1 только локально', accept: ['все\\s+интерфейс', 'локальн', 'только\\s+с\\s+хоста', 'снаружи\\s+недоступ'] },
    { topic: 'Сети', q: 'Что делает DNS-запрос и какой командой его проверить?', answer: 'Превращает имя в IP; проверяется dig или nslookup', sample: 'имя в ip, dig +short', accept: ['dig', 'nslookup', 'host\\s+\\w'] },
    { topic: 'Сети', q: 'Чем ping отличается от nc -zv host port?', answer: 'ping проверяет доступность узла (ICMP), nc — конкретный TCP-порт', sample: 'ping узел icmp, nc порт tcp', accept: ['icmp.*порт', 'узел.*порт', 'порт.*узел', 'tcp'] },
    { topic: 'Сети', q: 'Какой HTTP-код должен вернуть сервис, если объект не найден?', answer: '404', sample: '404', accept: ['404'] },
    { topic: 'Сети', q: 'Сервис отдаёт 500 вместо 404 на неизвестный объект. Ваша оценка?', answer: 'Дефект: 5xx означает сбой сервера, клиент не отличит ошибку данных от аварии', sample: 'дефект, 5xx это сбой сервера, надо 404', accept: ['дефект', 'баг', 'не\\s+соответств'] },
    { topic: 'Сети', q: 'Какой код возвращают, когда сервис жив, но недоступна его зависимость (база)?', answer: '503', sample: '503', accept: ['503'] },

    { topic: 'Python', q: 'Как в Python превратить строку JSON в словарь?', answer: 'json.loads(text)', sample: 'json.loads(text)', accept: ['json\\.loads', 'loads'] },
    { topic: 'Python', q: 'Обратное преобразование — словарь в строку JSON?', answer: 'json.dumps(obj)', sample: 'json.dumps(obj)', accept: ['json\\.dumps', 'dumps'] },
    { topic: 'Python', q: 'Чем отличается data["key"] от data.get("key")?', answer: 'Скобки бросают KeyError, get возвращает None (или значение по умолчанию)', sample: 'скобки KeyError, get вернёт None', accept: ['keyerror', 'исключен.*none', 'none'] },
    { topic: 'Python', q: 'Почему файл открывают через with open(...)?', answer: 'with гарантированно закроет файл даже при ошибке', sample: 'with закроет файл автоматически даже при исключении', accept: ['закро', 'освобожда', 'контекстн'] },
    { topic: 'Python', q: 'Что вернёт функция без return?', answer: 'None', sample: 'None', accept: ['none', 'ничего', 'нан\\b'] },
    { topic: 'Python', q: 'Чем плох except без указания типа исключения?', answer: 'Проглатывает любые ошибки, включая ошибки самого теста', sample: 'проглатывает все ошибки, тест зеленеет на сломанном коде', accept: ['прогл', 'скрыва', 'любые\\s+ошибк', 'все\\s+ошибк', 'маскир'] },
    { topic: 'Python', q: 'Как достать все IMSI из текста регулярным выражением?', answer: 're.findall(r"imsi=(\\d+)", text)', sample: 're.findall(r"imsi=(\\d+)", text)', accept: ['findall', 're\\.'] },
    { topic: 'Python', q: 'Как из Python выполнить команду Linux и получить её вывод?', answer: 'subprocess.run([...], capture_output=True, text=True)', sample: 'subprocess.run(["ls"], capture_output=True, text=True)', accept: ['subprocess'] },
    { topic: 'Python', q: 'Почему в requests всегда указывают timeout?', answer: 'Иначе зависший сервис остановит прогон навсегда', sample: 'иначе тест зависнет навсегда при зависшем сервисе', accept: ['завис', 'бесконеч', 'вечн', 'блокир'] },

    { topic: 'pytest', q: 'Как называются функции, которые pytest считает тестами?', answer: 'Начинающиеся с test_', sample: 'начинаются с test_', accept: ['test_'] },
    { topic: 'pytest', q: 'Чем полезна фикстура?', answer: 'Общая подготовка и уборка для тестов, выполняется для каждого теста заново', sample: 'подготовка данных и уборка после теста, тесты остаются независимыми', accept: ['подготовк', 'setup', 'уборк', 'teardown', 'независим'] },
    { topic: 'pytest', q: 'Чем parametrize лучше цикла внутри теста?', answer: 'Каждый набор — отдельный тест, видно какой именно упал', sample: 'каждый набор отдельный тест, видно какой упал', accept: ['отдельн', 'видно\\s+как', 'каждый\\s+набор'] },
    { topic: 'pytest', q: 'Как проверить, что функция бросает ValueError?', answer: 'with pytest.raises(ValueError):', sample: 'with pytest.raises(ValueError):', accept: ['raises'] },
    { topic: 'pytest', q: 'Тест упал с DID NOT RAISE. Что это значит?', answer: 'Ожидали исключение, а код его не бросил — валидация не сработала', sample: 'код не бросил ожидаемое исключение, нет валидации', accept: ['не\\s+брос', 'не\\s+возник', 'без\\s+исключ', 'валидац'] },

    { topic: 'Подход QA', q: 'Сервис отказал заблокированному абоненту. Это дефект?', answer: 'Нет, если так требует спецификация — дефект это расхождение с требованием', sample: 'нет, это по спецификации, дефект — расхождение с требованием', accept: ['нет', 'спецификац', 'требован', 'ожидаем'] },
    { topic: 'Подход QA', q: 'Что обязательно должно быть в баг-репорте?', answer: 'Шаги воспроизведения, ожидаемый и фактический результат, окружение, логи', sample: 'шаги воспроизведения, ожидаемый и фактический результат, логи', accept: ['шаг', 'воспроизвед', 'ожидаем', 'фактич'] },
    { topic: 'Подход QA', q: 'Что проверяет тест на идемпотентность?', answer: 'Повторный одинаковый запрос не создаёт дубль и не ломает состояние', sample: 'повторный запрос не создаёт вторую сессию', accept: ['повтор', 'дубл', 'два\\s+раза', 'втор'] },
    { topic: 'Подход QA', q: 'Сервис вернул 200, но записи в базе нет. Ваши действия?', answer: 'Это дефект: проверить лог, воспроизвести, описать с шагами — ответ не соответствует фактическому состоянию', sample: 'дефект, смотрю логи и воспроизвожу, ответ не соответствует состоянию', accept: ['дефект', 'баг', 'лог'] },
    { topic: 'Подход QA', q: 'Зачем в тест-плане трассировка требований?', answer: 'Чтобы каждое требование спецификации было покрыто хотя бы одним тестом', sample: 'каждое требование покрыто хотя бы одним тестом', accept: ['требован', 'покрыт', 'спецификац'] },
    { topic: 'Подход QA', q: 'Что такое flaky-тест и чем он опасен?', answer: 'Нестабильный тест, падающий случайно: команда перестаёт верить прогонам', sample: 'нестабильный тест, падает случайно, ему перестают верить', accept: ['нестабиль', 'случайн', 'то\\s+пада', 'плава']},

    { topic: 'Docker', q: 'Как проверить итоговую Compose-модель до сборки?', answer: 'docker compose config', sample: 'docker compose config --quiet', accept: ['docker\\s+compose\\s+config'] },
    { topic: 'Docker', q: 'Чем Exited отличается от Running + unhealthy?', answer: 'Exited — главный процесс завершён; unhealthy — процесс жив, но healthcheck не проходит', sample: 'exited процесс завершён, unhealthy процесс работает но readiness не проходит', accept: ['exited.*процесс', 'unhealthy.*health', 'заверш.*health'] },
    { topic: 'Docker', q: 'Какая команда покажет exit code контейнера?', answer: 'docker inspect контейнер', sample: 'docker inspect o5g-udm', accept: ['docker\\s+inspect'] },
    { topic: 'CI', q: 'Назовите правильный порядок основных этапов e2e pipeline.', answer: 'validate → build → deploy → readiness → tests → artifacts → teardown', sample: 'validate build deploy readiness tests artifacts teardown', accept: ['valid.*build.*deploy.*test', 'проверк.*сборк.*разв.*тест'] },
    { topic: 'CI', q: 'Почему логи и JUnit собирают при always(), а не только on_success?', answer: 'При падении они нужны для диагностики; on_success потеряет главное доказательство', sample: 'при падении нужны логи и junit для диагностики', accept: ['пад.*лог', 'диагност', 'artifact'] },

    { topic: '5G', q: 'Какова роль NRF?', answer: 'Реестр и discovery сетевых функций по NF profile', sample: 'реестр NF и service discovery', accept: ['реестр', 'registr', 'discover', 'профил'] },
    { topic: '5G', q: 'Какой транспорт и порт использует NGAP между gNB и AMF?', answer: 'SCTP 38412', sample: 'SCTP порт 38412', accept: ['sctp.*38412', '38412.*sctp'] },
    { topic: '5G', q: 'PFCP/N4: между какими NF, какой транспорт и порт?', answer: 'SMF ↔ UPF, UDP 8805', sample: 'SMF UPF UDP 8805', accept: ['smf.*upf.*8805', '8805.*udp'] },
    { topic: '5G', q: 'Что переносит GTP-U и какой у него стандартный UDP-порт?', answer: 'Пользовательский трафик между gNB и UPF, UDP 2152', sample: 'user plane gNB UPF UDP 2152', accept: ['2152', 'gtp'] },
    { topic: '5G', q: 'Доказывает ли RM-REGISTERED работающий user plane?', answer: 'Нет, отдельно проверяют PS-ACTIVE, IP/DNN и фактический трафик', sample: 'нет, нужна PS-ACTIVE PDU session и ping', accept: ['нет.*pdu', 'ps-active', 'user.*plane'] },
    { topic: '5G', q: 'UE зарегистрирован, но PS-INACTIVE. Какие NF и интерфейс проверять?', answer: 'SMF, UPF и N4/PFCP, затем TUN/GTP-U', sample: 'SMF UPF PFCP N4 TUN GTP-U', accept: ['smf.*upf', 'pfcp', 'n4'] },
    { topic: '5G', q: 'Чем unknown subscriber отличается от MAC failure?', answer: 'Unknown — IMSI нет в профилях; MAC failure — профиль найден, но K/OPc не совпали', sample: 'unknown нет IMSI, MAC failure не совпали K или OPc', accept: ['unknown.*imsi', 'mac.*ключ', 'k.*opc'] },
    { topic: '5G', q: 'Почему обычный TCP nc -z не подходит для проверки AMF NGAP?', answer: 'NGAP работает поверх SCTP, а nc проверит TCP и даст ложный отказ', sample: 'NGAP использует SCTP, nc проверяет TCP', accept: ['sctp.*tcp', 'tcp.*sctp'] },
    { topic: 'BDD', q: 'Как проверить, что Gherkin-сценарий реально привязан к pytest?', answer: 'pytest --collect-only должен показать scenario как test item', sample: 'pytest --collect-only показывает сценарий', accept: ['collect-only', 'collection'] },
    { topic: 'RCA', q: 'Чем root cause отличается от симптома «контейнер exited»?', answer: 'Exited — наблюдаемый симптом; root cause объясняет, почему процесс завершился, и подтверждён логом/проверкой', sample: 'exited симптом, причина например неверный путь ключа подтверждена логом', accept: ['симптом.*прич', 'почему.*заверш', 'root'] }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
