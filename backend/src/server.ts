import { execSync } from 'child_process'
import app from './app'
import { config } from '@/config'

function ensurePostgres(): void {
  try {
    execSync('pg_isready -q', { stdio: 'ignore' })
    console.log('[PG] PostgreSQL 已运行')
    return
  } catch {
    // PostgreSQL 未运行，尝试启动
  }

  console.log('[PG] PostgreSQL 未启动，正在自动启动...')
  const dataDirs = [
    '/opt/homebrew/var/postgresql@16',
    '/opt/homebrew/var/postgresql@15',
    '/opt/homebrew/var/postgres'
  ]

  for (const dir of dataDirs) {
    try {
      execSync(`pg_ctl -D "${dir}" start -w -t 30`, { stdio: 'pipe' })
      console.log(`[PG] PostgreSQL 已启动 (${dir})`)
      return
    } catch {
      continue
    }
  }

  console.error('[PG] 错误: 无法自动启动 PostgreSQL，请手动启动')
  process.exit(1)
}

ensurePostgres()

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
  console.log(`Environment: ${config.nodeEnv}`)
})