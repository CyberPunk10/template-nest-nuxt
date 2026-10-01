// Помечает префиксом собственные сообщения скриптов

// Пурпурный не занят concurrently (красный, жёлтый, голубой) — см. dev.mjs
const COLORS = { prefix: '\x1b[35m', ok: '\x1b[32m', error: '\x1b[31m', reset: '\x1b[0m' }

// Цвет отключаем, когда вывод не в терминал (пайп, файл, CI): там escape-коды
// превратились бы в мусор вида `ESC[35m`. NO_COLOR — общепринятое соглашение.
function paint(text, color) {
  const plain = !process.stdout.isTTY || process.env.NO_COLOR
  return plain ? text : `${color}${text}${COLORS.reset}`
}

// Создаёт логгер с именем скрипта: createLogger('check-ports.mjs') → [check-ports.mjs] ...
// ok — шаг выполнен (✓), error — ошибка (✗). По этим строкам видно,
// что скрипт сделал и на каком шаге остановился.
export function createLogger(name) {
  const prefix = `[${name}]`
  return {
    /* eslint-disable no-console */
    log: (...args) => console.log(paint(prefix, COLORS.prefix), ...args),
    ok: (...args) => console.log(paint(prefix, COLORS.prefix), paint('✓', COLORS.ok), ...args),
    error: (...args) => console.error(paint(prefix, COLORS.error), paint('✗', COLORS.error), ...args),
    /* eslint-enable no-console */
  }
}
