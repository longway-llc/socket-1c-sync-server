import {IncomingMessage} from "http";

export type Cookies = {
    [key: string]: string
}

export function parseCookies(request: IncomingMessage): Cookies {
    const list: {[key:string]: string} = {}
    const rc = request.headers.cookie

    rc && rc.split(';').forEach((cookie) => {
        const parts = cookie.split('=')
        list[`${parts.shift()?.trim()}`] = decodeURI(parts.join('='))
    })

    return list
}