import { DishInput } from "../graphQL/dish/dish-input";
import { Dish } from "../models";

export default class DishService {
  async create(data: DishInput) {
    const dish = new Dish({
      category: data.category,
      name: data.name,
      description: data.description,
      price_pln: data.price_pln,
    });

    try {
      return await dish.save();
    } catch (err) {
      if (err) return console.error(err);
    }
  }
}
