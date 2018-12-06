/// <reference types="node" />
import { ServerResponse } from 'http';
import { ServerSentEvent } from './types';
export interface LowLevelEventStream {
    close(): void;
    sendComment(comment: string): void;
    sendMessage(event: ServerSentEvent): void;
}
export interface LowLevelStreamOptions {
    /** Whether to close the response stream after first data has been sent. */
    autoCloseFast?: boolean;
    /** How often to send a keep-alive comment. In milleseconds. */
    keepAliveInterval?: number;
    /** Callback to be called when the stream is closed by either party. */
    onClose?: (hadNetworkError: boolean) => void;
}
export declare function createLowLevelStream(res: ServerResponse, options: LowLevelStreamOptions): LowLevelEventStream;
