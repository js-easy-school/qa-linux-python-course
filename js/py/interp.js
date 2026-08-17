/* Интерпретатор Python: выполняет AST.
   Числа с плавающей точкой держим в обёртке PyFloat — иначе print(10 / 2) напечатал бы "5",
   а настоящий Python печатает "5.0", и человек привыкнет к неправде. */
(function (root) {
  'use strict';

  /* ═══════════ значения ═══════════ */

  function PyFloat(v) { this.v = v; }
  function PyTuple(items) { this.items = items; }
  function PySlice(a, b, c) { this.lower = a; this.upper = b; this.step = c; }
  function PyRange(start, stop, step) { this.start = start; this.stop = stop; this.step = step; }
  function PyFunc(name, params, body, scope, interp) {
    this.name = name; this.params = params; this.body = body; this.scope = scope; this.interp = interp;
  }
  function PyBuiltin(name, fn, opts) {
    this.name = name; this.fn = fn;
    this.needsInterp = !!(opts && opts.needsInterp);
  }
  function PyBound(self, fn) { this.self = self; this.fn = fn; }
  function PyClass(name, bases, dict) { this.name = name; this.bases = bases || []; this.dict = dict || new Map(); }
  function PyInstance(cls) { this.cls = cls; this.fields = new Map(); }
  function PyModule(name, dict) { this.name = name; this.dict = dict; }

  function PyDict(pairs) {
    this.map = new Map();                       // ключ-строка -> {k, v}
    if (pairs) for (var i = 0; i < pairs.length; i++) this.set(pairs[i][0], pairs[i][1]);
  }
  function PySet(items) {
    this.map = new Map();
    if (items) for (var i = 0; i < items.length; i++) this.add(items[i]);
  }

  function keyOf(v) {
    if (v === null) return 'N';
    if (typeof v === 'boolean') return 'b' + v;
    if (typeof v === 'number') return 'n' + v;
    if (v instanceof PyFloat) return 'n' + v.v;
    if (typeof v === 'string') return 's' + v;
    if (v instanceof PyTuple) return 't(' + v.items.map(keyOf).join(',') + ')';
    if (v instanceof PyInstance) return 'o' + (v.__id || (v.__id = ++keyOf._id));
    return 'x' + String(v);
  }
  keyOf._id = 0;

  PyDict.prototype.set = function (k, v) { this.map.set(keyOf(k), { k: k, v: v }); };
  PyDict.prototype.get = function (k) { var e = this.map.get(keyOf(k)); return e ? e.v : undefined; };
  PyDict.prototype.has = function (k) { return this.map.has(keyOf(k)); };
  PyDict.prototype.del = function (k) { return this.map.delete(keyOf(k)); };
  PyDict.prototype.keys = function () { var r = []; this.map.forEach(function (e) { r.push(e.k); }); return r; };
  PyDict.prototype.values = function () { var r = []; this.map.forEach(function (e) { r.push(e.v); }); return r; };
  PyDict.prototype.entries = function () { var r = []; this.map.forEach(function (e) { r.push([e.k, e.v]); }); return r; };
  Object.defineProperty(PyDict.prototype, 'size', { get: function () { return this.map.size; } });

  PySet.prototype.add = function (v) { this.map.set(keyOf(v), v); };
  PySet.prototype.has = function (v) { return this.map.has(keyOf(v)); };
  PySet.prototype.del = function (v) { return this.map.delete(keyOf(v)); };
  PySet.prototype.items = function () { var r = []; this.map.forEach(function (v) { r.push(v); }); return r; };
  Object.defineProperty(PySet.prototype, 'size', { get: function () { return this.map.size; } });

  /* ═══════════ исключения и сигналы ═══════════ */

  function PyExc(type, message, value) {
    this.type = type;              // строка-имя или PyClass
    this.message = message == null ? '' : String(message);
    this.value = value || null;    // экземпляр, если поднимали объект
  }
  PyExc.prototype.typeName = function () {
    return typeof this.type === 'string' ? this.type : (this.type && this.type.name) || 'Exception';
  };
  function raisePy(type, msg) { throw new PyExc(type, msg); }

  function BreakSig() {}
  function ContinueSig() {}
  function ReturnSig(v) { this.value = v; }

  /* ═══════════ вспомогательное ═══════════ */

  function isNum(v) { return typeof v === 'number' || v instanceof PyFloat; }
  function nv(v) { return v instanceof PyFloat ? v.v : v; }          // числовое значение
  function isFloat(v) { return v instanceof PyFloat; }
  function mkNum(v, floaty) { return floaty ? new PyFloat(v) : v; }
  function isSeq(v) { return Array.isArray(v) || v instanceof PyTuple || typeof v === 'string'; }
  function seqItems(v) { return Array.isArray(v) ? v : v instanceof PyTuple ? v.items : String(v).split(''); }

  function truthy(v) {
    if (v === null || v === undefined || v === false) return false;
    if (v === true) return true;
    if (typeof v === 'number') return v !== 0;
    if (v instanceof PyFloat) return v.v !== 0;
    if (typeof v === 'string') return v.length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (v instanceof PyTuple) return v.items.length > 0;
    if (v instanceof PyDict || v instanceof PySet) return v.size > 0;
    return true;
  }

  function typeName(v) {
    if (v === null || v === undefined) return 'NoneType';
    if (typeof v === 'boolean') return 'bool';
    if (typeof v === 'number') return 'int';
    if (v instanceof PyFloat) return 'float';
    if (typeof v === 'string') return 'str';
    if (Array.isArray(v)) return 'list';
    if (v instanceof PyTuple) return 'tuple';
    if (v instanceof PyDict) return 'dict';
    if (v instanceof PySet) return 'set';
    if (v instanceof PyRange) return 'range';
    if (v instanceof PyFunc || v instanceof PyBuiltin || v instanceof PyBound) return 'function';
    if (v instanceof PyClass) return 'type';
    if (v instanceof PyInstance) return v.cls.name;
    if (v instanceof PyModule) return 'module';
    return 'object';
  }

  function fmtFloat(x) {
    if (!isFinite(x)) return x > 0 ? 'inf' : (x < 0 ? '-inf' : 'nan');
    if (Number.isInteger(x) && Math.abs(x) < 1e16) return x.toFixed(1);
    var s = String(x);
    if (s.indexOf('e') >= 0) return s;
    return s;
  }

  function str(v) {
    if (v === null || v === undefined) return 'None';
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
    if (v instanceof PyFloat) return fmtFloat(v.v);
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return '[' + v.map(repr).join(', ') + ']';
    if (v instanceof PyTuple) return '(' + v.items.map(repr).join(', ') + (v.items.length === 1 ? ',' : '') + ')';
    if (v instanceof PyDict) return '{' + v.entries().map(function (e) { return repr(e[0]) + ': ' + repr(e[1]); }).join(', ') + '}';
    if (v instanceof PySet) return v.size ? '{' + v.items().map(repr).join(', ') + '}' : 'set()';
    if (v instanceof PyRange) return 'range(' + v.start + ', ' + v.stop + (v.step !== 1 ? ', ' + v.step : '') + ')';
    if (v instanceof PyFunc) return '<function ' + v.name + '>';
    if (v instanceof PyBuiltin) return '<built-in function ' + v.name + '>';
    if (v instanceof PyBound) return '<bound method>';
    if (v instanceof PyClass) return "<class '" + v.name + "'>";
    if (v instanceof PyModule) return "<module '" + v.name + "'>";
    if (v instanceof PyInstance) {
      if (v.__excMessage !== undefined) return v.__excMessage;
      if (v.cls && v.cls.isException) {
        var ar = v.fields.get('args');
        return Array.isArray(ar) && ar.length ? str(ar[0]) : '';
      }
      var s = v.cls.lookup && v.cls.lookup('__str__');
      if (s && v.__interp) return str(v.__interp.callValue(bindIfFunc(v, s), [], null));
      var flds = [];
      v.fields.forEach(function (val, k) { flds.push(k + '=' + repr(val)); });
      return '<' + v.cls.name + ' ' + flds.join(' ') + '>';
    }
    return String(v);
  }

  function repr(v) {
    if (typeof v === 'string') {
      var esc = v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
      return esc.indexOf("'") >= 0 && esc.indexOf('"') < 0 ? '"' + esc + '"' : "'" + esc.replace(/'/g, "\\'") + "'";
    }
    return str(v);
  }

  function bindIfFunc(self, fn) {
    if (fn instanceof PyFunc || fn instanceof PyBuiltin) return new PyBound(self, fn);
    return fn;
  }

  PyClass.prototype.lookup = function (name) {
    if (this.dict.has(name)) return this.dict.get(name);
    for (var i = 0; i < this.bases.length; i++) {
      var b = this.bases[i];
      if (b instanceof PyClass) {
        var f = b.lookup(name);
        if (f !== undefined) return f;
      }
    }
    return undefined;
  };
  PyClass.prototype.isSub = function (other) {
    if (this === other) return true;
    for (var i = 0; i < this.bases.length; i++) {
      if (this.bases[i] instanceof PyClass && this.bases[i].isSub(other)) return true;
    }
    return false;
  };

  /* ═══════════ равенство и сравнение ═══════════ */

  function eq(a, b) {
    if (a && a.__approx !== undefined) { var t = a; a = b; b = t; }
    if (b && b.__approx !== undefined && isNum(a)) {
      var diff = Math.abs(Number(nv(a)) - b.__approx);
      return b.__rel ? diff <= b.__tol * Math.abs(b.__approx) : diff <= b.__tol;
    }
    if (isNum(a) && isNum(b)) return nv(a) === nv(b);
    if (typeof a === 'boolean' || typeof b === 'boolean') {
      if (isNum(a) || isNum(b)) return Number(nv(a)) === Number(nv(b));
    }
    if (a === null || b === null) return a === b;
    if (typeof a === 'string' && typeof b === 'string') return a === b;
    if (Array.isArray(a) && Array.isArray(b)) return listEq(a, b);
    if (a instanceof PyTuple && b instanceof PyTuple) return listEq(a.items, b.items);
    if (a instanceof PyDict && b instanceof PyDict) {
      if (a.size !== b.size) return false;
      var ok = true;
      a.entries().forEach(function (e) { if (!b.has(e[0]) || !eq(b.get(e[0]), e[1])) ok = false; });
      return ok;
    }
    if (a instanceof PySet && b instanceof PySet) {
      if (a.size !== b.size) return false;
      return a.items().every(function (x) { return b.has(x); });
    }
    if (a instanceof PyInstance && a.cls.lookup('__eq__') && a.__interp) {
      return truthy(a.__interp.callValue(bindIfFunc(a, a.cls.lookup('__eq__')), [b], null));
    }
    return a === b;
  }

  function listEq(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (!eq(a[i], b[i])) return false;
    return true;
  }

  function cmp(a, b) {
    if (isNum(a) && isNum(b)) { var x = Number(nv(a)), y = Number(nv(b)); return x < y ? -1 : x > y ? 1 : 0; }
    if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
    if (isSeq(a) && isSeq(b) && !(typeof a === 'string')) {
      var ai = seqItems(a), bi = seqItems(b);
      for (var i = 0; i < Math.min(ai.length, bi.length); i++) {
        var c = cmp(ai[i], bi[i]);
        if (c !== 0) return c;
      }
      return ai.length - bi.length;
    }
    raisePy('TypeError', "'<' not supported between instances of '" + typeName(a) + "' and '" + typeName(b) + "'");
  }

  function contains(container, item) {
    if (typeof container === 'string') return container.indexOf(str(item)) >= 0;
    if (Array.isArray(container)) return container.some(function (x) { return eq(x, item); });
    if (container instanceof PyTuple) return container.items.some(function (x) { return eq(x, item); });
    if (container instanceof PyDict) return container.has(item);
    if (container instanceof PySet) return container.has(item);
    if (container instanceof PyRange) {
      var n = nv(item);
      if (typeof n !== 'number') return false;
      if (container.step > 0 ? (n < container.start || n >= container.stop) : (n > container.start || n <= container.stop)) return false;
      return (n - container.start) % container.step === 0;
    }
    raisePy('TypeError', "argument of type '" + typeName(container) + "' is not iterable");
  }

  /* ═══════════ область видимости ═══════════ */

  function Scope(parent, isFunc) {
    this.vars = new Map();
    this.parent = parent || null;
    this.isFunc = !!isFunc;
    this.globalNames = new Set();
  }
  Scope.prototype.get = function (name) {
    var s = this;
    while (s) {
      if (s.vars.has(name)) return s.vars.get(name);
      s = s.parent;
    }
    return undefined;
  };
  Scope.prototype.has = function (name) {
    var s = this;
    while (s) { if (s.vars.has(name)) return true; s = s.parent; }
    return false;
  };
  Scope.prototype.set = function (name, value) {
    if (this.globalNames.has(name)) {
      var g = this;
      while (g.parent) g = g.parent;
      g.vars.set(name, value);
      return;
    }
    this.vars.set(name, value);
  };
  Scope.prototype.global = function () {
    var g = this;
    while (g.parent) g = g.parent;
    return g;
  };

  /* ═══════════ интерпретатор ═══════════ */

  function Interp(opts) {
    opts = opts || {};
    this.out = opts.out || function () {};
    this.maxSteps = opts.maxSteps || 3000000;
    this.steps = 0;
    this.globals = new Scope(null, false);
    this.modules = {};
    this.stand = opts.stand || null;         // виртуальный стенд (см. shell/stand.js)
    this.files = opts.files || {};           // виртуальные файлы для open()
    root.PyBuiltins.install(this);
    if (root.PyStdlib) root.PyStdlib.install(this);
  }

  Interp.prototype.tick = function (line) {
    if (++this.steps > this.maxSteps) {
      var e = new Error('программа выполняется слишком долго — похоже на бесконечный цикл');
      e.isPyError = true;
      e.pyLine = line;
      throw e;
    }
  };

  Interp.prototype.write = function (s) { this.out(s); };

  Interp.prototype.run = function (src) {
    var ast = root.PyParser.parse(src);
    this.execBlock(ast.body, this.globals);
  };

  Interp.prototype.execBlock = function (body, scope) {
    for (var i = 0; i < body.length; i++) this.execStmt(body[i], scope);
  };

  Interp.prototype.execStmt = function (node, scope) {
    this.tick(node.line);
    var m = this['st_' + node.type];
    if (!m) throw new Error('не поддерживается: ' + node.type);
    try {
      return m.call(this, node, scope);
    } catch (e) {
      if (e instanceof PyExc && !e.line) e.line = node.line;
      if (e && e.isPyError && !e.pyLine) e.pyLine = node.line;
      throw e;
    }
  };

  Interp.prototype.st_ExprStmt = function (n, s) { this.eval(n.value, s); };
  Interp.prototype.st_Pass = function () {};
  Interp.prototype.st_Break = function () { throw new BreakSig(); };
  Interp.prototype.st_Continue = function () { throw new ContinueSig(); };
  Interp.prototype.st_Return = function (n, s) { throw new ReturnSig(n.value ? this.eval(n.value, s) : null); };
  Interp.prototype.st_Global = function (n, s) {
    for (var i = 0; i < n.names.length; i++) s.globalNames.add(n.names[i]);
  };

  Interp.prototype.st_Assign = function (n, s) {
    var val = this.eval(n.value, s);
    for (var i = 0; i < n.targets.length; i++) this.assign(n.targets[i], val, s);
  };

  Interp.prototype.st_AugAssign = function (n, s) {
    var cur = this.eval(n.target, s);
    var val = this.binop(n.op, cur, this.eval(n.value, s));
    this.assign(n.target, val, s);
  };

  Interp.prototype.st_Del = function (n, s) {
    for (var i = 0; i < n.targets.length; i++) {
      var t = n.targets[i];
      if (t.type === 'Name') {
        var sc = s;
        while (sc && !sc.vars.has(t.id)) sc = sc.parent;
        if (sc) sc.vars.delete(t.id);
      } else if (t.type === 'Subscript') {
        var obj = this.eval(t.value, s), key = this.eval(t.slice, s);
        if (obj instanceof PyDict) {
          if (!obj.del(key)) raisePy('KeyError', repr(key));
        } else if (Array.isArray(obj)) {
          obj.splice(this.index(obj.length, nv(key)), 1);
        }
      }
    }
  };

  Interp.prototype.assign = function (target, val, scope) {
    if (target.type === 'Name') { scope.set(target.id, val); return; }
    if (target.type === 'Tuple' || target.type === 'List') {
      var items = this.iterate(val);
      var elts = target.elts;
      var starIdx = -1;
      for (var k = 0; k < elts.length; k++) if (elts[k].type === 'Starred') starIdx = k;
      if (starIdx < 0) {
        if (items.length !== elts.length) {
          raisePy('ValueError', items.length < elts.length
            ? 'not enough values to unpack (expected ' + elts.length + ', got ' + items.length + ')'
            : 'too many values to unpack (expected ' + elts.length + ')');
        }
        for (var i = 0; i < elts.length; i++) this.assign(elts[i], items[i], scope);
      } else {
        var after = elts.length - starIdx - 1;
        for (var a = 0; a < starIdx; a++) this.assign(elts[a], items[a], scope);
        this.assign(elts[starIdx].value, items.slice(starIdx, items.length - after), scope);
        for (var b = 0; b < after; b++) this.assign(elts[starIdx + 1 + b], items[items.length - after + b], scope);
      }
      return;
    }
    if (target.type === 'Subscript') {
      var obj = this.eval(target.value, scope);
      var key = this.eval(target.slice, scope);
      if (obj instanceof PyDict) { obj.set(key, val); return; }
      if (Array.isArray(obj)) { obj[this.index(obj.length, nv(key))] = val; return; }
      if (obj instanceof PyInstance) {
        var si = obj.cls.lookup('__setitem__');
        if (si) { this.callValue(bindIfFunc(obj, si), [key, val], null); return; }
      }
      raisePy('TypeError', "'" + typeName(obj) + "' object does not support item assignment");
    }
    if (target.type === 'Attribute') {
      var o = this.eval(target.value, scope);
      if (o instanceof PyInstance) { o.fields.set(target.attr, val); return; }
      if (o instanceof PyClass) { o.dict.set(target.attr, val); return; }
      if (o instanceof PyModule) { o.dict[target.attr] = val; return; }
      raisePy('AttributeError', "'" + typeName(o) + "' object has no attribute '" + target.attr + "'");
    }
    raisePy('SyntaxError', 'нельзя присвоить значение этому выражению');
  };

  Interp.prototype.st_If = function (n, s) {
    if (truthy(this.eval(n.test, s))) this.execBlock(n.body, s);
    else if (n.orelse && n.orelse.length) this.execBlock(n.orelse, s);
  };

  Interp.prototype.st_While = function (n, s) {
    var broke = false;
    while (truthy(this.eval(n.test, s))) {
      this.tick(n.line);
      try {
        this.execBlock(n.body, s);
      } catch (e) {
        if (e instanceof BreakSig) { broke = true; break; }
        if (e instanceof ContinueSig) continue;
        throw e;
      }
    }
    if (!broke && n.orelse && n.orelse.length) this.execBlock(n.orelse, s);
  };

  Interp.prototype.st_For = function (n, s) {
    var items = this.iterate(this.eval(n.iter, s));
    var broke = false;
    for (var i = 0; i < items.length; i++) {
      this.tick(n.line);
      this.assign(n.target, items[i], s);
      try {
        this.execBlock(n.body, s);
      } catch (e) {
        if (e instanceof BreakSig) { broke = true; break; }
        if (e instanceof ContinueSig) continue;
        throw e;
      }
    }
    if (!broke && n.orelse && n.orelse.length) this.execBlock(n.orelse, s);
  };

  Interp.prototype.st_FuncDef = function (n, s) {
    (this.__order = this.__order || []).push(n.name);
    var fn = new PyFunc(n.name, n.params, n.body, s, this);
    fn.decorators = [];
    for (var i = n.decorators.length - 1; i >= 0; i--) {
      var d = this.eval(n.decorators[i], s);
      fn.decorators.unshift({ node: n.decorators[i], value: d });
    }
    var result = fn;
    for (var j = fn.decorators.length - 1; j >= 0; j--) {
      var dv = fn.decorators[j].value;
      if (dv && dv.__isMarker) { result.marks = (result.marks || []).concat([dv]); continue; }
      if (dv && (dv instanceof PyFunc || dv instanceof PyBuiltin || dv instanceof PyBound)) {
        var wrapped = this.callValue(dv, [result], null);
        if (wrapped !== null && wrapped !== undefined) {
          if (wrapped.marks === undefined && result.marks) wrapped.marks = result.marks;
          result = wrapped;
        }
      }
    }
    s.set(n.name, result);
  };

  Interp.prototype.st_ClassDef = function (n, s) {
    var bases = n.bases.map(function (b) { return this.eval(b, s); }, this);
    var cls = new PyClass(n.name, bases.filter(function (b) { return b instanceof PyClass; }), new Map());
    var clsScope = new Scope(s, false);
    this.execBlock(n.body, clsScope);
    clsScope.vars.forEach(function (v, k) { cls.dict.set(k, v); });
    // класс-исключение: помним, что он наследник Exception
    var baseNames = n.bases.map(function (b) { return b.type === 'Name' ? b.id : ''; });
    if (baseNames.some(function (b) { return /Error|Exception$/.test(b); })) cls.isException = true;
    if (bases.some(function (b) { return b instanceof PyClass && b.isException; })) cls.isException = true;
    s.set(n.name, cls);
  };

  Interp.prototype.st_Raise = function (n, s) {
    if (!n.exc) raisePy('RuntimeError', 'No active exception to re-raise');
    var v = this.eval(n.exc, s);
    if (v instanceof PyInstance) {
      var msg = v.fields.get('message');
      if (msg === undefined) {
        var a = v.fields.get('args');
        msg = a && Array.isArray(a) && a.length ? str(a[0]) : '';
      }
      throw new PyExc(v.cls, msg, v);
    }
    if (v instanceof PyClass) throw new PyExc(v, '');
    if (v instanceof PyExc) throw v;
    throw new PyExc('Exception', str(v));
  };

  Interp.prototype.st_Assert = function (n, s) {
    if (truthy(this.eval(n.test, s))) return;
    var msg = n.msg ? str(this.eval(n.msg, s)) : this.assertDetail(n.test, s);
    throw new PyExc('AssertionError', msg);
  };

  // pytest показывает, какие значения не сошлись — повторяем это поведение
  Interp.prototype.assertDetail = function (test, s) {
    try {
      if (test.type === 'Compare' && test.ops.length === 1) {
        var l = this.eval(test.left, s), r = this.eval(test.comparators[0], s);
        return 'assert ' + repr(l) + ' ' + test.ops[0] + ' ' + repr(r);
      }
      return 'assert ' + repr(this.eval(test, s));
    } catch (e) { return ''; }
  };

  Interp.prototype.st_Try = function (n, s) {
    var self = this;
    try {
      try {
        this.execBlock(n.body, s);
        if (n.orelse && n.orelse.length) this.execBlock(n.orelse, s);
      } catch (e) {
        if (e instanceof BreakSig || e instanceof ContinueSig || e instanceof ReturnSig) throw e;
        var exc = e instanceof PyExc ? e : (e && e.isPyError ? new PyExc('RuntimeError', e.message) : null);
        if (!exc) throw e;
        for (var i = 0; i < n.handlers.length; i++) {
          var h = n.handlers[i];
          if (!h.etype || this.excMatches(exc, this.eval(h.etype, s))) {
            if (h.name) s.set(h.name, this.excToValue(exc));
            self.execBlock(h.body, s);
            return;
          }
        }
        throw exc;
      }
    } finally {
      if (n.finalbody && n.finalbody.length) this.execBlock(n.finalbody, s);
    }
  };

  Interp.prototype.excToValue = function (exc) {
    if (exc.value) return exc.value;
    var cls = typeof exc.type === 'string' ? this.globals.get(exc.type) : exc.type;
    var inst = new PyInstance(cls instanceof PyClass ? cls : new PyClass(exc.typeName(), [], new Map()));
    inst.__interp = this;
    inst.fields.set('args', [exc.message]);
    inst.__excMessage = exc.message;
    return inst;
  };

  Interp.prototype.excMatches = function (exc, want) {
    var wants = want instanceof PyTuple ? want.items : [want];
    for (var i = 0; i < wants.length; i++) {
      var w = wants[i];
      var wname = w instanceof PyClass ? w.name : (w && w.__excName) || String(w);
      if (wname === 'Exception' || wname === 'BaseException') return true;
      if (exc.typeName() === wname) return true;
      if (w instanceof PyClass && exc.type instanceof PyClass && exc.type.isSub(w)) return true;
      // ArithmeticError и прочие группы не поддерживаем — курсу хватает точных имён
    }
    return false;
  };

  Interp.prototype.st_With = function (n, s) {
    var mgrs = [];
    for (var i = 0; i < n.items.length; i++) {
      var ctx = this.eval(n.items[i].ctx, s);
      var val = ctx;
      if (ctx && ctx.__enter) val = ctx.__enter(this);
      else if (ctx instanceof PyInstance && ctx.cls.lookup('__enter__')) {
        val = this.callValue(bindIfFunc(ctx, ctx.cls.lookup('__enter__')), [], null);
      }
      if (n.items[i].vars) this.assign(n.items[i].vars, val, s);
      mgrs.push(ctx);
    }
    var err = null;
    try {
      this.execBlock(n.body, s);
    } catch (e) {
      err = e;
    }
    for (var j = mgrs.length - 1; j >= 0; j--) {
      var m = mgrs[j];
      var swallowed = false;
      if (m && m.__exit) swallowed = m.__exit(this, err);
      else if (m instanceof PyInstance && m.cls.lookup('__exit__')) {
        this.callValue(bindIfFunc(m, m.cls.lookup('__exit__')), [null, null, null], null);
      }
      if (swallowed) err = null;
    }
    if (err) throw err;
  };

  Interp.prototype.st_Import = function (n, s) {
    for (var i = 0; i < n.names.length; i++) {
      var name = n.names[i].name;
      var mod = this.getModule(name);
      s.set(n.names[i].asname || name.split('.')[0], mod);
    }
  };

  Interp.prototype.st_ImportFrom = function (n, s) {
    var mod = this.getModule(n.module);
    for (var i = 0; i < n.names.length; i++) {
      var nm = n.names[i].name;
      if (nm === '*') {
        for (var k in mod.dict) if (k[0] !== '_') s.set(k, mod.dict[k]);
        continue;
      }
      if (!(nm in mod.dict)) raisePy('ImportError', "cannot import name '" + nm + "' from '" + n.module + "'");
      s.set(n.names[i].asname || nm, mod.dict[nm]);
    }
  };

  Interp.prototype.getModule = function (name) {
    var base = name.split('.')[0];
    if (!this.modules[base]) {
      raisePy('ModuleNotFoundError', "No module named '" + base + "' (в тренажёре доступны: " +
        Object.keys(this.modules).sort().join(', ') + ')');
    }
    return this.modules[base];
  };

  /* ═══════════ выражения ═══════════ */

  Interp.prototype.eval = function (node, scope) {
    this.tick(node.line);
    var m = this['ex_' + node.type];
    if (!m) throw new Error('не поддерживается выражение: ' + node.type);
    return m.call(this, node, scope);
  };

  Interp.prototype.ex_Num = function (n) { return n.isFloat ? new PyFloat(n.value) : n.value; };
  Interp.prototype.ex_Str = function (n) { return n.value; };
  Interp.prototype.ex_Const = function (n) { return n.value; };

  Interp.prototype.ex_FStr = function (n, s) {
    var out = '';
    for (var i = 0; i < n.parts.length; i++) {
      var p = n.parts[i];
      if (p.type === 'text') { out += p.value; continue; }
      var v = this.eval(p.node, s);
      out += p.conv === 'r' ? repr(v) : formatValue(v, p.spec);
    }
    return out;
  };

  Interp.prototype.ex_Name = function (n, s) {
    if (s.has(n.id)) return s.get(n.id);
    raisePy('NameError', "name '" + n.id + "' is not defined");
  };

  Interp.prototype.ex_List = function (n, s) {
    var out = [];
    for (var i = 0; i < n.elts.length; i++) {
      if (n.elts[i].type === 'Starred') out.push.apply(out, this.iterate(this.eval(n.elts[i].value, s)));
      else out.push(this.eval(n.elts[i], s));
    }
    return out;
  };

  Interp.prototype.ex_Tuple = function (n, s) {
    return new PyTuple(this.ex_List(n, s));
  };

  Interp.prototype.ex_Set = function (n, s) {
    return new PySet(n.elts.map(function (e) { return this.eval(e, s); }, this));
  };

  Interp.prototype.ex_Dict = function (n, s) {
    var d = new PyDict();
    for (var i = 0; i < n.keys.length; i++) d.set(this.eval(n.keys[i], s), this.eval(n.values[i], s));
    return d;
  };

  Interp.prototype.ex_Starred = function (n, s) { return this.eval(n.value, s); };

  Interp.prototype.ex_UnaryOp = function (n, s) {
    var v = this.eval(n.operand, s);
    if (n.op === 'not') return !truthy(v);
    if (n.op === '-') {
      if (!isNum(v)) raisePy('TypeError', "bad operand type for unary -: '" + typeName(v) + "'");
      return mkNum(-nv(v), isFloat(v));
    }
    return v;
  };

  Interp.prototype.ex_BoolOp = function (n, s) {
    var l = this.eval(n.left, s);
    if (n.op === 'and') return truthy(l) ? this.eval(n.right, s) : l;
    return truthy(l) ? l : this.eval(n.right, s);
  };

  Interp.prototype.ex_IfExp = function (n, s) {
    return truthy(this.eval(n.test, s)) ? this.eval(n.body, s) : this.eval(n.orelse, s);
  };

  Interp.prototype.ex_BinOp = function (n, s) {
    return this.binop(n.op, this.eval(n.left, s), this.eval(n.right, s));
  };

  Interp.prototype.binop = function (op, a, b) {
    if (op === '+') {
      if (typeof a === 'string' || typeof b === 'string') {
        if (typeof a !== 'string' || typeof b !== 'string') {
          raisePy('TypeError', 'can only concatenate str (not "' + typeName(typeof a === 'string' ? b : a) + '") to str');
        }
        return a + b;
      }
      if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
      if (a instanceof PyTuple && b instanceof PyTuple) return new PyTuple(a.items.concat(b.items));
    }
    if (op === '*') {
      if (typeof a === 'string' && isNum(b)) return a.repeat(Math.max(0, Math.floor(nv(b))));
      if (isNum(a) && typeof b === 'string') return b.repeat(Math.max(0, Math.floor(nv(a))));
      if (Array.isArray(a) && isNum(b)) {
        var out = [];
        for (var i = 0; i < nv(b); i++) out = out.concat(a);
        return out;
      }
    }
    if (op === '%' && typeof a === 'string') return sprintf(a, b);

    if (!isNum(a) || !isNum(b)) {
      raisePy('TypeError', "unsupported operand type(s) for " + op + ": '" + typeName(a) + "' and '" + typeName(b) + "'");
    }
    var x = Number(nv(a)), y = Number(nv(b));
    var floaty = isFloat(a) || isFloat(b);
    switch (op) {
      case '+': return mkNum(x + y, floaty);
      case '-': return mkNum(x - y, floaty);
      case '*': return mkNum(x * y, floaty);
      case '/':
        if (y === 0) raisePy('ZeroDivisionError', 'division by zero');
        return new PyFloat(x / y);                      // истинное деление всегда float
      case '//':
        if (y === 0) raisePy('ZeroDivisionError', 'integer division or modulo by zero');
        return mkNum(Math.floor(x / y), floaty);
      case '%':
        if (y === 0) raisePy('ZeroDivisionError', 'integer division or modulo by zero');
        return mkNum(((x % y) + y) % y, floaty);        // в Python знак берётся от делителя
      case '**': return mkNum(Math.pow(x, y), floaty || y < 0);
    }
    raisePy('TypeError', 'неизвестная операция ' + op);
  };

  Interp.prototype.ex_Compare = function (n, s) {
    var left = this.eval(n.left, s);
    for (var i = 0; i < n.ops.length; i++) {
      var right = this.eval(n.comparators[i], s);
      var op = n.ops[i], ok;
      switch (op) {
        case '==': ok = eq(left, right); break;
        case '!=': ok = !eq(left, right); break;
        case 'is': ok = left === right || (left === null && right === null) ||
          (isNum(left) && isNum(right) && nv(left) === nv(right) && typeof left === typeof right); break;
        case 'is not': ok = !(left === right || (left === null && right === null)); break;
        case 'in': ok = contains(right, left); break;
        case 'not in': ok = !contains(right, left); break;
        case '<': ok = cmp(left, right) < 0; break;
        case '<=': ok = cmp(left, right) <= 0; break;
        case '>': ok = cmp(left, right) > 0; break;
        case '>=': ok = cmp(left, right) >= 0; break;
      }
      if (!ok) return false;
      left = right;
    }
    return true;
  };

  Interp.prototype.index = function (len, i) {
    var k = Math.trunc(Number(i));
    if (k < 0) k += len;
    if (k < 0 || k >= len) raisePy('IndexError', 'list index out of range');
    return k;
  };

  Interp.prototype.ex_Subscript = function (n, s) {
    var obj = this.eval(n.value, s);
    var sl = n.slice;
    if (sl && sl.type === 'Slice') {
      var lo = sl.lower ? nv(this.eval(sl.lower, s)) : null;
      var hi = sl.upper ? nv(this.eval(sl.upper, s)) : null;
      var st = sl.step ? nv(this.eval(sl.step, s)) : null;
      return sliceValue(obj, lo, hi, st);
    }
    var key = this.eval(sl, s);
    if (obj instanceof PyDict) {
      if (!obj.has(key)) raisePy('KeyError', repr(key));
      return obj.get(key);
    }
    if (typeof obj === 'string') {
      var si = this.index(obj.length, nv(key));
      return obj[si];
    }
    if (Array.isArray(obj)) return obj[this.index(obj.length, nv(key))];
    if (obj instanceof PyTuple) return obj.items[this.index(obj.items.length, nv(key))];
    if (obj instanceof PyRange) return this.iterate(obj)[this.index(rangeLen(obj), nv(key))];
    if (obj instanceof PyInstance) {
      var gi = obj.cls.lookup('__getitem__');
      if (gi) return this.callValue(bindIfFunc(obj, gi), [key], null);
    }
    raisePy('TypeError', "'" + typeName(obj) + "' object is not subscriptable");
  };

  function sliceValue(obj, lo, hi, st) {
    var isStr = typeof obj === 'string';
    var items = isStr ? String(obj).split('') : Array.isArray(obj) ? obj : obj instanceof PyTuple ? obj.items : null;
    if (!items) raisePy('TypeError', "'" + typeName(obj) + "' object is not subscriptable");
    var n = items.length;
    var step = st === null || st === undefined ? 1 : Math.trunc(st);
    if (step === 0) raisePy('ValueError', 'slice step cannot be zero');
    var start, stop;
    if (step > 0) {
      start = lo === null || lo === undefined ? 0 : (lo < 0 ? Math.max(0, n + lo) : Math.min(lo, n));
      stop = hi === null || hi === undefined ? n : (hi < 0 ? Math.max(0, n + hi) : Math.min(hi, n));
    } else {
      start = lo === null || lo === undefined ? n - 1 : (lo < 0 ? n + lo : Math.min(lo, n - 1));
      stop = hi === null || hi === undefined ? -1 : (hi < 0 ? n + hi : Math.min(hi, n));
    }
    var out = [];
    if (step > 0) for (var i = start; i < stop; i += step) out.push(items[i]);
    else for (var j = start; j > stop; j += step) out.push(items[j]);
    if (isStr) return out.join('');
    if (obj instanceof PyTuple) return new PyTuple(out);
    return out;
  }

  function rangeLen(r) {
    var n = Math.ceil((r.stop - r.start) / r.step);
    return n > 0 ? n : 0;
  }

  Interp.prototype.ex_Attribute = function (n, s) {
    var obj = this.eval(n.value, s);
    return this.getAttr(obj, n.attr);
  };

  Interp.prototype.getAttr = function (obj, name) {
    if (obj instanceof PyModule) {
      if (name in obj.dict) return obj.dict[name];
      raisePy('AttributeError', "module '" + obj.name + "' has no attribute '" + name + "'");
    }
    if (obj instanceof PyInstance) {
      if (obj.fields.has(name)) return obj.fields.get(name);
      var f = obj.cls.lookup(name);
      if (f !== undefined) return bindIfFunc(obj, f);
      if (name === 'args') return [obj.__excMessage || ''];
      raisePy('AttributeError', "'" + obj.cls.name + "' object has no attribute '" + name + "'");
    }
    if (obj instanceof PyClass) {
      var cf = obj.lookup(name);
      if (cf !== undefined) return cf;
      if (name === '__name__') return obj.name;
      raisePy('AttributeError', "type object '" + obj.name + "' has no attribute '" + name + "'");
    }
    if (obj && obj.__attrs && name in obj.__attrs) return obj.__attrs[name];
    var meth = root.PyBuiltins.method(this, obj, name);
    if (meth) return meth;
    raisePy('AttributeError', "'" + typeName(obj) + "' object has no attribute '" + name + "'");
  };

  Interp.prototype.ex_Lambda = function (n, s) {
    return new PyFunc('<lambda>', n.params, [{ type: 'Return', value: n.body }], s, this);
  };

  Interp.prototype.ex_Comp = function (n, s) {
    var out = [];
    var dict = n.kind === 'dict' ? new PyDict() : null;
    var self = this;

    function walk(gi, scope) {
      if (gi >= n.generators.length) {
        if (dict) dict.set(self.eval(n.elt, scope), self.eval(n.value, scope));
        else out.push(self.eval(n.elt, scope));
        return;
      }
      var g = n.generators[gi];
      var items = self.iterate(self.eval(g.iter, scope));
      for (var i = 0; i < items.length; i++) {
        self.tick(n.line);
        self.assign(g.target, items[i], scope);
        var ok = true;
        for (var k = 0; k < g.ifs.length; k++) if (!truthy(self.eval(g.ifs[k], scope))) { ok = false; break; }
        if (ok) walk(gi + 1, scope);
      }
    }

    var inner = new Scope(s, false);
    walk(0, inner);
    if (dict) return dict;
    if (n.kind === 'set') return new PySet(out);
    return out;                       // list и генератор отдаём одинаково — списком
  };

  Interp.prototype.ex_Call = function (n, s) {
    var func = this.eval(n.func, s);
    var args = [];
    for (var i = 0; i < n.args.length; i++) {
      if (n.args[i].type === 'Starred') args.push.apply(args, this.iterate(this.eval(n.args[i].value, s)));
      else args.push(this.eval(n.args[i], s));
    }
    var kwargs = null;
    for (var k = 0; k < n.keywords.length; k++) {
      var kw = n.keywords[k];
      kwargs = kwargs || {};
      if (kw.name === null) {
        var d = this.eval(kw.value, s);
        if (d instanceof PyDict) d.entries().forEach(function (e) { kwargs[str(e[0])] = e[1]; });
      } else {
        kwargs[kw.name] = this.eval(kw.value, s);
      }
    }
    return this.callValue(func, args, kwargs, n);
  };

  Interp.prototype.callValue = function (func, args, kwargs, node) {
    this.tick(node && node.line);

    if (func instanceof PyBound) {
      return this.callValue(func.fn, [func.self].concat(args), kwargs, node);
    }
    if (func instanceof PyBuiltin) {
      return func.fn.call(this, args, kwargs || {});
    }
    if (func instanceof PyClass) {
      var inst = new PyInstance(func);
      inst.__interp = this;
      var init = func.lookup('__init__');
      if (init) this.callValue(new PyBound(inst, init), args, kwargs, node);
      else if (func.isException) inst.fields.set('args', args.slice());
      return inst;
    }
    if (typeof func === 'function') return func.call(this, args, kwargs || {});
    if (!(func instanceof PyFunc)) {
      raisePy('TypeError', "'" + typeName(func) + "' object is not callable");
    }

    var scope = new Scope(func.scope, true);
    var params = func.params;
    var used = 0;
    for (var i = 0; i < params.length; i++) {
      var p = params[i];
      if (p.star) { scope.set(p.name, new PyTuple(args.slice(used))); used = args.length; continue; }
      if (p.dstar) {
        var d = new PyDict();
        if (kwargs) for (var kk in kwargs) if (!params.some(function (q) { return q.name === kk; })) d.set(kk, kwargs[kk]);
        scope.set(p.name, d);
        continue;
      }
      var val;
      if (used < args.length) val = args[used++];
      else if (kwargs && p.name in kwargs) val = kwargs[p.name];
      else if (p.default) val = this.eval(p.default, func.scope);
      else raisePy('TypeError', func.name + '() missing required argument: ' + "'" + p.name + "'");
      scope.set(p.name, val);
    }
    if (used < args.length && !params.some(function (p) { return p.star; })) {
      raisePy('TypeError', func.name + '() takes ' + params.length + ' positional arguments but ' + args.length + ' were given');
    }

    try {
      this.execBlock(func.body, scope);
    } catch (e) {
      if (e instanceof ReturnSig) return e.value;
      throw e;
    }
    return null;
  };

  Interp.prototype.iterate = function (v) {
    if (Array.isArray(v)) return v.slice();
    if (typeof v === 'string') return String(v).split('');
    if (v instanceof PyTuple) return v.items.slice();
    if (v instanceof PyDict) return v.keys();
    if (v instanceof PySet) return v.items();
    if (v instanceof PyRange) {
      var out = [];
      if (v.step > 0) for (var i = v.start; i < v.stop; i += v.step) out.push(i);
      else for (var j = v.start; j > v.stop; j += v.step) out.push(j);
      if (out.length > 1000000) raisePy('MemoryError', 'слишком длинный range для тренажёра');
      return out;
    }
    if (v && v.__iter) return v.__iter();
    if (v instanceof PyInstance) {
      var it = v.cls.lookup('__iter__');
      if (it) return this.iterate(this.callValue(bindIfFunc(v, it), [], null));
    }
    raisePy('TypeError', "'" + typeName(v) + "' object is not iterable");
  };

  /* ═══════════ форматирование ═══════════ */

  function formatValue(v, spec) {
    if (!spec) return str(v);
    var m = /^(?:(.)?([<>^]))?([+ ])?(0)?(\d+)?(?:\.(\d+))?([dfgexs%,])?$/.exec(spec);
    if (!m) return str(v);
    var fill = m[1] || (m[4] ? '0' : ' ');
    var align = m[2] || (m[4] ? '>' : null);
    var sign = m[3] || '';
    var width = m[5] ? parseInt(m[5], 10) : 0;
    var prec = m[6] !== undefined ? parseInt(m[6], 10) : null;
    var type = m[7] || '';
    var out;

    if (type === '%') {
      out = (Number(nv(v)) * 100).toFixed(prec === null ? 6 : prec) + '%';
    } else if (type === 'f') {
      out = Number(nv(v)).toFixed(prec === null ? 6 : prec);
    } else if (type === 'd') {
      out = String(Math.round(Number(nv(v))));
    } else if (type === 'e') {
      out = Number(nv(v)).toExponential(prec === null ? 6 : prec);
    } else if (type === 'g') {
      out = String(Number(nv(v)));
    } else if (type === ',') {
      out = Number(nv(v)).toLocaleString('en-US');
    } else if (type === 's' || type === '') {
      out = str(v);
      if (prec !== null) out = out.slice(0, prec);
    } else {
      out = str(v);
    }
    if (sign === '+' && isNum(v) && Number(nv(v)) >= 0) out = '+' + out;
    if (width && out.length < width) {
      var pad = fill.repeat(width - out.length);
      if (align === '>' || (!align && isNum(v))) out = pad + out;
      else if (align === '^') {
        var left = Math.floor((width - out.length) / 2);
        out = fill.repeat(left) + out + fill.repeat(width - out.length - left);
      } else out = out + pad;
    }
    return out;
  }

  // старое форматирование "%s = %d" % (a, b)
  function sprintf(fmt, args) {
    var list = args instanceof PyTuple ? args.items : [args];
    var i = 0;
    return fmt.replace(/%(-?\d+)?(?:\.(\d+))?([sdfr%])/g, function (all, w, p, t) {
      if (t === '%') return '%';
      var v = list[i++];
      var out = t === 'd' ? String(Math.round(Number(nv(v))))
        : t === 'f' ? Number(nv(v)).toFixed(p === undefined ? 6 : parseInt(p, 10))
        : t === 'r' ? repr(v) : str(v);
      if (w) {
        var width = parseInt(w, 10);
        if (width < 0) out = out.padEnd(-width);
        else out = out.padStart(width);
      }
      return out;
    });
  }

  root.PyRuntime = {
    Interp: Interp, Scope: Scope,
    PyFloat: PyFloat, PyTuple: PyTuple, PyDict: PyDict, PySet: PySet, PyRange: PyRange,
    PyFunc: PyFunc, PyBuiltin: PyBuiltin, PyBound: PyBound, PyClass: PyClass,
    PyInstance: PyInstance, PyModule: PyModule, PyExc: PyExc, PySlice: PySlice,
    ReturnSig: ReturnSig,
    str: str, repr: repr, truthy: truthy, typeName: typeName, eq: eq, cmp: cmp,
    isNum: isNum, nv: nv, isFloat: isFloat, mkNum: mkNum, contains: contains,
    raisePy: raisePy, formatValue: formatValue, fmtFloat: fmtFloat,
    bindIfFunc: bindIfFunc, keyOf: keyOf, sliceValue: sliceValue, rangeLen: rangeLen
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
