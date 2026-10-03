#!/bin/sh
# Приводит схему БД в актуальное состояние до старта приложения.
set -e

echo "→ Applying database migrations..."
# migrate deploy (не dev) — применяет только pending-миграции, без интерактивных
# вопросов и без риска пересоздать БД. Безопасно при каждом рестарте контейнера.
npx prisma migrate deploy

echo "→ Starting application..."
exec "$@"
