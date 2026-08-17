/* Модули Python для тренажёра: json, re, os, sys, time, math, csv, random,
   requests (ходит в виртуальный стенд), subprocess (запускает команды стенда)
   и pytest вместе с раннером тестов. */
(function (root) {
  'use strict';

  var R;

  function B(name, fn) { return new R.PyBuiltin(name, fn); }
  function mod(name, dict) { return new R.PyModule(name, dict); }

  /* ─────────── конвертация значений ─────────── */

  function toJS(v) {
    if (v === null || v === undefined) return null;
    if (v instanceof R.PyFloat) return v.v;
    if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v;
    if (Array.isArray(v)) return v.map(toJS);
    if (v instanceof R.PyTuple) return v.items.map(toJS);
    if (v instanceof R.PyDict) {
      var o = {};
      v.entries().forEach(function (e) { o[R.str(e[0])] = toJS(e[1]); });
      return o;
    }
    if (v instanceof R.PySet) return v.items().map(toJS);
    return R.str(v);
  }

  function toPy(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return Number.isInteger(v) ? v : new R.PyFloat(v);
    if (typeof v === 'string' || typeof v === 'boolean') return v;
    if (Array.isArray(v)) return v.map(toPy);
    if (typeof v === 'object') {
      var d = new R.PyDict();
      Object.keys(v).forEach(function (k) { d.set(k, toPy(v[k])); });
      return d;
    }
    return String(v);
  }

  /* ─────────── json ─────────── */

  // сериализация в том же виде, что даёт json.dumps в Python
  function dumpsPy(v) {
    if (v === null) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(dumpsPy).join(', ') + ']';
    return '{' + Object.keys(v).map(function (k) {
      return JSON.stringify(k) + ': ' + dumpsPy(v[k]);
    }).join(', ') + '}';
  }

  function jsonModule() {
    return mod('json', {
      dumps: B('dumps', function (args, kw) {
        var indent = kw.indent !== undefined && kw.indent !== null ? Number(R.nv(kw.indent)) : null;
        // Python по умолчанию ставит пробелы после запятой и двоеточия — JSON.stringify их не ставит
        if (indent === null) return dumpsPy(toJS(args[0]));
        return JSON.stringify(toJS(args[0]), null, indent);
      }),
      loads: B('loads', function (args) {
        try { return toPy(JSON.parse(R.str(args[0]))); }
        catch (e) { R.raisePy('ValueError', 'Expecting value: не похоже на JSON'); }
      }),
      dump: B('dump', function (args) {
        var text = JSON.stringify(toJS(args[0]));
        var f = args[1];
        if (f && f.__attrs && f.__attrs.write) this.callValue(f.__attrs.write, [text], null);
        return null;
      }),
      load: B('load', function (args) {
        var f = args[0];
        var text = f && f.__attrs && f.__attrs.read ? this.callValue(f.__attrs.read, [], null) : '';
        try { return toPy(JSON.parse(R.str(text))); }
        catch (e) { R.raisePy('ValueError', 'Expecting value: файл не содержит JSON'); }
      })
    });
  }

  /* ─────────── re ─────────── */

  function pyPatternToJS(p) {
    return String(p).replace(/\(\?P<(\w+)>/g, '(?<$1>').replace(/\(\?P=(\w+)\)/g, '\\k<$1>');
  }

  function makeMatch(m) {
    if (!m) return null;
    var o = { __attrs: {} };
    o.__attrs.group = B('group', function (args) {
      var i = args.length ? args[0] : 0;
      if (typeof i === 'string') return m.groups && m.groups[i] !== undefined ? m.groups[i] : null;
      var idx = Number(R.nv(i));
      return m[idx] === undefined ? null : m[idx];
    });
    o.__attrs.groups = B('groups', function () { return Array.prototype.slice.call(m, 1).map(function (x) { return x === undefined ? null : x; }); });
    o.__attrs.groupdict = B('groupdict', function () {
      var d = new R.PyDict();
      if (m.groups) Object.keys(m.groups).forEach(function (k) { d.set(k, m.groups[k] === undefined ? null : m.groups[k]); });
      return d;
    });
    o.__attrs.start = B('start', function () { return m.index; });
    o.__attrs.end = B('end', function () { return m.index + m[0].length; });
    return o;
  }

  function reModule() {
    function flagsOf(kw) { return kw && kw.flags && R.nv(kw.flags) === 2 ? 'i' : ''; }
    return mod('re', {
      IGNORECASE: 2,
      I: 2,
      search: B('search', function (args, kw) {
        var re = new RegExp(pyPatternToJS(R.str(args[0])), flagsOf(kw));
        return makeMatch(re.exec(R.str(args[1])));
      }),
      match: B('match', function (args, kw) {
        var re = new RegExp('^(?:' + pyPatternToJS(R.str(args[0])) + ')', flagsOf(kw));
        return makeMatch(re.exec(R.str(args[1])));
      }),
      fullmatch: B('fullmatch', function (args, kw) {
        var re = new RegExp('^(?:' + pyPatternToJS(R.str(args[0])) + ')$', flagsOf(kw));
        return makeMatch(re.exec(R.str(args[1])));
      }),
      findall: B('findall', function (args, kw) {
        var re = new RegExp(pyPatternToJS(R.str(args[0])), 'g' + flagsOf(kw));
        var text = R.str(args[1]), out = [], m;
        while ((m = re.exec(text)) !== null) {
          if (m[0] === '') { re.lastIndex++; continue; }
          if (m.length > 2) out.push(new R.PyTuple(Array.prototype.slice.call(m, 1)));
          else out.push(m.length === 2 ? m[1] : m[0]);
        }
        return out;
      }),
      sub: B('sub', function (args, kw) {
        var re = new RegExp(pyPatternToJS(R.str(args[0])), 'g' + flagsOf(kw));
        return R.str(args[2]).replace(re, R.str(args[1]).replace(/\\(\d)/g, '$$$1'));
      }),
      split: B('split', function (args, kw) {
        var re = new RegExp(pyPatternToJS(R.str(args[0])), flagsOf(kw));
        return R.str(args[1]).split(re);
      }),
      escape: B('escape', function (args) { return R.str(args[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); })
    });
  }

  /* ─────────── requests ─────────── */

  function makeResponse(interp, res, url) {
    var o = { __attrs: {} };
    var payload = res.body;
    var text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    o.__attrs.status_code = res.status;
    o.__attrs.text = text;
    o.__attrs.url = url;
    o.__attrs.ok = res.status < 400;
    o.__attrs.elapsed = new R.PyFloat(0.012);
    var hd = new R.PyDict();
    hd.set('Content-Type', 'application/json');
    hd.set('Content-Length', String(text.length));
    o.__attrs.headers = hd;
    o.__attrs.json = B('json', function () {
      if (typeof payload === 'string') {
        try { return toPy(JSON.parse(payload)); }
        catch (e) { R.raisePy('ValueError', 'ответ не является JSON'); }
      }
      return toPy(payload);
    });
    o.__attrs.raise_for_status = B('raise_for_status', function () {
      if (res.status >= 400) R.raisePy('HTTPError', String(res.status) + ' Server Error for url: ' + url);
      return null;
    });
    return o;
  }

  function parseUrl(url) {
    var m = /^(?:(https?):\/\/)?([^/:?]+)(?::(\d+))?([^?]*)?(\?.*)?$/.exec(String(url));
    if (!m) return null;
    return { host: m[2] === 'localhost' ? '127.0.0.1' : m[2], port: m[3] ? parseInt(m[3], 10) : 80, path: (m[4] || '/') + (m[5] || '') };
  }

  function requestsModule() {
    function doRequest(interp, method, args, kw) {
      var url = R.str(args[0]);
      var u = parseUrl(url);
      if (!u) R.raisePy('ConnectionError', 'некорректный URL: ' + url);
      if (!interp.stand) R.raisePy('ConnectionError', 'в этом уроке стенд не поднят');

      var body = null;
      if (kw.json !== undefined) body = toJS(kw.json);
      else if (kw.data !== undefined) {
        var d = kw.data;
        body = typeof d === 'string' ? (function () { try { return JSON.parse(d); } catch (e) { return d; } })() : toJS(d);
      }
      var res = interp.stand.http(method, u.host, u.port, u.path, body);
      if (res.error === 'refused') R.raisePy('ConnectionError', "HTTPConnectionPool(host='" + u.host + "', port=" + u.port + "): Max retries exceeded (Connection refused)");
      if (res.error === 'timeout') R.raisePy('TimeoutError', "HTTPConnectionPool(host='" + u.host + "', port=" + u.port + "): Read timed out");
      if (res.error === 'dns') R.raisePy('ConnectionError', "Failed to resolve '" + u.host + "'");
      return makeResponse(interp, res, url);
    }
    var d = {};
    ['get', 'post', 'put', 'delete', 'patch', 'head'].forEach(function (m) {
      d[m] = B(m, function (args, kw) { return doRequest(this, m.toUpperCase(), args, kw); });
    });
    d.request = B('request', function (args, kw) {
      return doRequest(this, R.str(args[0]).toUpperCase(), args.slice(1), kw);
    });
    d.exceptions = mod('requests.exceptions', {
      ConnectionError: 'ConnectionError',
      Timeout: 'TimeoutError',
      HTTPError: 'HTTPError'
    });
    return mod('requests', d);
  }

  /* ─────────── subprocess: запускает команды виртуального стенда ─────────── */

  function subprocessModule() {
    function runCmd(interp, cmdValue) {
      if (!interp.stand) R.raisePy('RuntimeError', 'в этом уроке стенд не поднят');
      var cmd;
      if (typeof cmdValue === 'string') cmd = cmdValue;
      else {
        var items = Array.isArray(cmdValue) ? cmdValue : (cmdValue instanceof R.PyTuple ? cmdValue.items : [cmdValue]);
        cmd = items.map(function (x) {
          var s = R.str(x);
          return /[\s"']/.test(s) ? "'" + s + "'" : s;
        }).join(' ');
      }
      var sh = new root.CourseShell.Shell(interp.stand);
      return { cmd: cmd, res: sh.run(cmd) };
    }
    return mod('subprocess', {
      run: B('run', function (args, kw) {
        var r = runCmd(this, args[0]);
        var o = { __attrs: {} };
        o.__attrs.returncode = r.res.code;
        o.__attrs.stdout = r.res.out;
        o.__attrs.stderr = '';
        o.__attrs.args = R.str(r.cmd);
        o.__attrs.check_returncode = B('check_returncode', function () {
          if (r.res.code !== 0) R.raisePy('RuntimeError', 'Command ' + JSON.stringify(r.cmd) + ' returned non-zero exit status ' + r.res.code);
          return null;
        });
        if (kw.check !== undefined && R.truthy(kw.check) && r.res.code !== 0) {
          R.raisePy('RuntimeError', 'Command ' + JSON.stringify(r.cmd) + ' returned non-zero exit status ' + r.res.code);
        }
        return o;
      }),
      getoutput: B('getoutput', function (args) { return runCmd(this, args[0]).res.out.replace(/\n$/, ''); }),
      call: B('call', function (args) { return runCmd(this, args[0]).res.code; }),
      check_output: B('check_output', function (args) {
        var r = runCmd(this, args[0]);
        if (r.res.code !== 0) R.raisePy('RuntimeError', 'команда завершилась с кодом ' + r.res.code);
        return r.res.out;
      })
    });
  }

  /* ─────────── прочие модули ─────────── */

  function osModule() {
    var pathMod = mod('os.path', {
      join: B('join', function (args) {
        return args.map(R.str).filter(function (x) { return x !== ''; }).join('/').replace(/\/+/g, '/');
      }),
      basename: B('basename', function (args) { var p = R.str(args[0]).split('/'); return p[p.length - 1]; }),
      dirname: B('dirname', function (args) { var p = R.str(args[0]).split('/'); p.pop(); return p.join('/'); }),
      exists: B('exists', function (args) {
        if (!this.stand) return false;
        return this.stand.fs.node(this.stand.fs.resolve(this.stand.cwd, R.str(args[0]))) !== null;
      }),
      isfile: B('isfile', function (args) {
        if (!this.stand) return false;
        var n = this.stand.fs.node(this.stand.fs.resolve(this.stand.cwd, R.str(args[0])));
        return !!n && n.type === 'file';
      }),
      getsize: B('getsize', function (args) {
        if (!this.stand) return 0;
        var n = this.stand.fs.node(this.stand.fs.resolve(this.stand.cwd, R.str(args[0])));
        if (!n) R.raisePy('FileNotFoundError', R.str(args[0]));
        return this.stand.fs.size(n);
      })
    });
    return mod('os', {
      path: pathMod,
      sep: '/',
      getenv: B('getenv', function (args) {
        var env = this.stand ? this.stand.env : {};
        var k = R.str(args[0]);
        return k in env ? env[k] : (args.length > 1 ? args[1] : null);
      }),
      listdir: B('listdir', function (args) {
        if (!this.stand) return [];
        var items = this.stand.fs.list(this.stand.fs.resolve(this.stand.cwd, args.length ? R.str(args[0]) : '.'));
        if (!items) R.raisePy('FileNotFoundError', R.str(args[0]));
        return items.map(function (i) { return i.name; });
      }),
      environ: (function () { var d = new R.PyDict(); return d; })()
    });
  }

  function timeModule() {
    var t = 1786950000;
    return mod('time', {
      time: B('time', function () { return new R.PyFloat(t += 0.5); }),
      sleep: B('sleep', function () { return null; }),          // в тренажёре мгновенно
      strftime: B('strftime', function () { return '2026-08-16 11:00:00'; }),
      monotonic: B('monotonic', function () { return new R.PyFloat(t += 0.5); })
    });
  }

  function mathModule() {
    function f1(name, fn) { return B(name, function (args) { return new R.PyFloat(fn(Number(R.nv(args[0])))); }); }
    return mod('math', {
      pi: new R.PyFloat(Math.PI),
      e: new R.PyFloat(Math.E),
      inf: new R.PyFloat(Infinity),
      sqrt: f1('sqrt', Math.sqrt),
      floor: B('floor', function (args) { return Math.floor(Number(R.nv(args[0]))); }),
      ceil: B('ceil', function (args) { return Math.ceil(Number(R.nv(args[0]))); }),
      fabs: f1('fabs', Math.abs),
      log: f1('log', Math.log),
      log10: f1('log10', Math.log10),
      pow: B('pow', function (args) { return new R.PyFloat(Math.pow(Number(R.nv(args[0])), Number(R.nv(args[1])))); }),
      isclose: B('isclose', function (args, kw) {
        var a = Number(R.nv(args[0])), b = Number(R.nv(args[1]));
        var rel = kw.rel_tol !== undefined ? Number(R.nv(kw.rel_tol)) : 1e-9;
        return Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b)) + 1e-12;
      })
    });
  }

  function csvModule() {
    function parseLine(line, delim) {
      var out = [], cur = '', inQ = false;
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '"') { inQ = !inQ; continue; }
        if (c === delim && !inQ) { out.push(cur); cur = ''; continue; }
        cur += c;
      }
      out.push(cur);
      return out;
    }
    function textOf(interp, src) {
      if (typeof src === 'string') return src;
      if (src && src.__attrs && src.__attrs.read) return R.str(interp.callValue(src.__attrs.read, [], null));
      if (Array.isArray(src)) return src.map(R.str).join('\n');
      return R.str(src);
    }
    return mod('csv', {
      reader: B('reader', function (args, kw) {
        var delim = kw.delimiter !== undefined ? R.str(kw.delimiter) : ',';
        return textOf(this, args[0]).replace(/\n$/, '').split('\n')
          .filter(function (l) { return l !== ''; })
          .map(function (l) { return parseLine(l, delim); });
      }),
      DictReader: B('DictReader', function (args, kw) {
        var delim = kw.delimiter !== undefined ? R.str(kw.delimiter) : ',';
        var rows = textOf(this, args[0]).replace(/\n$/, '').split('\n').filter(function (l) { return l !== ''; });
        if (!rows.length) return [];
        var header = parseLine(rows[0], delim);
        return rows.slice(1).map(function (l) {
          var cells = parseLine(l, delim);
          var d = new R.PyDict();
          header.forEach(function (h, i) { d.set(h, cells[i] === undefined ? '' : cells[i]); });
          return d;
        });
      })
    });
  }

  function randomModule() {
    var seed = 42;
    function next() {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    }
    return mod('random', {
      seed: B('seed', function (args) { seed = args.length ? Number(R.nv(args[0])) : 42; return null; }),
      random: B('random', function () { return new R.PyFloat(next()); }),
      randint: B('randint', function (args) {
        var a = Number(R.nv(args[0])), b = Number(R.nv(args[1]));
        return a + Math.floor(next() * (b - a + 1));
      }),
      choice: B('choice', function (args) {
        var items = this.iterate(args[0]);
        return items[Math.floor(next() * items.length)];
      })
    });
  }

  function sysModule(interp) {
    return mod('sys', {
      argv: ['test.py'],
      version: '3.12.3 (тренажёр QA-курса)',
      platform: 'linux',
      exit: B('exit', function (args) {
        R.raisePy('SystemExit', args.length ? R.str(args[0]) : '0');
      }),
      stdout: (function () {
        var o = { __attrs: {} };
        o.__attrs.write = B('write', function (args) { this.write(R.str(args[0])); return null; });
        o.__attrs.flush = B('flush', function () { return null; });
        return o;
      })()
    });
  }

  /* ─────────── pytest ─────────── */

  function pytestModule() {
    var fixture = B('fixture', function (args, kw) {
      // допускаем и @pytest.fixture, и @pytest.fixture(scope="function")
      if (args.length && (args[0] instanceof R.PyFunc)) {
        args[0].__isFixture = true;
        return args[0];
      }
      return B('fixture_dec', function (inner) {
        if (inner[0] instanceof R.PyFunc) inner[0].__isFixture = true;
        return inner[0];
      });
    });

    var parametrize = B('parametrize', function (args) {
      var names = R.str(args[0]).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      var rows = this.iterate(args[1]);
      return B('parametrize_dec', function (inner) {
        var fn = inner[0];
        fn.__params = (fn.__params || []).concat([{ names: names, rows: rows }]);
        return fn;
      });
    });

    var skipMark = B('skip', function (args, kw) {
      return B('skip_dec', function (inner) {
        inner[0].__skip = kw.reason !== undefined ? R.str(kw.reason) : 'помечен как skip';
        return inner[0];
      });
    });

    var markMod = mod('pytest.mark', { parametrize: parametrize, skip: skipMark });

    var raises = B('raises', function (args, kw) {
      var want = args[0];
      var holder = { __attrs: { value: null, type: want } };
      var ctx = {
        __enter: function () { return holder; },
        __exit: function (interp, err) {
          if (!err) R.raisePy('Failed', 'DID NOT RAISE ' + (want instanceof R.PyClass ? want.name : R.str(want)));
          if (!(err instanceof R.PyExc)) return false;
          if (!interp.excMatches(err, want)) return false;
          holder.__attrs.value = interp.excToValue(err);
          if (kw.match !== undefined) {
            var re = new RegExp(pyPatternToJS(R.str(kw.match)));
            if (!re.test(err.message)) {
              R.raisePy('Failed', 'сообщение исключения не совпало с шаблоном ' + R.repr(R.str(kw.match)) + ': ' + err.message);
            }
          }
          return true;                       // исключение поймано — тест продолжается
        }
      };
      return ctx;
    });

    var approx = B('approx', function (args, kw) {
      var tol = kw.abs !== undefined ? Number(R.nv(kw.abs)) : (kw.rel !== undefined ? Number(R.nv(kw.rel)) : 1e-6);
      return { __approx: Number(R.nv(args[0])), __tol: tol, __rel: kw.rel !== undefined };
    });

    return mod('pytest', {
      fixture: fixture,
      mark: markMod,
      raises: raises,
      approx: approx,
      skip: B('skip', function (args, kw) {
        var e = new R.PyExc('Skipped', kw.reason !== undefined ? R.str(kw.reason) : (args.length ? R.str(args[0]) : ''));
        e.__skip = true;
        throw e;
      }),
      fail: B('fail', function (args) { R.raisePy('Failed', args.length ? R.str(args[0]) : 'явный вызов pytest.fail()'); })
    });
  }

  /* ─────────── запуск тестов в стиле pytest ─────────── */

  function runTests(interp, opts) {
    opts = opts || {};
    var names = [];
    interp.globals.vars.forEach(function (v, k) {
      if (/^test_/.test(k) && v instanceof R.PyFunc) names.push(k);
    });
    names.sort(function (a, b) { return (interp.__order || []).indexOf(a) - (interp.__order || []).indexOf(b); });

    var results = [];
    var out = interp.out;

    // фикстура может сама зависеть от других фикстур — разрешаем рекурсивно
    function resolveFixtures(fn, cache, missing, depth) {
      missing = missing || [];
      depth = depth || 0;
      var vals = [];
      if (depth > 20) {
        missing.push('циклическая зависимость фикстур');
        return { vals: vals, missing: missing };
      }
      fn.params.forEach(function (p) {
        if (cache[p.name] !== undefined) { vals.push(cache[p.name]); return; }
        var f = interp.globals.get(p.name);
        if (f instanceof R.PyFunc && f.__isFixture) {
          var inner = resolveFixtures(f, cache, missing, depth + 1);
          var v = interp.callValue(f, inner.vals, null);
          cache[p.name] = v;
          vals.push(v);
        } else if (p.default) {
          vals.push(interp.eval(p.default, interp.globals));
        } else missing.push(p.name);
      });
      return { vals: vals, missing: missing };
    }

    names.forEach(function (name) {
      var fn = interp.globals.get(name);
      var paramSets = fn.__params && fn.__params.length ? fn.__params[0] : null;
      var cases = [];

      if (paramSets) {
        paramSets.rows.forEach(function (row, i) {
          var vals = row instanceof R.PyTuple ? row.items : (Array.isArray(row) ? row : [row]);
          var label = name + '[' + vals.map(function (v) { return R.str(v); }).join('-') + ']';
          cases.push({ label: label, bind: paramSets.names, vals: vals });
        });
      } else {
        cases.push({ label: name, bind: [], vals: [] });
      }

      cases.forEach(function (c) {
        var cache = {};
        c.bind.forEach(function (n, i) { cache[n] = c.vals[i]; });
        var rec = { name: c.label, status: 'passed', message: '', line: null };
        if (fn.__skip) {
          rec.status = 'skipped';
          rec.message = fn.__skip;
          results.push(rec);
          return;
        }
        try {
          var fx = resolveFixtures(fn, cache);
          if (fx.missing.length) {
            rec.status = 'error';
            rec.message = 'fixture ' + JSON.stringify(fx.missing[0]) + ' not found — нет ни фикстуры, ни значения по умолчанию';
          } else {
            interp.callValue(fn, fx.vals, null);
          }
        } catch (e) {
          if (e instanceof R.PyExc) {
            if (e.__skip || e.typeName() === 'Skipped') {
              rec.status = 'skipped';
              rec.message = e.message;
            } else {
              rec.status = 'failed';
              rec.message = (e.typeName() === 'AssertionError' ? '' : e.typeName() + ': ') + e.message;
              rec.line = e.line || null;
            }
          } else {
            rec.status = 'error';
            rec.message = e.message;
            rec.line = e.pyLine || null;
          }
        }
        results.push(rec);
      });
    });

    // отчёт в привычном для pytest виде
    var passed = results.filter(function (r) { return r.status === 'passed'; }).length;
    var failed = results.filter(function (r) { return r.status === 'failed'; }).length;
    var errors = results.filter(function (r) { return r.status === 'error'; }).length;
    var skipped = results.filter(function (r) { return r.status === 'skipped'; }).length;

    var head = '=========================== test session starts ============================\n' +
      'platform linux -- Python 3.12.3, pytest-8.2.0\ncollected ' + results.length + ' item' + (results.length === 1 ? '' : 's') + '\n\n';
    var body = '';
    if (opts.verbose) {
      body = results.map(function (r) {
        var mark = r.status === 'passed' ? 'PASSED' : r.status === 'failed' ? 'FAILED' : r.status === 'skipped' ? 'SKIPPED' : 'ERROR';
        return 'test_core.py::' + r.name + ' ' + mark;
      }).join('\n') + '\n\n';
    } else {
      body = 'test_core.py ' + results.map(function (r) {
        return r.status === 'passed' ? '.' : r.status === 'failed' ? 'F' : r.status === 'skipped' ? 's' : 'E';
      }).join('') + '\n\n';
    }

    var details = '';
    var bad = results.filter(function (r) { return r.status === 'failed' || r.status === 'error'; });
    if (bad.length) {
      details = '================================= FAILURES =================================\n';
      bad.forEach(function (r) {
        details += '_______________________________ ' + r.name + ' _______________________________\n';
        details += (r.line ? 'test_core.py:' + r.line + ': ' : '') + (r.message || 'тест упал') + '\n\n';
      });
    }

    var parts = [];
    if (failed) parts.push(failed + ' failed');
    if (passed) parts.push(passed + ' passed');
    if (errors) parts.push(errors + ' error' + (errors === 1 ? '' : 's'));
    if (skipped) parts.push(skipped + ' skipped');
    var tail = '=========================== ' + (parts.join(', ') || 'no tests ran') + ' ============================\n';

    out(head + body + details + tail);
    return { results: results, passed: passed, failed: failed, errors: errors, skipped: skipped };
  }

  /* ─────────── установка ─────────── */

  function install(interp) {
    R = root.PyRuntime;
    interp.modules = {
      json: jsonModule(),
      re: reModule(),
      os: osModule(),
      sys: sysModule(interp),
      time: timeModule(),
      math: mathModule(),
      csv: csvModule(),
      random: randomModule(),
      requests: requestsModule(),
      subprocess: subprocessModule(),
      pytest: pytestModule()
    };
    ['HTTPError', 'Failed', 'Skipped', 'SystemExit'].forEach(function (name) {
      var cls = new R.PyClass(name, [], new Map());
      cls.isException = true;
      cls.__excName = name;
      interp.globals.set(name, cls);
    });
  }

  root.PyStdlib = { install: install, runTests: runTests, toJS: toJS, toPy: toPy };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
