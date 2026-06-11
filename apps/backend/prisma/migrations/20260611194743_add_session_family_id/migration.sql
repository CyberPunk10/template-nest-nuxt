-- Шаг 1: добавляем колонку как nullable, чтобы существующие строки не заблокировали ALTER TABLE.
ALTER TABLE "Session" ADD COLUMN "familyId" TEXT;

-- Шаг 2: заполняем существующие строки — каждая сессия получает уникальный familyId,
-- т.к. они созданы до введения token families и не имеют общей цепочки.
UPDATE "Session" SET "familyId" = gen_random_uuid()::text WHERE "familyId" IS NULL;

-- Шаг 3: теперь можно поставить NOT NULL — все строки уже заполнены.
ALTER TABLE "Session" ALTER COLUMN "familyId" SET NOT NULL;
