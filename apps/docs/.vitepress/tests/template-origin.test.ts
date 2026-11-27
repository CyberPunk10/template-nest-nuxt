import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'
import { readTemplateOrigin } from '../template-origin.ts'

describe('readTemplateOrigin', () => {
  const dir = mkdtempSync(join(tmpdir(), 'docs-origin-'))
  after(() => rmSync(dir, { recursive: true, force: true }))

  const write = (name: string, content: string) => {
    const path = join(dir, name)
    writeFileSync(path, content)
    return path
  }

  it('возвращает поле templateOrigin', () => {
    const origin = { variant: 'main', repository: 'owner/repo', baseVersion: '0.1.1' }
    const path = write('with-field.json', JSON.stringify({ name: 'app', templateOrigin: origin }))
    assert.deepEqual(readTemplateOrigin(path), origin)
  })

  it('null, если поля нет', () => {
    assert.equal(readTemplateOrigin(write('no-field.json', '{"name": "app"}')), null)
  })

  it('null, если файла нет — документацию запустили отдельно от монорепо', () => {
    assert.equal(readTemplateOrigin(join(dir, 'missing.json')), null)
  })

  it('null, если файл не JSON', () => {
    assert.equal(readTemplateOrigin(write('broken.json', '{ name:')), null)
  })
})
