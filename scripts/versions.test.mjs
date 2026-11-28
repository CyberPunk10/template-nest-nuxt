import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

// Версия Node должна совпадать во всех местах проекта:
// - .nvmrc
// - engines.node в package.json
// - FROM node:… в Dockerfile
// Обновили в одном — обновите и в остальных, иначе тест упадёт.

const ROOT = new URL('../', import.meta.url).pathname
const read = path => readFileSync(join(ROOT, path), 'utf8')
const nvmrc = read('.nvmrc').trim()
const [major, minor] = nvmrc.split('.')

// Все Dockerfile в apps/* и infra/*.
function dockerfiles() {
  const found = []
  for (const dir of ['apps', 'infra']) {
    for (const name of readdirSync(join(ROOT, dir))) {
      const path = join(dir, name, 'Dockerfile')
      if (existsSync(join(ROOT, path))) found.push(path)
    }
  }
  return found
}

describe('[versions.test.mjs] версия Node в проекте', () => {
  it('.nvmrc — точная версия вида x.y.z', () => {
    assert.match(nvmrc, /^\d+\.\d+\.\d+$/)
  })

  it('engines.node требует не меньше версии из .nvmrc', () => {
    assert.equal(JSON.parse(read('package.json')).engines.node, `>=${nvmrc}`)
  })

  it('образы Docker на node того же мажора и минора, что .nvmrc', () => {
    const images = dockerfiles().flatMap(path =>
      [...read(path).matchAll(/^FROM node:(\S+)/gm)].map(m => ({ path, tag: m[1] })))
    // Без образов node проверка была бы пустой и зелёной.
    assert.ok(images.length > 0, 'no FROM node: found in Dockerfiles')
    for (const { path, tag } of images) {
      assert.match(tag, new RegExp(`^${major}\\.${minor}(\\.|-|$)`), `${path}: node:${tag}, but .nvmrc has ${nvmrc}`)
    }
  })
})
