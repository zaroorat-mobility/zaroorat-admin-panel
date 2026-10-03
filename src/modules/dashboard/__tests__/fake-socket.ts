/**
 * A socket.io-client stand-in that records what the dashboard does with it: listeners,
 * emitted commands, connects and disconnects. The server side is driven with `serverSends`.
 */
type Handler = (...args: unknown[]) => void

export class FakeSocket {
  active = true
  readonly listeners = new Map<string, Set<Handler>>()
  readonly emitted: Array<{ event: string; payload: unknown }> = []
  connectCalls = 0
  disconnectCalls = 0
  /** What the server answers to `dashboard.subscribe`. */
  subscribeAck: unknown = { ok: true, rooms: ['dashboard:ops', 'dashboard:finance'] }

  readonly url: string
  readonly opts: Record<string, unknown>

  constructor(url: string, opts: Record<string, unknown>) {
    this.url = url
    this.opts = opts
  }

  on(event: string, handler: Handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler)
    return this
  }
  off(event: string, handler: Handler) {
    this.listeners.get(event)?.delete(handler)
    return this
  }
  emit(event: string, payload: unknown, ack?: (res: unknown) => void) {
    this.emitted.push({ event, payload })
    if (event === 'dashboard.subscribe') ack?.(this.subscribeAck)
    return this
  }
  connect() {
    this.connectCalls++
    this.active = true
    return this
  }
  disconnect() {
    this.disconnectCalls++
    this.active = false
    this.serverSends('disconnect', 'io client disconnect')
    return this
  }

  /** Delivers an event to the client's listeners as the server (or socket.io) would. */
  serverSends(event: string, ...args: unknown[]) {
    for (const handler of [...(this.listeners.get(event) ?? [])]) handler(...args)
  }
  listenerCount(event?: string): number {
    if (event) return this.listeners.get(event)?.size ?? 0
    let total = 0
    for (const set of this.listeners.values()) total += set.size
    return total
  }
  /** True while the dashboard holds it: connected by us and not torn down. */
  get open(): boolean {
    return this.disconnectCalls === 0
  }
}

export function fakeSocketFactory() {
  const sockets: FakeSocket[] = []
  const connect = (url: string, opts: Record<string, unknown>) => {
    const socket = new FakeSocket(url, opts)
    sockets.push(socket)
    return socket
  }
  return { sockets, connect: connect as never }
}

/** A hint envelope exactly as the backend `socketEnvelope` builds it. */
export const hint = (data: Record<string, unknown>, eventId = `evt-${Math.random()}`) => ({
  eventId,
  type: 'test',
  occurredAt: '2026-09-30T06:00:00.000Z',
  data,
})
