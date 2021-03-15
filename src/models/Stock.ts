import mongoose, {Document, model, ObjectId} from "mongoose"

const Schema = mongoose.Schema;

export const stockSchema = new Schema({
    name: String,
    created_by: Schema.Types.ObjectId,
    updated_by: Schema.Types.ObjectId
}, {timestamps: true})

export interface StockDocument extends Document {
    name: number,
    created_by: ObjectId | null
    updated_by: ObjectId | null
    createdAt: Date
    updatedAt: Date
}

const Stock = model<StockDocument>('Stock', stockSchema, 'stocks')

export default Stock