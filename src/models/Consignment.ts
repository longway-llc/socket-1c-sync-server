import mongoose, {Document, model, ObjectId} from "mongoose"
import {PlacementDocument} from "./Placement";
import {ProductDocument} from "./Product";

const Schema = mongoose.Schema;

export const consignmentSchema = new Schema({
    product: {type: Schema.Types.ObjectId, ref:"Product"},
    code_1c: String,
    name: String,
    productionDate: {type: Date, default: null},
    validUntil: {type: Date, default: null},
    placements: [{
        kind: "ComponentPlacementPlacement",
        ref: {type: Schema.Types.ObjectId, ref: "Placement"}
    }],
    created_by: {type: Schema.Types.ObjectId, default: null},
    updated_by: {type: Schema.Types.ObjectId, default: null},
    published_at: {type: Date, default: null}
}, {timestamps: true})

export interface ConsignmentDocument extends Document {
    product: ProductDocument['_id']
    code_1c: string
    name: string
    productionDate: Date | null
    validUntil: Date | null
    placements: [{
        kind: "ComponentPlacementPlacement",
        ref: PlacementDocument['_id']
    }]
    created_by: ObjectId | null
    updated_by: ObjectId | null
    createdAt: Date | null
    updatedAt: Date | null
    published_at: Date | null
}

const Consignment = model<ConsignmentDocument>('Consignment', consignmentSchema, 'consignments')

export default Consignment