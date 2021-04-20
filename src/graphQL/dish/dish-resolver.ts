import { Resolver, Arg, Mutation, Query } from "type-graphql";

import DishService from "../../services/DishService";
import { Dish } from "./dish-type";
import { DishInput } from "./dish-input";

@Resolver((of) => Dish)
export class DishResolver {
  constructor(private dishService: DishService) {
    this.dishService = dishService;
  }

  @Query((returns) => Boolean)
  example() {
    return true;
  }

  @Mutation((returns) => Dish)
  addRecipe(@Arg("dishData") dishData: DishInput): Promise<Dish> {
    return this.dishService.create(dishData);
  }
}
