import { TransformFnParams } from 'class-transformer'

// Функции для @Transform из class-transformer. Выполняются в ValidationPipe
// (transform: true) до валидаторов, поэтому @IsNotEmpty() проверяет уже
// обработанное значение: строка из одних пробелов корректно отбраковывается,
// а не попадает в БД пустой.
//
// Проверка typeof обязательна: без неё клиент, приславший число или null,
// получит 500 (`value.trim is not a function`) вместо внятного 400 от валидатора.

/** Обрезает пробелы по краям строки. Нестроковые значения пропускает как есть. */
export const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value

/** Приводит строку к нижнему регистру. Нестроковые значения пропускает как есть. */
export const lowercaseString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.toLowerCase() : value
