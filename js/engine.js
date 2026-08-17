/* Движок курса без интерфейса: выполнение Python, выполнение команд консоли
   и проверка заданий. Тот же код гоняет автотест уроков в node. */
(function (root) {
  'use strict';

  function newSession(scenario) {
    var stand = new root.CourseStand.Stand(scenario || 'ok');
    return {
      stand: stand,
      shell: new root.CourseShell.Shell(stand),
      log: []                       // {cmd, out, code}
    };
  }

  function runShellScript(cmds, scenario) {
    var s = newSession(scenario);
    (cmds || []).forEach(function (c) {
      var r = s.shell.run(c);
      s.log.push({ cmd: c, out: r.out, code: r.code });
    });
    return s;
  }

  /* ─────────── Python ─────────── */

  function runPython(code, opts) {
    opts = opts || {};
    var out = '';
    var stand = opts.stand || (opts.scenario ? new root.CourseStand.Stand(opts.scenario) : null);
    var interp = new root.PyRuntime.Interp({
      out: function (s) { out += s; },
      stand: stand,
      maxSteps: opts.maxSteps || 2000000
    });
    var result = { out: '', error: null, tests: null, stand: stand, interp: interp };
    try {
      interp.run(code);
      if (opts.pytest) {
        result.tests = root.PyStdlib.runTests(interp, { verbose: true });
      }
    } catch (e) {
      if (e instanceof root.PyRuntime.PyExc) {
        result.error = e.typeName() + ': ' + e.message + (e.line ? '  (строка ' + e.line + ')' : '');
      } else if (e && e.isPyError) {
        result.error = 'Ошибка: ' + e.message + (e.pyLine ? '  (строка ' + e.pyLine + ')' : '');
      } else if (e instanceof root.PyRuntime.ReturnSig) {
        result.error = "SyntaxError: 'return' вне функции";
      } else {
        result.error = 'Ошибка выполнения: ' + e.message;
      }
    }
    result.out = out;
    return result;
  }

  /* ─────────── проверки заданий ─────────── */

  function textOfLog(session) {
    return session.log.map(function (l) { return l.out; }).join('\n');
  }

  function lastOut(session) {
    for (var i = session.log.length - 1; i >= 0; i--) {
      if (session.log[i].out && session.log[i].out.trim()) return session.log[i].out;
    }
    return '';
  }

  function matches(text, check) {
    if (check.equals !== undefined) return String(text).trim() === String(check.equals).trim();
    if (check.contains !== undefined) {
      var need = Array.isArray(check.contains) ? check.contains : [check.contains];
      return need.every(function (n) { return String(text).indexOf(n) >= 0; });
    }
    if (check.re !== undefined) return new RegExp(check.re, check.flags || '').test(String(text));
    if (check.notContains !== undefined) return String(text).indexOf(check.notContains) < 0;
    return true;
  }

  // ctx: {session, py} — что доступно проверкам
  function checkLesson(lesson, ctx) {
    var fails = [];
    var checks = lesson.checks || [];

    checks.forEach(function (c) {
      var okFlag = true;

      if (c.type === 'used') {
        var cmds = (ctx.session ? ctx.session.log : []).map(function (l) { return l.cmd; }).join('\n');
        okFlag = new RegExp(c.re, c.flags || '').test(cmds);
      } else if (c.type === 'out') {
        okFlag = matches(ctx.session ? lastOut(ctx.session) : '', c);
      } else if (c.type === 'anyOut') {
        okFlag = matches(ctx.session ? textOfLog(ctx.session) : '', c);
      } else if (c.type === 'state') {
        okFlag = !!c.fn(ctx.session ? ctx.session.stand : (ctx.py && ctx.py.stand));
      } else if (c.type === 'pyout') {
        okFlag = ctx.py ? matches(ctx.py.out, c) : false;
      } else if (c.type === 'noerror') {
        okFlag = !!ctx.py && !ctx.py.error;
      } else if (c.type === 'code') {
        okFlag = new RegExp(c.re, c.flags || '').test(ctx.code || '');
      } else if (c.type === 'pytest') {
        var t = ctx.py && ctx.py.tests;
        if (!t) okFlag = false;
        else {
          okFlag = true;
          if (c.min !== undefined && t.results.length < c.min) okFlag = false;
          if (c.allPass !== false && (t.failed > 0 || t.errors > 0)) okFlag = false;
          if (c.minPassed !== undefined && t.passed < c.minPassed) okFlag = false;
        }
      } else if (c.type === 'custom') {
        okFlag = !!c.fn(ctx);
      }

      if (!okFlag) fails.push(c.why || 'условие не выполнено');
    });

    return { ok: fails.length === 0, fails: fails };
  }

  root.QAEngine = {
    newSession: newSession,
    runShellScript: runShellScript,
    runPython: runPython,
    checkLesson: checkLesson,
    lastOut: lastOut,
    textOfLog: textOfLog
  };
})(typeof window !== 'undefined' ? window : globalThis);
