import { Resolver, Arg, Mutation, Query } from "type-graphql";
import { Service } from "typedi";

import DishService from "../../services/DishService";
import { Dish } from "./dish-type";
import { DishInput } from "./dish-input";

@Service()
@Resolver((of) => Dish)
export class DishResolver {
  constructor(private dishService: DishService) {}

  @Query((returns) => [Dish])
  getDishes() {
    return this.dishService.getAll();
  }

  @Mutation((returns) => Dish)
  addDish(@Arg("dishData") dishData: DishInput): Promise<Dish> {
    return this.dishService.create(dishData);
  }
}
