import {WebSocketReducer} from "./rootSocketReducer";
import WebSocket from "ws";
import moment from "moment-timezone";
import AxiosInstance from "../utils/AxiosInstance";
import Product, {ProductDocument} from "../models/Product";
import Brand, {BrandDocument} from "../models/Brand";
import Group from "../models/Group";
import Consignment, {ConsignmentDocument} from "../models/Consignment";
import Placement, {PlacementDocument} from "../models/Placement";
import Stock, {StockDocument} from "../models/Stock";
import {log} from "../logger";


type ФормаВыпуска = [{
    "Свойство": "P/N" | "Description" | "UOM" | "Color"
    "Значение": string
}]

type ХарактеристикаНоменклатуры = [{
    "Свойство": "P/N" | "Description" | "UOM" | "Color" | "MFG" | "Brand"
    "Значение": string
}]

type Группа = "Abrasive" |
    "Adhesive" |
    "Cleaners" |
    "Coatings" |
    "Composites" |
    "Compound" |
    "Degreaser" |
    "Equipment" |
    "Films" |
    "Grease" |
    "Misc" |
    "Parts" |
    "Prepregs" |
    "Sealant" |
    "Solvent" |
    "Tapes" |
    "Tools" |
    null

type Категория = "ХИМИЯ" | "PARTS"

type Партия = [{
    "Свойство": "Дата производства" | "Срок годности"
    "Значение": string
}]

type OneCStocksResponse = [{
    "Наименование": string
}]

type OneCProductsResponse = [{
    "КодНоменклатуры": string
    "PN": string
    "Категория": Категория
    "Группа": Группа
    "ЕдиницаИзмерения": string
    "КодФормыВыпуска": string
    "ХарактеристикаНоменклатуры": ХарактеристикаНоменклатуры
    "ФормаВыпуска": ФормаВыпуска
}]

type OneCConsignmentsResponse = [{
    "КодПартии": string
    "КодНоменклатуры": string
    "НаименованиеПартии": string
    "Партия": Партия
}]

type OneCRemainsOfGoodsResponse = [{
    "Количество": number
    "КодНоменклатуры": string
    "НаименованиеНоменклатуры": string
    "КодПартии": string
    "НаименованиеПартии": string
    "Партия": Партия
    "НаименованиеСклада": string
    "КодФормыВыпуска": string
    "ФормаВыпуска": ФормаВыпуска
}]

// type OneCCustomersResponse = [{
//     "Ссылка": string
//     "Код": string
//     "НаименованиеПолное": string
//     "ИНН": string
//     "КонтактноеЛицоНаименование": string | null
// }?]
//
// type RequestOptions = {
//     brand?: boolean,
//     balance?: boolean,
//     consignments?: boolean
// }

const t = (string: TemplateStringsArray): string => (`${moment.tz("Europe/Moscow").format(`HH:mm:ss`)} : ${string}`)

/**
 * Обновляет склады в базе сайта на основе списка структурных единиц в базе 1С
 * */
const updateStocks1c = async (newData: OneCStocksResponse): Promise<number> => {
    try {
        // Создаём массив складов из данных 1с
        const stocks1c = newData.map(s => s.Наименование)
        // Получаем список складов из БД
        const stocksDB = (await Stock.find()).map(s => s.name)
        // Создаём список складов, которые будем вставлять в базу
        const insertingStocks: Array<StockDocument> = []
        // Если имя склада отсутствует в БД, то создаём для него новый экземпляр и кладём в массив
        stocks1c
            .filter(s => !stocksDB.includes(s))
            .forEach(name => insertingStocks.push(new Stock({name})))
        // Если есть новые склады, то вставляем их в БД
        if (insertingStocks.length > 0) {
            await Stock.insertMany(insertingStocks)
        }
        return insertingStocks.length
    } catch (e) {
        log(e, "error")
        throw e
    }
}

/**
 * Обновляет бренды в базе сайта на основе списка всей номеклатуры в базе 1С
 * */
const updateBrands1c = async (newData: OneCProductsResponse): Promise<number> => {
    try {
        // Собираем множество всех брендов из 1С
        const brands1c = new Set(newData.map(p => p.ХарактеристикаНоменклатуры.find(c => c.Свойство == "Brand")?.Значение).filter(b => b != undefined))
        // Получаем список брендов из БД
        const brandsDB = await Brand.find()
        // Создаём массив брендов, которые будем вставлять в базу
        const insertingBrands: Array<BrandDocument> = []
        // Если имя бренда отсутствует в БД, то создаём для него новый экземпляр
        brands1c.forEach(brandName =>
            !brandsDB.find(b => b.name === brandName) && insertingBrands.push(new Brand({name: brandName}))
        )
        // Если есть новые бренды, то вставляем их в БД
        if (insertingBrands.length > 0) {
            await Brand.insertMany(insertingBrands)
        }
        return insertingBrands.length
    } catch (e) {
        log(e.message, "error")
        throw e
    }
}

/**
 * Обновляет номеклатурные данные продуктов в базе
 * */
const updateProductsData = async (products1c: OneCProductsResponse): Promise<number> => {
    // массив новых продуктов, которые будут добавлены в базу
    const insertedNewProducts: ProductDocument[] = []
    try {
        // получаем данные из базы
        const products = await Product.find()
        const brands = await Brand.find()
        const groups = await Group.find()

        for (const product of products1c) {
            // Ищем продукт в базе по коду номенклатуры и форме выпуска
            const dbProduct = products.find(p => (p.code_1c == product.КодНоменклатуры) && (p.code_1c_uom == product.КодФормыВыпуска))
            // Если продукт не найден то создаём новый продукт
            if (!dbProduct) {
                const brandId = brands.find(b => b.name == product.ХарактеристикаНоменклатуры.find(c => c?.Свойство == "Brand")?.Значение)?.id
                const groupId = groups.find(g => g.name == product.Группа)?.id
                insertedNewProducts.push(new Product({
                        pn: product.PN,
                        description_ru: product.ФормаВыпуска.find(f => f?.Свойство == "Description")?.Значение,
                        uom: product.ФормаВыпуска.find(f => f?.Свойство == "UOM")?.Значение,
                        color: product.ФормаВыпуска.find(f => f?.Свойство == "Color")?.Значение,
                        mfg: product.ХарактеристикаНоменклатуры.find(c => c?.Свойство == "MFG")?.Значение,
                        brand: brandId,
                        group: groupId,
                        code_1c: product.КодНоменклатуры,
                        code_1c_uom: product.КодФормыВыпуска,
                        published_at: new Date()
                    })
                )
            }
        }
        await Product.insertMany(insertedNewProducts)
        return insertedNewProducts.length
    } catch (e) {
        log(e, "error")
        throw e
    }
}

/**
 * Находим пустые партии
 * */
const getEmptyConsignments = (consignmentsData: OneCConsignmentsResponse, remainsOfGoods: OneCRemainsOfGoodsResponse): OneCConsignmentsResponse =>
    consignmentsData.filter(c => !remainsOfGoods
        .map(a => a.КодПартии)
        .includes(c.КодПартии)) as OneCConsignmentsResponse

/**
 * Создаёт Расположения для партии (не записывает изменения в базу)
 * */
const getNewPlacementsForConsignment = async (consignment: ConsignmentDocument, remainsOfGoods: OneCRemainsOfGoodsResponse, stocks: StockDocument[]): Promise<PlacementDocument[]> => {
    try {
        // отбираем все расположения из списка остатков в 1с, которые принадлежат текущей партии
        const placements1c = remainsOfGoods.filter(r => r.КодПартии == consignment.code_1c)
        // массив расположений
        const placements: PlacementDocument[] = []

        for (const placement1c of placements1c) {
            // находим склад для текущего расположения
            const stock = stocks.find(s => s.name == placement1c.НаименованиеСклада)
            // создаём расположение
            const placement = new Placement({stock: stock?.id, balance: placement1c.Количество})
            // добавляем его в массив
            placements.push(placement)
        }
        return placements
    } catch (e) {
        log(e, "error")
        throw e
    }
}

/**
 * Добавляет новые партии без расположений в базу
 * */
const addNewConsignments = async (remainsOfGoods: OneCRemainsOfGoodsResponse): Promise<number> => {
    // массив добавленных партий в базу
    const insertConsignments: ConsignmentDocument[] = []
    try {
        // получаем данные из базы
        const consignmentsDB = await Consignment.find()
        const productsDB = await Product.find()

        for (const consignment1c of remainsOfGoods) {
            // Ищем партию из 1с в списке существующих партий в базе
            const existedConsignmentDB = consignmentsDB.find(c => c?.code_1c == consignment1c.КодПартии)
            // Если партия не существует, то создаём новую
            if (!existedConsignmentDB) {
                const productionDate = consignment1c.Партия.find(p => p?.Свойство == "Дата производства")?.Значение
                const validUntil = consignment1c.Партия.find(p => p?.Свойство == "Срок годности")?.Значение
                // находим к какому продукту она принадлежит
                const productId = productsDB.find(p =>
                    (p?.code_1c_uom == consignment1c?.КодФормыВыпуска)
                    &&
                    (p?.code_1c == consignment1c?.КодНоменклатуры)
                )?.id
                // создаём партию
                const newConsignment = new Consignment({
                    product: productId,
                    code_1c: consignment1c.КодПартии,
                    name: consignment1c.НаименованиеПартии,
                    productionDate: productionDate && new Date(productionDate),
                    validUntil: validUntil && new Date(validUntil),
                    published_at: new Date(), // время публикации по умолчанию выставляется текущим временем
                    placements: []
                })
                // добавляем в массив
                insertConsignments.push(newConsignment)
            }
        }
        // вставляем новые партии
        if (insertConsignments.length > 0){
            await Consignment.insertMany(insertConsignments)
        }
        return insertConsignments.length
    } catch (e) {
        log(e, "error")
        throw e
    }
}

/**
 * Удаляет пустые партии из базы
 * */
const deleteEmptyConsignments = async (emptyConsignments: OneCConsignmentsResponse): Promise<number> => {
    let deletedCount = 0
    try {
        for (const consignment of emptyConsignments) {
            // удаляем партию из базы по коду партии
            const emptyConsignment = await Consignment.findOneAndDelete({code_1c: consignment.КодПартии})
            // если партия была удалена, то убираем все расположения, закрепленные за ней
            if (emptyConsignment) {
                for (const placement of emptyConsignment.placements) {
                    await Placement.findOneAndDelete({_id: placement?.ref})
                }
            }

            deletedCount++
        }
        return deletedCount
    } catch (e) {
        log(e, "error")
        throw e
    }
}

/**
 * Обновляет данные о партиях в базе
 * */
const updateConsignmentsData = async (remainsOfGoods: OneCRemainsOfGoodsResponse, consignmentsData: OneCConsignmentsResponse): Promise<{ insertedCount: number, deletedCount: number }> => {
    let [insertedCount, deletedCount] = [0, 0]
    // получаем пустые партии, которые необходимо удалить
    const emptyConsignments = getEmptyConsignments(consignmentsData, remainsOfGoods)
    try {
        insertedCount = await addNewConsignments(remainsOfGoods)
        deletedCount = await deleteEmptyConsignments(emptyConsignments)
        return {insertedCount, deletedCount}
    } catch (e) {
        log(e, "error")
        throw e
    }
}

/**
 * Обновляет остатки товаров на складах
 * */
const updatePlacementData = async (remainsOfGoods: OneCRemainsOfGoodsResponse): Promise<void> => {
    try {
        // Делаем запрос к базе, чтобы извлечь необходимые данные для синхронизации
        const stocks = await Stock.find()
        const consignments = await Consignment.find()
        // Для каждой партии из базы перезаписываем текущие расположения
        for (const consignment of consignments) {
            // берём все Id расположений у партии
            const placementsIdsDb = consignment.placements.map(p => p?.ref).filter(p => p != undefined)
            // удаляем эти расположения из базы
            await Placement.deleteMany({_id: {$in: placementsIdsDb}})
            // очищаем массив расположений у партии
            consignment.placements = []
            // создаём новые расположения для партии
            const newPlacements = await getNewPlacementsForConsignment(consignment, remainsOfGoods, stocks)
            // вставляем новые расположения в базу
            await Placement.insertMany(newPlacements)
            // добавляем расположения в партию
            newPlacements.forEach(p => consignment.placements.push({
                ref: p.id,
                kind: "ComponentPlacementPlacement"
            }))
            // сохраняем партию в базе
            await consignment.save()
        }
    } catch (e) {
        log(e, "error")
        throw e
    }
}
const syncProducts1c = async (ws: WebSocket) => {
    ws.send(t`Началась синхронизация с сервером 1С`)
    try {
        // ============= Получаем все данные из 1С по HTTP ========================
        const {data: productsData} = await AxiosInstance.get<OneCProductsResponse>(`/products`)
        ws.send(t`Список номенклатуры доставлен из 1С`)

        const {data: consignmentsData} = await AxiosInstance.get<OneCConsignmentsResponse>(`/consignments`)
        ws.send(t`Список партий доставлен из 1С`)

        const {data: remainsOfGoods} = await AxiosInstance.get<OneCRemainsOfGoodsResponse>(`/remainsOfGoods`)
        ws.send(t`Список остатков на складах из 1С`)

        const {data: stocks} = await AxiosInstance.get<OneCStocksResponse>(`/stocks`)
        ws.send(t`Список складов доставлен из 1С`)
        // ========================================================================

        // ============= Обновление справочных данных в базе ======================
        ws.send(t`Началось обновление складов`)
        const countNewStocks = await updateStocks1c(stocks)
        ws.send(t`склады успешно обновлены, новых складов добавлено: ` + countNewStocks)

        ws.send(t`Началось обновление брендов`)
        const countNewBrands = await updateBrands1c(productsData)
        ws.send(t`Бренды успешно обновлены, новых брендов добавлено: ` + countNewBrands)
        // ========================================================================

        // ============= Обновление данных о товарах (Products) ===================
        ws.send(t`Началось добавление новых номенклатурных позиций`)
        const newProductsCount = await updateProductsData(productsData)
        ws.send(t`Позиции успешно добавлены. Количество: ` + newProductsCount)
        // ========================================================================


        // ======== Обновление данных о партиях без остатков (Consignment) ========
        ws.send(t`Началось обновление партий`)
        const {deletedCount, insertedCount} = await updateConsignmentsData(remainsOfGoods, consignmentsData)
        ws.send(t`Партии успешно обновлены.\nКоличество новых партий: `
            + insertedCount
            + `\nКоличество удалённых с нулевым балансом: `
            + deletedCount)
        // ========================================================================

        // ========== Обновление данных о расположениях (Placement) ===============
        ws.send(t`Началось обновление остаточного баланса товаров и их размещения на складах`)
        await updatePlacementData(remainsOfGoods)
        ws.send(t`Обновление баланса успешно завершено`)
        // ========================================================================

        ws.send(t`Синхронизация продуктов успешно завершена!`)
    } catch (e) {
        log(e, "error")
        ws.send(t`Внутренняя ошибка сервера : ` + e.message)
        throw e
    }
}

// const syncCustomers1c = async (ws: WebSocket, {INN, companyName, personName}) => {
//     try {
//         ws.send(t`Началась синхронизация с сервером 1С`)
//         const {data} = await AxiosInstance.get<OneCCustomersResponse>(`${config.onecEndpoint}/customers`, {validateStatus: status => status < 400})
//         ws.send(t`Данные доставлены из 1С`)
//         ws.send(t`Начало обновления пользователей`)
//
//         const alreadyInDb = await Customer.find() as CustomerDocument[]
//         const notYetInDb: OneCCustomersResponse = []
//
//         for (const customer of data) {
//             if (alreadyInDb.every(a => customer.Ссылка != a.link1c)) {
//                 notYetInDb.push(customer)
//             } else {
//                 const c = await Customer.findOne({link1c: customer.Ссылка}) as CustomerDocument
//                 if (INN) c.inn = customer.ИНН
//                 if (companyName) c.fullName = customer.НаименованиеПолное
//                 if (personName) c.contactName = customer.КонтактноеЛицоНаименование
//                 await c.save()
//             }
//         }
//
//         await Customer.insertMany(notYetInDb.map((c) => ({
//             contactName: c.КонтактноеЛицоНаименование,
//             fullName: c.НаименованиеПолное,
//             inn: c.ИНН,
//             code1c: c.Код,
//             link1c: c.Ссылка
//         } as CustomerDocument)))
//
//         ws.send(t`Клиенты успешно обновлены`)
//         return
//     } catch (e) {
//         ws.send(t`Внутренняя ошибка сервера : ` + e.message)
//         return
//     }
// }

export const sync1cReducer: WebSocketReducer = async (action, socket) => {
    try {
        switch (action.type) {
            case "1C_SYNC_PRODUCTS": {
                await syncProducts1c(socket)
                break
            }
            // case "1C_SYNC_CUSTOMERS": {
            //     await syncCustomers1c(socket, action.payload)
            //     break
            // }
        }
    } catch (e) {
        log(e, "error")
        socket.send(t`Не удалось выполнить синхронизацию: ` + e.message + '\n' + e.stack)
        socket.close(1001)
        throw e
    }
}