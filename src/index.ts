import { IncomingMessage, ServerResponse } from 'http'
import { createLowLevelStream } from './stream'
import { ServerSentEvent } from './types'

export { ServerSentEvent }

export interface EventStream {
  close (): void
}

export interface StreamContext {
  close (): void
  sendComment (comment: string): void,
  sendEvent (event: ServerSentEvent): void
}

export type UnsubscribeFn = () => void

export interface EventStreamOptions {
  /** How often to send a keep-alive comment. In milleseconds. */
  keepAliveInterval?: number,

  fetch (lastEventId: string): Promise<ServerSentEvent[]>,
  stream (context: StreamContext): UnsubscribeFn,

  onError? (error: Error): void
}

const defaultErrorHandler = (error: Error) => {
  // tslint:disable-next-line
  console.error(`Server Sent Event stream errored: ${error}`)
}

export async function streamEvents (req: IncomingMessage, res: ServerResponse, options: EventStreamOptions): Promise<EventStream> {
  const { fetch, stream, onError = defaultErrorHandler } = options

  const handleConnectionClose = () => {
    try {
      unsubscribeFromStream()
    } catch (error) {
      onError(error)
    }
  }

  const initiallyFetchedEvents = req.headers['last-event-id']
    ? await fetch(req.headers['last-event-id'] as string)
    : []

  const autoCloseFast = Boolean(req.headers.accept && !req.headers.accept.match(/\btext\/event-stream\b/))

  const lowLevelStream = createLowLevelStream(res, {
    autoCloseFast,
    keepAliveInterval: options.keepAliveInterval,
    onClose: handleConnectionClose
  })

  const streamContext: StreamContext = {
    close: lowLevelStream.close,
    sendComment: lowLevelStream.sendComment,
    sendEvent: lowLevelStream.sendMessage
  }

  const unsubscribeFromStream = stream(streamContext)

  for (const initiallyFetchedEvent of initiallyFetchedEvents) {
    streamContext.sendEvent(initiallyFetchedEvent)
  }

  return {
    close () {
      streamContext.close()
    }
  }
}
