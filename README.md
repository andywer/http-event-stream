# http-event-stream

Create plain HTTP event streams using Server Sent Events (SSE) in node.js. Stream push notifications to the client without web socket.

Framework-agnostic, works with Express, Koa and probably many more. Check out [Difference to WebSockets](#difference-to-websockets) below.


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
app.get('/time-stream', (req, res) => {
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
router.get('/time-stream', (context) => {
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


## Further reading

- [Smashing Magazine - Using SSE Instead Of WebSockets For Unidirectional Data Flow Over HTTP/2](https://www.smashingmagazine.com/2018/02/sse-websockets-data-flow-http2/)
- [streamdata.io - Why we chose server-sent events SSE vs Websockets for our streaming API](https://streamdata.io/blog/push-sse-vs-websockets/)
- [codeburst.io - Polling vs SSE vs WebSocket— How to choose the right one](https://codeburst.io/polling-vs-sse-vs-websocket-how-to-choose-the-right-one-1859e4e13bd9)


## License

MIT

