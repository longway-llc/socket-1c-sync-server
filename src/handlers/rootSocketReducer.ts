import WebSocket from 'ws'

export interface WebSocketAction {
    type: string,
    payload: any
}

export type WebSocketReducer = (action: WebSocketAction, socket: WebSocket) => Promise<void>

type WebSocketStore = {
    sockets: { [key: string]: WebSocket },
    handlers: WebSocketReducer[]
}

const store: WebSocketStore = {
    sockets: {},
    handlers: []
}

const handleAction = async (userId: string, serializedAction: string) => {
    const action: WebSocketAction = JSON.parse(serializedAction)
    for (const handler of store.handlers) {
        await handler(action, store.sockets[userId])
    }
    store.sockets[userId].close(1001)
}

export const createWebSocketConnection = (ws: WebSocket, userId: string): void => {
    store.sockets[userId] = ws
    ws.on("message", async (serializedAction: string) => await handleAction(userId, serializedAction))
    ws.on('close', () => delete store.sockets[userId])
}

export const registerReducer = (reducer: WebSocketReducer): number => store.handlers.push(reducer)