// Выполняется до загрузки любых модулей — устанавливает низкий лимит для throttle-теста.
// APP_ENV намеренно не 'test' — иначе skipIf отключит throttler и тест на 429 не сработает.
process.env.NODE_ENV = 'production'
process.env.APP_ENV = 'production'
process.env.THROTTLE_LIMIT = '12'
process.env.BCRYPT_ROUNDS = '4'
