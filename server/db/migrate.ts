import { Migrator } from 'kysely'
import { db } from './client'
import { provider } from './migrations'

export async function migrateToLatest(): Promise<void> {
  const migrator = new Migrator({ db, provider })
  const { error, results } = await migrator.migrateToLatest()

  for (const result of results ?? []) {
    if (result.status === 'Success') {
      console.log(`migration "${result.migrationName}" executed successfully`)
    } else if (result.status === 'Error') {
      console.error(`migration "${result.migrationName}" failed`)
    }
  }

  if (error) {
    console.error('failed to migrate')
    throw error
  }
}

if (import.meta.main) {
  migrateToLatest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
