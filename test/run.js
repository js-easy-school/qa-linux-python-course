/* Автотест курса: каждое эталонное решение обязано проходить проверки своего урока.
   Запуск: node test/run.js */
global.window = global;

require('../js/shell/stand.js');
require('../js/shell/shell.js');
require('../js/py/lexer.js');
require('../js/py/parser.js');
require('../js/py/interp.js');
require('../js/py/builtins.js');
require('../js/py/stdlib.js');
require('../js/engine.js');
require('../js/content/lessons-linux.js');
require('../js/content/lessons-linux2.js');
require('../js/content/lessons-python.js');
require('../js/content/lessons-pytest.js');
require('../js/content/lessons-5g.js');
require('../js/content/mentor-notes.js');
require('../js/content/exam.js');

const L = global.QALessons || [];
let bad = 0, checked = 0;
const seen = new Set();

function fail(les, msg, extra) {
  bad++;
  console.log('✗ [' + les.id + '] ' + les.title);
  console.log('   ' + msg);
  if (extra) console.log('   ' + String(extra).replace(/\n/g, '\n   ').slice(0, 1200));
}

for (const les of L) {
  // структурные проверки
  if (seen.has(les.id)) fail(les, 'повторяющийся id урока');
  seen.add(les.id);
  if (!les.title || !les.task || !les.theory) { fail(les, 'нет заголовка, задания или теории'); continue; }
  if (!les.checks || !les.checks.length) { fail(les, 'у урока нет проверок'); continue; }
  if (!les.solution) { fail(les, 'нет эталонного решения'); continue; }
  if (les.day <= 4 && !(global.QAMentorNotes || {})[les.id]) {
    fail(les, 'для урока первых четырёх дней нет комментария наставника');
  }
  if (les.day >= 5 && !les.mentor) {
    fail(les, 'для нового урока нет рабочего контекста наставника');
  }
  if (les.quiz && (les.quiz.answer < 0 || les.quiz.answer >= les.quiz.options.length)) {
    fail(les, 'в квизе неверный индекс правильного ответа');
  }

  checked++;
  let ctx;

  if (les.mode === 'python') {
    const session = global.QAEngine.newSession(les.scenario || 'ok');
    const py = global.QAEngine.runPython(les.solution, { stand: session.stand, pytest: !!les.pytest });
    ctx = { session, py, code: les.solution };
    if (py.error && !les.expectError) {
      fail(les, 'эталонное решение падает с ошибкой', py.error + '\n--- вывод ---\n' + py.out);
      continue;
    }
  } else {
    const cmds = les.solution.split('\n').map(s => s.trim()).filter(Boolean);
    const session = global.QAEngine.runShellScript(cmds, les.scenario || 'ok');
    ctx = { session, py: null, code: '' };
  }

  const res = global.QAEngine.checkLesson(les, ctx);
  if (!res.ok) {
    const dump = les.mode === 'python'
      ? 'вывод программы:\n' + (ctx.py.out || '(пусто)')
      : 'последний вывод:\n' + (global.QAEngine.lastOut(ctx.session) || '(пусто)');
    fail(les, 'решение не проходит проверки: ' + res.fails.join(' | '), dump);
  }
}

// экзаменационные вопросы: эталонный ответ должен подходить под свой же шаблон
const exam = global.QAExam || [];
exam.forEach((q, i) => {
  const okFlag = q.accept.some(re => new RegExp(re, 'i').test(q.sample || q.answer));
  if (!okFlag) {
    bad++;
    console.log('✗ [экзамен ' + (i + 1) + '] эталонный ответ не проходит собственную проверку: ' + q.answer);
  }
});

console.log('');
console.log('уроков: ' + L.length + ', проверено: ' + checked + ', вопросов экзамена: ' + exam.length);
console.log(bad ? '✗ проблем: ' + bad : '✓ все уроки и вопросы в порядке');
process.exit(bad ? 1 : 0);
