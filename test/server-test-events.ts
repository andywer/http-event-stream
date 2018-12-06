import { ServerSentEvent } from "../src/index"

interface TestEvent {
  id: string,
  timestamp: string
}

type TestEventListener = (event: TestEvent) => void

const previousTestEvents: TestEvent[] = []
let testEventListeners: TestEventListener[] = []

export function dispatchTestEvent (event: TestEvent) {
  previousTestEvents.push(event)

  for (const listener of testEventListeners) {
    listener(event)
  }
}

export function serializeEvent (event: TestEvent): ServerSentEvent {
  return {
    id: event.id,
    data: JSON.stringify({
      timestamp: event.timestamp
    })
  }
}

export function retrieveTestEventsSinceId (id: string) {
  const eventIndex = previousTestEvents.findIndex(event => event.id === id)

  if (eventIndex > -1) {
    return previousTestEvents.slice(eventIndex)
  } else {
    return []
  }
}

export function subscribeToTestEvents (listener: TestEventListener) {
  testEventListeners.push(listener)

  return function unsubscribe () {
    testEventListeners = testEventListeners.filter(someListener => someListener !== listener)
  }
}
