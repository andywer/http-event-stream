# http-event-stream [![Build Status](https://travis-ci.org/andywer/http-event-stream.svg?branch=master)](https://travis-ci.org/andywer/http-event-stream) [![NPM Version](https://img.shields.io/npm/v/http-event-stream.svg)](https://www.npmjs.com/package/http-event-stream)

Stream real-time events over plain HTTP using [Server Sent Events (SSE)](https://en.wikipedia.org/wiki/Server-sent_events) in node.js.

Focusing on spec-compliant Server Sent Event streams, we not only stream events, but also replay past events on demand. Event replaying is part of the SSE specification and allows clients to reconnect to a stream without missing any data.

📡&nbsp;&nbsp;**Server-sent events via plain HTTP**<br />
💡&nbsp;&nbsp;**Stream as a REST endpoint route**<br />
☁️&nbsp;&nbsp;**Immutable state allows cleaner code**<br />
🗺️&nbsp;&nbsp;**Framework-agnostic - works with Express, Koa & others**<br />
🛡️&nbsp;&nbsp;**No more "Failed to upgrade websocket connection"**<br />

---

## Installation

```sh
npm install http-event-stream
# or
yarn add http-event-stream
```


## Usage

### Using [Express.js](https://expressjs.com/)

```js
const express = require("express")

const app = express()

// Example event stream: Stream the current time
app.get("/time-stream", (req, res) => {
  // Find the implementation below
  streamSampleEvents(req, res)
})

app.listen(3000)
```

### Using [Koa.js](https://koajs.com/)

```js
const Koa = require("koa")
const Router = require("koa-router")

const app = new Koa()
const router = new Router()

// Example event stream: Stream the current time
router.get("/time-stream", (context) => {
  // Find the implementation below
  streamSampleEvents(context.req, context.res)

  // Koa quirk: Don't close the request/stream after handling the route!
  context.respond = false
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3000)
```

### Sample stream implementation

```js
const { streamEvents } = require("http-event-stream")
const events = require("./some-event-emitter")

function streamSampleEvents (req, res) {
  const fetchEventsSince = async (lastEventId) => {
    return [ /* all events since event with ID `lastEventId` woud go here */ ]
  }
  return streamEvents(req, res, {
    async fetch (lastEventId) {
      // This method is mandatory to replay missed events after a re-connect
      return fetchEventsSince(lastEventId)
    },
    stream (stream) {
      const listener = () => {
        stream.sendEvent({
          event: "time",
          data: JSON.stringify({
            now: new Date().toISOString()
          })
        })
      }

      // Subscribe to some sample event emitter
      events.addEventListener("data", listener)

      // Return an unsubscribe function, so the stream can be terminated properly
      const unsubscribe = () => events.removeEventListener("data", listener)
      return unsubscribe
    }
  })
}
```

A server-sent event sent via `stream.sendEvent()` or returned from `fetch()` has to have the following shape:

```ts
interface ServerSentEvent {
  data: string | string[]
  event?: string,
  id?: string
  retry?: number
}
```

Besides `stream.sendEvent(event: ServerSentEvent)` there is also `stream.sendComment(comment: string)` and `stream.close()`.

See [Using server-sent events - Fields](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Fields).


## API

See [dist/index.d.ts](./dist/index.d.ts).


## Differences to WebSockets

Brief summary:

- Automatic reconnecting out of the box
- Unidirectional data flow
- HTTP/2 multiplexing out of the box
- No `Connection: Upgrade` - no special reverse proxy config

What do we use websockets for? Usually for streaming events from the server to client in realtime.

Server Sent Events (SSE) only do this one job, but do it really well. It's a simple protocol, using a normal HTTP connection, only streaming data from the server to the client.

You can pass parameters and headers from the client to the server when opening the stream, but the actual stream is read-only for the client.

It might sound like a strong limitation first, but actually it's a pretty clean approach: It makes the stream stateless and allows cool things like [combining multiple streams into one](https://github.com/Netflix/Turbine) which you could not easily do with a duplex stream.


## Authentication

Since it's all just plain HTTP, we can use headers like we always do. Go ahead and use your favorite auth middleware that you use for the other REST endpoints.


## Client

Make sure to include a polyfill in your web page code, since [not all major browsers provide native support for SSE](https://caniuse.com/#search=server%20sent%20events).

Try [`event-source-polyfill`](https://www.npmjs.com/package/event-source-polyfill).

To connect to SSE streams from node.js, use the [`eventsource` package](https://www.npmjs.com/package/eventsource).


## Further reading

- [Smashing Magazine - Using SSE Instead Of WebSockets For Unidirectional Data Flow Over HTTP/2](https://www.smashingmagazine.com/2018/02/sse-websockets-data-flow-http2/)
- [streamdata.io - Why we chose server-sent events SSE vs Websockets for our streaming API](https://streamdata.io/blog/push-sse-vs-websockets/)
- [codeburst.io - Polling vs SSE vs WebSocket— How to choose the right one](https://codeburst.io/polling-vs-sse-vs-websocket-how-to-choose-the-right-one-1859e4e13bd9)


## License

MIT

