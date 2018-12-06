import * as http from "http"
import Koa from "koa"
import Router from "koa-router"
import KCORS from "kcors"
import { streamEvents } from "../src/index"
import {
  dispatchTestEvent,
  retrieveTestEventsSinceId,
  serializeEvent,
  subscribeToTestEvents
} from "./server-test-events"

const eventIntervalMs = 40
let nextEventId = 1

async function streamTestEvents (req: http.ServerRequest, res: http.ServerResponse) {
  await streamEvents(req, res, {
    async fetch (lastEventId: string) {
      return retrieveTestEventsSinceId(lastEventId).map(serializeEvent)
    },
    stream (streamContext) {
      const unsubscribe = subscribeToTestEvents(event => {
        streamContext.sendEvent(serializeEvent(event))
      })
      return unsubscribe
    }
  })
}

function createKoaServer () {
  const app = new Koa()
  const router = new Router()

  router.get("/", async context => {
    context.status = 200
  })

  router.get("/stream", async context => {
    await streamTestEvents(context.req, context.res)
    context.respond = false
  })

  // Just for testing purposes; you wouldn't usually provide such an endpoint
  router.post("/exit", async () => {
    server.close()
  })

  // Just for testing purposes; you wouldn't usually provide such an endpoint
  router.get("/last-event-id", async context => {
    context.body = String(nextEventId - 1)
  })

  app.use(KCORS())
  app.use(router.allowedMethods())
  app.use(router.routes())

  const server = app.listen(34567, () => console.log("Server listing on port 34567"))

  return app
}

function periodicallyDispatchTestEvents () {
  setInterval(() => {
    dispatchTestEvent({
      id: String(nextEventId++),
      timestamp: new Date().toISOString()
    })
  }, eventIntervalMs)
}

periodicallyDispatchTestEvents()
createKoaServer()
