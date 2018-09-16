# http-event-stream [![Build Status](https://travis-ci.org/andywer/http-event-stream.svg?branch=master)](https://travis-ci.org/andywer/http-event-stream) [![NPM Version](https://img.shields.io/npm/v/http-event-stream.svg)](https://www.npmjs.com/package/http-event-stream)

Create plain HTTP event streams using [Server Sent Events (SSE)](https://en.wikipedia.org/wiki/Server-sent_events) in node.js. Stream push notifications to the client without WebSockets.

Framework-agnostic: Works with Express, Koa and probably many more. Check out [Difference to WebSockets](#difference-to-websockets) below.

⬇ Realtime events over plain HTTP<br />
📡 Serve as a REST endpoint route<br />
⏲ Periodic keep-alive messages<br />
☁️ Stateless by design<br />
👌 Simple unopinionated API<br />


## Installation

```sh
npm install http-event-stream
# or
yarn add http-event-stream
```


## Usage ([Express.js](https://expressjs.com/))

```js
const express = require("express")
const { createEventStream } = require("http-event-stream")

const app = express()

// Example event stream: Stream the current time
app.get("/time-stream", (req, res) => {
  let interval

  const stream = createEventStream(res, {
    onClose: () => clearInterval(interval)
  })

  interval = setInterval(() => {
    stream.sendMessage({
      event: "time",
      data: {
        now: new Date().toISOString()
      }
    })
  }, 1000)
})

app.listen(3000)
```


## Usage ([Koa.js](https://koajs.com/))

```js
const Koa = require("koa")
const Router = require("koa-router")
const { createEventStream } = require("http-event-stream")

const app = new Koa()
const router = new Router()

// Example event stream: Stream the current time
router.get("/time-stream", (context) => {
  let interval

  const stream = createEventStream(context.res, {
    onClose: () => clearInterval(interval)
  })

  interval = setInterval(() => {
    stream.sendMessage({
      event: "time",
      data: {
        now: new Date().toISOString()
      }
    })
  }, 1000)

  // Don't close the request/stream after handling the route!
  context.respond = false
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3000)
```

## Replaying events: Using `Last-Event-ID`

```js
let nextEventID = 1
const recentEvents = []

app.get("/stream/random-numbers", (req, res) => {
  let interval

  const stream = createEventStream(res, {
    onClose: () => clearInterval(interval)
  })

  if (req.get("Last-Event-ID")) {
    // Client wants to catch up with the events that happened since they subscribed previously
    const lastEventIndex = recentEvents.findIndex(event => event.id === req.get("Last-Event-ID"))
    const eventsToCatchUp = lastEventIndex === -1 ? [] : recentEvents.slice(lastEventIndex + 1)

    for (const event of eventsToCatchUp) {
      stream.sendMessage(event)
    }
  }

  interval = setInterval(() => {
    const event = {
      id: String(nextEventID++),
      event: "time",
      data: Math.random()
    }

    stream.sendMessage(event)
    recentEvents.push(event)
  }, 1000)
})

```


## API

See [dist/index.d.ts](./dist/index.d.ts).


## Difference to WebSockets

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

