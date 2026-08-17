/* Редактор Python: нумерация строк, отступы по Tab, автоотступ после ':',
   запуск по Ctrl+Enter. Специально без автодополнения — на собеседовании его тоже нет. */
(function (root) {
  'use strict';

  function Editor(opts) {
    this.ta = opts.textarea;
    this.gutter = opts.gutter;
    this.onRun = opts.onRun || function () {};
    this.bind();
  }

  Editor.prototype.bind = function () {
    var self = this;
    var ta = this.ta;

    ta.addEventListener('input', function () { self.renderGutter(); });
    ta.addEventListener('scroll', function () { self.gutter.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)'; });

    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        self.onRun();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd;
        if (s !== en) {                                   // сдвигаем блок строк
          var before = ta.value.slice(0, s);
          var lineStart = before.lastIndexOf('\n') + 1;
          var block = ta.value.slice(lineStart, en);
          var shifted = e.shiftKey
            ? block.replace(/^ {1,4}/gm, '')
            : block.replace(/^/gm, '    ');
          ta.value = ta.value.slice(0, lineStart) + shifted + ta.value.slice(en);
          ta.selectionStart = lineStart;
          ta.selectionEnd = lineStart + shifted.length;
        } else if (e.shiftKey) {
          var b = ta.value.slice(0, s);
          var ls = b.lastIndexOf('\n') + 1;
          if (ta.value.slice(ls, ls + 4) === '    ') {
            ta.value = ta.value.slice(0, ls) + ta.value.slice(ls + 4);
            ta.selectionStart = ta.selectionEnd = Math.max(ls, s - 4);
          }
        } else {
          ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(en);
          ta.selectionStart = ta.selectionEnd = s + 4;
        }
        self.renderGutter();
        return;
      }
      if (e.key === 'Enter') {                            // автоотступ
        var pos = ta.selectionStart;
        var lineStart = ta.value.lastIndexOf('\n', pos - 1) + 1;
        var line = ta.value.slice(lineStart, pos);
        var indent = (/^[ \t]*/.exec(line) || [''])[0];
        if (/:\s*$/.test(line)) indent += '    ';
        if (indent) {
          e.preventDefault();
          var ins = '\n' + indent;
          ta.value = ta.value.slice(0, pos) + ins + ta.value.slice(ta.selectionEnd);
          ta.selectionStart = ta.selectionEnd = pos + ins.length;
          self.renderGutter();
        }
      }
    });
  };

  Editor.prototype.setValue = function (text) {
    this.ta.value = text || '';
    this.renderGutter();
  };

  Editor.prototype.getValue = function () { return this.ta.value; };

  Editor.prototype.renderGutter = function () {
    var n = this.ta.value.split('\n').length;
    var out = [];
    for (var i = 1; i <= n; i++) out.push(i);
    this.gutter.textContent = out.join('\n');
  };

  root.CourseEditor = Editor;
})(typeof window !== 'undefined' ? window : globalThis);
