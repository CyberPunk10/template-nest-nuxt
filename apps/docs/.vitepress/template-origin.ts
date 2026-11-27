import { readFileSync } from 'fs'

// Поле templateOrigin корневого package.json. Первые три поля есть в самом
// шаблоне, остальные дописывает create-nest-nuxt при создании проекта —
// если их нет, проект создан не генератором.
export interface TemplateOrigin {
  variant: string
  repository: string
  baseVersion: string
  createdWith?: string
  createdAt?: string
  docsLanguage?: string
}

// Читает templateOrigin из package.json по пути path. Без падения: если
// файла нет, он не читается или поля нет — null. Так документация, запущенная
// отдельно от монорепо, просто покажет, что данных нет.
export function readTemplateOrigin(path: string): TemplateOrigin | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')).templateOrigin ?? null
  } catch {
    return null
  }
}
