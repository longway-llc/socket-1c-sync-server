import mongoose, {Document, model, ObjectId} from "mongoose"

const Schema = mongoose.Schema;

export const placementSchema = new Schema({
    balance: Number,
    stock: {type: Schema.Types.ObjectId, ref: "Stock"}
})

export interface PlacementDocument extends Document {
    balance: number,
    stock: ObjectId | null
}

const Placement = model<PlacementDocument>('Placement', placementSchema, 'components_placement_placements')

export default Placement