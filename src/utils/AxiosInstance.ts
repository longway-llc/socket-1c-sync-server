import axios from 'axios'
import http from 'http'
import https from 'https'


export const AxiosInstance1c = axios.create({
    //60 sec timeout
    timeout: 60000,

    //keepAlive pools and reuses TCP connections, so it's faster
    httpAgent: new http.Agent({keepAlive: true, keepAliveMsecs: 59000}),
    httpsAgent: new https.Agent({keepAlive: true, keepAliveMsecs: 59000}),


    validateStatus: status => status < 400,
    baseURL: process.env.BASE_URL ?? 'http://localhost',
    //follow up to 10 HTTP 3xx redirects
    maxRedirects: 10,

    //cap the maximum content length we'll accept to 50MBs, just in case
    maxContentLength: 50 * 1000 * 1000
});

export const AxiosInstanceApi = axios.create({
    //60 sec timeout
    timeout: 60000,

    //keepAlive pools and reuses TCP connections, so it's faster
    httpAgent: new http.Agent({keepAlive: true, keepAliveMsecs: 59000}),
    httpsAgent: new https.Agent({keepAlive: true, keepAliveMsecs: 59000}),


    validateStatus: status => status < 400,
    baseURL: process.env.API_URL ?? 'http://localhost:1337',
    //follow up to 10 HTTP 3xx redirects
    maxRedirects: 10,

    //cap the maximum content length we'll accept to 50MBs, just in case
    maxContentLength: 50 * 1000 * 1000
});

//optionally add interceptors here...