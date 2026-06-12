/* eslint-disable no-console */
import { rmSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function remove(name, path) {
  if (existsSync(path)) {
    console.log(`Removing ${name}...`)
    rmSync(path, { recursive: true, force: true })
  }
}

remove('pnpm-lock.yaml', resolve(ROOT, 'pnpm-lock.yaml'))
remove('node_modules', resolve(ROOT, 'node_modules'))

console.log('Running pnpm install...')
execSync('pnpm install', { cwd: ROOT, stdio: 'inherit' })
console.log('Done.')
