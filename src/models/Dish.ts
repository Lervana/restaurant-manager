import { model, Schema } from "mongoose";

const dishSchema = new Schema({
  category: String,
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  description: String,
  price_pln: Number,
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

export default model("Dish", dishSchema);
