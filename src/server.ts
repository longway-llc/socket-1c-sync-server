import {createWebSocketConnection, registerReducer} from "./handlers/rootSocketReducer";
import {sync1cReducer} from "./handlers/1cSocketReducer";
import {log} from "./logger";
import http from "http";
import WebSocket from "ws"



export const server = http.createServer();

const wss = new WebSocket.Server({server: server, port: 8080})

registerReducer(sync1cReducer)

wss.on('connection', (ws, /*req*/) => {
    try {
        // const {userId} = jwt.decode(parseCookies(req).token) as Cookies
        createWebSocketConnection(ws, 'userId')
        ws.send('Соединение установлено')
    } catch (e) {
        ws.send(`Ошибка: ${e.message}`)
        log(e,'error')
    }
})