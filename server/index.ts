import { migrateToLatest } from './db/migrate'
import { app } from './app'

await migrateToLatest()

const port = Number(process.env.PORT ?? 3000)
const hostname = process.env.HOST ?? '127.0.0.1'

app.listen({ port, hostname }, (server) => {
  console.log(`🍜 API listening on http://${server.hostname}:${server.port}`)
})
