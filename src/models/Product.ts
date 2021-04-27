import mongoose, {Document, model, ObjectId} from "mongoose"
import {GroupDocument} from "./Group";
import {BrandDocument} from "./Brand";

const Schema = mongoose.Schema;

export const productScheme = new Schema({
    pn: String,
    uom: String,
    color: String,
    mfg: String,
    description_ru: String,
    description_en: String,
    longRead_ru: String,
    longRead_en: String,
    price_en: Number,
    price_ru: Number,
    photo: {type: Schema.Types.ObjectId, default: undefined},
    group: {type: Schema.Types.ObjectId, default: undefined, ref: "Group"},
    brand: {type: Schema.Types.ObjectId, default: undefined, ref: "Brand"},
    code_1c: String,
    code_1c_uom: String,
    created_by: {type: Schema.Types.ObjectId, default: null},
    updated_by: {type: Schema.Types.ObjectId, default: null},
    published_at: {type: Date, default: null},
    sync1cDisplay: {type: Boolean, default: true},
    deletedFromSearch: {type: Boolean, default: false}
}, {timestamps: true})

export interface ProductDocument extends Document {
    pn: string
    uom: string
    color: string
    mfg: string
    description_ru: string
    description_en: string
    longRead_ru: string
    longRead_en: string
    price_ru: number
    price_en: number
    photo: ObjectId | null
    group: GroupDocument['_id']
    brand: BrandDocument['_id']
    code_1c: string
    code_1c_uom: string
    unitDimension: string
    created_by: ObjectId | null
    updated_by: ObjectId | null
    createdAt: Date
    updatedAt: Date
    published_at: Date | null,
    sync1cDisplay: Boolean
    deletedFromSearch: Boolean
}


const Product = model<ProductDocument>('Product', productScheme, 'products')

export default Product