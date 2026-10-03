# Prisma errors

Prisma normalizes PostgreSQL errors into its own codes via `PrismaClientKnownRequestError`. This lets you handle errors without parsing the driver's text messages.

The most common codes:

| Code    | Meaning                                                     | Typical response                    |
| ------- | ----------------------------------------------------------- | ----------------------------------- |
| `P2002` | Unique constraint violation (e.g. email already taken)      | `409 Conflict`                      |
| `P2025` | Record not found on `update`, `delete`, `findUniqueOrThrow` | `404 Not Found`                     |
| `P2003` | Foreign key constraint violation                            | `409 Conflict` or `400 Bad Request` |

The idiomatic pattern is to go straight for `update`/`delete` and catch P2025, instead of a preliminary `findUniqueOrThrow`.

::: tip TOCTOU (Time-Of-Check Time-Of-Use)
A class of bugs where there is a window between checking a condition and acting on it in which the state can change. Here: between `findUniqueOrThrow` (the check) and `update`/`delete` (the use), another process manages to delete the record.
:::

❌ **Two queries with a TOCTOU window:**

```typescript
// Query 1: check that the record exists
await this.prisma.user.findUniqueOrThrow({ where: { id } }).catch(() => {
  throw new NotFoundException() // handled
})
// ← another process may delete the record here
// Query 2: update — throws an unhandled P2025 → 500
return await this.prisma.user.update({ where: { id }, data: dto })
```

✅ **One query, P2025 handled explicitly:**

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

This eliminates the TOCTOU window between the two queries and halves the number of database round-trips.

Full list of codes: [Prisma Error Reference](https://www.prisma.io/docs/orm/reference/error-reference)
