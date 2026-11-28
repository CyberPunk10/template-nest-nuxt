# Ошибки Prisma

Prisma нормализует ошибки PostgreSQL в собственные коды через `PrismaClientKnownRequestError`. Это позволяет обрабатывать ошибки без парсинга текстовых сообщений драйвера.

Наиболее часто встречающиеся коды:

| Код     | Смысл                                                         | Типичная реакция                     |
| ------- | ------------------------------------------------------------- | ------------------------------------ |
| `P2002` | Нарушение unique constraint (например, email уже занят)       | `409 Conflict`                       |
| `P2025` | Запись не найдена при `update`, `delete`, `findUniqueOrThrow` | `404 Not Found`                      |
| `P2003` | Нарушение foreign key constraint                              | `409 Conflict` или `400 Bad Request` |

Идиоматичный паттерн — сразу делать `update`/`delete` и ловить P2025, вместо предварительного `findUniqueOrThrow`.

::: tip TOCTOU (Time-Of-Check Time-Of-Use)
Класс багов, при которых между проверкой условия и его использованием есть окно, в котором состояние может измениться. Здесь: между `findUniqueOrThrow` (проверка) и `update`/`delete` (использование) другой процесс успевает удалить запись.
:::

❌ **Два запроса с TOCTOU-окном:**

```typescript
// Запрос 1: проверяем существование
await this.prisma.user.findUniqueOrThrow({ where: { id } }).catch(() => {
  throw new NotFoundException() // обработано
})
// ← здесь другой процесс может удалить запись
// Запрос 2: обновляем — бросает необработанный P2025 → 500
return await this.prisma.user.update({ where: { id }, data: dto })
```

✅ **Один запрос, P2025 обработан явно:**

```typescript
try {
  return await this.prisma.user.update({ where: { id }, data: dto })
} catch (e) {
  if (e instanceof PrismaClientKnownRequestError) {
    if (e.code === 'P2025') throw new NotFoundException()
    if (e.code === 'P2002') throw new ConflictException()
  }
  throw e
}
```

Это исключает TOCTOU-окно между двумя запросами и сокращает число обращений к БД вдвое.

Полный список кодов: [Prisma Error Reference](https://www.prisma.io/docs/orm/reference/error-reference)
