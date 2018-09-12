import { ServerResponse } from 'http'

// see <https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Fields>
export interface ServerSentEvent {
  data: string | string[]
  event?: string,
  id?: string
  retry?: number
}

export interface EventStream {
  close (): void
  sendComment (comment: string): void
  sendMessage (event: ServerSentEvent): void
}

export interface EventStreamOptions {
  /** How often to send a keep-alive comment. In milleseconds. */
  keepAliveInterval?: number,

  /** Callback to be called when the stream is closed by either party. */
  onClose?: (hadNetworkError: boolean) => void
}

export function createEventStream (res: ServerResponse, options: EventStreamOptions = {}): EventStream {
  if (res.headersSent) {
    throw new Error('Cannot create SSE event stream: Headers have already been sent to client.')
  }

  const stream = {
    sendMessage (event: ServerSentEvent) {
      const lines: string[] = []
      const data = Array.isArray(event.data) ? event.data : [event.data]

      if (event.event) lines.push(`event:${event.event}`)
      if (event.id) lines.push(`id:${event.id}`)
      if (event.retry) lines.push(`retry:${event.retry}`)

      for (const dataItem of data) {
        for (const dataItemLine of dataItem.replace(/(\r\n|\r)/g, '\n').split('\n')) {
          lines.push(`data:${dataItemLine}`)
        }
      }

      res.write(lines.join('\n') + '\n\n')
    },
    sendComment (comment: string) {
      res.write(':' + comment + '\n\n')
    },
    close () {
      res.end()
    }
  }

  initStream(stream, res, options)

  return stream
}

function initStream (stream: EventStream, res: ServerResponse, options: EventStreamOptions) {
  const { keepAliveInterval = 10000 } = options

  if (keepAliveInterval > 0) {
    const keepAliveIntervalID = setInterval(() => {
      stream.sendComment('keep-alive')
    }, keepAliveInterval)

    res.on('close', () => {
      clearInterval(keepAliveIntervalID)
    })
    res.on('finish', () => {
      clearInterval(keepAliveIntervalID)
    })
  }

  if (options.onClose) {
    res.connection.on('close', options.onClose)
  }

  res.connection.setNoDelay(true)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  })

  stream.sendComment('ok')

  return stream
}
