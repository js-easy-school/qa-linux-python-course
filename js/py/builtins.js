/* Встроенные функции Python и методы стандартных типов. */
(function (root) {
  'use strict';

  var R;   // PyRuntime — доступен после загрузки interp.js

  function ready() {
    if (!R) R = root.PyRuntime;
    return R;
  }

  function B(name, fn) { return new root.PyRuntime.PyBuiltin(name, fn); }

  function argErr(name, msg) { R.raisePy('TypeError', name + '(): ' + msg); }

  /* ─────────── встроенные функции ─────────── */

  function install(interp) {
    ready();
    var g = interp.globals;
    var str = R.str, repr = R.repr, nv = R.nv, isNum = R.isNum, mkNum = R.mkNum;
    var PyFloat = R.PyFloat, PyTuple = R.PyTuple, PyDict = R.PyDict, PySet = R.PySet, PyRange = R.PyRange;

    function def(name, fn) { g.set(name, B(name, fn)); }

    def('print', function (args, kw) {
      var sep = kw.sep !== undefined ? str(kw.sep) : ' ';
      var end = kw.end !== undefined ? str(kw.end) : '\n';
      this.write(args.map(str).join(sep) + end);
      return null;
    });

    def('len', function (args) {
      var v = args[0];
      if (typeof v === 'string') return v.length;
      if (Array.isArray(v)) return v.length;
      if (v instanceof PyTuple) return v.items.length;
      if (v instanceof PyDict || v instanceof PySet) return v.size;
      if (v instanceof PyRange) return R.rangeLen(v);
      if (v instanceof R.PyInstance) {
        var m = v.cls.lookup('__len__');
        if (m) return this.callValue(R.bindIfFunc(v, m), [], null);
      }
      R.raisePy('TypeError', "object of type '" + R.typeName(v) + "' has no len()");
    });

    def('range', function (args) {
      var a = args.map(function (x) { return Math.trunc(Number(nv(x))); });
      if (!a.length) argErr('range', 'нужен хотя бы один аргумент');
      if (a.length === 1) return new PyRange(0, a[0], 1);
      if (a.length === 2) return new PyRange(a[0], a[1], 1);
      if (a[2] === 0) R.raisePy('ValueError', 'range() arg 3 must not be zero');
      return new PyRange(a[0], a[1], a[2]);
    });

    def('enumerate', function (args, kw) {
      var items = this.iterate(args[0]);
      var start = args[1] !== undefined ? Number(nv(args[1])) : (kw.start !== undefined ? Number(nv(kw.start)) : 0);
      return items.map(function (v, i) { return new PyTuple([i + start, v]); });
    });

    def('zip', function (args) {
      var lists = args.map(function (a) { return this.iterate(a); }, this);
      var n = Math.min.apply(Math, lists.map(function (l) { return l.length; }));
      var out = [];
      for (var i = 0; i < n; i++) out.push(new PyTuple(lists.map(function (l) { return l[i]; })));
      return out;
    });

    def('sorted', function (args, kw) {
      var items = this.iterate(args[0]);
      var self = this;
      var keyFn = kw.key || null;
      var rev = kw.reverse !== undefined && R.truthy(kw.reverse);
      var decorated = items.map(function (v) {
        return { v: v, k: keyFn ? self.callValue(keyFn, [v], null) : v };
      });
      decorated.sort(function (x, y) { return R.cmp(x.k, y.k); });
      if (rev) decorated.reverse();
      return decorated.map(function (d) { return d.v; });
    });

    def('reversed', function (args) { return this.iterate(args[0]).reverse(); });

    def('sum', function (args) {
      var items = this.iterate(args[0]);
      var acc = args[1] !== undefined ? args[1] : 0;
      for (var i = 0; i < items.length; i++) acc = this.binop('+', acc, items[i]);
      return acc;
    });

    def('min', function (args, kw) { return minmax.call(this, args, kw, -1); });
    def('max', function (args, kw) { return minmax.call(this, args, kw, 1); });

    function minmax(args, kw, dir) {
      var items = args.length === 1 ? this.iterate(args[0]) : args;
      if (!items.length) R.raisePy('ValueError', 'аргумент пустой');
      var self = this;
      var keyFn = kw.key || null;
      var best = items[0];
      var bestK = keyFn ? this.callValue(keyFn, [best], null) : best;
      for (var i = 1; i < items.length; i++) {
        var k = keyFn ? self.callValue(keyFn, [items[i]], null) : items[i];
        if (R.cmp(k, bestK) * dir > 0) { best = items[i]; bestK = k; }
      }
      return best;
    }

    def('abs', function (args) {
      var v = args[0];
      if (!isNum(v)) R.raisePy('TypeError', "bad operand type for abs(): '" + R.typeName(v) + "'");
      return mkNum(Math.abs(Number(nv(v))), R.isFloat(v));
    });

    def('round', function (args) {
      var x = Number(nv(args[0]));
      var d = args[1] !== undefined ? Math.trunc(Number(nv(args[1]))) : 0;
      var p = Math.pow(10, d);
      // Python округляет .5 к чётному — воспроизводим, иначе тесты на деньгах врут
      var scaled = x * p;
      var r = Math.round(scaled);
      if (Math.abs(scaled % 1) === 0.5 && r % 2 !== 0) r -= 1;
      var res = r / p;
      return args[1] === undefined ? (R.isFloat(args[0]) ? res : Math.round(x)) : new PyFloat(res);
    });

    def('int', function (args) {
      if (!args.length) return 0;
      var v = args[0];
      if (typeof v === 'string') {
        var base = args[1] !== undefined ? Number(nv(args[1])) : 10;
        var s10 = v.trim();
        // Python не прощает «почти числа»: int("80o8") — это ValueError, а не 80
        var okStr = base === 10 ? /^[+-]?\d+$/.test(s10)
          : base === 16 ? /^[+-]?(0[xX])?[0-9a-fA-F]+$/.test(s10)
          : base === 2 ? /^[+-]?(0[bB])?[01]+$/.test(s10)
          : /^[+-]?\w+$/.test(s10);
        var n = parseInt(s10.replace(/^([+-]?)0[xXbBoO]/, '$1'), base);
        if (!okStr || isNaN(n)) R.raisePy('ValueError', "invalid literal for int() with base " + base + ": " + repr(v));
        return n;
      }
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (isNum(v)) return Math.trunc(Number(nv(v)));
      R.raisePy('TypeError', "int() argument must be a string or a number, not '" + R.typeName(v) + "'");
    });

    def('float', function (args) {
      if (!args.length) return new PyFloat(0);
      var v = args[0];
      if (typeof v === 'string') {
        var sf = v.trim();
        var n = parseFloat(sf);
        if (isNaN(n) || !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(sf)) {
          R.raisePy('ValueError', 'could not convert string to float: ' + repr(v));
        }
        return new PyFloat(n);
      }
      if (typeof v === 'boolean') return new PyFloat(v ? 1 : 0);
      if (isNum(v)) return new PyFloat(Number(nv(v)));
      R.raisePy('TypeError', "float() argument must be a string or a number");
    });

    def('str', function (args) { return args.length ? str(args[0]) : ''; });
    def('repr', function (args) { return repr(args[0]); });
    def('bool', function (args) { return args.length ? R.truthy(args[0]) : false; });
    def('list', function (args) { return args.length ? this.iterate(args[0]) : []; });
    def('tuple', function (args) { return new PyTuple(args.length ? this.iterate(args[0]) : []); });
    def('set', function (args) { return new PySet(args.length ? this.iterate(args[0]) : []); });

    def('dict', function (args, kw) {
      var d = new PyDict();
      if (args.length) {
        var src = args[0];
        if (src instanceof PyDict) src.entries().forEach(function (e) { d.set(e[0], e[1]); });
        else this.iterate(src).forEach(function (pair) {
          var it = pair instanceof PyTuple ? pair.items : pair;
          d.set(it[0], it[1]);
        });
      }
      for (var k in kw) d.set(k, kw[k]);
      return d;
    });

    def('type', function (args) {
      var v = args[0];
      if (v instanceof R.PyInstance) return v.cls;
      var name = R.typeName(v);
      var cls = new R.PyClass(name, [], new Map());
      cls.__isTypeOf = true;
      return cls;
    });

    def('isinstance', function (args) {
      var v = args[0], t = args[1];
      var types = t instanceof PyTuple ? t.items : [t];
      for (var i = 0; i < types.length; i++) {
        var tt = types[i];
        var want = tt instanceof R.PyClass ? tt.name
          : (tt instanceof R.PyBuiltin ? tt.name : str(tt));
        if (v instanceof R.PyInstance && tt instanceof R.PyClass && !tt.__isTypeOf) {
          if (v.cls.isSub(tt)) return true;
          continue;
        }
        var actual = R.typeName(v);
        if (actual === want) return true;
        if (want === 'float' && typeof v === 'number') return false;
        if (want === 'int' && typeof v === 'boolean') return true;
        if (want === 'object') return true;
      }
      return false;
    });

    def('any', function (args) { return this.iterate(args[0]).some(R.truthy); });
    def('all', function (args) { return this.iterate(args[0]).every(R.truthy); });

    def('map', function (args) {
      var fn = args[0], self = this;
      return this.iterate(args[1]).map(function (v) { return self.callValue(fn, [v], null); });
    });

    def('filter', function (args) {
      var fn = args[0], self = this;
      return this.iterate(args[1]).filter(function (v) {
        return fn === null ? R.truthy(v) : R.truthy(self.callValue(fn, [v], null));
      });
    });

    def('ord', function (args) { return String(args[0]).charCodeAt(0); });
    def('chr', function (args) { return String.fromCharCode(Number(nv(args[0]))); });

    def('divmod', function (args) {
      var a = Number(nv(args[0])), b = Number(nv(args[1]));
      if (b === 0) R.raisePy('ZeroDivisionError', 'integer division or modulo by zero');
      return new PyTuple([Math.floor(a / b), ((a % b) + b) % b]);
    });

    def('format', function (args) { return R.formatValue(args[0], args[1] === undefined ? '' : str(args[1])); });

    def('hasattr', function (args) {
      try { this.getAttr(args[0], str(args[1])); return true; } catch (e) { return false; }
    });
    def('getattr', function (args) {
      try { return this.getAttr(args[0], str(args[1])); }
      catch (e) {
        if (args.length > 2) return args[2];
        throw e;
      }
    });
    def('setattr', function (args) {
      var o = args[0];
      if (o instanceof R.PyInstance) o.fields.set(str(args[1]), args[2]);
      return null;
    });

    def('input', function (args) {
      if (args.length) this.write(str(args[0]));
      R.raisePy('RuntimeError', 'input() в тренажёре недоступен — задайте данные прямо в коде');
    });

    def('open', function (args, kw) {
      var path = str(args[0]);
      var mode = args[1] !== undefined ? str(args[1]) : (kw.mode ? str(kw.mode) : 'r');
      return makeFile(this, path, mode);
    });

    // исключения как имена: нужны и для raise, и для except
    ['Exception', 'BaseException', 'ValueError', 'TypeError', 'KeyError', 'IndexError',
      'ZeroDivisionError', 'AssertionError', 'RuntimeError', 'NameError', 'AttributeError',
      'StopIteration', 'FileNotFoundError', 'ImportError', 'ModuleNotFoundError', 'OSError',
      'NotImplementedError', 'TimeoutError', 'ConnectionError', 'KeyboardInterrupt'].forEach(function (name) {
      var cls = new R.PyClass(name, [], new Map());
      cls.isException = true;
      cls.__excName = name;
      g.set(name, cls);
    });

    g.set('__name__', '__main__');
    g.set('True', true);
    g.set('False', false);
    g.set('None', null);
  }

  /* ─────────── работа с виртуальными файлами ─────────── */

  function makeFile(interp, path, mode) {
    var store = interp.stand && interp.stand.fs ? interp.stand.fs : null;
    var read = function () {
      if (store) {
        var node = store.readFile(path);
        if (node === null) R.raisePy('FileNotFoundError', "[Errno 2] No such file or directory: '" + path + "'");
        return node;
      }
      if (!(path in interp.files)) R.raisePy('FileNotFoundError', "[Errno 2] No such file or directory: '" + path + "'");
      return interp.files[path];
    };
    var write = function (text) {
      if (store) store.writeFile(path, text);
      else interp.files[path] = text;
    };

    var buffer = mode.indexOf('r') >= 0 ? read() : (mode.indexOf('a') >= 0 ? (function () {
      try { return read(); } catch (e) { return ''; }
    })() : '');
    if (mode.indexOf('w') >= 0) write('');

    var f = {
      __attrs: {},
      __enter: function () { return f; },
      __exit: function () { return false; }
    };
    f.__attrs.read = B('read', function () { return buffer; });
    f.__attrs.write = B('write', function (args) {
      var t = R.str(args[0]);
      buffer += t;
      write(buffer);
      return t.length;
    });
    f.__attrs.readlines = B('readlines', function () {
      return buffer.length ? buffer.split('\n').map(function (l, i, arr) {
        return i < arr.length - 1 ? l + '\n' : l;
      }).filter(function (l) { return l !== ''; }) : [];
    });
    f.__attrs.writelines = B('writelines', function (args) {
      var self = this;
      this.iterate(args[0]).forEach(function (l) { buffer += R.str(l); });
      write(buffer);
      return null;
    });
    f.__attrs.close = B('close', function () { return null; });
    f.__iter = function () {
      return buffer.length ? buffer.split('\n').filter(function (l, i, a) { return !(i === a.length - 1 && l === ''); })
        .map(function (l, i, a) { return i < a.length - 1 ? l + '\n' : l; }) : [];
    };
    return f;
  }

  /* ─────────── методы типов ─────────── */

  function method(interp, obj, name) {
    ready();
    var str = R.str, nv = R.nv;

    if (typeof obj === 'string') return strMethod(interp, obj, name);
    if (Array.isArray(obj)) return listMethod(interp, obj, name);
    if (obj instanceof R.PyDict) return dictMethod(interp, obj, name);
    if (obj instanceof R.PySet) return setMethod(interp, obj, name);
    if (obj instanceof R.PyTuple) {
      if (name === 'count') return B('count', function (args) {
        return obj.items.filter(function (x) { return R.eq(x, args[0]); }).length;
      });
      if (name === 'index') return B('index', function (args) {
        for (var i = 0; i < obj.items.length; i++) if (R.eq(obj.items[i], args[0])) return i;
        R.raisePy('ValueError', str(args[0]) + ' is not in tuple');
      });
    }
    return null;
  }

  function strMethod(interp, s, name) {
    var str = R.str, nv = R.nv;
    var M = {
      upper: function () { return s.toUpperCase(); },
      lower: function () { return s.toLowerCase(); },
      title: function () { return s.replace(/\w\S*/g, function (t) { return t[0].toUpperCase() + t.slice(1).toLowerCase(); }); },
      capitalize: function () { return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s; },
      strip: function (a) { return a.length ? trimChars(s, str(a[0]), true, true) : s.trim(); },
      lstrip: function (a) { return a.length ? trimChars(s, str(a[0]), true, false) : s.replace(/^\s+/, ''); },
      rstrip: function (a) { return a.length ? trimChars(s, str(a[0]), false, true) : s.replace(/\s+$/, ''); },
      split: function (a) {
        if (!a.length || a[0] === null) return s.split(/\s+/).filter(function (x) { return x !== ''; });
        var sep = str(a[0]);
        var parts = s.split(sep);
        if (a.length > 1) {
          var maxs = Number(nv(a[1]));
          if (maxs >= 0 && parts.length > maxs + 1) {
            parts = parts.slice(0, maxs).concat(parts.slice(maxs).join(sep));
          }
        }
        return parts;
      },
      rsplit: function (a) {
        var parts = M.split(a);
        if (a.length > 1) {
          var maxs = Number(nv(a[1])), sep = str(a[0]);
          var all = s.split(sep);
          if (all.length > maxs + 1) parts = [all.slice(0, all.length - maxs).join(sep)].concat(all.slice(all.length - maxs));
        }
        return parts;
      },
      splitlines: function () { return s.length ? s.replace(/\n$/, '').split('\n') : []; },
      join: function (a) {
        var items = interp.iterate(a[0]);
        return items.map(function (x) {
          if (typeof x !== 'string') R.raisePy('TypeError', 'sequence item: expected str instance, ' + R.typeName(x) + ' found');
          return x;
        }).join(s);
      },
      replace: function (a) {
        var from = str(a[0]), to = str(a[1]);
        if (a.length > 2) {
          var count = Number(nv(a[2])), out = s;
          for (var i = 0; i < count; i++) out = out.replace(from, to);
          return out;
        }
        return s.split(from).join(to);
      },
      startswith: function (a) {
        var p = a[0] instanceof R.PyTuple ? a[0].items : [a[0]];
        return p.some(function (x) { return s.indexOf(str(x)) === 0; });
      },
      endswith: function (a) {
        var p = a[0] instanceof R.PyTuple ? a[0].items : [a[0]];
        return p.some(function (x) { return s.lastIndexOf(str(x)) === s.length - str(x).length && str(x).length <= s.length; });
      },
      find: function (a) { return s.indexOf(str(a[0])); },
      rfind: function (a) { return s.lastIndexOf(str(a[0])); },
      index: function (a) {
        var i = s.indexOf(str(a[0]));
        if (i < 0) R.raisePy('ValueError', 'substring not found');
        return i;
      },
      count: function (a) {
        var sub = str(a[0]);
        if (!sub) return s.length + 1;
        return s.split(sub).length - 1;
      },
      isdigit: function () { return /^\d+$/.test(s); },
      isalpha: function () { return /^[A-Za-zА-Яа-яЁё]+$/.test(s); },
      isalnum: function () { return /^[A-Za-z0-9А-Яа-яЁё]+$/.test(s); },
      isspace: function () { return s.length > 0 && /^\s+$/.test(s); },
      isupper: function () { return s === s.toUpperCase() && /[A-Za-zА-Яа-я]/.test(s); },
      islower: function () { return s === s.toLowerCase() && /[A-Za-zА-Яа-я]/.test(s); },
      zfill: function (a) { return s.padStart(Number(nv(a[0])), '0'); },
      ljust: function (a) { return s.padEnd(Number(nv(a[0])), a[1] ? str(a[1]) : ' '); },
      rjust: function (a) { return s.padStart(Number(nv(a[0])), a[1] ? str(a[1]) : ' '); },
      center: function (a) {
        var w = Number(nv(a[0])), fill = a[1] ? str(a[1]) : ' ';
        if (s.length >= w) return s;
        var left = Math.floor((w - s.length) / 2);
        return fill.repeat(left) + s + fill.repeat(w - s.length - left);
      },
      removeprefix: function (a) { var p = str(a[0]); return s.indexOf(p) === 0 ? s.slice(p.length) : s; },
      removesuffix: function (a) { var p = str(a[0]); return p && s.slice(-p.length) === p ? s.slice(0, -p.length) : s; },
      format: function (a, kw) {
        var idx = 0;
        return s.replace(/\{([^{}]*)\}/g, function (all, inner) {
          var spec = '';
          var ci = inner.indexOf(':');
          if (ci >= 0) { spec = inner.slice(ci + 1); inner = inner.slice(0, ci); }
          var v;
          if (inner === '') v = a[idx++];
          else if (/^\d+$/.test(inner)) v = a[parseInt(inner, 10)];
          else v = kw[inner];
          return R.formatValue(v, spec);
        });
      },
      encode: function () { return s; },
      partition: function (a) {
        var sep = str(a[0]), i = s.indexOf(sep);
        return i < 0 ? new R.PyTuple([s, '', '']) : new R.PyTuple([s.slice(0, i), sep, s.slice(i + sep.length)]);
      }
    };
    return M[name] ? B(name, function (args, kw) { return M[name](args, kw || {}); }) : null;
  }

  function trimChars(s, chars, left, right) {
    var i = 0, j = s.length;
    if (left) while (i < j && chars.indexOf(s[i]) >= 0) i++;
    if (right) while (j > i && chars.indexOf(s[j - 1]) >= 0) j--;
    return s.slice(i, j);
  }

  function listMethod(interp, arr, name) {
    var M = {
      append: function (a) { arr.push(a[0]); return null; },
      extend: function (a) { arr.push.apply(arr, interp.iterate(a[0])); return null; },
      insert: function (a) {
        var i = Math.trunc(Number(R.nv(a[0])));
        if (i < 0) i = Math.max(0, arr.length + i);
        arr.splice(Math.min(i, arr.length), 0, a[1]);
        return null;
      },
      remove: function (a) {
        for (var i = 0; i < arr.length; i++) if (R.eq(arr[i], a[0])) { arr.splice(i, 1); return null; }
        R.raisePy('ValueError', 'list.remove(x): x not in list');
      },
      pop: function (a) {
        if (!arr.length) R.raisePy('IndexError', 'pop from empty list');
        var i = a.length ? Math.trunc(Number(R.nv(a[0]))) : arr.length - 1;
        if (i < 0) i += arr.length;
        if (i < 0 || i >= arr.length) R.raisePy('IndexError', 'pop index out of range');
        return arr.splice(i, 1)[0];
      },
      index: function (a) {
        for (var i = 0; i < arr.length; i++) if (R.eq(arr[i], a[0])) return i;
        R.raisePy('ValueError', R.repr(a[0]) + ' is not in list');
      },
      count: function (a) { return arr.filter(function (x) { return R.eq(x, a[0]); }).length; },
      sort: function (a, kw) {
        var keyFn = kw.key || null, self = interp;
        var dec = arr.map(function (v) { return { v: v, k: keyFn ? self.callValue(keyFn, [v], null) : v }; });
        dec.sort(function (x, y) { return R.cmp(x.k, y.k); });
        if (kw.reverse !== undefined && R.truthy(kw.reverse)) dec.reverse();
        for (var i = 0; i < arr.length; i++) arr[i] = dec[i].v;
        return null;
      },
      reverse: function () { arr.reverse(); return null; },
      clear: function () { arr.length = 0; return null; },
      copy: function () { return arr.slice(); }
    };
    return M[name] ? B(name, function (args, kw) { return M[name](args, kw || {}); }) : null;
  }

  function dictMethod(interp, d, name) {
    var M = {
      keys: function () { return d.keys(); },
      values: function () { return d.values(); },
      items: function () { return d.entries().map(function (e) { return new R.PyTuple([e[0], e[1]]); }); },
      get: function (a) { return d.has(a[0]) ? d.get(a[0]) : (a.length > 1 ? a[1] : null); },
      pop: function (a) {
        if (d.has(a[0])) { var v = d.get(a[0]); d.del(a[0]); return v; }
        if (a.length > 1) return a[1];
        R.raisePy('KeyError', R.repr(a[0]));
      },
      setdefault: function (a) {
        if (!d.has(a[0])) d.set(a[0], a.length > 1 ? a[1] : null);
        return d.get(a[0]);
      },
      update: function (a, kw) {
        if (a.length) {
          var src = a[0];
          if (src instanceof R.PyDict) src.entries().forEach(function (e) { d.set(e[0], e[1]); });
          else interp.iterate(src).forEach(function (p) {
            var it = p instanceof R.PyTuple ? p.items : p;
            d.set(it[0], it[1]);
          });
        }
        for (var k in kw) d.set(k, kw[k]);
        return null;
      },
      clear: function () { d.map.clear(); return null; },
      copy: function () { return new R.PyDict(d.entries()); }
    };
    return M[name] ? B(name, function (args, kw) { return M[name](args, kw || {}); }) : null;
  }

  function setMethod(interp, st, name) {
    var M = {
      add: function (a) { st.add(a[0]); return null; },
      remove: function (a) {
        if (!st.del(a[0])) R.raisePy('KeyError', R.repr(a[0]));
        return null;
      },
      discard: function (a) { st.del(a[0]); return null; },
      union: function (a) { return new R.PySet(st.items().concat(interp.iterate(a[0]))); },
      intersection: function (a) {
        var other = new R.PySet(interp.iterate(a[0]));
        return new R.PySet(st.items().filter(function (x) { return other.has(x); }));
      },
      difference: function (a) {
        var other = new R.PySet(interp.iterate(a[0]));
        return new R.PySet(st.items().filter(function (x) { return !other.has(x); }));
      },
      issubset: function (a) {
        var other = new R.PySet(interp.iterate(a[0]));
        return st.items().every(function (x) { return other.has(x); });
      },
      issuperset: function (a) {
        return interp.iterate(a[0]).every(function (x) { return st.has(x); });
      },
      clear: function () { st.map.clear(); return null; },
      copy: function () { return new R.PySet(st.items()); }
    };
    return M[name] ? B(name, function (args, kw) { return M[name](args, kw || {}); }) : null;
  }

  root.PyBuiltins = { install: install, method: method, B: B };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
