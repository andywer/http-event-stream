import { ServerResponse } from 'http'
import { ServerSentEvent } from './types'

export interface LowLevelEventStream {
  close (): void
  sendComment (comment: string): void
  sendMessage (event: ServerSentEvent): void
}

export interface LowLevelStreamOptions {
  /** Whether to close the response stream after first data has been sent. */
  autoCloseFast?: boolean

  /** How often to send a keep-alive comment. In milleseconds. */
  keepAliveInterval?: number

  /** Callback to be called when the stream is closed by either party. */
  onClose?: (hadNetworkError: boolean) => void
}

export function createLowLevelStream (res: ServerResponse, options: LowLevelStreamOptions): LowLevelEventStream {
  if (res.headersSent) {
    throw new Error('Cannot create SSE event stream: Headers have already been sent to client.')
  }

  // Chrome chokes upon double-newline separated comment blocks without data,
  // so make sure we always make comments part of a data message block
  let stillInCommentBlock = false

  let autoCloseTimer: any

  const eventStream = {
    sendMessage (event: ServerSentEvent) {
      const lines: string[] = []
      const data = Array.isArray(event.data) ? event.data : [event.data]

      if (stillInCommentBlock) {
        lines.push('')
      }

      if (event.event) {
        lines.push(`event:${event.event}`)
      }
      if (event.id) {
        lines.push(`id:${event.id}`)
      }
      if (event.retry) {
        lines.push(`retry:${event.retry}`)
      }

      for (const dataItem of data) {
        for (const dataItemLine of dataItem.replace(/(\r\n|\r)/g, '\n').split('\n')) {
          lines.push(`data:${dataItemLine}`)
        }
      }

      res.write(lines.join('\n') + '\n\n')
      stillInCommentBlock = false

      // Auto-close feature: In case this is a request made by a non-compatible browser; allows polyfilling
      if (options.autoCloseFast && !autoCloseTimer) {
        autoCloseTimer = setTimeout(() => eventStream.close(), 1)
      }
    },
    sendComment (comment: string) {
      res.write(':' + comment + '\n')
      stillInCommentBlock = true
    },
    close () {
      res.end()
    }
  }

  initStream(eventStream, res, options)

  return eventStream
}

function initStream (stream: LowLevelEventStream, res: ServerResponse, options: LowLevelStreamOptions) {
  const { autoCloseFast, keepAliveInterval = 20000 } = options

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
    'Connection': autoCloseFast ? 'close' : 'keep-alive'
  })

  stream.sendComment('ok')

  return stream
}
