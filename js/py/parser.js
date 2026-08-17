/* Парсер Python: поток токенов -> AST.
   Поддержано подмножество, которого хватает для тестов и скриптов QA:
   присваивания, if/for/while, функции, классы, try/except, with, импорты,
   f-строки, генераторы списков/словарей, срезы, lambda, декораторы. */
(function (root) {
  'use strict';

  var PyError = root.PyLexer.PyError;

  var COMPARE_OPS = ['==', '!=', '<', '>', '<=', '>='];

  function Parser(toks) {
    this.toks = toks;
    this.pos = 0;
  }

  Parser.prototype.peek = function (off) { return this.toks[this.pos + (off || 0)]; };
  Parser.prototype.next = function () { return this.toks[this.pos++]; };
  Parser.prototype.line = function () { return (this.peek() || {}).line || 0; };

  Parser.prototype.at = function (type, value) {
    var t = this.peek();
    if (!t || t.type !== type) return false;
    return value === undefined ? true : t.value === value;
  };

  Parser.prototype.atKw = function (kw) { return this.at('KEYWORD', kw); };
  Parser.prototype.atOp = function (op) { return this.at('OP', op); };

  Parser.prototype.eat = function (type, value) {
    if (this.at(type, value)) return this.next();
    return null;
  };

  Parser.prototype.expect = function (type, value) {
    var t = this.eat(type, value);
    if (!t) {
      var got = this.peek();
      throw PyError('ожидалось ' + (value || type) + ', а встретилось ' +
        (got && got.value !== null ? JSON.stringify(got.value) : (got ? got.type : 'конец файла')), this.line());
    }
    return t;
  };

  Parser.prototype.skipNewlines = function () {
    while (this.at('NEWLINE')) this.next();
  };

  /* ─────────────── модуль и блоки ─────────────── */

  Parser.prototype.parseModule = function () {
    var body = [];
    this.skipNewlines();
    while (!this.at('EOF')) {
      body.push.apply(body, this.parseStatement());
      this.skipNewlines();
    }
    return { type: 'Module', body: body };
  };

  Parser.prototype.parseBlock = function () {
    // либо ": однострочное тело", либо ":\n INDENT ... DEDENT"
    this.expect('OP', ':');
    if (!this.at('NEWLINE')) {
      return this.parseSimpleLine();
    }
    this.skipNewlines();
    this.expect('INDENT');
    var body = [];
    this.skipNewlines();
    while (!this.at('DEDENT') && !this.at('EOF')) {
      body.push.apply(body, this.parseStatement());
      this.skipNewlines();
    }
    this.eat('DEDENT');
    if (!body.length) throw PyError('пустой блок', this.line());
    return body;
  };

  // строка из простых операторов через ';'
  Parser.prototype.parseSimpleLine = function () {
    var out = [this.parseSimpleStatement()];
    while (this.eat('OP', ';')) {
      if (this.at('NEWLINE')) break;
      out.push(this.parseSimpleStatement());
    }
    this.eat('NEWLINE');
    return out;
  };

  Parser.prototype.parseStatement = function () {
    var line = this.line();

    if (this.atOp('@')) return [this.parseDecorated()];
    if (this.atKw('if')) return [this.parseIf()];
    if (this.atKw('while')) return [this.parseWhile()];
    if (this.atKw('for')) return [this.parseFor()];
    if (this.atKw('def')) return [this.parseFunc([])];
    if (this.atKw('class')) return [this.parseClass([])];
    if (this.atKw('try')) return [this.parseTry()];
    if (this.atKw('with')) return [this.parseWith()];

    var stmts = this.parseSimpleLine();
    for (var i = 0; i < stmts.length; i++) if (!stmts[i].line) stmts[i].line = line;
    return stmts;
  };

  Parser.prototype.parseDecorated = function () {
    var decorators = [];
    while (this.eat('OP', '@')) {
      decorators.push(this.parseExpression());
      this.eat('NEWLINE');
      this.skipNewlines();
    }
    if (this.atKw('def')) return this.parseFunc(decorators);
    if (this.atKw('class')) return this.parseClass(decorators);
    throw PyError('после декоратора ожидается def или class', this.line());
  };

  Parser.prototype.parseIf = function () {
    var line = this.line();
    this.expect('KEYWORD', 'if');
    var test = this.parseExpression();
    var body = this.parseBlock();
    var orelse = [];
    this.skipNewlines();
    if (this.atKw('elif')) {
      // elif разворачиваем во вложенный if
      var save = this.pos;
      this.next();
      this.toks[save] = { type: 'KEYWORD', value: 'if', line: this.toks[save].line };
      this.pos = save;
      orelse = [this.parseIf()];
    } else if (this.atKw('else')) {
      this.next();
      orelse = this.parseBlock();
    }
    return { type: 'If', test: test, body: body, orelse: orelse, line: line };
  };

  Parser.prototype.parseWhile = function () {
    var line = this.line();
    this.expect('KEYWORD', 'while');
    var test = this.parseExpression();
    var body = this.parseBlock();
    var orelse = [];
    this.skipNewlines();
    if (this.atKw('else')) { this.next(); orelse = this.parseBlock(); }
    return { type: 'While', test: test, body: body, orelse: orelse, line: line };
  };

  Parser.prototype.parseFor = function () {
    var line = this.line();
    this.expect('KEYWORD', 'for');
    var target = this.parseTargetList();
    this.expect('KEYWORD', 'in');
    var iter = this.parseExpression(true);
    var body = this.parseBlock();
    var orelse = [];
    this.skipNewlines();
    if (this.atKw('else')) { this.next(); orelse = this.parseBlock(); }
    return { type: 'For', target: target, iter: iter, body: body, orelse: orelse, line: line };
  };

  // цель цикла/распаковки: a  |  a, b  |  (a, b)
  Parser.prototype.parseTargetList = function () {
    var first = this.parseUnary();
    if (!this.atOp(',')) return first;
    var elts = [first];
    while (this.eat('OP', ',')) {
      if (this.atKw('in') || this.atOp('=')) break;
      elts.push(this.parseUnary());
    }
    return { type: 'Tuple', elts: elts };
  };

  Parser.prototype.parseFunc = function (decorators) {
    var line = this.line();
    this.expect('KEYWORD', 'def');
    var name = this.expect('NAME').value;
    this.expect('OP', '(');
    var params = this.parseParams();
    this.expect('OP', ')');
    if (this.eat('OP', '->')) this.parseExpression();   // аннотацию возврата игнорируем
    var body = this.parseBlock();
    return { type: 'FuncDef', name: name, params: params, body: body, decorators: decorators || [], line: line };
  };

  Parser.prototype.parseParams = function () {
    var params = [];
    while (!this.atOp(')') && !this.at('EOF')) {
      if (this.eat('OP', '*')) {
        if (this.atOp(',') || this.atOp(')')) { this.eat('OP', ','); continue; }  // bare *
        params.push({ name: this.expect('NAME').value, star: true });
      } else if (this.eat('OP', '**')) {
        params.push({ name: this.expect('NAME').value, dstar: true });
      } else {
        var pname = this.expect('NAME').value;
        if (this.eat('OP', ':')) this.parseExpression();   // аннотацию типа игнорируем
        var def = null;
        if (this.eat('OP', '=')) def = this.parseExpression();
        params.push({ name: pname, default: def });
      }
      if (!this.eat('OP', ',')) break;
    }
    return params;
  };

  Parser.prototype.parseClass = function (decorators) {
    var line = this.line();
    this.expect('KEYWORD', 'class');
    var name = this.expect('NAME').value;
    var bases = [];
    if (this.eat('OP', '(')) {
      while (!this.atOp(')')) {
        bases.push(this.parseExpression());
        if (!this.eat('OP', ',')) break;
      }
      this.expect('OP', ')');
    }
    var body = this.parseBlock();
    return { type: 'ClassDef', name: name, bases: bases, body: body, decorators: decorators || [], line: line };
  };

  Parser.prototype.parseTry = function () {
    var line = this.line();
    this.expect('KEYWORD', 'try');
    var body = this.parseBlock();
    var handlers = [], orelse = [], finalbody = [];
    this.skipNewlines();
    while (this.atKw('except')) {
      this.next();
      var etype = null, ename = null;
      if (!this.atOp(':')) {
        etype = this.parseExpression();
        if (this.eat('KEYWORD', 'as')) ename = this.expect('NAME').value;
      }
      handlers.push({ etype: etype, name: ename, body: this.parseBlock() });
      this.skipNewlines();
    }
    if (this.atKw('else')) { this.next(); orelse = this.parseBlock(); this.skipNewlines(); }
    if (this.atKw('finally')) { this.next(); finalbody = this.parseBlock(); }
    return { type: 'Try', body: body, handlers: handlers, orelse: orelse, finalbody: finalbody, line: line };
  };

  Parser.prototype.parseWith = function () {
    var line = this.line();
    this.expect('KEYWORD', 'with');
    var items = [];
    do {
      var ctx = this.parseExpression();
      var vars = null;
      if (this.eat('KEYWORD', 'as')) vars = this.parseUnary();
      items.push({ ctx: ctx, vars: vars });
    } while (this.eat('OP', ','));
    var body = this.parseBlock();
    return { type: 'With', items: items, body: body, line: line };
  };

  Parser.prototype.parseSimpleStatement = function () {
    var line = this.line();

    if (this.atKw('pass')) { this.next(); return { type: 'Pass', line: line }; }
    if (this.atKw('break')) { this.next(); return { type: 'Break', line: line }; }
    if (this.atKw('continue')) { this.next(); return { type: 'Continue', line: line }; }

    if (this.atKw('return')) {
      this.next();
      var val = (this.at('NEWLINE') || this.atOp(';') || this.at('EOF')) ? null : this.parseExpression(true);
      return { type: 'Return', value: val, line: line };
    }
    if (this.atKw('raise')) {
      this.next();
      var exc = (this.at('NEWLINE') || this.atOp(';') || this.at('EOF')) ? null : this.parseExpression();
      return { type: 'Raise', exc: exc, line: line };
    }
    if (this.atKw('assert')) {
      this.next();
      var test = this.parseExpression();
      var msg = this.eat('OP', ',') ? this.parseExpression() : null;
      return { type: 'Assert', test: test, msg: msg, line: line };
    }
    if (this.atKw('global')) {
      this.next();
      var names = [this.expect('NAME').value];
      while (this.eat('OP', ',')) names.push(this.expect('NAME').value);
      return { type: 'Global', names: names, line: line };
    }
    if (this.atKw('del')) {
      this.next();
      var targets = [this.parseExpression()];
      while (this.eat('OP', ',')) targets.push(this.parseExpression());
      return { type: 'Del', targets: targets, line: line };
    }
    if (this.atKw('import')) {
      this.next();
      var mods = [];
      do {
        var mname = this.parseDottedName();
        var asname = this.eat('KEYWORD', 'as') ? this.expect('NAME').value : null;
        mods.push({ name: mname, asname: asname });
      } while (this.eat('OP', ','));
      return { type: 'Import', names: mods, line: line };
    }
    if (this.atKw('from')) {
      this.next();
      var module = this.parseDottedName();
      this.expect('KEYWORD', 'import');
      var imported = [];
      if (this.eat('OP', '*')) {
        imported.push({ name: '*', asname: null });
      } else {
        var paren = !!this.eat('OP', '(');
        do {
          var iname = this.expect('NAME').value;
          var ias = this.eat('KEYWORD', 'as') ? this.expect('NAME').value : null;
          imported.push({ name: iname, asname: ias });
        } while (this.eat('OP', ','));
        if (paren) this.expect('OP', ')');
      }
      return { type: 'ImportFrom', module: module, names: imported, line: line };
    }

    // выражение или присваивание
    var expr = this.parseExpression(true);

    var augOps = ['+=', '-=', '*=', '/=', '//=', '%=', '**='];
    for (var i = 0; i < augOps.length; i++) {
      if (this.atOp(augOps[i])) {
        this.next();
        var rhs = this.parseExpression(true);
        return { type: 'AugAssign', target: expr, op: augOps[i].slice(0, -1), value: rhs, line: line };
      }
    }

    if (this.atOp(':')) {           // аннотация переменной: x: int = 5
      this.next();
      this.parseExpression();
      if (this.eat('OP', '=')) {
        return { type: 'Assign', targets: [expr], value: this.parseExpression(true), line: line };
      }
      return { type: 'Pass', line: line };
    }

    if (this.atOp('=')) {
      var targets = [expr];
      var value = null;
      while (this.eat('OP', '=')) {
        value = this.parseExpression(true);
        if (this.atOp('=')) { targets.push(value); }
      }
      return { type: 'Assign', targets: targets, value: value, line: line };
    }

    return { type: 'ExprStmt', value: expr, line: line };
  };

  Parser.prototype.parseDottedName = function () {
    var name = this.expect('NAME').value;
    while (this.atOp('.')) {
      this.next();
      name += '.' + this.expect('NAME').value;
    }
    return name;
  };

  /* ─────────────── выражения ─────────────── */

  // allowTuple: разрешать "a, b" без скобок (в присваиваниях и return)
  Parser.prototype.parseExpression = function (allowTuple) {
    var first = this.parseTernary();
    if (allowTuple && this.atOp(',')) {
      var elts = [first];
      while (this.eat('OP', ',')) {
        if (this.at('NEWLINE') || this.atOp('=') || this.atOp(')') || this.at('EOF')) break;
        elts.push(this.parseTernary());
      }
      return { type: 'Tuple', elts: elts };
    }
    return first;
  };

  Parser.prototype.parseTernary = function () {
    if (this.atKw('lambda')) return this.parseLambda();
    var body = this.parseOr();
    if (this.atKw('if')) {
      this.next();
      var test = this.parseOr();
      this.expect('KEYWORD', 'else');
      var orelse = this.parseTernary();
      return { type: 'IfExp', test: test, body: body, orelse: orelse };
    }
    return body;
  };

  Parser.prototype.parseLambda = function () {
    this.expect('KEYWORD', 'lambda');
    var params = [];
    while (!this.atOp(':')) {
      var pname = this.expect('NAME').value;
      var def = this.eat('OP', '=') ? this.parseTernary() : null;
      params.push({ name: pname, default: def });
      if (!this.eat('OP', ',')) break;
    }
    this.expect('OP', ':');
    return { type: 'Lambda', params: params, body: this.parseTernary() };
  };

  Parser.prototype.parseOr = function () {
    var left = this.parseAnd();
    while (this.atKw('or')) {
      this.next();
      left = { type: 'BoolOp', op: 'or', left: left, right: this.parseAnd() };
    }
    return left;
  };

  Parser.prototype.parseAnd = function () {
    var left = this.parseNot();
    while (this.atKw('and')) {
      this.next();
      left = { type: 'BoolOp', op: 'and', left: left, right: this.parseNot() };
    }
    return left;
  };

  Parser.prototype.parseNot = function () {
    if (this.atKw('not')) {
      this.next();
      return { type: 'UnaryOp', op: 'not', operand: this.parseNot() };
    }
    return this.parseComparison();
  };

  Parser.prototype.parseComparison = function () {
    var left = this.parseArith();
    var ops = [], comparators = [];
    for (;;) {
      var op = null;
      if (this.at('OP') && COMPARE_OPS.indexOf(this.peek().value) >= 0) {
        op = this.next().value;
      } else if (this.atKw('in')) {
        this.next(); op = 'in';
      } else if (this.atKw('not') && this.peek(1) && this.peek(1).value === 'in') {
        this.next(); this.next(); op = 'not in';
      } else if (this.atKw('is')) {
        this.next();
        op = this.eat('KEYWORD', 'not') ? 'is not' : 'is';
      }
      if (!op) break;
      ops.push(op);
      comparators.push(this.parseArith());
    }
    if (!ops.length) return left;
    return { type: 'Compare', left: left, ops: ops, comparators: comparators };
  };

  Parser.prototype.parseArith = function () {
    var left = this.parseTerm();
    while (this.atOp('+') || this.atOp('-')) {
      var op = this.next().value;
      left = { type: 'BinOp', op: op, left: left, right: this.parseTerm() };
    }
    return left;
  };

  Parser.prototype.parseTerm = function () {
    var left = this.parseUnary();
    while (this.atOp('*') || this.atOp('/') || this.atOp('//') || this.atOp('%')) {
      var op = this.next().value;
      left = { type: 'BinOp', op: op, left: left, right: this.parseUnary() };
    }
    return left;
  };

  Parser.prototype.parseUnary = function () {
    if (this.atOp('-') || this.atOp('+')) {
      var op = this.next().value;
      return { type: 'UnaryOp', op: op, operand: this.parseUnary() };
    }
    if (this.atOp('*')) {                       // распаковка: f(*args), [*a, b]
      this.next();
      return { type: 'Starred', value: this.parseUnary() };
    }
    return this.parsePower();
  };

  Parser.prototype.parsePower = function () {
    var base = this.parsePostfix();
    if (this.atOp('**')) {
      this.next();
      return { type: 'BinOp', op: '**', left: base, right: this.parseUnary() };
    }
    return base;
  };

  Parser.prototype.parsePostfix = function () {
    var node = this.parseAtom();
    for (;;) {
      if (this.atOp('(')) {
        node = this.parseCall(node);
      } else if (this.atOp('.')) {
        this.next();
        node = { type: 'Attribute', value: node, attr: this.expect('NAME').value };
      } else if (this.atOp('[')) {
        this.next();
        var slice = this.parseSlice();
        this.expect('OP', ']');
        node = { type: 'Subscript', value: node, slice: slice };
      } else break;
    }
    return node;
  };

  Parser.prototype.parseSlice = function () {
    var lower = null, upper = null, step = null, isSlice = false;
    if (!this.atOp(':')) lower = this.parseExpression(true);
    if (this.eat('OP', ':')) {
      isSlice = true;
      if (!this.atOp(']') && !this.atOp(':')) upper = this.parseExpression();
      if (this.eat('OP', ':')) {
        if (!this.atOp(']')) step = this.parseExpression();
      }
    }
    if (!isSlice) return lower;
    return { type: 'Slice', lower: lower, upper: upper, step: step };
  };

  Parser.prototype.parseCall = function (func) {
    this.expect('OP', '(');
    var args = [], keywords = [];
    while (!this.atOp(')') && !this.at('EOF')) {
      if (this.eat('OP', '**')) {
        keywords.push({ name: null, value: this.parseTernary() });   // **kwargs
      } else if (this.at('NAME') && this.peek(1) && this.peek(1).type === 'OP' &&
                 this.peek(1).value === '=' ) {
        var kwname = this.next().value;
        this.next();
        keywords.push({ name: kwname, value: this.parseTernary() });
      } else {
        var a = this.parseTernary();
        // генератор внутри вызова: sum(x for x in ...)
        if (this.atKw('for')) a = this.parseComprehension(a, 'gen');
        args.push(a);
      }
      if (!this.eat('OP', ',')) break;
    }
    this.expect('OP', ')');
    return { type: 'Call', func: func, args: args, keywords: keywords };
  };

  Parser.prototype.parseComprehension = function (elt, kind, value) {
    var generators = [];
    while (this.atKw('for')) {
      this.next();
      var target = this.parseTargetList();
      this.expect('KEYWORD', 'in');
      var iter = this.parseOr();
      var ifs = [];
      while (this.atKw('if')) { this.next(); ifs.push(this.parseOr()); }
      generators.push({ target: target, iter: iter, ifs: ifs });
    }
    return { type: 'Comp', kind: kind, elt: elt, value: value || null, generators: generators };
  };

  Parser.prototype.parseAtom = function () {
    var t = this.peek();
    if (!t) throw PyError('неожиданный конец выражения', this.line());

    if (t.type === 'NUMBER') {
      this.next();
      var v = t.value.indexOf('0x') === 0 || t.value.indexOf('0X') === 0 ? parseInt(t.value, 16)
        : t.value.indexOf('0b') === 0 || t.value.indexOf('0B') === 0 ? parseInt(t.value.slice(2), 2)
        : t.value.indexOf('0o') === 0 || t.value.indexOf('0O') === 0 ? parseInt(t.value.slice(2), 8)
        : parseFloat(t.value);
      var isFloat = /[.eE]/.test(t.value) && !/^0[xX]/.test(t.value);
      return { type: 'Num', value: v, isFloat: isFloat };
    }

    if (t.type === 'STRING') {
      this.next();
      var s = t.value;
      while (this.at('STRING')) s += this.next().value;   // склейка "a" "b"
      return { type: 'Str', value: s };
    }

    if (t.type === 'FSTRING') {
      this.next();
      return this.buildFString(t.value, t.line);
    }

    if (t.type === 'KEYWORD') {
      if (t.value === 'True') { this.next(); return { type: 'Const', value: true }; }
      if (t.value === 'False') { this.next(); return { type: 'Const', value: false }; }
      if (t.value === 'None') { this.next(); return { type: 'Const', value: null }; }
      if (t.value === 'lambda') return this.parseLambda();
      if (t.value === 'not') return this.parseNot();
    }

    if (t.type === 'NAME') { this.next(); return { type: 'Name', id: t.value, line: t.line }; }

    if (this.atOp('(')) {
      this.next();
      if (this.atOp(')')) { this.next(); return { type: 'Tuple', elts: [] }; }
      var first = this.parseTernary();
      if (this.atKw('for')) {
        var gen = this.parseComprehension(first, 'gen');
        this.expect('OP', ')');
        return gen;
      }
      if (this.atOp(',')) {
        var elts = [first];
        while (this.eat('OP', ',')) {
          if (this.atOp(')')) break;
          elts.push(this.parseTernary());
        }
        this.expect('OP', ')');
        return { type: 'Tuple', elts: elts };
      }
      this.expect('OP', ')');
      return first;
    }

    if (this.atOp('[')) {
      this.next();
      if (this.atOp(']')) { this.next(); return { type: 'List', elts: [] }; }
      var head = this.parseTernary();
      if (this.atKw('for')) {
        var comp = this.parseComprehension(head, 'list');
        this.expect('OP', ']');
        return comp;
      }
      var items = [head];
      while (this.eat('OP', ',')) {
        if (this.atOp(']')) break;
        items.push(this.parseTernary());
      }
      this.expect('OP', ']');
      return { type: 'List', elts: items };
    }

    if (this.atOp('{')) {
      this.next();
      if (this.atOp('}')) { this.next(); return { type: 'Dict', keys: [], values: [] }; }
      var k1 = this.parseTernary();
      if (this.eat('OP', ':')) {
        var v1 = this.parseTernary();
        if (this.atKw('for')) {
          var dcomp = this.parseComprehension(k1, 'dict', v1);
          this.expect('OP', '}');
          return dcomp;
        }
        var keys = [k1], values = [v1];
        while (this.eat('OP', ',')) {
          if (this.atOp('}')) break;
          keys.push(this.parseTernary());
          this.expect('OP', ':');
          values.push(this.parseTernary());
        }
        this.expect('OP', '}');
        return { type: 'Dict', keys: keys, values: values };
      }
      if (this.atKw('for')) {
        var scomp = this.parseComprehension(k1, 'set');
        this.expect('OP', '}');
        return scomp;
      }
      var selts = [k1];
      while (this.eat('OP', ',')) {
        if (this.atOp('}')) break;
        selts.push(this.parseTernary());
      }
      this.expect('OP', '}');
      return { type: 'Set', elts: selts };
    }

    throw PyError('не понимаю выражение около ' + JSON.stringify(t.value), t.line);
  };

  /* f-строка: режем на текст и {выражения[!r][:формат]} */
  Parser.prototype.buildFString = function (raw, line) {
    var parts = [];
    var buf = '';
    for (var i = 0; i < raw.length; i++) {
      var c = raw[i];
      if (c === '{' && raw[i + 1] === '{') { buf += '{'; i++; continue; }
      if (c === '}' && raw[i + 1] === '}') { buf += '}'; i++; continue; }
      if (c === '{') {
        if (buf) { parts.push({ type: 'text', value: buf }); buf = ''; }
        var depth = 1, expr = '';
        i++;
        while (i < raw.length && depth > 0) {
          if (raw[i] === '{') depth++;
          if (raw[i] === '}') { depth--; if (!depth) break; }
          expr += raw[i++];
        }
        var spec = '', conv = '';
        // формат-спека после ':' (но не внутри скобок и не в срезе [a:b])
        var br = 0, cut = -1;
        for (var j = 0; j < expr.length; j++) {
          var ch = expr[j];
          if ('([{'.indexOf(ch) >= 0) br++;
          if (')]}'.indexOf(ch) >= 0) br--;
          if (ch === ':' && br === 0) { cut = j; break; }
        }
        if (cut >= 0) { spec = expr.slice(cut + 1); expr = expr.slice(0, cut); }
        if (/!r$/.test(expr)) { conv = 'r'; expr = expr.slice(0, -2); }
        if (/=$/.test(expr.trim())) {                 // f"{x=}" — отладочный вывод
          var inner = expr.trim().slice(0, -1);
          parts.push({ type: 'text', value: inner + '=' });
          expr = inner;
        }
        parts.push({ type: 'expr', node: parseExpr(expr, line), spec: spec, conv: conv });
        continue;
      }
      buf += c;
    }
    if (buf) parts.push({ type: 'text', value: buf });
    return { type: 'FStr', parts: parts };
  };

  function parseExpr(src, line) {
    try {
      var toks = root.PyLexer.tokenize(src);
      var p = new Parser(toks);
      p.skipNewlines();
      return p.parseExpression(true);
    } catch (e) {
      throw PyError('ошибка внутри f-строки: ' + e.message, line);
    }
  }

  function parse(src) {
    var toks = root.PyLexer.tokenize(src);
    return new Parser(toks).parseModule();
  }

  root.PyParser = { parse: parse, parseExpr: parseExpr, Parser: Parser };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
