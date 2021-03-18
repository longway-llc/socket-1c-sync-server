import mongoose, {Document, model} from "mongoose"
import {StockDocument} from "./Stock";

const Schema = mongoose.Schema;

export const placementSchema = new Schema({
    balance: Number,
    stock: {type: Schema.Types.ObjectId, ref: "Stock"}
})

export interface PlacementDocument extends Document {
    balance: number,
    stock: StockDocument['_id']
}

const Placement = model<PlacementDocument>('Placement', placementSchema, 'components_placement_placements')

export default Placement