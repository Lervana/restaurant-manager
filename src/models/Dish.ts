import { model, Schema } from "mongoose";

const dishSchema = new Schema({
  category: {
    type: String,
    trim: true,
    required: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  description: String,
  price_pln: {
    type: Number,
    required: true,
  },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

export default model("Dish", dishSchema);
