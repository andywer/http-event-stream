import { expect } from "chai"

declare const puppet: {
  argv: string[],
  exit (exitCode?: number): void,
  setOfflineMode (setOffline?: boolean): void
}

const eventIntervalMs = 40
const streamURL = "http://localhost:34567/stream"

let eventSource: EventSource

function delay (ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function increaseId (id: string) {
  return String(parseInt(id, 10) + 1)
}

async function fetchLastEventId () {
  const response = await fetch("http://localhost:34567/last-event-id")
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${response.url}`)
  }
  return response.text()
}

function waitForMessages (source: EventSource, messageCount: number, onMessage?: (message: MessageEvent) => void) {
  const receivedMessages: MessageEvent[] = []

  return new Promise<MessageEvent[]>((resolve, reject) => {
    source.addEventListener("message", (message: MessageEvent) => {
      receivedMessages.push(message)

      if (onMessage) {
        onMessage(message)
      }

      if (receivedMessages.length >= messageCount) {
        resolve(receivedMessages)
      }
    })
    source.addEventListener("error", (error: ErrorEvent) => {
      reject(new Error(error.message))
    })
  })
}

after(async () => {
  // Ask the server to terminate itself
  await fetch("http://localhost:34567/exit", { method: "POST" })
})

describe("Event stream | Client-side tests", function () {
  afterEach(() => eventSource.close())

  it("can subscribe to stream and receive events", async function () {
    eventSource = new EventSource(streamURL)

    const receivedMessages = await waitForMessages(eventSource, 3)
    expect(receivedMessages.length).to.equal(3)
  })

  it("received events contain expected data", async function () {
    eventSource = new EventSource(streamURL)
    const receivedMessages = await waitForMessages(eventSource, 10)

    expect(receivedMessages.length).to.equal(10)
    expect(receivedMessages[1].lastEventId).to.equal(
      increaseId(receivedMessages[0].lastEventId)
    )
    expect(() => JSON.parse(receivedMessages[0].data)).to.not.throw()
    expect(JSON.parse(receivedMessages[0].data).timestamp).to.be.a("string")

    const messageTime0 = new Date(JSON.parse(receivedMessages[0].data).timestamp).getTime()
    const messageTime1 = new Date(JSON.parse(receivedMessages[1].data).timestamp).getTime()
    const messageTime9 = new Date(JSON.parse(receivedMessages[9].data).timestamp).getTime()

    expect(messageTime9).to.be.approximately(Date.now(), eventIntervalMs + 20)
    expect(messageTime1 - messageTime0).to.be.approximately(eventIntervalMs, eventIntervalMs / 4)
  })

  it("can fetch some recent events without streaming", async function () {
    const lastEventId = parseInt(await fetchLastEventId(), 10)
    await delay(eventIntervalMs * 3)

    const response = await fetch(streamURL, {
      headers: {
        "Last-Event-Id": String(lastEventId)
      }
    })
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${response.url}`)
    }

    const lines = (await response.text()).split("\n")
    const dataLines = lines.filter(line => line.match(/^[a-z]+:/))

    expect(dataLines[0]).to.equal(`id:${lastEventId}`)
    expect(dataLines[1]).to.match(/^data:{"timestamp":"[^"]+"}$/)
    expect(dataLines[2]).to.equal(`id:${lastEventId + 1}`)
    expect(dataLines[3]).to.match(/^data:{"timestamp":"[^"]+"}$/)
    expect(dataLines[4]).to.equal(`id:${lastEventId + 2}`)
    expect(dataLines[5]).to.match(/^data:{"timestamp":"[^"]+"}$/)
  })

  it("stream reconnects successfully after being offline", async function () {
    eventSource = new EventSource(streamURL)

    const startTime = Date.now()
    let receivedMessageCount = 0

    const receivedMessages = await waitForMessages(eventSource, 10, () => {
      if (receivedMessageCount++ === 5) {
        puppet.setOfflineMode(true)
        setTimeout(() => {
          puppet.setOfflineMode(false)
        }, 3 * eventIntervalMs)
      }
    })

    const endTime = Date.now()

    // Should not have taken any longer: Stream, disconnect, catch-up + new stream === uninterrupted stream
    expect(endTime - startTime).to.be.approximately(10 * eventIntervalMs, eventIntervalMs + 20)

    expect(receivedMessages[5].lastEventId).to.equal(increaseId(receivedMessages[4].lastEventId))
  })
})
