import mongoose, {Document, model, ObjectId} from "mongoose"
import {CategoryDocument} from "./Category";

const Schema = mongoose.Schema;

export const groupSchema = new Schema({
    name: String,
    category: {type: Schema.Types.ObjectId, ref:"Category", default: null},
    created_by: {type: Schema.Types.ObjectId, default: null},
    updated_by: {type: Schema.Types.ObjectId, default: null}
}, {timestamps: true})

export interface GroupDocument extends Document {
    name: string
    category: CategoryDocument['_id']
    created_by: ObjectId | null
    updated_by: ObjectId | null
    createdAt: Date
    updatedAt: Date
}

const Group = model<GroupDocument>('Group', groupSchema, 'groups')

export default Group