import { Resolver, Query } from "type-graphql";

@Resolver()
export class DishResolver {
  @Query(() => String)
  hello() {
    return "world";
  }
}
