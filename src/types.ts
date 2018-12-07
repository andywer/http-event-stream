// see <https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Fields>
export interface ServerSentEvent {
  data: string | string[]
  event?: string,
  id?: string
  retry?: number
}
