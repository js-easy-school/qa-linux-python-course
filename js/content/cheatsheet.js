/* Шпаргалка на вкладке рядом с практикой — то, что стоит помнить наизусть к собеседованию. */
(function (root) {
  'use strict';

  root.QACheatsheet = `
<h3>Файлы и поиск</h3>
<table>
<tr><td>ls -la /etc/core</td><td>подробный список с правами</td></tr>
<tr><td>cat / head -n 20 / tail -n 20</td><td>показать файл, начало, конец</td></tr>
<tr><td>tail -f лог</td><td>следить за дописыванием</td></tr>
<tr><td>grep -n ERROR лог</td><td>строки с номерами</td></tr>
<tr><td>grep -ic error лог</td><td>количество без учёта регистра</td></tr>
<tr><td>grep -C 2 timeout лог</td><td>с контекстом ±2 строки</td></tr>
<tr><td>grep -rn imsi /etc</td><td>рекурсивно по каталогу</td></tr>
<tr><td>find /var/log -name "*.log" -size +1G</td><td>крупные файлы</td></tr>
<tr><td>cut -d";" -f1 файл</td><td>первое поле по разделителю</td></tr>
<tr><td>awk -F";" '/active/ {print $1}' файл</td><td>фильтр + колонка</td></tr>
<tr><td>sed -i "s/было/стало/" файл</td><td>замена прямо в файле</td></tr>
<tr><td>sort | uniq -c | sort -rn | head</td><td>топ повторов</td></tr>
<tr><td>cmd &gt; файл / &gt;&gt; файл / 2&gt;/dev/null</td><td>перезаписать / дописать / скрыть ошибки</td></tr>
</table>

<h3>Процессы и службы</h3>
<table>
<tr><td>ps aux | grep registrar</td><td>процесс и аргументы запуска</td></tr>
<tr><td>kill PID / kill -9 PID</td><td>завершить / убить</td></tr>
<tr><td>systemctl status имя</td><td>состояние + хвост журнала</td></tr>
<tr><td>systemctl is-active имя</td><td>короткий ответ для скриптов</td></tr>
<tr><td>systemctl restart / start / stop</td><td>управление</td></tr>
<tr><td>systemctl enable</td><td>автозапуск при загрузке (≠ active)</td></tr>
<tr><td>journalctl -u имя -n 50</td><td>последние 50 записей</td></tr>
<tr><td>journalctl -u имя -p err</td><td>только ошибки</td></tr>
<tr><td>df -h / du -sh /var/log</td><td>место на разделах / вес каталога</td></tr>
<tr><td>free -h</td><td>память</td></tr>
</table>

<h3>Сеть</h3>
<table>
<tr><td>ss -tulpn</td><td>кто слушает порты (t=tcp u=udp l=listen p=процесс n=числа)</td></tr>
<tr><td>ip addr / ip route</td><td>адреса / маршруты</td></tr>
<tr><td>dig имя +short</td><td>разрешение имени в адрес</td></tr>
<tr><td>ping узел</td><td>доступность узла (ICMP, уровень 3)</td></tr>
<tr><td>nc -zv узел порт</td><td>доступность порта (TCP, уровень 4)</td></tr>
<tr><td>curl -i URL</td><td>запрос с заголовками ответа</td></tr>
<tr><td>curl -X POST -d '{"imsi":"..."}' URL</td><td>POST с телом</td></tr>
<tr><td>tcpdump -i eth0 port 8080</td><td>смотреть пакеты</td></tr>
<tr><td>ufw status / iptables -L</td><td>правила фаервола</td></tr>
</table>

<h3>Диагностика: порядок действий</h3>
<table>
<tr><td>1. Воспроизвести</td><td>curl — что именно возвращается</td></tr>
<tr><td>2. Процесс жив?</td><td>systemctl status, ps aux</td></tr>
<tr><td>3. Порт слушается?</td><td>ss -tulpn, адрес 0.0.0.0 или 127.0.0.1</td></tr>
<tr><td>4. Сеть доходит?</td><td>ping, nc -zv, refused ≠ timeout</td></tr>
<tr><td>5. Имя разрешается?</td><td>dig, /etc/hosts, /etc/resolv.conf</td></tr>
<tr><td>6. Что в журнале?</td><td>journalctl -u ... -n 50, лог приложения</td></tr>
<tr><td>7. Зависимости живы?</td><td>база, соседний узел, диск, память</td></tr>
<tr><td>8. Проверить починку</td><td>повторный запрос → 200</td></tr>
</table>

<h3>Коды HTTP</h3>
<table>
<tr><td>200</td><td>успех</td></tr>
<tr><td>400</td><td>неверные данные клиента</td></tr>
<tr><td>401 / 403</td><td>не аутентифицирован / доступ запрещён</td></tr>
<tr><td>404</td><td>объект не найден</td></tr>
<tr><td>409</td><td>конфликт состояния</td></tr>
<tr><td>500</td><td>ошибка сервиса — почти всегда дефект</td></tr>
<tr><td>503</td><td>недоступна зависимость (например, база)</td></tr>
</table>

<h3>Python: минимум для тестов</h3>
<table>
<tr><td>f"порт {port}"</td><td>подстановка значений</td></tr>
<tr><td>line.split() / .strip()</td><td>разбить / убрать пробелы и \\n</td></tr>
<tr><td>d.get("key", default)</td><td>без KeyError</td></tr>
<tr><td>for k, v in d.items():</td><td>обход словаря</td></tr>
<tr><td>[x for x in items if cond]</td><td>генератор списка</td></tr>
<tr><td>with open(path) as f:</td><td>файл закроется сам</td></tr>
<tr><td>json.loads / json.dumps</td><td>строка ↔ объект</td></tr>
<tr><td>re.findall(r"imsi=(\\d+)", text)</td><td>все совпадения группы</td></tr>
<tr><td>subprocess.run([...], capture_output=True, text=True)</td><td>команда + вывод</td></tr>
<tr><td>try / except ValueError</td><td>конкретное исключение, не голый except</td></tr>
</table>

<h3>requests и pytest</h3>
<table>
<tr><td>requests.get(url, timeout=5)</td><td>timeout обязателен</td></tr>
<tr><td>requests.post(url, json={...}, timeout=5)</td><td>тело JSON</td></tr>
<tr><td>r.status_code / r.json() / r.text</td><td>код / объект / строка</td></tr>
<tr><td>def test_имя():</td><td>функция-тест</td></tr>
<tr><td>assert r.status_code == 200</td><td>проверка</td></tr>
<tr><td>@pytest.fixture</td><td>подготовка, общая для тестов</td></tr>
<tr><td>@pytest.mark.parametrize("a,b", [...])</td><td>таблица наборов данных</td></tr>
<tr><td>with pytest.raises(ValueError):</td><td>ожидаемое исключение</td></tr>
<tr><td>pytest -v / pytest -k имя / pytest -x</td><td>подробно / по имени / остановиться на первом падении</td></tr>
</table>

<h3>Что спросят про сам подход</h3>
<table>
<tr><td>Дефект</td><td>расхождение поведения со спецификацией, а не «что-то упало»</td></tr>
<tr><td>Баг-репорт</td><td>шаги, ожидаемо / фактически, окружение, логи, версия</td></tr>
<tr><td>Тест-план</td><td>что тестируем и что нет, окружение, данные, критерии завершения</td></tr>
<tr><td>Трассировка</td><td>каждое требование покрыто хотя бы одним тестом</td></tr>
<tr><td>Негативные тесты</td><td>неверные данные, отказ зависимости, повторы, границы</td></tr>
<tr><td>Идемпотентность</td><td>повтор запроса не создаёт дубль</td></tr>
<tr><td>Flaky-тест</td><td>нестабильный, подрывает доверие к прогону; чинить, а не перезапускать</td></tr>
</table>
`;
})(typeof window !== 'undefined' ? window : globalThis);
