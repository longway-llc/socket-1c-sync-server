/*eslint-disable */
require('dotenv').config()
/*eslint-enable */
import {log} from './logger'
import mongoose from "mongoose";
import {server} from "./server";


!(async function start() {
    try {
        await mongoose.connect(process.env.DATABASE_URL as string, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useFindAndModify: false,
            useUnifiedTopology: true,
        })

        server.listen(async () => {
            console.log('Server start on PORT: 8080')
        })
    } catch (e) {
        console.error(e)
        log(e.message, 'error')
        throw e
    }
}())





