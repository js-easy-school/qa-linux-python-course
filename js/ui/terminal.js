/* Консоль: ввод команд, история по стрелкам, Tab-дополнение, вывод. */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function Terminal(opts) {
    this.box = opts.box;               // .term
    this.outEl = opts.out;             // .term-out
    this.input = opts.input;
    this.promptEl = opts.prompt;
    this.onRun = opts.onRun || function () {};
    this.session = null;
    this.hist = [];
    this.histPos = -1;
    this.bind();
  }

  Terminal.prototype.bind = function () {
    var self = this;

    this.box.addEventListener('click', function (e) {
      if (window.getSelection().toString()) return;   // не мешаем копированию
      self.input.focus();
    });

    this.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var line = self.input.value;
        self.input.value = '';
        self.exec(line);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!self.hist.length) return;
        self.histPos = self.histPos < 0 ? self.hist.length - 1 : Math.max(0, self.histPos - 1);
        self.input.value = self.hist[self.histPos];
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (self.histPos < 0) return;
        self.histPos++;
        if (self.histPos >= self.hist.length) { self.histPos = -1; self.input.value = ''; }
        else self.input.value = self.hist[self.histPos];
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        self.complete();
        return;
      }
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        self.clear();
        return;
      }
      if (e.key === 'c' && e.ctrlKey && !window.getSelection().toString()) {
        e.preventDefault();
        self.print('<span class="cmd">' + esc(self.promptEl.textContent) + ' ' + esc(self.input.value) + '^C</span>');
        self.input.value = '';
      }
    });
  };

  Terminal.prototype.attach = function (session) {
    this.session = session;
    this.outEl.innerHTML = '';
    this.hist = [];
    this.histPos = -1;
    this.updatePrompt();
    if (session.banner) this.print('<span style="color:#6d7f8c">' + esc(session.banner) + '</span>');
  };

  Terminal.prototype.updatePrompt = function () {
    if (!this.session) return;
    var st = this.session.stand;
    var cwd = st.cwd === '/home/qa' ? '~' : st.cwd.replace('/home/qa', '~');
    this.promptEl.textContent = st.user + '@' + st.host + ':' + cwd + '$';
  };

  Terminal.prototype.print = function (html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    this.outEl.appendChild(div);
    this.box.scrollTop = this.box.scrollHeight;
  };

  Terminal.prototype.clear = function () { this.outEl.innerHTML = ''; };

  Terminal.prototype.exec = function (line) {
    if (!this.session) return;
    var shown = esc(this.promptEl.textContent) + ' ' + esc(line);
    this.print('<span class="cmd"><span class="p">' + shown.replace(/^([^\s]+)/, '$1') + '</span></span>');

    if (!line.trim()) return;
    this.hist.push(line);
    this.histPos = -1;

    var r = this.session.shell.run(line);
    if (r.out === ' CLEAR' || r.out === ' CLEAR\n') { this.clear(); this.updatePrompt(); return; }

    if (r.out) {
      var cls = r.code !== 0 ? 'err' : '';
      this.print('<span class="' + cls + '">' + esc(r.out.replace(/\n$/, '')) + '</span>');
    }
    this.session.log.push({ cmd: line.trim(), out: r.out, code: r.code });
    this.updatePrompt();
    this.onRun(line.trim(), r);
  };

  // Tab: дополняем имя команды или путь
  Terminal.prototype.complete = function () {
    var val = this.input.value;
    var st = this.session.stand;
    var parts = val.split(' ');
    var last = parts[parts.length - 1];

    var candidates;
    if (parts.length === 1) {
      candidates = Object.keys(root.CourseShell.COMMANDS).filter(function (c) { return c.indexOf(last) === 0; });
    } else {
      var slash = last.lastIndexOf('/');
      var dirPart = slash >= 0 ? last.slice(0, slash + 1) : '';
      var namePart = slash >= 0 ? last.slice(slash + 1) : last;
      var abs = st.fs.resolve(st.cwd, dirPart || '.');
      var items = st.fs.list(abs) || [];
      candidates = items
        .filter(function (i) { return i.name.indexOf(namePart) === 0; })
        .map(function (i) { return dirPart + i.name + (i.node.type === 'dir' ? '/' : ''); });
    }

    if (!candidates.length) return;
    if (candidates.length === 1) {
      parts[parts.length - 1] = candidates[0];
      this.input.value = parts.join(' ');
      return;
    }
    this.print('<span style="color:#6d7f8c">' + esc(candidates.join('  ')) + '</span>');
  };

  root.CourseTerminal = Terminal;
})(typeof window !== 'undefined' ? window : globalThis);
