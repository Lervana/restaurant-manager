import { model, Schema } from "mongoose";

import dishSchema from "./Dish";

const orderSchema = new Schema({
  datetime: { type: Date, default: Date.now },
  statuses: {
    created: { type: Date, default: Date.now },
    in_progress: Date,
    served: Date,
    closed: Date,
  },
  content: [dishSchema],
  table: Number,
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

export default model("Order", orderSchema);
