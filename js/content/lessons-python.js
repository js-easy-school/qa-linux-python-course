/* День 3 — Python: то, что реально спрашивают у QA и просят написать на собеседовании. */
(function (root) {
  'use strict';
  var L = root.QALessons = root.QALessons || [];

  L.push(

  {
    id: 'p1-basics',
    day: 3,
    module: 'Основы синтаксиса',
    title: 'Переменные, типы, вывод',
    goal: 'Писать простой код без подсказок редактора',
    mode: 'python',
    theory: `
<p>Python не требует объявлять тип — он определяется по значению:</p>
<pre class="mini">imsi = "250010000000001"   <span class="c"># str, строка</span>
port = 8080                <span class="c"># int, целое</span>
timeout = 3.5              <span class="c"># float, дробное</span>
active = True              <span class="c"># bool</span>
session = None             <span class="c"># «значения нет»</span></pre>
<p>Вывод — через <code>print()</code>. Подставлять значения в текст удобнее всего f-строкой: буква <code>f</code> перед кавычками, выражения в фигурных скобках.</p>
<pre class="mini">print(f"абонент {imsi} на порту {port}")
print(f"таймаут {timeout:.1f} c")     <span class="c"># два знака формата: одна цифра после точки</span></pre>
<p>Проверить тип можно так: <code>type(port)</code> вернёт <code>&lt;class 'int'&gt;</code>.</p>
<p class="note warn">Ловушка, которую любят на собеседовании: <code>"8080"</code> и <code>8080</code> — разные вещи. Строка из JSON-ответа не равна числу из конфига, пока вы явно не приведёте тип: <code>int("8080") == 8080</code>.</p>`,
    task: 'Объявите переменные <code>imsi</code> (строка «250010000000001»), <code>port</code> (число 8080) и <code>ok</code> (True). Выведите одной f-строкой текст: <code>абонент 250010000000001, порт 8080, успех True</code>.',
    starter: '# пишите руками, без копирования\n',
    checks: [
      { type: 'noerror', why: 'Программа падает с ошибкой — посмотрите текст ошибки в выводе' },
      { type: 'pyout', contains: 'абонент 250010000000001, порт 8080, успех True', why: 'Точной строки в выводе нет — сверьте текст и порядок значений' },
      { type: 'code', re: 'f["\']', why: 'Используйте именно f-строку, а не склейку через плюс' }
    ],
    hints: [
      'Переменные: <code>imsi = "250010000000001"</code>',
      'Вывод: <code>print(f"абонент {imsi}, порт {port}, успех {ok}")</code>'
    ],
    solution: 'imsi = "250010000000001"\nport = 8080\nok = True\n\nprint(f"абонент {imsi}, порт {port}, успех {ok}")\n',
    quiz: {
      q: 'Что выведет <code>print(type("8080") == type(8080))</code>?',
      options: ['True', 'False', 'ошибку', '8080'],
      answer: 1,
      explain: 'Первое — str, второе — int, типы разные. Отсюда классический баг в тестах: сравнили строку из JSON с числом и получили ложное расхождение.'
    }
  },

  {
    id: 'p2-strings',
    day: 3,
    module: 'Строки',
    title: 'Разбираем строку лога',
    goal: 'Достать из текстовой строки нужные части — базовый навык тестировщика',
    mode: 'python',
    theory: `
<p>Строка лога — это текст, из которого нужно вытащить поля. Инструменты:</p>
<table class="tbl">
<tr><td><code>s.split()</code></td><td>разбить по пробелам в список</td></tr>
<tr><td><code>s.split(";")</code></td><td>разбить по своему разделителю</td></tr>
<tr><td><code>s.strip()</code></td><td>убрать пробелы и перевод строки по краям</td></tr>
<tr><td><code>s.startswith("2026")</code></td><td>проверить начало</td></tr>
<tr><td><code>"ERROR" in s</code></td><td>есть ли подстрока</td></tr>
<tr><td><code>s.upper()</code>, <code>s.replace("a","b")</code></td><td>регистр и замена</td></tr>
<tr><td><code>s[0:4]</code></td><td>срез: символы с 0-го по 3-й</td></tr>
</table>
<pre class="mini">line = "2026-08-16 09:04:55 ERROR imsi=250010000000099 unknown subscriber"
parts = line.split()
print(parts[0])      <span class="c"># 2026-08-16</span>
print(parts[2])      <span class="c"># ERROR</span>
print(parts[3].split("=")[1])   <span class="c"># 250010000000099</span></pre>
<p class="note"><code>split()</code> без аргумента разбивает по любому количеству пробелов — для логов это удобнее, чем <code>split(" ")</code>, который на двойном пробеле даст пустой элемент.</p>`,
    task: 'В переменной <code>line</code> лежит строка лога. Достаньте из неё дату, уровень и IMSI и выведите тремя строками: <code>дата: ...</code>, <code>уровень: ...</code>, <code>imsi: ...</code>.',
    starter: 'line = "2026-08-16 09:04:55 ERROR imsi=250010000000099 unknown subscriber"\n\n# ваш код\n',
    checks: [
      { type: 'noerror', why: 'Программа падает — читайте текст ошибки' },
      { type: 'pyout', contains: ['дата: 2026-08-16', 'уровень: ERROR', 'imsi: 250010000000099'], why: 'В выводе нет всех трёх строк в нужном виде' },
      { type: 'code', re: 'split', why: 'Разберите строку через <code>split()</code>, а не вручную по индексам' }
    ],
    hints: [
      '<code>parts = line.split()</code> — получится список слов',
      'IMSI лежит в куске <code>imsi=250010000000099</code>: разбейте его по <code>=</code> и возьмите второй элемент'
    ],
    solution: 'line = "2026-08-16 09:04:55 ERROR imsi=250010000000099 unknown subscriber"\n\nparts = line.split()\ndate = parts[0]\nlevel = parts[2]\nimsi = parts[3].split("=")[1]\n\nprint(f"дата: {date}")\nprint(f"уровень: {level}")\nprint(f"imsi: {imsi}")\n',
    quiz: {
      q: 'Строка из файла равна <code>"250010000000001\\n"</code>. Сравнение с <code>"250010000000001"</code> даёт False. Почему?',
      options: [
        'Так работает Python со строками',
        'В конце остался символ перевода строки — нужен .strip()',
        'Строки нельзя сравнивать через ==',
        'Нужно приводить к int'
      ],
      answer: 1,
      explain: 'При чтении файла строки приходят с \\n на конце. Забытый strip() — источник «мистических» падений тестов, где глазами всё совпадает.'
    }
  },

  {
    id: 'p3-lists',
    day: 3,
    module: 'Списки и циклы',
    title: 'Списки и цикл for',
    goal: 'Обойти набор данных и посчитать нужное',
    mode: 'python',
    theory: `
<p>Список — упорядоченный набор:</p>
<pre class="mini">codes = [200, 403, 404, 200, 500]
print(len(codes))     <span class="c"># 5 — длина</span>
print(codes[0])       <span class="c"># 200 — первый (нумерация с нуля)</span>
print(codes[-1])      <span class="c"># 500 — последний</span>
codes.append(201)     <span class="c"># добавить в конец</span></pre>
<p>Цикл проходит по элементам:</p>
<pre class="mini">for code in codes:
    if code >= 400:
        print("плохой ответ:", code)</pre>
<p>Тело цикла и условия выделяется <b>отступом</b> в 4 пробела — в Python это часть синтаксиса, а не оформление.</p>
<p>Часто нужен счётчик:</p>
<pre class="mini">errors = 0
for code in codes:
    if code >= 400:
        errors += 1
print(f"ошибок: {errors} из {len(codes)}")</pre>
<p class="note">Тот же результат в одну строку даёт генератор списка: <code>len([c for c in codes if c >= 400])</code>. На собеседовании полезно знать оба способа и уметь объяснить, что генератор — это цикл, записанный компактно.</p>`,
    task: 'В списке <code>codes</code> — коды ответов сервиса. Посчитайте, сколько из них успешные (200) и сколько ошибочные (400 и выше). Выведите: <code>успешных: N</code> и <code>ошибок: M</code>.',
    starter: 'codes = [200, 403, 200, 404, 200, 503, 200, 500]\n\n# ваш код\n',
    checks: [
      { type: 'noerror', why: 'Программа падает — читайте ошибку' },
      { type: 'pyout', contains: ['успешных: 4', 'ошибок: 4'], why: 'Ожидались строки «успешных: 4» и «ошибок: 4»' },
      { type: 'code', re: 'for\\s+\\w+\\s+in|\\[.*for\\s+\\w+\\s+in', why: 'Нужен обход списка циклом (или генератором списка)' }
    ],
    hints: [
      'Заведите два счётчика и увеличивайте их в цикле',
      '<code>if code == 200: ok += 1</code>, <code>elif code >= 400: bad += 1</code>'
    ],
    solution: 'codes = [200, 403, 200, 404, 200, 503, 200, 500]\n\nok = 0\nbad = 0\nfor code in codes:\n    if code == 200:\n        ok += 1\n    elif code >= 400:\n        bad += 1\n\nprint(f"успешных: {ok}")\nprint(f"ошибок: {bad}")\n',
    quiz: {
      q: 'Что произойдёт при обращении <code>codes[10]</code>, если в списке 8 элементов?',
      options: ['Вернётся None', 'Вернётся последний элемент', 'IndexError: list index out of range', 'Список расширится'],
      answer: 2,
      explain: 'Python бросит IndexError. Поэтому в тестах перед обращением к элементу проверяют длину или используют .get() у словарей.'
    }
  },

  {
    id: 'p4-dicts',
    day: 3,
    module: 'Словари',
    title: 'Словари: группировка и подсчёт',
    goal: 'Работать с данными вида ключ-значение — как в JSON-ответе API',
    mode: 'python',
    theory: `
<p>Словарь хранит пары «ключ — значение». Ответ API после разбора JSON — это как раз словарь.</p>
<pre class="mini">sub = {"imsi": "250010000000001", "status": "active", "plan": "smart"}
print(sub["status"])          <span class="c"># active</span>
print(sub.get("msisdn"))      <span class="c"># None — ключа нет, но ошибки тоже нет</span>
print(sub.get("msisdn", "—")) <span class="c"># значение по умолчанию</span>
sub["status"] = "blocked"     <span class="c"># изменить</span></pre>
<p>Обращение через квадратные скобки к несуществующему ключу даёт <code>KeyError</code>, через <code>.get()</code> — <code>None</code>. В тестах чаще берут скобки: если ключа нет, тест обязан упасть.</p>
<p>Подсчёт по категориям — типовая задача «сколько каких уровней в логе»:</p>
<pre class="mini">counts = {}
for level in levels:
    counts[level] = counts.get(level, 0) + 1</pre>
<p>Обход словаря:</p>
<pre class="mini">for key, value in counts.items():
    print(f"{key}: {value}")</pre>`,
    task: 'В списке <code>levels</code> — уровни строк лога. Посчитайте, сколько раз встретился каждый уровень, и выведите по строке на уровень в формате <code>INFO: 4</code>. Порядок вывода — как первое появление уровня в списке.',
    starter: 'levels = ["INFO", "INFO", "WARN", "ERROR", "INFO", "ERROR", "INFO"]\n\n# ваш код\n',
    checks: [
      { type: 'noerror', why: 'Программа падает — читайте ошибку' },
      { type: 'pyout', contains: ['INFO: 4', 'WARN: 1', 'ERROR: 2'], why: 'Ожидались строки «INFO: 4», «WARN: 1», «ERROR: 2»' },
      { type: 'code', re: '\\.get\\(|in\\s+counts|\\.items\\(', why: 'Задача на словарь: используйте dict и его методы' }
    ],
    hints: [
      'Создайте пустой словарь <code>counts = {}</code>',
      'В цикле: <code>counts[level] = counts.get(level, 0) + 1</code>',
      'Затем <code>for key, value in counts.items(): print(f"{key}: {value}")</code>'
    ],
    solution: 'levels = ["INFO", "INFO", "WARN", "ERROR", "INFO", "ERROR", "INFO"]\n\ncounts = {}\nfor level in levels:\n    counts[level] = counts.get(level, 0) + 1\n\nfor key, value in counts.items():\n    print(f"{key}: {value}")\n',
    quiz: {
      q: 'В тесте проверяется ответ API: <code>data["session_id"]</code>. Ключа в ответе нет. Что лучше — скобки или .get()?',
      options: [
        'Всегда .get(), чтобы тест не падал',
        'Скобки: отсутствие обязательного поля — это дефект, и тест обязан упасть с понятным KeyError',
        'Разницы нет',
        'Нужно оборачивать в try и молча пропускать'
      ],
      answer: 1,
      explain: 'Тест должен ловить расхождение со спецификацией, а не прятать его. .get() уместен для необязательных полей.'
    }
  },

  {
    id: 'p5-func',
    day: 3,
    module: 'Функции',
    title: 'Функции: выносим повторяющееся',
    goal: 'Написать функцию с параметром и возвратом — и объяснить её вслух',
    mode: 'python',
    theory: `
<p>Функция — именованный кусок кода, который что-то принимает и что-то возвращает:</p>
<pre class="mini">def is_valid_imsi(imsi):
    """IMSI — ровно 15 цифр."""
    return len(imsi) == 15 and imsi.isdigit()

print(is_valid_imsi("250010000000001"))   <span class="c"># True</span>
print(is_valid_imsi("25001"))             <span class="c"># False</span></pre>
<p>Разбор по частям: <code>def</code> — объявление, <code>imsi</code> — параметр, <code>return</code> — возвращаемое значение. Без <code>return</code> функция вернёт <code>None</code>.</p>
<p>Значение по умолчанию:</p>
<pre class="mini">def check(url, timeout=5):
    ...</pre>
<p class="note warn">На собеседовании после «напишите функцию» почти всегда идёт «а что вернёт ваша функция, если передать пустую строку / None / число вместо строки?». Продумайте это заранее — и скажите сами, не дожидаясь вопроса.</p>`,
    task: 'Напишите функцию <code>is_valid_imsi(imsi)</code>, которая возвращает True, если строка состоит ровно из 15 цифр, и False во всех остальных случаях. Проверьте её на трёх значениях из заготовки — вывод должен быть <code>True False False</code>.',
    starter: '# напишите функцию is_valid_imsi\n\nprint(is_valid_imsi("250010000000001"), is_valid_imsi("25001"), is_valid_imsi("25001000000000x"))\n',
    checks: [
      { type: 'noerror', why: 'Программа падает — возможно, функция не объявлена до вызова' },
      { type: 'pyout', contains: 'True False False', why: 'Ожидается вывод «True False False»' },
      { type: 'code', re: 'def\\s+is_valid_imsi\\s*\\(', why: 'Нужна именно функция <code>def is_valid_imsi(imsi)</code>' },
      { type: 'code', re: 'return', why: 'Функция должна возвращать значение через <code>return</code>' }
    ],
    hints: [
      '<code>def is_valid_imsi(imsi):</code> и внутри <code>return ...</code>',
      'Длина: <code>len(imsi) == 15</code>. Только цифры: <code>imsi.isdigit()</code>',
      'Объединить условия: <code>and</code>'
    ],
    solution: 'def is_valid_imsi(imsi):\n    return len(imsi) == 15 and imsi.isdigit()\n\n\nprint(is_valid_imsi("250010000000001"), is_valid_imsi("25001"), is_valid_imsi("25001000000000x"))\n',
    quiz: {
      q: 'Функция без <code>return</code> что вернёт?',
      options: ['0', 'Пустую строку', 'None', 'Ошибку'],
      answer: 2,
      explain: 'Python вернёт None. Отсюда типичная ошибка: функция печатает результат через print вместо return, а тест сравнивает None с ожидаемым значением.'
    }
  },

  {
    id: 'p6-except',
    day: 3,
    module: 'Ошибки',
    title: 'try / except: ошибки под контролем',
    goal: 'Понимать, когда ошибку надо ловить, а когда — дать тесту упасть',
    mode: 'python',
    theory: `
<p>Конструкция:</p>
<pre class="mini">try:
    port = int(value)
except ValueError:
    print("не число:", value)
    port = None</pre>
<p>Частые исключения:</p>
<table class="tbl">
<tr><td><code>ValueError</code></td><td>тип верный, значение — нет: <code>int("80o8")</code></td></tr>
<tr><td><code>TypeError</code></td><td>неверный тип: <code>"порт" + 8080</code></td></tr>
<tr><td><code>KeyError</code></td><td>нет ключа в словаре</td></tr>
<tr><td><code>IndexError</code></td><td>выход за границы списка</td></tr>
<tr><td><code>FileNotFoundError</code></td><td>нет файла</td></tr>
<tr><td><code>ZeroDivisionError</code></td><td>деление на ноль</td></tr>
</table>
<p>Проверить своё условие и явно сообщить об ошибке можно через <code>raise</code>:</p>
<pre class="mini">if not imsi:
    raise ValueError("imsi обязателен")</pre>
<p class="note warn">Голый <code>except:</code> без имени исключения — плохая практика: он проглотит любую ошибку, включая опечатку в вашем же коде, и тест «позеленеет» на сломанном сценарии.</p>`,
    task: 'Пройдите по списку <code>values</code> и для каждого элемента попробуйте превратить его в число. Для успешных выведите <code>ok: 8080</code>, для неудачных — <code>плохое значение: 80o8</code>. Программа не должна падать.',
    starter: 'values = ["8080", "80o8", "5432", ""]\n\n# ваш код\n',
    checks: [
      { type: 'noerror', why: 'Программа всё-таки упала — значит исключение не поймано' },
      { type: 'pyout', contains: ['ok: 8080', 'плохое значение: 80o8', 'ok: 5432'], why: 'Не хватает нужных строк в выводе' },
      { type: 'code', re: 'except\\s+ValueError', why: 'Ловите конкретное исключение <code>ValueError</code>, а не всё подряд' }
    ],
    hints: [
      'Внутри цикла оберните <code>int(v)</code> в <code>try</code>',
      '<code>except ValueError:</code> — и печатайте сообщение о плохом значении'
    ],
    solution: 'values = ["8080", "80o8", "5432", ""]\n\nfor v in values:\n    try:\n        port = int(v)\n        print(f"ok: {port}")\n    except ValueError:\n        print(f"плохое значение: {v}")\n',
    quiz: {
      q: 'В автотесте вы обернули проверку в try/except и в блоке except написали pass. Что не так?',
      options: [
        'Ничего, тест стал стабильнее',
        'Тест перестал проверять: любая ошибка молча проглатывается, и упавший сценарий будет считаться пройденным',
        'except pass запрещён синтаксисом',
        'Так надо делать всегда'
      ],
      answer: 1,
      explain: 'Тест ценен тем, что падает при расхождении. Заглушенные исключения — самый быстрый способ получить «зелёные» тесты, которые ничего не гарантируют.'
    }
  },

  {
    id: 'p7-files',
    day: 3,
    module: 'Файлы',
    title: 'Читаем лог из Python',
    goal: 'Открыть файл, обойти строки, собрать отчёт',
    mode: 'python',
    theory: `
<p>Файлы открывают через <code>with</code> — он гарантированно закроет файл, даже если внутри случится ошибка:</p>
<pre class="mini">with open("/var/log/core/registrar.log") as f:
    for line in f:
        if "ERROR" in line:
            print(line.strip())</pre>
<p>Варианты чтения:</p>
<table class="tbl">
<tr><td><code>f.read()</code></td><td>весь файл одной строкой</td></tr>
<tr><td><code>f.readlines()</code></td><td>список строк</td></tr>
<tr><td><code>for line in f</code></td><td>по одной строке — экономно по памяти</td></tr>
</table>
<p>Запись:</p>
<pre class="mini">with open("/home/qa/report.txt", "w") as f:
    f.write("ошибок: 3\\n")</pre>
<p>Режимы: <code>"r"</code> чтение (по умолчанию), <code>"w"</code> запись с очисткой, <code>"a"</code> дозапись.</p>
<p class="note">Тот же принцип, что и в консоли: <code>&gt;</code> затирает, <code>&gt;&gt;</code> дописывает. Здесь это <code>"w"</code> и <code>"a"</code>.</p>`,
    task: 'Прочитайте <code>/var/log/core/registrar.log</code>, посчитайте строки с <code>ERROR</code> и с <code>WARN</code>, выведите <code>ERROR: N</code> и <code>WARN: M</code>, а затем запишите обе строки в файл <code>/home/qa/report.txt</code>.',
    starter: 'LOG = "/var/log/core/registrar.log"\n\n# ваш код\n',
    checks: [
      { type: 'noerror', why: 'Программа падает — проверьте путь к файлу' },
      { type: 'pyout', contains: ['ERROR: 2', 'WARN: 2'], why: 'Ожидались строки «ERROR: 2» и «WARN: 2»' },
      { type: 'code', re: 'with\\s+open', why: 'Открывайте файл через <code>with open(...)</code>' },
      { type: 'custom', fn: function (ctx) {
        var st = ctx.py && ctx.py.stand;
        var c = st && st.fs.readFile('/home/qa/report.txt');
        return !!c && c.indexOf('ERROR') >= 0;
      }, why: 'Файл /home/qa/report.txt не создан или пуст' }
    ],
    hints: [
      'Считайте так: <code>errors = 0</code>, затем в цикле <code>if "ERROR" in line: errors += 1</code>',
      'Запись: <code>with open("/home/qa/report.txt", "w") as f:</code> и <code>f.write(f"ERROR: {errors}\\n")</code>'
    ],
    solution: 'LOG = "/var/log/core/registrar.log"\n\nerrors = 0\nwarns = 0\n\nwith open(LOG) as f:\n    for line in f:\n        if "ERROR" in line:\n            errors += 1\n        elif "WARN" in line:\n            warns += 1\n\nprint(f"ERROR: {errors}")\nprint(f"WARN: {warns}")\n\nwith open("/home/qa/report.txt", "w") as f:\n    f.write(f"ERROR: {errors}\\n")\n    f.write(f"WARN: {warns}\\n")\n',
    quiz: {
      q: 'Зачем открывать файл через <code>with</code>, а не просто <code>f = open(...)</code>?',
      options: [
        'Так короче',
        'with закроет файл автоматически, даже если внутри блока произойдёт ошибка',
        'open() без with не работает',
        'with ускоряет чтение'
      ],
      answer: 1,
      explain: 'Незакрытые файлы в длинных прогонах приводят к утечке дескрипторов. with — это контекстный менеджер: гарантированное освобождение ресурса.'
    }
  },

  {
    id: 'p8-json',
    day: 3,
    module: 'Данные',
    title: 'JSON: язык, на котором говорят сервисы',
    goal: 'Разбирать ответ сервиса и собирать тело запроса',
    mode: 'python',
    theory: `
<p>JSON — текстовый формат обмена. В Python он превращается в словари и списки:</p>
<pre class="mini">import json

text = '{"status": "registered", "session_id": "sess-1", "plan": "smart"}'
data = json.loads(text)        <span class="c"># строка -> словарь</span>
print(data["status"])          <span class="c"># registered</span>

body = {"imsi": "250010000000001"}
print(json.dumps(body))        <span class="c"># словарь -> строка</span></pre>
<table class="tbl">
<tr><th>JSON</th><th>Python</th></tr>
<tr><td>object <code>{}</code></td><td>dict</td></tr>
<tr><td>array <code>[]</code></td><td>list</td></tr>
<tr><td>string</td><td>str</td></tr>
<tr><td>number</td><td>int / float</td></tr>
<tr><td>true / false</td><td>True / False</td></tr>
<tr><td>null</td><td>None</td></tr>
</table>
<p class="note">Запомните пары loads/dumps: <b>loads</b> — «load string», из строки в объект; <b>dumps</b> — «dump string», обратно. Путаница между ними — частая заминка на собеседовании.</p>`,
    task: 'Разберите JSON из переменной <code>text</code>, выведите <code>сессия: sess-1</code> и <code>тариф: smart</code>. Затем соберите словарь <code>{"imsi": "250010000000001"}</code> и выведите его как JSON-строку.',
    starter: 'import json\n\ntext = \'{"status": "registered", "session_id": "sess-1", "plan": "smart"}\'\n\n# ваш код\n',
    checks: [
      { type: 'noerror', why: 'Программа падает — читайте ошибку' },
      { type: 'pyout', contains: ['сессия: sess-1', 'тариф: smart', '"imsi": "250010000000001"'], why: 'Не хватает строк в выводе: разберите JSON и выведите его обратно строкой' },
      { type: 'code', re: 'json\\.loads', why: 'Разбор строки — через <code>json.loads()</code>' },
      { type: 'code', re: 'json\\.dumps', why: 'Обратное преобразование — через <code>json.dumps()</code>' }
    ],
    hints: [
      '<code>data = json.loads(text)</code>',
      '<code>print(f"сессия: {data[\'session_id\']}")</code>',
      '<code>print(json.dumps({"imsi": "250010000000001"}))</code>'
    ],
    solution: 'import json\n\ntext = \'{"status": "registered", "session_id": "sess-1", "plan": "smart"}\'\n\ndata = json.loads(text)\nprint(f"сессия: {data[\'session_id\']}")\nprint(f"тариф: {data[\'plan\']}")\n\nbody = {"imsi": "250010000000001"}\nprint(json.dumps(body))\n',
    quiz: {
      q: 'Сервис вернул <code>{"count": "5"}</code>, а по спецификации count — число. Тест <code>assert data["count"] == 5</code> падает. Это дефект?',
      options: [
        'Нет, надо поправить тест на строку "5"',
        'Да: тип поля не соответствует спецификации, клиенты будут ломаться на арифметике',
        'Нет, JSON не различает типы',
        'Нужно привести в тесте через int() и забыть'
      ],
      answer: 1,
      explain: 'JSON различает число и строку. Подмена типа — реальный дефект контракта API: клиент, ожидающий число, получит ошибку при вычислениях или сортировке.'
    }
  },

  {
    id: 'p9-regex',
    day: 3,
    module: 'Данные',
    title: 'Регулярные выражения по делу',
    goal: 'Вытащить IMSI и коды из текста лога без ручного разбора',
    mode: 'python',
    theory: `
<p>Когда строка неровная, помогает модуль <code>re</code>:</p>
<pre class="mini">import re

line = "2026-08-16 09:04:55 ERROR imsi=250010000000099 unknown subscriber"
m = re.search(r"imsi=(\\d+)", line)
if m:
    print(m.group(1))     <span class="c"># 250010000000099</span></pre>
<table class="tbl">
<tr><td><code>\\d</code></td><td>цифра, <code>\\d+</code> — одна и больше</td></tr>
<tr><td><code>\\w</code></td><td>буква, цифра или подчёркивание</td></tr>
<tr><td><code>.</code></td><td>любой символ</td></tr>
<tr><td><code>( )</code></td><td>группа — то, что хотим достать</td></tr>
<tr><td><code>^ $</code></td><td>начало и конец строки</td></tr>
</table>
<table class="tbl">
<tr><td><code>re.search</code></td><td>найти первое совпадение</td></tr>
<tr><td><code>re.findall</code></td><td>найти все — вернёт список</td></tr>
<tr><td><code>re.sub</code></td><td>заменить</td></tr>
</table>
<p>Префикс <code>r"..."</code> перед шаблоном означает «сырая строка»: обратные слэши не надо экранировать дважды.</p>
<p class="note warn">Регулярка — не всегда лучший инструмент. Если формат стабильный, <code>split()</code> читается проще и работает быстрее. Правило: регулярки для нерегулярного текста.</p>`,
    task: 'Из текста лога достаньте все IMSI (шаблон <code>imsi=</code> и цифры) и выведите: <code>найдено IMSI: 3</code>, а следующей строкой — уникальные значения через запятую в порядке появления.',
    starter: 'import re\n\ntext = """2026-08-16 09:01:12 INFO imsi=250010000000001 registration successful\n2026-08-16 09:02:03 WARN imsi=250010000000003 subscriber blocked\n2026-08-16 09:04:55 ERROR imsi=250010000000099 unknown subscriber\n2026-08-16 09:05:31 INFO imsi=250010000000001 session released"""\n\n# ваш код\n',
    checks: [
      { type: 'noerror', why: 'Программа падает — читайте ошибку' },
      { type: 'pyout', contains: 'найдено IMSI: 3', why: 'Ожидается строка «найдено IMSI: 3» (уникальных значений три)' },
      { type: 'pyout', contains: '250010000000001, 250010000000003, 250010000000099', why: 'Ожидается перечисление уникальных IMSI через запятую в порядке появления' },
      { type: 'code', re: 're\\.(findall|search|finditer)', why: 'Используйте модуль <code>re</code>' }
    ],
    hints: [
      '<code>found = re.findall(r"imsi=(\\d+)", text)</code>',
      'Уникальные с сохранением порядка: заведите пустой список и добавляйте только те, которых там ещё нет',
      'Вывод: <code>", ".join(unique)</code>'
    ],
    solution: 'import re\n\ntext = """2026-08-16 09:01:12 INFO imsi=250010000000001 registration successful\n2026-08-16 09:02:03 WARN imsi=250010000000003 subscriber blocked\n2026-08-16 09:04:55 ERROR imsi=250010000000099 unknown subscriber\n2026-08-16 09:05:31 INFO imsi=250010000000001 session released"""\n\nfound = re.findall(r"imsi=(\\d+)", text)\n\nunique = []\nfor imsi in found:\n    if imsi not in unique:\n        unique.append(imsi)\n\nprint(f"найдено IMSI: {len(unique)}")\nprint(", ".join(unique))\n',
    quiz: {
      q: 'Чем <code>re.search</code> отличается от <code>re.match</code>?',
      options: [
        'Ничем',
        'search ищет по всей строке, match — только с самого начала строки',
        'match быстрее',
        'search работает только с цифрами'
      ],
      answer: 1,
      explain: 'match привязан к началу строки. Если шаблон должен встретиться где угодно — нужен search, иначе получите ложные «не найдено».'
    }
  },

  {
    id: 'p10-subprocess',
    day: 3,
    module: 'Итог дня',
    title: 'Python дёргает консоль: subprocess',
    goal: 'Соединить два навыка: скрипт проверяет состояние стенда командами Linux',
    mode: 'python',
    scenario: 'ok',
    theory: `
<p>Автотесты инфраструктуры часто должны выполнить команду на стенде и разобрать её вывод. Для этого есть <code>subprocess</code>:</p>
<pre class="mini">import subprocess

r = subprocess.run(["systemctl", "is-active", "core-registrar"],
                   capture_output=True, text=True)
print(r.returncode)      <span class="c"># 0 — команда успешна</span>
print(r.stdout.strip())  <span class="c"># active</span></pre>
<p>Что важно проверять:</p>
<ul>
<li><b>returncode</b> — 0 успех, всё остальное ошибка;</li>
<li><b>stdout</b> — вывод, почти всегда нужен <code>.strip()</code>;</li>
<li>команду передают <b>списком аргументов</b>, а не одной строкой — так безопаснее.</li>
</ul>
<p>Это и есть мостик между двумя днями курса: то, что вы вчера набирали руками, сегодня делает скрипт, а завтра — pytest в CI.</p>`,
    task: 'Напишите проверку стенда: получите состояние службы <code>core-registrar</code> через <code>systemctl is-active</code> и количество строк ERROR в логе через <code>grep -c ERROR /var/log/core/registrar.log</code>. Выведите <code>служба: active</code> и <code>ошибок в логе: 2</code>.',
    starter: 'import subprocess\n\n# ваш код\n',
    checks: [
      { type: 'noerror', why: 'Программа падает — читайте ошибку' },
      { type: 'pyout', contains: ['служба: active', 'ошибок в логе: 2'], why: 'Ожидались строки «служба: active» и «ошибок в логе: 2»' },
      { type: 'code', re: 'subprocess\\.(run|getoutput|check_output)', why: 'Команды нужно выполнять через модуль <code>subprocess</code>' },
      { type: 'code', re: 'strip\\(', why: 'Уберите перевод строки в конце вывода командой <code>.strip()</code>' }
    ],
    hints: [
      '<code>r = subprocess.run(["systemctl", "is-active", "core-registrar"], capture_output=True, text=True)</code>',
      'Для grep удобно: <code>subprocess.getoutput("grep -c ERROR /var/log/core/registrar.log")</code>',
      'Не забудьте <code>.strip()</code> — иначе получите лишний перевод строки'
    ],
    solution: 'import subprocess\n\nr = subprocess.run(["systemctl", "is-active", "core-registrar"], capture_output=True, text=True)\nstatus = r.stdout.strip()\n\nerrors = subprocess.getoutput("grep -c ERROR /var/log/core/registrar.log").strip()\n\nprint(f"служба: {status}")\nprint(f"ошибок в логе: {errors}")\n',
    praise: 'Вы только что написали то, что в реальном проекте называется smoke-проверкой стенда.',
    quiz: {
      q: 'Почему команду в subprocess.run лучше передавать списком <code>["ls", "-l", path]</code>, а не строкой <code>f"ls -l {path}"</code>?',
      options: [
        'Список работает быстрее',
        'Строка с подстановкой открывает дорогу инъекции команд и ломается на пробелах в путях',
        'Список красивее',
        'Строки вообще не поддерживаются'
      ],
      answer: 1,
      explain: 'При запуске строки через оболочку значение переменной может содержать «; rm -rf /» или пробелы. Список аргументов передаётся процессу напрямую, без разбора оболочкой.'
    }
  }

  );
})(typeof window !== 'undefined' ? window : globalThis);
