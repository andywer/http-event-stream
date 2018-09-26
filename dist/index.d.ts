/// <reference types="node" />
import { ServerResponse } from 'http';
export interface ServerSentEvent {
    data: string | string[];
    event?: string;
    id?: string;
    retry?: number;
}
export interface EventStream {
    close(): void;
    sendComment(comment: string): void;
    sendMessage(event: ServerSentEvent): void;
}
export interface EventStreamOptions {
    /** How often to send a keep-alive comment. In milleseconds. */
    keepAliveInterval?: number;
    /** Callback to be called when the stream is closed by either party. */
    onClose?: (hadNetworkError: boolean) => void;
}
export declare function createEventStream(res: ServerResponse, options?: EventStreamOptions): EventStream;
