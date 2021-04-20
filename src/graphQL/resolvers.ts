import { NonEmptyArray } from "type-graphql";

import { DishResolver } from "./dish/dish-resolver";

export const resolvers: NonEmptyArray<Function> = [DishResolver];
