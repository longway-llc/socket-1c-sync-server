import fsPromise from 'fs/promises'
import fs from 'fs'
import moment from "moment-timezone";
import path from "path";

type LogType = "info" | "error"

const LOG_FILE = 'syncServerLogs.log'

const timestamp = (string: string): string => (`${moment.tz("Europe/Moscow").format(`DD-MM-YYYY HH:mm:ss`)} : ${string}\n`)

const createDirIfNotExist = (dirPath:string):void => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath)
    }
}

export const log = async (data: string | Error, type: LogType = "info"): Promise<void> => {
    const dir = path.join(__dirname, path.relative('./', '../../logs/'))

    createDirIfNotExist(dir)

    await fsPromise.appendFile(
        path.join(dir, LOG_FILE),
        timestamp(`${type == "error" && "ERROR "}${data} ${(data as Error)?.stack  && `\n${(data as Error).stack}`}`)
    )
}