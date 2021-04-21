import { Service } from "typedi";
import { DishInput } from "../graphQL/dish/dish-input";
import { Dish } from "../models";

@Service()
export default class DishService {
  async create(data: DishInput) {
    const dish = new Dish({
      category: data.category,
      name: data.name,
      description: data.description,
      price_pln: data.price,
    });

    try {
      return await dish.save();
    } catch (err) {
      if (err) {
        //TODO log err
        console.error(err);
        return {};
      }
    }
  }

  async getAll() {
    try {
      return Dish.find();
    } catch (err) {
      //TODO log err
      console.error(err);
      return [];
    }
  }
}
