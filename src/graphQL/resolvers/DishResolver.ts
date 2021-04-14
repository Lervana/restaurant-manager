import { Resolver, Query } from "type-graphql";

@Resolver()
export class DishResolver {
  @Query(() => String)
  hello() {
    return "world";
  }
  @Query(() => String)
  hello2() {
    return "world";
  }
}
