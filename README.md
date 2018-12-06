# http-event-stream [![Build Status](https://travis-ci.org/andywer/http-event-stream.svg?branch=master)](https://travis-ci.org/andywer/http-event-stream) [![NPM Version](https://img.shields.io/npm/v/http-event-stream.svg)](https://www.npmjs.com/package/http-event-stream)

Create plain HTTP event streams using [Server Sent Events (SSE)](https://en.wikipedia.org/wiki/Server-sent_events) in node.js. Stream push notifications to the client without WebSockets.

Framework-agnostic: Works with Express, Koa and probably many more. Check out [Differences to WebSockets](#differences-to-websockets) below.

📡&nbsp;&nbsp;Realtime events over plain HTTP<br />
💡&nbsp;&nbsp;Serve as a REST endpoint route<br />
☁️&nbsp;&nbsp;Stateless by design<br />
👌&nbsp;&nbsp;Simple unopinionated API<br />


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
const { streamEvents } = require("http-event-stream")

const app = express()

// Example event stream: Stream the current time
app.get("/time-stream", (req, res) => {
  streamSampleEvents(req, res)
})

app.listen(3000)
```

### Using [Koa.js](https://koajs.com/)

```js
const Koa = require("koa")
const Router = require("koa-router")
const { createEventStream } = require("http-event-stream")

const app = new Koa()
const router = new Router()

// Example event stream: Stream the current time
router.get("/time-stream", (context) => {
  streamSampleEvents(req, res)

  // Don't close the request/stream after handling the route!
  context.respond = false
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3000)
```

### Sample stream implementation

```js
function streamSampleEvents (req, res) {
  const fetchEventsSince = async (lastEventId) => {
    return [ /* all events since event with ID `lastEventId` woud go here */ ]
  }
  return streamEvents(req, res, {
    async fetch (lastEventId) {
      // This method is mandatory to replay missed events after a re-connect
      return fetchEventsSince(lastEventId)
    },
    stream (streamContext) {
      // Sample events: Send an event every second
      const interval = setInterval(() => {
        streamContext.sendEvent({
          event: "time",
          data: {
            now: new Date().toISOString()
          }
        })
      }, 1000)

      // Return stream-closing function
      const unsubscribe = () => clearInterval(interval)
      return unsubscribe
    }
  })
}
```

A server-sent event sent via `streamContext.sendEvent()` or returned from `fetch()` has to have the following shape:

```ts
interface ServerSentEvent {
  data: string | string[]
  event?: string,
  id?: string
  retry?: number
}
```

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

