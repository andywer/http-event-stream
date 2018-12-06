export interface ServerSentEvent {
    data: string | string[];
    event?: string;
    id?: string;
    retry?: number;
}
