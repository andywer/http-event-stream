/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { ServerSentEvent } from './types';
export { ServerSentEvent };
export interface EventStream {
    close(): void;
}
export interface StreamContext {
    close(): void;
    sendComment(comment: string): void;
    sendEvent(event: ServerSentEvent): void;
}
export declare type UnsubscribeFn = () => void;
export interface EventStreamOptions {
    /** How often to send a keep-alive comment. In milleseconds. */
    keepAliveInterval?: number;
    fetch(lastEventId: string): Promise<ServerSentEvent[]>;
    stream(context: StreamContext): UnsubscribeFn;
    onError?(error: Error): void;
}
export declare function streamEvents(req: IncomingMessage, res: ServerResponse, options: EventStreamOptions): Promise<EventStream>;
