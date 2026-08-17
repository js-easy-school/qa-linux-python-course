/* День 4 — тесты API на requests + pytest: ровно то, что просят в вакансии. */
(function (root) {
  'use strict';
  var L = root.QALessons = root.QALessons || [];

  L.push(

  {
    id: 't1-requests',
    day: 4,
    module: 'Запросы из кода',
    title: 'requests: первый запрос к сервису',
    goal: 'Перейти от curl к коду — то же самое, но повторяемо',
    mode: 'python',
    scenario: 'ok',
    theory: `
<p>Вчерашний <code>curl</code> на Python выглядит так:</p>
<pre class="mini">import requests

r = requests.get("http://localhost:8080/health")
print(r.status_code)       <span class="c"># 200</span>
print(r.json())            <span class="c"># словарь из тела ответа</span>
print(r.text)              <span class="c"># тело как строка</span></pre>
<p>POST с телом в JSON:</p>
<pre class="mini">r = requests.post(
    "http://localhost:8080/api/registration",
    json={"imsi": "250010000000001"},
    timeout=5,
)</pre>
<p>Что у ответа полезного: <code>status_code</code>, <code>json()</code>, <code>text</code>, <code>headers</code>, <code>elapsed</code>.</p>
<p class="note warn">Параметр <code>timeout</code> обязателен в каждом запросе. Без него зависший сервис остановит весь прогон тестов: запрос будет ждать вечно, а CI — «висеть». Это первое, что спрашивают, увидев ваш код.</p>`,
    task: 'Сделайте GET на <code>/health</code> и POST-регистрацию абонента <code>250010000000001</code>. Выведите <code>health: 200 ok</code> и <code>регистрация: 200 registered</code> (код и значение поля status).',
    starter: 'import requests\n\nBASE = "http://localhost:8080"\n\n# ваш код\n',
    checks: [
      { type: 'noerror', why: 'Программа падает — читайте ошибку' },
      { type: 'pyout', contains: ['health: 200 ok', 'регистрация: 200 registered'], why: 'Ожидались строки «health: 200 ok» и «регистрация: 200 registered»' },
      { type: 'code', re: 'requests\\.post', why: 'Регистрация выполняется методом POST' },
      { type: 'code', re: 'timeout', why: 'Задайте <code>timeout</code> в запросах — без него тест может зависнуть навсегда' }
    ],
    hints: [
      '<code>r = requests.get(BASE + "/health", timeout=5)</code>',
      '<code>print(f"health: {r.status_code} {r.json()[\'status\']}")</code>',
      '<code>reg = requests.post(BASE + "/api/registration", json={"imsi": "250010000000001"}, timeout=5)</code>'
    ],
    solution: 'import requests\n\nBASE = "http://localhost:8080"\n\nr = requests.get(BASE + "/health", timeout=5)\nprint(f"health: {r.status_code} {r.json()[\'status\']}")\n\nreg = requests.post(BASE + "/api/registration", json={"imsi": "250010000000001"}, timeout=5)\nprint(f"регистрация: {reg.status_code} {reg.json()[\'status\']}")\n',
    quiz: {
      q: 'Почему в автотестах всегда указывают timeout у запроса?',
      options: [
        'Так требует стиль кода',
        'Иначе при зависании сервиса тест будет ждать бесконечно и заблокирует весь прогон в CI',
        'Timeout ускоряет запрос',
        'Без него requests не работает'
      ],
      answer: 1,
      explain: 'Зависший запрос без таймаута — типовая причина «висящего» пайплайна. Тест должен упасть быстро и понятно, а не молчать полчаса.'
    }
  },

  {
    id: 't2-firsttest',
    day: 4,
    module: 'Первые тесты',
    title: 'assert и первый автотест',
    goal: 'Превратить ручную проверку в тест, который можно запускать тысячу раз',
    mode: 'python',
    scenario: 'ok',
    pytest: true,
    theory: `
<p>Тест в pytest — это обычная функция, имя которой начинается с <code>test_</code>, а внутри стоит <code>assert</code>:</p>
<pre class="mini">def test_health_returns_200():
    r = requests.get("http://localhost:8080/health", timeout=5)
    assert r.status_code == 200</pre>
<p><code>assert</code> означает «утверждаю, что». Если условие ложно — тест падает и показывает, какие значения не сошлись.</p>
<p>Хороший тест устроен по схеме <b>подготовка → действие → проверка</b>:</p>
<pre class="mini">def test_active_subscriber_can_register():
    body = {"imsi": "250010000000001"}          <span class="c"># подготовка</span>
    r = requests.post(URL, json=body, timeout=5) <span class="c"># действие</span>
    assert r.status_code == 200                  <span class="c"># проверки</span>
    assert r.json()["status"] == "registered"</pre>
<p>Правила, за которые цепляются на собеседовании:</p>
<ul>
<li>имя теста читается как утверждение: <code>test_blocked_subscriber_gets_403</code>, а не <code>test_1</code>;</li>
<li>один тест — один проверяемый сценарий;</li>
<li>тест не должен зависеть от того, запускали ли до него другие тесты.</li>
</ul>
<p class="note">В этом тренажёре кнопка «Прогнать pytest» делает то же, что команда <code>pytest -v</code> в консоли: собирает функции <code>test_*</code>, выполняет и печатает отчёт.</p>`,
    task: 'Напишите два теста: <code>test_health_returns_200</code> — проверяет код 200 и поле <code>status == "ok"</code>; <code>test_active_subscriber_can_register</code> — регистрирует абонента <code>250010000000001</code> и проверяет код 200 и наличие поля <code>session_id</code>. Запустите их кнопкой «Прогнать pytest».',
    starter: 'import requests\n\nBASE = "http://localhost:8080"\n\n\ndef test_health_returns_200():\n    pass\n\n\ndef test_active_subscriber_can_register():\n    pass\n',
    checks: [
      { type: 'pytest', min: 2, allPass: true, why: 'Нужно два зелёных теста — нажмите «Прогнать pytest» и добейтесь, чтобы оба прошли' },
      { type: 'code', re: 'assert\\s+.*status_code\\s*==\\s*200', why: 'Проверьте код ответа через <code>assert</code>' },
      { type: 'code', re: 'session_id', why: 'Во втором тесте проверьте наличие session_id в ответе' },
      { type: 'code', re: 'def\\s+test_health_returns_200', why: 'Сохраните имя теста <code>test_health_returns_200</code>' }
    ],
    hints: [
      'Внутри теста: <code>r = requests.get(BASE + "/health", timeout=5)</code>, затем <code>assert r.status_code == 200</code>',
      'Проверка поля: <code>assert r.json()["status"] == "ok"</code>',
      'Наличие ключа: <code>assert "session_id" in r.json()</code>'
    ],
    solution: 'import requests\n\nBASE = "http://localhost:8080"\n\n\ndef test_health_returns_200():\n    r = requests.get(BASE + "/health", timeout=5)\n    assert r.status_code == 200\n    assert r.json()["status"] == "ok"\n\n\ndef test_active_subscriber_can_register():\n    r = requests.post(BASE + "/api/registration", json={"imsi": "250010000000001"}, timeout=5)\n    assert r.status_code == 200\n    assert "session_id" in r.json()\n',
    quiz: {
      q: 'Тест упал с сообщением <code>assert 404 == 200</code>. Что это значит?',
      options: [
        'Сломан pytest',
        'Сервис вернул 404 там, где тест ожидал 200 — дальше надо смотреть URL, данные и логи сервиса',
        'Ошибка в синтаксисе assert',
        'Тест написан неправильно'
      ],
      answer: 1,
      explain: 'pytest показывает фактические значения слева и справа от сравнения. Это первое, что читают при разборе падения.'
    }
  },

  {
    id: 't3-negative',
    day: 4,
    module: 'Первые тесты',
    title: 'Негативные сценарии',
    goal: 'Проверять не только «хорошую погоду» — там и живут дефекты',
    mode: 'python',
    scenario: 'ok',
    pytest: true,
    theory: `
<p>Позитивный тест доказывает, что функция работает. Ценность QA — в негативных: что будет, если данные неверные, объекта нет, сосед недоступен.</p>
<p>Для сервиса регистрации по спецификации:</p>
<table class="tbl">
<tr><th>Ситуация</th><th>Ожидаемый ответ</th></tr>
<tr><td>активный абонент</td><td>200, status = registered</td></tr>
<tr><td>заблокированный абонент</td><td>403, error = subscriber blocked</td></tr>
<tr><td>неизвестный абонент</td><td>404, error = unknown subscriber</td></tr>
<tr><td>IMSI не передан</td><td>400, error = imsi is required</td></tr>
<tr><td>IMSI неверного формата</td><td>400, error = invalid imsi format</td></tr>
</table>
<p>Именно такая таблица и есть заготовка тест-плана: слева условие, справа ожидаемый результат из спецификации. Тесты потом пишутся построчно по ней.</p>
<p class="note">Обратите внимание: 403 и 404 различаются смыслом. «Абонент есть, но заблокирован» и «абонента нет» — разные ситуации, и клиент должен уметь их различить.</p>`,
    task: 'Напишите три негативных теста по таблице: заблокированный (<code>250010000000003</code>) → 403, неизвестный (<code>250010000000099</code>) → 404, пустое тело <code>{}</code> → 400. В каждом проверьте и код, и текст поля <code>error</code>.',
    starter: 'import requests\n\nBASE = "http://localhost:8080"\nURL = BASE + "/api/registration"\n\n\ndef test_blocked_subscriber_gets_403():\n    pass\n\n\ndef test_unknown_subscriber_gets_404():\n    pass\n\n\ndef test_missing_imsi_gets_400():\n    pass\n',
    checks: [
      { type: 'pytest', min: 3, allPass: true, why: 'Нужны три зелёных теста — прогоните pytest' },
      { type: 'code', re: '403', why: 'Проверьте код 403 для заблокированного абонента' },
      { type: 'code', re: '404', why: 'Проверьте код 404 для неизвестного абонента' },
      { type: 'code', re: '400', why: 'Проверьте код 400 при отсутствии IMSI' },
      { type: 'code', re: '\\["error"\\]|\\[\'error\'\\]', why: 'Проверяйте не только код, но и текст ошибки в поле error' }
    ],
    hints: [
      '<code>r = requests.post(URL, json={"imsi": "250010000000003"}, timeout=5)</code>',
      '<code>assert r.status_code == 403</code> и <code>assert r.json()["error"] == "subscriber blocked"</code>',
      'Пустое тело: <code>json={}</code>'
    ],
    solution: 'import requests\n\nBASE = "http://localhost:8080"\nURL = BASE + "/api/registration"\n\n\ndef test_blocked_subscriber_gets_403():\n    r = requests.post(URL, json={"imsi": "250010000000003"}, timeout=5)\n    assert r.status_code == 403\n    assert r.json()["error"] == "subscriber blocked"\n\n\ndef test_unknown_subscriber_gets_404():\n    r = requests.post(URL, json={"imsi": "250010000000099"}, timeout=5)\n    assert r.status_code == 404\n    assert r.json()["error"] == "unknown subscriber"\n\n\ndef test_missing_imsi_gets_400():\n    r = requests.post(URL, json={}, timeout=5)\n    assert r.status_code == 400\n    assert r.json()["error"] == "imsi is required"\n',
    quiz: {
      q: 'Какое соотношение позитивных и негативных тестов ближе к практике?',
      options: [
        'Только позитивные — негативные пишет разработчик',
        'Негативных обычно больше: у одного успешного пути десятки способов сломаться',
        'Строго один к одному',
        'Негативные не нужны, если есть мониторинг'
      ],
      answer: 1,
      explain: 'Успешный сценарий один, а вариантов «что-то не так» — множество: неверные данные, отсутствующие поля, отказ зависимости, дубли, гонки. Там и находится большинство дефектов.'
    }
  },

  {
    id: 't4-fixture',
    day: 4,
    module: 'Инструменты pytest',
    title: 'Фикстуры: подготовка без копипасты',
    goal: 'Вынести общую подготовку из тестов',
    mode: 'python',
    scenario: 'ok',
    pytest: true,
    theory: `
<p>Когда в каждом тесте повторяется одно и то же — адрес сервиса, тестовые данные, подключение — это выносят в <b>фикстуру</b>:</p>
<pre class="mini">import pytest

@pytest.fixture
def base_url():
    return "http://localhost:8080"


def test_health(base_url):
    r = requests.get(base_url + "/health", timeout=5)
    assert r.status_code == 200</pre>
<p>Как это работает: pytest видит у теста параметр <code>base_url</code>, находит фикстуру с таким именем, вызывает её и подставляет результат. Ничего вызывать вручную не нужно.</p>
<p>Фикстуры бывают сложнее: создать абонента перед тестом и удалить после, поднять контейнер, открыть соединение с базой. Тогда используют <code>yield</code>: до него — подготовка, после — уборка.</p>
<p class="note">Вопрос с собеседования: «зачем фикстуры, если можно завести глобальную переменную?». Ответ: фикстура выполняется для каждого теста заново и умеет убирать за собой, поэтому тесты остаются независимыми.</p>`,
    task: 'Заведите фикстуру <code>api</code>, возвращающую базовый адрес, и фикстуру <code>active_imsi</code> со значением <code>"250010000000001"</code>. Напишите два теста, использующих их: проверку <code>/health</code> и успешную регистрацию.',
    starter: 'import pytest\nimport requests\n\n\n@pytest.fixture\ndef api():\n    return "http://localhost:8080"\n\n\n# добавьте фикстуру active_imsi и два теста\n',
    checks: [
      { type: 'pytest', min: 2, allPass: true, why: 'Нужны два зелёных теста' },
      { type: 'code', re: '@pytest\\.fixture[\\s\\S]*def\\s+active_imsi', why: 'Не вижу фикстуры <code>active_imsi</code>' },
      { type: 'code', re: 'def\\s+test_\\w+\\([^)]*api', why: 'Тесты должны принимать фикстуру <code>api</code> параметром' },
      { type: 'code', re: 'def\\s+test_\\w+\\([^)]*active_imsi', why: 'Хотя бы один тест должен использовать фикстуру <code>active_imsi</code>' }
    ],
    hints: [
      'Фикстура — обычная функция с декоратором: <code>@pytest.fixture</code> и <code>def active_imsi(): return "250010000000001"</code>',
      'Тест берёт её так: <code>def test_registration(api, active_imsi):</code>'
    ],
    solution: 'import pytest\nimport requests\n\n\n@pytest.fixture\ndef api():\n    return "http://localhost:8080"\n\n\n@pytest.fixture\ndef active_imsi():\n    return "250010000000001"\n\n\ndef test_health_ok(api):\n    r = requests.get(api + "/health", timeout=5)\n    assert r.status_code == 200\n\n\ndef test_registration_ok(api, active_imsi):\n    r = requests.post(api + "/api/registration", json={"imsi": active_imsi}, timeout=5)\n    assert r.status_code == 200\n    assert r.json()["status"] == "registered"\n',
    quiz: {
      q: 'Что делает <code>yield</code> в фикстуре?',
      options: [
        'Ускоряет тест',
        'Разделяет подготовку и уборку: код до yield выполняется перед тестом, после — когда тест закончился',
        'Возвращает несколько значений подряд',
        'Помечает фикстуру как необязательную'
      ],
      answer: 1,
      explain: 'Это и есть механизм teardown: создать тестового абонента до теста и удалить после, чтобы следующий прогон стартовал с чистого стенда.'
    }
  },

  {
    id: 't5-parametrize',
    day: 4,
    module: 'Инструменты pytest',
    title: 'parametrize: таблица вместо копий',
    goal: 'Один тест — много наборов данных',
    mode: 'python',
    scenario: 'ok',
    pytest: true,
    theory: `
<p>Три почти одинаковых теста из прошлого урока сворачиваются в один:</p>
<pre class="mini">@pytest.mark.parametrize("imsi,expected", [
    ("250010000000001", 200),
    ("250010000000003", 403),
    ("250010000000099", 404),
])
def test_registration_status(api, imsi, expected):
    r = requests.post(api + "/api/registration", json={"imsi": imsi}, timeout=5)
    assert r.status_code == expected</pre>
<p>pytest выполнит тест трижды и покажет каждый набор отдельной строкой отчёта. Упадёт один набор — остальные всё равно отработают, и вы увидите ровно то значение, на котором сломалось.</p>
<p>Первая строка декоратора — имена параметров через запятую, вторая — список наборов. Порядок значений в кортеже совпадает с порядком имён.</p>
<p class="note">Это прямой мостик к Gherkin-сценариям, которые указаны в вакансии: там такая же таблица примеров (<code>Examples</code>) под шагами <code>Given/When/Then</code>. Идея одна — отделить данные от логики проверки.</p>`,
    task: 'Сверните проверку кодов ответа в один параметризованный тест на четыре набора: активный → 200, заблокированный (<code>...003</code>) → 403, приостановленный (<code>250010000000005</code>) → 403, неизвестный (<code>...099</code>) → 404.',
    starter: 'import pytest\nimport requests\n\nURL = "http://localhost:8080/api/registration"\n\n\n# параметризованный тест\n',
    checks: [
      { type: 'pytest', min: 4, allPass: true, why: 'Ожидается минимум 4 прогона (по числу наборов данных) и все зелёные' },
      { type: 'code', re: '@pytest\\.mark\\.parametrize', why: 'Нужен декоратор <code>@pytest.mark.parametrize</code>' },
      { type: 'code', re: '250010000000005', why: 'В наборе должен быть приостановленный абонент 250010000000005' }
    ],
    hints: [
      'Декоратор: <code>@pytest.mark.parametrize("imsi,expected", [ ... ])</code>',
      'Каждый набор — кортеж: <code>("250010000000001", 200),</code>',
      'Функция принимает те же имена: <code>def test_registration_status(imsi, expected):</code>'
    ],
    solution: 'import pytest\nimport requests\n\nURL = "http://localhost:8080/api/registration"\n\n\n@pytest.mark.parametrize("imsi,expected", [\n    ("250010000000001", 200),\n    ("250010000000003", 403),\n    ("250010000000005", 403),\n    ("250010000000099", 404),\n])\ndef test_registration_status(imsi, expected):\n    r = requests.post(URL, json={"imsi": imsi}, timeout=5)\n    assert r.status_code == expected\n',
    quiz: {
      q: 'Чем параметризация лучше цикла <code>for</code> внутри одного теста?',
      options: [
        'Ничем, это дело вкуса',
        'Каждый набор — отдельный тест: видно, какой именно упал, и остальные всё равно выполнятся',
        'Цикл в тесте запрещён',
        'Параметризация работает быстрее'
      ],
      answer: 1,
      explain: 'В цикле первый упавший assert прервёт весь тест, и вы не узнаете про остальные наборы. Параметризация даёт точную картину: три зелёных, один красный — и сразу видно какой.'
    }
  },

  {
    id: 't6-raises',
    day: 4,
    module: 'Инструменты pytest',
    title: 'Проверяем, что ошибка возникает',
    goal: 'pytest.raises — тест на ожидаемое исключение',
    mode: 'python',
    scenario: 'ok',
    pytest: true,
    theory: `
<p>Иногда правильное поведение — это ошибка. Например, функция обязана ругаться на пустой IMSI:</p>
<pre class="mini">def parse_imsi(value):
    if not value:
        raise ValueError("imsi обязателен")
    return value.strip()


def test_empty_imsi_raises():
    with pytest.raises(ValueError):
        parse_imsi("")</pre>
<p>Если исключение не возникло, тест упадёт с сообщением <code>DID NOT RAISE</code> — то есть код молча проглотил неверные данные, а это дефект.</p>
<p>Можно проверить и текст:</p>
<pre class="mini">with pytest.raises(ValueError, match="обязателен"):
    parse_imsi("")</pre>
<p class="note">Тот же приём применяют к клиенту API: при недоступном сервисе <code>requests</code> бросает <code>ConnectionError</code>, и тест на отказоустойчивость проверяет именно это.</p>`,
    task: 'Напишите функцию <code>parse_imsi(value)</code>: пустое значение → <code>ValueError</code>, значение не из 15 цифр → <code>ValueError</code>, иначе вернуть строку без пробелов по краям. Затем три теста: успешный разбор, пустая строка через <code>pytest.raises</code>, короткий IMSI через <code>pytest.raises</code>.',
    starter: 'import pytest\n\n\ndef parse_imsi(value):\n    pass\n\n\n# три теста\n',
    checks: [
      { type: 'pytest', min: 3, allPass: true, why: 'Нужны три зелёных теста' },
      { type: 'code', re: 'pytest\\.raises\\(ValueError', why: 'Ожидаемое исключение проверяется через <code>pytest.raises(ValueError)</code>' },
      { type: 'code', re: 'raise\\s+ValueError', why: 'Функция должна сама поднимать <code>ValueError</code>' }
    ],
    hints: [
      'В функции: <code>if not value: raise ValueError("imsi обязателен")</code>',
      'Проверка формата: <code>if len(value.strip()) != 15 or not value.strip().isdigit(): raise ValueError("неверный формат")</code>',
      'Тест: <code>with pytest.raises(ValueError): parse_imsi("")</code>'
    ],
    solution: 'import pytest\n\n\ndef parse_imsi(value):\n    if not value:\n        raise ValueError("imsi обязателен")\n    cleaned = value.strip()\n    if len(cleaned) != 15 or not cleaned.isdigit():\n        raise ValueError("неверный формат imsi")\n    return cleaned\n\n\ndef test_parse_ok():\n    assert parse_imsi(" 250010000000001 ") == "250010000000001"\n\n\ndef test_empty_raises():\n    with pytest.raises(ValueError):\n        parse_imsi("")\n\n\ndef test_short_raises():\n    with pytest.raises(ValueError):\n        parse_imsi("25001")\n',
    quiz: {
      q: 'Тест с <code>pytest.raises(ValueError)</code> упал с сообщением DID NOT RAISE. Что произошло?',
      options: [
        'Тест написан с ошибкой',
        'Код не бросил ожидаемое исключение — неверные данные прошли как валидные, это дефект валидации',
        'pytest.raises не поддерживает ValueError',
        'Нужно добавить timeout'
      ],
      answer: 1,
      explain: 'Отсутствие проверки входных данных — классическая дыра: в базу попадёт мусор, а сбой всплывёт гораздо позже и в другом месте.'
    }
  },

  {
    id: 't7-sideeffects',
    day: 4,
    module: 'Глубокая проверка',
    title: 'Проверяем не только ответ',
    goal: 'Убедиться, что после запроса изменилось состояние системы и появилась запись в логе',
    mode: 'python',
    scenario: 'ok',
    pytest: true,
    theory: `
<p>Слабый тест смотрит только на код ответа. Сильный проверяет <b>следы</b> операции:</p>
<ul>
<li>ответ: код и тело;</li>
<li>состояние: сессия создана и видна через <code>/api/sessions</code>;</li>
<li>журнал: в логе появилась строка об успешной регистрации;</li>
<li>идемпотентность: повторный запрос не создаёт дубль.</li>
</ul>
<p>Лог удобно читать тем же способом, что и вчера:</p>
<pre class="mini">import subprocess

out = subprocess.getoutput("grep 250010000000001 /var/log/core/registrar.log")
assert "registration successful" in out</pre>
<p class="note">Именно такие проверки отличают тестировщика ядра от «нажимателя кнопок»: успешный ответ ещё не значит, что абонент действительно зарегистрирован и что система не потеряет его при следующем запросе.</p>`,
    task: 'Напишите тест <code>test_registration_creates_session</code>: зарегистрируйте абонента, проверьте код 200, затем убедитесь, что он появился в списке <code>/api/sessions</code>, и что в логе есть строка <code>registration successful</code> по этому IMSI. Вторым тестом <code>test_registration_is_idempotent</code> проверьте, что повторная регистрация того же абонента не создаёт вторую сессию.',
    starter: 'import requests\nimport subprocess\n\nBASE = "http://localhost:8080"\nIMSI = "250010000000001"\n\n\ndef test_registration_creates_session():\n    pass\n\n\ndef test_registration_is_idempotent():\n    pass\n',
    checks: [
      { type: 'pytest', min: 2, allPass: true, why: 'Нужны два зелёных теста' },
      { type: 'code', re: 'api/sessions', why: 'Проверьте состояние через <code>/api/sessions</code>' },
      { type: 'code', re: 'subprocess|grep', why: 'Проверьте запись в логе — например, через subprocess и grep' },
      { type: 'code', re: 'registration successful', why: 'Ищите в логе строку <code>registration successful</code>' }
    ],
    hints: [
      'Список сессий: <code>s = requests.get(BASE + "/api/sessions", timeout=5).json()</code>, дальше проверьте, что IMSI встречается среди <code>s["items"]</code>',
      'Лог: <code>out = subprocess.getoutput(f"grep {IMSI} /var/log/core/registrar.log")</code>',
      'Идемпотентность: сделайте POST дважды и сравните <code>session_id</code> в обоих ответах'
    ],
    solution: 'import requests\nimport subprocess\n\nBASE = "http://localhost:8080"\nIMSI = "250010000000001"\n\n\ndef test_registration_creates_session():\n    r = requests.post(BASE + "/api/registration", json={"imsi": IMSI}, timeout=5)\n    assert r.status_code == 200\n\n    sessions = requests.get(BASE + "/api/sessions", timeout=5).json()\n    imsis = [item["imsi"] for item in sessions["items"]]\n    assert IMSI in imsis\n\n    out = subprocess.getoutput(f"grep {IMSI} /var/log/core/registrar.log")\n    assert "registration successful" in out\n\n\ndef test_registration_is_idempotent():\n    first = requests.post(BASE + "/api/registration", json={"imsi": IMSI}, timeout=5)\n    second = requests.post(BASE + "/api/registration", json={"imsi": IMSI}, timeout=5)\n\n    assert first.status_code == 200\n    assert second.status_code == 200\n    assert first.json()["session_id"] == second.json()["session_id"]\n\n    sessions = requests.get(BASE + "/api/sessions", timeout=5).json()\n    same = [i for i in sessions["items"] if i["imsi"] == IMSI]\n    assert len(same) == 1\n',
    praise: 'Такие тесты и называют функциональными проверками сервиса ядра: ответ, состояние, журнал, повторный вызов.',
    quiz: {
      q: 'Повторный запрос регистрации создал вторую сессию тому же абоненту. Как это классифицировать?',
      options: [
        'Не дефект, клиент сам виноват',
        'Дефект: нарушена идемпотентность — утекают ресурсы, счётчики сессий врут, при массовых повторах узел может исчерпать лимит',
        'Улучшение на будущее',
        'Вопрос производительности'
      ],
      answer: 1,
      explain: 'В телеком-ядре повторы запросов — норма (сеть теряет пакеты, клиент шлёт заново). Узел обязан узнавать повтор и не плодить сущности.'
    }
  },

  {
    id: 't8-failure',
    day: 4,
    module: 'Глубокая проверка',
    title: 'Тест на отказ зависимости',
    goal: 'Проверить поведение узла, когда падает сосед',
    mode: 'python',
    scenario: 'db-down',
    pytest: true,
    theory: `
<p>В вакансии это называется «тестирование функций сервисов ядра» — и в первую очередь имеется в виду поведение при сбоях. Стенд сейчас запущен со сценарием, где <b>база данных недоступна</b>.</p>
<p>Что обязан делать корректный сервис при отказе зависимости:</p>
<ul>
<li>вернуть осмысленный код — <code>503 Service Unavailable</code>, а не 500 и не 200;</li>
<li>ответить быстро, не подвешивая клиента;</li>
<li>записать причину в лог;</li>
<li>не создавать «половинчатых» сессий.</li>
</ul>
<p>Такие тесты пишут заранее, а сбой воспроизводят намеренно: гасят зависимость, рвут сеть, замедляют ответ. В зрелых командах это отдельный набор — negative / resilience testing.</p>`,
    task: 'Напишите два теста для стенда с упавшей БД: <code>test_registration_returns_503_when_db_down</code> (код 503 и понятное поле <code>error</code>) и <code>test_health_reports_degraded</code> (эндпоинт <code>/health</code> честно сообщает, что база недоступна).',
    starter: 'import requests\n\nBASE = "http://localhost:8080"\n\n\ndef test_registration_returns_503_when_db_down():\n    pass\n\n\ndef test_health_reports_degraded():\n    pass\n',
    checks: [
      { type: 'pytest', min: 2, allPass: true, why: 'Нужны два зелёных теста на стенде с упавшей базой' },
      { type: 'code', re: '503', why: 'Проверьте код 503' },
      { type: 'code', re: 'degraded|"down"|\'down\'', why: 'Проверьте, что /health сообщает о проблеме с базой' }
    ],
    hints: [
      'Регистрация вернёт 503: <code>assert r.status_code == 503</code>',
      'В теле ответа есть поле error — проверьте его содержимое',
      '<code>/health</code> вернёт <code>{"status": "degraded", "database": "down", ...}</code>'
    ],
    solution: 'import requests\n\nBASE = "http://localhost:8080"\n\n\ndef test_registration_returns_503_when_db_down():\n    r = requests.post(BASE + "/api/registration", json={"imsi": "250010000000001"}, timeout=5)\n    assert r.status_code == 503\n    assert "error" in r.json()\n\n\ndef test_health_reports_degraded():\n    r = requests.get(BASE + "/health", timeout=5)\n    assert r.status_code == 200\n    body = r.json()\n    assert body["status"] == "degraded"\n    assert body["database"] == "down"\n',
    quiz: {
      q: 'Зачем отдельный эндпоинт /health, если есть основной API?',
      options: [
        'Для красоты',
        'Чтобы мониторинг и балансировщик могли быстро понять состояние узла и его зависимостей, не выполняя бизнес-операций',
        'Чтобы обойти авторизацию',
        'Он нужен только разработчикам'
      ],
      answer: 1,
      explain: 'Health-check — точка для оркестратора: по нему принимают решение убрать узел из балансировки или перезапустить контейнер. Поэтому он обязан честно отражать состояние зависимостей.'
    }
  },

  {
    id: 't9-final',
    day: 4,
    module: 'Финал',
    title: 'Финальный набор: мини тест-план в коде',
    goal: 'Собрать всё вместе — это и есть ваш проект для собеседования',
    mode: 'python',
    scenario: 'ok',
    pytest: true,
    theory: `
<p>Финальная задача повторяет реальную: есть спецификация — нужен набор автотестов.</p>
<p><b>Спецификация сервиса регистрации (фрагмент):</b></p>
<table class="tbl">
<tr><th>№</th><th>Условие</th><th>Ожидаемый результат</th></tr>
<tr><td>1</td><td>активный абонент</td><td>200, status = registered, есть session_id</td></tr>
<tr><td>2</td><td>заблокированный</td><td>403, error = subscriber blocked</td></tr>
<tr><td>3</td><td>приостановленный</td><td>403</td></tr>
<tr><td>4</td><td>неизвестный</td><td>404, error = unknown subscriber</td></tr>
<tr><td>5</td><td>IMSI отсутствует</td><td>400</td></tr>
<tr><td>6</td><td>IMSI не 15 цифр</td><td>400, error = invalid imsi format</td></tr>
<tr><td>7</td><td>повторная регистрация</td><td>200, тот же session_id, вторая сессия не создаётся</td></tr>
<tr><td>8</td><td>после регистрации</td><td>абонент виден в /api/sessions</td></tr>
</table>
<p>Требования к набору: фикстура для адреса, параметризация для кодов ответа, отдельные тесты для повторной регистрации и состояния, говорящие имена.</p>
<p class="note">Именно такой файл (плюс README и <code>.gitlab-ci.yml</code>) стоит выложить на GitHub и приложить к отклику. Работодателю это скажет о вас больше, чем строчка «знаю Python» в резюме.</p>`,
    task: 'Напишите набор минимум из 8 прогонов, покрывающий таблицу выше. Обязательно: фикстура с базовым адресом, параметризованный тест кодов ответа, тест идемпотентности, тест появления сессии. Все тесты должны быть зелёными.',
    starter: 'import pytest\nimport requests\n\n\n@pytest.fixture\ndef api():\n    return "http://localhost:8080"\n\n\n# ваш набор тестов по спецификации\n',
    checks: [
      { type: 'pytest', min: 8, allPass: true, why: 'Нужно минимум 8 прогонов, и все зелёные (параметризованные наборы считаются по отдельности)' },
      { type: 'code', re: '@pytest\\.fixture', why: 'Используйте фикстуру для базового адреса' },
      { type: 'code', re: '@pytest\\.mark\\.parametrize', why: 'Коды ответа сверните в параметризованный тест' },
      { type: 'code', re: 'session_id', why: 'Проверьте session_id — в том числе при повторной регистрации' },
      { type: 'code', re: 'invalid imsi format|400', why: 'Покройте случай неверного формата IMSI' }
    ],
    hints: [
      'Начните с параметризации кодов: активный/заблокированный/приостановленный/неизвестный',
      'Отдельные тесты: пустое тело → 400, короткий IMSI → 400 с error = invalid imsi format',
      'Идемпотентность: два POST подряд, сравнить session_id и длину списка сессий'
    ],
    solution: 'import pytest\nimport requests\n\n\n@pytest.fixture\ndef api():\n    return "http://localhost:8080"\n\n\n@pytest.fixture\ndef url(api):\n    return api + "/api/registration"\n\n\n@pytest.mark.parametrize("imsi,expected", [\n    ("250010000000001", 200),\n    ("250010000000003", 403),\n    ("250010000000005", 403),\n    ("250010000000099", 404),\n])\ndef test_registration_status_codes(url, imsi, expected):\n    r = requests.post(url, json={"imsi": imsi}, timeout=5)\n    assert r.status_code == expected\n\n\ndef test_active_registration_returns_session(url):\n    r = requests.post(url, json={"imsi": "250010000000001"}, timeout=5)\n    body = r.json()\n    assert r.status_code == 200\n    assert body["status"] == "registered"\n    assert body["session_id"]\n\n\ndef test_missing_imsi_is_rejected(url):\n    r = requests.post(url, json={}, timeout=5)\n    assert r.status_code == 400\n\n\ndef test_malformed_imsi_is_rejected(url):\n    r = requests.post(url, json={"imsi": "25001"}, timeout=5)\n    assert r.status_code == 400\n    assert r.json()["error"] == "invalid imsi format"\n\n\ndef test_repeated_registration_keeps_one_session(api, url):\n    first = requests.post(url, json={"imsi": "250010000000002"}, timeout=5)\n    second = requests.post(url, json={"imsi": "250010000000002"}, timeout=5)\n    assert first.json()["session_id"] == second.json()["session_id"]\n\n    sessions = requests.get(api + "/api/sessions", timeout=5).json()\n    same = [i for i in sessions["items"] if i["imsi"] == "250010000000002"]\n    assert len(same) == 1\n',
    praise: 'Это законченный набор по спецификации — можно выкладывать в репозиторий и показывать на собеседовании.',
    quiz: {
      q: 'Что сказать на вопрос «как вы решали, сколько тестов писать»?',
      options: [
        'Сколько успел за день',
        'По спецификации: каждое требование покрыто хотя бы одним тестом, плюс негативные случаи и проверка побочных эффектов',
        'Пока покрытие кода не станет 100%',
        'Один тест на эндпоинт'
      ],
      answer: 1,
      explain: 'Ответ показывает связь тестов с требованиями — это и есть трассируемость, за которую отвечает тест-план. Процент покрытия кода без привязки к требованиям ни о чём не говорит.'
    }
  }

  );
})(typeof window !== 'undefined' ? window : globalThis);
