import type { TemplateOrigin } from '../../../template-origin'

// Способ создания: generator — через create-nest-nuxt; clone — копия ветки
// шаблона мимо генератора (git clone, «Use this template» или архив);
// null — данных нет.
export type CreationMethod = 'generator' | 'clone'

export function creationMethod(origin: TemplateOrigin | null): CreationMethod | null {
  if (!origin) return null
  return origin.createdWith ? 'generator' : 'clone'
}

// Команда для нового проекта с той же версией и предустановками.
// createdWith уже в формате пакета для npx (create-nest-nuxt@0.3.0), а каждая
// версия генератора скачивает свой закреплённый релиз шаблона — поэтому
// результат совпадёт с исходным. Для клона команды нет: повторить его нечем.
export function sameConfigCmd(origin: TemplateOrigin | null): string | null {
  if (!origin?.createdWith) return null
  const lang = origin.docsLanguage ? ` --lang ${origin.docsLanguage}` : ''
  return `npx ${origin.createdWith} my-app --variant ${origin.variant}${lang}`
}

export interface MetaTexts {
  method: string
  methodClone: string
  variant: string
  version: string
  basedOn: string
  basedOnHint: string
  created: string
  createdClone: string
}

export interface MetaRow {
  label: string
  // Нет значения — компонент пишет «нет данных».
  value?: string
  // Пояснение мелким шрифтом под значением.
  hint?: string
  // Значение — слова, а не код: без моноширинного шрифта.
  prose?: boolean
  // Значение «неизвестно» оформляется так же, как «нет данных».
  unknown?: boolean
}

// Строки правой колонки «Откуда проект». У клона версия — последний релиз
// ветки на момент копирования, а сам код — любой коммит между ним и следующим
// релизом; дата создания неизвестна.
export function metaRows(origin: TemplateOrigin | null, t: MetaTexts): MetaRow[] {
  const isClone = creationMethod(origin) === 'clone'
  return [
    {
      label: t.method,
      value: isClone ? t.methodClone : origin?.createdWith,
      prose: isClone,
    },
    { label: t.variant, value: origin?.variant },
    {
      label: isClone ? t.basedOn : t.version,
      value: origin?.baseVersion,
      hint: isClone ? t.basedOnHint.replace('{version}', origin!.baseVersion) : undefined,
    },
    {
      label: t.created,
      value: isClone ? t.createdClone : origin?.createdAt,
      unknown: isClone,
    },
  ]
}
