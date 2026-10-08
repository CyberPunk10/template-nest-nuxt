// Выполняется до загрузки любых модулей — env-переменные подхватит ConfigService.
process.env.NODE_ENV = 'production'
process.env.APP_ENV = 'test' // для тестов, например отключает throttler через skipIf в AppModule
process.env.BCRYPT_ROUNDS = '4' // минимум для тестов, в проде Joi требует ≥4
