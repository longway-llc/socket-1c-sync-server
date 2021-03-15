import mongoose, {Document, model, ObjectId} from "mongoose"
import {categorySchema} from "./Category";

const Schema = mongoose.Schema;

export const brandSchema = new Schema({
    name: String,
    photo: {type: Schema.Types.ObjectId, default: null},
    created_by: {type: Schema.Types.ObjectId, default: null},
    updated_by: {type: Schema.Types.ObjectId, default: null}
}, {timestamps: true})

export interface BrandDocument extends Document {
    name: string
    photo: ObjectId | null
    created_by: ObjectId | null
    updated_by: ObjectId | null
    createdAt: Date
    updatedAt: Date
}

const Brand = model<BrandDocument>('Brand', categorySchema, 'brands')

export default Brand