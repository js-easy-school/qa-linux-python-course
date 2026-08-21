/* День 1 — Linux: навигация, файлы, логи, поиск, пайпы. */
(function (root) {
  'use strict';
  var L = root.QALessons = root.QALessons || [];

  L.push(

  {
    id: 'l0-intro',
    day: 1,
    module: 'С чего начать',
    title: 'Как устроен курс и как по нему идти',
    goal: 'Понять план восьми дней, критерий готовности и цикл повторения',
    mode: 'shell',
    theory: `
<p>Курс собран под одну цель: <b>самостоятельно пройти техническое собеседование и начать работать QA automation с функциями 5G Core</b>. Здесь недостаточно один раз увидеть правильный ответ — навык нужно воспроизвести в другом подходе.</p>
<table class="tbl">
<tr><th>День</th><th>Тема</th><th>Что вы будете уметь к вечеру</th></tr>
<tr><td>1</td><td>Linux: файлы, логи, поиск</td><td>найти причину в логе, посчитать ошибки, собрать выжимку в файл</td></tr>
<tr><td>2</td><td>Процессы, службы, сеть</td><td>разобрать инцидент «сервис не отвечает» до причины и починить</td></tr>
<tr><td>3</td><td>Python руками</td><td>писать скрипты без ИИ: строки, словари, файлы, JSON, регулярки</td></tr>
<tr><td>4</td><td>Тесты API и pytest</td><td>написать набор автотестов по спецификации — это ваш проект в портфолио</td></tr>
<tr><td>5</td><td>Docker Compose и CI</td><td>разворачивать стенд, читать state/logs/inspect и строить быстрые quality gates</td></tr>
<tr><td>6</td><td>Архитектура 5G SA</td><td>объяснить NRF, AMF, SMF, UPF, NGAP/SCTP, PFCP и GTP-U</td></tr>
<tr><td>7</td><td>Данные, BDD и пакеты</td><td>изолировать test data, исполнять Gherkin и собирать packet evidence</td></tr>
<tr><td>8</td><td>Рабочая смена</td><td>самостоятельно провести RCA четырёх инцидентов и приёмку стенда</td></tr>
</table>
<h4>Четыре правила</h4>
<ol>
<li><b>Набирайте руками.</b> Копирование команд ничего не даёт: на собеседовании нужно вспомнить самому, без автодополнения.</li>
<li><b>Сначала попытка, потом подсказка.</b> Кнопка «Подсказка» открывает по одной, «Решение» — крайняя мера.</li>
<li><b>Проговаривайте вслух.</b> После каждого задания скажите словами, что вы сделали и почему. На собеседовании вас будут слушать, а не читать ваш экран.</li>
<li><b>Закрепляйте через ↻.</b> «Пройдено» — одна удачная попытка; «закреплено» — минимум две попытки в разные подходы. Ошибки автоматически возвращаются в очередь.</li>
</ol>
<p>Справа — настоящий стенд: файловая система, службы, сеть и HTTP-API учебного узла ядра. Он живой: если вы остановите сервис, запросы перестанут проходить. Каждый урок поднимает стенд заново, так что сломать ничего нельзя.</p>
<p class="note">Кнопка <b>↻</b> запускает повторение без теории и решения. Кнопка <b>🎯</b> — 10 случайных вопросов с таймером. Допуск к собеседованию: 80% закреплённых уроков, финальная смена без решения и три экзамена подряд не ниже 8/10.</p>`,
    task: 'Разомнитесь: наберите в консоли справа <code>help</code>, затем <code>whoami</code> и <code>pwd</code>.',
    checks: [
      { type: 'used', re: '(^|\\n)\\s*help', why: 'Наберите <code>help</code> — увидите список доступных команд' },
      { type: 'used', re: '(^|\\n)\\s*whoami', why: 'Наберите <code>whoami</code>' },
      { type: 'used', re: '(^|\\n)\\s*pwd', why: 'Наберите <code>pwd</code>' }
    ],
    hints: ['Кликните в тёмное поле справа и печатайте. Enter — выполнить, стрелка вверх — предыдущая команда, Tab — дополнить'],
    solution: 'help\nwhoami\npwd',
    praise: 'Стенд ваш. Дальше — по делу.',
    quiz: {
      q: 'Зачем в этом курсе запрещено копировать команды?',
      options: [
        'Чтобы курс дольше проходился',
        'Потому что на собеседовании и на рабочем стенде нужно вспоминать команды самому, без подсказок и автодополнения',
        'Копирование ломает тренажёр',
        'Так принято в обучении'
      ],
      answer: 1,
      explain: 'Навык — это то, что воспроизводится без подсказки. Скопированная команда даёт иллюзию знания, которая рассыпается на первом же вопросе интервьюера.'
    }
  },

  {
    id: 'l1-where',
    day: 1,
    module: 'Ориентация в системе',
    title: 'Где я и что вокруг',
    goal: 'Научиться подтверждать узел, пользователя, рабочий каталог и источник данных',
    mode: 'shell',
    theory: `
<p>Вас пустили на тестовый стенд по SSH. Первое, что делает инженер, — понимает, <b>где он находится</b> и <b>что лежит рядом</b>.</p>
<p class="note"><b>Узел</b> — это конкретный компьютер, сервер или виртуальная машина, на которой выполняются команды. В приглашении <code>qa@core-node:~$</code>: <code>qa</code> — пользователь, <code>core-node</code> — имя узла, <code>~</code> — домашний каталог. На реальном стенде это важно проверить, чтобы случайно не выполнить команду не на том сервере.</p>
<table class="tbl">
<tr><th>Команда</th><th>Что делает</th></tr>
<tr><td><code>hostname</code></td><td>печатает имя текущего узла («на каком сервере я работаю»)</td></tr>
<tr><td><code>whoami</code></td><td>печатает текущего пользователя</td></tr>
<tr><td><code>pwd</code></td><td>печатает текущий каталог («где я»)</td></tr>
<tr><td><code>ls</code></td><td>список файлов в каталоге</td></tr>
<tr><td><code>ls -la</code></td><td>подробно и со скрытыми файлами</td></tr>
<tr><td><code>cd /путь</code></td><td>перейти в каталог, <code>cd ..</code> — на уровень выше, <code>cd</code> — домой</td></tr>
</table>
<p>Разбор строки из <code>ls -l</code>:</p>
<pre class="mini">-rw-r--r-- 1 root root 243 авг 16 09:12 registrar.conf
│└┬┘└┬┘└┬┘   └─┬┘ └─┬┘ └┬┘ └────┬────┘ └──────┬─────┘
│ │  │  │      │    │   │       │             имя
│ │  │  │      │    │   │       дата изменения
│ │  │  │      │    │   размер в байтах
│ │  │  │      │    группа
│ │  │  │      владелец
│ │  │  права остальных
│ │  права группы
│ права владельца (rw- = чтение и запись)
тип: «-» файл, «d» каталог</pre>
<p class="note">На стенде уже развёрнут учебный узел ядра: сервис <code>core-registrar</code>, конфиг в <code>/etc/core/</code>, логи в <code>/var/log/core/</code>. Дальше весь курс идёт вокруг него.</p>`,
    task: 'Подтвердите имя узла командой <code>hostname</code> и пользователя командой <code>whoami</code>. Затем перейдите в <code>/etc/core</code>, подтвердите рабочий каталог через <code>pwd</code> и выведите его содержимое подробно.',
    checks: [
      { type: 'used', re: '(^|\\n)\\s*hostname(\\s|$)', why: 'Сначала подтвердите имя узла командой <code>hostname</code>' },
      { type: 'used', re: '(^|\\n)\\s*whoami(\\s|$)', why: 'Подтвердите текущего пользователя командой <code>whoami</code>' },
      { type: 'used', re: '(^|\\n)\\s*cd\\s+/etc/core', why: 'Не вижу перехода в каталог: нужна команда <code>cd /etc/core</code>' },
      { type: 'used', re: '(^|\\n)\\s*pwd(\\s|$)', why: 'После перехода подтвердите рабочий каталог командой <code>pwd</code>' },
      { type: 'used', re: 'ls\\s+-\\w*l', why: 'Нужен подробный список — <code>ls -l</code> (или <code>ls -la</code>)' },
      { type: 'anyOut', contains: 'registrar.conf', why: 'В выводе не видно файла registrar.conf — вы смотрите не тот каталог' }
    ],
    hints: ['<code>cd /etc/core</code>', 'Потом <code>ls -la</code> — флаг <code>-l</code> даёт подробности, <code>-a</code> показывает скрытые файлы'],
    solution: 'hostname\nwhoami\ncd /etc/core\npwd\nls -la',
    praise: 'Контекст подтверждён: узел core-node, пользователь qa, каталог /etc/core, источник данных — его подробный список.',
    quiz: {
      q: 'В выводе <code>ls -l</code> строка начинается с <code>drwxr-xr-x</code>. Что это?',
      options: ['Файл, доступный всем на запись', 'Каталог: читать и заходить могут все, писать — только владелец', 'Символическая ссылка', 'Файл с правами root на выполнение'],
      answer: 1,
      explain: 'Первый символ «d» — каталог. Дальше три тройки: владелец rwx, группа r-x, остальные r-x. Права на запись есть только у владельца.'
    }
  },

  {
    id: 'l1-read',
    day: 1,
    module: 'Ориентация в системе',
    title: 'Читаем конфиг и лог',
    goal: 'cat, head, tail — и понимание, когда какая нужна',
    mode: 'shell',
    theory: `
<p>Три способа посмотреть файл:</p>
<table class="tbl">
<tr><td><code>cat файл</code></td><td>вывести целиком. Годится для конфига на 20 строк</td></tr>
<tr><td><code>head -n 20 файл</code></td><td>первые 20 строк</td></tr>
<tr><td><code>tail -n 20 файл</code></td><td><b>последние</b> 20 строк — так смотрят логи</td></tr>
<tr><td><code>tail -f файл</code></td><td>следить за дописыванием в реальном времени</td></tr>
</table>
<p>Логи читают с конца: свежие события внизу. Именно поэтому <code>tail</code> — самая частая команда тестировщика: выполнил действие, посмотрел хвост лога, увидел, что записал сервис.</p>
<p class="note warn"><b>Не делайте <code>cat</code> на большом логе.</b> Файл на гигабайт вывалится в консоль целиком, и вы потеряете всё, что было на экране. Для больших файлов — <code>tail</code>, <code>head</code> или <code>less</code>.</p>`,
    task: 'Выведите весь конфиг <code>/etc/core/registrar.conf</code>, а затем — последние 5 строк лога <code>/var/log/core/registrar.log</code>.',
    checks: [
      { type: 'used', re: 'cat\\s+.*registrar\\.conf', why: 'Конфиг целиком показывает <code>cat</code>' },
      { type: 'used', re: 'tail\\s+-n\\s*5|tail\\s+-5', why: 'Нужны именно последние 5 строк: <code>tail -n 5 файл</code>' },
      { type: 'anyOut', contains: 'listen_port', why: 'В выводе нет содержимого конфига' },
      { type: 'out', contains: '2026-08-16', why: 'Последняя команда должна показать строки лога' }
    ],
    hints: ['<code>cat /etc/core/registrar.conf</code>', '<code>tail -n 5 /var/log/core/registrar.log</code>'],
    solution: 'cat /etc/core/registrar.conf\ntail -n 5 /var/log/core/registrar.log',
    quiz: {
      q: 'Сервис пишет лог, который растёт по 200 МБ в час. Вам нужно увидеть, что происходит прямо сейчас. Что запустите?',
      options: ['cat /var/log/core/registrar.log', 'tail -f /var/log/core/registrar.log', 'head -n 100 /var/log/core/registrar.log', 'ls -l /var/log/core/'],
      answer: 1,
      explain: 'tail -f показывает конец файла и продолжает выводить новые строки. cat на таком файле забьёт терминал, head покажет самое старое.'
    }
  },

  {
    id: 'l1-grep',
    day: 1,
    module: 'Поиск в логах',
    title: 'grep: найти ошибку среди тысяч строк',
    goal: 'Главный навык QA на Linux — вытащить нужные строки из лога',
    mode: 'shell',
    theory: `
<p><code>grep</code> печатает строки, подходящие под шаблон:</p>
<pre class="mini">grep ERROR /var/log/core/registrar.log</pre>
<table class="tbl">
<tr><th>Флаг</th><th>Смысл</th><th>Когда нужен</th></tr>
<tr><td><code>-i</code></td><td>без учёта регистра</td><td>error, Error, ERROR в одном логе</td></tr>
<tr><td><code>-n</code></td><td>показать номера строк</td><td>чтобы сослаться на строку в баг-репорте</td></tr>
<tr><td><code>-c</code></td><td>только количество</td><td>«сколько раз упало»</td></tr>
<tr><td><code>-v</code></td><td>инвертировать: всё, <b>кроме</b> шаблона</td><td>убрать шум INFO</td></tr>
<tr><td><code>-r</code></td><td>рекурсивно по каталогу</td><td>не знаете, в каком файле искать</td></tr>
</table>
<p>Шаблон — это регулярное выражение: <code>grep "ERROR|FATAL"</code> найдёт оба слова, точка означает любой символ, <code>^</code> — начало строки, <code>$</code> — конец.</p>
<p class="note">В баг-репорте всегда указывайте <b>номер строки и точный текст</b> ошибки. Формулировка «в логах что-то про базу» разработчику не поможет.</p>`,
    task: 'Найдите в логе <code>/var/log/core/registrar.log</code> все строки с ошибками (<code>ERROR</code>) вместе с номерами строк.',
    checks: [
      { type: 'used', re: 'grep\\s+(-\\w+\\s+)*-?\\w*n\\w*\\s+.*ERROR|grep\\s+-\\w*n\\w*\\s+ERROR', why: 'Нужен grep с флагом <code>-n</code>, чтобы видеть номера строк' },
      { type: 'out', contains: ['ERROR', ':'], why: 'В выводе должны быть строки ERROR с номерами' },
      { type: 'out', contains: 'unknown subscriber', why: 'Похоже, найдены не все строки ERROR — проверьте файл и шаблон' }
    ],
    hints: ['<code>grep -n ERROR /var/log/core/registrar.log</code>', 'Флаги можно объединять: <code>grep -in</code> — без учёта регистра и с номерами'],
    solution: 'grep -n ERROR /var/log/core/registrar.log',
    quiz: {
      q: 'Нужно посчитать, сколько раз за сутки сервис писал «timeout», не выводя сами строки. Как?',
      options: ['grep timeout log | wc -c', 'grep -c timeout log', 'grep -v timeout log', 'cat log | grep -n timeout'],
      answer: 1,
      explain: 'grep -c печатает количество подошедших строк. Вариант с wc -c посчитал бы байты, а не строки (правильно было бы wc -l).'
    }
  },

  {
    id: 'l1-grep2',
    day: 1,
    module: 'Поиск в логах',
    title: 'Контекст вокруг ошибки',
    goal: 'Понять, что происходило до и после сбоя',
    mode: 'shell',
    theory: `
<p>Одна строка ошибки редко объясняет причину. Нужен <b>контекст</b>:</p>
<table class="tbl">
<tr><td><code>grep -A 3 ERROR файл</code></td><td>строка + 3 <b>после</b> (After)</td></tr>
<tr><td><code>grep -B 3 ERROR файл</code></td><td>строка + 3 <b>до</b> (Before)</td></tr>
<tr><td><code>grep -C 2 ERROR файл</code></td><td>по 2 с каждой стороны (Context)</td></tr>
</table>
<p>Типичный сценарий на работе: сервис ответил ошибкой в 09:06. Смотрим <code>-B 3</code> — и видим, что за секунду до этого был таймаут базы. Причина не в самом запросе, а в БД. Это и есть <b>локализация дефекта</b>: понять, чей это баг, до того как заводить задачу.</p>
<p>Ещё полезно искать по нескольким словам сразу — через регулярку с вертикальной чертой:</p>
<pre class="mini">grep -E "ERROR|WARN" /var/log/core/registrar.log</pre>`,
    task: 'Покажите строки с <code>database timeout</code> вместе с одной строкой до и одной после — чтобы увидеть, что было вокруг сбоя.',
    checks: [
      { type: 'used', re: 'grep\\s+.*-(A|B|C)\\s*1', why: 'Нужен контекст: флаг <code>-C 1</code> (или пара <code>-A 1 -B 1</code>)' },
      { type: 'used', re: 'timeout', why: 'Ищем именно строки про timeout' },
      { type: 'out', contains: 'database timeout', why: 'В выводе нет строки с таймаутом базы' },
      { type: 'out', contains: 'retry', why: 'Не видно строки, которая идёт после ошибки, — контекст не захвачен' }
    ],
    hints: ['<code>grep -C 1 "database timeout" /var/log/core/registrar.log</code>', 'Кавычки нужны, потому что в шаблоне есть пробел'],
    solution: 'grep -C 1 "database timeout" /var/log/core/registrar.log',
    quiz: {
      q: 'Зачем тестировщику флаг -B (строки до совпадения)?',
      options: ['Чтобы вывод был красивее', 'Чтобы увидеть, что предшествовало ошибке, и понять причину', 'Чтобы ускорить поиск', 'Чтобы искать без учёта регистра'],
      answer: 1,
      explain: 'Причина сбоя почти всегда записана в лог раньше самой ошибки. -B показывает предысторию: таймаут, потерю соединения, неверный конфиг.'
    }
  },

  {
    id: 'l1-pipe',
    day: 1,
    module: 'Пайпы и подсчёт',
    title: 'Пайп: собираем команды в цепочку',
    goal: 'Научиться считать и фильтровать в одну строку',
    mode: 'shell',
    theory: `
<p>Символ <code>|</code> отправляет вывод одной команды на вход другой. Это главное отличие Linux от «кликанья мышкой»: маленькие команды складываются в инструмент под задачу.</p>
<pre class="mini">grep ERROR log | wc -l        <span class="c"># сколько ошибок</span>
cat log | grep imsi | tail -3 <span class="c"># последние 3 строки про imsi</span></pre>
<table class="tbl">
<tr><td><code>wc -l</code></td><td>посчитать строки</td></tr>
<tr><td><code>sort</code></td><td>отсортировать</td></tr>
<tr><td><code>uniq -c</code></td><td>схлопнуть повторы и посчитать (работает только после <code>sort</code>)</td></tr>
<tr><td><code>head</code> / <code>tail</code></td><td>обрезать начало/конец</td></tr>
</table>
<p>Классическая связка «топ повторяющихся значений»:</p>
<pre class="mini">grep ERROR log | sort | uniq -c | sort -rn | head -5</pre>
<p>Читается справа налево по смыслу: взяли ошибки → отсортировали → посчитали одинаковые → отсортировали по числу по убыванию → показали пятёрку.</p>`,
    task: 'Посчитайте одной цепочкой, сколько в логе строк уровня <code>INFO</code>.',
    checks: [
      { type: 'used', re: 'grep[^|]*INFO[^|]*\\|\\s*wc\\s+-l', why: 'Нужна цепочка вида <code>grep INFO файл | wc -l</code>' },
      { type: 'out', re: '^\\s*8\\s*$', why: 'Ожидается 8 строк INFO — проверьте, тот ли файл и тот ли шаблон' }
    ],
    hints: ['<code>grep INFO /var/log/core/registrar.log | wc -l</code>', 'Можно и без пайпа — <code>grep -c INFO файл</code>, но задача именно на цепочку'],
    solution: 'grep INFO /var/log/core/registrar.log | wc -l',
    quiz: {
      q: 'Почему <code>uniq -c</code> почти всегда пишут после <code>sort</code>?',
      options: ['Так быстрее работает', 'uniq схлопывает только соседние одинаковые строки, поэтому их надо сначала собрать рядом', 'Иначе uniq выдаст ошибку', 'Это требование POSIX к порядку флагов'],
      answer: 1,
      explain: 'uniq сравнивает только соседние строки. Без сортировки одинаковые значения, разбросанные по файлу, посчитаются отдельно.'
    }
  },

  {
    id: 'l1-fields',
    day: 1,
    module: 'Пайпы и подсчёт',
    title: 'Вытащить поле: cut и awk',
    goal: 'Достать из строки нужную колонку — IMSI, уровень, код ответа',
    mode: 'shell',
    theory: `
<p>Логи и выгрузки — это таблицы в текстовом виде. Нужную колонку достают двумя инструментами.</p>
<p><b>cut</b> — когда разделитель фиксированный:</p>
<pre class="mini">cut -d";" -f1 /etc/core/subscribers.csv   <span class="c"># первое поле, разделитель «;»</span>
cut -d";" -f1,3 файл                      <span class="c"># поля 1 и 3</span></pre>
<p><b>awk</b> — когда колонки разделены пробелами или нужна фильтрация:</p>
<pre class="mini">awk '{print $3}' log            <span class="c"># третье слово каждой строки</span>
awk '/ERROR/ {print $1, $2}' log <span class="c"># дата и время только у строк с ERROR</span></pre>
<p>В awk <code>$1</code> — первая колонка, <code>$0</code> — вся строка. Программа пишется в одинарных кавычках, иначе оболочка попытается подставить свои переменные.</p>
<p class="note">Файл <code>/etc/core/subscribers.csv</code> — выгрузка абонентов: <code>imsi;msisdn;status;plan</code>. По таким выгрузкам QA сверяет, что API отвечает то же, что лежит в базе.</p>`,
    task: 'Выведите IMSI (первое поле) только тех абонентов, у кого статус <code>active</code>.',
    checks: [
      { type: 'used', re: "awk.*active|grep\\s+active.*(cut|awk)", why: 'Нужно отфильтровать строки со статусом active и взять первое поле' },
      { type: 'out', contains: '250010000000001', why: 'В выводе нет ожидаемых IMSI активных абонентов' },
      { type: 'out', notContains: '250010000000003', why: 'В выводе оказался заблокированный абонент — фильтр по active не сработал' }
    ],
    hints: [
      'Вариант через awk: <code>awk -F";" \'/active/ {print $1}\' /etc/core/subscribers.csv</code>',
      'Вариант через пайп: <code>grep active /etc/core/subscribers.csv | cut -d";" -f1</code>'
    ],
    solution: 'awk -F";" \'/active/ {print $1}\' /etc/core/subscribers.csv',
    quiz: {
      q: 'Чем <code>-F";"</code> в awk отличается от <code>-d";"</code> в cut?',
      options: ['Ничем, это синонимы разных программ для одного и того же — задать разделитель полей', 'awk работает только с пробелами', 'cut умеет фильтровать строки, awk — нет', '-F задаёт формат вывода'],
      answer: 0,
      explain: 'Оба флага задают разделитель. Разница в возможностях: cut просто режет, awk дополнительно умеет фильтровать строки и считать.'
    }
  },

  {
    id: 'l1-find',
    day: 1,
    module: 'Файлы и место',
    title: 'find: где лежит нужный файл',
    goal: 'Искать файлы по имени и размеру, не зная точного пути',
    mode: 'shell',
    theory: `
<p>Полный синтаксис прост: <code>find ГДЕ УСЛОВИЕ</code>.</p>
<pre class="mini">find /var/log -name "*.log"        <span class="c"># по имени, звёздочка — любые символы</span>
find /etc -type f                  <span class="c"># только файлы (d — каталоги)</span>
find /var/log -size +100M          <span class="c"># больше 100 мегабайт</span></pre>
<p>Комбинация условий работает как «и»: <code>find /var/log -type f -name "*.log" -size +1M</code>.</p>
<p>Зачем это тестировщику: на стенде часто не работает запись логов или кончилось место. Первый вопрос — «а что съело диск?». Ответ ищется через <code>find ... -size</code> и <code>du</code>.</p>
<pre class="mini">df -h        <span class="c"># сколько свободно на разделах</span>
du -sh /var/log  <span class="c"># сколько занимает конкретный каталог</span></pre>`,
    task: 'Найдите в <code>/var/log</code> все файлы с расширением <code>.log</code>.',
    checks: [
      { type: 'used', re: 'find\\s+/var/log.*-name', why: 'Нужна команда <code>find /var/log -name "*.log"</code>' },
      { type: 'out', contains: 'registrar.log', why: 'В выводе нет файла registrar.log' }
    ],
    hints: ['<code>find /var/log -name "*.log"</code>', 'Кавычки вокруг <code>*.log</code> обязательны, иначе шаблон раскроет сама оболочка'],
    solution: 'find /var/log -name "*.log"',
    quiz: {
      q: 'На сервере закончилось место. С каких двух команд начнёте?',
      options: ['ls -l и cat', 'df -h и du -sh (сколько свободно и кто занял)', 'ps aux и kill', 'ping и curl'],
      answer: 1,
      explain: 'df -h показывает заполненность разделов, du -sh — сколько весит конкретный каталог. Дальше find -size находит самые крупные файлы.'
    }
  },

  {
    id: 'l1-redirect',
    day: 1,
    module: 'Файлы и место',
    title: 'Перенаправление вывода',
    goal: 'Сохранить результат в файл и отделить ошибки от полезного вывода',
    mode: 'shell',
    theory: `
<p>У каждой команды два потока вывода: обычный (stdout) и ошибок (stderr).</p>
<table class="tbl">
<tr><td><code>команда > файл</code></td><td>записать вывод в файл (перезаписав)</td></tr>
<tr><td><code>команда >> файл</code></td><td>дописать в конец</td></tr>
<tr><td><code>команда 2>/dev/null</code></td><td>выбросить сообщения об ошибках</td></tr>
<tr><td><code>команда | tee файл</code></td><td>и показать на экране, и записать в файл</td></tr>
</table>
<p>Тестировщику это нужно постоянно: приложить к баг-репорту выжимку из лога, сохранить состояние стенда «до» и «после», собрать артефакт для CI.</p>
<pre class="mini">grep ERROR /var/log/core/registrar.log > /home/qa/errors.txt</pre>
<p class="note warn">Одна стрелка <code>></code> <b>затирает</b> файл целиком. Перепутать <code>></code> и <code>>></code> на рабочем сервере — классическая ошибка новичка.</p>`,
    task: 'Соберите все строки <code>ERROR</code> из лога в файл <code>/home/qa/errors.txt</code>, затем убедитесь, что файл создан и в нём есть содержимое.',
    checks: [
      { type: 'used', re: 'grep\\s+.*ERROR.*>\\s*/home/qa/errors\\.txt|grep\\s+.*ERROR.*>\\s*errors\\.txt', why: 'Нужно перенаправить вывод grep в файл через <code>></code>' },
      { type: 'state', fn: function (st) { var c = st.fs.readFile('/home/qa/errors.txt'); return !!c && c.indexOf('ERROR') >= 0; }, why: 'Файл /home/qa/errors.txt пуст или не содержит строк ERROR' },
      { type: 'used', re: 'cat\\s+.*errors\\.txt|less\\s+.*errors\\.txt|tail\\s+.*errors\\.txt', why: 'Проверьте результат — покажите содержимое файла (<code>cat</code>)' }
    ],
    hints: [
      '<code>grep ERROR /var/log/core/registrar.log > /home/qa/errors.txt</code>',
      'Затем <code>cat /home/qa/errors.txt</code>'
    ],
    solution: 'grep ERROR /var/log/core/registrar.log > /home/qa/errors.txt\ncat /home/qa/errors.txt',
    quiz: {
      q: 'Чем <code>2>/dev/null</code> отличается от <code>>/dev/null</code>?',
      options: ['Ничем', 'Первое прячет только ошибки, второе — только обычный вывод', 'Первое удаляет файл', 'Второе работает лишь от root'],
      answer: 1,
      explain: 'Цифра 2 — это поток ошибок (stderr), без цифры подразумевается поток 1 (stdout). /dev/null — «мусорка», куда данные исчезают.'
    }
  },

  {
    id: 'l1-quest',
    day: 1,
    module: 'Итог дня',
    title: 'Мини-расследование по логу',
    goal: 'Собрать вместе grep, пайпы и подсчёт — как на реальной задаче',
    mode: 'shell',
    theory: `
<p>Реальная задача звучит так: «Клиент жалуется, что абонент не может зарегистрироваться. Разберитесь по логам».</p>
<p>Порядок действий у инженера всегда одинаковый:</p>
<ol>
<li>найти в логе строки по этому абоненту (IMSI);</li>
<li>посмотреть, что сервис ответил и почему;</li>
<li>проверить, единичный это случай или системный;</li>
<li>сформулировать вывод фактами, а не догадками.</li>
</ol>
<p>В логе стенда есть абонент <code>250010000000003</code> — на него сервис отвечает отказом. Ваша задача — доказать это по логу.</p>
<p class="note">Хороший ответ инженера звучит так: «В 09:02:03 по IMSI …003 сервис записал <code>subscriber blocked</code>. В выгрузке абонентов у него статус <code>blocked</code>. Это ожидаемое поведение, не дефект». Плохой: «вроде что-то с абонентом».</p>`,
    task: 'Найдите в логе строки по абоненту <code>250010000000003</code> и отдельно проверьте его статус в выгрузке <code>/etc/core/subscribers.csv</code>.',
    checks: [
      { type: 'used', re: 'grep\\s+.*250010000000003.*registrar\\.log', why: 'Сначала найдите строки лога по этому IMSI' },
      { type: 'used', re: 'grep\\s+.*250010000000003.*subscribers\\.csv', why: 'Затем проверьте статус абонента в выгрузке subscribers.csv' },
      { type: 'anyOut', contains: 'subscriber blocked', why: 'В выводе не видно строки лога с причиной отказа' },
      { type: 'anyOut', contains: 'blocked;smart', why: 'Не видно строки из выгрузки, подтверждающей статус абонента' }
    ],
    hints: [
      '<code>grep 250010000000003 /var/log/core/registrar.log</code>',
      '<code>grep 250010000000003 /etc/core/subscribers.csv</code>'
    ],
    solution: 'grep 250010000000003 /var/log/core/registrar.log\ngrep 250010000000003 /etc/core/subscribers.csv',
    praise: 'Это ровно та работа, за которую платят QA: не «не работает», а «вот факт, вот причина, вот ожидаемое поведение».',
    quiz: {
      q: 'Сервис отказал в регистрации абоненту со статусом blocked. Это дефект?',
      options: [
        'Да, любой отказ — это дефект',
        'Нет, если спецификация требует отказывать заблокированным: это ожидаемое поведение, дефектом был бы успешный ответ',
        'Дефект только если клиент недоволен',
        'Нельзя определить по логам'
      ],
      answer: 1,
      explain: 'Дефект — расхождение с требованием, а не сам факт ошибки. Поэтому тест-план и пишут по спецификации: она определяет, какой ответ правильный.'
    }
  }

  );
})(typeof window !== 'undefined' ? window : globalThis);
