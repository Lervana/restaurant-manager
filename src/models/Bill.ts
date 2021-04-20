import { Schema, model } from "mongoose";
import DishSchema from "./Dish";

const billSchema = new Schema({
  datetime: { type: Date, default: Date.now },
  duration: Number, //seconds
  content: [DishSchema],
  value_pln: Number,
  value_currency: Number,
  currency: String,
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

export default model("Bill", billSchema);
