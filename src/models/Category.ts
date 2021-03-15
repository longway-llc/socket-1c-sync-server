import mongoose, {Document, model, ObjectId} from "mongoose"

const Schema = mongoose.Schema;

export const categorySchema = new Schema({
    name: String,
    created_by: {type: Schema.Types.ObjectId, default: null},
    updated_by: {type: Schema.Types.ObjectId, default: null}
}, {timestamps: true})

export interface CategoryDocument extends Document {
    name: string
    created_by: ObjectId | null
    updated_by: ObjectId | null
    createdAt: Date
    updatedAt: Date
}

const Category = model<CategoryDocument>('Category', categorySchema, 'categories')

export default Category