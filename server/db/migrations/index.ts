import type { Migration, MigrationProvider } from 'kysely'
import * as m0001 from './0001_init'

const migrations: Record<string, Migration> = {
  '0001_init': m0001,
}

export const provider: MigrationProvider = {
  async getMigrations() {
    return migrations
  },
}
