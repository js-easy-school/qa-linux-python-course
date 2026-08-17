/* Лексер Python: превращает исходник в поток токенов.
   Отступы отдаём отдельными токенами INDENT/DEDENT — по ним парсер строит блоки. */
(function (root) {
  'use strict';

  var KEYWORDS = ['False', 'None', 'True', 'and', 'as', 'assert', 'break', 'class', 'continue',
    'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import',
    'in', 'is', 'lambda', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with'];

  // длинные операторы идут первыми, иначе '==' распадётся на два '='
  var OPS = ['**=', '//=', '==', '!=', '<=', '>=', '->', '+=', '-=', '*=', '/=', '%=', '**', '//',
    '+', '-', '*', '/', '%', '=', '<', '>', '(', ')', '[', ']', '{', '}', ',', ':', '.', ';', '@'];

  function PyError(msg, line) {
    var e = new Error(msg);
    e.pyLine = line;
    e.isPyError = true;
    return e;
  }

  function isDigit(c) { return c >= '0' && c <= '9'; }
  function isIdStart(c) { return /[A-Za-z_Ѐ-ӿ]/.test(c); }
  function isIdChar(c) { return /[A-Za-z0-9_Ѐ-ӿ]/.test(c); }

  var ESCAPES = { n: '\n', t: '\t', r: '\r', '0': '\0' };
  ESCAPES['\\'] = '\\';
  ESCAPES["'"] = "'";
  ESCAPES['"'] = '"';

  function tokenize(src) {
    src = String(src).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var toks = [];
    var indents = [0];
    var i = 0, line = 1;
    var depth = 0;          // глубина скобок: внутри них переносы не значимы
    var atLineStart = true;

    function push(type, value) { toks.push({ type: type, value: value, line: line }); }

    while (i < src.length) {
      // --- начало строки: считаем отступ ---
      if (atLineStart && depth === 0) {
        var col = 0;
        while (i < src.length && (src[i] === ' ' || src[i] === '\t')) {
          col += src[i] === '\t' ? 8 - (col % 8) : 1;
          i++;
        }
        if (i >= src.length) break;
        // пустая строка и строка-комментарий отступом не считаются
        if (src[i] === '\n') { i++; line++; continue; }
        if (src[i] === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }

        if (col > indents[indents.length - 1]) {
          indents.push(col);
          push('INDENT', col);
        } else {
          while (col < indents[indents.length - 1]) {
            indents.pop();
            push('DEDENT', col);
          }
          if (col !== indents[indents.length - 1]) throw PyError('неверный отступ', line);
        }
        atLineStart = false;
        continue;
      }

      var c = src[i];

      if (c === '\n') {
        i++;
        if (depth === 0) { push('NEWLINE', '\n'); atLineStart = true; }
        line++;
        continue;
      }
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === '\\' && src[i + 1] === '\n') { i += 2; line++; continue; }  // явный перенос строки
      if (c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }

      // --- строки (обычные, тройные, f-строки, raw) ---
      if (c === '"' || c === "'" || /^[fFrRbB]{1,2}['"]/.test(src.slice(i, i + 3))) {
        var isF = false, isRaw = false;
        while (/[fFrRbB]/.test(src[i])) {
          if (src[i] === 'f' || src[i] === 'F') isF = true;
          if (src[i] === 'r' || src[i] === 'R') isRaw = true;
          i++;
        }
        var q = src[i];
        var triple = src.slice(i, i + 3) === q + q + q;
        var close = triple ? q + q + q : q;
        i += close.length;
        var buf = '';
        while (i < src.length && src.slice(i, i + close.length) !== close) {
          if (src[i] === '\n') {
            if (!triple) throw PyError('незакрытая строка', line);
            line++;
          }
          if (src[i] === '\\' && !isRaw && i + 1 < src.length) {
            var n = src[i + 1];
            if (n in ESCAPES) { buf += ESCAPES[n]; i += 2; continue; }
            if (n === '\n') { i += 2; line++; continue; }
          }
          buf += src[i++];
        }
        if (i >= src.length) throw PyError('незакрытая строка', line);
        i += close.length;
        push(isF ? 'FSTRING' : 'STRING', buf);
        continue;
      }

      // --- числа ---
      if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
        var num = '';
        if (c === '0' && /[xXbBoO]/.test(src[i + 1] || '')) {
          num = src[i] + src[i + 1];
          i += 2;
          while (i < src.length && /[0-9a-fA-F_]/.test(src[i])) num += src[i++];
        } else {
          while (i < src.length && /[0-9_]/.test(src[i])) num += src[i++];
          if (src[i] === '.' && isDigit(src[i + 1] || '')) {
            num += src[i++];
            while (i < src.length && /[0-9_]/.test(src[i])) num += src[i++];
          } else if (src[i] === '.' && !isIdStart(src[i + 1] || '')) {
            num += src[i++];
          }
          if (/[eE]/.test(src[i] || '') && /[0-9+\-]/.test(src[i + 1] || '')) {
            num += src[i++];
            if (/[+\-]/.test(src[i])) num += src[i++];
            while (i < src.length && isDigit(src[i])) num += src[i++];
          }
        }
        push('NUMBER', num.replace(/_/g, ''));
        continue;
      }

      // --- идентификаторы и ключевые слова ---
      if (isIdStart(c)) {
        var id = '';
        while (i < src.length && isIdChar(src[i])) id += src[i++];
        push(KEYWORDS.indexOf(id) >= 0 ? 'KEYWORD' : 'NAME', id);
        continue;
      }

      // --- операторы ---
      var matched = null;
      for (var k = 0; k < OPS.length; k++) {
        if (src.slice(i, i + OPS[k].length) === OPS[k]) { matched = OPS[k]; break; }
      }
      if (matched) {
        if ('([{'.indexOf(matched) >= 0) depth++;
        if (')]}'.indexOf(matched) >= 0) depth = Math.max(0, depth - 1);
        i += matched.length;
        push('OP', matched);
        continue;
      }

      throw PyError('неизвестный символ ' + JSON.stringify(c), line);
    }

    if (toks.length && toks[toks.length - 1].type !== 'NEWLINE') push('NEWLINE', '\n');
    while (indents.length > 1) { indents.pop(); push('DEDENT', 0); }
    push('EOF', null);
    return toks;
  }

  root.PyLexer = { tokenize: tokenize, PyError: PyError, KEYWORDS: KEYWORDS };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
