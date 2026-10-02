// Проверка контента и сборки «Орбиты». Запуск: node scripts/validate.mjs
// Падает с кодом 1, если найдена ошибка; предупреждения не роняют проверку.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const GRADES = [2, 3, 4];
const SUBJECTS = ['rus', 'math', 'eng', 'world', 'read'];
const LEVELS = ['easy', 'medium', 'hard'];
const PER_LEVEL = 5;

// 1. Загружаем файлы с заданиями так же, как это делает браузер.
const sandbox = {};
sandbox.window = sandbox; // как в браузере: window — это глобальный объект
vm.createContext(sandbox);
for (const g of GRADES) {
  const file = path.join(root, 'assets/js/data', `grade${g}.js`);
  try {
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  } catch (e) {
    err(`grade${g}.js`, `не выполняется: ${e.message}`);
  }
}
const content = (sandbox.ORBITA || {}).content || {};

// 2. Приложение должно хотя бы компилироваться.
try {
  new vm.Script(fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8'), { filename: 'app.js' });
} catch (e) {
  err('app.js', `синтаксическая ошибка: ${e.message}`);
}

// 3. Структура тем и вопросов.
const num = s => Number(String(s).replace(/[\s ]/g, '').replace(',', '.'));
const ARITH = /^(\d[\d ]*)\s*([+−\-·×:])\s*(\d[\d ]*)\s*=\s*\?$/;
function checkArithmetic(where, text, answer) {
  const m = String(text).match(ARITH);
  if (!m) return;
  const a = num(m[1]), b = num(m[3]);
  const want = { '+': a + b, '−': a - b, '-': a - b, '·': a * b, '×': a * b, ':': a / b }[m[2]];
  if (Number.isFinite(want) && Number.isInteger(want) && num(answer) !== want) {
    err(where, `«${text}» — указан ответ ${answer}, а должно быть ${want}`);
  }
}
const balanced = (html, tag) => (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length === (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;

const ids = new Set();
let topics = 0, questions = 0, inputs = 0;
for (const g of GRADES) {
  if (!content[g]) { err(`класс ${g}`, 'нет данных'); continue; }
  for (const s of SUBJECTS) {
    const list = content[g][s];
    if (!Array.isArray(list) || !list.length) { err(`${g}/${s}`, 'нет тем'); continue; }
    for (const t of list) {
      const w = `${g}/${s}/${t.id || '?'}`;
      topics++;
      if (!/^[a-z0-9-]+$/.test(t.id || '')) err(w, 'id темы должен быть латиницей: a-z, 0-9, -');
      if (ids.has(t.id)) err(w, 'повторяющийся id темы');
      ids.add(t.id);
      if (!t.title || typeof t.title !== 'string') err(w, 'нет названия');
      if (!t.theory || typeof t.theory !== 'string') err(w, 'нет правила (theory)');
      else for (const tag of ['p', 'b', 'ul', 'li']) if (!balanced(t.theory, tag)) err(w, `в theory не закрыт тег <${tag}>`);
      if (!Array.isArray(t.examples)) err(w, 'examples должен быть массивом');
      const seen = new Set();
      for (const lv of LEVELS) {
        const qs = t[lv];
        if (!Array.isArray(qs) || !qs.length) { err(w, `нет уровня ${lv}`); continue; }
        if (qs.length !== PER_LEVEL) warn(w, `уровень ${lv}: ${qs.length} заданий вместо ${PER_LEVEL}`);
        qs.forEach((q, i) => {
          const wq = `${w}/${lv}#${i + 1}`;
          questions++;
          if (!Array.isArray(q) || typeof q[0] !== 'string' || !q[0].trim()) { err(wq, 'неверный формат вопроса'); return; }
          if (seen.has(q[0]) && !/^(Как правильно\?|Найди|В каком слове ошибка\?|Какое слово лишнее\?)/.test(q[0])) warn(wq, `вопрос повторяется в теме: «${q[0]}»`);
          seen.add(q[0]);
          if (typeof q[1] === 'string') {
            inputs++;
            if (q.length !== 3) err(wq, 'вопрос с вводом: [вопрос, «ответ|вариант», пояснение]');
            const answers = q[1].split('|').map(a => a.trim());
            if (answers.some(a => !a)) err(wq, 'пустой вариант ответа');
            if (typeof q[2] !== 'string' || !q[2].trim()) err(wq, 'нет пояснения');
            checkArithmetic(wq, q[0], answers[0]);
          } else if (Array.isArray(q[1])) {
            if (q.length !== 4) err(wq, 'вопрос с вариантами: [вопрос, [варианты], индекс, пояснение]');
            const opts = q[1];
            if (opts.length < 2 || opts.length > 4) err(wq, 'нужно от 2 до 4 вариантов');
            if (opts.some(o => typeof o !== 'string' || !o.trim())) err(wq, 'пустой вариант');
            if (new Set(opts).size !== opts.length) err(wq, 'варианты повторяются');
            if (!Number.isInteger(q[2]) || q[2] < 0 || q[2] >= opts.length) err(wq, `индекс ответа ${q[2]} вне диапазона`);
            if (typeof q[3] !== 'string' || !q[3].trim()) err(wq, 'нет пояснения');
            if (Number.isInteger(q[2]) && opts[q[2]] !== undefined) checkArithmetic(wq, q[0], opts[q[2]]);
          } else {
            err(wq, 'второй элемент должен быть массивом вариантов или строкой ответа');
          }
        });
      }
    }
  }
}

// 4. Все локальные файлы, на которые ссылается index.html, существуют.
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const [, ref] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith('data:')) continue;
  const file = ref.split('?')[0];
  if (!fs.existsSync(path.join(root, file))) err('index.html', `нет файла ${file}`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
for (const icon of manifest.icons || []) {
  if (!fs.existsSync(path.join(root, icon.src))) err('manifest.webmanifest', `нет иконки ${icon.src}`);
}

warnings.forEach(w => console.warn('⚠️  ' + w));
if (errors.length) {
  errors.forEach(e => console.error('❌ ' + e));
  console.error(`\nОшибок: ${errors.length}`);
  process.exit(1);
}
console.log(`✅ Контент в порядке: ${topics} тем, ${questions} заданий (${inputs} с вводом ответа).`);
