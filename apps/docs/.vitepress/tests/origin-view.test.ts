import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { creationMethod, metaRows, sameConfigCmd } from '../theme/components/Home/origin-view.ts'
import type { TemplateOrigin } from '../template-origin.ts'

const CLONE: TemplateOrigin = {
  variant: 'auth-session',
  repository: 'CyberPunk10/template-nest-nuxt',
  baseVersion: '0.1.1',
}
const GENERATOR: TemplateOrigin = {
  ...CLONE,
  createdWith: 'create-nest-nuxt@0.3.0',
  createdAt: '2026-11-27',
  docsLanguage: 'en',
}

// Подписи — ключи, чтобы в проверках было видно, какая выбрана.
const T = {
  method: 'method',
  methodClone: 'methodClone',
  variant: 'variant',
  version: 'version',
  basedOn: 'basedOn',
  basedOnHint: 'after {version}',
  created: 'created',
  createdClone: 'createdClone',
}

describe('проект создан генератором', () => {
  it('способ — generator', () => {
    assert.equal(creationMethod(GENERATOR), 'generator')
  })

  it('команда повторяет версию генератора, вариант и язык', () => {
    assert.equal(sameConfigCmd(GENERATOR), 'npx create-nest-nuxt@0.3.0 my-app --variant auth-session --lang en')
  })

  it('без языка команда обходится без --lang', () => {
    assert.equal(sameConfigCmd({ ...GENERATOR, docsLanguage: undefined }), 'npx create-nest-nuxt@0.3.0 my-app --variant auth-session')
  })

  it('строки: генератор, вариант, точная версия, дата', () => {
    assert.deepEqual(metaRows(GENERATOR, T), [
      { label: 'method', value: 'create-nest-nuxt@0.3.0', prose: false },
      { label: 'variant', value: 'auth-session' },
      { label: 'version', value: '0.1.1', hint: undefined },
      { label: 'created', value: '2026-11-27', unknown: false },
    ])
  })
})

describe('проект — клон ветки шаблона', () => {
  it('способ — clone', () => {
    assert.equal(creationMethod(CLONE), 'clone')
  })

  it('команды «с той же версией» нет', () => {
    assert.equal(sameConfigCmd(CLONE), null)
  })

  it('строки: клон, вариант, «основан на» с пояснением, дата неизвестна', () => {
    assert.deepEqual(metaRows(CLONE, T), [
      { label: 'method', value: 'methodClone', prose: true },
      { label: 'variant', value: 'auth-session' },
      { label: 'basedOn', value: '0.1.1', hint: 'after 0.1.1' },
      { label: 'created', value: 'createdClone', unknown: true },
    ])
  })
})

describe('данных нет', () => {
  it('способа нет', () => {
    assert.equal(creationMethod(null), null)
  })

  it('команды «с той же версией» нет', () => {
    assert.equal(sameConfigCmd(null), null)
  })

  it('у всех строк нет значения — компонент пишет «нет данных»', () => {
    for (const row of metaRows(null, T)) {
      assert.equal(row.value, undefined, row.label)
      assert.equal(row.hint, undefined, row.label)
    }
  })
})
